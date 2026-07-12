# ADR 0001 — Versioned SaveEnvelope with domain slices

- **Status:** Accepted (Phase 01)
- **Deciders:** game-architect, save-migration-engineer (routed), main session
- **Context date:** 2026-07-12

## Context
Today all player state is one Pinia `player` store persisted whole to localStorage key `player`, with no `version` field and no migration path (only `afterHydrate` clamps hp/mp). Upcoming phases (class kits, loot/Sigils, expeditions, learning mastery) change the persisted shape. Without versioning, any shape change risks silently corrupting or resetting real player saves.

## Decision
Introduce a `SaveEnvelope { version, slices }` where `slices` = `{ profile, character, learning, session, inventory, quest, settings }`, each independently versioned. Persist through a migration registry:
- back up the prior blob before writing;
- migrations are pure and **idempotent**;
- validate before replacing the active save;
- retain the legacy monolithic `player` blob until compatibility is proven;
- recover from partial/corrupted saves rather than resetting;
- guard the new path with a `saveEnvelope` feature flag.

A legacy adapter reads the current `player` blob and maps it into slices on first load.

## Consequences
- (+) Every future gameplay-data change ships as a versioned, reversible migration.
- (+) Domains own their own slice → aligns with DOMAIN_BOUNDARIES.
- (+) No silent player resets; corruption is recoverable.
- (−) Added indirection and migration code; must be covered by seeded tests (Phase 03/04).
- **Reversibility:** feature flag falls back to the legacy store; backup blob restores prior state.

## Alternatives considered
- *Keep monolith, bump ad-hoc:* rejected — no safe rollback, high corruption risk.
- *Separate localStorage keys per domain without an envelope:* rejected — harder atomic backup/restore and cross-slice migration ordering.
