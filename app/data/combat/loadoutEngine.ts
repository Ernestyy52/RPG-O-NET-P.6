// ================================================================================================
// Loadout combat engine (Master Plan Phase 4 Batch B)
//
// Generalize ของ RealtimeCombat (3 slot) → loadout 5 สกิล + 1 ultimate ที่ตีความ SkillDef ทั้งหมด
// จาก data (skillDefs.ts + statusEffects.ts) — ไม่มี hardcode คู่คอมโบ/ตัวเลขใน engine
//
// Invariants ที่สืบทอดจาก P0/RealtimeCombat (ยืนยันใน test/loadout-engine.spec.ts):
//  • Learning gate: สกิลที่มีส่วนดาเมจต้องจ่าย Insight (จาก validateSkillDefs — data ระดับ) และ
//    engine ปฏิเสธเมื่อ insight ไม่พอ; ตอบถูก = +Insight เสมอ (cap ปรับได้ด้วย passive)
//  • ไม่มี frame-rate dependence: ดาเมจฮีโร่ per-action + cooldown; มอนสเตอร์ยิงตาม cadence คงที่
//    พร้อม carry; DoT/HoT tick ตาม cadence เดียวกับมอนสเตอร์ (นับผ่าน elapsed)
//  • requestSkill validate ก่อน ไม่ mutate เมื่อปฏิเสธ; reset() คืนสถานะตั้งต้นเป๊ะ
//  • Reward ผ่าน buildRewardRequest + RewardLedger เดิม (ไม่ duplicate เส้นทางรางวัล)
// ================================================================================================
import { NEUTRAL_WORLD, comboBonus, heroDamage, type WorldCombatModifier } from './formulas'
import { resolveMonsterAttack } from './engine'
import { CORRECT_ANSWER_MP_REGEN } from './skills'
import { INSIGHT_CAP } from './realtime'
import { buildRewardRequest, type RewardLedger, type RewardRequest } from './rewards'
import { STATUS_EFFECTS, type ActiveStatus, type StatusId } from './statusEffects'
import { getSkillDef, type PassiveHook, type SkillDef, type SkillEffect } from './skillDefs'
import type { CombatEvent } from './types'
import type { RealtimeHero, RealtimeMonster, RealtimeEncounterReward } from './realtime'

export type LoadoutRejection =
  | 'combat-over' | 'hero-down' | 'target-down' | 'on-cooldown'
  | 'insufficient-mp' | 'no-insight' | 'unknown-skill' | 'not-in-loadout'

export interface LoadoutOutcome {
  accepted: boolean
  reason?: LoadoutRejection
  events: CombatEvent[]
  /** คอมโบ data-driven ที่จุดติดในการใช้ครั้งนี้ (consume สำเร็จ) — ให้ UI ฉลอง/สอน */
  comboTriggered?: StatusId[]
}

export interface LoadoutSetup {
  hero: RealtimeHero
  monster: RealtimeMonster
  reward: RealtimeEncounterReward
  /** active skill ids (≤5) + ultimate id — ผ่าน validateLoadout มาแล้ว */
  skills: string[]
  ultimate: string
  passives: string[]
  world?: WorldCombatModifier
  monsterAttackIntervalMs?: number
}

interface WardCharge { incomingMult: number; hits: number }

export interface LoadoutState {
  heroHp: number
  monsterHp: number
  mp: number
  combo: number
  insight: number
  cooldowns: Record<string, number>
  monsterAttackTimer: number
  enemyStatuses: ActiveStatus[]
  selfStatuses: ActiveStatus[]
  wards: WardCharge[]
  /** มอนสเตอร์ถูกหน่วง (stagger/shock) — ms ที่เหลือ */
  staggerMs: number
  elapsedMs: number
  over: boolean
  won: boolean
}

export class LoadoutCombat {
  readonly state: LoadoutState
  private readonly world: WorldCombatModifier
  private readonly baseMonsterIntervalMs: number
  private readonly hooks: Partial<Record<PassiveHook, number>>

