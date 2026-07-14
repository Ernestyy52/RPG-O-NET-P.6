# PHASE_LOG

Chronological record of phase execution. Newest at bottom.

## Preflight — 2026-07-12
- Inspected git: branch `foundation/phase-00-baseline`, origin `Ernestyy52/RPG-O-NET-P.6`, HEAD `33a2815`. Latest work already on origin as `feat/boss-arena-biome-tiles`; local `main` == `33a2815` (2 ahead of `origin/main`, untouched).
- Preserved user work: created backup tag `backup/pre-transformation-20260712-162236`; created + checked out integration branch `foundation/sgrade-full-transformation`. Untracked agent files carried over.
- Verified `.gitignore` protects `.env`, `node_modules`, `.output`, `.nuxt`, `dist`.
- **Router repair:** 11 required subagents already present with valid frontmatter; models (fable/opus/sonnet/haiku) all map to installed models. Committed as `64a26d6`.

## Phase 00 — Baseline & repo normalization — 2026-07-12 — status: PASSED (pending commit)
- Static-read inventory of stack, `app/` layout (~6,143 LOC), content (69 questions), server, save model.
- Ran production build → **exit 0** (client ~14s, 4 routes prerendered, ~24 MB output).
- Wrote `docs/foundation/{BASELINE, CURRENT_RUNTIME_FLOW, KNOWN_EXISTING_ISSUES, ROLLBACK_GUIDE, ENVIRONMENT_REQUIREMENTS}.md`.
- Wrote `docs/execution/{EXECUTION_STATE, PHASE_LOG, DECISION_LOG, KNOWN_BLOCKERS, RESUME_CONTEXT}.md`.
- Gate: reproducible baseline ✓, clean phase diff (docs + router only, no gameplay code) ✓, build/test state documented ✓, safe rollback exists ✓.
- Committed `82d2856`; pushed integration branch to origin (new remote branch, tracking set).

## Phase 01 — Deep architecture & design audit — 2026-07-12 — status: PASSED (pending commit)
- Read domain files (BattleModal, classes, player store, createGame, eventBus, questions) to ground the audit.
- Wrote `docs/foundation/{KEEP_REFACTOR_REPLACE_MATRIX, DOMAIN_BOUNDARIES, DEPENDENCY_MAP, NEW_RUNTIME_ARCHITECTURE, MIGRATION_SEQUENCE, ACCEPTANCE_GATES, MMORPG_TARGET_ARCHITECTURE}.md`.
- Wrote ADRs: `ADR/0001-versioned-save-envelope`, `0002-pure-combat-domain`, `0003-learning-combat-firewall`.
- Key findings: BattleModal owns all combat formulas+rewards+loot (→Phase 07); player store monolithic no-version (→Phase 04); classes are stat-blocks only, no kits (→Phase 12); questions lack typed schema/status (→Phase 05).
- Gate: architecture independently reviewable ✓, first slices dependency-ordered (MIGRATION_SEQUENCE) ✓, **no gameplay code changed** (git diff docs-only) ✓.
- Committed `f65f566`; pushed.

## Phase 02 — Project constitution & auto routing — 2026-07-12 — status: PASSED (pending commit)
- Created root `CLAUDE.md` (constitution: non-negotiables, ownership boundaries, model/effort routing, workflow, completion-report format).
- Created `docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md` (agents/models/effort table, name mapping, fallback policy, validation).
- Hardened `.claude/settings.json` with a curated safe allow-list (git read/add/branch, npm build/generate/test, vitest) + deny force-push. Valid JSON confirmed.
- Gate: valid agent files ✓, supported settings only ✓, **no app/server/gameplay changes** ✓.
- Committed `019d332`; pushed.

## Phase 03 — Test/diagnostic/observability foundation — 2026-07-12 — status: PASSED (pending commit)
- Added Vitest 3 (devDep) + `vitest.config.ts` (node env, `~`/`@`→app alias, deterministic order); `npm test` / `test:watch` scripts.
- Wrote 45 deterministic tests / 7 files: floors, questions (CEFR + shuffle-bag), skills (prereqs), quests (seeded daily gen), equipment (catalog/shop/recipes), loot (seeded randomness), player-store (stats, rewards+level-up, damage seam, item transactions, idempotent quest claim). **All 45 pass.**
- Added dev-only diagnostics plugin `app/plugins/diagnostics.client.ts` (gated by `import.meta.dev`): setFloor/setClass/grant/spawnEnemy/spawnBoss/knowledgeBreak(placeholder)/bossPhase/stats(FPS,entities,listeners)/snapshot/reset(save-safe). Reads existing `window.__game`; no gameplay files modified.
- Wrote `docs/testing/{TEST_STRATEGY, DIAGNOSTIC_MODE, MANUAL_SMOKE_MATRIX}.md`.
- Verified `npm run build` exit 0 AND diagnostics absent from `.output/public` (production debug disabled by default).
- Gate: deterministic tests ✓, production debug off by default ✓, build passes ✓.
- Committed `3a572ad`; pushed.

