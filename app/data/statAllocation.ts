// ================================================================================================
// Stat allocation — RO-inspired manual attribute points (ORIGINAL curve/effects, no copied formula)
//
// ทุกเลเวลได้ STAT_POINTS_PER_LEVEL แต้ม เอาไปกดใส่ 6 attribute ในหน้า Status เอง (กลิ่นอาย RO:
// ตัวเลขโตเพราะ "เราเลือก" ไม่ใช่โตเองอย่างเดียว) — โบนัสบวกทับ class growth เดิม ไม่แทนที่
// (คลาสยังคงอัตลักษณ์; แต้มคือความเป็นเจ้าของบิลด์) ค่าใช้จ่ายแพงขึ้นทีละขั้นทุก 10 แต้มที่ลง
// ใน attribute เดียวกัน — สูตรของเราเอง เพื่อกันการเทค่าเดียวสุดทางแบบไร้ราคา
//
// Pure module: ห้าม import Phaser/store — ใช้ร่วมกันได้ทั้ง store, UI และ unit test
// ================================================================================================

export const STAT_ALLOC_ENABLED = true

export const STAT_POINTS_PER_LEVEL = 3

/** attribute ที่กดได้ + ผลต่อ stat จริงของเกม (คีย์ของ addStats ใน player store) */
export const ALLOC_DEFS = [
  { key: 'vit', label: 'VIT', desc: '+6 Max HP ต่อแต้ม — ความอึด', stat: 'hp', perPoint: 6 },
  { key: 'atk', label: 'ATK', desc: '+1 Attack ต่อแต้ม — สายบู๊', stat: 'atk', perPoint: 1 },
  { key: 'def', label: 'DEF', desc: '+1 Defense ต่อแต้ม — สายถึก', stat: 'def', perPoint: 1 },
  { key: 'mag', label: 'MAG', desc: '+1 Magic ต่อแต้ม — สายเวท (MP โตตาม)', stat: 'mag', perPoint: 1 },
  { key: 'spd', label: 'SPD', desc: '+1 Speed ต่อแต้ม — ความไว', stat: 'speed', perPoint: 1 },
  { key: 'wis', label: 'WIS', desc: '+1 Knowledge ต่อแต้ม — โบนัสฝั่งการเรียน', stat: 'knowledge', perPoint: 1 },
] as const

export type AllocKey = typeof ALLOC_DEFS[number]['key']
export type StatAlloc = Partial<Record<AllocKey, number>>

const KEYS = new Set<string>(ALLOC_DEFS.map((d) => d.key))

/** แต้มสะสมทั้งหมดที่ "ควรมี" ณ เลเวลนี้ (deterministic จากเลเวล — ไม่มีทางหาย/เฟ้อ) */
export function statPointsEarned(level: number): number {
  return Math.max(0, Math.floor(level) - 1) * STAT_POINTS_PER_LEVEL
}

/** ราคาแต้มถัดไปเมื่อลงไปแล้ว n แต้มใน attribute เดียวกัน: 1 → 2 (ที่ 10) → 3 (ที่ 20) ... */
export function allocCost(current: number): number {
  return 1 + Math.floor(Math.max(0, current) / 10)
}

function costUpTo(n: number): number {
  let total = 0
  for (let i = 0; i < n; i++) total += allocCost(i)
  return total
}

/** แต้มที่ถูกใช้ไปแล้วทั้งหมดตามตาราง (นับจากจำนวนที่ลงจริง — ไม่เก็บ state ซ้ำซ้อน) */
export function statPointsSpent(alloc: StatAlloc): number {
  let total = 0
  for (const def of ALLOC_DEFS) total += costUpTo(alloc[def.key] ?? 0)
  return total
}

export function statPointsAvailable(level: number, alloc: StatAlloc): number {
  return statPointsEarned(level) - statPointsSpent(alloc)
}

export function canAllocate(level: number, alloc: StatAlloc, key: AllocKey): boolean {
  return statPointsAvailable(level, alloc) >= allocCost(alloc[key] ?? 0)
}

/** โบนัส stat รวมจากแต้มที่ลง — รูปแบบเดียวกับ addStats ใน player store */
export function allocBonus(alloc: StatAlloc): Record<string, number> {
  const out: Record<string, number> = {}
  for (const def of ALLOC_DEFS) {
    const n = alloc[def.key] ?? 0
    if (n > 0) out[def.stat] = (out[def.stat] ?? 0) + n * def.perPoint
  }
  return out
}

/** ทำความสะอาดค่าโหลดจากเซฟ: จำนวนเต็ม ≥0 เท่านั้น คีย์แปลกปลอมถูกทิ้ง; ถ้าใช้แต้มเกินที่เลเวล
 *  ให้สิทธิ์ (เซฟ corrupt/ปรับสูตร) → รีเซ็ตเป็นศูนย์ทั้งชุด แล้วให้ผู้เล่นกดใหม่ (ไม่มีทางติดลบ) */
export function sanitizeAlloc(raw: unknown, level: number): StatAlloc {
  const out: StatAlloc = {}
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!KEYS.has(k)) continue
      const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0
      if (n > 0) out[k as AllocKey] = n
    }
  }
  return statPointsSpent(out) > statPointsEarned(level) ? {} : out
}
