# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 16 — Teacher dashboard** (NEXT; depends P05 review queue + P06 summaries; gate: no active answer-key exposure; learning/game/personal data separated; export tested; flow understandable). See `docs/foundation/MIGRATION_SEQUENCE.md` row 17.
- **Phase 15 (safe co-op + server authority) — PASSED (2026-07-15):** `app/data/coop/` pure authority (server-owned shared HP with a ≤50%/hit clamp, `CoopRewardLedger` one-grant-per-participant, HP-derived synchronized boss phase, reconnect-safe), dormant behind `COOP_ENABLED`; `net.ts` dormant client helpers; `server/index.js` `CoopBattleRoom` mirror. Gate properties proven in `test/coop.spec.ts`; live multi-client run pending (waived for progression). Offline byte-identical.
- **Next-action pointer below still lists the old Phase-15 plan for reference; the ACTIVE next action is Phase 16 (Teacher).**

## Next exact action (Phase 16 — Teacher)
1. Route: learning-architect (Opus 4.8) for the review-queue/summary surfacing + data-separation boundary; implementation-engineer (Sonnet 5) for the dashboard UI; qa-release (Fable 5) review.
2. Read P05 curriculum review queue + P06 `summarizeSession`/mastery + the separate `learning` store; design a teacher view that surfaces class/learner progress from those WITHOUT exposing live answer keys (rule 2 + gate) and keeps learning/game/personal data separated.
3. Build the teacher data domain (aggregations over mastery/summaries) pure + tested; a dashboard UI behind a flag; an export (CSV/JSON) that's tested and carries no answer keys.
4. Gate (P16): no active answer-key exposure; learning/game/personal data separated; export tested; flow understandable.
- **Phases 00–14 PASSED + committed.** Phase 14 (World 1 vertical slice) closed 2026-07-15: all 7 domain flags LIVE on floors 1–10 (zone runtime, engine + real-time combat, Knowledge Break, class kits, sigils, adaptive expeditions), Myco Colossus 3-phase boss, 12-step main quest + 10 side quests + 3 secrets, curated Craftpix assets (NPCs, foliage/props/braziers, Forest Lizard). 261 tests, build exit 0. **Automatable gate rows green; human interactive playthrough waived for progression per user authorization** (still recommended pre-release).
- **Starting point for P15:** existing Colyseus client `app/game/systems/net.ts` (147 LOC — `joinTown`/dungeon rooms, `sendStatus`, `RemotePlayers`); server lives under `server/` (Colyseus). Real-time combat + rewards are currently **client-resolved** (RealtimeCombat + RewardLedger in the browser). P15 must move online-critical combat/boss/reward authority server-side behind the `coop` flag WITHOUT breaking the offline deterministic single-player path (constitution rule 9).

## Next exact action (Phase 15)
1. Route: multiplayer-engineer (Opus 4.8) + game-architect (Fable 5) for the authority boundary; qa-release (Fable 5) review.
2. Read `server/` + `net.ts` + `RealtimeBattle`/`DungeonScene` reward paths; map exactly which writes are online-critical (monster HP, boss phase, victory, reward claim) vs offline-safe.
3. Design the `coop` flag: co-op session joins a server-authoritative room; the server owns boss phase + victory + reward validation (client can't claim victory alone; no reward duplication on reconnect). Offline (no `coop`) keeps the current deterministic client path byte-identical.
4. Gate (P15): reconnect safe; boss synchronized across clients; no reward duplication; client can't claim victory alone; **offline still works** (the P14 slice unchanged with `coop` off).

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
