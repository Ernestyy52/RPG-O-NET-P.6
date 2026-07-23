// ================================================================================================
// Encounter rewards (Phase 07, ADR 0002)
//
// Builds and guards the reward for a won encounter. Constitution rule 3: rewards are validated and
// idempotent, never trusted from the UI — so a RewardRequest is normalized (non-negative integers,
// empty loot dropped) and a RewardLedger prevents the same encounter from paying out twice even if
// the win event fires more than once. The actual granting (EXP/gold/gems/level-up) stays in the
// player store; this module decides *what* is owed and *whether* it may still be paid.
// ================================================================================================

/** A single item drop (mirror of LootDrop from data/loot). */
export interface RewardDrop {
  itemId: string
  name: string
  qty: number
}

/** The validated payout owed for one encounter. */
export interface RewardRequest {
  /** stable id for the encounter instance — the idempotency key. */
  encounterId: string
  exp: number
  gold: number
  gems: number
  loot: RewardDrop[]
}

/** Gems awarded for an encounter: none for regular fights, 1 for a boss, 3 for a milestone world boss. */
export function gemsForEncounter(isBoss: boolean, isMilestone: boolean): number {
  if (!isBoss) return 0
  return isMilestone ? 3 : 1
}

export interface RewardInput {
  encounterId: string
  exp: number
  gold: number
  gems: number
  loot?: RewardDrop[]
}

/** Normalize a reward into a safe RewardRequest: non-negative integers, positive-qty loot only. */
export function buildRewardRequest(input: RewardInput): RewardRequest {
  return {
    encounterId: input.encounterId,
    exp: Math.max(0, Math.round(input.exp)),
    gold: Math.max(0, Math.round(input.gold)),
    gems: Math.max(0, Math.round(input.gems)),
    loot: (input.loot ?? []).filter((d) => d.qty > 0),
  }
}

/**
 * Tracks which encounters have already paid out. Call `claim` once per encounter; a repeated claim
 * for the same encounterId returns false so the caller skips a duplicate grant (no double rewards).
 */
export class RewardLedger {
  private readonly granted = new Set<string>()

  /** Returns true and records the encounter the first time; false on any subsequent call. */
  claim(request: RewardRequest): boolean {
    if (this.granted.has(request.encounterId)) return false
    this.granted.add(request.encounterId)
    return true
  }

  /** Whether this encounter has already been paid out. */
  isGranted(encounterId: string): boolean {
    return this.granted.has(encounterId)
  }
}
