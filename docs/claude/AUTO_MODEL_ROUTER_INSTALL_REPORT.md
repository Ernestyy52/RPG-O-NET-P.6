# AUTO MODEL ROUTER — INSTALL REPORT (Phase 02)

## Summary
The project subagent router is **installed and valid**. All 11 required agents exist under
`.claude/agents/` with correct frontmatter, and every declared model maps to a model available in
this Claude Code install. No fallback substitution was required.

## Environment detected
- Host: Claude Code, main session model **Opus 4.8** (`claude-opus-4-8`).
- Available models: Fable 5 (`claude-fable-5`), Opus 4.8 (`claude-opus-4-8`), Sonnet 5 (`claude-sonnet-5`), Haiku 4.5 (`claude-haiku-4-5-20251001`).
- Subagent frontmatter fields honored: `name`, `description`, `model`, `effort`, `permissionMode`, `maxTurns`, `isolation`, `color`.
- Effort levels used: `xhigh`, `high`, `medium` — all supported.
- Worktree isolation available (`isolation: worktree`).

## Installed agents & routing

| Agent | Model | Effort | permissionMode | isolation | Domain |
|---|---|---|---|---|---|
| game-architect | Fable 5 | xhigh | plan | — | architecture, cross-domain, migration seq, integration |
| qa-release | Fable 5 | xhigh | plan | — | independent review, release/S-grade audit |
| combat-engineer | Opus 4.8 | xhigh | acceptEdits | worktree | combat, skills, AI, boss phases, Knowledge Break combat |
| learning-architect | Opus 4.8 | xhigh | plan | — | O-NET taxonomy, questions, mastery, spaced review, teacher |
| save-migration-engineer | Opus 4.8 | xhigh | acceptEdits | worktree | persistence, schemas, migrations, recovery |
| multiplayer-engineer | Opus 4.8 | xhigh | acceptEdits | worktree | Colyseus, authority, reconnect, anti-dup, protocol |
| economy-engineer | Opus 4.8 | high | acceptEdits | worktree | inventory, currency, crafting, drops, Sigils, pity |
| implementation-engineer | Sonnet 5 | high | acceptEdits | worktree | scoped UI, Pinia adapters, quests, HUD, bugfixes |
| world-art-engineer | Sonnet 5 | high | acceptEdits | worktree | assets, manifests, loading, tiles, Y-sort, VFX, audio |
| test-data-engineer | Sonnet 5 | medium | acceptEdits | worktree | unit/integration tests, fixtures, seeded sims, reports |
| routine-worker | Haiku 4.5 | medium | acceptEdits | — | trivial renames/formatting/docs |

## Model-name → installed-model mapping
`fable` → Fable 5 · `opus` → Opus 4.8 · `sonnet` → Sonnet 5 · `haiku` → Haiku 4.5.
**Fallback policy:** if any declared model becomes unavailable, route to the strongest supported
equivalent (reasoning-heavy → Opus 4.8/Fable 5; scoped → Sonnet 5; trivial → Haiku 4.5) and log the
substitution in `docs/execution/DECISION_LOG.md`. No substitution currently needed.

## Routing policy (how work is assigned)
1. Reasoning-heavy / cross-domain / review → Fable 5 or Opus 4.8 agents.
2. Scoped implementation, UI, tests, assets → Sonnet 5 agents.
3. Trivial mechanical edits → Haiku 4.5 (routine-worker).
4. Prefer project subagents; isolate parallelizable implementation in worktrees.
5. Foundational documentation/audit phases (00–02) run inline on the main Opus 4.8 session because
   they need no isolation and benefit from already-loaded repo context (DECISION_LOG D-002).
6. Do not repeatedly switch the main session model when delegation can isolate the work.

## Validation performed
- `grep '^model:'` over `.claude/agents/*.md` → fable×2, opus×5, sonnet×3, haiku×1 (all mapped).
- Frontmatter blocks well-formed (leading `---` … `---`) on all 11 agents.
- No app/server/gameplay files changed by router install (chore commit `64a26d6`).

## Settings
`.claude/settings.json` carries a curated allow-list of safe, read-only/build/test commands to reduce
prompts (supported settings only — no model-router keys are invented). Per-machine grants remain in
`.claude/settings.local.json` (not shared).
