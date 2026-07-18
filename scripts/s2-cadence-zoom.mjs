// S2 evidence helper: magnify the hero region of the cadence crops 4× (nearest neighbor) and
// montage P0/P1/P2 side by side per direction, so the pixel-cadence judgment in
// MAP_SCALE_DECISION §S2 is made on visible pixels, not impressions.
// Usage: node scripts/s2-cadence-zoom.mjs   (after playtest-scale-lab-s2.mjs)
import sharp from 'sharp'
import { join } from 'node:path'

const DIR = join('.playtest', 's2-hero')
const PROFILES = ['P0', 'P1', 'P2']
const DIRS = ['E', 'S', 'N']
// hero foot anchor sits at crop center (100,120) of the 200×240 crop; box covers the full body
const BOX = { left: 68, top: 36, width: 64, height: 96 }
const Z = 4

for (const d of DIRS) {
  const panels = []
  for (const p of PROFILES) {
    const buf = await sharp(join(DIR, `desktop-1280x800-${p}-cadence-${d}.png`))
      .extract(BOX)
      .resize(BOX.width * Z, BOX.height * Z, { kernel: 'nearest' })
      .png()
      .toBuffer()
    panels.push(buf)
  }
  const gap = 12
  const w = BOX.width * Z
  const h = BOX.height * Z
  await sharp({ create: { width: w * 3 + gap * 2, height: h, channels: 4, background: { r: 20, g: 16, b: 10, alpha: 1 } } })
    .composite(panels.map((input, i) => ({ input, left: i * (w + gap), top: 0 })))
    .png()
    .toFile(join(DIR, `compare-${d}-P0-P1-P2-4x.png`))
  console.log(`compare-${d}-P0-P1-P2-4x.png written`)
}
