# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 06 — Mastery, spaced review & daily learning planner** (learning-architect domain).
- Phases 00–05 complete, committed, and pushed.

## Completed work
- Preflight: backup tag `backup/pre-transformation-20260712-162236`, integration branch `foundation/sgrade-full-transformation` (pushed, tracking origin).
- Commits: `64a26d6` router · `82d2856` P00 · `f65f566` P01 · `019d332` P02 · `3a572ad` P03 · `0c52f21` P04 · P05 curriculum (this commit).
- **69 tests passing** (`npm test`, 9 files). `npm run build` exit 0.
- P04 save library `app/utils/save/` (flag off, legacy authoritative). P05 curriculum layer `app/data/curriculum/` + answer-key rebalanced in `data/questions.json` (correctness-preserved).

## Commands / results
- `npm test` → 69 passing / 9 files. `npm run build` → exit 0.

## Failing tests / Assumptions
- None failing. Master plan doc missing → execution-prompt roadmap + `docs/AI_Development_Bible_V2/` (DECISION_LOG D-001).

## Next exact action (Phase 06)
1. Route: learning-architect (Opus 4.8) + test-data-engineer (Sonnet 5).
2. Add a learning-mastery domain (pure TS, seed-testable) separate from combat power (ADR 0003):
   `SubskillMastery` (per `taxonomy.ts` subskill), misconception tracking, response-time summary, stability + `nextReview` (spaced repetition, e.g. SM-2-lite).
3. Implement `QuestionSelector` (draws ONLY from `selectableInProduction(CURRICULUM_QUESTIONS)`, weights weak/due subskills), `MasteryUpdater`, `ReviewScheduler`, `DailyLearningPlanGenerator` (10/20/30-min; Adventure vs Learning-Focus), `LearningSessionSummary`.
4. Non-punitive: catch-up + rested-learning bonuses; no streak penalties.
5. Seeded deterministic tests: weak skills recur appropriately; due items resurface; mastery never alters combat stats. Add a `learning` save slice hook (already reserved in SaveEnvelope). Verify `npm test` + build.
6. Update execution docs; commit `feat: add mastery and daily learning planner`; push.

## Agents needed next
- learning-architect (Opus 4.8); test-data-engineer (Sonnet 5) for seeded sims; qa-release (Fable 5) review.

## Gate (Phase 06)
Deterministic seeded tests; weak skills recur appropriately; learning state separate from combat power.

## Later phases
07 extract combat domain (ADR 0002) · 08 zone runtime · 09 real-time combat · 10 Knowledge Break · 11 expeditions · 12 class kits · 13 loot/Sigils · 14 World 1 · 15 co-op · 16 teacher · 17 mobile/a11y · 18 S-grade audit · 19–24 MMORPG. See `docs/foundation/MIGRATION_SEQUENCE.md`.
