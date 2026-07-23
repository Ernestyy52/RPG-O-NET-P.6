import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ALL_EQUIPMENT } from '~/data/equipment'
import {
  getEquipmentVisual,
  shieldFamilyForWeaponType,
  validateEquipmentVisuals,
  visualForItem,
  weaponFamilyForType,
  WEAPON_ANCHORS,
  type Facing,
} from '~/data/equipmentVisuals'

const FACINGS: Facing[] = ['down', 'left', 'right', 'up']

describe('equipment visual registry', () => {
  it('covers every equippable item with a valid mapping', () => {
    expect(validateEquipmentVisuals()).toEqual([])
    expect(ALL_EQUIPMENT.length).toBeGreaterThan(200)
  })

  it('maps all 18 weapon types to one of 12 directional animation families', () => {
    const weapons = ALL_EQUIPMENT.filter((item) => item.slot === 'weapon')
    const types = new Set(weapons.map((item) => item.type))
    const families = new Set(weapons.map((item) => weaponFamilyForType(item.type)))
    expect(types.size).toBe(18)
    expect(families.size).toBe(12)
    for (const weapon of weapons) {
      const visual = getEquipmentVisual(weapon.id)!
      expect(visual.mode, weapon.id).toBe('animated-weapon')
      expect(visual.animationPath, weapon.id).toContain('paperdoll/accessories/weapon-')
      const animation = fileURLToPath(new URL(`../public/${visual.animationPath}`, import.meta.url))
      const icon = fileURLToPath(new URL(`../public/${visual.iconPath}`, import.meta.url))
      expect(existsSync(animation), `${weapon.id} -> ${visual.animationPath}`).toBe(true)
      expect(existsSync(icon), `${weapon.id} -> ${visual.iconPath}`).toBe(true)
    }
  })

  it('uses true left/right weapon frames without runtime mirroring', () => {
    for (const facing of FACINGS) {
      expect(WEAPON_ANCHORS[facing]).toBeDefined()
      expect(WEAPON_ANCHORS[facing].flipX).toBe(false)
      expect(WEAPON_ANCHORS[facing].angle).toBe(0)
    }
    expect(WEAPON_ANCHORS.up.front).toBe(false)
    expect(WEAPON_ANCHORS.down.front).toBe(true)
  })

  it('adds a matching animated head layer to every armor family', () => {
    for (const item of ALL_EQUIPMENT.filter((candidate) => candidate.slot === 'armor')) {
      const visual = getEquipmentVisual(item.id)!
      expect(visual.mode, item.id).toBe('outfit')
      expect(visual.outfitFamily, item.id).toBeTruthy()
      expect(visual.animationPath, item.id).toContain('paperdoll/animated/')
      expect(visual.headAnimationPath, item.id).toContain('paperdoll/accessories/head-')
      const head = fileURLToPath(new URL(`../public/${visual.headAnimationPath}`, import.meta.url))
      expect(existsSync(head), `${item.id} -> ${visual.headAnimationPath}`).toBe(true)
    }
  })

  it('shows generated shields for compatible one-handed weapons', () => {
    expect(shieldFamilyForWeaponType('dagger')).toBe('round')
    expect(shieldFamilyForWeaponType('sword')).toBe('kite')
    expect(shieldFamilyForWeaponType('wand')).toBe('arcane')
    expect(shieldFamilyForWeaponType('greatsword')).toBeUndefined()
    for (const family of ['round', 'kite', 'arcane']) {
      const file = fileURLToPath(new URL(`../public/paperdoll/accessories/shield-${family}-sheet.png`, import.meta.url))
      expect(existsSync(file), family).toBe(true)
    }
  })

  it('keeps trinkets visible and the mapping deterministic', () => {
    for (const item of ALL_EQUIPMENT.filter((candidate) => candidate.slot === 'trinket')) {
      const visual = getEquipmentVisual(item.id)!
      expect(visual.mode, item.id).toBe('charm')
      expect(visual.iconPath).toContain('item-icons/')
    }
    const sample = ALL_EQUIPMENT[0]!
    expect(visualForItem(sample)).toEqual(visualForItem(sample))
    expect(getEquipmentVisual('no_such_item')).toBeUndefined()
  })
})
