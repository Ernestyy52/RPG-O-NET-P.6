// ================================================================================================
// Item & weapon catalog (200+) + crafting system
//
// สร้างไอเทมจากการผสม: ประเภท (weapon type / armor weight / trinket kind) × เทียร์วัสดุ 5 ระดับ × ความหายาก
// → ได้ไอเทมคอนกรีตกว่า 200 ชิ้น โดย "ใช้ไอคอน PNG ร่วมกัน" ตามเทียร์ (weapon_t1..5 / armor / trinket)
//   แล้วแต้มสีตามความหายากในฝั่ง UI — ประหยัด texture memory มากสำหรับเครื่องแรมน้อย
//
// ความเข้ากันได้: คงชื่อ export เดิมทุกตัว (EquipmentSlot/StatBlock/EquipmentItem/ConsumableItem/
//   InventoryItem/equipmentTierForFloor/generateEquipmentForFloor/CONSUMABLES/itemIconPath/
//   shopInventoryForFloor/findShopItem/getItemById) — โค้ด/เซฟเดิมไม่พัง
// ================================================================================================

export type EquipmentSlot = 'weapon' | 'armor' | 'trinket'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface StatBlock { hp?: number; atk?: number; def?: number; mag?: number; speed?: number; knowledge?: number }

export interface EquipmentItem {
  id: string
  kind: 'equipment'
  slot: EquipmentSlot
  type: string            // สายย่อย (sword/staff/bow/... , light/heavy , ring/amulet/...)
  tier: number            // 1-5 (ระดับวัสดุ)
  rarity: Rarity
  name: string
  cost: number
  minFloor: number
  stats: StatBlock
  icon: string            // ไอคอน PNG ที่ใช้ร่วม (weapon_t1.. / armor_t1.. / trinket_t1..)
  visual: string
  craftable?: boolean     // true = คราฟเท่านั้น (ไม่มีขายในร้าน) ต้องใช้วัสดุ
}

export interface ConsumableItem {
  id: string
  kind: 'consumable'
  name: string
  cost: number
  minFloor: number
  rarity: Rarity
  effect: { heal?: number; mp?: number; focus?: number; shield?: number; revive?: boolean }
  icon: string
}

export interface MaterialItem {
  id: string
  kind: 'material'
  name: string
  rarity: Rarity
  tier: number
  icon: string
}

export type InventoryItem = EquipmentItem | ConsumableItem

export const TIER_NAMES = ['Training', 'Iron', 'Steel', 'Mythril', 'Dragon']

export interface RarityDef { mult: number; costMult: number; label: string; color: string }
export const RARITIES: Record<Rarity, RarityDef> = {
  common: { mult: 1.0, costMult: 1.0, label: '', color: '#c9c2ad' },
  uncommon: { mult: 1.28, costMult: 1.7, label: 'Fine', color: '#5fd35f' },
  rare: { mult: 1.7, costMult: 2.8, label: 'Rare', color: '#5aa8ff' },
  epic: { mult: 2.3, costMult: 5, label: 'Epic', color: '#c06bff' },
  legendary: { mult: 3.2, costMult: 9, label: 'Legendary', color: '#ffb347' },
}
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export function equipmentTierForFloor(floor: number): number {
  return Math.min(5, Math.max(1, Math.ceil(floor / 10)))
}

function round(stats: StatBlock, mult: number): StatBlock {
  const out: StatBlock = {}
  for (const [k, v] of Object.entries(stats)) if (v) out[k as keyof StatBlock] = Math.max(1, Math.round(v * mult))
  return out
}

