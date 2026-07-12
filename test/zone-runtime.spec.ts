import { describe, it, expect } from 'vitest'
import {
  SceneLifecycle,
  resolveMovement, PLAYER_SPEED,
  buildZoneDefinition, SPAWN_BOUNDS, TREE_SPOTS, TILE, MAP_W, MAP_H,
  rollMonsterSpawns, mulberryRng,
  canStartEncounter, isNetMonsterFightable,
  ZoneRuntime, type RuntimeHost, type Disposer,
} from '~/game/runtime'

// ================================================================================================
// Phase 08 — zone runtime: pure systems + the enter/exit lifecycle contract (no listener/timer leak).
// ================================================================================================

describe('SceneLifecycle — leak-free teardown', () => {
  it('disposes every registration once, in reverse order', () => {
    const lc = new SceneLifecycle()
    const order: number[] = []
    lc.add(() => order.push(1))
    lc.add(() => order.push(2))
    lc.add(() => order.push(3))
    expect(lc.size).toBe(3)
    lc.dispose()
    expect(order).toEqual([3, 2, 1])
    expect(lc.size).toBe(0)
    expect(lc.isDisposed).toBe(true)
  })

  it('is idempotent — a second dispose does nothing', () => {
    const lc = new SceneLifecycle()
    let count = 0
    lc.add(() => { count++ })
    lc.dispose()
    lc.dispose()
    expect(count).toBe(1)
  })

  it('isolates a throwing disposer so the rest still run', () => {
    const lc = new SceneLifecycle()
    let ran = false
    lc.add(() => { ran = true })
    lc.add(() => { throw new Error('boom') })
    expect(() => lc.dispose()).not.toThrow()
    expect(ran).toBe(true)
  })

  it('runs a disposer immediately if registered after disposal (never stranded)', () => {
    const lc = new SceneLifecycle()
    lc.dispose()
    let ran = false
    lc.add(() => { ran = true })
    expect(ran).toBe(true)
    expect(lc.size).toBe(0)
  })
})

describe('PlayerController — resolveMovement', () => {
  const idle = { left: false, right: false, up: false, down: false }

  it('returns zero velocity and keeps facing when idle', () => {
    const r = resolveMovement(idle, 'up')
    expect(r).toEqual({ vx: 0, vy: 0, facing: 'up', moving: false })
  })

  it('applies speed and facing per direction', () => {
    expect(resolveMovement({ ...idle, left: true }, 'down')).toMatchObject({ vx: -PLAYER_SPEED, facing: 'left', moving: true })
    expect(resolveMovement({ ...idle, right: true }, 'down')).toMatchObject({ vx: PLAYER_SPEED, facing: 'right' })
    expect(resolveMovement({ ...idle, up: true }, 'down')).toMatchObject({ vy: -PLAYER_SPEED, facing: 'up' })
  })

  it('left wins over right; a vertical key wins the facing over a horizontal one (legacy order)', () => {
    expect(resolveMovement({ left: true, right: true, up: false, down: false }, 'down').vx).toBe(-PLAYER_SPEED)
    const diag = resolveMovement({ left: true, right: false, up: true, down: false }, 'down')
    expect(diag.vx).toBe(-PLAYER_SPEED)
    expect(diag.vy).toBe(-PLAYER_SPEED)
    expect(diag.facing).toBe('up') // vertical overrides horizontal facing
  })
})

describe('ZoneDefinition — layout data', () => {
  it('describes the standard floor layout with a closed border', () => {
    const z = buildZoneDefinition()
    expect(z.tile).toBe(TILE)
    expect(z.cols).toBe(MAP_W)
    expect(z.rows).toBe(MAP_H)
    // border walls: top+bottom rows + left+right columns (minus already-counted corners)
    expect(z.walls.length).toBe(2 * MAP_W + 2 * (MAP_H - 2))
    expect(z.treeSpots).toEqual(TREE_SPOTS)
    expect(z.door).toEqual({ x: (MAP_W / 2) * TILE, y: TILE * 1.6 })
    expect(z.playerStart).toEqual({ x: TILE * 2, y: TILE * (MAP_H - 2) })
    expect(z.spawnBounds).toEqual(SPAWN_BOUNDS)
  })

  it('every wall tile sits on the outer ring', () => {
    const z = buildZoneDefinition()
    for (const w of z.walls) {
      const onRing = w.x === 0 || w.x === MAP_W - 1 || w.y === 0 || w.y === MAP_H - 1
      expect(onRing).toBe(true)
    }
  })
})

