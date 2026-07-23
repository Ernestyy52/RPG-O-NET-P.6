import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const source = path.resolve('assets/generated/class-jobs/class-identity-alpha.png')
const outputDir = path.resolve('public/class-jobs')
const jobs = ['vanguard', 'arcanist', 'wind-ranger', 'aegis-acolyte']

await fs.mkdir(outputDir, { recursive: true })
const meta = await sharp(source).metadata()
if (!meta.width || !meta.height || meta.channels !== 4) throw new Error('Class identity source must be an RGBA image.')

const edges = [0, .25, .5, .75, 1].map((fraction) => Math.round(meta.width * fraction))
for (let index = 0; index < jobs.length; index++) {
  const left = edges[index]
  const width = edges[index + 1] - left
  const panel = await sharp(source)
    .extract({ left, top: 0, width, height: meta.height })
    .png()
    .toBuffer()
  await sharp(panel)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 5 })
    .resize(288, 360, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100, lossless: true })
    .toFile(path.join(outputDir, `${jobs[index]}.webp`))
}

await sharp(source)
  .resize(1200, 480, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 92, alphaQuality: 100, lossless: true })
  .toFile(path.join(outputDir, 'class-lineup.webp'))

await fs.writeFile(path.join(outputDir, '_manifest.json'), JSON.stringify({
  source: 'assets/generated/class-jobs/class-identity-alpha.png',
  generatedAt: new Date().toISOString(),
  classes: jobs,
  format: 'RGBA WebP',
}, null, 2))

console.log(`Built ${jobs.length} class portraits and lineup in ${outputDir}`)
