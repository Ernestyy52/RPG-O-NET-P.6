import { describe, it, expect } from 'vitest'
import { WORLD_GRAPH, validateWorldGraph, locationFromFloor } from '~/game/runtime/worldGraph'

describe('world graph (Phase 2 core architecture)', () => {
  it('graph is valid: no dangling edges, every zone reachable from town AND can return', () => {
    expect(validateWorldGraph()).toEqual([])
  })

  it('validator catches a soft-locking zone (no way back to town)', () => {
    const broken = {
      zones: [...WORLD_GRAPH.zones, { id: 'pit', kind: 'dungeon' as const, name: 'Pit', sceneKey: 'DungeonScene' as const }],
      edges: [...WORLD_GRAPH.edges, { from: 'town', to: 'pit', via: 'hole' }], // ทางเข้าอย่างเดียว
    }
    const problems = validateWorldGraph(broken)
    expect(problems.some((p) => p.includes('pit') && p.includes('soft-lock'))).toBe(true)
  })

  it('validator catches dangling edge targets', () => {
    const broken = { zones: WORLD_GRAPH.zones, edges: [...WORLD_GRAPH.edges, { from: 'town', to: 'nowhere', via: '?' }] }
    expect(validateWorldGraph(broken).some((p) => p.includes('unknown target'))).toBe(true)
  })

  it('locationFromFloor: town floors map to town zone, others carry towerFloor', () => {
    expect(locationFromFloor(1)).toMatchObject({ zoneId: 'town', towerFloor: undefined })
    expect(locationFromFloor(11)).toMatchObject({ zoneId: 'town' })
    expect(locationFromFloor(7)).toMatchObject({ zoneId: 'tower', towerFloor: 7, progressionRank: 7 })
  })
})
