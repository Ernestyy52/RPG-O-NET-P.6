# Auto Model & Effort Router — Install Report

Installs the **Automatic Model and Effort Router** described in the master plan
(`RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md`, sections 26–31).

- **Date:** 2026-07-12
- **Branch:** `chore/install-claude-auto-router`
- **Scope:** Claude Code configuration only. No gameplay, dependency, asset, save, or server code was touched.

---

## 1. Environment / version

| Item | Value |
|---|---|
| Claude Code version | **2.1.207** |
| Global package | `@anthropic-ai/claude-code@2.1.207` |
| Provider assumed | Anthropic API (Claude API) |

Minimum versions required by the routed features (all satisfied by 2.1.207):

- Fable 5 model alias — requires **2.1.170+**
- `isolation: worktree` full behavior — requires **2.1.203+**
- `--effort ultracode` (optional, manual only) — requires **2.1.203+**

---

## 2. Capability detection (verified, not assumed)

Verified against the installed CLI (`claude --help`, `claude agents --help`) and the
official docs (`code.claude.com/docs/en/sub-agents`, `.../model-config`) plus the
settings JSON schema. **Only officially supported fields were installed.**

### Supported and used

| Capability | Supported | Notes |
|---|---|---|
| Model alias `fable` | ✅ | Requires 2.1.170+; present in 2.1.207 |
| Model alias `opus` / `sonnet` / `haiku` | ✅ | Standard aliases |
| Model alias `opusplan` | ✅ | Opus in plan mode, Sonnet in execution |
| Frontmatter `name`, `description` | ✅ | Required fields |
| Frontmatter `model` | ✅ | Accepts alias, full ID, or `inherit` |
| Frontmatter `effort` | ✅ | `low`/`medium`/`high`/`xhigh`/`max`; availability depends on model |
| Frontmatter `permissionMode` | ✅ | `plan`, `acceptEdits`, etc. |
| Frontmatter `maxTurns` | ✅ | |
| Frontmatter `memory` | ✅ | `user`/`project`/`local`; router uses `project` |
| Frontmatter `isolation: worktree` | ✅ | Isolated git worktree for risky write agents |
| Settings `model` | ✅ | Set to `opusplan` |
| Settings `effortLevel` | ✅ | Accepts `low`/`medium`/`high`/`xhigh` (not `ultracode`); set to `high` |
| Settings `fallbackModel` (array) | ✅ | Persisted fallback chain; capped at 3 entries after de-dup |

### NOT supported / deliberately excluded

| Field | Decision | Reason |
|---|---|---|
| Settings `advisorModel` | ❌ Excluded | Not present in official model-config docs or settings schema; the master plan itself marks Advisor experimental and says to drop it when unsure. |
| Settings `effortLevel: "ultracode"` | ❌ Not used | Docs confirm the persisted `effortLevel` setting does not accept `ultracode`; ultracode is session-only via `/effort` or `--effort`. |

> Note: the `fallbackModel` field is documented in the official model-config page even though the
> published schemastore JSON schema does not yet list it. Docs are treated as authoritative, so it is used.

---

## 3. Files installed / changed

### Created

- `.claude/agents/game-architect.md`
- `.claude/agents/learning-architect.md`
- `.claude/agents/combat-engineer.md`
- `.claude/agents/save-migration-engineer.md`
- `.claude/agents/multiplayer-engineer.md`
- `.claude/agents/economy-engineer.md`
- `.claude/agents/implementation-engineer.md`
- `.claude/agents/world-art-engineer.md`
- `.claude/agents/test-data-engineer.md`
- `.claude/agents/routine-worker.md`
- `.claude/agents/qa-release.md`
- `docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md` (this file)

### Modified

- `.claude/settings.json` — added `model`, `effortLevel`, `fallbackModel`; preserved existing `$schema` and `permissions`.
- `.claude/CLAUDE.md` — appended the **Automatic Model and Agent Routing** section; all pre-existing project rules preserved.

### Backups (for rollback)

- `.claude/backup/pre-router-2026-07-12/CLAUDE.md.bak`
- `.claude/backup/pre-router-2026-07-12/settings.json.bak`
- `.claude/backup/pre-router-2026-07-12/agents/` (original `README.md`)

### Untouched (per constraints)

`app/`, `server/`, `assets/`, `public/`, `package.json`, gameplay code, save data. The existing
`.claude/agents/README.md` was left in place.

---

## 4. Model / effort routing table

