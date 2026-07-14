# DECISION_LOG

Key decisions and assumptions made during autonomous transformation. Each entry: decision, rationale, and reversibility.

## D-001 — Treat the execution-prompt roadmap + AI_Development_Bible_V2 as the design spec
- **Context:** `RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md` (a required read) is absent from disk anywhere in the repo or Desktop.
- **Decision:** Proceed using the 24-phase roadmap embedded in `RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md` plus `docs/AI_Development_Bible_V2/` (29 design docs) as the authoritative design intent. Log as an assumption, not a stop-blocker.
- **Rationale:** Autonomy rule — do not use uncertainty as an excuse to stop; the missing file is a documentation gap, not a destructive/credential/legal/educational/infrastructure blocker. The roadmap is fully self-contained.
- **Reversibility:** If the master plan surfaces later, reconcile decisions against it; no code depends on its absence.

## D-002 — Execute foundational phases (00–02) inline on the main Opus 4.8 session
- **Decision:** Run baseline, audit, and constitution phases directly rather than spawning cold project subagents.
- **Rationale:** These phases are documentation/audit with no isolation benefit; Opus 4.8 is the strongest available reasoning model (correct route for architecture) and already holds full repo context. Spawning would re-derive context at extra cost. Subagent delegation is reserved for parallelizable implementation phases (07+, world/tests/assets).
- **Reversibility:** Routing choice only; later phases may delegate freely.

## D-003 — Integration branch from current HEAD, main left untouched
- **Decision:** Branch `foundation/sgrade-full-transformation` from `33a2815` (latest user work); do not reconcile local `main` vs `origin/main` (main is 2 ahead locally, already mirrored on `feat/boss-arena-biome-tiles` on origin).
- **Rationale:** Preserve all user work; never force-push or auto-merge main. The latest content is already safely on origin.
- **Reversibility:** Fully — see ROLLBACK_GUIDE.

## D-004 — Model name mapping (installed router)
- `fable`→Fable 5 (`claude-fable-5`), `opus`→Opus 4.8 (`claude-opus-4-8`), `sonnet`→Sonnet 5 (`claude-sonnet-5`), `haiku`→Haiku 4.5 (`claude-haiku-4-5-20251001`). No fallback substitution needed; all agent-declared models are available. `effort` values (xhigh/high/medium) and frontmatter fields (isolation/permissionMode/maxTurns/color) are valid.

## D-005 — Add Vitest as the Phase 03 test framework (planned)
- **Decision (pending Phase 03):** Use Vitest for pure-logic unit tests — it is the native test runner for the Vite/Nuxt 4 toolchain already present, minimizing new dependencies and config.
- **Reversibility:** Test-only; isolated under a `test` script + `*.spec.ts` files.

## D-006 — Phase 14 executed in 5 verified increments on `foundation/sgrade-full-transformation`
- **Decision:** Build the World 1 vertical slice as 5 sequenced, independently-committed increments (architecture → DungeonScene → flag flips + boss phases → content → qa gate) rather than one push. Each increment must pass `npm run build` (exit 0) + full test suite + dev smoke before the next. Phase 13.5 audit docs cherry-picked onto the integration branch (`c7ab53c`).
- **Rationale:** Phase 14 is the first big integration gate and too large to build-and-verify atomically; increments keep every step revertible and honestly verifiable. User-approved execution mode. Plan: `docs/execution/PHASE_14_PLAN.md`.
- **Reversibility:** Rollback point tag `backup/pre-phase-14` @ `c7ab53c`; each increment reverts cleanly.

## D-007 — Standalone `DungeonScene` over a TowerScene `dungeon` mode-flag
- **Decision:** New purpose-specific `DungeonScene.ts` (two data-only layout configs: `world01-mini`, `world01-main`), additive to the runtime; TowerScene touched only by a flag-guarded entry door on floors 5/10.
- **Rationale:** TowerScene (450 LOC) owns multiplayer join, offline respawn, biome baking, boss-door flow — threading dungeon conditionals through it makes every dungeon bug a floors-11+ regression risk. Matches audit finding #2 and the TownScene/BossScene precedent. **Reversibility:** don't route to the scene; floors 11+ byte-identical.

