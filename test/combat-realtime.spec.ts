import { describe, it, expect } from 'vitest'
import {
  RealtimeCombat, REALTIME_SKILL_TIMINGS, RewardLedger,
  mitigateDamage, heroDamage, comboBonus,
  type RealtimeCombatSetup,
} from '~/data/combat'

// ================================================================================================
// Phase 09 — real-time action-lite combat: frame-rate independence, no invalid attacks, no duplicate
// rewards, safe reset. All properties verified at the (pure) domain layer.
// ================================================================================================

function makeSetup(over: Partial<RealtimeCombatSetup> = {}): RealtimeCombatSetup {
  return {
    hero: { atk: 12, knowledge: 10, def: 6, hp: 1000, maxMp: 30 },
    monster: { atk: 20, hp: 300 },
    reward: { encounterId: 'rt-1', exp: 40, gold: 12, gems: 0 },
    monsterAttackIntervalMs: 400,
    ...over,
  }
}

describe('RealtimeCombat — frame-rate independent monster damage', () => {
  it('applies the same total monster damage regardless of tick granularity', () => {
    const fine = new RealtimeCombat(makeSetup())
    const coarse = new RealtimeCombat(makeSetup())
    const huge = new RealtimeCombat(makeSetup())

    for (let i = 0; i < 200; i++) fine.tick(10) // 200 × 10ms = 2000ms
    for (let i = 0; i < 5; i++) coarse.tick(400) // 5 × 400ms = 2000ms
    huge.tick(2000) // single big frame

    // interval 400ms over 2000ms ⇒ 5 hits; per-hit damage is fixed (not dt-scaled)
    const perHit = mitigateDamage(20, 6)
    expect(fine.state.heroHp).toBe(1000 - 5 * perHit)
    expect(coarse.state.heroHp).toBe(fine.state.heroHp)
    expect(huge.state.heroHp).toBe(fine.state.heroHp)
  })

  it('does not advance on a non-positive dt', () => {
    const rt = new RealtimeCombat(makeSetup())
    rt.tick(0)
    rt.tick(-100)
    expect(rt.state.heroHp).toBe(1000)
    expect(rt.state.elapsedMs).toBe(0)
  })
})

describe('RealtimeCombat — no invalid attacks', () => {
  it('rejects a second attack while on cooldown without mutating state', () => {
    const rt = new RealtimeCombat(makeSetup())
    const first = rt.requestAttack('attack')
    expect(first.accepted).toBe(true)
    const hpAfterFirst = rt.state.monsterHp
    const second = rt.requestAttack('attack')
    expect(second.accepted).toBe(false)
    expect(second.reason).toBe('on-cooldown')
    expect(rt.state.monsterHp).toBe(hpAfterFirst) // unchanged
  })

  it('allows the attack again once the cooldown elapses', () => {
    const rt = new RealtimeCombat(makeSetup())
    rt.requestAttack('attack')
    rt.tick(REALTIME_SKILL_TIMINGS.attack.cooldownMs)
    expect(rt.canAttack('attack')).toBe(true)
    expect(rt.requestAttack('attack').accepted).toBe(true)
  })

  it('rejects a skill the hero cannot afford', () => {
    const rt = new RealtimeCombat(makeSetup({ hero: { atk: 12, knowledge: 10, def: 6, hp: 1000, maxMp: 4 } }))
    const out = rt.requestAttack('support') // costs 8 MP, only 4 available
    expect(out.accepted).toBe(false)
    expect(out.reason).toBe('insufficient-mp')
    expect(rt.state.mp).toBe(4) // not spent
  })

  it('rejects attacks once the target is dead and marks victory', () => {
    const rt = new RealtimeCombat(makeSetup({ monster: { atk: 20, hp: 1 } }))
    const kill = rt.requestAttack('attack')
    expect(kill.accepted).toBe(true)
    expect(rt.state.over).toBe(true)
    expect(rt.state.won).toBe(true)
    const after = rt.requestAttack('attack')
    expect(after.accepted).toBe(false)
    expect(after.reason).toBe('combat-over')
  })

  it('rejects hero attacks after the hero is downed', () => {
    const rt = new RealtimeCombat(makeSetup({ hero: { atk: 12, knowledge: 10, def: 0, hp: 5, maxMp: 30 }, monster: { atk: 999, hp: 300 } }))
    rt.tick(400) // monster hits for a lethal blow
    expect(rt.state.heroHp).toBe(0)
    expect(rt.state.over).toBe(true)
    expect(rt.requestAttack('attack').reason).toBe('combat-over')
  })
})

describe('RealtimeCombat — combo-scaled hero damage (reuses Phase 07 formula)', () => {
  it('a built combo increases attack damage to match heroDamage(1+comboBonus)', () => {
    const rt = new RealtimeCombat(makeSetup())
    rt.registerAnswer(true)
    rt.registerAnswer(true)
    rt.registerAnswer(true) // combo = 3
    const before = rt.state.monsterHp
    rt.requestAttack('attack')
    const dealt = before - rt.state.monsterHp
    expect(dealt).toBe(heroDamage(12, 10, 1 + comboBonus(3), 1))
  })

  it('a wrong answer resets the combo; correct answers regen MP up to max', () => {
    const rt = new RealtimeCombat(makeSetup({ hero: { atk: 12, knowledge: 10, def: 6, hp: 1000, maxMp: 30 } }))
    rt.requestAttack('support') // spend 8 → mp 22
    rt.registerAnswer(true) // +2 → 24
    expect(rt.state.mp).toBe(24)
    rt.registerAnswer(true)
    rt.registerAnswer(true) // combo 3
    expect(rt.state.combo).toBe(3)
    rt.registerAnswer(false)
    expect(rt.state.combo).toBe(0)
  })
})

describe('RealtimeCombat — rewards are idempotent (no duplicates)', () => {
  it('claims the victory reward exactly once through the ledger', () => {
    const rt = new RealtimeCombat(makeSetup({ monster: { atk: 20, hp: 1 }, reward: { encounterId: 'win-1', exp: 40, gold: 12, gems: 1 } }))
    rt.requestAttack('attack')
    const ledger = new RewardLedger()
    const first = rt.claimReward(ledger)
    expect(first).not.toBeNull()
    expect(first).toMatchObject({ encounterId: 'win-1', exp: 40, gold: 12, gems: 1 })
    expect(rt.claimReward(ledger)).toBeNull() // second claim blocked
  })

  it('grants nothing when combat was not won', () => {
    const rt = new RealtimeCombat(makeSetup())
    expect(rt.claimReward(new RewardLedger())).toBeNull()
  })
})

describe('RealtimeCombat — safe reset', () => {
  it('restores the exact initial state', () => {
    const rt = new RealtimeCombat(makeSetup())
    rt.requestAttack('attack')
    rt.registerAnswer(true)
    rt.tick(800)
    rt.reset()
    expect(rt.state).toMatchObject({
      heroHp: 1000, monsterHp: 300, mp: 30, combo: 0,
      cooldowns: { attack: 0, support: 0, counter: 0 },
      monsterAttackTimer: 400, elapsedMs: 0, over: false, won: false,
    })
    // fully playable again after reset
    expect(rt.requestAttack('attack').accepted).toBe(true)
  })
})
