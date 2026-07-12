# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 04 — State separation & versioned saves** (first save-schema-touching phase; ADR 0001).
- Phases 00–03 complete, committed, and pushed.

## Completed work
- Preflight: backup tag `backup/pre-transformation-20260712-162236`, integration branch `foundation/sgrade-full-transformation` (pushed, tracking origin).
- `64a26d6` router · `82d2856` Phase 00 baseline · `f65f566` Phase 01 audit · `019d332` Phase 02 constitution · Phase 03 (this commit) test+diagnostics.
- Vitest 3 installed; **45 tests passing** (`npm test`). Dev-only diagnostics at `app/plugins/diagnostics.client.ts`.
- Architecture docs in `docs/foundation/` (+ADR 0001/0002/0003); testing docs in `docs/testing/`.

## Current git commit
- Integration branch tip = Phase 03 commit (see `git log`). Last validated: `019d332` + Phase 03.

## Commands / results
- `npm test` → 45 passing / 7 files. `npm run build` → exit 0; diagnostics absent from `.output/public`.

## Failing tests
- None.

## Assumptions
- Master plan doc missing → using execution-prompt roadmap + `docs/AI_Development_Bible_V2/` (DECISION_LOG D-001).

## Next exact action (Phase 04)
1. Route to **save-migration-engineer** (Opus 4.8). Introduce `SaveEnvelope { version, slices }` with slices `profile/character/learning/session/inventory/quest/settings`.
2. Build a migration registry (idempotent, versioned) + legacy adapter that reads today's monolithic localStorage `player` blob and maps it into slices; back up prior blob before writing; recover from partial/corrupted saves; never silently reset.
3. Guard with a `saveEnvelope` feature flag; **keep the legacy `player` store until compatibility passes** (do not remove it).
4. Add seeded migration tests (round-trip legacy→envelope→legacy; repeated migration is a no-op; corrupted-blob recovery). Verify `npm test` + `npm run build`.
5. Manual smoke: existing save still loads; reload persists. Update execution docs; commit `refactor: split state and version saves`; push.

## Agents needed next
- save-migration-engineer (Opus 4.8) primary; test-data-engineer (Sonnet 5) for migration fixtures/seeded tests; qa-release (Fable 5) independent review.

## Gate (Phase 04)
Existing saves migrate; repeated migration safe; corrupted/partial recovery; rollback documented; legacy store retained until compat passes.
