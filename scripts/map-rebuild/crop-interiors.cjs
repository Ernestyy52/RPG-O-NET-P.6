#!/usr/bin/env node
/*
 * Crop the four shipping service interiors from the approved Aethergate core-interiors board.
 *
 * The contact sheet remains a design/source artifact under docs/. Production loads only these
 * standalone rooms, so entering a shop never downloads the other unused panels. Crops are 1:1
 * nearest-neighbour pixels: no resampling, recolouring, or model-authored additions.
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '../..')
const SOURCE = path.join(ROOT, 'docs/mockups/region-01-everbloom/aethergate-town/aethergate-interiors-core.png')
const OUTPUT_DIR = path.join(ROOT, 'public/interior-maps')
const MANIFEST = path.join(ROOT, 'docs/map-rebuild/interior-asset-manifest.json')

const rooms = [
  { id: 'guild', left: 10, top: 8, width: 494, height: 470 },
  { id: 'hospital', left: 523, top: 8, width: 495, height: 479 },
  { id: 'item-shop', left: 1037, top: 8, width: 490, height: 479 },
  { id: 'equipment-shop', left: 10, top: 508, width: 494, height: 504 },
]

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const outputs = []

  for (const room of rooms) {
    const outputFile = path.join(OUTPUT_DIR, `${room.id}.png`)
    await sharp(SOURCE).extract({ left: room.left, top: room.top, width: room.width, height: room.height }).png().toFile(outputFile)
    const bytes = fs.readFileSync(outputFile)
    outputs.push({
      id: room.id,
      sourceFile: path.relative(ROOT, SOURCE).replaceAll('\\', '/'),
      outputFile: path.relative(ROOT, outputFile).replaceAll('\\', '/'),
      crop: [room.left, room.top, room.width, room.height],
      outputSize: [room.width, room.height],
      transform: '1:1 crop; no resampling',
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    })
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify({ generatedBy: 'scripts/map-rebuild/crop-interiors.cjs', rooms: outputs }, null, 2)}\n`)
  console.log(`Wrote ${outputs.length} interior maps and ${path.relative(ROOT, MANIFEST)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