| Agent | Model | Effort | Permission mode | Isolation | Memory |
|---|---|---|---|---|---|
| game-architect | fable | xhigh | plan | — | project |
| learning-architect | opus | xhigh | plan | — | project |
| combat-engineer | opus | xhigh | acceptEdits | worktree | project |
| save-migration-engineer | opus | xhigh | acceptEdits | worktree | project |
| multiplayer-engineer | opus | xhigh | acceptEdits | worktree | project |
| economy-engineer | opus | high | acceptEdits | worktree | project |
| implementation-engineer | sonnet | high | acceptEdits | worktree | — |
| world-art-engineer | sonnet | high | acceptEdits | worktree | project |
| test-data-engineer | sonnet | medium | acceptEdits | worktree | — |
| routine-worker | haiku | medium | acceptEdits | — | — |
| qa-release | fable | xhigh | plan | — | project |

Main session (via `.claude/settings.json`): **`opusplan` + `effortLevel: high`**.

---

## 5. Fallback behavior

Fallback is configured through **officially supported mechanisms only**:

1. **Session-level fallback chain** — `.claude/settings.json` `fallbackModel: ["opus", "sonnet", "haiku"]`.
   Claude Code tries these in order when the primary model is overloaded/unavailable
   (auth, billing, rate-limit, and request-size errors do not trigger a switch). Chain capped at 3.
   Override for one session with `claude --fallback-model opus,sonnet,haiku`.
2. **Fable-specific agent fallback** — `game-architect` and `qa-release` request Fable 5.
   Their prompts instruct: if Fable is unavailable, run on `opus` at `xhigh` and disclose the fallback.
   Claude Code also auto-falls-back from Fable when a request is safety-flagged.
3. **Routing discipline rule #7** in CLAUDE.md — any agent that cannot access its configured
   model uses the strongest allowed model and discloses the substitution.

`advisorModel` is intentionally **not** set (see §2). To enable Advisor manually (Anthropic API only,
experimental), a user could add `"advisorModel": "fable"` to settings — not done here.

---

## 6. Manual invocation examples

Let routing choose automatically:

```text
Analyze and fix the current boss encounter soft lock.
Follow CLAUDE.md automatic routing.
```

Force a specific agent for high-stakes work:

```text
@game-architect Audit the migration plan before implementation.
@learning-architect Review the O-NET mastery algorithm.
@combat-engineer Implement the approved boss phase state machine.
@qa-release Audit Phase 7 against its acceptance criteria.
```

Hybrid main session (Opus plans, Sonnet executes):

```text
/model opusplan
/effort high
```

One-off heavy analysis without changing the session:

```text
ultrathink
```

Very large single job — start a fresh session:

```bash
claude --model fable --effort ultracode
```

---

## 7. Validation performed

- **JSON syntax** — `.claude/settings.json` parses (verified with `node -e JSON.parse`).
- **YAML frontmatter** — all 11 agent files have valid, closed `---` frontmatter with required `name`/`description`.
- **Agent discovery** — `claude agents` / the agent loader scans `.claude/agents/` recursively; 11 agents defined.
- **Model availability** — all referenced aliases (`fable`, `opus`, `sonnet`, `haiku`, `opusplan`) valid on 2.1.207.
- **Effort availability** — all referenced levels (`medium`, `high`, `xhigh`) valid; unsupported levels auto-clamp down.
- **Git diff scope** — changes limited to `.claude/` and `docs/claude/`; no `app/`, `server/`, `assets/`, `public/`, `package.json`, save, or gameplay files.

> A running Claude Code session may need a **restart** to pick up the newly created
> `.claude/agents/` and updated `.claude/settings.json`.

---

## 8. Rollback

```bash
# restore configuration from backup
cp .claude/backup/pre-router-2026-07-12/CLAUDE.md.bak       .claude/CLAUDE.md
cp .claude/backup/pre-router-2026-07-12/settings.json.bak   .claude/settings.json

# remove installed agents (keep original README.md)
rm .claude/agents/game-architect.md .claude/agents/learning-architect.md \
   .claude/agents/combat-engineer.md .claude/agents/save-migration-engineer.md \
   .claude/agents/multiplayer-engineer.md .claude/agents/economy-engineer.md \
   .claude/agents/implementation-engineer.md .claude/agents/world-art-engineer.md \
   .claude/agents/test-data-engineer.md .claude/agents/routine-worker.md \
   .claude/agents/qa-release.md

rm docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md
```

Or, since everything is on branch `chore/install-claude-auto-router`, discard with
`git checkout -- .claude docs` (untracked new files removed via `git clean -fd .claude docs/claude`).
