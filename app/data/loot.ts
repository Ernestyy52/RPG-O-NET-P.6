import { MATERIALS, equipmentTierForFloor, getEquipmentById, getMaterial } from './equipment'
import { equipmentSetForMonster } from './equipmentSets'
import { seedFromString } from './learning/rng'

export function bossKeyItemId(world: number): string {
  return `key_fragment_w${world}`
}
export function bossKeyItemName(world: number): string {
  return `Key Fragment (World ${world})`
}

export interface LootDrop { itemId: string; name: string; qty: number; guaranteed?: boolean }

export interface LootContext {
  monsterId?: string
  elite?: boolean
  rare?: boolean
  rng?: () => number
  setPityCount?: number
  ownedItemIds?: Iterable<string>
}

const SIGNATURE_MATERIALS: Record<string, string> = {
  slime: 'slime_gel', big_slime: 'slime_gel', nature_slime: 'slime_gel', thunder_slime: 'slime_gel', fire_slime: 'magma_core',
  mushroom_monster: 'thick_fur', frog_monster: 'venom_sac', forest_lizard: 'monster_scale',
  scorpion: 'venom_sac', snake: 'venom_sac', viper: 'venom_sac', basilisk: 'monster_scale', cockatrice: 'monster_scale',
  cactus_monster: 'sand_crystal', sand_worm: 'sand_crystal', mummy: 'bone_shard', minos: 'bone_shard', minotaur: 'bone_shard', gorgon: 'venom_sac',
  frost_sprite: 'frost_shard', snow_worm: 'frost_shard', fluffy_bear: 'thick_fur', ice_robot: 'frost_shard', cumulus: 'frost_shard', tengu: 'frost_shard', harpy: 'thick_fur',
  fire_wisp: 'ember_ash', salamander: 'magma_core', red_imp: 'ember_ash', fire_robot: 'magma_core', gargoyle: 'monster_scale',
  bat: 'bone_shard', black_imp: 'shadow_essence', spider: 'venom_sac', clay_golem: 'crystal_dust', cyclops: 'crystal_dust',
  treant: 'thick_fur', plant_behemoth: 'monster_scale', plant_sprite: 'slime_gel', dryad: 'crystal_dust', golem: 'crystal_dust', living_boulder: 'crystal_dust',
  shadow: 'shadow_essence', wraith: 'shadow_essence', banshee: 'shadow_essence', reaper: 'shadow_essence',
  troll: 'thick_fur', kraken: 'dragon_heart', dragon: 'dragon_heart', abyssal_beast: 'dragon_heart',
}

export function signatureDropForMonster(monsterId: string | undefined): string | undefined {
  return monsterId ? SIGNATURE_MATERIALS[monsterId] : undefined
}

export function setPityThreshold(monsterId: string): number {
  return 15 + (seedFromString(`set-pity:${monsterId}`) % 6)
}

function addDrop(drops: LootDrop[], itemId: string, name: string, qty = 1, guaranteed = false) {
  const existing = drops.find((drop) => drop.itemId === itemId)
  if (existing) { existing.qty += qty; existing.guaranteed ||= guaranteed }
  else drops.push({ itemId, name, qty, ...(guaranteed ? { guaranteed: true } : {}) })
}

/**
 * Monster loot with explicit farm targets. The optional context remains backward compatible,
 * and an injected RNG keeps tests/replays deterministic.
 */
export function rollLoot(floor: number, isBoss: boolean, context: LootContext = {}): LootDrop[] {
  const rng = context.rng ?? Math.random
  const world = Math.ceil(floor / 10)
  const tier = equipmentTierForFloor(floor)
  const drops: LootDrop[] = []

  const matPool = MATERIALS.filter((material) => material.tier <= tier && material.tier >= tier - 1)
  const pool = matPool.length ? matPool : MATERIALS.filter((material) => material.tier <= tier)
  if (pool.length && rng() < (isBoss ? 1 : 0.5)) {
    const material = pool[Math.floor(rng() * pool.length)]!
    addDrop(drops, material.id, material.name, isBoss ? 2 + Math.floor(rng() * 2) : 1)
  }

  const signatureId = signatureDropForMonster(context.monsterId)
  const signatureChance = isBoss || context.rare ? 1 : context.elite ? 0.85 : 0.62
  if (signatureId && rng() < signatureChance) {
    const material = getMaterial(signatureId)
    if (material) addDrop(drops, material.id, material.name, isBoss || context.rare ? 2 : 1)
  }

  const set = equipmentSetForMonster(context.monsterId)
  const setChance = isBoss ? 1 : context.rare ? 0.65 : context.elite ? 0.3 : 0.06
  if (set && floor >= set.minFloor) {
    const ids = Object.values(set.pieces)
    const pityReady = (context.setPityCount ?? 0) + 1 >= setPityThreshold(set.sourceMonster)
    if (pityReady || rng() < setChance) {
      const owned = new Set(context.ownedItemIds ?? [])
      const missing = ids.filter((id) => !owned.has(id))
      const poolIds = missing.length ? missing : ids
      const item = getEquipmentById(poolIds[Math.floor(rng() * poolIds.length)]!)
      if (item) addDrop(drops, item.id, item.name, 1, pityReady)
    }
  }

  if (rng() < 0.18) addDrop(drops, 'potion_s', 'Small Potion', 1)
  if (rng() < (isBoss ? 1 : 0.4)) addDrop(drops, bossKeyItemId(world), bossKeyItemName(world), 1)

  if (isBoss) {
    const rare = MATERIALS.filter((material) => material.tier >= tier)
    if (rare.length && rng() < 0.6) {
      const material = rare[Math.floor(rng() * rare.length)]!
      addDrop(drops, material.id, material.name, 1)
    }
  }
  return drops
}
