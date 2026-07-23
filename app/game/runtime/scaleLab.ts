// ================================================================================================
// Aethergate greybox + scale lab (Scale Phase S1 — CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT)
//
// PURE data + math for the map-dimension decision. The Aethergate town mockup is captured here as a
// NORMALIZED layout (0..1 coords traced from docs/mockups/.../aethergate-town-map.png: 12 buildings,
// central fountain plaza, event stage, north Gatehouse, south arrival gate, 4 waystones). A profile
// (M0/M1/M2) instantiates it onto a tile grid; BFS shortest paths then compute routeSec per key
// route at the REAL town walk speed — so candidate map sizes are compared with measured numbers,
// not impressions, and reachability is proven by the same zoneValidate proof all maps use.
//
// The mockup PNG itself is never loaded at runtime — this file is the tracing, which is the point.
// ================================================================================================
import {
  gridFromCollision, validateZoneReachability, type WalkGrid, type GridXY, type ZonePoint,
} from './zoneValidate'

/** Normalized rect in mockup space (x,y,w,h in 0..1 of the 1536×1024 board). */
export interface NormRect { x: number; y: number; w: number; h: number }
export interface NormPoint { x: number; y: number }

export interface GreyboxBuilding {
  id: string
  name: string
  rect: NormRect
  /** door point just outside the footprint (walkable, target of route measurement). */
  door: NormPoint
}

/** Traced from the approved Aethergate mockup (positions are the mockup's composition, not art). */
export const AETHERGATE_BUILDINGS: GreyboxBuilding[] = [
  { id: 'guild', name: "Adventurers' Guild", rect: { x: 0.06, y: 0.13, w: 0.17, h: 0.19 }, door: { x: 0.15, y: 0.34 } },
  { id: 'academy', name: 'Academy & Library', rect: { x: 0.28, y: 0.05, w: 0.14, h: 0.24 }, door: { x: 0.355, y: 0.31 } },
  { id: 'gatehouse', name: 'Tower Gatehouse', rect: { x: 0.435, y: 0.02, w: 0.13, h: 0.23 }, door: { x: 0.50, y: 0.27 } },
  { id: 'town-hall', name: 'Town Hall & Chronicle', rect: { x: 0.59, y: 0.05, w: 0.13, h: 0.23 }, door: { x: 0.67, y: 0.30 } },
  { id: 'hospital', name: 'Brightleaf Hospital', rect: { x: 0.78, y: 0.14, w: 0.15, h: 0.18 }, door: { x: 0.85, y: 0.34 } },
  { id: 'job-hall', name: 'Job Hall', rect: { x: 0.06, y: 0.41, w: 0.14, h: 0.16 }, door: { x: 0.13, y: 0.60 } },
  { id: 'forge', name: 'Forge & Craft Workshop', rect: { x: 0.215, y: 0.32, w: 0.12, h: 0.17 }, door: { x: 0.28, y: 0.51 } },
  { id: 'item-shop', name: 'General Goods Shop', rect: { x: 0.70, y: 0.385, w: 0.14, h: 0.21 }, door: { x: 0.77, y: 0.615 } },
  { id: 'bank', name: 'Bank & Storage', rect: { x: 0.77, y: 0.55, w: 0.16, h: 0.18 }, door: { x: 0.845, y: 0.75 } },
  { id: 'inn', name: 'Hearthsong Inn', rect: { x: 0.035, y: 0.645, w: 0.165, h: 0.165 }, door: { x: 0.12, y: 0.83 } },
  { id: 'lodge', name: 'Companion Lodge', rect: { x: 0.215, y: 0.625, w: 0.15, h: 0.21 }, door: { x: 0.29, y: 0.855 } },
  { id: 'tailor', name: 'Tailor & Wardrobe', rect: { x: 0.61, y: 0.645, w: 0.14, h: 0.19 }, door: { x: 0.68, y: 0.855 } },
]