// ---- weapon types (slot: weapon) — โปรไฟล์สเตตัสต่างกันตามสาย ----
interface SubType { id: string; label: string; base: StatBlock; per: StatBlock }
const WEAPON_TYPES: SubType[] = [
  { id: 'sword', label: 'Sword', base: { atk: 5, hp: 2 }, per: { atk: 4, hp: 3 } },
  { id: 'greatsword', label: 'Greatsword', base: { atk: 7 }, per: { atk: 6 } },
  { id: 'dagger', label: 'Dagger', base: { atk: 3, speed: 2 }, per: { atk: 3, speed: 2 } },
  { id: 'bow', label: 'Bow', base: { atk: 4, speed: 1 }, per: { atk: 4, knowledge: 1 } },
  { id: 'staff', label: 'Staff', base: { mag: 5, knowledge: 1 }, per: { mag: 4, knowledge: 2 } },
]
const ARMOR_TYPES: SubType[] = [
  { id: 'light', label: 'Garb', base: { hp: 8, def: 2, speed: 1 }, per: { hp: 9, def: 2, speed: 1 } },
  { id: 'medium', label: 'Mail', base: { hp: 12, def: 3 }, per: { hp: 12, def: 3 } },
  { id: 'heavy', label: 'Plate', base: { hp: 16, def: 5 }, per: { hp: 15, def: 5 } },
]
const TRINKET_TYPES: SubType[] = [
  { id: 'ring', label: 'Ring', base: { atk: 1, mag: 1 }, per: { atk: 1, mag: 1 } },
  { id: 'amulet', label: 'Amulet', base: { hp: 6, knowledge: 1 }, per: { hp: 6, knowledge: 1 } },
  { id: 'charm', label: 'Charm', base: { speed: 1, knowledge: 1 }, per: { speed: 1, knowledge: 1 } },
  { id: 'tome', label: 'Tome', base: { knowledge: 2, mag: 1 }, per: { knowledge: 2, mag: 1 } },
]

/** ความหายากที่ผลิตต่อเทียร์ — เทียร์สูงมีของหายากมากขึ้น (epic/legendary = craftable เท่านั้น) */
function raritiesForTier(tier: number): Rarity[] {
  if (tier <= 1) return ['common', 'uncommon']
  if (tier === 2) return ['common', 'uncommon', 'rare']
  if (tier === 3) return ['common', 'uncommon', 'rare', 'epic']
  return ['common', 'uncommon', 'rare', 'epic', 'legendary']
}

function buildStats(base: StatBlock, per: StatBlock, tier: number, rarity: Rarity): StatBlock {
  const raw: StatBlock = { ...base }
  for (const [k, v] of Object.entries(per)) raw[k as keyof StatBlock] = (raw[k as keyof StatBlock] ?? 0) + (v ?? 0) * (tier - 1)
  return round(raw, RARITIES[rarity].mult)
}

function nameFor(rarity: Rarity, tier: number, typeLabel: string): string {
  const r = RARITIES[rarity].label
  return `${r ? r + ' ' : ''}${TIER_NAMES[tier - 1]} ${typeLabel}`.trim()
}

function buildCatalog(): EquipmentItem[] {
  const items: EquipmentItem[] = []
  const push = (slot: EquipmentSlot, t: SubType, iconBase: string) => {
    for (let tier = 1; tier <= 5; tier++) {
      for (const rarity of raritiesForTier(tier)) {
        const craftable = rarity === 'epic' || rarity === 'legendary'
        const cost = Math.round((40 * tier + tier * tier * 12) * RARITIES[rarity].costMult)
        items.push({
          id: `${t.id}_t${tier}_${rarity}`,
          kind: 'equipment', slot, type: t.id, tier, rarity,
          name: nameFor(rarity, tier, t.label),
          cost, minFloor: (tier - 1) * 10 + 1,
          stats: buildStats(t.base, t.per, tier, rarity),
          icon: `${iconBase}_t${tier}`,
          visual: `${rarity} ${t.label.toLowerCase()}`,
          craftable,
        })
      }
    }
  }
  for (const w of WEAPON_TYPES) push('weapon', w, 'weapon')
  for (const a of ARMOR_TYPES) push('armor', a, 'armor')
  for (const t of TRINKET_TYPES) push('trinket', t, 'trinket')
  return items
}

export const ALL_EQUIPMENT: EquipmentItem[] = buildCatalog()

