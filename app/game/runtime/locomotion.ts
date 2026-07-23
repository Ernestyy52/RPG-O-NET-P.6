import type { Facing, MovementResult } from './movement'

export interface Velocity2 { vx: number; vy: number }
export interface NavigationPoint { x: number; y: number }
export interface NavigationRect { x: number; y: number; w: number; h: number }
export interface NavigationBounds { x: number; y: number; width: number; height: number }

export const WALK_ACCELERATION = 1050
export const WALK_DECELERATION = 1750
export const CLICK_STOP_RADIUS = 7
export const NAV_CELL_SIZE = 16

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target)
  if (current > target) return Math.max(current - maxDelta, target)
  return target
}

/** Short 80–130ms ease-in/ease-out without changing top speed or collision authority. */
export function smoothVelocity(current: Velocity2, target: Velocity2, deltaMs: number, maxSpeed: number): Velocity2 {
  const dt = Math.min(Math.max(deltaMs, 0), 50) / 1000
  const targetMoving = Math.hypot(target.vx, target.vy) > 0.01
  const rate = targetMoving ? WALK_ACCELERATION : WALK_DECELERATION
  let vx = approach(current.vx, target.vx, rate * dt)
  let vy = approach(current.vy, target.vy, rate * dt)
  const magnitude = Math.hypot(vx, vy)
  if (magnitude > maxSpeed) {
    vx = (vx / magnitude) * maxSpeed
    vy = (vy / magnitude) * maxSpeed
  }
  if (!targetMoving && Math.abs(vx) < 0.5) vx = 0
  if (!targetMoving && Math.abs(vy) < 0.5) vy = 0
  return { vx, vy }
}

/** Normalized click-to-walk intent. Physics/collision remains authoritative in the scene. */
export function movementToPoint(
  from: NavigationPoint,
  to: NavigationPoint,
  previousFacing: Facing,
  speed: number,
  stopRadius = CLICK_STOP_RADIUS,
): MovementResult & { arrived: boolean } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  if (distance <= stopRadius) return { vx: 0, vy: 0, facing: previousFacing, moving: false, arrived: true }
  const facing: Facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? 'left' : 'right')
    : (dy < 0 ? 'up' : 'down')
  return { vx: (dx / distance) * speed, vy: (dy / distance) * speed, facing, moving: true, arrived: false }
}

interface HeapNode { id: number; score: number }

/** Small binary min-heap used by A* (town is only ~14k navigation cells). */
class MinHeap {
  private values: HeapNode[] = []
  get size() { return this.values.length }
  push(node: HeapNode) {
    this.values.push(node)
    let i = this.values.length - 1
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.values[parent]!.score <= node.score) break
      this.values[i] = this.values[parent]!
      i = parent
    }
    this.values[i] = node
  }
  pop(): HeapNode | undefined {
    if (!this.values.length) return undefined
    const root = this.values[0]!
    const tail = this.values.pop()!
    if (this.values.length) {
      let i = 0
      while (true) {
        const left = i * 2 + 1
        const right = left + 1
        if (left >= this.values.length) break
        const child = right < this.values.length && this.values[right]!.score < this.values[left]!.score ? right : left
        if (this.values[child]!.score >= tail.score) break
        this.values[i] = this.values[child]!
        i = child
      }
      this.values[i] = tail
    }
    return root
  }
}

/**
 * 8-way A* for Ragnarok-like click navigation. Blockers are inflated by the actor foot radius;
 * diagonal corner-cutting is rejected. The result contains only turn points plus the destination.
 */
