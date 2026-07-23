import { describe, expect, it } from 'vitest'
import { EQUIPMENT_SETS } from '~/data/equipmentSets'
import { rollLoot, signatureDropForMonster } from '~/data/loot'

describe('monster-specific farming loot', () => {
  it('maps recognizable monsters to signature materials', () => {
    expect(signatureDropForMonster('slime')).toBe('slime_gel')
    expect(signatureDropForMonster('sand_worm')).toBe('sand_crystal')
    expect(signatureDropForMonster('reaper')).toBe('shadow_essence')
  })

  it('guarantees one source-set piece from its boss', () => {
    const set = EQUIPMENT_SETS.find((entry) => entry.sourceMonster === 'big_slime')!
    const drops = rollLoot(10, true, { monsterId: 'big_slime', rng: () => 0 })
    expect(drops.some((drop) => Object.values(set.pieces).includes(drop.itemId))).toBe(true)
  })

  it('raises set-piece access for elite and rare variants without paid randomness', () => {
    const elite = rollLoot(20, false, { monsterId: 'sand_worm', elite: true, rng: () => 0.1 })
    const rare = rollLoot(20, false, { monsterId: 'sand_worm', rare: true, rng: () => 0.1 })
    expect(elite.some((drop) => drop.itemId.startsWith('set_dune_'))).toBe(true)
    expect(rare.some((drop) => drop.itemId.startsWith('set_dune_'))).toBe(true)
  })
})