// ---- consumables ----
export const CONSUMABLES: ConsumableItem[] = [
  { id: 'potion_s', kind: 'consumable', name: 'Small Potion', cost: 25, minFloor: 1, rarity: 'common', effect: { heal: 35 }, icon: 'potion_s' },
  { id: 'potion_m', kind: 'consumable', name: 'Mega Potion', cost: 95, minFloor: 11, rarity: 'uncommon', effect: { heal: 90 }, icon: 'potion_m' },
  { id: 'potion_l', kind: 'consumable', name: 'Grand Potion', cost: 210, minFloor: 31, rarity: 'rare', effect: { heal: 200 }, icon: 'potion_m' },
  { id: 'ether_s', kind: 'consumable', name: 'Small Ether', cost: 30, minFloor: 1, rarity: 'common', effect: { mp: 20 }, icon: 'focus_tea' },
  { id: 'ether_m', kind: 'consumable', name: 'Mega Ether', cost: 110, minFloor: 21, rarity: 'uncommon', effect: { mp: 55 }, icon: 'focus_tea' },
  { id: 'focus_tea', kind: 'consumable', name: 'Focus Tea', cost: 60, minFloor: 1, rarity: 'common', effect: { focus: 1 }, icon: 'focus_tea' },
  { id: 'guard_sigil', kind: 'consumable', name: 'Guard Sigil', cost: 80, minFloor: 11, rarity: 'uncommon', effect: { shield: 1 }, icon: 'guard_sigil' },
  { id: 'phoenix_down', kind: 'consumable', name: 'Phoenix Feather', cost: 320, minFloor: 21, rarity: 'epic', effect: { revive: true, heal: 60 }, icon: 'guard_sigil' },
  { id: 'elixir', kind: 'consumable', name: 'Full Elixir', cost: 450, minFloor: 41, rarity: 'legendary', effect: { heal: 999, mp: 999 }, icon: 'potion_m' },
]

// ---- crafting materials — ดรอปจากมอนสเตอร์ตาม biome/tier ----
export const MATERIALS: MaterialItem[] = [
  { id: 'slime_gel', kind: 'material', name: 'Slime Gel', rarity: 'common', tier: 1, icon: 'mat_gel' },
  { id: 'monster_scale', kind: 'material', name: 'Monster Scale', rarity: 'common', tier: 1, icon: 'mat_scale' },
  { id: 'bone_shard', kind: 'material', name: 'Bone Shard', rarity: 'common', tier: 1, icon: 'mat_bone' },
  { id: 'sand_crystal', kind: 'material', name: 'Sand Crystal', rarity: 'uncommon', tier: 2, icon: 'mat_crystal' },
  { id: 'venom_sac', kind: 'material', name: 'Venom Sac', rarity: 'uncommon', tier: 2, icon: 'mat_gel' },
  { id: 'frost_shard', kind: 'material', name: 'Frost Shard', rarity: 'uncommon', tier: 3, icon: 'mat_crystal' },
  { id: 'thick_fur', kind: 'material', name: 'Thick Fur', rarity: 'uncommon', tier: 3, icon: 'mat_scale' },
  { id: 'magma_core', kind: 'material', name: 'Magma Core', rarity: 'rare', tier: 4, icon: 'mat_core' },
  { id: 'ember_ash', kind: 'material', name: 'Ember Ash', rarity: 'rare', tier: 4, icon: 'mat_core' },
  { id: 'crystal_dust', kind: 'material', name: 'Crystal Dust', rarity: 'rare', tier: 5, icon: 'mat_crystal' },
  { id: 'shadow_essence', kind: 'material', name: 'Shadow Essence', rarity: 'epic', tier: 5, icon: 'mat_core' },
  { id: 'dragon_heart', kind: 'material', name: 'Dragon Heart', rarity: 'legendary', tier: 5, icon: 'mat_core' },
]

const MATERIAL_BY_ID = new Map(MATERIALS.map((m) => [m.id, m]))
export function getMaterial(id: string): MaterialItem | undefined { return MATERIAL_BY_ID.get(id) }

// ---- crafting recipes ----
export interface Recipe {
  id: string
  outputId: string
  materials: { id: string; qty: number }[]
  gold: number
  minFloor: number
}

