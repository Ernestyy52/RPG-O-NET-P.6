// Rested bonus (Master Plan Phase 8 — ethical retention): pure-logic tests.
// The property under test throughout: time away can only GRANT, never take.
import { describe, it, expect } from 'vitest'
import {
  RESTED_MIN_GAP_HOURS, RESTED_RATE_PER_DAY, RESTED_MULTIPLIER,
  restedGainFor, accrueRested, consumeRested, hoursBetween, MS_PER_HOUR,
} from '~/data/rested'

const EXP_PER_LEVEL = 1000

describe('rested — accrual', () => {
  it('grants nothing below the minimum gap (a lunch break is not an absence)', () => {
    expect(restedGainFor(0, EXP_PER_LEVEL)).toBe(0)
    expect(restedGainFor(RESTED_MIN_GAP_HOURS - 0.1, EXP_PER_LEVEL)).toBe(0)
  })

  it('grants linearly per day away once past the gap', () => {
    expect(restedGainFor(24, EXP_PER_LEVEL)).toBe(EXP_PER_LEVEL * RESTED_RATE_PER_DAY)
    expect(restedGainFor(48, EXP_PER_LEVEL)).toBe(EXP_PER_LEVEL * RESTED_RATE_PER_DAY * 2)
  })

  it('caps at one level worth of EXP — a month away is not a jackpot', () => {
    expect(restedGainFor(24 * 30, EXP_PER_LEVEL)).toBe(EXP_PER_LEVEL)
    expect(accrueRested(900, 24 * 30, EXP_PER_LEVEL)).toBe(EXP_PER_LEVEL)
  })

  it('never returns a negative or shrinking pool (grant-only guarantee)', () => {
    expect(accrueRested(300, 0, EXP_PER_LEVEL)).toBe(300) // no absence ⇒ pool untouched
    expect(accrueRested(-50, 24, EXP_PER_LEVEL)).toBe(EXP_PER_LEVEL * RESTED_RATE_PER_DAY) // corrupt pool sanitized
    expect(accrueRested(0, Number.NaN, EXP_PER_LEVEL)).toBe(0)
  })
})

describe('rested — consumption', () => {
  it('boosts combat EXP by the multiplier while the pool lasts', () => {
    const { bonus, remaining } = consumeRested(500, 100)
    expect(bonus).toBe(100 * RESTED_MULTIPLIER)
    expect(remaining).toBe(500 - bonus)
  })

  it('drains gracefully: the last drops grant a partial bonus, then zero', () => {
    const low = consumeRested(20, 100)
    expect(low.bonus).toBe(20)
    expect(low.remaining).toBe(0)
    const empty = consumeRested(0, 100)
    expect(empty.bonus).toBe(0)
    expect(empty.remaining).toBe(0)
  })

  it('is safe on corrupt inputs (never negative)', () => {
    expect(consumeRested(-10, 100)).toEqual({ bonus: 0, remaining: 0 })
    expect(consumeRested(50, -5)).toEqual({ bonus: 0, remaining: 50 })
  })
})

describe('rested — absence measurement', () => {
  it('measures hours between timestamps and treats unknown/backwards clocks as zero', () => {
    expect(hoursBetween(1000, 1000 + 8 * MS_PER_HOUR)).toBe(8)
    expect(hoursBetween(0, Date.now())).toBe(0) // first session ever ⇒ no absence
    expect(hoursBetween(2000, 1000)).toBe(0) // clock went backwards ⇒ grant nothing, never punish
  })
})
