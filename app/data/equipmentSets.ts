import type { EquipmentItem, EquipmentSlot, Rarity, StatBlock } from './equipment'

export interface EquipmentSetDefinition {
  id: string
  name: string
  sourceMonster: string
  sourceName: string
  minFloor: number
  rarity: Rarity
  pieces: Record<EquipmentSlot, string>
  bonuses: { two: StatBlock; three: StatBlock }
}

interface SetSeed {
  id: string
  name: string
  sourceMonster: string
  sourceName: string
  weaponType: string
  weaponIcon: string
  armorType: string
  armorIcon: string
  trinketType: string
  trinketIcon: string
  focus: 'atk' | 'mag' | 'def' | 'speed'
}

const SEEDS: SetSeed[] = [
  { id: 'verdant', name: 'Verdant Covenant', sourceMonster: 'big_slime', sourceName: 'Big Slime', weaponType: 'dagger', weaponIcon: 'wpn_dagger', armorType: 'leather', armorIcon: 'arm_leather', trinketType: 'charm', trinketIcon: 'trk_charm', focus: 'speed' },
  { id: 'dune', name: 'Dune Stalker', sourceMonster: 'sand_worm', sourceName: 'Sand Worm', weaponType: 'spear', weaponIcon: 'wpn_spear', armorType: 'scale', armorIcon: 'arm_scale', trinketType: 'amulet', trinketIcon: 'trk_amulet', focus: 'atk' },
  { id: 'frost', name: 'Frostbound Sentinel', sourceMonster: 'ice_robot', sourceName: 'Ice Robot', weaponType: 'mace', weaponIcon: 'wpn_mace', armorType: 'chain', armorIcon: 'arm_chain', trinketType: 'orb', trinketIcon: 'trk_orb', focus: 'def' },
  { id: 'ember', name: 'Emberforged Oath', sourceMonster: 'salamander', sourceName: 'Salamander', weaponType: 'greatsword', weaponIcon: 'wpn_greatsword', armorType: 'plate', armorIcon: 'arm_plate', trinketType: 'ring', trinketIcon: 'trk_ring', focus: 'atk' },
  { id: 'crystal', name: 'Crystal Seer', sourceMonster: 'cyclops', sourceName: 'Cyclops', weaponType: 'staff', weaponIcon: 'wpn_staff', armorType: 'mage_robe', armorIcon: 'arm_robe', trinketType: 'tome', trinketIcon: 'trk_tome', focus: 'mag' },
  { id: 'grove', name: 'Ancient Grovekeeper', sourceMonster: 'plant_behemoth', sourceName: 'Plant Behemoth', weaponType: 'bow', weaponIcon: 'wpn_bow', armorType: 'hide', armorIcon: 'arm_leather', trinketType: 'talisman', trinketIcon: 'trk_charm', focus: 'def' },
  { id: 'pharaoh', name: 'Pharaoh Eternal', sourceMonster: 'minotaur', sourceName: 'Minotaur', weaponType: 'axe', weaponIcon: 'wpn_axe', armorType: 'fullplate', armorIcon: 'arm_plate', trinketType: 'signet', trinketIcon: 'trk_ring', focus: 'atk' },
  { id: 'frostpeak', name: 'Frostpeak Warden', sourceMonster: 'golem', sourceName: 'Golem', weaponType: 'warhammer', weaponIcon: 'wpn_mace', armorType: 'plate', armorIcon: 'arm_plate', trinketType: 'badge', trinketIcon: 'trk_badge', focus: 'def' },
  { id: 'infernal', name: 'Infernal Requiem', sourceMonster: 'reaper', sourceName: 'Reaper', weaponType: 'scythe', weaponIcon: 'wpn_scythe', armorType: 'dragon', armorIcon: 'arm_dragon', trinketType: 'orb', trinketIcon: 'trk_orb', focus: 'mag' },
  { id: 'abyss', name: 'Sunken Abyss', sourceMonster: 'kraken', sourceName: 'Kraken', weaponType: 'rapier', weaponIcon: 'wpn_rapier', armorType: 'cloak', armorIcon: 'arm_cloak', trinketType: 'amulet', trinketIcon: 'trk_amulet', focus: 'speed' },
]

function rarityForWorld(world: number): Rarity {
  if (world === 1) return 'uncommon'
  if (world <= 3) return 'rare'
  if (world <= 5) return 'epic'
  return 'legendary'
}

function setBonuses(world: number, focus: SetSeed['focus']): EquipmentSetDefinition['bonuses'] {
  const tier = Math.min(5, world)
  const two: StatBlock = { hp: 5 + tier * 3 }
  const three: StatBlock = { knowledge: 1 + Math.floor(tier / 2) }
  if (focus === 'atk') { two.atk = 2 + tier; three.atk = 3 + tier }
  if (focus === 'mag') { two.mag = 2 + tier; three.mag = 3 + tier }
  if (focus === 'def') { two.def = 2 + tier; three.def = 2 + tier }
  if (focus === 'speed') { two.speed = 1 + Math.ceil(tier / 2); three.speed = 2 + Math.ceil(tier / 2) }
  return { two, three }
}

