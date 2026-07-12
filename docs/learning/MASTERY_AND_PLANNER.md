# MASTERY, SPACED REVIEW & DAILY PLANNER (Phase 06)

Adds the learning-progression domain: per-subskill mastery, SM-2-lite spaced review, adaptive
question selection, daily plans, and session summaries. All pure TypeScript, fully deterministic,
and strictly separated from combat power (ADR 0003).

## Modules (`app/data/learning/`)
| Module | Responsibility |
|---|---|
| `rng.ts` | `mulberry32` seeded PRNG + `seedFromString` — no `Math.random` anywhere in the domain. |
| `scheduler.ts` | SM-2-lite: `nextStability` (grows on correct, scaled by mastery; resets to min on wrong), `nextReviewAt`, `isDue`, `overdueMs`. |
| `mastery.ts` | `SubskillMastery` + `applyAnswer` (EMA proficiency, running response-time, misconception/lapse counters, schedule). Learning-only fields — no combat stats. |
| `selector.ts` | `QuestionSelector` — draws only from `selectableInProduction`; weights weak/due/unseen subskills; anti-repeat; `adventure` vs `learning-focus` modes. |
| `planner.ts` | `DailyLearningPlanGenerator` — 10/20/30-min sessions, mode-aware focus, positive rested bonus, catch-up, deterministic per date+seed. |
| `summary.ts` | `LearningSessionSummary` — per-subskill movement, misconceptions, encouraging recommendations, upcoming reviews; returns updated mastery map to persist. |

## Design invariants (verified)
- **Learning ≠ combat power (ADR 0003):** `grep` of `app/data/learning/` finds no `player`/combat-stat/`Math.random` references outside comments. Mastery objects carry only learning fields (asserted in tests).
- **Only reviewed content served:** `selectQuestion`/`planner` call `selectableInProduction` (selector.ts:65, planner.ts:91); a draft is never selected (tested over 300 draws).
- **Deterministic:** every selection/plan uses an injected seeded RNG; same date+seed ⇒ same plan (tested).
- **Non-punitive missed days:** a gap grants a *positive* rested bonus only; `targetQuestionCount = base + restedBonus` (restedBonus ≥ 0) — never shrinks, no penalty, no streak (tested).
- **Weak skills recur:** weak+due subskills are drawn more than mastered ones; `learning-focus` targets them harder than `adventure` (tested over 600–800 seeded draws).

## Spacing model (SM-2-lite)
`stability` is the review interval in ms (min 10 min, max 21 days). A correct answer multiplies it by
`1 + (growth-1)·ease` where `ease = 0.5 + 0.5·mastery` (so higher mastery ⇒ longer gaps, but it always
grows on success). A wrong answer resets stability to the minimum, so weak items resurface soon.
Unseen subskills start due (`nextReview = now`) so new material is surfaced first.

## Persistence (approved migration path)
The `learning` save slice gained `mastery: Record<subskillId, SubskillMastery>` and `lastSessionDate`.
`CURRENT_SAVE_VERSION` is bumped **1 → 2** with a registered `v1→v2` migration that preserves existing
`correctAnswers` and defaults the new fields (idempotent; tested). The save feature flag remains off —
the legacy `player` store is still authoritative — so this is schema-forward only, no runtime change.

## Integration points (deferred to their phases)
- Knowledge Break (Phase 10) will call `applyAnswer` on answer outcomes and drive feedback from `misconceptions`.
- Daily Expeditions (Phase 11) will consume `generateDailyPlan`.
- Teacher reports (Phase 16) will read `summarizeSession` output and mastery movement.
- Wiring the selector into live battle question loading + persisting mastery into the save slice happens when the envelope flag is enabled (see SAVE_MIGRATION_GUIDE).

## Tests
`test/learning.spec.ts` — 19 deterministic tests. Full suite: **88 passing**; `npm run build` exit 0.
