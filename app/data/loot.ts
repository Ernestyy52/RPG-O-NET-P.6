// ระบบไอเทมดรอปจากมอนสเตอร์ — วัสดุคราฟ (ตามเทียร์/ไบโอมของชั้น) + เศษกุญแจปลดล็อกห้องบอส
import { MATERIALS, equipmentTierForFloor } from './equipment'

export function bossKeyItemId(world: number): string {
  return `key_fragment_w${world}`
}
export function bossKeyItemName(world: number): string {
  return `Key Fragment (World ${world})`
}

export interface LootDrop { itemId: string; name: string; qty: number }

/**
 * สุ่มไอเทมดรอปหลังชนะมอนสเตอร์ — วัสดุที่ดรอปอิงเทียร์ของชั้น (±1) ให้ผู้เล่นสะสมไปคราฟของเทียร์นั้น
 * world (กลุ่มชั้นละ 10) กำหนดเศษกุญแจปลดบอสประจำโลก
 */
export function rollLoot(floor: number, isBoss: boolean): LootDrop[] {
  const world = Math.ceil(floor / 10)
  const tier = equipmentTierForFloor(floor)
  const drops: LootDrop[] = []

  // วัสดุตามเทียร์ชั้น (เทียร์ปัจจุบันหรือรองลงมา) — บอสดรอปเยอะ+เทียร์สูงกว่า
  const matPool = MATERIALS.filter((m) => m.tier <= tier && m.tier >= tier - 1)
  const pool = matPool.length ? matPool : MATERIALS.filter((m) => m.tier <= tier)
  if (pool.length && Math.random() < (isBoss ? 1 : 0.5)) {
    const mat = pool[Math.floor(Math.random() * pool.length)]
    drops.push({ itemId: mat.id, name: mat.name, qty: isBoss ? 2 + Math.floor(Math.random() * 2) : 1 })
  }
  if (Math.random() < 0.18) {
    drops.push({ itemId: 'potion_s', name: 'Small Potion', qty: 1 })
  }
  if (world >= 2 && Math.random() < 0.4) {
    drops.push({ itemId: bossKeyItemId(world), name: bossKeyItemName(world), qty: 1 })
  }
  // บอสมีโอกาสดรอปวัสดุหายากของเทียร์สูงสุด (ไว้คราฟของ epic/legendary)
  if (isBoss) {
    const rare = MATERIALS.filter((m) => m.tier >= tier)
    if (rare.length && Math.random() < 0.6) {
      const mat = rare[Math.floor(Math.random() * rare.length)]
      drops.push({ itemId: mat.id, name: mat.name, qty: 1 })
    }
  }
  return drops
}
