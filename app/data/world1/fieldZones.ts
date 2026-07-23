import type { World1DungeonId } from './quests'

export type World1FieldZoneId = 'whisperleaf-meadow' | 'mosswood-trail' | 'deepgrove'
export type World1TravelMode = 'town' | 'adventure' | 'dungeon'

export interface FieldTile { x: number; y: number }

export interface World1FieldExit {
  id: string
  at: FieldTile
  targetZoneId: string
  mode: World1TravelMode
  label: string
  labelTh: string
  layoutId?: World1DungeonId
  /** Main-quest step that must be active or completed before this forward route opens. */
  requiredQuestStep?: number
}

export interface World1FieldLandmark {
  id: string
  at: FieldTile
  name: string
  nameTh: string
  tint: number
}

export interface World1FieldDefinition {
  id: World1FieldZoneId
  name: string
  nameTh: string
  rank: number
  cols: number
  rows: number
  playerStart: FieldTile
  entryBySource: Partial<Record<string, FieldTile>>
  spawnBounds: { minX: number; maxX: number; minY: number; maxY: number }
  monsterIds: string[]
  monsterCount: number
  obstacles: FieldTile[]
  exits: World1FieldExit[]
  landmarks: World1FieldLandmark[]
  objective: string
  tint: number
}

const SIZE = { cols: 24, rows: 18 } as const

/**
 * The three authored World-1 hunting fields. They deliberately share the proven 24x18 runtime grid,
 * but not their routes: the meadow is open, Mosswood is a winding trail, and Deepgrove forms a ring
 * around the Moonroot. Keeping this as pure data makes reachability and future Tiled conversion safe.
 */
export const WORLD1_FIELD_ZONES: readonly World1FieldDefinition[] = [
  {
    id: 'whisperleaf-meadow', name: 'Whisperleaf Meadow', nameTh: 'ทุ่งใบไม้กระซิบ', rank: 1, ...SIZE,
    playerStart: { x: 12, y: 15 },
    entryBySource: { aethergate: { x: 12, y: 15 }, 'mosswood-trail': { x: 20, y: 8 } },
    spawnBounds: { minX: 3, maxX: 20, minY: 3, maxY: 14 },
    monsterIds: ['slime', 'frog_monster'], monsterCount: 12,
    obstacles: [
      { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 11, y: 4 }, { x: 12, y: 4 },
      { x: 18, y: 3 }, { x: 19, y: 3 }, { x: 3, y: 7 }, { x: 20, y: 6 },
      { x: 6, y: 10 }, { x: 17, y: 11 }, { x: 4, y: 14 }, { x: 19, y: 14 },
    ],
    exits: [
      { id: 'meadow-town', at: { x: 12, y: 16 }, targetZoneId: 'aethergate', mode: 'town', label: 'Aethergate', labelTh: 'กลับเมือง' },
      { id: 'meadow-mosswood', at: { x: 22, y: 8 }, targetZoneId: 'mosswood-trail', mode: 'adventure', label: 'Mosswood Trail', labelTh: 'ทางป่ามอส', requiredQuestStep: 4 },
    ],
    landmarks: [{ id: 'old-windmill', at: { x: 8, y: 7 }, name: 'Old Windmill', nameTh: 'กังหันเก่า', tint: 0xf2d28a }],
    objective: 'Train against Slimes and Frogs, then follow the eastern road to Mosswood.', tint: 0x8fcf7a,
  },
  {
    id: 'mosswood-trail', name: 'Mosswood Trail', nameTh: 'ทางเดินป่ามอส', rank: 5, ...SIZE,
    playerStart: { x: 3, y: 8 },
    entryBySource: {
      'whisperleaf-meadow': { x: 3, y: 8 }, deepgrove: { x: 20, y: 8 }, 'rootcellar-hollow': { x: 12, y: 4 },
    },
    spawnBounds: { minX: 3, maxX: 20, minY: 3, maxY: 14 },
    monsterIds: ['nature_slime', 'mushroom_monster'], monsterCount: 14,
    obstacles: [
      { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 14, y: 2 }, { x: 15, y: 2 },
      { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 18, y: 4 }, { x: 19, y: 4 },
      { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 14, y: 7 }, { x: 15, y: 7 },
      { x: 3, y: 10 }, { x: 4, y: 10 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 18, y: 10 }, { x: 19, y: 10 },
      { x: 6, y: 12 }, { x: 7, y: 12 }, { x: 14, y: 13 }, { x: 15, y: 13 },
      { x: 3, y: 15 }, { x: 4, y: 15 }, { x: 10, y: 15 }, { x: 11, y: 15 }, { x: 18, y: 15 }, { x: 19, y: 15 },
    ],
    exits: [
      { id: 'mosswood-meadow', at: { x: 1, y: 8 }, targetZoneId: 'whisperleaf-meadow', mode: 'adventure', label: 'Whisperleaf', labelTh: 'กลับทุ่ง' },
      { id: 'mosswood-deepgrove', at: { x: 22, y: 8 }, targetZoneId: 'deepgrove', mode: 'adventure', label: 'Deepgrove', labelTh: 'พงไพรชั้นใน', requiredQuestStep: 8 },
      { id: 'mosswood-rootcellar', at: { x: 12, y: 1 }, targetZoneId: 'rootcellar-hollow', mode: 'dungeon', layoutId: 'world01-mini', label: 'Rootcellar Hollow', labelTh: 'โพรงรากไม้', requiredQuestStep: 5 },
    ],
    landmarks: [{ id: 'moss-shrine', at: { x: 12, y: 11 }, name: 'Moss Shrine', nameTh: 'ศาลเจ้ามอส', tint: 0x8de0b0 }],
    objective: 'Find the Rootcellar gate, defeat its guardians, and earn passage to Deepgrove.', tint: 0x5c9d6e,
  },
  {
    id: 'deepgrove', name: 'Deepgrove', nameTh: 'พงไพรชั้นใน', rank: 8, ...SIZE,
    playerStart: { x: 12, y: 15 },
    entryBySource: { 'mosswood-trail': { x: 12, y: 15 }, 'myco-sanctum': { x: 12, y: 3 } },
    spawnBounds: { minX: 3, maxX: 20, minY: 3, maxY: 14 },
    monsterIds: ['big_slime', 'forest_lizard'], monsterCount: 14,
    obstacles: [
      { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 16, y: 3 }, { x: 17, y: 3 },
      { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 18, y: 5 }, { x: 19, y: 5 },
      { x: 4, y: 9 }, { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 14, y: 8 }, { x: 15, y: 8 }, { x: 19, y: 9 },
      { x: 8, y: 9 }, { x: 15, y: 9 }, { x: 8, y: 10 }, { x: 15, y: 10 },
      { x: 4, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 }, { x: 12, y: 12 }, { x: 13, y: 12 }, { x: 19, y: 12 },
      { x: 6, y: 14 }, { x: 7, y: 14 }, { x: 16, y: 14 }, { x: 17, y: 14 },
    ],
    exits: [
      { id: 'deepgrove-mosswood', at: { x: 12, y: 16 }, targetZoneId: 'mosswood-trail', mode: 'adventure', label: 'Mosswood Trail', labelTh: 'กลับทางป่า' },
      { id: 'deepgrove-sanctum', at: { x: 12, y: 1 }, targetZoneId: 'myco-sanctum', mode: 'dungeon', layoutId: 'world01-main', label: 'Myco Sanctum', labelTh: 'วิหารราชันเห็ด', requiredQuestStep: 9 },
    ],
    landmarks: [{ id: 'moonroot-tree', at: { x: 12, y: 9 }, name: 'Moonroot Tree', nameTh: 'ต้นมูนรูท', tint: 0xb7a2ff }],
    objective: 'Hunt the rare forest beasts and break through the Colossus Approach.', tint: 0x3e7958,
  },
] as const

