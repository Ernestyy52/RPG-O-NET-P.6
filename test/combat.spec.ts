import { describe, it, expect } from 'vitest'
import {
  comboBonus, heroDamage, monsterDamage, mitigateDamage, supportHeal, escapeChance,
  heroWinsInitiative, scaleMonsterAtk,
  resolveHeroSkill, resolveMonsterAttack, setupEncounter,
  gemsForEncounter, buildRewardRequest, RewardLedger,
  heroActionMultiplier, COMBAT_SKILLS, SUPPORT_MP, COUNTER_MP,
} from '~/data/combat'

// ================================================================================================
// Phase 07 equivalence tests — every extracted formula must reproduce the legacy inline expression
// from BattleModal.vue / player.ts EXACTLY. Each `legacy*` closure below is the pre-extraction code.
// ================================================================================================

const legacyHeroDamage = (atk: number, kno: number, mult: number, worldKno: number) =>
  Math.max(3, Math.round((atk + kno * 0.6) * mult * worldKno))
const legacyComboBonus = (combo: number) => Math.min(0.6, Math.max(0, combo - 1) * 0.15)
const legacyMitigate = (amount: number, def: number) => Math.max(1, Math.round(amount - def * 0.55))
const legacyMonsterDamage = (atk: number, mult: number) => Math.round(atk * mult)
const legacySupportHeal = (kno: number) => Math.round(14 + kno * 2)
const legacyEscape = (speed: number) => Math.min(0.85, 0.35 + speed / 40)

describe('combat formulas — equivalence with legacy inline math', () => {
  it('comboBonus matches legacy across the stack range', () => {
    for (let c = 0; c <= 10; c++) expect(comboBonus(c)).toBe(legacyComboBonus(c))
    expect(comboBonus(1)).toBe(0)
    expect(comboBonus(5)).toBe(0.6) // capped
  })

  it('heroDamage matches legacy across atk/knowledge/multiplier/world grid', () => {
    for (const atk of [0, 5, 12, 40]) {
      for (const kno of [0, 3, 10, 25]) {
        for (const mult of [0.65, 1, 1.15, 1.6]) {
          for (const w of [1, 1.05, 1.1, 1.15]) {
            expect(heroDamage(atk, kno, mult, w)).toBe(legacyHeroDamage(atk, kno, mult, w))
          }
        }
      }
    }
  })

  it('heroDamage floors at 3', () => {
    expect(heroDamage(0, 0, 1, 1)).toBe(3)
  })

  it('monsterDamage matches legacy round(atk*mult)', () => {
    for (const atk of [3, 7, 20, 55]) {
      for (const mult of [0.45, 1]) expect(monsterDamage(atk, mult)).toBe(legacyMonsterDamage(atk, mult))
    }
  })

  it('mitigateDamage matches legacy def seam and never drops below 1', () => {
    for (const dmg of [1, 5, 10, 40]) {
      for (const def of [0, 4, 9, 30]) expect(mitigateDamage(dmg, def)).toBe(legacyMitigate(dmg, def))
    }
    expect(mitigateDamage(1, 999)).toBe(1)
  })

  it('supportHeal and escapeChance match legacy', () => {
    for (const kno of [0, 3, 10, 25]) expect(supportHeal(kno)).toBe(legacySupportHeal(kno))
    for (const spd of [4, 10, 20, 40, 80]) expect(escapeChance(spd)).toBe(legacyEscape(spd))
    expect(escapeChance(999)).toBe(0.85) // capped
  })

  it('heroWinsInitiative matches legacy speed comparison', () => {
    expect(heroWinsInitiative(10, 8, 1)).toBe(true)
    expect(heroWinsInitiative(8, 8, 1)).toBe(true) // tie → hero
    expect(heroWinsInitiative(8, 10, 1)).toBe(false)
    expect(heroWinsInitiative(10, 11, 1.15)).toBe(true) // world speed lifts hero over
  })

  it('scaleMonsterAtk matches legacy round(atk*worldMod)', () => {
    expect(scaleMonsterAtk(10, 1.15)).toBe(Math.round(10 * 1.15))
    expect(scaleMonsterAtk(7, 0.95)).toBe(Math.round(7 * 0.95))
  })
})

describe('combat skills — action multipliers & costs', () => {
  it('attack multiplier folds in the combo bonus; counter is fixed 0.65', () => {
    expect(heroActionMultiplier('attack', comboBonus(1))).toBe(1)
    expect(heroActionMultiplier('attack', comboBonus(3))).toBe(1 + 0.3)
    expect(heroActionMultiplier('counter', comboBonus(3))).toBe(0.65)
    expect(heroActionMultiplier('support', 0)).toBe(0)
  })

  it('MP costs match the legacy constants', () => {
    expect(COMBAT_SKILLS.support.mpCost).toBe(SUPPORT_MP)
    expect(COMBAT_SKILLS.counter.mpCost).toBe(COUNTER_MP)
    expect(SUPPORT_MP).toBe(8)
    expect(COUNTER_MP).toBe(6)
    expect(COMBAT_SKILLS.counter.retaliationMultiplier).toBe(0.45)
  })
})

