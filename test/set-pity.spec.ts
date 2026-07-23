import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { rollLoot, setPityThreshold } from '~/data/loot'
import { usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

describe('monster set-drop pity', () => {
  it('uses a stable threshold between 15 and 20 kills', () => {
    for (const id of ['big_slime', 'sand_worm', 'ice_robot', 'kraken']) {
      expect(setPityThreshold(id)).toBeGreaterThanOrEqual(15)
      expect(setPityThreshold(id)).toBeLessThanOrEqual(20)
      expect(setPityThreshold(id)).toBe(setPityThreshold(id))
    }
  })

  it('guarantees a missing set piece at the threshold even when chance fails', () => {
    const threshold = setPityThreshold('big_slime')
    const drops = rollLoot(1, false, {
      monsterId: 'big_slime',
      setPityCount: threshold - 1,
      ownedItemIds: ['set_verdant_weapon'],
      rng: () => 0.99,
    })
    const guaranteed = drops.find((drop) => drop.guaranteed)
    expect(guaranteed?.itemId.startsWith('set_verdant_')).toBe(true)
    expect(guaranteed?.itemId).not.toBe('set_verdant_weapon')
  })

  it('tracks misses and resets immediately after a set drop', () => {
    const player = usePlayerStore()
    player.currentFloor = 1
    expect(player.recordSetHunt('big_slime', false)).toBe(1)
    expect(player.recordSetHunt('big_slime', false)).toBe(2)
    expect(player.recordSetHunt('big_slime', true)).toBe(0)
    expect(player.recordSetHunt('slime', false)).toBe(0)
  })
})
