import { describe, it, expect } from 'vitest'
import { readFileSync, openSync, readSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Atlas truth (Master Plan Phase 3 Batch A): hero-atlas ต้องครบทุก class×gender×direction×frame
// เฟรมต้องอยู่ในขอบ PNG จริง และ manifest ขนาดเฟรมต้องสอดคล้องกับ atlas

const atlasJsonPath = fileURLToPath(new URL('../public/character-sprites/hero-atlas.json', import.meta.url))
const atlasPngPath = fileURLToPath(new URL('../public/character-sprites/hero-atlas.png', import.meta.url))
const manifestPath = fileURLToPath(new URL('../public/character-sprites/_atlas_manifest.json', import.meta.url))

type AtlasFrame = { frame: { x: number; y: number; w: number; h: number } }
const atlas = JSON.parse(readFileSync(atlasJsonPath, 'utf8')) as { frames: Record<string, AtlasFrame> }
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { fw: number; fh: number }>

function pngDims(file: string): [number, number] {
  const fd = openSync(file, 'r')
  const buf = Buffer.alloc(24)
  readSync(fd, buf, 0, 24, 0)
  closeSync(fd)
  expect(buf.readUInt32BE(0)).toBe(0x89504e47) // PNG signature
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

const CLASSES = ['warrior', 'archer', 'mage', 'guardian']
const GENDERS = ['male', 'female']
const DIRS = ['down', 'left', 'right', 'up']
const FRAMES = [0, 1, 2]

describe('hero-atlas truth', () => {
  const [pngW, pngH] = pngDims(atlasPngPath)

  it('has every class×gender×direction×frame (96 frames)', () => {
    for (const c of CLASSES) for (const g of GENDERS) for (const d of DIRS) for (const f of FRAMES) {
      expect(atlas.frames[`${c}_${g}_${d}_${f}`], `${c}_${g}_${d}_${f}`).toBeDefined()
    }
    expect(Object.keys(atlas.frames)).toHaveLength(96)
  })

  it('every frame lies inside the PNG bounds with positive size', () => {
    for (const [name, { frame }] of Object.entries(atlas.frames)) {
      expect(frame.w, name).toBeGreaterThan(0)
      expect(frame.h, name).toBeGreaterThan(0)
      expect(frame.x + frame.w, name).toBeLessThanOrEqual(pngW)
      expect(frame.y + frame.h, name).toBeLessThanOrEqual(pngH)
    }
  })

  it('manifest frame sizes match the atlas frames of each sheet', () => {
    for (const [sheet, { fw, fh }] of Object.entries(manifest)) {
      const f = atlas.frames[`${sheet}_down_0`]
      expect(f, sheet).toBeDefined()
      expect(f!.frame.w, `${sheet} width`).toBe(fw)
      expect(f!.frame.h, `${sheet} height`).toBe(fh)
    }
  })

  it('frames within a sheet share identical dimensions (animation alignment)', () => {
    for (const c of CLASSES) for (const g of GENDERS) {
      const base = atlas.frames[`${c}_${g}_down_0`]!.frame
      for (const d of DIRS) for (const f of FRAMES) {
        const fr = atlas.frames[`${c}_${g}_${d}_${f}`]!.frame
        expect(fr.w, `${c}_${g}_${d}_${f} width`).toBe(base.w)
        expect(fr.h, `${c}_${g}_${d}_${f} height`).toBe(base.h)
      }
    }
  })
})
