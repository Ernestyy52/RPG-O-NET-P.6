import { describe, expect, it } from 'vitest'
import {
  EQUIPMENT_SETS,
  SET_EQUIPMENT,
  activeEquipmentSets,
  equipmentSetForMonster,
  totalEquipmentSetBonus,
} from '~/data/equipmentSets'

describe('farmable equipment sets', () => {
  it('defines a three-piece drop-only set for every world', () => {
    expect(EQUIPMENT_SETS).toHaveLength(10)
    expect(SET_EQUIPMENT).toHaveLength(30)
    for (const set of EQUIPMENT_SETS) expect(new Set(Object.values(set.pieces)).size).toBe(3)
  })

  it('activates two-piece and three-piece bonuses progressively', () => {
    const set = EQUIPMENT_SETS[0]!
    const two = { weapon: set.pieces.weapon, armor: set.pieces.armor }
    const full = { ...two, trinket: set.pieces.trinket }
    expect(activeEquipmentSets(two)[0]?.equipped).toBe(2)
    expect(totalEquipmentSetBonus(two)).toEqual(set.bonuses.two)
    expect(activeEquipmentSets(full)[0]?.equipped).toBe(3)
    expect(Object.keys(totalEquipmentSetBonus(full)).length).toBeGreaterThan(0)
  })

  it('ties each set to one signature monster', () => {
    expect(equipmentSetForMonster('big_slime')?.name).toBe('Verdant Covenant')
    expect(equipmentSetForMonster('kraken')?.name).toBe('Sunken Abyss')
  })
})
