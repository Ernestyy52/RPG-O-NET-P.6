// ================================================================================================
// Floor variety (S-grade gameplay pass) — seeded per-floor layouts, modifiers, and biome decor.
//
// Kills the "same room ×100" feel: every floor gets its OWN deterministic obstacle layout, an
// optional floor modifier (calm/swarm/mist/treasure), and biome-matched foliage — all pure
// functions of the floor number, so the same floor always looks the same (shareable, testable,
// and consistent for every player/session; the multiplayer seed path is unaffected).
//
// Safety-by-construction: obstacles keep pairwise Chebyshev distance ≥ 2 (every obstacle is an
// isolated single cell with all 8 neighbours free) and stay out of protected zones (player spawn,
// boss door, dungeon entry, top door row) — an open field with isolated cells can always be walked
// around, so no layout can soft-lock. Asserted in test/floor-features.spec.ts.
//
// Flag-gated per constitution rule 6: FLOOR_VARIETY_ENABLED=false restores the legacy fixed layout.
// ================================================================================================
import { mulberry32 } from '~/data/learning/rng'
import { isTownFloor } from '~/data/floors'

export const FLOOR_VARIETY_ENABLED = true

export interface TileSpot { x: number; y: number }
export interface GridOpts { w: number; h: number }

/** Default grid = the tower field (app/game/runtime/zone.ts: 24×18). */
export const DEFAULT_GRID: GridOpts = { w: 24, h: 18 }

// ---- protected zones (tile coords) — must stay clear of obstacles/chests/decor -----------------
function protectedZones(o: GridOpts): { x: number; y: number; r: number }[] {
  const cx = Math.floor(o.w / 2)
  return [
    { x: 2, y: o.h - 2, r: 3 },        // player spawn (bottom-left)
    { x: cx, y: 2, r: 3 },             // boss door (top-center)
    { x: cx, y: o.h - 4, r: 2 },       // World-1 dungeon entry (mid-bottom)
  ]
}

function isProtected(x: number, y: number, zones: { x: number; y: number; r: number }[]): boolean {
  return zones.some((z) => Math.max(Math.abs(x - z.x), Math.abs(y - z.y)) <= z.r)
}

/**
 * Deterministic obstacle spots for a floor (trees/rocks — solid). Pairwise Chebyshev ≥ 2, inside
 * the border margin, outside protected zones. Same floor ⇒ same layout, always.
 */
export function floorObstacles(floor: number, o: GridOpts = DEFAULT_GRID): TileSpot[] {
  const rng = mulberry32(floor * 7919 + 101)
  const zones = protectedZones(o)
  const count = 9 + Math.floor(rng() * 5) // 9–13
  const spots: TileSpot[] = []
  let attempts = 0
  while (spots.length < count && attempts < 400) {
    attempts++
    const x = 2 + Math.floor(rng() * (o.w - 4))
    const y = 3 + Math.floor(rng() * (o.h - 6))
    if (isProtected(x, y, zones)) continue
    if (spots.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < 2)) continue
    spots.push({ x, y })
  }
  return spots
}

// ---- floor modifiers ----------------------------------------------------------------------------
export type FloorModifierId = 'none' | 'calm' | 'swarm' | 'mist' | 'treasure'

export interface FloorModifier {
  id: FloorModifierId
  nameTh: string
  nameEn: string
  /** scales the floor's wandering-monster population (never below 6 in the scene). */
  monsterCountMult: number
  /** scales monster wander speed (mist slows the prowl). */
  monsterSpeedMult: number
  /** draws a static fog overlay (reduced-motion safe — no animation). */
  fog: boolean
  /** how many one-shot treasure chests spawn on this floor. */
  chests: number
}

export const FLOOR_MODIFIERS: Record<FloorModifierId, FloorModifier> = {
  none: { id: 'none', nameTh: '', nameEn: '', monsterCountMult: 1, monsterSpeedMult: 1, fog: false, chests: 0 },
  calm: { id: 'calm', nameTh: 'ชั้นสงบ — มอนสเตอร์เบาบาง', nameEn: 'Calm floor', monsterCountMult: 0.55, monsterSpeedMult: 0.85, fog: false, chests: 1 },
  swarm: { id: 'swarm', nameTh: 'ฝูงชุกชุม — มอนสเตอร์หนาแน่น', nameEn: 'Swarm floor', monsterCountMult: 1.45, monsterSpeedMult: 1.1, fog: false, chests: 0 },
  mist: { id: 'mist', nameTh: 'หมอกหนา — จงระวังรอบตัว', nameEn: 'Misty floor', monsterCountMult: 1, monsterSpeedMult: 0.75, fog: true, chests: 0 },
  treasure: { id: 'treasure', nameTh: 'ชั้นสมบัติ — มีหีบซ่อนอยู่!', nameEn: 'Treasure floor', monsterCountMult: 0.85, monsterSpeedMult: 1, fog: false, chests: 2 },
}

