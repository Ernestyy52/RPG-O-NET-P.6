// ================================================================================================
// ZoneDefinition (Phase 08)
//
// The zone layout as framework-agnostic DATA — dimensions, wall ring, tree obstacles, boss door,
// player start, and the monster spawn region. Extracted from the constants baked into TowerScene.create
// so the layout has a single source of truth the future runtime scene can render. This phase does NOT
// rebuild the rendered world (Phase 08 gate: "no full world rebuild yet"); it centralizes the numbers.
// ================================================================================================

/** Tile size in px. */
export const TILE = 32
/** Zone width/height in tiles. */
export const MAP_W = 24
export const MAP_H = 18

export interface TileXY {
  x: number
  y: number
}

/** Inclusive tile bounds of the walkable monster-spawn region (matches rollMonsterSpawns). */
export interface SpawnBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface ZoneDefinition {
  tile: number
  cols: number
  rows: number
  /** border wall tile coordinates. */
  walls: TileXY[]
  /** decorative + blocking tree tile coordinates. */
  treeSpots: TileXY[]
  /** boss door position in px. */
  door: { x: number; y: number }
  /** player spawn position in px. */
  playerStart: { x: number; y: number }
  spawnBounds: SpawnBounds
}

/** Fixed tree obstacle tiles (legacy TowerScene layout). */
export const TREE_SPOTS: TileXY[] = [
  { x: 4, y: 6 }, { x: 10, y: 5 }, { x: 6, y: 9 }, { x: 3, y: 12 }, { x: 18, y: 7 },
  { x: 20, y: 12 }, { x: 15, y: 14 }, { x: 8, y: 14 }, { x: 21, y: 15 }, { x: 13, y: 10 },
]

/** Spawn region used by the monster placement algorithm (unchanged from legacy). */
export const SPAWN_BOUNDS: SpawnBounds = { minX: 3, maxX: MAP_W - 3, minY: 5, maxY: MAP_H - 3 }

function borderWalls(cols: number, rows: number): TileXY[] {
  const walls: TileXY[] = []
  for (let x = 0; x < cols; x++) {
    walls.push({ x, y: 0 })
    walls.push({ x, y: rows - 1 })
  }
  for (let y = 1; y < rows - 1; y++) {
    walls.push({ x: 0, y })
    walls.push({ x: cols - 1, y })
  }
  return walls
}

/** Build the standard tower-floor zone layout. Pure — no rendering, just the data. */
export function buildZoneDefinition(): ZoneDefinition {
  return {
    tile: TILE,
    cols: MAP_W,
    rows: MAP_H,
    walls: borderWalls(MAP_W, MAP_H),
    treeSpots: TREE_SPOTS,
    door: { x: (MAP_W / 2) * TILE, y: TILE * 1.6 },
    playerStart: { x: TILE * 2, y: TILE * (MAP_H - 2) },
    spawnBounds: SPAWN_BOUNDS,
  }
}
