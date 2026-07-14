// ================================================================================================
// Real-time action-lite combat engine (Phase 09, ADR 0002)
//
// A deterministic, framework-agnostic combat loop that runs on a wall-clock delta (ms), built ENTIRELY
// on the Phase 07 domain — it reuses resolveHeroSkill/resolveMonsterAttack (no duplicated formula) and
// the RewardLedger (no duplicated reward path). The scene will drive `tick(dt)` from Phaser's update
// and call `requestAttack` on input; this class owns nothing framework-specific so every correctness
// property below is unit-testable.
//
// Phase 09 gate properties, by construction:
//  • No frame-rate-dependent damage. Hero damage is per-ACTION (requestAttack), never per-frame, and is
//    rate-limited by per-skill cooldowns. Monster damage fires on a fixed ms cadence with carry, so the
//    number of hits over an elapsed span is floor(elapsed/interval) regardless of tick granularity.
//  • No invalid attacks. requestAttack validates alive/target/cooldown/MP and REJECTS without mutating.
//  • No duplicate rewards. Victory reward flows through buildRewardRequest + a RewardLedger claim.
//  • Safe reset. reset() restores the exact initial state (cooldowns, timers, combo, HP, MP).
//  • Legacy rollback. Gated by REALTIME_COMBAT_ENABLED; the turn-based BattleModal stays authoritative.
// ================================================================================================
import { NEUTRAL_WORLD, comboBonus, type WorldCombatModifier } from './formulas'
import { resolveHeroSkill, resolveMonsterAttack } from './engine'
import { COMBAT_SKILLS, CORRECT_ANSWER_MP_REGEN, type CombatSkillId } from './skills'
import { buildRewardRequest, type RewardDrop, type RewardLedger, type RewardRequest } from './rewards'
import type { CombatEvent } from './types'

/**
 * Optional per-slot combat override for a class kit (Phase 14 flip #5). When a setup carries a `kit`,
 * each of the three real-time slots uses these numbers instead of the generic COMBAT_SKILLS/timings, so
 * the kit's cooldowns, costs, damage, mitigation and sustain drive the fight. Built by
 * `realtimeKitOverride(classId)` in classKits.ts. Absent ⇒ the legacy generic loop, byte-identical.
 */
export interface RealtimeSlotOverride {
  cooldownMs: number
  mpCost: number
  /** strike/counter hero-damage multiplier (folded with combo for the attack slot). 0/undefined ⇒ no damage. */
  damageMultiplier?: number
  /** guard/counter: multiplier applied to the NEXT incoming monster hit (e.g. 0.4 ⇒ 60% mitigated). */
  incomingMultiplier?: number
  /** heal: flat HP restored on use (capped at maxHp). */
  healBase?: number
  /** rally: MP restored on use; also empowers the combo by one step. */
  rallyValue?: number
}
export type RealtimeKitOverride = Record<'attack' | 'support' | 'counter', RealtimeSlotOverride>

/** Per-skill real-time timing. mpCost is sourced from COMBAT_SKILLS so costs live in one place. */
export interface RealtimeSkillTiming {
  cooldownMs: number
}

/** Cooldowns for the action-lite loop. Attack is spammable-but-bounded; utilities are slower. */
export const REALTIME_SKILL_TIMINGS: Record<'attack' | 'support' | 'counter', RealtimeSkillTiming> = {
  attack: { cooldownMs: 500 },
  support: { cooldownMs: 6000 },
  counter: { cooldownMs: 3000 },
}

/** Default monster attack cadence (ms between hits). */
export const DEFAULT_MONSTER_ATTACK_INTERVAL_MS = 1600

export type RealtimeSkillId = keyof typeof REALTIME_SKILL_TIMINGS

export type AttackRejection = 'combat-over' | 'hero-down' | 'target-down' | 'on-cooldown' | 'insufficient-mp' | 'unknown-skill'

export interface AttackOutcome {
  accepted: boolean
  reason?: AttackRejection
  events: CombatEvent[]
}

export interface RealtimeHero {
  atk: number
  knowledge: number
  def: number
  hp: number
  maxHp: number
  maxMp: number
}

export interface RealtimeMonster {
  atk: number
  hp: number
}

export interface RealtimeEncounterReward {
  encounterId: string
  exp: number
  gold: number
  gems: number
  loot?: RewardDrop[]
}