/**
 * Deterministic modifier for a floor. Town + milestone (world-boss) floors are always 'none' so
 * key beats keep their intended pacing; other floors roll seeded: 40% none / 15% each modifier.
 */
export function floorModifier(floor: number): FloorModifier {
  if (isTownFloor(floor) || floor % 10 === 0) return FLOOR_MODIFIERS.none
  const r = mulberry32(floor * 7919 + 211)()
  if (r < 0.4) return FLOOR_MODIFIERS.none
  if (r < 0.55) return FLOOR_MODIFIERS.calm
  if (r < 0.7) return FLOOR_MODIFIERS.swarm
  if (r < 0.85) return FLOOR_MODIFIERS.mist
  return FLOOR_MODIFIERS.treasure
}

/** Seeded chest spots — clear of obstacles, protected zones, and each other. */
export function chestSpots(floor: number, obstacles: TileSpot[], o: GridOpts = DEFAULT_GRID): TileSpot[] {
  const mod = floorModifier(floor)
  if (mod.chests <= 0) return []
  const rng = mulberry32(floor * 7919 + 307)
  const zones = protectedZones(o)
  const blocked = new Set(obstacles.map((s) => `${s.x},${s.y}`))
  const spots: TileSpot[] = []
  let attempts = 0
  while (spots.length < mod.chests && attempts < 200) {
    attempts++
    const x = 3 + Math.floor(rng() * (o.w - 6))
    const y = 4 + Math.floor(rng() * (o.h - 8))
    if (isProtected(x, y, zones) || blocked.has(`${x},${y}`)) continue
    if (spots.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < 3)) continue
    spots.push({ x, y })
  }
  return spots
}

/** Deterministic chest reward — small, non-compounding (≈ one monster's gold + a small potion). */
export function chestReward(floor: number, index: number): { gold: number; potion: boolean } {
  const rng = mulberry32(floor * 7919 + 401 + index)
  return { gold: 5 + Math.round(floor * 1.2), potion: rng() < 0.5 }
}

// ---- biome-matched decor (non-blocking foliage, reuses the curated World-1 bushes) --------------
/** bush texture keys per biome id — colors picked to read naturally against each palette. */
export const BIOME_BUSHES: Record<string, string[]> = {
  forest: ['w1bush_green', 'w1bush_red'],
  desert: ['w1bush_orange', 'w1bush_green'],
  snow: ['w1bush_blue', 'w1bush_pink'],
  volcano: ['w1bush_red', 'w1bush_orange'],
  cave: ['w1bush_pink', 'w1bush_blue'],
}

export interface DecorSpot extends TileSpot { key: string }

/** 5–7 seeded, non-blocking foliage spots (decor only — no physics body, walk over/behind). */
export function floorDecorSpots(floor: number, biomeId: string, obstacles: TileSpot[], o: GridOpts = DEFAULT_GRID): DecorSpot[] {
  const keys = BIOME_BUSHES[biomeId] ?? BIOME_BUSHES.forest
  const rng = mulberry32(floor * 7919 + 503)
  const zones = protectedZones(o)
  const blocked = new Set(obstacles.map((s) => `${s.x},${s.y}`))
  const count = 5 + Math.floor(rng() * 3)
  const spots: DecorSpot[] = []
  let attempts = 0
  while (spots.length < count && attempts < 200) {
    attempts++
    const x = 2 + Math.floor(rng() * (o.w - 4))
    const y = 3 + Math.floor(rng() * (o.h - 5))
    if (isProtected(x, y, zones) || blocked.has(`${x},${y}`)) continue
    if (spots.some((s) => s.x === x && s.y === y)) continue
    spots.push({ x, y, key: keys[Math.floor(rng() * keys.length)] })
  }
  return spots
}
