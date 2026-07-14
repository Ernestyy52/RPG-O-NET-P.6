import { describe, it, expect } from 'vitest'
import { isWorld1Floor } from '../app/data/world'

// Phase 14 Inc 3 — the per-zone gate boundary (PHASE_14_PLAN §3). Real-time combat / Knowledge Break /
// dungeon routing apply ONLY on floors 1–10; floors 11+ stay on the legacy path in both flag states.
describe('isWorld1Floor — Phase 14 per-zone gate', () => {
  it('is true for the World-1 band 1..10 inclusive', () => {
    for (let f = 1; f <= 10; f++) expect(isWorld1Floor(f)).toBe(true)
  })

  it('is false at the boundaries just outside 1..10', () => {
    expect(isWorld1Floor(0)).toBe(false)
    expect(isWorld1Floor(11)).toBe(false)
    expect(isWorld1Floor(100)).toBe(false)
    expect(isWorld1Floor(-5)).toBe(false)
  })

  it('rejects non-finite input rather than throwing', () => {
    expect(isWorld1Floor(NaN)).toBe(false)
    expect(isWorld1Floor(Infinity)).toBe(false)
  })
})