/** สร้างสูตรคราฟอัตโนมัติสำหรับของ epic/legendary ทุกชิ้น — วัสดุตามเทียร์ */
function buildRecipes(): Recipe[] {
  const matByTier = (tier: number, rarity: Rarity) =>
    MATERIALS.filter((m) => Math.abs(m.tier - tier) <= 1 && RARITY_ORDER.indexOf(m.rarity) <= RARITY_ORDER.indexOf(rarity))
  return ALL_EQUIPMENT.filter((it) => it.craftable).map((it) => {
    const pool = matByTier(it.tier, it.rarity)
    const picks = pool.slice(0, it.rarity === 'legendary' ? 3 : 2)
    const materials = picks.map((m, i) => ({ id: m.id, qty: it.rarity === 'legendary' ? 3 - i : 2 - Math.min(i, 1) }))
    if (!materials.length) materials.push({ id: 'monster_scale', qty: 3 })
    return { id: `craft_${it.id}`, outputId: it.id, materials, gold: Math.round(it.cost * 0.4), minFloor: it.minFloor }
  })
}
export const RECIPES: Recipe[] = buildRecipes()

export function recipesForFloor(floor: number): Recipe[] {
  return RECIPES.filter((r) => r.minFloor <= floor)
}

// ---- lookup helpers (คงลายเซ็นเดิม) ----
const EQUIP_BY_ID = new Map(ALL_EQUIPMENT.map((it) => [it.id, it]))
const CONSUMABLE_BY_ID = new Map(CONSUMABLES.map((it) => [it.id, it]))

/** ไอคอน PNG ของไอเทม — resolve id → ไอคอนที่ใช้ร่วม (ประหยัดหน่วยความจำ) */
export function itemIconPath(id: string): string {
  const item = EQUIP_BY_ID.get(id) ?? CONSUMABLE_BY_ID.get(id)
  const icon = item?.icon ?? MATERIAL_BY_ID.get(id)?.icon ?? id
  return `item-icons/${icon}.png`
}

export function rarityOf(id: string): Rarity {
  return (EQUIP_BY_ID.get(id) ?? CONSUMABLE_BY_ID.get(id))?.rarity ?? MATERIAL_BY_ID.get(id)?.rarity ?? 'common'
}
export function rarityColor(rarity: Rarity): string { return RARITIES[rarity].color }

/**
 * ของขายในร้านตามชั้น: equipment ที่ปลดล็อก (ไม่ใช่ craftable) — จำกัดเทียร์ปัจจุบัน±1, ความหายาก ≤ rare
 * (epic/legendary ต้องคราฟ) เพื่อร้านไม่รกและเครื่องแรมน้อยเรนเดอร์ลิสต์เร็ว
 */
export function shopInventoryForFloor(floor: number): InventoryItem[] {
  const tier = equipmentTierForFloor(floor)
  const equip = ALL_EQUIPMENT.filter((it) =>
    !it.craftable && it.minFloor <= floor && it.tier >= tier - 1 && it.tier <= tier)
  const consumables = CONSUMABLES.filter((it) => it.minFloor <= floor)
  return [...equip, ...consumables]
}

/** เดิม: ชุดพื้นฐานของเทียร์นั้น — คงไว้เพื่อความเข้ากันได้ */
export function generateEquipmentForFloor(floor: number): EquipmentItem[] {
  const tier = equipmentTierForFloor(floor)
  return ALL_EQUIPMENT.filter((it) => it.tier === tier && it.rarity === 'common' && ['sword', 'medium', 'ring'].includes(it.type))
}

export function findShopItem(floor: number, id: string): InventoryItem | undefined {
  return shopInventoryForFloor(floor).find((item) => item.id === id)
}

export function getItemById(id: string, _floor = 100): InventoryItem | undefined {
  return EQUIP_BY_ID.get(id) ?? CONSUMABLE_BY_ID.get(id)
}

export function getEquipmentById(id: string): EquipmentItem | undefined { return EQUIP_BY_ID.get(id) }
export function getRecipeByOutput(outputId: string): Recipe | undefined {
  return RECIPES.find((r) => r.outputId === outputId)
}
