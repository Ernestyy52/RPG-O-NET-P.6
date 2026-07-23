# ROLLBACK GUIDE (Phase 00)

How to safely undo transformation work without losing user content or player saves.

## Safety anchors created in preflight

- **Backup tag:** `backup/pre-transformation-20260712-162236` → points at the pre-transformation tip `33a2815`.
- **Integration branch:** `foundation/sgrade-full-transformation` (all transformation commits land here).
- **Untouched branches:** `main` (local == `33a2815`), `feat/boss-arena-biome-tiles` (remote == `33a2815`, i.e. the user's latest work is already on origin), plus `chore/install-claude-auto-router`, `wip/game-ui-before-router`.

> **Never** force-push `main`. **Never** auto-merge the integration branch into `main`.

## Roll back the whole transformation

```bash
# inspect first
git log --oneline foundation/sgrade-full-transformation
# return working tree to the pre-transformation state (non-destructive to other branches)
git checkout main            # or: git checkout backup/pre-transformation-20260712-162236
```

To discard the integration branch entirely (only if intended):
```bash
git branch -D foundation/sgrade-full-transformation
```
The backup tag still lets you recover any commit that was on it via `git reflog` / `git tag`.

## Roll back a single phase

Each passed phase is one checkpoint commit on the integration branch. To undo the most recent phase while keeping earlier ones:
```bash
git checkout foundation/sgrade-full-transformation
git revert <phase-commit-sha>       # safe, creates an inverse commit
# or, if not yet shared/pushed:
git reset --hard <previous-phase-sha>
```
Prefer `git revert` once a phase has been pushed. Use `reset --hard` only on local, unshared history.

## Player-save rollback

Player progress lives in browser **localStorage key `player`** (and `settings`), NOT in git. Code rollbacks do not erase saves. When a phase changes the save schema (Phase 04+):
- migrations must be idempotent and back up the prior blob before replacing it;
- a feature flag must allow reverting to the legacy save path;
- never silently reset a player.

## Recovering uncommitted work

```bash
git stash list          # check for stashes
git reflog              # find detached/overwritten commits
git fsck --lost-found   # last resort for dangling blobs
```

## Emergency recovery lead prompt

If git enters a broken merge/rebase/cherry-pick state, use the **RECOVERY PROMPT** in `RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md`: create a timestamped backup branch + patch first, recover the integration branch to the last validated phase commit, preserve useful uncommitted work on a WIP branch, and do not delete saves/assets/user content.
