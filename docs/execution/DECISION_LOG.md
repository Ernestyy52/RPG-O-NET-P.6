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
