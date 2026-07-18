// ================================================================================================
// SCALE CONTRACT — ค่ากลางหนึ่งเดียวของ world scale / ตัวละคร / กล้อง (S4)
//
// ที่มา: SCALE GATE PASSED 2026-07-18 (docs/MAP_SCALE_DECISION.md §S0–S3 — contract C 93/100)
//   - Grid: TILE 32 world px (source art 16px, integer 2× เท่านั้น — ห้าม fractional)
//   - Actor: hero สูง 48px (= 96px source × 0.5), collider 18×12 ที่เท้า เท่ากันทุกคลาส
//   - View: desktop 800×600 zoom 1 (V1 — เห็นโลก +25%/แกน), mobile portrait 480×640 zoom 1
//     (MA-lite — hero บนจอ ~39px ≥ เกณฑ์ 28px), 640×480 = ค่า fallback เดิม; zoom 1.25 เป็นได้แค่
//     ตัวเลือก accessibility (opt-in) เพราะทำ tile หลุด integer (2.5×)
//   - Speed: เมือง 130 px/s, สนาม/ดันเจี้ยน/บอส/interior 120 px/s; แนวทแยง normalize (√2/2)
//     — ปิดหนี้ S0 #4 (เดิมทแยงเร็ว √2×)
//
// กติกา: ห้าม scene ไหน hardcode ค่าซ้ำ — import จากที่นี่เท่านั้น; เปลี่ยนค่า = เปลี่ยนที่นี่
// พร้อมหลักฐาน scale lab ใหม่; โมดูลนี้ pure (ห้าม import Phaser) เพื่อให้ unit test ได้ตรงๆ
// ================================================================================================

export const TILE_SIZE = 32
export const SOURCE_TILE = 16

// ---- Actor ----
export const HERO_VISUAL_H = 48
export const PLAYER_BODY_WIDTH = 18
export const PLAYER_BODY_HEIGHT = 12
/** ระยะยกก้นกล่องชนจากขอบล่างเฟรม (world px) — เดิมของ applyStandardHeroBody */
export const PLAYER_FEET_OFFSET = 3

// ---- Speeds (px/s) ----
export const TOWN_SPEED = 130
export const FIELD_SPEED = 120
/** ตัวคูณความเร็วตอนกดสองแกนพร้อมกัน — ระยะทางต่อวินาทีเท่าเดินตรงเสมอ (แฟร์ต่อ route/kiting) */
export const DIAGONAL_FACTOR = Math.SQRT1_2

// ---- Camera / internal viewport (Scale.FIT, zoom 1 เสมอ — ความคมมาจาก integer scale) ----
export interface ViewportSize { width: number; height: number }
export const DESKTOP_VIEWPORT: ViewportSize = { width: 800, height: 600 }
export const MOBILE_PORTRAIT_VIEWPORT: ViewportSize = { width: 480, height: 640 }
export const LEGACY_VIEWPORT: ViewportSize = { width: 640, height: 480 }
/** breakpoint เดียวกับ CSS ของหน้าเกม (`max-[560px]`) — สองฝั่งต้องสลับพร้อมกันเสมอ */
export const MOBILE_BREAKPOINT_PX = 560

/** เลือก internal viewport จากความกว้าง container จริงตอน boot (จอแคบแนวตั้ง = มือถือ) */
export function chooseViewport(containerW: number): ViewportSize {
  return containerW > 0 && containerW <= MOBILE_BREAKPOINT_PX ? MOBILE_PORTRAIT_VIEWPORT : DESKTOP_VIEWPORT
}

/** กรอบ camera bounds ที่ "กึ่งกลางโลกที่เล็กกว่าจอ" — ปิดหนี้ S0 #2 (interior letterbox ชิดซ้ายบน):
 *  แกนที่โลกใหญ่กว่าจอ clamp ตามปกติ; แกนที่โลกเล็กกว่าจอ ขยาย bounds สมมาตรให้ภาพอยู่กลาง */
export function centeredCameraBounds(worldW: number, worldH: number, viewW: number, viewH: number): { x: number; y: number; width: number; height: number } {
  const x = worldW >= viewW ? 0 : -(viewW - worldW) / 2
  const y = worldH >= viewH ? 0 : -(viewH - worldH) / 2
  return { x, y, width: Math.max(worldW, viewW), height: Math.max(worldH, viewH) }
}
