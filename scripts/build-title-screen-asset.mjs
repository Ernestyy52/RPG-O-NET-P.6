import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'assets/generated/title-screen/title-background-v2.png')
const output = resolve(root, 'public/branding/title-background-v2.webp')

await mkdir(dirname(output), { recursive: true })

const result = await sharp(source)
  .resize({ width: 1920, height: 1080, fit: 'cover', position: 'centre', withoutEnlargement: true })
  .webp({ quality: 88, effort: 5, smartSubsample: true })
  .toFile(output)

await writeFile(resolve(root, 'public/branding/_title-screen-manifest.json'), `${JSON.stringify({
  source: 'assets/generated/title-screen/title-background-v2.png',
  runtime: 'branding/title-background-v2.webp',
  width: result.width,
  height: result.height,
  format: result.format,
  provenance: 'Project-owned OpenAI-generated edit of the existing SPIRAL\'S ECHO key art; text removed for a responsive HTML logo layer.',
}, null, 2)}\n`)

console.log(`Built ${result.width}x${result.height} ${result.format} title background at ${output}`)