  constructor(private readonly setup: LoadoutSetup) {
    this.world = setup.world ?? NEUTRAL_WORLD
    this.baseMonsterIntervalMs = Math.max(1, setup.monsterAttackIntervalMs ?? 1600)
    this.hooks = {}
    for (const pid of setup.passives) {
      const p = getSkillDef(pid)?.passive
      if (!p) continue
      // multiplicative hooks รวมด้วยการคูณ, additive (mp-per-answer / insight-cap) รวมด้วยการบวก
      if (p.hook === 'mp-per-answer' || p.hook === 'insight-cap') {
        this.hooks[p.hook] = (this.hooks[p.hook] ?? 0) + p.value
      } else {
        this.hooks[p.hook] = (this.hooks[p.hook] ?? 1) * p.value
      }
    }
    this.state = this.initialState()
  }

  private initialState(): LoadoutState {
    const cooldowns: Record<string, number> = {}
    for (const id of [...this.setup.skills, this.setup.ultimate]) cooldowns[id] = 0
    return {
      heroHp: this.setup.hero.hp,
      monsterHp: this.setup.monster.hp,
      mp: this.setup.hero.maxMp,
      combo: 0,
      insight: 0,
      cooldowns,
      monsterAttackTimer: this.baseMonsterIntervalMs,
      enemyStatuses: [],
      selfStatuses: [],
      wards: [],
      staggerMs: 0,
      elapsedMs: 0,
      over: false,
      won: false,
    }
  }

  reset(): void { Object.assign(this.state, this.initialState()) }

  insightCap(): number { return INSIGHT_CAP + (this.hooks['insight-cap'] ?? 0) }

  private cooldownOf(def: SkillDef): number {
    return Math.round(def.cooldownMs * (this.hooks['cooldown-mult'] ?? 1))
  }

  private monsterIntervalMs(): number {
    const chill = this.state.enemyStatuses.find((s) => s.id === 'chill')
    return this.baseMonsterIntervalMs * (chill ? STATUS_EFFECTS.chill.slowMult! : 1)
  }

  canUse(skillId: string): boolean { return this.validate(skillId) === undefined }

  validate(skillId: string): LoadoutRejection | undefined {
    if (this.state.over) return 'combat-over'
    if (this.state.heroHp <= 0) return 'hero-down'
    if (this.state.monsterHp <= 0) return 'target-down'
    const def = getSkillDef(skillId)
    if (!def) return 'unknown-skill'
    if (![...this.setup.skills, this.setup.ultimate].includes(skillId)) return 'not-in-loadout'
    if ((this.state.cooldowns[skillId] ?? 0) > 0) return 'on-cooldown'
    if (this.state.mp < def.mpCost) return 'insufficient-mp'
    if (def.insightCost > this.state.insight) return 'no-insight'
    return undefined
  }

  /** คอมโบที่ "พร้อมจุด" ตอนนี้ — ให้ UI telegraph (สอนผู้เล่นแบบไม่บังคับจำลำดับเดียว) */
  readyCombos(skillId: string): StatusId[] {
    const def = getSkillDef(skillId)
    if (!def?.consumes) return []
    return def.consumes.filter((sid) => this.state.enemyStatuses.some((s) => s.id === sid))
  }

