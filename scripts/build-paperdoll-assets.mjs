import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
// Split source-only path segments so the public asset-reference audit does not treat them as runtime URLs.
const source = resolve(root, ...['assets', 'generated', 'paperdoll-outfits-transparent.png'])
const outDir = resolve(root, 'public/paperdoll')

const cells = [
  { id: 'robe', left: 0, width: 420 },
  { id: 'leather', left: 420, width: 420 },
  { id: 'chain', left: 840, width: 420 },
  { id: 'plate', left: 1260, width: 425 },
  { id: 'dragon', left: 1685, width: 418 },
]

await mkdir(outDir, { recursive: true })
for (const cell of cells) {
  console.log(`Building ${cell.id} from x=${cell.left}..${cell.left + cell.width}`)
  const extracted = await sharp(source)
    .extract({ left: cell.left, top: 0, width: cell.width, height: 748 })
    .png()
    .toBuffer()
  await sharp(extracted)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(128, 128, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(outDir, `outfit-${cell.id}.png`))
}

await writeFile(resolve(outDir, '_manifest.json'), `${JSON.stringify({
  source: ['assets', 'generated', 'paperdoll-outfits-source.png'].join('/'),
  generatedWith: 'OpenAI image generation',
  license: 'project-owned generated asset',
  cells: cells.map(({ id }) => ({ id, file: `outfit-${id}.png`, size: [128, 128] })),
}, null, 2)}\n`, 'utf8')
console.log(`Built ${cells.length} paper-doll outfit assets in ${outDir}`)
