import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const sourceDir = resolve(root, 'assets/generated/paperdoll-animation-sources')
const outDir = resolve(root, 'public/paperdoll/animated')
const families = ['robe', 'leather', 'chain', 'plate', 'dragon']
const frameWidth = 64
const frameHeight = 96
const columns = 3
const rows = 4

await mkdir(outDir, { recursive: true })

for (const family of families) {
  const source = resolve(sourceDir, `${family}-sheet-alpha.png`)
  const metadata = await sharp(source).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${source}`)
  const frames = []

  for (let row = 0; row < rows; row++) {
    const top = Math.round((row * metadata.height) / rows)
    const bottom = Math.round(((row + 1) * metadata.height) / rows)
    for (let column = 0; column < columns; column++) {
      const left = Math.round((column * metadata.width) / columns)
      const right = Math.round(((column + 1) * metadata.width) / columns)
      const cell = await sharp(source)
        .extract({ left, top, width: right - left, height: bottom - top })
        .png()
        .toBuffer()
      const trimmed = await sharp(cell)
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize({ width: 58, height: 86, fit: 'inside', kernel: 'nearest' })
        .png()
        .toBuffer()
      const frameMeta = await sharp(trimmed).metadata()
      const frame = await sharp({
        create: { width: frameWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).composite([{
        input: trimmed,
        left: Math.max(0, Math.floor((frameWidth - (frameMeta.width ?? frameWidth)) / 2)),
        top: Math.max(0, 92 - (frameMeta.height ?? frameHeight)),
      }]).png().toBuffer()
      frames.push({ input: frame, left: column * frameWidth, top: row * frameHeight })
    }
  }

  await sharp({
    create: {
      width: frameWidth * columns,
      height: frameHeight * rows,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(frames)
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(outDir, `outfit-${family}-sheet.png`))
}

await writeFile(resolve(outDir, '_manifest.json'), `${JSON.stringify({
  generatedWith: 'OpenAI image generation',
  license: 'project-owned generated assets',
  frameSize: [frameWidth, frameHeight],
  layout: {
    columns: ['idle', 'step-left', 'step-right'],
    rows: ['down', 'left', 'right', 'up'],
  },
  families: families.map((family) => ({
    family,
    source: `assets/generated/paperdoll-animation-sources/${family}-sheet-source.png`,
    file: `paperdoll/animated/outfit-${family}-sheet.png`,
  })),
}, null, 2)}\n`, 'utf8')

console.log(`Built ${families.length} directional paper-doll sheets in ${outDir}`)
