# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 05 — O-NET curriculum & content validation** (learning-architect domain).
- Phases 00–04 complete, committed, and pushed.

## Completed work
- Preflight: backup tag `backup/pre-transformation-20260712-162236`, integration branch `foundation/sgrade-full-transformation` (pushed, tracking origin).
- Commits: `64a26d6` router · `82d2856` P00 baseline · `f65f566` P01 audit · `019d332` P02 constitution · `3a572ad` P03 tests+diagnostics · P04 versioned saves (this commit).
- **56 tests passing** (`npm test`, 8 files). `npm run build` exit 0.
- Save library `app/utils/save/` shipped behind `SAVE_ENVELOPE_ENABLED=false`; legacy `player` store still authoritative.
- Docs: `docs/foundation/` (audit + ADR 0001/0002/0003 + SAVE_MIGRATION_GUIDE), `docs/testing/`, `docs/claude/`, `docs/execution/`.

## Commands / results
- `npm test` → 56 passing / 8 files. `npm run build` → exit 0; diagnostics absent from `.output/public`.

## Failing tests
- None.

## Assumptions
- Master plan doc missing → using execution-prompt roadmap + `docs/AI_Development_Bible_V2/` (DECISION_LOG D-001).

## Next exact action (Phase 05)
1. Route to **learning-architect** (Opus 4.8) + **test-data-engineer** (Sonnet 5).
2. Define a typed question schema extension: `status: 'draft'|'reviewed'|'retired'`, `provenance` (knowledge/ pattern id), taxonomy `{ domain, skill, subskill }`, optional `misconceptions`/`explanation`/`distractorReasoning`.
3. Build a **current-question adapter** that maps the existing 69 `data/questions.json` items into the schema WITHOUT changing their content, defaulting legacy items to a reviewed-or-quarantine status per an explicit rule (document the choice).
4. Build a **validation pipeline** (pure TS + tests): reject malformed questions, analyze answer-position balance and duplicates, and enforce **only `reviewed` content is selectable in production**.
5. Add a teacher review-queue data structure (no UI required yet). Add tests. Verify `npm test` + `npm run build`.
6. Update execution docs; commit `feat: add O-NET curriculum and question validation`; push.

## Agents needed next
- learning-architect (Opus 4.8) primary; test-data-engineer (Sonnet 5) for validators/fixtures; qa-release (Fable 5) review.

## Gate (Phase 05)
Current content preserved; invalid content rejected; only reviewed content selectable in production; tests + report pass.

## Later phases
06 mastery/spaced-review · 07 extract combat domain (ADR 0002) · 08 zone runtime · 09 real-time combat · 10 Knowledge Break · 11 expeditions · 12 class kits · 13 loot/Sigils · 14 World 1 · 15 co-op · 16 teacher · 17 mobile/a11y · 18 S-grade audit · 19–24 MMORPG. See `docs/foundation/MIGRATION_SEQUENCE.md`.