describe('combat engine — resolvers reproduce legacy turn math', () => {
  it('resolveHeroSkill attack equals heroDamage(1+comboBonus) and subtracts from monster HP', () => {
    const ctx = { atk: 12, knowledge: 10, combo: 3, monsterHp: 100, world: { playerSpeed: 1, monsterAtk: 1, knowledge: 1.1 } }
    const res = resolveHeroSkill('attack', ctx)
    const expected = legacyHeroDamage(12, 10, 1 + legacyComboBonus(3), 1.1)
    expect(res.raw).toBe(expected)
    expect(res.targetHpAfter).toBe(100 - expected)
  })

  it('resolveHeroSkill counter uses the 0.65 multiplier', () => {
    const res = resolveHeroSkill('counter', { atk: 12, knowledge: 10, combo: 5, monsterHp: 50 })
    expect(res.raw).toBe(legacyHeroDamage(12, 10, 0.65, 1))
  })

  it('resolveHeroSkill clamps monster HP at 0 on a lethal hit', () => {
    const res = resolveHeroSkill('attack', { atk: 999, knowledge: 999, combo: 1, monsterHp: 5 })
    expect(res.targetHpAfter).toBe(0)
  })

  it('resolveMonsterAttack applies mitigation and clamps hero HP', () => {
    const res = resolveMonsterAttack({ monsterAtk: 20, multiplier: 0.45, heroHp: 40, heroDef: 6 })
    const raw = legacyMonsterDamage(20, 0.45)
    expect(res.raw).toBe(raw)
    expect(res.applied).toBe(legacyMitigate(raw, 6))
    expect(res.targetHpAfter).toBe(40 - legacyMitigate(raw, 6))
    const lethal = resolveMonsterAttack({ monsterAtk: 999, heroHp: 3, heroDef: 0 })
    expect(lethal.targetHpAfter).toBe(0)
  })
})

describe('combat engine — setupEncounter mirrors setupMonster', () => {
  const cfg = { monsterHp: 30, monsterAtk: 4, monsterLevel: 6, expReward: 45, goldReward: 12 }

  it('uses floor defaults when the payload is empty', () => {
    const s = setupEncounter({}, cfg, { playerSpeed: 1, monsterAtk: 1.15, knowledge: 1 })
    expect(s.name).toBe('Dungeon Monster')
    expect(s.maxHp).toBe(30)
    expect(s.atk).toBe(Math.round(4 * 1.15))
    expect(s.speed).toBe(6)
    expect(s.isBoss).toBe(false)
    expect(s.expReward).toBe(45)
  })

  it('applies boss overrides: name, +4 speed, payload rewards', () => {
    const s = setupEncounter(
      { isBoss: true, name: 'Gatekeeper', hp: 200, atk: 18, speed: 10, expReward: 400, goldReward: 120 },
      cfg,
      { playerSpeed: 1, monsterAtk: 1, knowledge: 1 },
    )
    expect(s.name).toBe('Gatekeeper')
    expect(s.maxHp).toBe(200)
    expect(s.speed).toBe(10 + 4)
    expect(s.isBoss).toBe(true)
    expect(s.expReward).toBe(400)
    expect(s.goldReward).toBe(120)
  })
})

describe('combat rewards — gems, validation, idempotency', () => {
  it('gemsForEncounter: 0 normal, 1 boss, 3 milestone boss', () => {
    expect(gemsForEncounter(false, false)).toBe(0)
    expect(gemsForEncounter(false, true)).toBe(0)
    expect(gemsForEncounter(true, false)).toBe(1)
    expect(gemsForEncounter(true, true)).toBe(3)
  })

  it('buildRewardRequest clamps to non-negative integers and drops empty loot', () => {
    const r = buildRewardRequest({
      encounterId: 'e1', exp: 12.7, gold: -5, gems: 1.2,
      loot: [{ itemId: 'a', name: 'A', qty: 2 }, { itemId: 'b', name: 'B', qty: 0 }],
    })
    expect(r.exp).toBe(13)
    expect(r.gold).toBe(0)
    expect(r.gems).toBe(1)
    expect(r.loot).toEqual([{ itemId: 'a', name: 'A', qty: 2 }])
  })

  it('RewardLedger pays each encounter exactly once', () => {
    const ledger = new RewardLedger()
    const req = buildRewardRequest({ encounterId: 'battle-1', exp: 10, gold: 5, gems: 0 })
    expect(ledger.claim(req)).toBe(true)
    expect(ledger.claim(req)).toBe(false) // duplicate win event → no second payout
    expect(ledger.isGranted('battle-1')).toBe(true)
    expect(ledger.claim(buildRewardRequest({ encounterId: 'battle-2', exp: 1, gold: 1, gems: 0 }))).toBe(true)
  })
})
