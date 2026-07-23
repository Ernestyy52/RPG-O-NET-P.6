# ACCEPTANCE GATES (Phase 01)

A phase is **PASSED** only when every gate below for that phase is met with evidence (git diff, test output, build log, smoke notes). Universal gates apply to every phase.

## Universal gates (every phase)
- [ ] Git diff reviewed; no unrelated files changed.
- [ ] Production build passes (`npm run build` exit 0), no new blocking warnings vs baseline.
- [ ] Relevant unit/integration tests pass (once Phase 03 exists).
- [ ] Phase-specific manual smoke flow performed.
- [ ] Save compatibility preserved (existing localStorage `player` still loads).
- [ ] Lifecycle cleanup verified where scenes/listeners/timers touched.
- [ ] Mobile impact checked when UI/gameplay changed.
- [ ] Independent review (qa-release or reviewer) with evidence.
- [ ] Execution docs updated; checkpoint committed; integration branch pushed when auth available.
- [ ] Pre-existing failures documented and NOT attributed to this phase.

## Per-phase gates (summarized from roadmap)

- **00 Baseline:** reproducible baseline, clean diff, build/test state documented, safe rollback. ✅ met.
- **01 Audit:** architecture independently reviewable, first slices dependency-ordered, no gameplay code changed.
- **02 Constitution:** valid agent files, supported settings only, no app/server/gameplay changes.
- **03 Test/diagnostics:** deterministic tests, production debug disabled by default, build passes.
- **04 Saves:** existing saves migrate; repeated migration safe (idempotent); corrupted/partial recovery; rollback documented; legacy store retained until compat passes.
- **05 Curriculum:** current content preserved; invalid content rejected; only reviewed content selectable in production; tests+report pass.
- **06 Mastery:** deterministic seeded tests; weak skills recur appropriately; learning state separate from combat power.
- **07 Combat extract:** no duplicated formula; legacy test cases equivalent; rules not owned by UI; rollback flag.
- **08 Zone runtime:** TowerScene legacy remains; new runtime enters/exits repeatedly with no listener/timer leak; no full world rebuild yet.
- **09 Real-time combat:** no frame-rate-dependent damage; no duplicate rewards; no invalid attacks; safe reset; legacy rollback.
- **10 Knowledge Break:** not every hit; one wrong answer ≠ instant death; learning state updates; scene changes don't duplicate/lock events.
- **11 Expeditions:** plans vary meaningfully; missed days don't punish; objectives completable & deterministic; no numeric-only filler.
- **12 Classes:** identity obvious; no mandatory best path; no useless solo class; save migration passes.
- **13 Loot/economy:** seeded economy sim; no negative currency; no duplicate claims; no extreme grind; no paid loot box.
- **14 World 1:** new player can finish World 1 boss; no soft lock; mobile flow; learning summary produced; readable boss phases; no placeholder-critical areas.
- **15 Co-op:** reconnect safe; boss synchronized; no reward duplication; client can't claim victory alone; offline still works.
- **16 Teacher:** no active answer-key exposure; learning/game/personal data separated; export tested; flow understandable.
- **17 Mobile/a11y/perf:** viewport matrix passes; repeated scene/save cycles stable; prod build passes; performance measured.
- **18 S-grade audit:** every mandatory gate passes; unresolved issues classified accurately; no false S-grade claim.
- **19–24 MMORPG:** persistence interfaces tested; no client-authoritative inventory; deterministic instance lifecycle; atomic economy; measured load/security evidence before any readiness claim.

## Definition of "no gameplay change" (audit/constitution phases)
Diff limited to `docs/`, `.claude/`, and root config that does not alter runtime behavior. No edits under `app/**` runtime, `server/**`, or `data/**` content.