/** Non-building blockers from the mockup: fountain core + event stage (walk around, not through). */
export const AETHERGATE_BLOCKERS: { id: string; rect: NormRect }[] = [
  { id: 'fountain', rect: { x: 0.465, y: 0.44, w: 0.075, h: 0.115 } },
  { id: 'stage', rect: { x: 0.53, y: 0.31, w: 0.12, h: 0.11 } },
]

/** Key walkable anchor points. Plaza ring sits just south of the fountain.
 *  `cadence` is the S2 pixel-cadence walk anchor — open ground on the south-gate corridor where
 *  an out-and-back walk of ~4 tiles in all 8 directions stays clear of building footprints. */
export const AETHERGATE_POINTS: Record<string, NormPoint> = {
  'south-gate': { x: 0.50, y: 0.93 },
  'plaza': { x: 0.50, y: 0.60 },
  'waystone-w': { x: 0.05, y: 0.095 },
  'waystone-e': { x: 0.945, y: 0.095 },
  'cadence': { x: 0.50, y: 0.78 },
  // S3 "side lane" scenario: the gap column between Academy and Gatehouse. x chosen so rounding
  // lands in the gap at all three profiles. NOTE (S3 finding): at M1 this gap is only 1 tile —
  // below the ≥2-tile secondary-path rule; production Aethergate must widen it (footprint tweak).
  'lane': { x: 0.4167, y: 0.15 },
}

/** Any greybox grid (town profile or interior spec) — what a GreyboxInstance carries. */
export interface GridProfile {
  id: string
  label: string
  cols: number
  rows: number
}

export interface ScaleProfile extends GridProfile {
  id: 'M0' | 'M1' | 'M2'
}

/** Candidate town dimensions from the scale prompt (TILE 32 ⇒ world px = cols×32 × rows×32). */
export const SCALE_PROFILES: ScaleProfile[] = [
  { id: 'M0', label: 'compact 48×36', cols: 48, rows: 36 },
  { id: 'M1', label: 'balanced 64×48', cols: 64, rows: 48 },
  { id: 'M2', label: 'spacious 80×60', cols: 80, rows: 60 },
]

export interface GreyboxInstance {
  profile: GridProfile
  grid: WalkGrid
  collision: boolean[][]
  /** named walkable anchors: spawn/plaza/waystones + door:<buildingId>. */
  points: Record<string, GridXY>
  buildings: { id: string; name: string; tx: number; ty: number; tw: number; th: number }[]
}

function toTile(p: NormPoint, cols: number, rows: number): GridXY {
  return {
    x: Math.min(cols - 2, Math.max(1, Math.round(p.x * cols))),
    y: Math.min(rows - 2, Math.max(1, Math.round(p.y * rows))),
  }
}

/** Instantiate the normalized layout on a profile's tile grid (border ring wall, south gate open). */
export function buildGreybox(profile: ScaleProfile): GreyboxInstance {
  const { cols, rows } = profile
  const collision: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))

  // border ring, with the south gate opening under the south-gate anchor
  const gate = toTile(AETHERGATE_POINTS['south-gate'], cols, rows)
  for (let x = 0; x < cols; x++) { collision[0][x] = true; collision[rows - 1][x] = true }
  for (let y = 0; y < rows; y++) { collision[y][0] = true; collision[y][cols - 1] = true }
  for (let x = gate.x - 1; x <= gate.x + 1; x++) collision[rows - 1][x] = false

  const buildings = AETHERGATE_BUILDINGS.map((b) => {
    const tx = Math.max(1, Math.round(b.rect.x * cols))
    const ty = Math.max(1, Math.round(b.rect.y * rows))
    const tw = Math.max(2, Math.round(b.rect.w * cols))
    const th = Math.max(2, Math.round(b.rect.h * rows))
    for (let y = ty; y < Math.min(rows - 1, ty + th); y++) {
      for (let x = tx; x < Math.min(cols - 1, tx + tw); x++) collision[y][x] = true
    }
    return { id: b.id, name: b.name, tx, ty, tw, th }
  })
  for (const bl of AETHERGATE_BLOCKERS) {
    const tx = Math.round(bl.rect.x * cols)
    const ty = Math.round(bl.rect.y * rows)
    for (let y = ty; y < Math.min(rows - 1, ty + Math.max(1, Math.round(bl.rect.h * rows))); y++) {
      for (let x = tx; x < Math.min(cols - 1, tx + Math.max(1, Math.round(bl.rect.w * cols))); x++) collision[y][x] = true
    }
  }

  const points: Record<string, GridXY> = {}
  for (const [id, p] of Object.entries(AETHERGATE_POINTS)) points[id] = toTile(p, cols, rows)
  for (const b of AETHERGATE_BUILDINGS) points[`door:${b.id}`] = toTile(b.door, cols, rows)
  // doors/anchors must be walkable even when rounding lands them inside a footprint edge
  for (const p of Object.values(points)) collision[p.y][p.x] = false

  return { profile, grid: gridFromCollision(collision), collision, points, buildings }
}

