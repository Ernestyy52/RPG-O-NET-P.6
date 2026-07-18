// ================================================================================================
// Dungeon layout configs (Phase 14, Increment 2) — PURE DATA + COLLISION, no Phaser.
//
// World 1 has two dungeon interiors, rendered by the standalone DungeonScene (see PHASE_14_PLAN §2):
//   - world01-mini : floor-5 sub-boss chamber (small)
//   - world01-main : floor-10 pre-boss approach (larger; 2 elites + boss gate)
//
// Both are two data-only LAYOUT CONFIGS of one scene. Collision derives from `wallGrid` + blocking
// props via `buildCollisionMap`, and `layoutReachability` proves (by BFS) that entry, exit, boss gate,
// elites, and every secret are mutually reachable — i.e. no soft lock is provable by unit test, not
// only by playthrough (Gate: "no soft lock").
//
// Tile frame indices are placeholders-by-position here; the visual slicing of the tiny-dungeon /
// walls_floor sheets is finalized in the renderer. Tests assert STRUCTURE (walkable vs blocked,
// reachability), which is frame-index-independent.
// ================================================================================================

import type { TileXY, SpawnBounds } from './zone'
import { gridFromCollision, reachableFrom, validateZoneReachability } from './zoneValidate'

export type DungeonLayoutId = 'world01-mini' | 'world01-main'

export interface DungeonProp {
  x: number
  y: number
  frame: number
  blocking: boolean
  sheet: 'dungeon' | 'guildhall'
}

export interface DungeonSpawn {
  slug: string
  count: number
  bounds: SpawnBounds
}

export interface DungeonSecret {
  at: TileXY
  kind: 'alcove' | 'chest' | 'inscription'
  id: string
}

export interface DungeonElite {
  slug: string
  at: TileXY
}

export interface DungeonLayoutConfig {
  id: DungeonLayoutId
  /** English + Thai banner name. */
  name: string
  nameTh: string
  cols: number
  rows: number
  /** tiny-dungeon frame index per tile (floor). */
  floorGrid: number[][]
  /** walls_floor frame index, or null = walkable. */
  wallGrid: (number | null)[][]
  props: DungeonProp[]
  torches: TileXY[]
  /** player spawn tile. */
  entry: TileXY
  /** exit tile — walking onto it returns to the owning tower floor. */
  exit: TileXY
  spawns: DungeonSpawn[]
  elites: DungeonElite[]
  /** world01-main only — walking onto it hands off to BossScene. */
  bossGate?: TileXY
  secrets: DungeonSecret[]
}

// ---- pure builders (deterministic; produce the grid arrays) ------------------------------------

const FLOOR_FRAME = 1
const WALL_FRAME = 0

interface Rect { x: number; y: number; w: number; h: number }

function makeFloorGrid(cols: number, rows: number): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => FLOOR_FRAME))
}

/**
 * Border ring of walls + interior wall rectangles. Key tiles passed in `keepOpen` are always forced
 * walkable (null) so obstacle authoring can never accidentally seal an objective.
 */
function makeWallGrid(cols: number, rows: number, interior: Rect[], keepOpen: TileXY[]): (number | null)[][] {
  const grid: (number | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as number | null),
  )
  for (let x = 0; x < cols; x++) {
    grid[0][x] = WALL_FRAME
    grid[rows - 1][x] = WALL_FRAME
  }
  for (let y = 0; y < rows; y++) {
    grid[y][0] = WALL_FRAME
    grid[y][cols - 1] = WALL_FRAME
  }
  for (const r of interior) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y > 0 && y < rows - 1 && x > 0 && x < cols - 1) grid[y][x] = WALL_FRAME
      }
    }
  }
  for (const t of keepOpen) {
    if (t.y >= 0 && t.y < rows && t.x >= 0 && t.x < cols) grid[t.y][t.x] = null
  }
  return grid
}

// ---- layout: world01-mini (floor-5 sub-boss chamber) -------------------------------------------

function buildMini(): DungeonLayoutConfig {
  const cols = 18
  const rows = 14
  const entry: TileXY = { x: 2, y: rows - 2 }
  const exit: TileXY = { x: 2, y: rows - 2 } // same door returns to the tower floor
  const secret: DungeonSecret = { at: { x: cols - 2, y: 1 }, kind: 'alcove', id: 'w1-mini-alcove' }
  // two short pillars framing the chamber, never sealing a corridor
  const interior: Rect[] = [
    { x: 6, y: 4, w: 1, h: 3 },
    { x: 11, y: 7, w: 1, h: 3 },
  ]
  const keepOpen = [entry, exit, secret.at, { x: cols - 2, y: 2 }]
  return {
    id: 'world01-mini',
    name: 'Sporebloom Hollow',
    nameTh: 'โพรงสปอร์',
    cols,
    rows,
    floorGrid: makeFloorGrid(cols, rows),
    wallGrid: makeWallGrid(cols, rows, interior, keepOpen),
    props: [
      { x: 4, y: 3, frame: 12, blocking: true, sheet: 'dungeon' },
      { x: cols - 4, y: rows - 4, frame: 12, blocking: true, sheet: 'dungeon' },
    ],
    torches: [{ x: 1, y: 1 }, { x: cols - 2, y: 1 }, { x: 1, y: rows - 2 }],
    entry,
    exit,
    spawns: [
      { slug: 'slime', count: 3, bounds: { minX: 4, maxX: cols - 3, minY: 3, maxY: rows - 3 } },
      { slug: 'nature_slime', count: 2, bounds: { minX: 5, maxX: cols - 3, minY: 3, maxY: rows - 4 } },
    ],
    elites: [],
    secrets: [secret],
  }
}

