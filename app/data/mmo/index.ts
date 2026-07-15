// ================================================================================================
// MMORPG foundation barrel (Phases 19–24) — the TESTED server-authority interface layers.
//
// Deterministic instance lifecycle · atomic + idempotent economy · server-owned inventory · versioned
// safe-recovery persistence. All pure + unit-tested (test/mmo.spec.ts). Gated by MMO_ENABLED; the live
// load/security evidence is the final readiness gate and requires real infrastructure (see S_GRADE_AUDIT
// Class B) — this barrel is the correctness foundation, not a live-scale claim.
// ================================================================================================

/** Rollback/readiness flag for the MMORPG layer. Dormant — no live MMO surface until real infra + load/security evidence. */
export const MMO_ENABLED = false

export * from './instance'
export * from './ledger'
export * from './persistence'
