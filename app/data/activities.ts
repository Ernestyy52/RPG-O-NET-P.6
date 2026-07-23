import { mulberry32, seedFromString } from './learning/rng'
import { themeForFloor } from './monsterThemes'
import type { DungeonLayoutConfig, DungeonLayoutId } from '../game/runtime/dungeonLayouts'

export type DailyActivityKind = 'elite' | 'rare' | 'rift'
export type DailyRiftModifier = 'shadowed' | 'time-trial' | 'swift' | 'no-potion'
export type DailyRiftVariantId =
  | 'hollow' | 'hollow-mirror' | 'hollow-inverse' | 'hollow-cross'
  | 'approach' | 'approach-mirror' | 'approach-inverse' | 'approach-cross'

export interface DailyRiftVariant {
  id: DailyRiftVariantId
  name: string
  baseLayoutId: DungeonLayoutId
  flipX: boolean
  flipY: boolean
}

export const DAILY_RIFT_VARIANTS: DailyRiftVariant[] = [
  { id: 'hollow', name: 'Hollow Path', baseLayoutId: 'world01-mini', flipX: false, flipY: false },
  { id: 'hollow-mirror', name: 'Mirrored Hollow', baseLayoutId: 'world01-mini', flipX: true, flipY: false },
  { id: 'hollow-inverse', name: 'Inverted Hollow', baseLayoutId: 'world01-mini', flipX: false, flipY: true },
  { id: 'hollow-cross', name: 'Crossed Hollow', baseLayoutId: 'world01-mini', flipX: true, flipY: true },
  { id: 'approach', name: 'Ancient Approach', baseLayoutId: 'world01-main', flipX: false, flipY: false },
  { id: 'approach-mirror', name: 'Mirrored Approach', baseLayoutId: 'world01-main', flipX: true, flipY: false },
  { id: 'approach-inverse', name: 'Inverted Approach', baseLayoutId: 'world01-main', flipX: false, flipY: true },
  { id: 'approach-cross', name: 'Crossed Approach', baseLayoutId: 'world01-main', flipX: true, flipY: true },
]

export const DAILY_RIFT_MODIFIER_LABELS: Record<DailyRiftModifier, { name: string; description: string }> = {
  shadowed: { name: 'Veil of Night', description: 'แสงในดันเจียนมืดลง แต่ตัวละครยังมองเห็นชัด' },
  'time-trial': { name: 'Chrono Seal', description: 'เคลียร์ภายใน 210 วินาที มิฉะนั้น Rift จะปิด' },
  swift: { name: 'Haste Curse', description: 'มอนสเตอร์ได้ Speed เพิ่มในการต่อสู้' },
  'no-potion': { name: 'Dry Run', description: 'ไม่สามารถใช้ Potion ระหว่างต่อสู้ใน Rift' },
}

export interface ActivityReward {
  exp: number
  gold: number
  gems: number
}

export interface DailyActivityPlan {
  date: string
  seed: number
  floor: number
  baseLayoutId: DungeonLayoutId
  layoutVariantId: DailyRiftVariantId
  layoutVariantName: string
  modifiers: DailyRiftModifier[]
  timeLimitSec?: number
  riftName: string
  monsterPool: string[]
  eliteMonster: string
  rareMonster: string
  eliteTarget: number
  rareTarget: number
  rewards: Record<DailyActivityKind, ActivityReward>
}

export function activityDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function dailyActivityPlan(date: string, requestedFloor: number): DailyActivityPlan {
  const floor = Math.max(1, Math.min(100, Math.round(requestedFloor)))
  const seed = seedFromString(`daily-rift:${date}:f${floor}`)
  const rng = mulberry32(seed)
  const theme = themeForFloor(floor)
  const pool = [...theme.monsters]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const tier = Math.max(1, Math.ceil(floor / 10))
  const variant = DAILY_RIFT_VARIANTS[Math.floor(rng() * DAILY_RIFT_VARIANTS.length)]!
  const modifierPool: DailyRiftModifier[] = ['shadowed', 'time-trial', 'swift', 'no-potion']
  for (let i = modifierPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[modifierPool[i], modifierPool[j]] = [modifierPool[j]!, modifierPool[i]!]
  }
  const modifiers = modifierPool.slice(0, 2)
  return {
    date,
    seed,
    floor,
    baseLayoutId: variant.baseLayoutId,
    layoutVariantId: variant.id,
    layoutVariantName: variant.name,
    modifiers,
    timeLimitSec: modifiers.includes('time-trial') ? 210 : undefined,
    riftName: `${theme.name} Echo Rift`,
    monsterPool: pool.slice(0, Math.min(3, pool.length)),
    eliteMonster: theme.boss,
    rareMonster: pool[0] ?? theme.boss,
    eliteTarget: 3,
    rareTarget: 1,
    rewards: {
      elite: { exp: 35 * tier, gold: 30 * tier, gems: 0 },
      rare: { exp: 55 * tier, gold: 45 * tier, gems: 1 },
      rift: { exp: 90 * tier, gold: 70 * tier, gems: 1 },
    },
  }
}

