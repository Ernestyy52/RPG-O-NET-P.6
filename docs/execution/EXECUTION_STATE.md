# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 14 — World 1 Vertical Slice (**in progress — Inc 1–2 done; Inc 3 partial, two live flags flipped**)
- **Phase status:** Inc 1 (plan) + Inc 2 (DungeonScene) done; **Inc 3 in progress** — pure boss 3-phase state machine done (+tests); **four live flag flips landed: `NEW_ZONE_RUNTIME_ENABLED` (#1), `COMBAT_DOMAIN_ENABLED` (#2), `REALTIME_COMBAT_ENABLED` (#3), `KNOWLEDGE_BREAK_ENABLED` (#4)**. On World-1 floors 1–10: real-time combat (`RealtimeBattle` HUD + boss 3-phase telegraph) with Knowledge Breaks that pause the fight, feed a separate persisted mastery store, and emit an end-of-fight learning summary; floors 11+ stay turn-based. Remaining Inc 3: **flip #5 `CLASS_KITS_ENABLED`** → `SIGILS_ENABLED` → `ADAPTIVE_EXPEDITIONS_ENABLED`. Inc 4–5 pending. Build exit 0, 199 tests. **Human-at-browser verification outstanding for flips #2/#3/#4 (turn-based smoke; real-time field+boss playthrough desktop/mobile/reduced-motion; Knowledge-Break interrupt + summary-persists-across-reload).** See `docs/execution/PHASE_14_PLAN.md` + `DECISION_LOG.md` D-013…D-016.
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
- **Feature flags:** `NEW_ZONE_RUNTIME_ENABLED` (P08) = **`true`** (flip #1 — dungeon doors on floors 5/10 live); `COMBAT_DOMAIN_ENABLED` (P07) = **`true`** (flip #2 — engine-driven BattleModal turns, all floors); `REALTIME_COMBAT_ENABLED` (P09) = **`true`** (flip #3 — World-1 floors 1–10 now fight on the real-time `RealtimeBattle` HUD + boss telegraph; floors 11+ stay turn-based via `isWorld1Floor` gate); `KNOWLEDGE_BREAK_ENABLED` (P10) = **`true`** (flip #4 — Knowledge Breaks interrupt World-1 realtime fights, feed the separate `learning` mastery store, emit an end-of-fight summary). Still `false`: `ADAPTIVE_EXPEDITIONS_ENABLED` (P11), `CLASS_KITS_ENABLED` (P12), `SIGILS_ENABLED` (P13), `SAVE_ENVELOPE_ENABLED`. Floors 11+ turn-based BattleModal + TowerScene renderer + legacy daily quests + legacy player store remain the live paths there. **Real-time is live but interactive in-browser playthrough is the outstanding human verification (Phaser can't render headless here).**
- **Unresolved risks:** seven domain/economy capabilities are built + tested but not yet wired into a rendered scene/UI/live store (integrate at World 1, Phase 14, and the save-envelope cutover; combat engine turn-loop awaits a live battle smoke). All flags off ⇒ no live behavior change.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

**Flip #5 is HELD by user decision (2026-07-14) pending the human-at-browser smoke of flips #2–#4.** No new live surface is added until that playthrough passes.

**This session (2026-07-14) verified:** `npm test` → 199 passing / 20 files; `npm run dev` came up (HTTP 200) and all touched combat/learning modules transform cleanly in Vite (7 modules → 200: RealtimeBattle.vue, BattleModal.vue, combat/index.ts, classKits.ts, realtime.ts, knowledgeBreak.ts, DungeonScene.ts). This discharges the **module-transform** half of the smoke debt for flips #1–#4; the **interactive Phaser playthrough remains outstanding** (can't render headless here — human step).

**OUTSTANDING human browser smoke (do before flip #5):** `npm run dev` → World-1 floor (1–10): (a) field fight — answer→auto-attack, Counter/Support/Item, Flee; (b) floor-10 boss — 3 readable phase channels (color+banner+pattern) on desktop/mobile/reduced-motion; (c) Knowledge Break interrupts a fight, the monster pauses, empower/combo-lost applies, and a learning summary shows + persists across reload; (d) floors 11+ still open the turn-based modal; (e) rewards/HP/MP persist across reload.

**Then flip #5 `CLASS_KITS_ENABLED` (`app/data/combat/classKits.ts`)** — mapping decision SETTLED = approach A, role-map onto the 3 slots (see DECISION_LOG D-017). **Landed this session (dormant, flag stays `false`):** pure `kitSlotMapping(classId)` resolver + 6 tests — every kit fills all 3 slots (attack/counter/support) from distinct abilities; guardian uses Retribution+Fortress (no generic fallback needed). Consumed by nothing yet ⇒ live path byte-identical. **Remaining for flip #5, gated on the browser playthrough (feel-dependent):** RealtimeCombat per-slot override (cooldown/mp/damage + a guard "next-hit mitigation" mechanic not modelled today), RealtimeBattle/BattleModal button wiring, then the live `false→true` flip. After #5: `SIGILS` → `ADAPTIVE_EXPEDITIONS`. Gate (full phase): new player finishes World 1 boss; no soft lock; mobile flow; learning summary produced; readable boss phases; no placeholder-critical areas. See `docs/execution/PHASE_14_PLAN.md` §3–§4.
