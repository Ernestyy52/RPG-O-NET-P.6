// ================================================================================================
// Monster intents (S-grade gameplay pass) — telegraphed next moves for turn-based combat.
//
// The monster announces what it will do on its next turn (Slay-the-Spire-style intent), which gives
// Counter/Support/Item real timing decisions instead of being flavor buttons:
//   • attack — normal hit (×1)
//   • heavy  — wind-up smash (×1.7) → the turn to Counter (mitigation) or heal first
//   • snarl  — threatens but does NOT attack (×0) → a free turn to answer/set up
//
// Pure + deterministic under an injected RNG. Flag-gated (constitution rule 6): flag off ⇒ the
// BattleModal never reads an intent and monster turns behave exactly as before.
// ================================================================================================

export const MONSTER_INTENTS_ENABLED = true

export type MonsterIntentId = 'attack' | 'heavy' | 'snarl'

export interface MonsterIntent {
  id: MonsterIntentId
  icon: string
  labelEn: string
  labelTh: string
  /** damage multiplier applied to the monster's next attack (0 = no attack at all). */
  multiplier: number
}

export const MONSTER_INTENTS: Record<MonsterIntentId, MonsterIntent> = {
  attack: { id: 'attack', icon: '⚔️', labelEn: 'Attack', labelTh: 'เตรียมโจมตี', multiplier: 1 },
  heavy: { id: 'heavy', icon: '💢', labelEn: 'Heavy blow', labelTh: 'ชาร์จโจมตีหนัก!', multiplier: 1.7 },
  snarl: { id: 'snarl', icon: '😤', labelEn: 'Snarl', labelTh: 'ขู่คำราม (ไม่โจมตี)', multiplier: 0 },
}

/**
 * Roll the monster's next intent. Bosses lean harder into heavy blows so their fights stay tense;
 * regular monsters snarl a bit more (breathing room for younger players).
 *   normal: 55% attack / 22% heavy / 23% snarl · boss: 45% attack / 38% heavy / 17% snarl
 */
export function rollIntent(rng: () => number, isBoss = false): MonsterIntentId {
  const r = rng()
  if (isBoss) return r < 0.45 ? 'attack' : r < 0.83 ? 'heavy' : 'snarl'
  return r < 0.55 ? 'attack' : r < 0.77 ? 'heavy' : 'snarl'
}