describe('SpawnSystem — rollMonsterSpawns', () => {
  const slugs = ['goblin', 'skeleton', 'slime']

  it('places exactly `count` monsters, all inside the spawn region and from the slug pool', () => {
    const slots = rollMonsterSpawns(25, { bounds: SPAWN_BOUNDS, slugs, rng: mulberryRng(1) })
    expect(slots.length).toBe(25)
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(SPAWN_BOUNDS.minX * TILE)
      expect(s.x).toBeLessThanOrEqual(SPAWN_BOUNDS.maxX * TILE)
      expect(s.y).toBeGreaterThanOrEqual(SPAWN_BOUNDS.minY * TILE)
      expect(s.y).toBeLessThanOrEqual(SPAWN_BOUNDS.maxY * TILE)
      expect(slugs).toContain(s.slug)
    }
  })

  it('is deterministic for a given seed and varies across seeds', () => {
    const a = rollMonsterSpawns(10, { bounds: SPAWN_BOUNDS, slugs, rng: mulberryRng(42) })
    const b = rollMonsterSpawns(10, { bounds: SPAWN_BOUNDS, slugs, rng: mulberryRng(42) })
    const c = rollMonsterSpawns(10, { bounds: SPAWN_BOUNDS, slugs, rng: mulberryRng(7) })
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('spreads monsters across distinct cells (no total pile-up)', () => {
    const slots = rollMonsterSpawns(16, { bounds: SPAWN_BOUNDS, slugs, rng: mulberryRng(3) })
    const unique = new Set(slots.map((s) => `${s.x},${s.y}`))
    expect(unique.size).toBeGreaterThan(10)
  })
})

describe('InteractionSystem — encounter guards', () => {
  it('canStartEncounter requires idle + not pending + alive monster', () => {
    expect(canStartEncounter({ inBattle: false, pendingBattle: false, monsterActive: true })).toBe(true)
    expect(canStartEncounter({ inBattle: true, pendingBattle: false, monsterActive: true })).toBe(false)
    expect(canStartEncounter({ inBattle: false, pendingBattle: true, monsterActive: true })).toBe(false)
    expect(canStartEncounter({ inBattle: false, pendingBattle: false, monsterActive: false })).toBe(false)
  })

  it('isNetMonsterFightable allows unlocked or self-locked monsters only', () => {
    expect(isNetMonsterFightable('', 'me')).toBe(true)
    expect(isNetMonsterFightable(undefined, 'me')).toBe(true)
    expect(isNetMonsterFightable('me', 'me')).toBe(true)
    expect(isNetMonsterFightable('someone-else', 'me')).toBe(false)
  })
})

class FakeHost implements RuntimeHost {
  timers = 0
  listeners = 0
  respawn?: () => void
  addTimer(_delayMs: number, _loop: boolean, cb: () => void): Disposer {
    this.timers++
    if (!this.respawn) this.respawn = cb
    return () => { this.timers-- }
  }
  onGameEvent(_type: string, _handler: (p: unknown) => void): Disposer {
    this.listeners++
    return () => { this.listeners-- }
  }
  get live(): number { return this.timers + this.listeners }
}

describe('ZoneRuntime — enter/exit lifecycle (Phase 08 gate)', () => {
  it('registers on enter and fully unwinds on exit', () => {
    const host = new FakeHost()
    const rt = new ZoneRuntime(host)
    rt.enter()
    expect(rt.isActive).toBe(true)
    expect(rt.liveRegistrations).toBe(4) // 2 timers + 2 event listeners
    expect(host.live).toBe(4)
    rt.exit()
    expect(rt.isActive).toBe(false)
    expect(rt.liveRegistrations).toBe(0)
    expect(host.live).toBe(0)
  })

  it('leaks nothing across many enter/exit cycles', () => {
    const host = new FakeHost()
    const rt = new ZoneRuntime(host)
    for (let i = 0; i < 50; i++) {
      rt.enter()
      rt.exit()
      expect(host.live).toBe(0)
    }
    expect(host.timers).toBe(0)
    expect(host.listeners).toBe(0)
  })

  it('double enter and double exit are safe', () => {
    const host = new FakeHost()
    const rt = new ZoneRuntime(host)
    rt.enter()
    rt.enter() // ignored while active
    expect(host.live).toBe(4)
    rt.exit()
    rt.exit() // ignored while inactive
    expect(host.live).toBe(0)
  })

  it('routes host callbacks to the provided handlers', () => {
    const host = new FakeHost()
    let ticks = 0
    const rt = new ZoneRuntime(host, { onRespawnTick: () => { ticks++ } })
    rt.enter()
    host.respawn?.()
    expect(ticks).toBe(1)
    rt.exit()
  })
})
