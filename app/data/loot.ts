// ระบบไอเทมดรอปจากมอนสเตอร์ — ยา/เศษวัสดุ (ไว้ต่อยอด craft/อัพเกรดในอนาคต) และเศษกุญแจปลดล็อกห้องบอส
export type LootKind = 'potion' | 'material' | 'keyItem'

export interface LootDef {
  id: string
  name: string
  kind: LootKind
}

export const MATERIALS: LootDef[] = [
  { id: 'monster_scale', name: 'Monster Scale', kind: 'material' },
  { id: 'slime_gel', name: 'Slime Gel', kind: 'material' },
  { id: 'bone_shard', name: 'Bone Shard', kind: 'material' },
]

export function bossKeyItemId(world: number): string {
  return `key_fragment_w${world}`
}

export function bossKeyItemName(world: number): string {
  return `Key Fragment (World ${world})`
}

export interface LootDrop { itemId: string; name: string; qty: number }

// สุ่มไอเทมดรอปหลังชนะมอนสเตอร์แต่ละตัว — โลก (world) คือกลุ่มชั้นละ 10 ชั้น
// world 1 (ชั้น 1-10) ไม่มีเศษกุญแจ เพราะบอสด่านแรกยังไม่ต้องใช้ไอเทม
export function rollLoot(floor: number, isBoss: boolean): LootDrop[] {
  const world = Math.ceil(floor / 10)
  const drops: LootDrop[] = []

  if (Math.random() < 0.45) {
    const material = MATERIALS[Math.floor(Math.random() * MATERIALS.length)]
    drops.push({ itemId: material.id, name: material.name, qty: 1 })
  }
  if (Math.random() < 0.2) {
    drops.push({ itemId: 'potion_s', name: 'Small Potion', qty: 1 })
  }
  if (world >= 2 && Math.random() < 0.4) {
    drops.push({ itemId: bossKeyItemId(world), name: bossKeyItemName(world), qty: 1 })
  }
  if (isBoss) {
    drops.push({ itemId: 'monster_scale', name: 'Monster Scale', qty: 3 })
  }
  return drops
}