// ---- S3 interior greyboxes ---------------------------------------------------------------------
// Interior size classes from the S1 spec list (small shop / large guild), greyboxed so the S3
// matrix can judge hero scale + camera inside rooms (S0 issue #2: interior letterbox) per preset.

export const INTERIOR_SPECS: GridProfile[] = [
  { id: 'shop', label: 'small shop interior 14×10', cols: 14, rows: 10 },
  { id: 'guild', label: 'large guild interior 22×14', cols: 22, rows: 14 },
]

/** Simple readable room: border walls, 2-tile south door, service counter + a couple of props.
 *  Same GreyboxInstance shape as the town so the scene/validators render + prove it unchanged. */
export function buildInteriorGreybox(spec: GridProfile): GreyboxInstance {
  const { cols, rows } = spec
  const collision: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
  for (let x = 0; x < cols; x++) { collision[0]![x] = true; collision[rows - 1]![x] = true }
  for (let y = 0; y < rows; y++) { collision[y]![0] = true; collision[y]![cols - 1] = true }
  const doorX = Math.floor(cols / 2)
  collision[rows - 1]![doorX] = false
  collision[rows - 1]![doorX + 1] = false

  // counter across the top (1 tile of standing room behind), pillar props in the large room
  const buildings: GreyboxInstance['buildings'] = []
  const counterW = Math.max(3, Math.floor(cols / 3))
  const counterX = Math.floor((cols - counterW) / 2)
  for (let x = counterX; x < counterX + counterW; x++) collision[2]![x] = true
  buildings.push({ id: 'counter', name: spec.id === 'shop' ? 'Shop Counter' : 'Guild Desk', tx: counterX, ty: 2, tw: counterW, th: 1 })
  if (spec.id === 'guild') {
    for (const px of [Math.floor(cols * 0.25), Math.floor(cols * 0.75)]) {
      collision[Math.floor(rows / 2)]![px] = true
      buildings.push({ id: `pillar-${px}`, name: '', tx: px, ty: Math.floor(rows / 2), tw: 1, th: 1 })
    }
  }

  const points: Record<string, GridXY> = {
    'door': { x: doorX, y: rows - 2 },
    'center': { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
    'counter-front': { x: Math.floor(cols / 2), y: 3 },
  }
  for (const p of Object.values(points)) collision[p.y]![p.x] = false

  return { profile: spec, grid: gridFromCollision(collision), collision, points, buildings }
}

/** Reachability proof for an interior: the door reaches every anchor (no dead room). */
export function validateInteriorGreybox(instance: GreyboxInstance) {
  const targets: ZonePoint[] = Object.entries(instance.points)
    .filter(([id]) => id !== 'door')
    .map(([label, at]) => ({ label, at }))
  return validateZoneReachability(instance.grid, instance.points['door']!, targets)
}

/** BFS shortest path between two anchors as the full tile list, endpoints included
 *  (null = unreachable). The scale-lab browser scene walks this path at real speed. */
export function shortestPath(grid: WalkGrid, from: GridXY, to: GridXY): GridXY[] | null {
  if (grid.blocked(from.x, from.y) || grid.blocked(to.x, to.y)) return null
  const prev = new Map<string, string | null>([[`${from.x},${from.y}`, null]])
  const queue: GridXY[] = [from]
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur.x === to.x && cur.y === to.y) {
      const path: GridXY[] = []
      let key: string | null = `${to.x},${to.y}`
      while (key !== null) {
        const [x, y] = key.split(',').map(Number)
        path.push({ x: x!, y: y! })
        key = prev.get(key) ?? null
      }
      return path.reverse()
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx!
      const ny = cur.y + dy!
      const key = `${nx},${ny}`
      if (prev.has(key) || grid.blocked(nx, ny)) continue
      prev.set(key, `${cur.x},${cur.y}`)
      queue.push({ x: nx, y: ny })
    }
  }
  return null
}

