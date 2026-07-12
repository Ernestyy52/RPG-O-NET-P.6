import { describe, it, expect } from 'vitest'
import {
  isTownFloor, getFloorConfig, getBossStats, getQuestionDifficulty,
  MIN_MONSTERS_PER_FLOOR, TOTAL_FLOORS,
} from '~/data/floors'

describe('floors — town cadence', () => {
  it('town floors occur every 10 floors starting at 1', () => {
    expect(isTownFloor(1)).toBe(true)
    expect(isTownFloor(11)).toBe(true)
    expect(isTownFloor(21)).toBe(true)
    expect(isTownFloor(2)).toBe(false)
    expect(isTownFloor(10)).toBe(false)
  })

  it('town floors have zero monsters; field floors have at least the minimum', () => {
    expect(getFloorConfig(1).monsterCount).toBe(0)
    expect(getFloorConfig(2).monsterCount).toBeGreaterThanOrEqual(MIN_MONSTERS_PER_FLOOR)
    expect(getFloorConfig(80).monsterCount).toBeGreaterThanOrEqual(MIN_MONSTERS_PER_FLOOR)
  })
})

describe('floors — milestone bosses', () => {
  it('flags every 10th floor as a milestone/boss floor', () => {
    expect(getFloorConfig(10).isMilestone).toBe(true)
    expect(getFloorConfig(10).isBossFloor).toBe(true)
    expect(getFloorConfig(9).isMilestone).toBe(false)
  })

  it('boss stats exceed a normal monster on the same floor', () => {
    const floor = 20
    const cfg = getFloorConfig(floor)
    const boss = getBossStats(floor)
    expect(boss.hp).toBeGreaterThan(cfg.monsterHp)
    expect(boss.atk).toBeGreaterThan(cfg.monsterAtk)
    expect(boss.expReward).toBeGreaterThan(cfg.expReward)
  })
})

describe('floors — difficulty scaling is monotonic', () => {
  it('monster hp/atk and rewards never decrease as floors deepen', () => {
    let prev = getFloorConfig(2)
    for (let f = 3; f <= TOTAL_FLOORS; f++) {
      const cur = getFloorConfig(f)
      expect(cur.monsterHp).toBeGreaterThanOrEqual(prev.monsterHp)
      expect(cur.monsterAtk).toBeGreaterThanOrEqual(prev.monsterAtk)
      expect(cur.expReward).toBeGreaterThanOrEqual(prev.expReward)
      expect(cur.goldReward).toBeGreaterThanOrEqual(prev.goldReward)
      prev = cur
    }
  })

  it('question difficulty stays within the O-NET 1..5 band and rises with depth', () => {
    expect(getQuestionDifficulty(1)).toBe(1)
    expect(getQuestionDifficulty(20)).toBe(1)
    expect(getQuestionDifficulty(21)).toBe(2)
    expect(getQuestionDifficulty(100)).toBe(5)
    for (let f = 1; f <= TOTAL_FLOORS; f++) {
      const d = getQuestionDifficulty(f)
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(5)
    }
  })
})
