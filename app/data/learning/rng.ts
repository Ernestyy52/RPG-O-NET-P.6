// ================================================================================================
// Deterministic RNG helpers for the learning domain (Phase 06).
//
// All learning selection/planning is seedable so tests are fully deterministic and every client on
// the same day+seed produces the same plan. No Math.random anywhere in the learning domain.
// ================================================================================================

/** mulberry32 — small, fast, deterministic PRNG returning [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a string → 32-bit seed, so a date string (or date+player) yields a stable seed. */
export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
