# KNOWN EXISTING ISSUES (Phase 00)

Pre-existing conditions observed at baseline commit `64a26d6`. These predate the transformation and must **not** be attributed to later phases. Severity: 🔴 blocker-ish, 🟠 significant, 🟡 minor/tech-debt, 🔵 informational.

## Architecture / maintainability

- 🟠 **Monolithic save, no versioning.** Single `player` Pinia store persisted whole to localStorage key `player`; no `version` field or migration registry. Only `afterHydrate` clamps hp/mp. → Phase 04.
- 🟠 **Combat rules live in UI.** Damage/reward/level-up logic sits in `BattleModal.vue` + `player.ts` actions rather than a UI-independent combat domain. → Phase 07.
- 🟠 **Combat is turn-based Q&A, not real-time action-lite.** Product goal targets movement-during-combat, skill slots, telegraphs. Current `BattleModal` is modal turn-based. → Phases 08–09.
- 🟠 **`index.vue` is a 306-LOC god component** owning title, character creation, HUD shell, ~13 modal toggles, and all event-bus wiring. High coupling. → incremental refactor.
- 🟡 **No test framework.** No `test` script, no vitest/jest; zero automated coverage of pure logic (stats, damage, rewards, questions, saves). → Phase 03.

## Learning / content

- 🟠 **Small question pool (69).** Well under what daily play + spaced review needs; no typed schema, no draft/reviewed/retired status, no misconception metadata, no provenance enforcement in-app. → Phases 05–06.
- 🟡 **No mastery / spaced-review model.** Only `correctAnswers` counter exists; no subskill mastery, review scheduling, or daily learning planner. → Phase 06.
- ✅ **[FIXED Phase 05] Biased answer key.** Baseline `data/questions.json` answer positions were [27,34,7,1] (49% "B", 1.4% "D") — position-guessable. Rebalanced deterministically to [18,17,17,17] (correctness/choice-set preserved, verified). Detection now enforced by `analyzeAnswerPositions` in the validation pipeline.

## Multiplayer / security

- 🟠 **Client-authoritative movement** in Colyseus server (clamp + rate-limit only). Acceptable for a town-presence prototype; not safe for authoritative combat/rewards. → Phases 15/20.
- 🔵 No reward/inventory server validation (single-player economy is client-side by design at this stage). → Phases 13/19/22.

## Auth / data

- 🟡 **No real authentication.** Login/Register/Guest all just set `accountName`; password field unused. Fine for offline classroom use; a real account system is a later MMORPG phase (19). Not a blocker now.

## Build / tooling

- 🔵 Build emits benign warnings only (module-preload-polyfill sourcemap, Vite chunk-size, nitro `cache-driver` external dep). Non-blocking; noted for noise-baseline so later phases can detect new warnings.
- 🔵 CRLF/LF normalization warnings on commit (Windows). Cosmetic.

## Documentation

- 🟠 **`RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md` is missing from disk** though referenced as a required read. Effective design intent recovered from the execution-prompt roadmap + `docs/AI_Development_Bible_V2/`. Documented in DECISION_LOG as an assumption, not a stop-blocker.

## Not reproduced / needs runtime verification later

- Mobile/touch flow, scene-cycle listener/timer leaks, and offline/reconnect stability have **not** been runtime-audited at baseline (static read only). Reserved for Phases 08/17 with the diagnostics from Phase 03.
