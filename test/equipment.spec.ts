import { describe, it, expect } from 'vitest'
import {
  ALL_EQUIPMENT, CONSUMABLES, RECIPES,
  getItemById, getEquipmentById, getRecipeByOutput, findShopItem,
  shopInventoryForFloor, equipmentTierForFloor, rarityColor, rarityOf,
} from '~/data/equipment'

describe('equipment — catalog integrity', () => {
  it('builds a large catalog with unique ids and positive costs', () => {
    expect(ALL_EQUIPMENT.length).toBeGreaterThan(150)
    const ids = ALL_EQUIPMENT.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const it of ALL_EQUIPMENT) {
      expect(it.cost).toBeGreaterThan(0)
      expect(it.tier).toBeGreaterThanOrEqual(1)
      expect(it.tier).toBeLessThanOrEqual(5)
      expect(Object.keys(it.stats).length).toBeGreaterThan(0)
    }
  })

  it('epic/legendary gear is craft-only (never sold in shops)', () => {
    for (const it of ALL_EQUIPMENT) {
      if (it.rarity === 'epic' || it.rarity === 'legendary') expect(it.craftable).toBe(true)
    }
  })
})

describe('equipment — tier mapping', () => {
  it('maps floors to tiers 1..5 in 10-floor bands', () => {
    expect(equipmentTierForFloor(1)).toBe(1)
    expect(equipmentTierForFloor(10)).toBe(1)
    expect(equipmentTierForFloor(11)).toBe(2)
    expect(equipmentTierForFloor(100)).toBe(5)
  })
})

describe('equipment — lookups', () => {
  it('resolves consumables and equipment by id', () => {
    expect(getItemById('potion_s')?.kind).toBe('consumable')
    const sword = ALL_EQUIPMENT.find((i) => i.type === 'sword')!
    expect(getEquipmentById(sword.id)?.id).toBe(sword.id)
    expect(getItemById('does_not_exist')).toBeUndefined()
  })

  it('rarity helpers return known values', () => {
    expect(rarityColor('legendary')).toMatch(/^#/)
    expect(rarityOf('potion_s')).toBe('common')
  })
})

describe('equipment — shop inventory', () => {
  it('only lists unlocked, non-craftable gear plus available consumables', () => {
    const floor = 25
    const shop = shopInventoryForFloor(floor)
    expect(shop.length).toBeGreaterThan(0)
    for (const item of shop) {
      expect(item.minFloor).toBeLessThanOrEqual(floor)
      if (item.kind === 'equipment') {
        expect(item.craftable).not.toBe(true)
        expect(['common', 'uncommon', 'rare']).toContain(item.rarity)
      }
    }
  })

  it('findShopItem returns an item only when it is actually on sale for that floor', () => {
    const floor = 25
    const first = shopInventoryForFloor(floor)[0]
    expect(findShopItem(floor, first.id)?.id).toBe(first.id)
    // A tier-5 legendary is craft-only ⇒ never in the shop.
    const legendary = ALL_EQUIPMENT.find((i) => i.rarity === 'legendary')!
    expect(findShopItem(100, legendary.id)).toBeUndefined()
  })
})

describe('equipment — crafting recipes', () => {
  it('every craftable item has a recipe with materials and a gold cost', () => {
    const craftable = ALL_EQUIPMENT.filter((i) => i.craftable)
    expect(RECIPES.length).toBe(craftable.length)
    for (const it of craftable) {
      const recipe = getRecipeByOutput(it.id)
      expect(recipe).toBeDefined()
      expect(recipe!.materials.length).toBeGreaterThan(0)
      expect(recipe!.gold).toBeGreaterThan(0)
      for (const m of recipe!.materials) expect(m.qty).toBeGreaterThan(0)
    }
  })
})
