// ================================================================================================
// Co-op protocol + rollback flag (Phase 15)
//
// The message contract between client and the server-authoritative co-op room. Dormant behind
// COOP_ENABLED: while false, the client never sends these and the offline single-player path (Phase 14)
// is byte-identical. Flip to true only once the server room is deployed + verified (mirrors the
// Phase-14 flag discipline).
// ================================================================================================

/** Rollback flag for co-op server authority. Offline stays authoritative until true. */
export const COOP_ENABLED = false

/** Client → server: "I dealt this much damage to shared encounter `id`." Server validates + clamps. */
export interface CoopDamageMsg { id: string; amount: number }

/** Client → server: "grant my reward for defeated encounter `id`." Server checks the ledger. */
export interface CoopClaimMsg { id: string }

/** Server → client: authoritative shared-encounter snapshot (all clients converge on this). */
export interface CoopEncounterSnapshot {
  id: string
  hp: number
  maxHp: number
  alive: boolean
  /** current boss phase (1|2|3) when the encounter is the boss; omitted for regular monsters. */
  phase?: 1 | 2 | 3
}

/** Server → client: reward granted to THIS player for `id` (sent at most once per participant). */
export interface CoopRewardGrantMsg { id: string; exp: number; gold: number; gems: number }

/** Co-op message names (Colyseus room.send / onMessage keys). */
export const COOP_MSG = {
  damage: 'coop:damage',
  claim: 'coop:claim',
  snapshot: 'coop:snapshot',
  reward: 'coop:reward',
} as const
