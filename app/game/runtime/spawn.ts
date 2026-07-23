// ================================================================================================
// SpawnSystem (Phase 08)
//
// Grid-cell monster placement extracted from TowerScene.rollMonsterSpawns. The walkable spawn region
// is divided into ~count cells; each spawn lands (with jitter) inside its own cell so monsters spread
// out instead of clumping. The RNG is INJECTED (Rng port) so the algorithm is pure and unit-testable
// — the scene passes Phaser.Math.RND (which already satisfies frac/between); tests pass a seeded RNG.
// ================================================================================================
import { mulberry32 } from '~/data/learning/rng'
import { TILE, type SpawnBounds } from './zone'

/** Minimal RNG surface. Phaser.Math.RND satisfies this; `mulberryRng` gives a seeded one for tests. */
export interface Rng {
  /** float in [0,1). */
  frac(): number
  /** integer in [min,max] inclusive. */
  between(min: number, max: number): number
}

/** Seeded RNG adapter over mulberry32 for deterministic tests / offline reproducibility. */
export function mulberryRng(seed: number): Rng {
  const next = mulberry32(seed)
  return {
    frac: () => next(),
    between: (min, max) => min + Math.floor(next() * (max - min + 1)),
  }
}

export interface SpawnSlot {
  id: string
  slug: string
  x: number
  y: number
}

export interface SpawnOptions {
  bounds: SpawnBounds
  /** monster slugs to choose from (one is picked per spawn via rng.between). */
  slugs: string[]
  rng: Rng
  tile?: number
}

/** In-place Fisher–Yates using the injected RNG (replaces Phaser.Utils.Array.Shuffle, pure). */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.frac() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Place `count` monsters across the spawn region. Positions stay within the region bounds (in px) and
 * are spread one-per-cell. Reproduces the legacy cell-grid math (cols = round(sqrt(count·areaW/areaH))).
 */
export function rollMonsterSpawns(count: number, opts: SpawnOptions): SpawnSlot[] {
  const { bounds, slugs, rng } = opts
  const tile = opts.tile ?? TILE
  const { minX, maxX, minY, maxY } = bounds
  const areaW = maxX - minX
  const areaH = maxY - minY

  const cols = Math.max(1, Math.round(Math.sqrt((count * areaW) / areaH)))
  const rows = Math.max(1, Math.ceil(count / cols))
  const cellW = areaW / cols
  const cellH = areaH / rows

  const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i), rng)

  return Array.from({ length: count }, (_, i) => {
    const cell = cells[i % cells.length]
    const cx = cell % cols
    const cy = Math.floor(cell / cols)
    const tileX = minX + cx * cellW + cellW * 0.15 + rng.frac() * cellW * 0.7
    const tileY = minY + cy * cellH + cellH * 0.15 + rng.frac() * cellH * 0.7
    return {
      id: `m${i}`,
      slug: slugs[rng.between(0, slugs.length - 1)],
      x: Math.round(tileX * tile),
      y: Math.round(tileY * tile),
    }
  })
}