/** BFS shortest walking distance in tiles between two anchors (null = unreachable). */
export function shortestPathTiles(grid: WalkGrid, from: GridXY, to: GridXY): number | null {
  const path = shortestPath(grid, from, to)
  return path ? path.length - 1 : null
}

export interface RouteMeasurement {
  route: string
  tiles: number
  px: number
  sec: number
}

export const TILE_PX = 32
/** Town walk speed — single source: scale contract (S4). Re-exported for the lab/tests. */
import { TOWN_SPEED } from '../scaleContract'
export { TOWN_SPEED }

/** Target bands from the scale prompt (repeat-visit travel). */
export const ROUTE_TARGETS: Record<string, [number, number]> = {
  'south-gate→plaza': [3, 6],
  'plaza→door:guild': [4, 10],
  'plaza→door:hospital': [4, 10],
  'plaza→door:item-shop': [4, 10],
  'plaza→door:gatehouse': [4, 10],
  'south-gate→door:guild': [0, 12],
  'south-gate→door:hospital': [0, 12],
  'door:inn→door:hospital': [15, 25],
}

/** Measure every target route on a profile. Deterministic; drives tests + the decision table. */
export function measureRoutes(instance: GreyboxInstance, speed: number = TOWN_SPEED): RouteMeasurement[] {
  return Object.keys(ROUTE_TARGETS).map((route) => {
    const [fromId, toId] = route.split('→')
    const tiles = shortestPathTiles(instance.grid, instance.points[fromId], instance.points[toId])
    const px = (tiles ?? Number.NaN) * TILE_PX
    return { route, tiles: tiles ?? -1, px, sec: Number((px / speed).toFixed(1)) }
  })
}

/** Reachability proof for a profile: spawn reaches every door + plaza + waystones (no soft-lock). */
export function validateGreybox(instance: GreyboxInstance) {
  const targets: ZonePoint[] = Object.entries(instance.points)
    .filter(([id]) => id !== 'south-gate')
    .map(([label, at]) => ({ label, at }))
  return validateZoneReachability(instance.grid, instance.points['south-gate'], targets)
}

// ================================================================================================
// S2 — character & camera profiles (CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT Phase S2)
// Pure math only: the browser scene renders these, the unit tests prove the numbers.
// Visual profiles must NEVER change speed/collider/physics — they only change display size/view.
// ================================================================================================
import { CLASS_SHEETS, HERO_SRC_H } from '../systems/heroFrames'

export interface HeroProfile {
  id: 'P0' | 'P1' | 'P2'
  label: string
  /** hero visual height in world px (source 96px scaled with nearest neighbor). */
  displayH: number
}

/** Candidate hero visual heights from the scale prompt (P3 adaptive = chosen size + view preset). */
export const HERO_PROFILES: HeroProfile[] = [
  { id: 'P0', label: 'control 48px (0.5×)', displayH: 48 },
  { id: 'P1', label: '44px', displayH: 44 },
  { id: 'P2', label: '40px', displayH: 40 },
]

export interface RowCadence {
  /** rendered source-row indices (nearest-neighbor sampling srcH→displayH). */
  kept: number[]
  /** distinct gaps between consecutive kept source rows — {2} = even; {2,3} = uneven cadence. */
  gapKinds: number[]
  /** true iff every kept row is the same distance apart → crisp, stable pixel cadence. */
  even: boolean
  dropped: number
}

