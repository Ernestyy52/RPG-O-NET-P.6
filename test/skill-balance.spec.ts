import { describe, it, expect } from 'vitest'
import { LoadoutCombat } from '~/data/combat/loadoutEngine'
import { BUILDS, buildsForClass, type BuildDef } from '~/data/combat/builds'
import { getHeroClass, type HeroClassId } from '~/data/classes'

// ================================================================================================
// Balance simulation (Phase 4 gate evidence)
// นโยบายเล่นแบบ deterministic: ตอบถูกทุก ANSWER_MS, ใช้ ultimate เมื่อพร้อม แล้วไล่ rotation
// ตามลำดับ build — วัด time-to-kill (TTK) และ HP เหลือ ต่อ build × scenario
// Gate:
//  1) ทุก build ชนะทุก scenario (viable — ไม่มี build โชว์)
//  2) ต่อคลาส: ไม่มี build เดียวที่เป็นผู้ชนะทุก scenario (ไม่มี "ทางเดียวที่ถูกต้อง")
//  3) ต่อ scenario: TTK ของ build ต่างๆ ในคลาสเดียวกันห่างกันไม่เกิน PARITY_BAND
//  4) ระหว่างคลาส: median TTK อยู่ใน CLASS_BAND — คลาสไหนก็เคลียร์คอนเทนต์ได้
// ================================================================================================

const ANSWER_MS = 3000
const STEP_MS = 100
const TIMEOUT_MS = 150_000
const HERO_LEVEL = 10

interface Scenario { id: string; monsterHp: number; monsterAtk: number; intervalMs: number }
const SCENARIOS: Scenario[] = [
  { id: 'standard', monsterHp: 320, monsterAtk: 13, intervalMs: 1600 },
  { id: 'brute', monsterHp: 430, monsterAtk: 26, intervalMs: 1300 }, // ไฟต์ยาว+เจ็บ — เอาชีวิตรอด/คุมจังหวะสำคัญ
  { id: 'marathon', monsterHp: 780, monsterAtk: 9, intervalMs: 1800 }, // ดาเมจต่อเนื่องสำคัญ
]

function heroAtLevel(classId: HeroClassId) {
  const hc = getHeroClass(classId)
  const lv = HERO_LEVEL - 1
  const stat = (k: keyof typeof hc.base) => Math.round(hc.base[k] + hc.growth[k] * lv)
  const hp = stat('hp')
  return { atk: stat('atk') + Math.round(stat('mag') * 0.8), knowledge: stat('knowledge'), def: stat('def'), hp, maxHp: hp, maxMp: 20 + HERO_LEVEL * 4 + stat('mag') * 3 }
}

interface SimResult { won: boolean; ttkMs: number; heroHpLeftPct: number }

function simulate(build: BuildDef, sc: Scenario): SimResult {
  const hero = heroAtLevel(build.classId)
  const combat = new LoadoutCombat({
    hero,
    monster: { atk: sc.monsterAtk, hp: sc.monsterHp },
    reward: { encounterId: `${build.id}_${sc.id}`, exp: 0, gold: 0, gems: 0 },
    skills: build.skills, ultimate: build.ultimate, passives: build.passives,
    monsterAttackIntervalMs: sc.intervalMs,
  })
  let nextAnswer = ANSWER_MS
  for (let t = 0; t < TIMEOUT_MS; t += STEP_MS) {
    combat.tick(STEP_MS)
    if (combat.state.over) break
    if (t >= nextAnswer) { combat.registerAnswer(true); nextAnswer += ANSWER_MS }
    // นโยบายทั่วไป (ไม่ผูก build): เก็บ ultimate ไว้ใช้ตอน Insight เต็ม, จุดคอมโบที่พร้อมก่อน,
    // แล้วจึงไล่ตามลำดับ rotation — สะท้อนสิ่งที่ UI telegraph สอนผู้เล่น
    if (combat.state.insight >= combat.insightCap() && combat.canUse(build.ultimate)) {
      combat.requestSkill(build.ultimate)
    }
    const comboReady = build.rotation.find((id) => combat.canUse(id) && combat.readyCombos(id).length > 0)
    if (comboReady) combat.requestSkill(comboReady)
    else for (const id of build.rotation) if (combat.canUse(id)) { combat.requestSkill(id); break }
    if (combat.state.over) break
  }
  return {
    won: combat.state.won,
    ttkMs: combat.state.elapsedMs,
    heroHpLeftPct: (combat.state.heroHp / hero.maxHp) * 100,
  }
}

const PARITY_BAND = 2.2
const CLASS_BAND = 1.9
const CLASSES: HeroClassId[] = ['warrior', 'mage', 'archer', 'guardian']

const results = new Map<string, SimResult>()
for (const b of BUILDS) for (const sc of SCENARIOS) results.set(`${b.id}|${sc.id}`, simulate(b, sc))
const r = (b: BuildDef, sc: Scenario) => results.get(`${b.id}|${sc.id}`)!

describe('skill balance simulation', () => {
  it('every build clears every scenario (all 12 builds viable)', () => {
    for (const b of BUILDS) for (const sc of SCENARIOS) {
      expect(r(b, sc).won, `${b.id} vs ${sc.id} (ttk ${r(b, sc).ttkMs}ms)`).toBe(true)
    }
  })

  it('per class: no single build wins every scenario', () => {
    for (const classId of CLASSES) {
      const builds = buildsForClass(classId)
      const winners = SCENARIOS.map((sc) => {
        // brute วัดความอยู่รอด (HP เหลือ), ที่เหลือวัดความเร็ว
        const rank = sc.id === 'brute'
          ? [...builds].sort((a, b2) => r(b2, sc).heroHpLeftPct - r(a, sc).heroHpLeftPct)
          : [...builds].sort((a, b2) => r(a, sc).ttkMs - r(b2, sc).ttkMs)
        return rank[0]!.id
      })
      expect(new Set(winners).size, `${classId} winners: ${winners.join(', ')}`).toBeGreaterThan(1)
    }
  })

  it('per class per scenario: TTK spread stays inside the parity band', () => {
    for (const classId of CLASSES) for (const sc of SCENARIOS) {
      const ttks = buildsForClass(classId).map((b) => r(b, sc).ttkMs)
      const spread = Math.max(...ttks) / Math.min(...ttks)
      expect(spread, `${classId} ${sc.id}: [${ttks.join(', ')}]`).toBeLessThanOrEqual(PARITY_BAND)
    }
  })

  it('across classes: median standard-scenario TTK stays inside the class band', () => {
    const sc = SCENARIOS[0]!
    const medians = CLASSES.map((c) => {
      const ttks = buildsForClass(c).map((b) => r(b, sc).ttkMs).sort((x, y) => x - y)
      return ttks[Math.floor(ttks.length / 2)]!
    })
    const spread = Math.max(...medians) / Math.min(...medians)
    expect(spread, `medians: ${medians.join(', ')}`).toBeLessThanOrEqual(CLASS_BAND)
  })
})