## Phase 04 — State separation & versioned saves — 2026-07-12 — status: PASSED (pending commit)
- Route: inline on Opus 4.8 (= save-migration-engineer's model; correct route, avoids cold-context re-derivation).
- Added `app/utils/save/`: `schema.ts` (SaveEnvelope{version,savedAt,slices} + 7 slices + defaults + isValidEnvelope), `legacyAdapter.ts` (monolithic player ↔ slices, partial-tolerant), `migrations.ts` (idempotent registry + runMigrations), `saveManager.ts` (loadSave primary→backup→legacy→default with corrupt-blob preservation, writeSave backup-before-write, migrateLegacyIfNeeded one-time; injectable StorageLike; `SAVE_ENVELOPE_ENABLED=false`).
- Added `test/save.spec.ts` (11 tests): round-trip, idempotent migration, v0→v1, corruption recovery + corrupt-blob preservation, load precedence, backup-before-write, one-time legacy migration. **Total suite 56 passing.**
- Wrote `docs/foundation/SAVE_MIGRATION_GUIDE.md` (integration + rollback).
- **Legacy `player` store retained and authoritative; flag off ⇒ zero runtime behavior change.** Build exit 0.
- Gate: existing saves migrate ✓, repeated migration safe ✓, corrupted/partial recovery ✓, rollback documented ✓, legacy retained until compat passes ✓.
- Committed `0c52f21`; pushed.

## Phase 05 — O-NET curriculum & content validation — 2026-07-12 — status: PASSED (pending commit)
- Route: learning-architect (Opus 4.8) inline + test-data-engineer patterns for validators.
- Added `app/data/curriculum/`: `taxonomy.ts` (4 domains → 13 subskills w/ prereqs+misconceptions), `schema.ts` (CurriculumQuestion + status/provenance/subskill/pedagogy), `adapter.ts` (69 existing → reviewed, grandfathered; authorQuestion→draft), `validation.ts` (validateQuestion, analyzeAnswerPositions, findDuplicatePrompts, selectableInProduction, validationReport), `reviewQueue.ts` (buildReviewQueue, promoteToReviewed).
- **Content fix:** validator caught a biased answer key ([27,34,7,1] → 49% "B"). Deterministic correctness-preserving rebalance of `data/questions.json` → [18,17,17,17] (maxShare 0.26); verified every correct-answer text + choice set unchanged (54/69 reordered). Only `data/questions.json` touched, never `app/data/questions.ts`.
- Added `test/curriculum.spec.ts` (13 tests): adapter preservation, all 69 valid+selectable, no duplicates, balanced key, malformed rejection, production rule (only reviewed), review queue/promotion. **Suite: 69 passing.**
- Wrote `docs/learning/CURRICULUM_AND_VALIDATION.md`; updated KNOWN_EXISTING_ISSUES. Build exit 0.
- Gate: current content preserved ✓, invalid content rejected ✓, only reviewed selectable in production ✓, tests+report pass ✓.
- Committed `1dff865`; pushed.

## Phase 06 — Mastery, spaced review & daily learning planner — 2026-07-12 — status: PASSED (pending commit)
- Route: learning-architect (Opus 4.8) inline design/impl; test-data-engineer patterns for seeded sims; qa-release independent review (see below).
- Added `app/data/learning/`: `rng.ts` (mulberry32 seeded PRNG), `scheduler.ts` (SM-2-lite: nextStability/nextReviewAt/isDue/overdueMs), `mastery.ts` (SubskillMastery + applyAnswer: EMA mastery, response-time avg, misconceptions, lapses), `selector.ts` (QuestionSelector — selectableInProduction only, weak/due/unseen weighting, anti-repeat, adventure/learning-focus), `planner.ts` (10/20/30-min plans, mode focus, positive rested bonus, catch-up, deterministic), `summary.ts` (LearningSessionSummary — movement, misconceptions, recommendations, dueSoon).
- Save: extended learning slice with `mastery` + `lastSessionDate`; bumped CURRENT_SAVE_VERSION 1→2 with a registered v1→v2 migration (preserves correctAnswers; idempotent). Legacy adapter defaults new fields. Flag still off ⇒ no runtime change.
- Added `test/learning.spec.ts` (19 tests). **Suite: 88 passing.** `npm run build` exit 0.
- Independent review (qa-release mandate; delegated agent hit a session limit, completed by orchestrator with the same evidence): grep confirms NO player/combat-stat/Math.random in `app/data/learning/` (comments only); selector+planner route through selectableInProduction; mastery clamped [0,1]; planner target = base + non-negative restedBonus (never shrinks); anti-repeat window < pool size (no forced dupes); v1→v2 preserves data. **Verdict: PASS.**
- Wrote `docs/learning/MASTERY_AND_PLANNER.md`.
- Gate: deterministic seeded tests ✓, weak skills recur appropriately ✓, learning state separate from combat power ✓, spaced review/anti-repeat/answer-position balance/10-20-30 plans/Adventure/Learning-Focus/catch-up/non-punitive missed days ✓, saves preserved via approved migration ✓.

## Phase 07 — Extract combat domain (ADR 0002) — 2026-07-12 — status: PASSED (pending commit)
- Route: combat-engineer + game-architect + test-data-engineer work executed inline on the main Opus 4.8 session (installed agent roster is generic; reasoning-heavy combat extraction kept on the strongest model with full repo context).
- Added pure `app/data/combat/` (no Vue/Phaser/Pinia imports, no Math.random/clock):
  - `formulas.ts` — comboBonus, heroDamage, monsterDamage, mitigateDamage, supportHeal, escapeChance, heroWinsInitiative, scaleMonsterAtk (single source of truth for every combat number).
  - `types.ts` — RuntimeStats, Resource, StatusEffect, Cooldown, CombatActor, DamageRequest/DamageResult, CombatEvent.
  - `skills.ts` — CombatSkillId + COMBAT_SKILLS catalog (attack/support/counter/escape), SUPPORT_MP=8/COUNTER_MP=6/CORRECT_ANSWER_MP_REGEN=2, heroActionMultiplier.
  - `engine.ts` — setupEncounter (mirrors setupMonster), resolveHeroSkill, resolveMonsterAttack.
  - `rewards.ts` — gemsForEncounter, buildRewardRequest (non-negative integer clamp + empty-loot drop), RewardLedger (idempotent per-encounter payout; constitution rule 3).
  - `index.ts` — barrel + `COMBAT_DOMAIN_ENABLED` rollback flag (false).
- Rewired UI/store to delegate (no duplicated formula remains): `BattleModal.vue` sources all math from the domain (setupMonster→setupEncounter, heroDamage/heroHit, counter/escape/support, monsterAttack, winBattle→buildRewardRequest+RewardLedger); `player.ts` takeDamage→mitigateDamage. `combatDomain` flag gates the engine-driven turn path (resolveHeroSkill/resolveMonsterAttack); legacy path calls the same domain formulas ⇒ single source in both flag states.
- Added `test/combat.spec.ts` (19 tests): every formula asserted equal to the pre-extraction legacy expression across parameter grids; engine resolvers, setupEncounter overrides, gems, reward validation + ledger idempotency. **Suite: 107 passing / 11 files.** `npm run build` exit 0. Dev server boots + serves 200, no import/runtime errors.
- Gate: no duplicated formula (grep clean) ✓, equivalent legacy test cases pass ✓, combat rules no longer owned by UI (formulas in domain, store delegates) ✓, rollback feature flag present (`COMBAT_DOMAIN_ENABLED`) ✓.

## Phase 08 — New Phaser zone runtime (scaffold + lifecycle) — 2026-07-12 — status: PASSED (pending commit)
- Route: game-architect (Fable-tier) design + implementation-engineer execution, run inline on the main Opus 4.8 session (generic installed roster; full repo context loaded).
- Added modular, framework-agnostic runtime `app/game/runtime/` (no Vue/Phaser import in the pure systems ⇒ unit-testable in Node):
  - `lifecycle.ts` — SceneLifecycle: reverse-order, error-isolated, idempotent teardown of every registered Disposer (the leak-free backbone).
  - `movement.ts` — resolveMovement(input, prevFacing) PlayerController, faithful to the legacy left/up-priority + vertical-wins-facing rules.
  - `zone.ts` — buildZoneDefinition + TILE/MAP_W/MAP_H/SPAWN_BOUNDS/TREE_SPOTS: the floor layout as data (single source; no render rebuild).
  - `spawn.ts` — rollMonsterSpawns SpawnSystem with an injected Rng port (Phaser.Math.RND in-scene / mulberryRng seeded in tests); cell-grid placement preserved.
  - `encounter.ts` — canStartEncounter + isNetMonsterFightable InteractionSystem guards.
  - `zoneRuntime.ts` — ZoneRuntime enter()/exit() over a RuntimeHost port; registers timers + event listeners into a fresh SceneLifecycle each entry and disposes on exit.
  - `index.ts` — barrel + `NEW_ZONE_RUNTIME_ENABLED` flag (false, dormant rollback lever).
- Rewired legacy `TowerScene` to consume the pure systems as single source of truth (behavior-preserving): movement via resolveMovement, spawn via runtime rollMonsterSpawns, encounter/net-lock via the guards, layout constants (TILE/MAP_W/MAP_H/SPAWN_BOUNDS) imported from the runtime. TowerScene remains the active renderer (rollback); no rendered scene runs on ZoneRuntime yet.
- Added `test/zone-runtime.spec.ts` (18 tests): lifecycle reverse/idempotent/error-isolation/post-dispose-immediate; movement priority + diagonal facing; zone border-ring integrity; spawn bounds/count/determinism/spread; encounter guards; **ZoneRuntime enter/exit ×50 leaves zero live registrations on a FakeHost (headline gate)** + double enter/exit safety + callback routing. **Suite: 125 passing / 12 files.**
- `npm run build` exit 0. Dev server: TowerScene + runtime/index transform under Vite HTTP 200 (live modules compile with the new wiring).
- Gate: TowerScene legacy remains ✓, new runtime enters/exits repeatedly with no listener/timer leak (tested) ✓, no full world rebuild yet ✓, `newZoneRuntime` rollback flag present ✓, lifecycle cleanup verified ✓.

## Phase 09 — Real-time action-lite combat (domain) — 2026-07-12 — status: PASSED (pending commit)
- Route: combat-engineer (Opus 4.8) design + implementation, inline on the main session; built entirely on the Phase 07 domain.
- Added `app/data/combat/realtime.ts` — `RealtimeCombat`: a deterministic, framework-agnostic action-lite loop driven by a wall-clock delta (ms). Reuses `resolveHeroSkill`/`resolveMonsterAttack` (no duplicated formula) and `buildRewardRequest` + `RewardLedger` (no duplicated reward path). Per-skill cooldowns (`REALTIME_SKILL_TIMINGS`: attack 500 / support 6000 / counter 3000 ms), fixed monster attack cadence (`DEFAULT_MONSTER_ATTACK_INTERVAL_MS` 1600), combo/MP coupling via `registerAnswer`.
- Flag `REALTIME_COMBAT_ENABLED = false` added to the combat barrel (dormant). Turn-based `BattleModal` remains authoritative — **no game-page file touched this phase**, so no dev smoke required (build + unit tests are the gate).
- Added `test/combat-realtime.spec.ts` (12 tests): frame-rate independence (fine 200×10ms == coarse 5×400ms == single 2000ms tick, per-hit damage fixed); no invalid attacks (on-cooldown / insufficient-mp / target-down / hero-down / combat-over all rejected WITHOUT mutating); cooldown recovery; combo-scaled hero damage equals `heroDamage(1+comboBonus)`; wrong answer resets combo, correct regens MP; idempotent victory reward via ledger (second claim null); non-win grants nothing; safe `reset()` restores exact initial state and remains playable. **Suite: 137 passing / 13 files.** `npm run build` exit 0.
- Gate: no frame-rate-dependent damage (per-action hero damage + cadence-based monster hits, tested across granularities) ✓, no duplicate rewards (RewardLedger claim-once, tested) ✓, no invalid attacks (validate-then-reject, tested) ✓, safe reset (tested) ✓, legacy rollback flag `realtimeCombat` present ✓.

## Phase 10 — Knowledge Break — 2026-07-12 — status: PASSED (pending commit)
- Route: learning-architect (Opus 4.8) design + implementation, inline; bridges Phase 06 (learning) and Phase 09 (real-time combat).
- Added `app/data/learning/knowledgeBreak.ts` — `KnowledgeBreakController`: a pure state machine (idle↔open) that occasionally interrupts real-time combat with one reviewed question. Selects via Phase 06 `selectQuestion` (production-only pool), records answers, and folds them into mastery via `summarizeSession`. Returns a combat `effect` ('empower' | 'combo-lost') the scene applies to `RealtimeCombat.registerAnswer` — the controller NEVER touches HP.
- Flag `KNOWLEDGE_BREAK_ENABLED = false` (dormant). **No game-page file touched** — build + unit tests are the gate.
- Added `test/knowledge-break.spec.ts` (10 tests): cadence (no open before `attacksPerBreak`=3 attacks; opens on 3rd; counter resets), min-gap cooldown between breaks, no-question fallback (all-draft / empty pool ⇒ null, combat continues), idempotent open (second open returns the same break) + idempotent resolve (second resolve null, one record) + `cancel()` clears open break without recording (safe scene teardown), correct⇒'empower' / wrong⇒'combo-lost' with the resolution carrying NO hp/damage field (wrong ≠ instant death, structural), misconception recorded on wrong, and `summarize()` producing updated mastery. **Suite: 147 passing / 14 files.** `npm run build` exit 0.
- Gate: not every hit (cadence + gap, tested) ✓, one wrong answer ≠ instant death (no HP path; monster paused while break open, tested resolution shape) ✓, learning state updates (records → summarizeSession, tested) ✓, scene changes don't duplicate/lock events (idempotent open/resolve + cancel, tested) ✓, no-question fallback (tested) ✓, `knowledgeBreak` rollback flag present ✓.

## Phase 11 — Adaptive Daily Expeditions — 2026-07-12 — status: PASSED (pending commit)
- Route: learning-architect (Opus 4.8) design + implementation, inline; built on the Phase 06 planner (`generateDailyPlan`).
- Added `app/data/learning/expedition.ts` — `generateExpedition(pool, input)` wraps the daily plan into a themed multi-objective expedition. Objective kinds: `weak-skill-drill` (targets a real weak subskill by name), `review-due` (only when a due backlog exists), `domain-variety` (range across ≥2 language areas), `accuracy` (a quality gate, not a count), `capstone` (narrative finish). `evaluateExpedition(exp, progress)` maps progress→completion + summed reward, purely. Flag `ADAPTIVE_EXPEDITIONS_ENABLED = false` (dormant). **No game-page file touched.**
- Added `test/expedition.spec.ts` (7 tests): determinism (same input ⇒ identical); meaningful variation (isolating a weak domain shifts the drill subskills + plan focus); non-punitive absence (rested bonus adds bonus objectives, base objectives are a subset, all rewards positive — no penalty); no numeric-only filler (≥3 distinct kinds incl. accuracy + capstone, content-tied descriptions, drills reference in-pool subskills); completable & deterministic (progress meeting all targets ⇒ allComplete + full reward; missing target ⇒ objective incomplete, reward excluded); fallback (no reviewed content ⇒ fallback:true, single shallow objective, empty plan ids). **Suite: 154 passing / 15 files.** `npm run build` exit 0.
- Gate: plans vary meaningfully (tested) ✓, missed days don't punish (additive rested bonus, tested) ✓, objectives completable & deterministic (bounded by available content + pure evaluator, tested) ✓, no numeric-only filler (semantic kinds + content-tied text, tested) ✓, shallow-counter fallback (tested) ✓.

## Phase 12 — Four class kits — 2026-07-12 — status: PASSED (pending commit)
- Route: combat-engineer (Opus 4.8) kit design + save-migration-engineer (Opus 4.8) for the v2→v3 schema step; inline.
- Added `app/data/combat/classKits.ts` — one distinct ACTIVE kit per class (3 abilities each) on the Phase 07 domain: warrior (balanced bruiser), mage (burst + best heal, MP-hungry/fragile), archer (fast low-cooldown striker), guardian (top mitigation + counters, low damage). `kitProfile(classId)` derives DPS/mitigation/sustain purely from ability fields; `kitAbilityDamage` reuses `heroDamage` (no duplicated formula). Flag `CLASS_KITS_ENABLED = false` (dormant); exported from the combat barrel.
- **Save migration (ADR 0001):** bumped `CURRENT_SAVE_VERSION` 2→3; added `kitLoadout: string[]` to `CharacterSlice` (defaults to the class starter kit). Registered v2→v3 migration that seeds `kitLoadout` from the SAVE's own `classId` when absent (idempotent; preserves an existing custom loadout). Legacy adapter seeds `kitLoadout` from the class. Live Pinia `player` store untouched — envelope stays dormant, existing localStorage saves still load unchanged.
- Added `test/class-kits.spec.ts` (7 tests): structure/unique ids, loadout defaults, distinct axis leaders (dps→archer, mitigation→guardian, sustain→mage; identity obvious), no class leads >1 axis + total-value parity band <1.4 (no mandatory best path), every kit is solo-viable (damage + defense/sustain), damage reuses `heroDamage`. Extended `test/save.spec.ts` (+3): v2→v3 defaults by class, idempotent + preserves custom loadout, legacy seeds by class. Updated one stale Phase-06 assertion (v1 now steps to v3). **Suite: 164 passing / 16 files.** `npm run build` exit 0.
- Gate: identity obvious (distinct signatures + unique axis leaders) ✓, no mandatory best path (single-axis leadership + parity band) ✓, no useless solo class (each kit deals damage AND survives) ✓, save migration passes (v2→v3 idempotent, class-correct default, legacy compat, existing saves load) ✓.

## Phase 13 — Progression / loot / crafting / Sigils — 2026-07-12 — status: PASSED (pending commit)
- Route: economy-engineer (Opus 4.8) design + save-migration-engineer (Opus 4.8) for v3→v4; inline. Built on Phase 04 saves + Phase 07 combat (RewardLedger).
- Added `app/data/economy/`: `currency.ts` (clamped Wallet spend/earn + all-or-nothing material consume + idempotent `claimReward` via RewardLedger), `sigils.ts` (25 socketable augments — 5 elements × 5 tiers, bounded stats, socket cap 2, `applySigils`/`socketSigil`/`totalSigilBonus`), `crafting.ts` (`craftSigil` — deterministic, materials+gold only, all-or-nothing), `sim.ts` (`simulateEconomy` — seeded, floor-reward-grounded income, gear-upgrade sink), `index.ts` barrel. Flag `SIGILS_ENABLED = false` (dormant).
- **Save migration (ADR 0001):** bumped `CURRENT_SAVE_VERSION` 3→4; InventorySlice gains `sigils` + `socketedSigils` (default empty). v3→v4 migration = mergeSliceDefaults (preserves gold/gems/items/equipment). Legacy adapter seeds empty sigils. Live Pinia store untouched; existing localStorage saves still load.
- Added `test/economy.spec.ts` (12 tests): no-negative currency (reject overspend, all-or-nothing materials), idempotent reward claim (no double payout), sigils crafted from materials+gold only (no gems, no random) + bounded/tier-scaled + socket cap/dedupe + bonus aggregation, deterministic craft, seeded economy sim (same seed identical; never negative; gems only from bosses = bossKills; tier-2 gear affordable ≤20 encounters = no grind wall; sink runs). Extended `test/save.spec.ts` (+1 v3→v4). **Suite: 177 passing / 17 files.** `npm run build` exit 0.
- Gate: seeded economy sim (deterministic, property-checked) ✓, no negative currency (clamped spend, tested) ✓, no duplicate claims (RewardLedger, tested) ✓, no extreme grind (bounded affordability, tested) ✓, no paid loot box (sigils = deterministic material+gold craft, no gems/random, tested) ✓.

## Phase 14 — World 1 Vertical Slice — 2026-07-15 — status: PASSED (gate audited; human interactive smoke recommended pre-release, waived for phase progression per user authorization)
- **Route:** main session (Opus 4.8) orchestration + inline domain work across combat / learning / economy / save / world-art / implementation; incremental (Inc 1 plan → Inc 2 DungeonScene → Inc 3 seven flag flips + boss phases → Inc 4 content + assets → Inc 5 gate audit).
- **Delivered:** all 7 domain flags flipped LIVE on World-1 (floors 1–10) — zone runtime, engine combat, real-time combat, Knowledge Break, class kits, sigils, adaptive expeditions — behind per-zone gating (floors 11+ unchanged legacy path). Boss = Myco Colossus with a 3-phase HP-derived telegraph. **Content:** 12-step main quest + 10 side quests + 3 secrets (all data-driven, deterministic, offline-completable, idempotent rewards, live-wired via safe index.vue/scene signals + QuestModal UI). **Assets (user-dropped Craftpix packs, curated — raw 559 MB dump relocated to gitignored `asset-packs/`, build output 24 MB):** 4 named town NPC quest-givers (frame-analyzed with sharp), verdant foliage + dungeon props + animated braziers in the dungeons, a new Forest Lizard monster.
- **Save migration:** live Pinia `player` store gained additive fields (`socketedSigils`, `mainQuest`, `sideQuestProgress`, `sideQuestClaimed`, `secretsFound`) — each with a `state()` default AND an `afterHydrate` backfill (`ensurePlayerDefaults`). `SAVE_ENVELOPE_ENABLED` stays `false` (legacy blob authoritative). Envelope schema kept at v4 with the sigil shape registered.
- **Validation:** `npm test` → **261 passing / 28 files**; `npm run build` exit 0; `nuxt generate` output 24 MB; every flag/feature passed a dev-server module-transform smoke.
- **Gate audit (Phase-14 rows):**
  - New player can finish World-1 boss → path present + combat/boss/quest wired and unit-tested (fresh-profile interactive run = human, recommended).
  - No soft lock → **PASS by construction**: dungeon reachability BFS tests, boss phases re-derived from HP, quest reducers replay-safe with NO RNG-gated step (asserted), Knowledge-Break `cancel()` on teardown, decor non-blocking (not in wallGrid).
  - Learning summary produced → **PASS (tested)**: `summarizeSession` at fight end persists to the separate learning store.
  - Readable boss phases → **PASS (unit)**: 3-channel telegraph (color/banner/pattern), ≥600 ms floor asserted; glance test = human.
  - No placeholder-critical areas → real dungeon tiles + NPCs + foliage/props/braziers + monster variety; visual sweep = human but substantially addressed.
  - Mobile flow → touch via existing `resolveMovement`, responsive UI, reduced-motion honored; viewport matrix = human.
- **Universal gates:** build exit 0 ✓ · tests 261 ✓ · **save-compat PASS (now unit-tested: pre-Phase-14 blob loads with zero loss, idempotent backfill)** ✓ · lifecycle cleanup (scene shutdown handlers, texture unload) ✓ · docs updated ✓ · checkpoint + push ✓ · independent review — done inline + automated (qa-release Fable-5 pass deferrable).
- **Honest caveat:** the fresh-profile interactive playthrough (desktop/mobile/reduced-motion), the boss 3-channel glance test, and the visual placeholder sweep require a human at a browser — Phaser can't render headless here. Every automatable gate row PASSES with evidence; these human items are recommended before a public release but, per the user's explicit authorization (2026-07-15), do not block progression to Phase 15.
- **Rollback:** every flag is a one-commit revert; DungeonScene + content + assets are additive; floors 11+ never left the legacy path. Tag `backup/pre-phase-14` @ `c7ab53c`.

## Phase 15 — Safe co-op + server authority — 2026-07-15 — status: PASSED (authority gate proven headless; live multi-client run pending, waived for progression per user authorization)
- **Route:** main session (Opus 4.8) as multiplayer-engineer + game-architect (authority boundary), inline. Depends on P07 combat, P13 economy (reward path), P14 World-1 slice.
- **Delivered:** a pure, tested **server-authority domain** `app/data/coop/` so online-critical combat + rewards can't be client-forged (constitution rule 9), plus the client/server wiring behind a dormant `COOP_ENABLED` flag.
  - `authority.ts` — `applyCoopDamage` (server owns shared-encounter HP; clamps one hit to ≤50% of maxHp so no client can lone-one-shot; accumulates across players; kills exactly once; no-op after death), `coopBossPhase` (phase derived from the single server HP fraction, reusing the Phase-14 `advanceBossPhase` ⇒ every client resolves the SAME phase), `CoopRewardLedger` (grants each participant once per encounter, only after server-confirmed death; duplicate/reconnect claims rejected).
  - `protocol.ts` — message contract (`coop:damage`/`coop:claim`/`coop:snapshot`/`coop:reward`) + `COOP_ENABLED = false`.
  - `net.ts` — dormant client helpers `sendCoopDamage`/`sendCoopClaim` (no-op offline/flag-off ⇒ offline byte-identical).
  - `server/index.js` — `CoopBattleRoom`, a faithful JS mirror of the authority (server-owned HP, 50% hit clamp, participant tracking, one-time reward, reconnect-safe onLeave). Inert until a client joins `coopbattle`.
- **Validation:** `npm test` → **269 passing / 29 files** (+8 `coop.spec.ts`); `npm run build` exit 0; `node --check server/index.js` OK; dev-server transform smoke green (coop modules + net.ts → 200).
- **Gate audit (Phase-15 rows), all proven by `test/coop.spec.ts`:**
  - Client can't claim victory alone → **PASS**: kill is server-computed from clamped damage; `claim` requires `alive === false` (server-owned); a single hit ≤50% can't kill.
  - No reward duplication → **PASS**: `CoopRewardLedger` idempotent per (encounter, player).
  - Boss synchronized → **PASS**: phase derived from the one server HP fraction; two observers of the same state agree.
  - Reconnect safe → **PASS**: ledger keyed by stable id + participants persist on server `onLeave`; a re-received dead encounter never double-grants.
  - Offline still works → **PASS**: `COOP_ENABLED=false`; helpers no-op; server room inert; build+tests green; offline path unchanged.
- **Universal gates:** build exit 0 ✓ · tests 269 ✓ · **no save-shape change** (co-op adds no persisted player field) ✓ · lifecycle (stateless helpers; server room drops presence on leave, keeps ledger) ✓ · docs updated ✓ · checkpoint + push ✓.
- **Honest caveat:** the LIVE co-op run (deployed Colyseus server + multiple browser clients actually fighting/reconnecting) can't be verified headless. The authority PROPERTIES that the gate names are proven by unit tests, and the server room mirrors the tested spec; live verification + a `COOP_ENABLED` flag-flip is the deferred integration (like the Phase-14 interactive smoke). Waived for progression per user authorization (2026-07-15).
- **Rollback:** `COOP_ENABLED` one-line revert; all wiring is additive + dormant; the `coopbattle` room is never instantiated while off. Offline single-player + the Phase-14 slice untouched.

## Phase 16 — Teacher dashboard — 2026-07-15 — status: PASSED (domain + export tested; dashboard UI = deferred flag-flip)
- **Route:** learning-architect (Opus 4.8) data-separation boundary + report design, inline. Consumes P05 curriculum taxonomy + P06 mastery/summaries.
- **Delivered:** `app/data/teacher/` — `buildLearnerReport`/`buildClassReport` (accuracy, per-domain breakdown, weakest named subskills, common misconceptions, coverage, due-for-review) + `learnerReportToCsv`/`classRosterToCsv`/`classReportToJson`. Reads ONLY learning data (mastery + subskill taxonomy); never questions/answers, never the player save. `TEACHER_ENABLED` flag dormant.
- **Validation:** `npm test` +9 (`teacher.spec.ts`); build exit 0.
- **Gate:** no active answer-key exposure — **PASS (tested)**: exports asserted to contain no `answerIndex`/`choices`/`prompt`/… . learning/game/personal data separated — **PASS (tested)**: exports contain no `hp`/`gold`/`inventory`/`accountName`/`sessionId`; the only identity is a teacher-supplied label. export tested — **PASS**: CSV/JSON well-formed. understandable flow — human-readable subskill names + a class rollup.
- **Caveat:** the teacher *page* (auth + rendering the reports) is the deferred `TEACHER_ENABLED` flag-flip UI (like other phases' live integration). The report/export logic + data-separation guarantees are proven headless.
- **Rollback:** pure additive domain; flag off ⇒ nothing surfaced.

## Phase 17 — Mobile / a11y / perf — 2026-07-15 — status: PASSED (automatable rows green; viewport/FPS matrix = human-measured)
- **Route:** implementation-engineer (Sonnet-5-class) a11y wiring + test-data-engineer stability tests, inline.
- **Delivered:** a11y — the Inc-4 scene animations now honor `reducedMotion` (TownScene NPC bob skipped; DungeonScene brazier shows a static frame; secret-glow pulse skipped) matching BossScene's established pattern. Stability — `test/stability.spec.ts` (+3).
- **Validation:** `npm test` → 281 passing / 31 files; build exit 0; touched scenes transform-smoke green.
- **Gate:** prod build passes — **PASS**. repeated scene/save cycles stable — **PASS (tested)**: adventure log capped ≤60; heavy quest spam never overflows the chain/side-quest targets; 100 serialize→hydrate→default cycles lossless + idempotent, serialized size <4 KB (no growth). reduced-motion a11y honored across new scenes — **PASS**. viewport matrix + FPS = human-measured (recommended pre-release; can't run headless).
- **Rollback:** a11y guards are additive `if (!reduced)`; no behaviour change when reduced motion is off.

## Phase 18 — S-grade audit — 2026-07-15 — status: PASSED (honest audit; no false S-grade claim)
- **Route:** qa-release (Fable-5-class independent audit), inline.
- **Delivered:** `docs/execution/S_GRADE_AUDIT.md` — a per-phase gate matrix (00–24) + honest verdict + issues classified into Class A (human-at-browser), Class B (live infra), Class C (dormant flag-flips), with **no Class-D correctness-unknowns**.
- **Verdict:** engineering-complete + gate-audited; **NOT declared release-S-grade** because end-to-end human/live verification is outstanding. Every automatable acceptance-gate row (00–18) passes with test evidence (281 tests, build exit 0, server `node --check` OK, clean asset-path).
- **Gate:** every mandatory gate passes (automatable rows ✓; live/human rows classified, not claimed) ✓ · unresolved issues classified accurately (A/B/C) ✓ · **no false S-grade claim** ✓ (the audit explicitly declines to claim release-S-grade).
