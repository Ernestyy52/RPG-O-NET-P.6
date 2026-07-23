import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ensurePlayerDefaults, usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

describe('daily activity player progression', () => {
  it('migrates old save data with safe activity defaults', () => {
    const legacy: { currentFloor: number; dailyActivityDate?: string; dailyActivityFloor?: number } = { currentFloor: 8 }
    ensurePlayerDefaults(legacy)
    expect(legacy.dailyActivityDate).toBe('')
    expect(legacy.dailyActivityFloor).toBe(8)
  })

  it('records elite and rare victories with objective caps', () => {
    const player = usePlayerStore()
    player.currentFloor = 15
    player.refreshDailyActivities('2026-07-20')
    for (let i = 0; i < 8; i++) player.recordActivityVictory({ elite: true, rare: true })
    expect(player.eliteHuntProgress).toBe(player.dailyActivityPlan.eliteTarget)
    expect(player.rareSpawnProgress).toBe(player.dailyActivityPlan.rareTarget)
    expect(player.activityClaimable).toBe(true)
  })

  it('grants each completed activity reward exactly once', () => {
    const player = usePlayerStore()
    player.refreshDailyActivities('2026-07-20')
    player.eliteHuntProgress = player.dailyActivityPlan.eliteTarget
    const gold = player.gold
    expect(player.claimDailyActivity('elite')).toBe(true)
    expect(player.gold).toBe(gold + player.dailyActivityPlan.rewards.elite.gold)
    expect(player.claimDailyActivity('elite')).toBe(false)
  })

  it('rejects stale rift clears and resets cleanly on a new date', () => {
    const player = usePlayerStore()
    player.refreshDailyActivities('2026-07-20')
    expect(player.completeDailyRift('2026-07-19')).toBe(false)
    expect(player.completeDailyRift('2026-07-20')).toBe(true)
    player.refreshDailyActivities('2026-07-21')
    expect(player.dailyRiftCleared).toBe(false)
    expect(player.dailyActivityFloor).toBe(player.currentFloor)
  })
})
