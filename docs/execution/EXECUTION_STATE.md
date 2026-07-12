# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 07 — Extract combat domain (ADR 0002)
- **Phase status:** passed (107 tests green, build exit 0, dev smoke 200/no errors; committing)
- **Current branch:** `foundation/sgrade-full-transformation`
- **Baseline / last validated commit:** `1524b7a` (Phase 06 learning planner)
- **Phases 00–06:** PASSED + committed (`82d2856`, `f65f566`, `019d332`, `3a572ad`, `0c52f21`, `1dff865`, `1524b7a`).
- **Tests:** `npm test` → 107 passing / 11 files (Vitest 3).
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
- **Files changed (Phase 07):** `app/data/combat/{formulas,types,skills,engine,rewards,index}.ts` (new pure domain), `app/components/game/BattleModal.vue` (delegates to domain, engine path behind `combatDomain` flag), `app/stores/player.ts` (takeDamage→mitigateDamage), `test/combat.spec.ts`, `docs/execution/*`.
- **Migrations performed:** none (Phase 07 is behavior-preserving; no save-schema change). CURRENT_SAVE_VERSION stays 2.
- **Feature flags:** `COMBAT_DOMAIN_ENABLED = false` (engine turn-loop path; legacy path uses the same domain formulas so no formula is duplicated in either state). Flip to true only after a full battle smoke in dev.
- **Unresolved risks:** engine turn-loop path (flag on) not yet exercised in a live battle — verify a boss + regular fight in dev before flipping. Large scope across 24 phases requires session handoffs.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

Commit Phase 07 checkpoint → begin **Phase 08** (Zone runtime): see `docs/foundation/MIGRATION_SEQUENCE.md`. Before flipping `COMBAT_DOMAIN_ENABLED` to true, run a live dev-server battle smoke (regular + boss fight) to confirm the engine turn-loop path is behavior-identical to legacy.
