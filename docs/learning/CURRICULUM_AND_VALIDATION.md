# CURRICULUM & CONTENT VALIDATION (Phase 05)

Establishes a typed O-NET curriculum layer, a validation pipeline, and the hard production rule that
**only reviewed, structurally-valid content is served to players**.

## Modules (`app/data/curriculum/`)
| Module | Responsibility |
|---|---|
| `taxonomy.ts` | O-NET Grade-6 domains (vocabulary/grammar/reading/conversation) → 13 subskills with prerequisites & common misconceptions. |
| `schema.ts` | `CurriculumQuestion` = `Question` + `status` (`draft`/`reviewed`/`retired`) + `provenance` + `subskillId` + optional `explanation`/`distractorReasoning`/`misconceptions`. |
| `adapter.ts` | `CURRICULUM_QUESTIONS` adapts the existing 69 items **without changing content**; `authorQuestion` creates new items as `draft`. |
| `validation.ts` | `validateQuestion`, `analyzeAnswerPositions`, `findDuplicatePrompts`, `selectableInProduction`, `validationReport`. |
| `reviewQueue.ts` | `buildReviewQueue` (drafts + error items) and `promoteToReviewed` (refuses items with errors). |

## Grandfathering rule
The existing 69 questions are already curated from `knowledge/` patterns and were live in production, so
they are adapted with status **`reviewed`** — current content is preserved and stays selectable. Any
**new** question (`authorQuestion`, or generated from a knowledge pattern) starts as **`draft`** and
must be promoted by an explicit human review pass. This encodes the non-negotiable "no unreviewed
question enters production" without disrupting existing content.

## The production selectability rule
`selectableInProduction(questions)` returns only items that are `reviewed` AND pass structural
validation (no `error`-severity issues). Draft, retired, and structurally-broken items are excluded.
Phase 06's `QuestionSelector` will draw exclusively from this set. Covered by `test/curriculum.spec.ts`.

## Validation checks
- **Structural (errors):** empty id/prompt, <2 choices, empty/duplicate choices, out-of-range answer,
  bad status, missing provenance, unknown subskill tag.
- **Quality (warnings):** non-4 choice count, reviewed item lacking an explanation.
- **Answer-position analysis:** flags a biased answer key (default: no single position > 40%).
- **Duplicate analysis:** groups items sharing a normalized prompt.

## Content quality fix applied this phase — answer-key rebalance
Baseline analysis found a strongly biased answer key: **index counts [27, 34, 7, 1]** → 49% "B",
only 1.4% "D". A student could score well by position-guessing, corrupting learning measurement.
A deterministic, **correctness-preserving** rebalance reordered choices so each correct answer lands
in a round-robin position — new distribution **[18, 17, 17, 17]** (max share 0.26). Verified: every
question's correct-answer text and choice set are unchanged; only positions moved (54/69 changed).
The rebalancer only touched `data/questions.json` (the sanctioned content file), never
`app/data/questions.ts`.

## Not done here (deferred)
- Fine-grained per-question subskill tagging (currently domain-default + a couple of keyword
  refinements) — a human review task; the coarse tags are honest, not invented.
- Wiring `QuestionSelector`/mastery to consume `selectableInProduction` — Phase 06.
- Teacher review UI — Phase 16 (the data structure exists now).
