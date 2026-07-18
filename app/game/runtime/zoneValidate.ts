// ================================================================================================
// Generic zone validation (Map Build Phase 0 — foundation)
//
// ONE validator for every kind of map the campaign will ship: legacy dungeon layouts, the Aethergate
// greybox, campaign ZoneDefinitions and Endless Tower room archetypes all reduce to the same shape —
// a walkability grid plus labelled points — and prove the same properties:
//   • spawn → objective → exit reachability (no soft-lock), by BFS
//   • no spawn region drowned in collision, and no spawn inside a safe pocket
// dungeonLayouts.ts delegates its BFS here (behavior unchanged, its tests still pass); new maps
// call this directly so reachability is proven by unit test BEFORE art exists (greybox-first).
//
// Also home of the reusable TILE CONTRACT vocabulary from CLAUDE_CODE_MAP_BUILD_PROMPT Phase 0:
// every authored tile/point in a production map declares one of these roles so validators, minimap,
// depth-sort and audio can consume map data without knowing the map.
// ================================================================================================

export interface GridXY { x: number; y: number }

/** Reusable tile/point roles every production map authors against (Phase 0 tile contract). */
export type ZoneTileRole =
  | 'ground'        // walkable base terrain
  | 'edge'          // walkable→blocked visual transition (cliff lip, waterline)
  | 'wall'          // full-height blocker with silhouette collision
  | 'blocker'       // sub-tile obstacle (rock, fence, furniture) — blocking prop
  | 'foreground'    // draws above actors (canopy, arch top) — never collides by itself
  | 'transition'    // biome/material blend tile — walkable unless paired with wall
  | 'prop'          // decorative, non-blocking
  | 'interaction'   // needs ≥1 clear adjacent tile (sign, chest, NPC, board)
  | 'spawn'         // player/monster spawn anchor
  | 'portal'        // zone exit/entry — must appear as a world-graph edge
  | 'secret'        // optional discoverable — must be reachable, may be gated
  | 'audio-region'  // ambience trigger area — no gameplay collision

/** Minimal walkability view of a map: dimensions + a blocked predicate. Out-of-bounds is blocked. */
export interface WalkGrid {
  cols: number
  rows: number
  /** true = cannot stand here. */
  blocked: (x: number, y: number) => boolean
}

/** Build a WalkGrid from a boolean collision matrix ([row][col], true = blocked). */
export function gridFromCollision(collision: boolean[][]): WalkGrid {
  const rows = collision.length
  const cols = rows > 0 ? collision[0].length : 0
  return {
    cols,
    rows,
    blocked: (x, y) => x < 0 || y < 0 || x >= cols || y >= rows || collision[y][x],
  }
}

/** Set of "x,y" tiles reachable on foot from `start` (4-neighbour BFS). */
export function reachableFrom(grid: WalkGrid, start: GridXY): Set<string> {
  const seen = new Set<string>()
  if (grid.blocked(start.x, start.y)) return seen
  const queue: GridXY[] = [start]
  seen.add(`${start.x},${start.y}`)
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  while (queue.length) {
    const cur = queue.shift()!
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      const key = `${nx},${ny}`
      if (seen.has(key) || grid.blocked(nx, ny)) continue
      seen.add(key)
      queue.push({ x: nx, y: ny })
    }
  }
  return seen
}

export interface ZonePoint {
  label: string
  at: GridXY
}

export interface ZoneReachabilityReport {
  ok: boolean
  entryWalkable: boolean
  unreachable: ZonePoint[]
}

/**
 * THE Phase-0 gate validator: proves every labelled objective/exit/secret is reachable on foot from
 * the entry. A map whose report is not ok must never ship — this runs in unit tests, before art.
 */
export function validateZoneReachability(grid: WalkGrid, entry: GridXY, targets: ZonePoint[]): ZoneReachabilityReport {
  const entryWalkable = !grid.blocked(entry.x, entry.y)
  const seen = reachableFrom(grid, entry)
  const unreachable = targets.filter((t) => !seen.has(`${t.at.x},${t.at.y}`))
  return { ok: entryWalkable && unreachable.length === 0, entryWalkable, unreachable }
}

/** Inclusive tile rect (matches SpawnBounds shape used across the runtime). */
export interface GridRect { minX: number; maxX: number; minY: number; maxY: number }

export interface SpawnRegionReport {
  ok: boolean
  /** walkable tiles inside the region that are NOT inside any safe rect. */
  usableTiles: number
  /** tiles requested by the region's population, for capacity comparison. */
  requested: number
  problems: string[]
}

/**
 * Proves a monster-spawn region can actually host its population: enough walkable tiles exist inside
 * the bounds, none of which sit inside a safe pocket (learning feedback must never be interrupted —
 * per-map design contract). Pure; drives unit tests for every authored spawn region.
 */
export function validateSpawnRegion(
  grid: WalkGrid,
  bounds: GridRect,
  requested: number,
  safeRects: GridRect[] = [],
): SpawnRegionReport {
  const problems: string[] = []
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) problems.push('empty bounds')
  let usableTiles = 0
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (grid.blocked(x, y)) continue
      if (safeRects.some((r) => x >= r.minX && x <= r.maxX && y >= r.minY && y <= r.maxY)) continue
      usableTiles++
    }
  }
  if (usableTiles < requested) problems.push(`region holds ${usableTiles} walkable tiles for ${requested} spawns`)
  return { ok: problems.length === 0, usableTiles, requested, problems }
}
