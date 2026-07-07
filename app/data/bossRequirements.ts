import { bossKeyItemId, bossKeyItemName } from './loot'

export interface BossRequirement {
  level: number
  correctAnswers: number
  keyItem?: { id: string; name: string; qty: number }
}

// เงื่อนไขปลดล็อกห้องบอส "ทุกชั้น" (ไม่ใช่แค่ทุก 10 ชั้น)
// - ชั้นทั่วไป: เช็คเลเวล + จำนวนคำถามที่ตอบถูกสะสม (ปลดล็อกได้ด้วยการฟาร์มมอนสเตอร์ในชั้น)
// - ชั้น milestone (ทุกๆ 10 ชั้น: บอสประจำโลก): เพิ่มเงื่อนไขเก็บเศษกุญแจที่ดรอปจากมอนสเตอร์โลกนั้น
export function getBossRequirement(floor: number): BossRequirement {
  const milestone = floor % 10 === 0
  const world = Math.max(1, Math.ceil(floor / 10))
  const base: BossRequirement = {
    level: Math.max(1, Math.ceil(floor / 2)),
    correctAnswers: floor * 3,
  }
  if (!milestone) return base
  const qty = 3 + Math.max(0, world - 1) * 2
  return {
    ...base,
    level: base.level + 2,
    keyItem: { id: bossKeyItemId(world), name: bossKeyItemName(world), qty },
  }
}

export function describeMissingRequirements(
  req: BossRequirement,
  player: { level: number; correctAnswers: number; inventory: Record<string, number> },
): string[] {
  const missing: string[] = []
  if (player.level < req.level) missing.push(`Level ${req.level}+ (current ${player.level})`)
  if (player.correctAnswers < req.correctAnswers) missing.push(`${req.correctAnswers} correct answers total (current ${player.correctAnswers})`)
  if (req.keyItem) {
    const have = player.inventory[req.keyItem.id] ?? 0
    if (have < req.keyItem.qty) missing.push(`${req.keyItem.name} x${req.keyItem.qty} (have ${have})`)
  }
  return missing
}
