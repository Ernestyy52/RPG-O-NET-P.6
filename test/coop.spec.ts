import { describe, it, expect } from 'vitest'
import {
  createCoopEncounter, applyCoopDamage, coopHpFraction, coopBossPhase, coopBossPhaseName,
  CoopRewardLedger, MAX_COOP_HIT_FRACTION, COOP_ENABLED,
} from '~/data/coop'
import { MYCO_COLOSSUS_PHASES } from '~/data/combat'

// ================================================================================================
// Phase 15 — safe co-op + server authority: client can't claim victory alone, no reward duplication,
// boss synchronized (server-owned phase), reconnect safe, offline path untouched (flag dormant).
// ================================================================================================

describe('co-op authority — flag dormant', () => {
  it('COOP_ENABLED is false so offline single-player is untouched', () => {
    expect(COOP_ENABLED).toBe(false)
  })
})

describe('co-op authority — server-owned shared HP', () => {
  it('accumulates validated damage across players and dies exactly once', () => {
    let enc = createCoopEncounter('m1', 100)
    let r = applyCoopDamage(enc, 'alice', 40)
    expect(r.killed).toBe(false)
    expect(r.state.hp).toBe(60)
    expect(r.state.participants).toEqual(['alice'])

    r = applyCoopDamage(r.state, 'bob', 40)
    expect(r.state.hp).toBe(20)
    expect(r.state.participants).toEqual(['alice', 'bob'])

    r = applyCoopDamage(r.state, 'alice', 40) // clamps hp at 0, kills
    expect(r.state.hp).toBe(0)
    expect(r.state.alive).toBe(false)
    expect(r.killed).toBe(true)

    // a late/duplicate hit after death is a no-op — can't re-kill
    const after = applyCoopDamage(r.state, 'bob', 40)
    expect(after.killed).toBe(false)
    expect(after.applied).toBe(0)
    enc = after.state
    expect(enc.hp).toBe(0)
  })

  it('clamps a single hit so one client cannot one-shot the boss (anti-cheat)', () => {
    const enc = createCoopEncounter('boss', 1000)
    const r = applyCoopDamage(enc, 'cheater', 999999)
    expect(r.applied).toBe(Math.round(1000 * MAX_COOP_HIT_FRACTION)) // capped at 50%
    expect(r.state.alive).toBe(true) // one hit alone can't kill
  })
})

describe('co-op authority — boss synchronized (server-owned phase)', () => {
  it('derives the same phase from the shared HP fraction for every observer', () => {
    let enc = createCoopEncounter('boss', 1000)
    // full HP → phase 1
    expect(coopBossPhase(MYCO_COLOSSUS_PHASES, enc).phase).toBe(1)
    // drop below the phase-2 threshold (0.70)
    enc = applyCoopDamage(enc, 'a', 350).state // hp 650 = 65%
    expect(coopHpFraction(enc)).toBeCloseTo(0.65, 5)
    expect(coopBossPhase(MYCO_COLOSSUS_PHASES, enc).phase).toBe(2)
    // two independent observers computing from the SAME state agree (synchronized)
    expect(coopBossPhase(MYCO_COLOSSUS_PHASES, enc).phase).toBe(coopBossPhase(MYCO_COLOSSUS_PHASES, enc).phase)
    expect(coopBossPhaseName(MYCO_COLOSSUS_PHASES, 2).length).toBeGreaterThan(0)
  })
})

describe('co-op authority — reward ledger (no duplication, no lone victory)', () => {
  it('grants each participant exactly once after a server-confirmed kill', () => {
    let enc = createCoopEncounter('m2', 60)
    enc = applyCoopDamage(enc, 'alice', 30).state
    enc = applyCoopDamage(enc, 'bob', 30).state // dead now (hp 0)
    expect(enc.alive).toBe(false)

    const ledger = new CoopRewardLedger()
    expect(ledger.claim(enc, 'alice')).toBe(true)  // first claim grants
    expect(ledger.claim(enc, 'alice')).toBe(false) // duplicate rejected — no duplication
    expect(ledger.claim(enc, 'bob')).toBe(true)    // each participant gets one
    expect(ledger.wasClaimed('m2', 'alice')).toBe(true)
  })

  it('a client cannot claim victory alone — no claim while the server says alive', () => {
    let enc = createCoopEncounter('m3', 100)
    enc = applyCoopDamage(enc, 'alice', 40).state // still alive (hp 60)
    const ledger = new CoopRewardLedger()
    expect(enc.alive).toBe(true)
    expect(ledger.canClaim(enc, 'alice')).toBe(false)
    expect(ledger.claim(enc, 'alice')).toBe(false) // rejected — victory is server-owned
  })

  it('a non-participant (dealt no damage) cannot claim', () => {
    let enc = createCoopEncounter('m4', 40)
    // two hits (each capped at 50% by the anti-cheat clamp) — alice solos it over the cap
    enc = applyCoopDamage(enc, 'alice', 20).state
    enc = applyCoopDamage(enc, 'alice', 20).state
    expect(enc.alive).toBe(false)
    const ledger = new CoopRewardLedger()
    expect(ledger.claim(enc, 'charlie')).toBe(false) // charlie never fought
    expect(ledger.claim(enc, 'alice')).toBe(true)
  })

  it('reconnect is safe — a re-derived dead encounter never double-grants', () => {
    let enc = createCoopEncounter('boss', 50)
    enc = applyCoopDamage(enc, 'alice', 25).state
    enc = applyCoopDamage(enc, 'alice', 25).state // dead
    const ledger = new CoopRewardLedger()
    expect(ledger.claim(enc, 'alice')).toBe(true)
    // alice disconnects + reconnects; the server re-sends the (still dead) encounter and she retries
    const reReceived = { ...enc } // same id, same dead state
    expect(ledger.claim(reReceived, 'alice')).toBe(false) // already paid — no dupe on reconnect
  })
})