  tick(dtMs: number): CombatEvent[] {
    const events: CombatEvent[] = []
    if (this.state.over || dtMs <= 0) return events
    this.state.elapsedMs += dtMs

    for (const id of Object.keys(this.state.cooldowns)) {
      this.state.cooldowns[id] = Math.max(0, this.state.cooldowns[id]! - dtMs)
    }
    for (const s of [...this.state.enemyStatuses, ...this.state.selfStatuses]) s.remainingMs -= dtMs
    this.state.enemyStatuses = this.state.enemyStatuses.filter((s) => s.remainingMs > 0)
    this.state.selfStatuses = this.state.selfStatuses.filter((s) => s.remainingMs > 0)
    this.state.staggerMs = Math.max(0, this.state.staggerMs - dtMs)

    this.state.monsterAttackTimer -= dtMs
    while (this.state.monsterAttackTimer <= 0 && !this.state.over) {
      this.state.monsterAttackTimer += this.monsterIntervalMs()

      // DoT/HoT tick ตามจังหวะมอนสเตอร์ (คงที่ ไม่ขึ้นเฟรมเรต)
      for (const s of this.state.enemyStatuses) {
        const defn = STATUS_EFFECTS[s.id]
        if (defn.dotMultPerTick) {
          const dot = heroDamage(this.setup.hero.atk, this.setup.hero.knowledge, s.magnitude, this.world.knowledge)
          this.state.monsterHp = Math.max(0, this.state.monsterHp - dot)
          events.push({ type: 'hero-attack', damage: dot, combo: 0, comboBonus: 0 })
        }
      }
      for (const s of this.state.selfStatuses) {
        if (STATUS_EFFECTS[s.id].hotPerTick) {
          this.state.heroHp = Math.min(this.setup.hero.maxHp, this.state.heroHp + s.magnitude)
        }
      }
      if (this.state.monsterHp <= 0) { this.win(events); return events }

      // มอนสเตอร์ข้ามตาเมื่อ shock/stagger
      const shocked = this.state.enemyStatuses.some((s) => STATUS_EFFECTS[s.id].skipAttacks)
      if (shocked || this.state.staggerMs > 0) continue

      let mult = 1
      const ward = this.state.wards[0]
      if (ward) {
        mult = ward.incomingMult
        ward.hits -= 1
        if (ward.hits <= 0) this.state.wards.shift()
      }
      mult *= this.hooks['incoming-mult'] ?? 1
      const res = resolveMonsterAttack({ monsterAtk: this.setup.monster.atk, multiplier: mult, heroHp: this.state.heroHp, heroDef: this.setup.hero.def })
      this.state.heroHp = res.targetHpAfter
      events.push({ type: 'monster-attack', damage: res.raw, multiplier: mult })
      if (this.state.heroHp <= 0) {
        this.state.over = true
        this.state.won = false
        events.push({ type: 'hero-defeated' })
      }
    }
    return events
  }

  requestSkill(skillId: string): LoadoutOutcome {
    const reason = this.validate(skillId)
    if (reason) return { accepted: false, reason, events: [] }
    const def = getSkillDef(skillId)!

    this.state.mp -= def.mpCost
    this.state.insight -= def.insightCost
    this.state.cooldowns[skillId] = this.cooldownOf(def)

    const events: CombatEvent[] = []
    const comboTriggered: StatusId[] = []
    for (const effect of def.effects) this.applyEffect(effect, events, comboTriggered)

    if (this.state.monsterHp <= 0 && !this.state.over) this.win(events)
    return { accepted: true, events, comboTriggered }
  }

  private applyEffect(effect: SkillEffect, events: CombatEvent[], comboTriggered: StatusId[]): void {
    switch (effect.kind) {
      case 'damage': {
        let mult = effect.mult * (1 + comboBonus(this.state.combo))
        if (effect.executeBelowPct !== undefined && effect.executeMult !== undefined) {
          const pct = (this.state.monsterHp / this.setup.monster.hp) * 100
          if (pct <= effect.executeBelowPct) mult *= effect.executeMult
        }
        // expose: สถานะขยายดาเมจครั้งถัดไป (spend-on-hit — data-driven)
        const exposeIdx = this.state.enemyStatuses.findIndex((s) => STATUS_EFFECTS[s.id].amplifyNextHit)
        if (exposeIdx >= 0) {
          mult *= this.state.enemyStatuses[exposeIdx]!.magnitude
          this.state.enemyStatuses.splice(exposeIdx, 1)
        }
        mult *= this.hooks['outgoing-mult'] ?? 1
        const dmg = heroDamage(this.setup.hero.atk, this.setup.hero.knowledge, mult, this.world.knowledge)
        this.state.monsterHp = Math.max(0, this.state.monsterHp - dmg)
        events.push({ type: 'hero-attack', damage: dmg, combo: this.state.combo, comboBonus: comboBonus(this.state.combo) })
        break
      }
      case 'apply': {
        const ms = Math.round(effect.ms * (this.hooks['status-duration-mult'] ?? 1))
        const side = STATUS_EFFECTS[effect.status].side
        const list = side === 'enemy' ? this.state.enemyStatuses : this.state.selfStatuses
        const existing = list.find((s) => s.id === effect.status)
        if (existing) {
          existing.remainingMs = Math.max(existing.remainingMs, ms)
          existing.magnitude = Math.max(existing.magnitude, effect.magnitude)
        } else {
          list.push({ id: effect.status, remainingMs: ms, magnitude: effect.magnitude })
        }
        break
      }
      case 'consume': {
        const idx = this.state.enemyStatuses.findIndex((s) => s.id === effect.status)
        if (idx >= 0) {
          this.state.enemyStatuses.splice(idx, 1)
          comboTriggered.push(effect.status)
          this.applyEffect(effect.bonus, events, comboTriggered)
        }
        break
      }
      case 'heal': {
        const amount = Math.round(effect.base * (this.hooks['heal-mult'] ?? 1))
        this.state.heroHp = Math.min(this.setup.hero.maxHp, this.state.heroHp + amount)
        break
      }
      case 'ward':
        this.state.wards.push({ incomingMult: effect.incomingMult, hits: effect.hits })
        break
      case 'mp':
        this.state.mp = Math.min(this.setup.hero.maxMp, this.state.mp + effect.amount)
        break
      case 'combo':
        this.state.combo += effect.delta
        break
      case 'stagger':
        this.state.staggerMs = Math.max(this.state.staggerMs, effect.ms)
        break
    }
  }

