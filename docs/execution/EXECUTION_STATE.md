# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 08 — New Phaser zone runtime (scaffold + lifecycle)
- **Phase status:** passed (125 tests green, build exit 0, dev transform 200; committing)
- **Current branch:** `foundation/sgrade-full-transformation`
- **Baseline / last validated commit:** `0d05cb1` (Phase 07 combat domain)
- **Phases 00–07:** PASSED + committed (`…`, `0c52f21`, `1dff865`, `1524b7a`, `0d05cb1`).
- **Tests:** `npm test` → 125 passing / 12 files (Vitest 3).
- **Save version:** CURRENT_SAVE_VERSION = 2 (v1→v2 migration added; flag still off).
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
- **Files changed (Phase 08):** `app/game/runtime/{lifecycle,movement,zone,spawn,encounter,zoneRuntime,index}.ts` (new modular runtime), `app/game/scenes/TowerScene.ts` (delegates movement/spawn/encounter/layout to the runtime, behavior-preserving), `test/zone-runtime.spec.ts`, `docs/execution/*`.
- **Migrations performed:** none (behavior-preserving; no save-schema change). CURRENT_SAVE_VERSION stays 2.
- **Feature flags:** `COMBAT_DOMAIN_ENABLED = false` (P07 engine turn-loop). `NEW_ZONE_RUNTIME_ENABLED = false` (P08 rendered scene on ZoneRuntime; dormant — TowerScene is the active renderer). Pure runtime systems are already live in TowerScene as single source of truth (no flag).
- **Unresolved risks:** (1) combat engine turn-loop path (flag on) not yet exercised in a live battle; (2) no rendered scene runs on ZoneRuntime yet (comes with World 1, Phase 14). Both flags off, so no live behavior change. A full in-browser walk/battle smoke is recommended before flipping either flag.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

Commit Phase 08 checkpoint → begin **Phase 09** (Real-time action-lite combat, flag `realtimeCombat`; depends 07+08): drive combat via the Phase 07 domain + Phase 08 runtime; no frame-rate-dependent damage, no duplicate rewards, no invalid attacks, safe reset, legacy BattleModal fallback. See `docs/foundation/MIGRATION_SEQUENCE.md`.
