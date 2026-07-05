export type EquipmentSlot = 'weapon' | 'armor' | 'trinket'

export interface StatBlock { hp?: number; atk?: number; def?: number; mag?: number; speed?: number; knowledge?: number }
export interface EquipmentItem { id: string; kind: 'equipment'; slot: EquipmentSlot; tier: number; name: string; cost: number; minFloor: number; stats: StatBlock; visual: string }
export interface ConsumableItem { id: string; kind: 'consumable'; name: string; cost: number; minFloor: number; effect: { heal?: number; focus?: number; shield?: number } }
export type InventoryItem = EquipmentItem | ConsumableItem

const TIER_NAMES = ['Training', 'Iron', 'Steel', 'Mythril', 'Dragon']

export function equipmentTierForFloor(floor: number): number {
  return Math.min(5, Math.max(1, Math.ceil(floor / 10)))
}

export function generateEquipmentForFloor(floor: number): EquipmentItem[] {
  const tier = equipmentTierForFloor(floor)
  const label = TIER_NAMES[tier - 1]
  const minFloor = (tier - 1) * 10 + 1
  const cost = 45 * tier + floor * 8
  return [
    { id: `weapon_t${tier}`, kind: 'equipment', slot: 'weapon', tier, name: `${label} Weapon`, cost, minFloor, stats: { atk: 4 * tier, mag: tier > 1 ? tier : 0 }, visual: tier >= 4 ? 'glowing weapon' : 'sharper weapon' },
    { id: `armor_t${tier}`, kind: 'equipment', slot: 'armor', tier, name: `${label} Armor`, cost, minFloor, stats: { hp: 14 * tier, def: 3 * tier }, visual: tier >= 4 ? 'bright armor plates' : 'stronger armor' },
    { id: `trinket_t${tier}`, kind: 'equipment', slot: 'trinket', tier, name: `${label} Charm`, cost: Math.round(cost * 0.8), minFloor, stats: { speed: tier, knowledge: tier }, visual: 'class charm' },
  ]
}

export const CONSUMABLES: ConsumableItem[] = [
  { id: 'potion_s', kind: 'consumable', name: 'Small Potion', cost: 25, minFloor: 1, effect: { heal: 35 } },
  { id: 'potion_m', kind: 'consumable', name: 'Mega Potion', cost: 95, minFloor: 11, effect: { heal: 90 } },
  { id: 'focus_tea', kind: 'consumable', name: 'Focus Tea', cost: 60, minFloor: 1, effect: { focus: 1 } },
  { id: 'guard_sigil', kind: 'consumable', name: 'Guard Sigil', cost: 80, minFloor: 11, effect: { shield: 1 } },
]

export function shopInventoryForFloor(floor: number): InventoryItem[] {
  return [...generateEquipmentForFloor(floor), ...CONSUMABLES.filter((item) => item.minFloor <= floor)]
}

export function findShopItem(floor: number, id: string): InventoryItem | undefined {
  return shopInventoryForFloor(floor).find((item) => item.id === id)
}
export function getItemById(id: string, floor = 100): InventoryItem | undefined {
  const allEquipment = Array.from({ length: 5 }, (_, index) => generateEquipmentForFloor(index * 10 + 1)).flat()
  return [...allEquipment, ...CONSUMABLES, ...shopInventoryForFloor(floor)].find((item) => item.id === id)
}