export interface RealtimeCombatSetup {
  hero: RealtimeHero
  monster: RealtimeMonster
  reward: RealtimeEncounterReward
  world?: WorldCombatModifier
  monsterAttackIntervalMs?: number
  /** class-kit per-slot override (flip #5). Absent ⇒ the generic legacy loop, byte-identical. */
  kit?: RealtimeKitOverride
}

export interface RealtimeCombatState {
  heroHp: number
  monsterHp: number
  mp: number
  combo: number
  /** skillId → remaining cooldown ms. */
  cooldowns: Record<RealtimeSkillId, number>
  /** ms until the monster's next attack. */
  monsterAttackTimer: number
  /** kit guard/counter mitigation queued for the NEXT incoming hit (null ⇒ full damage). Kit-only. */
  pendingIncomingMultiplier: number | null
  elapsedMs: number
  over: boolean
  won: boolean
}

export class RealtimeCombat {
  readonly state: RealtimeCombatState
  private readonly world: WorldCombatModifier
  private readonly monsterIntervalMs: number

  private readonly kit?: RealtimeKitOverride

  constructor(private readonly setup: RealtimeCombatSetup) {
    this.world = setup.world ?? NEUTRAL_WORLD
    this.monsterIntervalMs = Math.max(1, setup.monsterAttackIntervalMs ?? DEFAULT_MONSTER_ATTACK_INTERVAL_MS)
    this.kit = setup.kit
    this.state = this.initialState()
  }

  private initialState(): RealtimeCombatState {
    return {
      heroHp: this.setup.hero.hp,
      monsterHp: this.setup.monster.hp,
      mp: this.setup.hero.maxMp,
      combo: 0,
      cooldowns: { attack: 0, support: 0, counter: 0 },
      monsterAttackTimer: this.monsterIntervalMs,
      pendingIncomingMultiplier: null,
      elapsedMs: 0,
      over: false,
      won: false,
    }
  }

  /** Restore the exact starting state — safe reset for a restart/respawn without reallocating. */
  reset(): void {
    Object.assign(this.state, this.initialState())
  }

  private mpCost(skill: RealtimeSkillId): number {
    return this.kit ? this.kit[skill].mpCost : COMBAT_SKILLS[skill as CombatSkillId].mpCost
  }

  /** Effective cooldown for a slot — the kit's per-slot value when a kit is equipped, else the generic timing. */
  skillCooldownMs(skill: RealtimeSkillId): number {
    return this.kit ? this.kit[skill].cooldownMs : REALTIME_SKILL_TIMINGS[skill].cooldownMs
  }

  /** True when the skill is off cooldown, affordable, and both combatants are alive. */
  canAttack(skill: RealtimeSkillId): boolean {
    return this.validate(skill) === undefined
  }

  private validate(skill: RealtimeSkillId): AttackRejection | undefined {
    if (this.state.over) return 'combat-over'
    if (this.state.heroHp <= 0) return 'hero-down'
    if (this.state.monsterHp <= 0) return 'target-down'
    if (!REALTIME_SKILL_TIMINGS[skill]) return 'unknown-skill'
    if (this.state.cooldowns[skill] > 0) return 'on-cooldown'
    if (this.state.mp < this.mpCost(skill)) return 'insufficient-mp'
    return undefined
  }

  /**
   * Advance the clock by `dtMs`: tick down cooldowns and fire monster attacks on their fixed cadence.
   * Handles dt larger than the interval (loops), so hit count over an elapsed span is independent of
   * frame rate. Returns the events that occurred this tick.
   */
  tick(dtMs: number): CombatEvent[] {
    const events: CombatEvent[] = []
    if (this.state.over || dtMs <= 0) return events
    this.state.elapsedMs += dtMs

    for (const skill of Object.keys(this.state.cooldowns) as RealtimeSkillId[]) {
      this.state.cooldowns[skill] = Math.max(0, this.state.cooldowns[skill] - dtMs)
    }

    this.state.monsterAttackTimer -= dtMs
    while (this.state.monsterAttackTimer <= 0 && !this.state.over) {
      this.state.monsterAttackTimer += this.monsterIntervalMs
      // a queued kit guard/counter softens exactly one incoming hit, then clears (kit-only; null ⇒ 1×)
      const mitigation = this.state.pendingIncomingMultiplier ?? 1
      this.state.pendingIncomingMultiplier = null
      const res = resolveMonsterAttack({ monsterAtk: this.setup.monster.atk, multiplier: mitigation, heroHp: this.state.heroHp, heroDef: this.setup.hero.def })
      this.state.heroHp = res.targetHpAfter
      events.push({ type: 'monster-attack', damage: res.raw, multiplier: mitigation })
      if (this.state.heroHp <= 0) {
        this.state.over = true
        this.state.won = false
        events.push({ type: 'hero-defeated' })
      }
    }
    return events
  }

