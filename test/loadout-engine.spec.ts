import { describe, it, expect } from 'vitest'
import { LoadoutCombat, validateLoadout, type LoadoutSetup } from '~/data/combat/loadoutEngine'
import { RewardLedger } from '~/data/combat/rewards'

const HERO = { atk: 20, knowledge: 6, def: 8, hp: 120, maxHp: 120, maxMp: 40 }
const MONSTER = { atk: 14, hp: 300 }
const REWARD = { encounterId: 'enc-1', exp: 10, gold: 5, gems: 0 }

function makeCombat(over: Partial<LoadoutSetup> = {}): LoadoutCombat {
  return new LoadoutCombat({
    hero: { ...HERO }, monster: { ...MONSTER }, reward: { ...REWARD },
    skills: ['war_rend', 'war_rampage', 'war_crush', 'war_cry', 'war_slam'],
    ultimate: 'war_ult',
    passives: ['war_p_bloodlust', 'war_p_meditate'],
    ...over,
  })
}

describe('loadout engine — learning gate', () => {
  it('rejects every damage skill at 0 insight (no combat bypass)', () => {
    const c = makeCombat()
    expect(c.requestSkill('war_crush')).toMatchObject({ accepted: false, reason: 'no-insight' })
    expect(c.requestSkill('war_ult')).toMatchObject({ accepted: false, reason: 'no-insight' })
    expect(c.state.monsterHp).toBe(MONSTER.hp) // no mutation on rejection
  })

  it('utility skills work without insight (War Cry generator)', () => {
    const c = makeCombat()
    const out = c.requestSkill('war_cry')
    expect(out.accepted).toBe(true)
    expect(c.state.combo).toBe(1)
  })

  it('correct answers always bank insight up to the (passive-adjusted) cap; wrong answers never drain it', () => {
    const c = makeCombat()
    for (let i = 0; i < 10; i++) c.registerAnswer(true)
    expect(c.state.insight).toBe(c.insightCap())
    c.registerAnswer(false)
    expect(c.state.insight).toBe(c.insightCap()) // combo หลุด แต่ Insight ไม่หาย
    expect(c.state.combo).toBe(0)
  })

  it('ultimate costs exactly 3 insight', () => {
    const c = makeCombat()
    for (let i = 0; i < 3; i++) c.registerAnswer(true)
    const out = c.requestSkill('war_ult')
    expect(out.accepted).toBe(true)
    expect(c.state.insight).toBe(0)
  })
})

describe('loadout engine — data-driven combos', () => {
  it('consume bonus fires only when the status is present (rend → rampage)', () => {
    const c1 = makeCombat()
    c1.registerAnswer(true)
    c1.requestSkill('war_rampage') // ไม่มี bleed — ไม่มีโบนัส
    const plain = MONSTER.hp - c1.state.monsterHp

    const c2 = makeCombat()
    c2.registerAnswer(true)
    c2.registerAnswer(true)
    c2.requestSkill('war_rend')
    const afterRend = c2.state.monsterHp
    const out = c2.requestSkill('war_rampage')
    const withCombo = afterRend - c2.state.monsterHp
    expect(out.comboTriggered).toContain('bleed')
    expect(withCombo).toBeGreaterThan(plain)
  })

  it('readyCombos telegraphs when a consume skill would trigger', () => {
    const c = makeCombat()
    expect(c.readyCombos('war_rampage')).toEqual([])
    c.registerAnswer(true)
    c.requestSkill('war_rend')
    expect(c.readyCombos('war_rampage')).toEqual(['bleed'])
  })

  it('bleed ticks damage on the monster cadence without any hero action', () => {
    const c = makeCombat()
    c.registerAnswer(true)
    c.requestSkill('war_rend')
    const before = c.state.monsterHp
    c.tick(1600) // หนึ่งจังหวะมอนสเตอร์ = หนึ่ง DoT tick
    expect(c.state.monsterHp).toBeLessThan(before)
  })
})

describe('loadout engine — defense & determinism', () => {
  it('ward mitigates exactly N hits then expires', () => {
    const noWard = makeCombat()
    noWard.tick(1600)
    const fullHit = HERO.hp - noWard.state.heroHp

    const c = makeCombat()
    c.registerAnswer(true)
    c.requestSkill('war_slam') // ward 0.5 × 1 hit (+ดาเมจ)
    const hpBefore = c.state.heroHp
    c.tick(1600)
    const mitigated = hpBefore - c.state.heroHp
    expect(mitigated).toBeLessThan(fullHit)
    const hpBefore2 = c.state.heroHp
    c.tick(1600) // ward หมดแล้ว
    expect(hpBefore2 - c.state.heroHp).toBeGreaterThanOrEqual(mitigated)
  })

  it('monster hit count over elapsed time is frame-rate independent', () => {
    const a = makeCombat()
    a.tick(8000)
    const b = makeCombat()
    for (let i = 0; i < 80; i++) b.tick(100)
    expect(a.state.heroHp).toBe(b.state.heroHp)
  })

  it('reset restores the exact initial state', () => {
    const c = makeCombat()
    c.registerAnswer(true)
    c.requestSkill('war_rend')
    c.tick(5000)
    c.reset()
    expect(c.state.monsterHp).toBe(MONSTER.hp)
    expect(c.state.heroHp).toBe(HERO.hp)
    expect(c.state.insight).toBe(0)
    expect(c.state.enemyStatuses).toEqual([])
  })

  it('reward claims exactly once through the ledger', () => {
    const c = makeCombat({ monster: { atk: 0, hp: 10 } })
    c.registerAnswer(true)
    c.requestSkill('war_crush')
    expect(c.state.won).toBe(true)
    const ledger = new RewardLedger()
    expect(c.claimReward(ledger)).not.toBeNull()
    expect(c.claimReward(ledger)).toBeNull()
  })
})

describe('loadout validation', () => {
  it('accepts a legal loadout and rejects wrong class / job / duplicates / non-actives', () => {
    expect(validateLoadout(['war_crush'], 'war_ult', ['war_p_hide'], 'warrior')).toEqual([])
    expect(validateLoadout(['mag_bolt'], 'war_ult', [], 'warrior').length).toBeGreaterThan(0)
    expect(validateLoadout(['brk_frenzy'], 'war_ult', [], 'warrior').length).toBeGreaterThan(0) // job ยังไม่เลือก
    expect(validateLoadout(['brk_frenzy'], 'war_ult', [], 'warrior', 'berserker')).toEqual([])
    expect(validateLoadout(['war_crush', 'war_crush'], 'war_ult', [], 'warrior').length).toBeGreaterThan(0)
    expect(validateLoadout(['war_ult'], 'war_ult', [], 'warrior').length).toBeGreaterThan(0)
  })
})