export const EQUIPMENT_SETS: EquipmentSetDefinition[] = SEEDS.map((seed, index) => {
  const world = index + 1
  const id = seed.id
  return {
    id,
    name: seed.name,
    sourceMonster: seed.sourceMonster,
    sourceName: seed.sourceName,
    minFloor: (world - 1) * 10 + 1,
    rarity: rarityForWorld(world),
    pieces: {
      weapon: `set_${id}_weapon`,
      armor: `set_${id}_armor`,
      trinket: `set_${id}_trinket`,
    },
    bonuses: setBonuses(world, seed.focus),
  }
})

function pieceStats(world: number, slot: EquipmentSlot, focus: SetSeed['focus']): StatBlock {
  const tier = Math.min(5, world)
  if (slot === 'weapon') return focus === 'mag'
    ? { mag: 5 + tier * 5, knowledge: tier }
    : { atk: 5 + tier * 5, speed: focus === 'speed' ? tier : undefined }
  if (slot === 'armor') return { hp: 10 + tier * 14, def: 2 + tier * 4, mag: focus === 'mag' ? tier : undefined }
  return {
    hp: 4 + tier * 5,
    atk: focus === 'atk' ? 1 + tier : undefined,
    mag: focus === 'mag' ? 1 + tier : undefined,
    def: focus === 'def' ? 1 + tier : undefined,
    speed: focus === 'speed' ? 1 + Math.ceil(tier / 2) : undefined,
    knowledge: 1 + Math.floor(tier / 2),
  }
}

export const SET_EQUIPMENT: EquipmentItem[] = SEEDS.flatMap((seed, index) => {
  const world = index + 1
  const tier = Math.min(5, world)
  const rarity = rarityForWorld(world)
  const minFloor = (world - 1) * 10 + 1
  const setId = seed.id
  const data: Array<[EquipmentSlot, string, string, string]> = [
    ['weapon', `${seed.name} Weapon`, seed.weaponType, seed.weaponIcon],
    ['armor', `${seed.name} Garb`, seed.armorType, seed.armorIcon],
    ['trinket', `${seed.name} Relic`, seed.trinketType, seed.trinketIcon],
  ]
  return data.map(([slot, name, type, icon]) => ({
    id: `set_${setId}_${slot}`,
    kind: 'equipment' as const,
    slot,
    type,
    tier,
    rarity,
    name,
    // Positive appraisal value for inventory/sorting; dropOnly keeps it out of every shop.
    cost: 180 * world,
    minFloor,
    stats: pieceStats(world, slot, seed.focus),
    icon,
    visual: `${seed.name} ${slot}`,
    setId,
    dropOnly: true,
  }))
})

export const SET_ITEM_IDS = new Set(SET_EQUIPMENT.map((item) => item.id))

export function equipmentSetForMonster(monsterId: string | undefined): EquipmentSetDefinition | undefined {
  return monsterId ? EQUIPMENT_SETS.find((set) => set.sourceMonster === monsterId) : undefined
}

export function equipmentSetForItem(itemId: string): EquipmentSetDefinition | undefined {
  return EQUIPMENT_SETS.find((set) => Object.values(set.pieces).includes(itemId))
}

export interface ActiveEquipmentSet {
  set: EquipmentSetDefinition
  equipped: number
  bonus: StatBlock
}

export function activeEquipmentSets(equipment: Partial<Record<EquipmentSlot, string>>): ActiveEquipmentSet[] {
  const equippedIds = new Set(Object.values(equipment).filter((id): id is string => !!id))
  return EQUIPMENT_SETS.map((set) => {
    const equipped = Object.values(set.pieces).filter((id) => equippedIds.has(id)).length
    const bonus: StatBlock = {}
    if (equipped >= 2) Object.assign(bonus, set.bonuses.two)
    if (equipped >= 3) {
      for (const [key, value] of Object.entries(set.bonuses.three)) {
        bonus[key as keyof StatBlock] = (bonus[key as keyof StatBlock] ?? 0) + (value ?? 0)
      }
    }
    return { set, equipped, bonus }
  }).filter((entry) => entry.equipped > 0)
}

export function totalEquipmentSetBonus(equipment: Partial<Record<EquipmentSlot, string>>): StatBlock {
  const total: StatBlock = {}
  for (const active of activeEquipmentSets(equipment)) {
    for (const [key, value] of Object.entries(active.bonus)) {
      total[key as keyof StatBlock] = (total[key as keyof StatBlock] ?? 0) + (value ?? 0)
    }
  }
  return total
}