/** Which source rows survive a nearest-neighbor downscale. Uneven gaps = the "uneven pixel
 *  cadence" the scale prompt warns about for 96px heroes at 44/40px: anatomy rows collapse
 *  irregularly and the collapse pattern crawls across walk frames. */
export function rowCadence(srcH: number, displayH: number): RowCadence {
  const kept: number[] = []
  for (let j = 0; j < displayH; j++) {
    const src = Math.min(srcH - 1, Math.floor(((j + 0.5) * srcH) / displayH))
    if (kept[kept.length - 1] !== src) kept.push(src)
  }
  const gaps = kept.slice(1).map((v, i) => v - kept[i]!)
  const gapKinds = [...new Set(gaps)].sort((a, b) => a - b)
  return { kept, gapKinds, even: gapKinds.length <= 1, dropped: srcH - kept.length }
}

/** Visual width band from the scale prompt: 0.65–0.85 tile depending on class/equipment. */
export const WIDTH_BAND_PX: [number, number] = [0.65 * TILE_PX, 0.85 * TILE_PX]

export interface ClassWidthRow { classKey: string; srcW: number; displayW: number; inBand: boolean }

/** Per-class visual width at a hero profile — which classes fall out of the readability band. */
export function classWidths(profile: HeroProfile): ClassWidthRow[] {
  return Object.entries(CLASS_SHEETS).map(([classKey, { fw, fh }]) => {
    const displayW = Number((fw * (profile.displayH / fh)).toFixed(1))
    return { classKey, srcW: fw, displayW, inBand: displayW >= WIDTH_BAND_PX[0] && displayW <= WIDTH_BAND_PX[1] }
  })
}

export interface ViewPreset {
  id: 'V0' | 'V1' | 'MZ' | 'MA'
  label: string
  viewportW: number
  /** 0 = adaptive: height resolved from the container aspect (portrait-mobile preset). */
  viewportH: number
  /** camera zoom (view-only — physics/speed/collider unchanged). */
  zoom: number
}

/** Camera/viewport alternatives. V1 answers the prompt's mandatory "keep hero 48 and show more
 *  world" test; MZ/MA are the P3-adaptive mobile presets (accessibility view, not physics). */
export const VIEW_PRESETS: ViewPreset[] = [
  { id: 'V0', label: 'current 640×480 zoom 1', viewportW: 640, viewportH: 480, zoom: 1 },
  { id: 'V1', label: 'hero48 wide 800×600 zoom 1', viewportW: 800, viewportH: 600, zoom: 1 },
  { id: 'MZ', label: 'mobile zoom 1.25 (view-only)', viewportW: 640, viewportH: 480, zoom: 1.25 },
  { id: 'MA', label: 'portrait-adaptive 480×(fit)', viewportW: 480, viewportH: 0, zoom: 1 },
]

/** Resolve the internal Phaser viewport for a preset inside a CSS container (MA adapts). */
export function resolveViewport(preset: ViewPreset, containerW: number, containerH: number): { w: number; h: number } {
  if (preset.viewportH > 0) return { w: preset.viewportW, h: preset.viewportH }
  const h = Math.round((preset.viewportW * containerH) / Math.max(1, containerW) / 2) * 2
  return { w: preset.viewportW, h: Math.min(1280, Math.max(320, h)) }
}

/** Scale.FIT CSS factor for an internal viewport inside a container. */
export function fitScale(viewportW: number, viewportH: number, containerW: number, containerH: number): number {
  return Math.min(containerW / viewportW, containerH / viewportH)
}

/** Physical on-screen hero height (CSS px) — the ≥28px mobile hard gate is checked against this. */
export function heroOnScreenPx(displayH: number, preset: ViewPreset, containerW: number, containerH: number): number {
  const { w, h } = resolveViewport(preset, containerW, containerH)
  return Number((displayH * preset.zoom * fitScale(w, h, containerW, containerH)).toFixed(1))
}