  /**
   * Attempt a hero skill. Validates first and returns a rejection WITHOUT mutating on failure (no
   * invalid attacks). On success it spends MP, starts the cooldown, applies domain damage, and ends
   * combat on a kill. Attack damage folds in the current combo (knowledge-driven), same as turn combat.
   */
  requestAttack(skill: RealtimeSkillId): AttackOutcome {
    const reason = this.validate(skill)
    if (reason) return { accepted: false, reason, events: [] }

    this.state.mp -= this.mpCost(skill)
    this.state.cooldowns[skill] = this.skillCooldownMs(skill)

    const events: CombatEvent[] = []
    const ov = this.kit?.[skill]
    // Kit strike folds the combo bonus into the kit multiplier (so combo stays a % bonus on any base);
    // a kit counter uses its flat multiplier (0 ⇒ a pure guard). No kit ⇒ the legacy skill multiplier.
    let multiplierOverride: number | undefined
    if (ov) multiplierOverride = skill === 'attack' ? (ov.damageMultiplier ?? 0) * (1 + comboBonus(this.state.combo)) : (ov.damageMultiplier ?? 0)
    const res = resolveHeroSkill(skill as CombatSkillId, {
      atk: this.setup.hero.atk,
      knowledge: this.setup.hero.knowledge,
      combo: this.state.combo,
      monsterHp: this.state.monsterHp,
      world: this.world,
    }, multiplierOverride)
    this.state.monsterHp = res.targetHpAfter

    if (skill === 'attack') events.push({ type: 'hero-attack', damage: res.raw, combo: this.state.combo, comboBonus: comboBonus(this.state.combo) })
    else if (skill === 'counter') events.push({ type: 'hero-counter', damage: res.raw })

    // Kit slot side-effects (engine-owned so they're deterministic + testable): queue mitigation for the
    // next hit (guard/counter), restore HP (heal, capped at maxHp), or restore MP + empower combo (rally).
    if (ov) {
      if (ov.incomingMultiplier !== undefined) this.state.pendingIncomingMultiplier = ov.incomingMultiplier
      if (ov.healBase) this.state.heroHp = Math.min(this.setup.hero.maxHp, this.state.heroHp + ov.healBase)
      if (ov.rallyValue) { this.state.mp = Math.min(this.setup.hero.maxMp, this.state.mp + ov.rallyValue); this.state.combo += 1 }
    }

    if (this.state.monsterHp <= 0) {
      this.state.over = true
      this.state.won = true
      events.push({ type: 'monster-defeated' })
    }
    return { accepted: true, events }
  }

  /**
   * Record a question answer: a correct answer builds combo and regens MP (couples knowledge to the
   * combat resource, mirroring turn-based recordCorrectAnswer); a wrong answer resets the combo.
   */
  registerAnswer(correct: boolean): void {
    if (this.state.over) return
    if (correct) {
      this.state.combo += 1
      this.state.mp = Math.min(this.setup.hero.maxMp, this.state.mp + CORRECT_ANSWER_MP_REGEN)
    } else {
      this.state.combo = 0
    }
  }

  /** The validated reward for this encounter (non-negative integers, empty loot dropped). */
  buildReward(): RewardRequest {
    return buildRewardRequest(this.setup.reward)
  }

  /**
   * Grant the victory reward through a ledger exactly once. Returns the RewardRequest to apply when the
   * claim succeeds, or null when combat wasn't won or the reward was already claimed (no duplicates).
   */
  claimReward(ledger: RewardLedger): RewardRequest | null {
    if (!this.state.over || !this.state.won) return null
    const request = this.buildReward()
    return ledger.claim(request) ? request : null
  }
}
