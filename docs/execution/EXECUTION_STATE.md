# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 14 — World 1 Vertical Slice (**in progress — Inc 1–2 done; Inc 3 partial, first live flag flipped**)
- **Phase status:** Inc 1 (plan) + Inc 2 (DungeonScene) done; **Inc 3 in progress** — pure boss 3-phase state machine done (+tests); **first live flag flip landed: `NEW_ZONE_RUNTIME_ENABLED=true`** (dungeon doors on World-1 floors 5/10 now reachable). Remaining Inc 3: `COMBAT_DOMAIN_ENABLED` → `REALTIME_COMBAT_ENABLED` → `KNOWLEDGE_BREAK_ENABLED` → `CLASS_KITS_ENABLED` → `SIGILS_ENABLED` → `ADAPTIVE_EXPEDITIONS_ENABLED` (one flag/commit, each needs a real in-browser battle smoke) + BossScene telegraph rendering. Inc 4–5 pending. Build exit 0, 196 tests. See `docs/execution/PHASE_14_PLAN.md` + `DECISION_LOG.md` D-011.
- **Inc 3 done so far:** (a) `app/data/combat/bossPhases.ts` — pure Myco Colossus 3-phase machine (HP-derived at 0.70/0.35, monotonic, idempotent, resume-safe, telegraph grows ≥600ms), `test/boss-phases.spec.ts` (10 tests). (b) **Flip #1 `NEW_ZONE_RUNTIME_ENABLED=false→true`** — purely additive (only reader is the floor-5/10 dungeon door via `WORLD1_DUNGEON_FLOORS`; DungeonScene runs combat through the retained `battle:start`→BattleModal path). Reordered ahead of `COMBAT_DOMAIN_ENABLED` per D-011 (lowest-risk flip first; no dependency on the combat flag). **6 domain flags still `false`.** Verified: build exit 0, 196 tests, dev-server module-transform smoke green; interactive door walk-through on floors 5/10 is the remaining human-at-browser step.
- **Current branch:** `foundation/sgrade-full-transformation`
- **Baseline / last validated commit:** Inc 2 commit (below); Phase 13 `5d935bd` + Inc 1 `40339b5` pushed.
- **Phase 14 increments:** [1] architecture plan ✅ · [2] standalone DungeonScene (2 layouts, tested data/collision) ✅ *(build+unit-tests green; in-browser visual smoke PENDING a `npm run dev` run — cannot render Phaser headless here)* · [3] flag flips + boss 3-phase telegraph · [4] World 1 content (quests/NPCs/secrets/gear/Sigils/expedition/audio) · [5] qa-release gate + smoke.
- **Inc 2 delivered:** `app/game/runtime/dungeonLayouts.ts` (two layout configs `world01-mini`/`world01-main` + `buildCollisionMap`/`layoutReachability` proving no-soft-lock by BFS), `app/game/scenes/DungeonScene.ts` (standalone, offline-only, Y-sort/shadows/torch-glow/zone-scoped load+unload, elite tint+scale+nameplate), scene registered in `createGame.ts`, flag-guarded entry door on TowerScene floors 5/10 (`NEW_ZONE_RUNTIME_ENABLED` still **false** ⇒ live path byte-identical), `test/dungeon-layouts.spec.ts` (9 tests). No production asset modified.
- **Phase 14 rollback point:** tag `backup/pre-phase-14` @ `c7ab53c`. Flag-flip order + preservation contract in the plan doc.
- **Phases 00–12:** PASSED + committed (`…`, `7deb127`, `3ee8ea9`, `b4fbb22`, `89452e6`).
- **Tests:** `npm test` → 177 passing / 17 files (Vitest 3).
- **Save version:** CURRENT_SAVE_VERSION = 4 (v1→v2 learning, v2→v3 class-kit loadout, v3→v4 sigil inventory; envelope flag still off, legacy authoritative).
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
- **Files changed (Phase 13):** `app/data/economy/{currency,sigils,crafting,sim,index}.ts` (new domain), `app/utils/save/{schema,migrations,legacyAdapter}.ts` (v4 sigils + v3→v4 migration), `test/economy.spec.ts`, `test/save.spec.ts` (+1), `docs/execution/*`. **Live Pinia store + game page untouched.**
- **Migrations performed:** save schema v3→v4 registered + tested (adds `sigils` + `socketedSigils`, empty default, idempotent, preserves inventory). No live-storage migration run (envelope flag off, legacy authoritative; existing localStorage `player` still loads).
- **Feature flags:** `NEW_ZONE_RUNTIME_ENABLED` (P08) = **`true`** (Inc 3 flip #1 — dungeon doors on floors 5/10 live). Still `false`: `COMBAT_DOMAIN_ENABLED` (P07), `REALTIME_COMBAT_ENABLED` (P09), `KNOWLEDGE_BREAK_ENABLED` (P10), `ADAPTIVE_EXPEDITIONS_ENABLED` (P11), `CLASS_KITS_ENABLED` (P12), `SIGILS_ENABLED` (P13), `SAVE_ENVELOPE_ENABLED`. Turn-based BattleModal + TowerScene renderer + legacy daily quests + legacy player store remain the live combat/quest/save paths; DungeonScene is now reachable but still runs combat through BattleModal.
- **Unresolved risks:** seven domain/economy capabilities are built + tested but not yet wired into a rendered scene/UI/live store (integrate at World 1, Phase 14, and the save-envelope cutover; combat engine turn-loop awaits a live battle smoke). All flags off ⇒ no live behavior change.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

**Continue Phase 14 Inc 3 flag flips.** Flip #1 (`NEW_ZONE_RUNTIME_ENABLED`) is committed. Next flip = `COMBAT_DOMAIN_ENABLED` (`app/data/combat/index.ts:15`) — switches the live BattleModal turn path to the engine resolvers on all floors; parity tests already assert engine output == legacy formulas, but per D-010 this flip **must** get a real in-browser turn-based battle smoke before the next flip, which needs a human at `npm run dev` (Phaser can't render headless here). After it: `REALTIME_COMBAT_ENABLED` (needs realtime loop wired into DungeonScene + BossScene telegraph rendering — the remaining Inc 3 engineering) → `KNOWLEDGE_BREAK` → `CLASS_KITS` → `SIGILS` → `ADAPTIVE_EXPEDITIONS`. Gate (full phase): new player finishes World 1 boss; no soft lock; mobile flow; learning summary produced; readable boss phases; no placeholder-critical areas. See `docs/execution/PHASE_14_PLAN.md` §3.
