// ================================================================================================
// Co-op domain barrel (Phase 15) — safe co-op + server authority.
//
// Pure authority logic (server owns online-critical combat/reward state) + the client/server protocol,
// gated by COOP_ENABLED. Offline single-player never imports this at runtime while the flag is false.
// ================================================================================================
export * from './authority'
export * from './protocol'