  private win(events: CombatEvent[]): void {
    this.state.over = true
    this.state.won = true
    events.push({ type: 'monster-defeated' })
  }

  /** ตอบถูก = +Insight เสมอ (cap ตาม passive) + MP + คอมโบ; ตอบผิด = คอมโบหลุด (Insight ไม่หาย) */
  registerAnswer(correct: boolean): void {
    if (this.state.over) return
    if (correct) {
      this.state.combo += 1
      const regen = CORRECT_ANSWER_MP_REGEN + (this.hooks['mp-per-answer'] ?? 0)
      this.state.mp = Math.min(this.setup.hero.maxMp, this.state.mp + regen)
      this.state.insight = Math.min(this.insightCap(), this.state.insight + 1)
    } else {
      this.state.combo = 0
    }
  }

  buildReward(): RewardRequest { return buildRewardRequest(this.setup.reward) }

  claimReward(ledger: RewardLedger): RewardRequest | null {
    if (!this.state.over || !this.state.won) return null
    const request = this.buildReward()
    return ledger.claim(request) ? request : null
  }
}

// ------------------------------------------------------------------------------------------------
// Loadout validation (5 active + 1 ultimate จาก pool ของ class+job ที่ปลดล็อกแล้ว)
// ------------------------------------------------------------------------------------------------
export const LOADOUT_ACTIVE_SLOTS = 5

export function validateLoadout(
  skills: string[], ultimate: string, passives: string[],
  classId: string, jobId?: string,
): string[] {
  const problems: string[] = []
  if (skills.length === 0 || skills.length > LOADOUT_ACTIVE_SLOTS) problems.push(`loadout has ${skills.length} actives (1..${LOADOUT_ACTIVE_SLOTS})`)
  if (new Set(skills).size !== skills.length) problems.push('duplicate skills in loadout')
  const pool = (id: string) => {
    const def = getSkillDef(id)
    if (!def) return `${id}: unknown skill`
    if (def.classId !== classId) return `${id}: wrong class`
    if (def.jobId && def.jobId !== jobId) return `${id}: job not unlocked`
    return undefined
  }
  for (const id of skills) {
    const err = pool(id)
    if (err) problems.push(err)
    else if (getSkillDef(id)!.kind !== 'active') problems.push(`${id}: not an active skill`)
  }
  const ultErr = pool(ultimate)
  if (ultErr) problems.push(ultErr)
  else if (getSkillDef(ultimate)!.kind !== 'ultimate') problems.push(`${ultimate}: not an ultimate`)
  for (const id of passives) {
    const err = pool(id)
    if (err) problems.push(err)
    else if (getSkillDef(id)!.kind !== 'passive') problems.push(`${id}: not a passive`)
  }
  return problems
}
