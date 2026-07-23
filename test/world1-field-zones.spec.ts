import { describe, expect, it } from 'vitest'
import { WORLD1_FIELD_ZONES, getWorld1FieldZone, validateWorld1FieldZones } from '~/data/world1/fieldZones'
import { getAdventureZone } from '~/data/adventureZones'

describe('World-1 authored field route', () => {
  it('defines three distinct, reachable fields', () => {
    expect(WORLD1_FIELD_ZONES.map((zone) => zone.id)).toEqual([
      'whisperleaf-meadow', 'mosswood-trail', 'deepgrove',
    ])
    expect(validateWorld1FieldZones()).toEqual([])

    const signatures = WORLD1_FIELD_ZONES.map((zone) =>
      zone.obstacles.map((tile) => `${tile.x},${tile.y}`).sort().join('|'),
    )
    expect(new Set(signatures).size).toBe(WORLD1_FIELD_ZONES.length)
  })

  it('uses the canonical monster roster and valid connected destinations', () => {
    for (const field of WORLD1_FIELD_ZONES) {
      expect(field.monsterIds).toEqual(getAdventureZone(field.id).monsterIds)
      for (const exit of field.exits) {
        const target = getAdventureZone(exit.targetZoneId)
        expect(target.id).toBe(exit.targetZoneId)
        if (exit.mode === 'dungeon') expect(exit.layoutId).toMatch(/^world01-(mini|main)$/)
      }
    }
  })

  it('gates only forward story routes and keeps every retreat open', () => {
    const meadow = getWorld1FieldZone('whisperleaf-meadow')!
    const mosswood = getWorld1FieldZone('mosswood-trail')!
    const deepgrove = getWorld1FieldZone('deepgrove')!

    expect(meadow.exits.find((exit) => exit.targetZoneId === 'aethergate')?.requiredQuestStep).toBeUndefined()
    expect(meadow.exits.find((exit) => exit.targetZoneId === 'mosswood-trail')?.requiredQuestStep).toBe(4)
    expect(mosswood.exits.find((exit) => exit.targetZoneId === 'rootcellar-hollow')?.requiredQuestStep).toBe(5)
    expect(mosswood.exits.find((exit) => exit.targetZoneId === 'deepgrove')?.requiredQuestStep).toBe(8)
    expect(deepgrove.exits.find((exit) => exit.targetZoneId === 'myco-sanctum')?.requiredQuestStep).toBe(9)
  })
})
