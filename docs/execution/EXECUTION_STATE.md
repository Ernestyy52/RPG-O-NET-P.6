# EXECUTION_STATE

> Single source of truth for autonomous transformation progress. Update after every meaningful task and before any context handoff.

- **Current phase:** Phase 14 — World 1 Vertical Slice (**in progress — Inc 1–3 done (all 7 flags live); Inc 4 STARTED — main quest chain landed**)
- **Phase status:** Inc 1 (plan) + Inc 2 (DungeonScene) done; **Inc 3 in progress** — pure boss 3-phase state machine done (+tests); ****all seven flag flips landed**: `NEW_ZONE_RUNTIME_ENABLED` (#1), `COMBAT_DOMAIN_ENABLED` (#2), `REALTIME_COMBAT_ENABLED` (#3), `KNOWLEDGE_BREAK_ENABLED` (#4), `CLASS_KITS_ENABLED` (#5), `SIGILS_ENABLED` (#6), `ADAPTIVE_EXPEDITIONS_ENABLED` (#7). On World-1 floors 1–10: real-time combat (`RealtimeBattle` HUD + boss 3-phase telegraph) driven by per-class **kits**, with Knowledge Breaks that pause the fight, feed a separate persisted mastery store, and emit an end-of-fight learning summary; floors 11+ stay turn-based on the generic skill set. **Sigils** craftable at the blacksmith + socketable into gear (bounded, cap 2, deterministic) via the live store's additive `socketedSigils`. **Adaptive expeditions** served in the Guild (daily mastery-delta progress, idempotent claims) with legacy daily quests retained as the fallback. **Inc 3 code complete** — its gate closure awaits the interactive browser playthrough of #2–#7. **Inc 4 STARTED:** World-1 **main quest chain** (`app/data/world1/quests.ts`) — a 12-step data-driven chain (town→field→floor-5 grotto→field→floor-10 approach→Myco Colossus), pure `advanceMainQuest` reducer, every step offline-completable with a deterministic non-RNG trigger; store infrastructure live (`mainQuest` field + `dispatchQuestEvent` granting each step's reward once + `mainQuestStep`/`mainQuestProgress` getters + save-safe hydrate default) but the event HOOKS + quest UI are dormant (next slice, so the chain never surfaces half-progressable). Remaining Inc 4: quest event hooks + QuestModal UI, ≥8 side quests, NPCs, ≥3 secrets, 12 gear + 8 sigils + loot tables + economy sim, second field tileset + SFX. Then Inc 5 (qa gate). Build exit 0, 232 tests. **Human-at-browser verification outstanding for flips #2/#3/#4 (turn-based smoke; real-time field+boss playthrough desktop/mobile/reduced-motion; Knowledge-Break interrupt + summary-persists-across-reload).** See `docs/execution/PHASE_14_PLAN.md` + `DECISION_LOG.md` D-013…D-016.
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
- **Feature flags:** `NEW_ZONE_RUNTIME_ENABLED` (P08) = **`true`** (flip #1 — dungeon doors on floors 5/10 live); `COMBAT_DOMAIN_ENABLED` (P07) = **`true`** (flip #2 — engine-driven BattleModal turns, all floors); `REALTIME_COMBAT_ENABLED` (P09) = **`true`** (flip #3 — World-1 floors 1–10 now fight on the real-time `RealtimeBattle` HUD + boss telegraph; floors 11+ stay turn-based via `isWorld1Floor` gate); `KNOWLEDGE_BREAK_ENABLED` (P10) = **`true`** (flip #4 — Knowledge Breaks interrupt World-1 realtime fights, feed the separate `learning` mastery store, emit an end-of-fight summary); `CLASS_KITS_ENABLED` (P12) = **`true`** (flip #5 — World-1 realtime combat runs on per-class kits; floors 11+ BattleModal stays generic); `SIGILS_ENABLED` (P13) = **`true`** (flip #6 — craft + socket sigils into gear, bounded bonus via live-store `socketedSigils`); `ADAPTIVE_EXPEDITIONS_ENABLED` (P11) = **`true`** (flip #7 — Guild serves adaptive expeditions, legacy daily quests as fallback). Still `false`: `SAVE_ENVELOPE_ENABLED` (deferred out of Phase 14 by design, §0). Floors 11+ turn-based BattleModal + TowerScene renderer + legacy daily quests + legacy player store remain the live paths there. **Real-time is live but interactive in-browser playthrough is the outstanding human verification (Phaser can't render headless here).**
- **Unresolved risks:** seven domain/economy capabilities are built + tested but not yet wired into a rendered scene/UI/live store (integrate at World 1, Phase 14, and the save-envelope cutover; combat engine turn-loop awaits a live battle smoke). All flags off ⇒ no live behavior change.

## Rollback point

`git checkout main` or `backup/pre-transformation-20260712-162236`. See `docs/foundation/ROLLBACK_GUIDE.md`.

## Exact next action

**Flip #5 `CLASS_KITS_ENABLED` DONE (`false→true`, 2026-07-14).** User handed full autonomy ("ให้ Claude code จัดการและตัดสินใจเองหมดเลย"), lifting the earlier hold. World-1 realtime combat now runs on class kits; see DECISION_LOG D-018. **Next flip = #6 `SIGILS_ENABLED`.**

**Flip #5 as shipped (two commits: dormant wiring `45b602a` → flip):** each of the 3 realtime HUD slots is driven by the hero's kit ability (kit cooldown/MP/strike-mult-folded-with-combo, a kit-only guard/counter **next-hit mitigation** queue, heal capped at the new `hero.maxHp`, rally = MP+combo). Engine owns all kit effects (deterministic, unit-tested); `resolveHeroSkill` gained an optional `multiplierOverride` with `heroDamage` still the single formula. Mapping = D-017 approach A (role-map, no generic fallback; guardian uses Retribution+Fortress). **Scope:** realtime World-1 only — turn-based BattleModal (floors 11+) intentionally stays on the generic skill set for now (D-018). **Watch-item:** mage attack (Arcane Bolt) costs 6 MP → possible slow-down when MP-starved (no soft-lock); tune in `classKits.ts` if it reads badly.

**This session verified:** `npm test` → **210 passing / 20 files**; `npm run build` exit 0 (both flag states); `npm run dev` up (HTTP 200) with on-demand Vite transform of the touched modules → 200 with the flag ON.

**OUTSTANDING human browser smoke — now covers flips #2–#5** (can't render Phaser headless): `npm run dev` → World-1 floor (1–10): (a) field fight — answer→auto-attack, **per-class kit HUD (labels/cooldowns/MP)**, **guard/counter softens the next hit**, heal/rally feel, Item, Flee; (b) floor-10 boss — 3 readable phase channels (color+banner+pattern) on desktop/mobile/reduced-motion; (c) Knowledge Break interrupts, monster pauses, empower/combo-lost applies, learning summary shows + persists across reload; (d) floors 11+ still open the turn-based modal (generic skills); (e) rewards/HP/MP persist across reload; (f) mage MP-starvation doesn't stall a fight.

**Inc 3 flag sequence COMPLETE (all 7 flips live).** Autonomous flag work stopped at the Inc-3/Inc-4 boundary per the standing grant. **Next: Inc 4 — World-1 content** (largest drop: 10–15-step main quest, ≥8 side quests, language puzzles/environmental English via `knowledge/`→`questions.json`, NPCs, ≥3 secrets, 12 named gear + 8 sigils + loot tables + economy sim re-run, second field tileset, SFX/ambience; **any persisted-shape change → save-migration-engineer, non-delegable**). Then **Inc 5 — qa-release independent gate** (fresh-profile playthrough, soft-lock hunt, save-compat, asset-path/subpath, mobile+reduced-motion, boss readability — human-driven). **Blocking before either: the interactive browser playthrough of flips #2–#7** (module-transform smoke is green; Phaser can't render headless here). Gate (full phase): new player finishes World 1 boss; no soft lock; mobile flow; learning summary produced; readable boss phases; no placeholder-critical areas. See `docs/execution/PHASE_14_PLAN.md` §3–§4.
