import { describe, it, expect } from 'vitest'
import {
  MYCO_COLOSSUS_PHASES,
  MIN_TELEGRAPH_MS,
  phaseForHpFraction,
  initBossPhaseState,
  advanceBossPhase,
  bossTelegraph,
  bossPhaseSpec,
  validateBossPhaseConfig,
  type BossPhaseState,
} from '~/data/combat'

// ================================================================================================
// Phase 14 Inc 3 — boss phase state machine (pure).
// Proves the "readable boss phases" + no-soft-lock gate properties by construction: HP-derived,
// monotonic, idempotent, re-derivable on resume, readability never falls.
// ================================================================================================

const C = MYCO_COLOSSUS_PHASES

describe('boss phase config — structural invariants', () => {
  it('Myco Colossus config is valid (descending thresholds, telegraph floor, monotonic tempo/danger)', () => {
    expect(validateBossPhaseConfig(C)).toEqual([])
  })

  it('telegraph grows and stays above the readability floor while tempo rises', () => {
    const [p1, p2, p3] = C.phases
    expect(p1.telegraphMs).toBeGreaterThanOrEqual(MIN_TELEGRAPH_MS)
    expect(p2.telegraphMs).toBeGreaterThan(p1.telegraphMs)
    expect(p3.telegraphMs).toBeGreaterThan(p2.telegraphMs)
    expect(p2.attackIntervalMs).toBeLessThan(p1.attackIntervalMs)
    expect(p3.attackIntervalMs).toBeLessThan(p2.attackIntervalMs)
    expect(p3.damageMod).toBeGreaterThan(p1.damageMod)
  })

  it('rejects a bad config (shrinking telegraph)', () => {
    const bad = { ...C, phases: [C.phases[0], { ...C.phases[1], telegraphMs: 400 }, C.phases[2]] as typeof C.phases }
    expect(validateBossPhaseConfig(bad).length).toBeGreaterThan(0)
  })
})

describe('phaseForHpFraction — HP-derived phase at the boundaries', () => {
  it('maps HP fractions to phases with correct threshold edges (<=70% p2, <=35% p3)', () => {
    expect(phaseForHpFraction(C, 1.0)).toBe(1)
    expect(phaseForHpFraction(C, 0.71)).toBe(1)
    expect(phaseForHpFraction(C, 0.70)).toBe(2) // entering phase 2 at exactly 70%
    expect(phaseForHpFraction(C, 0.36)).toBe(2)
    expect(phaseForHpFraction(C, 0.35)).toBe(3) // entering phase 3 at exactly 35%
    expect(phaseForHpFraction(C, 0.0)).toBe(3)
  })

  it('clamps out-of-range fractions without throwing', () => {
    expect(phaseForHpFraction(C, 1.5)).toBe(1)
    expect(phaseForHpFraction(C, -0.2)).toBe(3)
  })
})

describe('advanceBossPhase — monotonic, idempotent, single emission per threshold', () => {
  it('emits phase-change + telegraph exactly once when crossing a threshold', () => {
    let s: BossPhaseState = initBossPhaseState(C, 1)
    expect(s.phase).toBe(1)

    // still phase 1 above 70% — no event
    let r = advanceBossPhase(s, C, 0.80)
    expect(r.events).toEqual([])
    s = r.state

    // cross into phase 2
    r = advanceBossPhase(s, C, 0.65)
    expect(r.state.phase).toBe(2)
    expect(r.events.map((e) => e.type)).toEqual(['boss-phase-change', 'boss-telegraph'])
    s = r.state

    // re-evaluate at the same HP — idempotent, no second trigger
    expect(advanceBossPhase(s, C, 0.65).events).toEqual([])

    // cross into phase 3
    r = advanceBossPhase(s, C, 0.20)
    expect(r.state.phase).toBe(3)
    expect(r.events.map((e) => e.type)).toEqual(['boss-phase-change', 'boss-telegraph'])
  })

  it('never regresses on a heal (monotonic)', () => {
    let s = initBossPhaseState(C, 1)
    s = advanceBossPhase(s, C, 0.30).state // → phase 3
    expect(s.phase).toBe(3)
    const healed = advanceBossPhase(s, C, 0.90) // boss healed back to 90%
    expect(healed.state.phase).toBe(3) // stays phase 3
    expect(healed.events).toEqual([])
  })

  it('is pure — does not mutate the input state', () => {
    const s = initBossPhaseState(C, 1)
    const snapshot = { ...s }
    advanceBossPhase(s, C, 0.10)
    expect(s).toEqual(snapshot)
  })
})

describe('resume mid-fight — re-derivation, no soft lock, no double-trigger', () => {
  it('reconstructs the correct phase from current HP on resume', () => {
    // player quit at 30% boss HP → resume must land in phase 3 immediately, not replay phase 2
    const resumed = initBossPhaseState(C, 0.30)
    expect(resumed.phase).toBe(3)
    // and advancing at that HP emits nothing (already there)
    expect(advanceBossPhase(resumed, C, 0.30).events).toEqual([])
  })

  it('bossTelegraph reflects the current phase spec', () => {
    const s = initBossPhaseState(C, 0.20)
    const t = bossTelegraph(s, C)
    expect(t.type).toBe('boss-telegraph')
    if (t.type === 'boss-telegraph') {
      expect(t.phase).toBe(3)
      expect(t.telegraphMs).toBe(bossPhaseSpec(C, 3).telegraphMs)
      expect(t.pattern).toBe('aoe-slam')
    }
  })
})