export function buildNavigationPath(
  start: NavigationPoint,
  requestedTarget: NavigationPoint,
  bounds: NavigationBounds,
  blockers: NavigationRect[],
  options: { cellSize?: number; actorHalfWidth?: number; actorHalfHeight?: number } = {},
): NavigationPoint[] {
  const cell = options.cellSize ?? NAV_CELL_SIZE
  const halfW = options.actorHalfWidth ?? 10
  const halfH = options.actorHalfHeight ?? 7
  const cols = Math.max(1, Math.floor(bounds.width / cell))
  const rows = Math.max(1, Math.floor(bounds.height / cell))
  const count = cols * rows
  const idOf = (x: number, y: number) => y * cols + x
  const xyOf = (id: number) => ({ x: id % cols, y: Math.floor(id / cols) })
  const toCell = (point: NavigationPoint) => ({
    x: Math.max(0, Math.min(cols - 1, Math.floor((point.x - bounds.x) / cell))),
    y: Math.max(0, Math.min(rows - 1, Math.floor((point.y - bounds.y) / cell))),
  })
  const toWorld = (x: number, y: number): NavigationPoint => ({ x: bounds.x + x * cell + cell / 2, y: bounds.y + y * cell + cell / 2 })
  const occupancy = new Int8Array(count)
  const blocked = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return true
    const id = idOf(x, y)
    if (occupancy[id]) return occupancy[id] === 2
    const point = toWorld(x, y)
    const hit = blockers.some((rect) =>
      point.x + halfW > rect.x && point.x - halfW < rect.x + rect.w
      && point.y + halfH > rect.y && point.y - halfH < rect.y + rect.h)
    occupancy[id] = hit ? 2 : 1
    return hit
  }

  const startCell = toCell(start)
  occupancy[idOf(startCell.x, startCell.y)] = 1 // current physics position is always authoritative
  const wanted = toCell(requestedTarget)
  let targetCell = wanted
  if (blocked(wanted.x, wanted.y)) {
    let best: { x: number; y: number; d: number } | undefined
    for (let radius = 1; radius <= 12 && !best; radius++) {
      for (let y = wanted.y - radius; y <= wanted.y + radius; y++) {
        for (let x = wanted.x - radius; x <= wanted.x + radius; x++) {
          if (Math.max(Math.abs(x - wanted.x), Math.abs(y - wanted.y)) !== radius || blocked(x, y)) continue
          const world = toWorld(x, y)
          const d = Math.hypot(world.x - requestedTarget.x, world.y - requestedTarget.y)
          if (!best || d < best.d) best = { x, y, d }
        }
      }
    }
    if (!best) return []
    targetCell = best
  }

  const startId = idOf(startCell.x, startCell.y)
  const targetId = idOf(targetCell.x, targetCell.y)
  if (startId === targetId) return [blocked(wanted.x, wanted.y) ? toWorld(targetCell.x, targetCell.y) : requestedTarget]
  const g = new Float64Array(count)
  g.fill(Number.POSITIVE_INFINITY)
  const cameFrom = new Int32Array(count)
  cameFrom.fill(-1)
  const closed = new Uint8Array(count)
  const heap = new MinHeap()
  const heuristic = (x: number, y: number) => {
    const dx = Math.abs(x - targetCell.x)
    const dy = Math.abs(y - targetCell.y)
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
  g[startId] = 0
  heap.push({ id: startId, score: heuristic(startCell.x, startCell.y) })
  const directions = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2],
  ] as const

  while (heap.size) {
    const node = heap.pop()!
    if (closed[node.id]) continue
    if (node.id === targetId) break
    closed[node.id] = 1
    const here = xyOf(node.id)
    for (const [dx, dy, cost] of directions) {
      const nx = here.x + dx
      const ny = here.y + dy
      if (blocked(nx, ny)) continue
      if (dx && dy && (blocked(here.x + dx, here.y) || blocked(here.x, here.y + dy))) continue
      const nextId = idOf(nx, ny)
      const tentative = g[node.id]! + cost
      if (tentative >= g[nextId]!) continue
      cameFrom[nextId] = node.id
      g[nextId] = tentative
      heap.push({ id: nextId, score: tentative + heuristic(nx, ny) })
    }
  }
  if (cameFrom[targetId] === -1) return []

  const cells: { x: number; y: number }[] = []
  for (let id = targetId; id !== startId; id = cameFrom[id]!) cells.push(xyOf(id))
  cells.reverse()
  const turns: NavigationPoint[] = []
  let previousDirection = ''
  for (let i = 0; i < cells.length; i++) {
    const previous = i === 0 ? startCell : cells[i - 1]!
    const current = cells[i]!
    const direction = `${Math.sign(current.x - previous.x)},${Math.sign(current.y - previous.y)}`
    if (i > 0 && direction !== previousDirection) {
      const corner = cells[i - 1]!
      turns.push(toWorld(corner.x, corner.y))
    }
    previousDirection = direction
  }
  const exactTarget = blocked(wanted.x, wanted.y) ? toWorld(targetCell.x, targetCell.y) : requestedTarget
  turns.push(exactTarget)
  return turns
}
