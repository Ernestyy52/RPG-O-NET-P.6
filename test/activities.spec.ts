import { describe, expect, it } from 'vitest'
import { DAILY_RIFT_MODIFIER_LABELS, DAILY_RIFT_VARIANTS, activityCompleted, dailyActivityPlan, dailyRiftLayout } from '~/data/activities'
import { getDungeonLayout, layoutReachability } from '~/game/runtime/dungeonLayouts'

describe('short daily activities', () => {
  it('is deterministic for the same date and floor', () => {
    expect(dailyActivityPlan('2026-07-20', 27)).toEqual(dailyActivityPlan('2026-07-20', 27))
    expect(dailyActivityPlan('2026-07-20', 27)).not.toEqual(dailyActivityPlan('2026-07-21', 27))
  })

  it('creates bounded elite, rare and rift objectives', () => {
    const plan = dailyActivityPlan('2026-07-20', 999)
    expect(plan.floor).toBe(100)
    expect(plan.eliteTarget).toBe(3)
    expect(plan.rareTarget).toBe(1)
    expect(plan.monsterPool.length).toBeGreaterThan(0)
    expect(plan.rewards.rift.gems).toBe(1)
  })

  it('evaluates each objective independently', () => {
    const plan = dailyActivityPlan('2026-07-20', 1)
    const state = { eliteProgress: 3, rareProgress: 0, riftCleared: true }
    expect(activityCompleted('elite', state, plan)).toBe(true)
    expect(activityCompleted('rare', state, plan)).toBe(false)
    expect(activityCompleted('rift', state, plan)).toBe(true)
  })

  it('builds a reachable daily rift without mutating the campaign layout', () => {
    const plan = dailyActivityPlan('2026-07-20', 34)
    const base = getDungeonLayout(plan.baseLayoutId)
    const daily = dailyRiftLayout(plan, base)
    expect(daily.name).toContain(plan.riftName)
    expect(daily.name).toContain(plan.layoutVariantName)
    expect(daily.elites).toEqual([{ slug: plan.eliteMonster, at: expect.any(Object) }])
    expect(daily.bossGate).toBeUndefined()
    expect(layoutReachability(daily).ok).toBe(true)
    expect(base.id).toBe(plan.baseLayoutId)
    expect(base.name).not.toBe(plan.riftName)
  })

  it('offers eight distinct reachable route variants', () => {
    expect(DAILY_RIFT_VARIANTS).toHaveLength(8)
    expect(new Set(DAILY_RIFT_VARIANTS.map((variant) => variant.id)).size).toBe(8)

    for (const variant of DAILY_RIFT_VARIANTS) {
      const seedPlan = dailyActivityPlan('2026-07-20', 34)
      const plan = {
        ...seedPlan,
        baseLayoutId: variant.baseLayoutId,
        layoutVariantId: variant.id,
        layoutVariantName: variant.name,
      }
      const rift = dailyRiftLayout(plan, getDungeonLayout(variant.baseLayoutId))
      expect(layoutReachability(rift), variant.id).toMatchObject({ ok: true })
      expect(rift.spawns.length, variant.id).toBeGreaterThan(0)
    }
  })

  it('selects two unique, described modifiers and only adds a timer for Chrono Seal', () => {
    for (let day = 1; day <= 31; day++) {
      const date = `2026-07-${String(day).padStart(2, '0')}`
      const plan = dailyActivityPlan(date, 42)
      expect(plan.modifiers).toHaveLength(2)
      expect(new Set(plan.modifiers).size).toBe(2)
      for (const modifier of plan.modifiers) expect(DAILY_RIFT_MODIFIER_LABELS[modifier]).toBeDefined()
      expect(plan.timeLimitSec).toBe(plan.modifiers.includes('time-trial') ? 210 : undefined)
    }
  })
})
