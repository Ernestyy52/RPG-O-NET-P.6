import { describe, expect, it } from 'vitest'
import { ADVENTURE_ZONES, getAdventureZone, validateAdventureZones, zoneForRank, zonesForRegion } from '~/data/adventureZones'

describe('adventure zone graph', () => {
  it('gives every region a town, at least three fields, a dungeon, and a boss', () => {
    expect(ADVENTURE_ZONES).toHaveLength(60)
    expect(validateAdventureZones()).toEqual([])
    expect(zonesForRegion('verdant-frontier').filter((zone) => zone.kind === 'field')).toHaveLength(3)
  })

  it('maps legacy Adventure Rank onto a useful world node', () => {
    expect(zoneForRank(1).id).toBe('aethergate')
    expect(zoneForRank(2).id).toBe('whisperleaf-meadow')
    expect(zoneForRank(8).id).toBe('deepgrove')
    expect(zoneForRank(100).kind).toBe('boss')
  })

  it('keeps every connection valid', () => {
    for (const zone of ADVENTURE_ZONES) {
      for (const connection of zone.connections) expect(getAdventureZone(connection).id).toBe(connection)
    }
  })
})
