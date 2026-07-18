// ================================================================================================
// Minimap publisher (Phase 2 architecture)
//
// ฉาก Phaser เป็นผู้รู้ layout — ฝั่ง Vue (GameMinimap.vue) เป็นผู้วาด สื่อสารทางเดียวผ่าน eventBus:
//   create()   → publishMinimapLayout(...)   (กำแพง/marker เป็น world-px)
//   update()   → MinimapTicker.tick(...)     (ตำแหน่งผู้เล่น/มอนสเตอร์ throttle ~7Hz)
//   shutdown   → clearMinimap()
//
// helper เป็น pure function (ไม่มี Phaser import) — unit test ได้ตรงๆ (test/minimap.spec.ts)
// เปลี่ยนแมพครั้งใหญ่ (mockup ใหม่) = เปลี่ยนสิ่งที่ฉาก publish เท่านั้น ตัววาดไม่ต้องแก้
// ================================================================================================
import { gameEvents, type MinimapLayout, type MinimapTick } from './eventBus'

export interface PxRect { x: number; y: number; w: number; h: number }

/** แปลง tile cell เดี่ยว → กล่อง world-px */
export function tileRect(tx: number, ty: number, tile: number): PxRect {
  return { x: tx * tile, y: ty * tile, w: tile, h: tile }
}

/**
 * แปลง wall grid (null = เดินได้) → กล่อง world-px แบบรวมแนวนอน (merge run ต่อเนื่องในแถวเดียว)
 * ลดจำนวน rect ที่ต้องวาดต่อเฟรมโดยไม่เสียรูปทรง
 */
export function rectsFromWallGrid(grid: (number | null)[][], tile: number): PxRect[] {
  const rects: PxRect[] = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!
    let runStart = -1
    for (let x = 0; x <= row.length; x++) {
      const solid = x < row.length && row[x] !== null
      if (solid && runStart < 0) runStart = x
      if (!solid && runStart >= 0) {
        rects.push({ x: runStart * tile, y: y * tile, w: (x - runStart) * tile, h: tile })
        runStart = -1
      }
    }
  }
  return rects
}

/** กรอบกำแพงรอบนอก (border ring) เป็น 4 กล่อง — ฉากที่ใช้กำแพงขอบมาตรฐาน */
export function borderRects(cols: number, rows: number, tile: number): PxRect[] {
  return [
    { x: 0, y: 0, w: cols * tile, h: tile },
    { x: 0, y: (rows - 1) * tile, w: cols * tile, h: tile },
    { x: 0, y: tile, w: tile, h: (rows - 2) * tile },
    { x: (cols - 1) * tile, y: tile, w: tile, h: (rows - 2) * tile },
  ]
}

/** สเกล world → กล่อง minimap (contain, ไม่ยืดสัดส่วน) */
export function minimapScale(worldW: number, worldH: number, boxW: number, boxH: number): number {
  if (worldW <= 0 || worldH <= 0) return 1
  return Math.min(boxW / worldW, boxH / worldH)
}

export function publishMinimapLayout(layout: MinimapLayout): void {
  gameEvents.emit('minimap:layout', layout)
}

export function clearMinimap(): void {
  gameEvents.emit('minimap:clear')
}

export const MINIMAP_TICK_MS = 140

/** Throttled position publisher — เรียกจาก scene.update ได้ทุกเฟรม จะ emit จริงตามรอบเท่านั้น */
export class MinimapTicker {
  // -Infinity: tick แรก emit เสมอ (scene clock เริ่มใกล้ 0 — ถ้าเริ่มที่ 0 เฟรมแรกจะถูกกลืน)
  private lastEmit = Number.NEGATIVE_INFINITY

  tick(nowMs: number, payload: MinimapTick): void {
    if (nowMs - this.lastEmit < MINIMAP_TICK_MS) return
    this.lastEmit = nowMs
    gameEvents.emit('minimap:tick', payload)
  }
}
