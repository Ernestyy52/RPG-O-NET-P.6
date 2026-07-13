# RPG-O-NET P.6 — Project Constitution

> Root constitution for the S-grade transformation. Read together with `.Codex/AGENTS.md`
> (stack/structure, Thai) and `RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md`
> (24-phase roadmap). Execution state lives in `docs/execution/`; architecture in `docs/foundation/`.

## Product identity
Original 16-bit fantasy educational online RPG (*SPIRAL'S ECHO*) that teaches measurable Grade-6
O-NET English. Students return because exploration, combat, classes, loot, bosses, quests, and
party play are genuinely fun — and every session improves real English mastery.

## Non-negotiable rules (apply to every change)
1. **Learning ≠ combat power.** Mastery/spaced-review state is separate from combat stats (ADR 0003).
2. **Only reviewed questions reach production.** Every production question has a correct answer,
   explanation, distractor reasoning, and provenance. Generate from `knowledge/` → `data/questions.json`;
   never edit `app/data/questions.ts` content directly.
3. **Rewards are validated & idempotent**, never trusted from UI. No duplication, no negative currency.
4. **No** permanent death, paid loot box, gambling, punitive streak, pay-to-win, or real-money trading.
5. **Player data is sacred.** Version every save schema; back up before migration; migrations idempotent;
   never silently reset a player (ADR 0001).
6. **No full rewrite.** Refactor/replace behind feature flags with adapters; keep legacy paths until the
   phase gate passes.
7. **Asset paths** always via `assetPath()` / `app.baseURL` — never hardcode a leading `/` (GitHub Pages subpath).
8. **Mobile & accessibility are first-class**: keyboard/mouse/touch, reduced motion/flash, readable timing.
9. **Clients are untrusted** for online-critical combat/inventory/rewards; offline stays deterministic.
10. **No copyrighted** names/characters/maps/UI/story from existing games.

## Ownership boundaries (who may change what)
- **Saves/persistence** → save-migration-engineer. **Combat formulas** → combat-engineer.
- **Learning content/mastery** → learning-architect. **Economy/rewards** → economy-engineer.
- **Multiplayer/authority** → multiplayer-engineer. **Assets/maps** → world-art-engineer.
- **Scoped UI/quests/bugfixes** → implementation-engineer. **Tests/fixtures/sims** → test-data-engineer.
- **Architecture/cross-domain** → game-architect. **Independent review/release** → qa-release.
- **Trivial mechanical edits** → routine-worker.
Do not cross a boundary without routing to that owner.

## Automatic model / effort routing
| Work | Route | Model |
|---|---|---|
| Architecture, migration seq, unknown root-cause, integration | game-architect | Fable 5 |
| Independent review, release/S-grade audit | qa-release | Fable 5 |
| Combat, save-migration, learning, multiplayer, economy (reasoning-heavy) | domain agent | Opus 4.8 |
| Scoped coding, UI, data wiring, assets, tests | implementation / world-art / test-data | Sonnet 5 |
| Exact renames, formatting, trivial docs | routine-worker | Haiku 4.5 |

Model name mapping (installed): `fable`→Fable 5, `opus`→Opus 4.8, `sonnet`→Sonnet 5, `haiku`→Haiku 4.5.
If a declared model is unavailable, map to the strongest supported equivalent and record the fallback in
`docs/execution/DECISION_LOG.md`.

## Workflow rules
- Work on the integration branch `foundation/sgrade-full-transformation`. Never force-push or auto-merge `main`.
- One checkpoint commit per passed phase; do not squash phase history. Push when auth is available.
- Validate every phase: diff review, `npm run build` (exit 0), tests, manual smoke, save compat, lifecycle
  cleanup, mobile impact, independent review — see `docs/foundation/ACCEPTANCE_GATES.md`.
- Update `docs/execution/*` after every meaningful task and before any handoff.
- Test any change that touches the game page in a running dev server before declaring done.

## Completion report format (per phase)
Report: phase & status, agents/models/effort used, commands run, tests/build result, files changed,
migrations performed, gate checklist, unresolved risks, rollback point, exact next action.
