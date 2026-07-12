# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 14 — World 1 vertical slice** (next; depends 08–13; first big integration gate). See `docs/foundation/MIGRATION_SEQUENCE.md`.
- Phases 00–13 complete and committed. Domains built + tested behind dormant flags: P07 combat (`app/data/combat/`, incl. `classKits.ts`), P08 zone runtime (`app/game/runtime/`), P09 `RealtimeCombat`, P10 `KnowledgeBreakController`, P11 expeditions (`app/data/learning/expedition.ts`), P12 class kits, P13 economy (`app/data/economy/` — currency/sigils/crafting/sim). Flags `COMBAT_DOMAIN_ENABLED` + `NEW_ZONE_RUNTIME_ENABLED` + `REALTIME_COMBAT_ENABLED` + `KNOWLEDGE_BREAK_ENABLED` + `ADAPTIVE_EXPEDITIONS_ENABLED` + `CLASS_KITS_ENABLED` + `SIGILS_ENABLED` all off/dormant. Save version now 4 (envelope still dormant, legacy `player` authoritative). **P14 is the integration gate: wire the dormant domains/runtime into a rendered World 1 scene, likely flip flags, and run a REAL in-browser smoke (walk + battle + boss + learning summary). Heavier + riskier than the pure-domain phases — expect game-page edits and manual verification.**

## Completed work
- Preflight: backup tag `backup/pre-transformation-20260712-162236`, integration branch `foundation/sgrade-full-transformation` (pushed, tracking origin).
- Commits: `64a26d6` router · `82d2856` P00 · `f65f566` P01 · `019d332` P02 · `3a572ad` P03 · `0c52f21` P04 · `1dff865` P05 · P06 learning (this commit).
- **88 tests passing** (`npm test`, 10 files). `npm run build` exit 0.
- P04 save library (flag off, legacy authoritative), now at CURRENT_SAVE_VERSION=2 (v1→v2 migration). P05 curriculum. P06 learning domain `app/data/learning/` (mastery/scheduler/selector/planner/summary).

## Commands / results
- `npm test` → 88 passing / 10 files. `npm run build` → exit 0.

## Failing tests / Assumptions
- None failing. Master plan doc missing → execution-prompt roadmap + `docs/AI_Development_Bible_V2/` (DECISION_LOG D-001).

## Next exact action (Phase 07)
1. Route: combat-engineer (Opus 4.8) + game-architect (Fable 5) + test-data-engineer (Sonnet 5).
2. Extract combat rules from `app/components/game/BattleModal.vue` (and reward math from `app/stores/player.ts`) into a pure `app/data/combat/` (or `app/utils/combat/`) domain: `CombatActor`, `RuntimeStats`, `DamageRequest→DamageResult`, `SkillDefinition→SkillExecution`, `Cooldown`, `Resource`, `StatusEffect`, `CombatEvent`, `EncounterResult`, `RewardRequest`. No Vue/Phaser imports.
3. Reproduce the CURRENT formulas exactly (heroDamage = max(3, round((atk + knowledge*0.6)*mult*worldKnowledgeMod)); monster damage = round(atk*mult); def mitigation in player.takeDamage = max(1, round(amount - def*0.55)); rewards via gainRewards with level-up loop; loot via rollLoot). RewardRequest must be idempotent/validated, never trusted from UI.
4. Make `BattleModal.vue` a thin adapter over the domain behind a `combatDomain` feature flag; keep the legacy path working (rollback).
5. Add equivalence tests: domain output matches legacy formula for representative cases; no duplicated formula remains. Verify `npm test` + `npm run build`. Independent qa-release review.
6. Update execution docs; commit `refactor: extract combat domain`; push.

## Agents needed next
- combat-engineer (Opus 4.8); game-architect (Fable 5); test-data-engineer (Sonnet 5); qa-release (Fable 5) review.

## Gate (Phase 07)
No duplicated formula; equivalent legacy test cases pass; combat rules no longer owned by UI; rollback feature flag present.

## Later phases
08 zone runtime · 09 real-time combat · 10 Knowledge Break (consumes P06 `applyAnswer`/`summarizeSession`) · 11 expeditions (consumes P06 `generateDailyPlan`) · 12 class kits · 13 loot/Sigils · 14 World 1 · 15 co-op · 16 teacher (consumes P05 review queue + P06 summaries) · 17 mobile/a11y · 18 S-grade audit · 19–24 MMORPG. See `docs/foundation/MIGRATION_SEQUENCE.md`.
