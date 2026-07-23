// ================================================================================================
// Co-op server authority (Phase 15)
//
// Pure, framework-agnostic authority logic for SAFE co-op: the SERVER owns online-critical combat +
// reward state so a client can't cheat. Shared by the Colyseus room (server) and — behind COOP_ENABLED
// — the client, which defers to it. Offline single-player NEVER touches this (constitution rule 9: the
// offline deterministic path stays authoritative and byte-identical).
//
// Gate properties, by construction (verified in test/coop.spec.ts):
//  • Client can't claim victory alone — a kill is computed from validated damage the SERVER accumulates;
//    victory (alive=false) is server-owned, never asserted by a client message.
//  • No reward duplication — the reward ledger grants each PARTICIPANT exactly once per encounter;
//    a duplicate/reconnect claim is rejected (idempotent, keyed by stable player id).
//  • Boss synchronized — boss phase derives from the single server-owned HP fraction, so every client
//    reads the same phase (reuses the Phase-14 pure `advanceBossPhase`).
//  • Reconnect safe — participant set + claim ledger are keyed by a stable player id and survive a
//    re-join; re-applying state never double-grants or regresses.
// ================================================================================================
import { advanceBossPhase, bossPhaseSpec, type BossPhaseConfig, type BossPhaseId, type BossPhaseState, initBossPhaseState } from '~/data/combat'

/** Server-authoritative shared encounter (a co-op monster or boss). */
export interface CoopEncounterState {
  id: string
  maxHp: number
  hp: number
  alive: boolean
  /** stable player ids that dealt damage — the only ids eligible to claim the reward. */
  participants: string[]
}

/** Upper bound on a single validated hit (anti-cheat): a client can never one-shot via a huge number. */
export const MAX_COOP_HIT_FRACTION = 0.5 // one hit can remove at most 50% of maxHp

export function createCoopEncounter(id: string, maxHp: number): CoopEncounterState {
  const hp = Math.max(1, Math.round(maxHp))
  return { id, maxHp: hp, hp, alive: true, participants: [] }
}

export interface CoopDamageResult {
  state: CoopEncounterState
  /** true only on the transition to dead (so victory fires exactly once). */
  killed: boolean
  /** damage actually applied after clamping. */
  applied: number
}

/**
 * Apply a player's validated damage to the shared HP. The server owns this — a client sends an intent,
 * the server clamps it (never negative, never above MAX_COOP_HIT_FRACTION of maxHp) and accumulates.
 * Idempotent after death (further hits are a no-op), so a late/duplicate packet can't re-kill or over-grant.
 */
export function applyCoopDamage(state: CoopEncounterState, playerId: string, rawAmount: number): CoopDamageResult {
  if (!state.alive) return { state, killed: false, applied: 0 }
  const cap = Math.max(1, Math.round(state.maxHp * MAX_COOP_HIT_FRACTION))
  const applied = Math.max(0, Math.min(cap, Math.round(rawAmount)))
  const participants = state.participants.includes(playerId) ? state.participants : [...state.participants, playerId]
  const hp = Math.max(0, state.hp - applied)
  const alive = hp > 0
  return {
    state: { ...state, hp, alive, participants },
    killed: !alive, // hp reached 0 this call (state.alive was true above)
    applied,
  }
}

/** HP fraction of the shared encounter (drives the synchronized boss phase). */
export function coopHpFraction(state: CoopEncounterState): number {
  return state.hp / Math.max(1, state.maxHp)
}

/**
 * The server-owned boss phase for a shared encounter, derived purely from its HP fraction. Because every
 * client reads the same server HP, they all resolve the SAME phase — boss synchronized. Re-derivable on
 * reconnect (no stored phase counter).
 */
export function coopBossPhase(config: BossPhaseConfig, state: CoopEncounterState, prev?: BossPhaseState): { state: BossPhaseState; phase: BossPhaseId } {
  const base = prev ?? initBossPhaseState(config, 1)
  const res = advanceBossPhase(base, config, coopHpFraction(state))
  return { state: res.state, phase: res.state.phase }
}

/** Human-readable phase name for UI banners (one of the 3 readable channels). */
export function coopBossPhaseName(config: BossPhaseConfig, phase: BossPhaseId): string {
  return bossPhaseSpec(config, phase).name
}

/**
 * Server-authoritative reward ledger for co-op. Grants each PARTICIPANT of a defeated encounter its
 * reward exactly once. A claim is only honored when the SERVER has confirmed the encounter dead
 * (`alive === false`) — so a client can never "claim victory alone" — and a duplicate/reconnect claim
 * for the same (encounter, player) is rejected — so there is no reward duplication.
 */
export class CoopRewardLedger {
  private readonly claimed = new Set<string>()
  private key(encounterId: string, playerId: string) { return `${encounterId}::${playerId}` }

  /** True when this player may still claim (encounter server-confirmed dead, a participant, not yet paid). */
  canClaim(encounter: CoopEncounterState, playerId: string): boolean {
    return !encounter.alive && encounter.participants.includes(playerId) && !this.claimed.has(this.key(encounter.id, playerId))
  }

  /** Attempt the one-time claim. Returns true (grant now) exactly once per participant; false otherwise. */
  claim(encounter: CoopEncounterState, playerId: string): boolean {
    if (!this.canClaim(encounter, playerId)) return false
    this.claimed.add(this.key(encounter.id, playerId))
    return true
  }

  /** Whether a given (encounter, player) reward was already granted — for reconnect reconciliation. */
  wasClaimed(encounterId: string, playerId: string): boolean {
    return this.claimed.has(this.key(encounterId, playerId))
  }
}