// ---- layout: world01-main (floor-10 pre-boss approach) -----------------------------------------

function buildMain(): DungeonLayoutConfig {
  const cols = 28
  const rows = 22
  const entry: TileXY = { x: 2, y: rows - 2 }
  const exit: TileXY = { x: 2, y: rows - 2 }
  const bossGate: TileXY = { x: Math.floor(cols / 2), y: 1 }
  const elites: DungeonElite[] = [
    { slug: 'nature_slime', at: { x: 7, y: rows - 8 } },
    { slug: 'mushroom_monster', at: { x: cols - 8, y: 6 } },
  ]
  const secrets: DungeonSecret[] = [
    { at: { x: cols - 2, y: rows - 2 }, kind: 'chest', id: 'w1-main-chest' },
    { at: { x: 2, y: 1 }, kind: 'inscription', id: 'w1-main-inscription' },
  ]
  // interior obstacles: a few wall segments creating a winding route (never sealing key tiles)
  const interior: Rect[] = [
    { x: 5, y: 4, w: 8, h: 1 },
    { x: 15, y: 8, w: 8, h: 1 },
    { x: 9, y: 12, w: 10, h: 1 },
    { x: 5, y: 16, w: 1, h: 4 },
    { x: cols - 6, y: 12, w: 1, h: 6 },
  ]
  const keepOpen: TileXY[] = [
    entry, exit, bossGate, { x: bossGate.x, y: 2 },
    ...elites.map((e) => e.at),
    ...secrets.map((s) => s.at),
    { x: cols - 2, y: rows - 3 }, { x: 2, y: 2 },
  ]
  return {
    id: 'world01-main',
    name: 'Colossus Approach',
    nameTh: 'ทางสู่จอมอสูร',
    cols,
    rows,
    floorGrid: makeFloorGrid(cols, rows),
    wallGrid: makeWallGrid(cols, rows, interior, keepOpen),
    props: [
      { x: bossGate.x - 2, y: 3, frame: 12, blocking: true, sheet: 'dungeon' },
      { x: bossGate.x + 2, y: 3, frame: 12, blocking: true, sheet: 'dungeon' },
    ],
    torches: [
      { x: 1, y: 1 }, { x: cols - 2, y: 1 }, { x: 1, y: rows - 2 }, { x: cols - 2, y: rows - 2 },
      { x: bossGate.x - 3, y: 2 }, { x: bossGate.x + 3, y: 2 },
    ],
    entry,
    exit,
    spawns: [
      { slug: 'slime', count: 4, bounds: { minX: 3, maxX: cols - 3, minY: 3, maxY: rows - 3 } },
      { slug: 'big_slime', count: 2, bounds: { minX: 4, maxX: cols - 4, minY: 4, maxY: rows - 4 } },
      { slug: 'frog_monster', count: 2, bounds: { minX: 4, maxX: cols - 4, minY: 4, maxY: rows - 5 } },
    ],
    elites,
    bossGate,
    secrets,
  }
}

const LAYOUTS: Record<DungeonLayoutId, DungeonLayoutConfig> = {
  'world01-mini': buildMini(),
  'world01-main': buildMain(),
}

export function getDungeonLayout(id: DungeonLayoutId): DungeonLayoutConfig {
  return LAYOUTS[id]
}

export const DUNGEON_LAYOUT_IDS: DungeonLayoutId[] = ['world01-mini', 'world01-main']

// ---- collision + reachability (pure) -----------------------------------------------------------

/** true = blocked (wall or blocking prop). Grid is [row][col] to match wallGrid. */
export function buildCollisionMap(config: DungeonLayoutConfig): boolean[][] {
  const map: boolean[][] = config.wallGrid.map((row) => row.map((cell) => cell !== null))
  for (const p of config.props) {
    if (p.blocking && p.y >= 0 && p.y < config.rows && p.x >= 0 && p.x < config.cols) {
      map[p.y][p.x] = true
    }
  }
  return map
}

export function isBlocked(config: DungeonLayoutConfig, x: number, y: number, collision = buildCollisionMap(config)): boolean {
  if (x < 0 || y < 0 || x >= config.cols || y >= config.rows) return true
  return collision[y][x]
}

/** Set of "x,y" tiles reachable on foot from `start` (delegates to the generic zone validator). */
export function reachableTiles(config: DungeonLayoutConfig, start: TileXY, collision = buildCollisionMap(config)): Set<string> {
  return reachableFrom(gridFromCollision(collision), start)
}

export interface ReachabilityReport {
  ok: boolean
  entryWalkable: boolean
  unreachable: { label: string; at: TileXY }[]
}

/** Proves every objective tile is reachable from the entry. Drives the no-soft-lock unit test.
 *  Since Map Build Phase 0 this is a thin adapter over validateZoneReachability (zoneValidate.ts) —
 *  the SAME validator campaign maps and Tower rooms use, so all map kinds share one proof. */
export function layoutReachability(config: DungeonLayoutConfig): ReachabilityReport {
  const targets: { label: string; at: TileXY }[] = [
    { label: 'exit', at: config.exit },
    ...(config.bossGate ? [{ label: 'bossGate', at: config.bossGate }] : []),
    ...config.elites.map((e, i) => ({ label: `elite:${e.slug}#${i}`, at: e.at })),
    ...config.secrets.map((s) => ({ label: `secret:${s.id}`, at: s.at })),
  ]
  return validateZoneReachability(gridFromCollision(buildCollisionMap(config)), config.entry, targets)
}