export function activityCompleted(kind: DailyActivityKind, state: { eliteProgress: number; rareProgress: number; riftCleared: boolean }, plan: DailyActivityPlan): boolean {
  if (kind === 'elite') return state.eliteProgress >= plan.eliteTarget
  if (kind === 'rare') return state.rareProgress >= plan.rareTarget
  return state.riftCleared
}



/** Transform one of two authored maps into eight deterministic, reachable Rift routes. */
function transformLayout(base: DungeonLayoutConfig, variant: DailyRiftVariant): DungeonLayoutConfig {
  const point = (value: { x: number; y: number }) => ({
    x: variant.flipX ? base.cols - 1 - value.x : value.x,
    y: variant.flipY ? base.rows - 1 - value.y : value.y,
  })
  const bounds = (value: { minX: number; maxX: number; minY: number; maxY: number }) => ({
    minX: variant.flipX ? base.cols - 1 - value.maxX : value.minX,
    maxX: variant.flipX ? base.cols - 1 - value.minX : value.maxX,
    minY: variant.flipY ? base.rows - 1 - value.maxY : value.minY,
    maxY: variant.flipY ? base.rows - 1 - value.minY : value.maxY,
  })
  const grid = <T>(source: T[][]) => {
    const rows = source.map((row) => variant.flipX ? [...row].reverse() : [...row])
    return variant.flipY ? rows.reverse() : rows
  }
  return {
    ...base,
    floorGrid: grid(base.floorGrid),
    wallGrid: grid(base.wallGrid),
    props: base.props.map((prop) => ({ ...prop, ...point(prop) })),
    torches: base.torches.map(point),
    entry: point(base.entry),
    exit: point(base.exit),
    spawns: base.spawns.map((spawn) => ({ ...spawn, bounds: bounds(spawn.bounds) })),
    elites: base.elites.map((elite) => ({ ...elite, at: point(elite.at) })),
    bossGate: base.bossGate ? point(base.bossGate) : undefined,
    secrets: base.secrets.map((secret) => ({ ...secret, at: point(secret.at) })),
  }
}

/** Build the day's dungeon without mutating the authored campaign layout. */
export function dailyRiftLayout(plan: DailyActivityPlan, authoredBase: DungeonLayoutConfig): DungeonLayoutConfig {
  const variant = DAILY_RIFT_VARIANTS.find((entry) => entry.id === plan.layoutVariantId) ?? DAILY_RIFT_VARIANTS[0]!
  const base = transformLayout(authoredBase, variant)
  const occupied = new Set(base.props.filter((p) => p.blocking).map((p) => `${p.x},${p.y}`))
  const eliteAt = base.elites[0]?.at ?? (() => {
    for (let y = 2; y < base.rows - 2; y++) {
      for (let x = base.cols - 3; x >= 2; x--) {
        if (base.wallGrid[y]?.[x] === null && !occupied.has(`${x},${y}`)
          && Math.abs(x - base.entry.x) + Math.abs(y - base.entry.y) > 7) return { x, y }
      }
    }
    return { x: base.cols - 2, y: 2 }
  })()
  return {
    ...base,
    name: `${plan.riftName} · ${plan.layoutVariantName}`,
    nameTh: 'รอยแยกสะท้อนประจำวัน',
    spawns: base.spawns.map((spawn, index) => ({
      ...spawn,
      slug: plan.monsterPool[index % plan.monsterPool.length] ?? plan.rareMonster,
    })),
    elites: [{ slug: plan.eliteMonster, at: eliteAt }],
    bossGate: undefined,
    secrets: [],
  }
}
