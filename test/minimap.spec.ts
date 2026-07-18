import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  tileRect, rectsFromWallGrid, borderRects, minimapScale,
  MinimapTicker, MINIMAP_TICK_MS,
} from '~/game/systems/minimap'
import { gameEvents } from '~/game/systems/eventBus'

describe('minimap helpers', () => {
  it('tileRect maps a tile cell to world px', () => {
    expect(tileRect(3, 2, 32)).toEqual({ x: 96, y: 64, w: 32, h: 32 })
  })

  it('rectsFromWallGrid merges horizontal runs and skips walkable cells', () => {
    const grid: (number | null)[][] = [
      [0, 0, 0],
      [null, 0, null],
      [0, null, 0],
    ]
    const rects = rectsFromWallGrid(grid, 10)
    expect(rects).toEqual([
      { x: 0, y: 0, w: 30, h: 10 },   // full top run merged into one rect
      { x: 10, y: 10, w: 10, h: 10 },
      { x: 0, y: 20, w: 10, h: 10 },
      { x: 20, y: 20, w: 10, h: 10 },
    ])
  })

  it('borderRects covers the ring without double-counting corners', () => {
    const rects = borderRects(4, 3, 10)
    const area = rects.reduce((sum, r) => sum + r.w * r.h, 0)
    // ring ของ 4x3 = ทั้งหมด 12 - ข้างใน 2x1 = 10 cells (cell ละ 100 px²)
    expect(area).toBe(1000)
  })

  it('minimapScale contains the world in the box preserving aspect', () => {
    expect(minimapScale(200, 100, 100, 100)).toBe(0.5)
    expect(minimapScale(100, 200, 100, 100)).toBe(0.5)
    expect(minimapScale(0, 0, 100, 100)).toBe(1) // degenerate world — no divide-by-zero
  })

  describe('MinimapTicker throttle', () => {
    beforeEach(() => gameEvents.all.clear())

    it('emits at most once per tick window', () => {
      const seen: unknown[] = []
      gameEvents.on('minimap:tick', (p) => seen.push(p))
      const ticker = new MinimapTicker()
      ticker.tick(0, { player: { x: 1, y: 1 } })
      ticker.tick(MINIMAP_TICK_MS - 1, { player: { x: 2, y: 2 } })  // ยังไม่ครบรอบ — ต้องเงียบ
      ticker.tick(MINIMAP_TICK_MS + 1, { player: { x: 3, y: 3 } })
      expect(seen).toHaveLength(2)
      expect((seen[1] as { player: { x: number } }).player.x).toBe(3)
    })
  })
})
