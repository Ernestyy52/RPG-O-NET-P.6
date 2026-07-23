import { describe, expect, it } from 'vitest'
import { CLICK_STOP_RADIUS, buildNavigationPath, movementToPoint, smoothVelocity } from '~/game/runtime/locomotion'

describe('player locomotion feel', () => {
  it('eases into top speed without exceeding the movement contract', () => {
    const first = smoothVelocity({ vx: 0, vy: 0 }, { vx: 120, vy: 0 }, 16, 120)
    expect(first.vx).toBeGreaterThan(0)
    expect(first.vx).toBeLessThan(120)
    let velocity = first
    for (let i = 0; i < 30; i++) velocity = smoothVelocity(velocity, { vx: 120, vy: 0 }, 16, 120)
    expect(velocity.vx).toBe(120)
    expect(Math.hypot(velocity.vx, velocity.vy)).toBeLessThanOrEqual(120)
  })

  it('brakes more quickly than it accelerates and settles exactly at rest', () => {
    let velocity = { vx: 120, vy: 0 }
    velocity = smoothVelocity(velocity, { vx: 0, vy: 0 }, 16, 120)
    expect(velocity.vx).toBeLessThan(120)
    for (let i = 0; i < 20; i++) velocity = smoothVelocity(velocity, { vx: 0, vy: 0 }, 16, 120)
    expect(velocity).toEqual({ vx: 0, vy: 0 })
  })

  it('normalizes click-to-walk speed and stops inside the arrival radius', () => {
    const walk = movementToPoint({ x: 0, y: 0 }, { x: 30, y: 40 }, 'left', 100)
    expect(walk).toMatchObject({ vx: 60, vy: 80, facing: 'down', moving: true, arrived: false })
    expect(Math.hypot(walk.vx, walk.vy)).toBeCloseTo(100, 8)
    expect(movementToPoint({ x: 0, y: 0 }, { x: CLICK_STOP_RADIUS - 1, y: 0 }, 'up', 100))
      .toMatchObject({ vx: 0, vy: 0, facing: 'up', moving: false, arrived: true })
  })

  it('routes click-to-walk around furniture without diagonal corner cutting', () => {
    const wall = { x: 64, y: 0, w: 32, h: 112 }
    const path = buildNavigationPath(
      { x: 24, y: 24 },
      { x: 136, y: 24 },
      { x: 0, y: 0, width: 160, height: 160 },
      [wall],
      { cellSize: 16, actorHalfWidth: 4, actorHalfHeight: 4 },
    )
    expect(path.length).toBeGreaterThan(1)
    expect(path.some((point) => point.y > 112)).toBe(true)
    expect(path.at(-1)).toEqual({ x: 136, y: 24 })
    for (const point of path) {
      const inside = point.x > wall.x && point.x < wall.x + wall.w && point.y > wall.y && point.y < wall.y + wall.h
      expect(inside, `waypoint inside wall at ${point.x},${point.y}`).toBe(false)
    }
  })
})
