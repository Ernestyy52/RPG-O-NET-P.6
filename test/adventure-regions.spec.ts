import { describe, expect, it } from 'vitest'
import {
  ADVENTURE_REGIONS, explorationZoneForRegion, regionForFloor, regionUnlocked,
} from '~/data/adventureRegions'

describe('adventure world model', () => {
  it('covers all 100 progression ranks with connected regions', () => {
    expect(ADVENTURE_REGIONS).toHaveLength(10)
    for (let floor = 1; floor <= 100; floor++) {
      const region = regionForFloor(floor)
      expect(floor).toBeGreaterThanOrEqual(region.floorFrom)
      expect(floor).toBeLessThanOrEqual(region.floorTo)
    }
  })

  it('unlocks regions through adventure progression, not ranked tower progress', () => {
    expect(regionUnlocked(ADVENTURE_REGIONS[0]!, 1)).toBe(true)
    expect(regionUnlocked(ADVENTURE_REGIONS[1]!, 10)).toBe(false)
    expect(regionUnlocked(ADVENTURE_REGIONS[1]!, 11)).toBe(true)
  })

  it('clamps exploration destinations to their region', () => {
    const marsh = ADVENTURE_REGIONS[2]!
    expect(explorationZoneForRegion(marsh, 1)).toBe(marsh.floorFrom)
    expect(explorationZoneForRegion(marsh, 99)).toBe(marsh.floorTo)
  })
})
