# RESUME_CONTEXT

> Read this first when resuming in a new session. Verify repo state matches, then continue from "Next exact action".

## Exact phase and task
- **Phase 01 — Deep architecture & game-design audit** (audit-only; no gameplay code changes).
- Phase 00 (baseline) is complete and committed.

## Completed work
- Preflight: backup tag `backup/pre-transformation-20260712-162236`, integration branch `foundation/sgrade-full-transformation` created + checked out.
- Router committed `64a26d6` (11 subagents + orchestrator).
- Phase 00 docs written under `docs/foundation/` (5) and `docs/execution/` (5).
- Production build verified exit 0.

## Current git commit
- Integration branch tip after Phase 00 commit (see PHASE_LOG / `git log`). Baseline validated commit: `64a26d6`.

## Changed files (Phase 00)
- `.claude/agents/*.md` (11), `RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md`
- `docs/foundation/{BASELINE,CURRENT_RUNTIME_FLOW,KNOWN_EXISTING_ISSUES,ROLLBACK_GUIDE,ENVIRONMENT_REQUIREMENTS}.md`
- `docs/execution/{EXECUTION_STATE,PHASE_LOG,DECISION_LOG,KNOWN_BLOCKERS,RESUME_CONTEXT}.md`

## Commands / results
- `npm run build` → exit 0 (client ~14s, 4 routes prerendered, ~24 MB).

## Failing tests
- None (no test framework yet; added Phase 03).

## Assumptions
- Master plan doc missing → using execution-prompt roadmap + `docs/AI_Development_Bible_V2/` (DECISION_LOG D-001).

## Next exact action
1. Produce Phase 01 audit docs under `docs/foundation/`: `KEEP_REFACTOR_REPLACE_MATRIX.md`, `DOMAIN_BOUNDARIES.md`, `DEPENDENCY_MAP.md`, `NEW_RUNTIME_ARCHITECTURE.md`, `MIGRATION_SEQUENCE.md`, `ACCEPTANCE_GATES.md`, `MMORPG_TARGET_ARCHITECTURE.md`, and at least one ADR under `docs/foundation/ADR/`.
2. No gameplay code changes. Commit Phase 01, then proceed to Phase 02 (constitution/router) and Phase 03 (Vitest test foundation).

## Agents needed next
- game-architect (Fable 5) + qa-release (Fable 5) as reviewers; learning/combat/save/mp/economy (Opus 4.8) for domain input. May run inline on main Opus 4.8 session for audit docs.
