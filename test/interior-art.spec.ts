import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { TOWN_INTERIORS } from '~/data/town/interiors'

const PUBLIC = resolve(__dirname, '../public')

describe('Aethergate playable interior art', () => {
  it('ships one standalone 1:1 map per service building at the declared size', async () => {
    for (const spec of TOWN_INTERIORS) {
      expect(spec.art.sprite.startsWith('/')).toBe(false)
      const file = resolve(PUBLIC, spec.art.sprite)
      expect(existsSync(file), spec.art.sprite).toBe(true)
      const metadata = await sharp(file).metadata()
      expect([metadata.width, metadata.height], spec.id).toEqual([spec.art.width, spec.art.height])
    }
  })

  it('keeps collision, occluders, spawn and exit inside each image', () => {
    for (const spec of TOWN_INTERIORS) {
      const { width, height, collision, occluders, spawn, exit } = spec.art
      const pointInside = ([px, py]: [number, number], [x, y, w, h]: [number, number, number, number]) =>
        px >= x && px <= x + w && py >= y && py <= y + h
      for (const [label, point] of [['spawn', spawn], ['exit', exit]] as const) {
        expect(point[0], `${spec.id} ${label} x`).toBeGreaterThanOrEqual(0)
        expect(point[0], `${spec.id} ${label} x`).toBeLessThan(width)
        expect(point[1], `${spec.id} ${label} y`).toBeGreaterThanOrEqual(0)
        expect(point[1], `${spec.id} ${label} y`).toBeLessThan(height)
        expect(collision.some((rect) => pointInside(point, rect)), `${spec.id} ${label} blocked`).toBe(false)
      }
      for (const [x, y, w, h] of [...collision, ...occluders]) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(w).toBeGreaterThan(0)
        expect(h).toBeGreaterThan(0)
        expect(x + w, `${spec.id} rect x overflow`).toBeLessThanOrEqual(width)
        expect(y + h, `${spec.id} rect y overflow`).toBeLessThanOrEqual(height)
      }
    }
  })
})
