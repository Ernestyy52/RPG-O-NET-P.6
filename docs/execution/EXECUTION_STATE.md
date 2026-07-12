# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 12 — Four class kits
- **Phase status:** passed (164 tests green, build exit 0; committing)
- **Current branch:** `foundation/sgrade-full-transformation`
- **Baseline / last validated commit:** `b4fbb22` (Phase 11 expeditions, pushed)
- **Phases 00–11:** PASSED + committed (`…`, `c76f452`, `7deb127`, `3ee8ea9`, `b4fbb22`).
- **Tests:** `npm test` → 164 passing / 16 files (Vitest 3).
- **Save version:** CURRENT_SAVE_VERSION = 3 (v1→v2 learning, v2→v3 class-kit loadout; envelope flag still off, legacy authoritative).
- **Backup tag:** `backup/pre-transformation-20260712-162236` (→ `33a2815`)

## Agents / models / effort in use

| Route | Model (installed) | Used for |
|---|---|---|
| Main session | Opus 4.8 (`claude-opus-4-8`) | orchestration, baseline, audit, architecture |
| game-architect / qa-release | Fable 5 (`claude-fable-5`) | architecture & independent review (delegated later) |
| learning/combat/save/mp/economy | Opus 4.8 | reasoning-heavy domains |
| implementation/world-art/test-data | Sonnet 5 (`claude-sonnet-5`) | scoped coding, UI, tests, assets |
| routine-worker | Haiku 4.5 (`claude-haiku-4-5-20251001`) | trivial mechanical edits |

Foundational doc/audit phases (00–02) executed inline on the main Opus 4.8 session (strongest reasoning model, full repo context already loaded); subagent delegation reserved for parallelizable implementation phases.

## Commands run (Phase 00)

- git preflight: backup tag + integration branch created; checked out integration branch.
- `git commit` router (`64a26d6`).
- `npm run build` → exit 0 (client ~14s, 4 routes prerendered, `.output/public` ≈24 MB).

## Status snapshot

- **Build:** PASS (exit 0, benign warnings only).
- **Tests:** 45 passing / 7 files (Vitest 3, `npm test`).
- **Files changed (Phase 12):** `app/data/combat/classKits.ts` (new + `CLASS_KITS_ENABLED` flag), `app/data/combat/index.ts` (export), `app/utils/save/{schema,migrations,legacyAdapter}.ts` (v3 kitLoadout + v2→v3 migration), `test/class-kits.spec.ts`, `test/save.spec.ts` (+3), `test/learning.spec.ts` (stale version literal fixed), `docs/execution/*`. **Live Pinia store + game page untouched.**
- **Migrations performed:** save schema v2→v3 registered + tested (adds `kitLoadout`, class-correct default, idempotent, preserves custom). No live-storage migration run (envelope flag off, legacy authoritative; existing localStorage `player` still loads).
- **Feature flags:** `COMBAT_DOMAIN_ENABLED` (P07), `NEW_ZONE_RUNTIME_ENABLED` (P08), `REALTIME_COMBAT_ENABLED` (P09), `KNOWLEDGE_BREAK_ENABLED` (P10), `ADAPTIVE_EXPEDITIONS_ENABLED` (P11), `CLASS_KITS_ENABLED` (P12) — all false/dormant. Turn-based BattleModal + TowerScene renderer + legacy daily quests + legacy player store remain the live paths.
- **Unresolved risks:** six domain/runtime capabilities are built + tested but not yet wired into a rendered scene/UI/live store (integrate at World 1, Phase 14, and the save-envelope cutover; combat engine turn-loop awaits a live battle smoke). All flags off ⇒ no live behavior change.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

Commit Phase 12 checkpoint → begin **Phase 13** (Progression / loot / crafting / Sigils; depends 04+07): build on the versioned saves + combat domain. Gate: seeded economy sim; no negative currency; no duplicate claims; no extreme grind; no paid loot box. See `docs/foundation/MIGRATION_SEQUENCE.md`.