export function getWorld1FieldZone(id: string | undefined): World1FieldDefinition | undefined {
  return WORLD1_FIELD_ZONES.find((zone) => zone.id === id)
}

function tileKey(tile: FieldTile): string { return `${tile.x},${tile.y}` }

/** Pure data validation used by tests and future map tooling. */
export function validateWorld1FieldZones(): string[] {
  const errors: string[] = []
  const ids = new Set(WORLD1_FIELD_ZONES.map((zone) => zone.id))
  if (ids.size !== WORLD1_FIELD_ZONES.length) errors.push('field ids must be unique')
  for (const zone of WORLD1_FIELD_ZONES) {
    const blocked = new Set(zone.obstacles.map(tileKey))
    const points = [zone.playerStart, ...Object.values(zone.entryBySource), ...zone.exits.map((exit) => exit.at), ...zone.landmarks.map((landmark) => landmark.at)]
    if (blocked.size !== zone.obstacles.length) errors.push(`${zone.id}: duplicate obstacle`)
    for (const point of points) {
      if (!point) continue
      if (point.x <= 0 || point.y <= 0 || point.x >= zone.cols - 1 || point.y >= zone.rows - 1) errors.push(`${zone.id}: point outside walkable border ${tileKey(point)}`)
      if (blocked.has(tileKey(point))) errors.push(`${zone.id}: point blocked ${tileKey(point)}`)
    }
    if (zone.monsterIds.length < 2) errors.push(`${zone.id}: needs at least two monster species`)

    const seen = new Set<string>([tileKey(zone.playerStart)])
    const queue = [zone.playerStart]
    while (queue.length) {
      const current = queue.shift()!
      for (const next of [{ x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y }, { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }]) {
        const key = tileKey(next)
        if (next.x <= 0 || next.y <= 0 || next.x >= zone.cols - 1 || next.y >= zone.rows - 1 || blocked.has(key) || seen.has(key)) continue
        seen.add(key); queue.push(next)
      }
    }
    for (const exit of zone.exits) if (!seen.has(tileKey(exit.at))) errors.push(`${zone.id}: unreachable exit ${exit.id}`)
    for (const landmark of zone.landmarks) if (!seen.has(tileKey(landmark.at))) errors.push(`${zone.id}: unreachable landmark ${landmark.id}`)
  }
  return errors
}