## D-008 — `SAVE_ENVELOPE_ENABLED` deferred out of Phase 14; envelope kept in sync via a v4→v5 migration
- **Decision:** The envelope cutover is NOT part of Phase 14. Legacy `player` blob stays authoritative; new World-1 progress is additive-only Pinia fields with safe defaults; save-migration-engineer registers an idempotent envelope v4→v5 migration mirroring the same shape so the future cutover never diverges.
- **Rationale:** Mixing the envelope cutover into the first big integration phase multiplies rollback ambiguity (risk #2). **Reversibility:** flag untouched at `false`; migration additive/idempotent.

## D-009 — Realtime combat + boss fight scoped World-1/dungeon-first; floors 11+ stay legacy
- **Decision:** `REALTIME_COMBAT_ENABLED` gated by `isWorld1Floor(1..10)`; realtime lands dungeon-only first, expanding to World-1 fields only on clean smoke. The floor-10 boss runs on the realtime path (required for readable 3-phase telegraphs); the static-portrait BattleModal boss becomes the floors-11+ legacy fallback.
- **Rationale:** Smallest blast radius for the first-ever live run of the Phase-09 engine (risk #4); BattleModal fallback remains one revert away. **Reversibility:** per-zone flag; revert → World-1 encounters fall back to BattleModal via the retained `battle:start` path.

## D-010 — Flag-flip order + one-flag-per-commit discipline; boss phases derived from HP fraction
- **Decision:** Enable the 7 dormant flags in dependency order (`COMBAT_DOMAIN` → `NEW_ZONE_RUNTIME` → `REALTIME_COMBAT` → `KNOWLEDGE_BREAK` → `CLASS_KITS` → `SIGILS` → `ADAPTIVE_EXPEDITIONS`), one flag per commit with live smoke between flips. Boss phase state is derived from current HP fraction (thresholds 0.70 / 0.35, monotonic) rather than a stored counter, so it re-derives correctly on save/quit/resume.
- **Rationale:** Composable rollback (each flip is a one-commit revert) and no soft-lock/double-trigger on resume. **Reversibility:** per-commit revert returns each flag to `false`.

## D-011 — Inc 3 flip #1 executed = `NEW_ZONE_RUNTIME_ENABLED` (reordered ahead of `COMBAT_DOMAIN_ENABLED`)
- **Decision:** The first live flag flip landed in Phase 14 Inc 3 is `NEW_ZONE_RUNTIME_ENABLED` (`false→true`), taken ahead of `COMBAT_DOMAIN_ENABLED` despite D-010's dependency order listing `COMBAT_DOMAIN` first.
- **Rationale:** `NEW_ZONE_RUNTIME_ENABLED`'s only functional reader is the TowerScene dungeon-entry door, itself gated to World-1 dungeon floors 5/10 via `WORLD1_DUNGEON_FLOORS` — so the flip *only* adds the two dungeon entrances and changes nothing on any other floor. It carries no dependency on `COMBAT_DOMAIN_ENABLED`: DungeonScene runs combat through the retained `battle:start`→BattleModal path, and BattleModal already sources every formula from the combat domain in both flag states (Phase 07), so combat numbers are identical regardless. By contrast `COMBAT_DOMAIN_ENABLED` switches the live turn-resolution *path* on all floors and warrants a real in-browser battle smoke, which cannot be fully done headless in this environment — so the safest, visually-lowest-risk flip goes first. D-010's order is preserved for the remaining flips (`COMBAT_DOMAIN` → `REALTIME_COMBAT` → …).
- **Verification:** `npm test` 196/196 (19 files); `npm run build` exit 0; dev-server boot smoke — page + `TowerScene`/`DungeonScene`/`runtime/index`/`createGame` modules all transform under Vite (HTTP 200), no compile errors. The interactive walk-through-the-door visual smoke on floors 5/10 remains a human-at-browser step (Phaser cannot render headless here).
- **Reversibility:** one-commit revert → `NEW_ZONE_RUNTIME_ENABLED=false`, doors vanish, DungeonScene unreachable, floors 11+ byte-identical.
