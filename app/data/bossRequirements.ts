import { bossKeyItemId, bossKeyItemName } from './loot'

export interface BossRequirement {
  level: number
  correctAnswers: number
  keyItem?: { id: string; name: string; qty: number }
}

// เงื่อนไขปลดล็อกห้องบอสประจำแต่ละโลก (world = floor/10)
// world 1 (บอสชั้น 10): ง่าย เช็คแค่เลเวล + จำนวนคำถามที่ตอบถูกสะสม
// world 2 ขึ้นไป (บอสชั้น 20, 30, ...): เพิ่มเงื่อนไขเก็บเศษกุญแจที่ดรอปจากมอนสเตอร์ในโลกนั้น
export function getBossRequirement(bossFloor: number): BossRequirement {
  const world = Math.round(bossFloor / 10)
  if (world <= 1) {
    return { level: 3, correctAnswers: 10 }
  }
  const qty = 3 + (world - 2) * 2
  return {
    level: 3 + (world - 1) * 3,
    correctAnswers: 10 + (world - 1) * 15,
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
