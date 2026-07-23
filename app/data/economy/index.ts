// ================================================================================================
// Economy domain barrel (Phase 13)
//
// Progression / loot / crafting / Sigils built on the versioned saves (Phase 04) and combat domain
// (Phase 07). Currency transactions are clamped (no negative balance), progression rewards are
// idempotent (RewardLedger), and sigils are crafted deterministically from materials — no paid loot
// box. Gated by SIGILS_ENABLED; the live economy (player store) is unchanged until World 1.
// ================================================================================================
export * from './currency'
export * from './sigils'
export * from './crafting'
export * from './sim'
