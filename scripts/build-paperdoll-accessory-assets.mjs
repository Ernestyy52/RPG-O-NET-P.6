import sharp from 'sharp'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const sourceDir = resolve(root, 'assets/generated/paperdoll-accessory-sources')
const outDir = resolve(root, 'public/paperdoll/accessories')
const frameWidth = 64
const frameHeight = 96
const columns = 3
const rows = 4

await mkdir(outDir, { recursive: true })

const names = (await readdir(sourceDir))
  .filter((name) => name.endsWith('-source.png'))
  .map((name) => name.replace('-source.png', ''))
  .sort()

function limitsFor(name) {
  if (name.startsWith('head-')) return { width: 40, height: 34 }
  if (name.startsWith('shield-')) return { width: 32, height: 36 }
  if (['weapon-greatsword', 'weapon-spear', 'weapon-staff', 'weapon-scythe'].includes(name)) return { width: 56, height: 76 }
  if (name === 'weapon-bow') return { width: 42, height: 64 }
  if (name === 'weapon-crossbow') return { width: 40, height: 46 }
  if (['weapon-dagger', 'weapon-wand'].includes(name)) return { width: 34, height: 42 }
  return { width: 44, height: 60 }
}

function anchorFor(name, row, column) {
  const bob = [0, 1, -1][column]
  if (name.startsWith('head-')) return { x: 32, y: 22 + bob }
  if (name.startsWith('shield-')) {
    const points = [{ x: 18, y: 54 }, { x: 44, y: 52 }, { x: 20, y: 52 }, { x: 46, y: 50 }]
    return { x: points[row].x, y: points[row].y + bob }
  }
  const points = [{ x: 48, y: 55 }, { x: 18, y: 53 }, { x: 46, y: 53 }, { x: 18, y: 51 }]
  return { x: points[row].x, y: points[row].y + bob }
}

async function chromaToAlpha(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (g > 145 && g > r * 1.65 && g > b * 1.65) {
      data[i + 3] = 0
    }
  }
  return sharp(data, { raw: info }).png().toBuffer()
}

for (const name of names) {
  const sourcePath = resolve(sourceDir, `${name}-source.png`)
  const metadata = await sharp(sourcePath).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${sourcePath}`)
  const frames = []
  for (let row = 0; row < rows; row++) {
    const top = Math.round((row * metadata.height) / rows)
    const bottom = Math.round(((row + 1) * metadata.height) / rows)
    for (let column = 0; column < columns; column++) {
      const left = Math.round((column * metadata.width) / columns)
      const right = Math.round(((column + 1) * metadata.width) / columns)
      const extracted = await sharp(sourcePath)
        .extract({ left, top, width: right - left, height: bottom - top })
        .png()
        .toBuffer()
      const transparent = await chromaToAlpha(extracted)
      const trimmed = await sharp(transparent)
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
        .resize({ ...limitsFor(name), fit: 'inside', kernel: 'nearest' })
        .png()
        .toBuffer()
      const frameMeta = await sharp(trimmed).metadata()
      const anchor = anchorFor(name, row, column)
      const itemW = frameMeta.width ?? 1
      const itemH = frameMeta.height ?? 1
      const frame = await sharp({
        create: { width: frameWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).composite([{
        input: trimmed,
        left: Math.max(0, Math.min(frameWidth - itemW, Math.round(anchor.x - itemW / 2))),
        top: Math.max(0, Math.min(frameHeight - itemH, Math.round(anchor.y - itemH / 2))),
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
  }).composite(frames).png({ compressionLevel: 9, palette: true }).toFile(resolve(outDir, `${name}-sheet.png`))
}

await writeFile(resolve(outDir, '_manifest.json'), `${JSON.stringify({
  generatedWith: 'OpenAI image generation; mechanically chroma-keyed and aligned with Sharp',
  license: 'project-owned generated assets',
  frameSize: [frameWidth, frameHeight],
  layout: { columns: ['neutral', 'left-step', 'right-step'], rows: ['down', 'left', 'right', 'up'] },
  files: names.map((name) => ({
    id: name,
    source: `assets/generated/paperdoll-accessory-sources/${name}-source.png`,
    runtime: `paperdoll/accessories/${name}-sheet.png`,
  })),
}, null, 2)}\n`, 'utf8')

console.log(`Built ${names.length} directional accessory sheets in ${outDir}`)
