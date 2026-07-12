# RPG-O-NET P.6 — Claude Code Full Autonomous Transformation Orchestrator
## Master Prompt สำหรับให้ Claude Code ตรวจ แก้ พัฒนา ทดสอบ Commit และ Push ตามทุก Phase

> ใช้กับ Repository: `Ernestyy52/RPG-O-NET-P.6`  
> เป้าหมาย: ยกเครื่องโปรเจกต์เป็น Fantasy 16-bit Educational Online RPG ที่นักเรียนเล่นและเรียนรู้ O-NET ได้ทุกวัน พร้อมวางรากฐานไปสู่ MMORPG เต็มรูปแบบ  
> เอกสารหลักที่ต้องอ่านร่วมกัน: `RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md`

---

# วิธีใช้

1. วางไฟล์นี้และ `RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md` ไว้ที่ Root ของ Repository
2. เปิด PowerShell ที่ Root
3. เปิด Claude Code ด้วยโมเดลที่ดีที่สุดที่บัญชีรองรับ
4. คัดลอก Prompt ในหัวข้อ **MASTER AUTONOMOUS EXECUTION PROMPT** ไปวาง
5. ปล่อยให้ Claude ทำงานทีละ Phase
6. หาก Context ใกล้เต็ม Claude ต้องสร้าง Handoff และให้ใช้ **RESUME PROMPT** ใน Session ใหม่

> ไม่ควรรันการยกเครื่องทั้งหมดใน Commit เดียว  
> Prompt นี้บังคับให้แบ่ง Phase, Commit, Validation และ Rollback

---

# MASTER AUTONOMOUS EXECUTION PROMPT

```text
You are the autonomous transformation lead for the RPG-O-NET P.6 repository.

Your mission is to execute the complete approved transformation roadmap, phase by phase, until the repository has:

- a stable and testable game foundation
- a daily-playable 16-bit fantasy educational RPG loop
- measurable Grade 6 English O-NET learning
- real-time action-lite combat
- adaptive mastery and spaced review
- four distinct class kits
- Daily Expeditions
- meaningful quests, loot, Sigils, crafting, and progression
- a complete World 1 vertical slice
- safe 2-4 player co-op
- teacher reporting
- mobile/accessibility support
- production hardening
- an MMORPG-ready backend and live-service foundation

READ FIRST

Read all of these before making decisions:

- CLAUDE.md
- .claude/CLAUDE.md if present
- every file under .claude/agents/
- .claude/settings.json
- RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md
- package.json
- nuxt.config.*
- app/
- server/
- data/
- knowledge/
- docs/
- ASSET_MASTER_INDEX.md
- ASSET_QUALITY_REPORT.md
- S_GRADE_VISUAL_REVIEW.md
- MAP_ASSET_USAGE.md
- MONSTER_BOSS_PLACEMENT.md
- MISSING_OR_WEAK_ASSETS.md
- current Git status, branches, remotes, and recent commits

PRIMARY PRODUCT GOAL

Create an original 16-bit fantasy online RPG where:

- students want to return because exploration, combat, classes, loot, bosses, quests, party play, and world discovery are genuinely fun
- every daily session improves measurable O-NET English mastery
- learning appears naturally in combat, dialogue, signs, maps, puzzles, crafting, quests, and Knowledge Break events
- incorrect answers produce useful feedback and later review
- missed days do not punish the student
- the game remains usable offline where practical
- online systems move toward server authority
- no copyrighted names, characters, maps, interfaces, story scenes, or identities are copied from existing games
- no permanent death, paid loot box, gambling mechanic, punitive streak, or pay-to-win system is introduced

AUTONOMY RULE

Do not ask the user to approve every normal implementation step.

Proceed automatically when:
- the work is within the approved phase
- the working tree and migration path are safe
- tests and rollback are available

Stop and report a BLOCKER only when:
- credentials or secrets are required and unavailable
- a destructive operation cannot be backed up safely
- legal/licensing information is missing for a required asset
- educational content correctness cannot be verified
- a migration risks irreversible player data loss
- the repository cannot build and the root cause cannot be isolated
- two robust repair attempts fail
- required external infrastructure cannot be provisioned without owner decisions or payment

Do not use uncertainty as an excuse to stop.
Make the safest grounded decision and document assumptions.

SUPPORTED MODEL ROUTING

Do not assume example model names are supported.

1. Detect the installed Claude Code version, provider, available models, effort levels, subagent fields, worktree support, and permissions.
2. Use the strongest available reasoning model for:
   - architecture
   - save migration
   - combat rules
   - learning correctness
   - multiplayer authority
   - security
   - release audit
3. Use a strong implementation model for:
   - scoped coding
   - UI
   - tests
   - data wiring
   - asset integration
4. Use a lightweight model only for:
   - exact renames
   - trivial documentation
   - formatting
5. Prefer project subagents.
6. If a configured model is unavailable, map it to the strongest supported equivalent and document the fallback.
7. Do not repeatedly switch the main session model when delegation can isolate the work.

REQUIRED SUBAGENTS

Verify these project agents exist and contain valid frontmatter:

- game-architect
- learning-architect
- combat-engineer
- save-migration-engineer
- multiplayer-engineer
- economy-engineer
- implementation-engineer
- world-art-engineer
- test-data-engineer
- routine-worker
- qa-release

If any are missing:
- create or repair them before Phase 00
- do not modify gameplay while repairing the router
- validate frontmatter and discovery
- record the installed model and effort mapping

GIT SAFETY PREFLIGHT

Before Phase 00:

1. Inspect:
   - git status
   - current branch
   - origin URL
   - commits ahead/behind origin
   - untracked files
   - unresolved merge/cherry-pick/rebase state

2. Preserve user work:
   - never discard unknown changes
   - create a timestamped backup branch or patch before normalization
   - copy local-only backup folders outside the repository
   - do not commit credentials, local backups, node_modules, build output, or secrets

3. Synchronize safely:
   - fetch origin
   - preserve local-only commits on a backup branch
   - make main match the intended remote state only after backup
   - create the long-lived integration branch:
     foundation/sgrade-full-transformation

4. Do not force-push main.
5. Do not merge automatically into main.
6. Push the integration branch after each validated phase when authentication is available.
7. If push is unavailable, continue locally and record the exact push command.

EXECUTION STATE

Create:

- docs/execution/EXECUTION_STATE.md
- docs/execution/PHASE_LOG.md
- docs/execution/DECISION_LOG.md
- docs/execution/KNOWN_BLOCKERS.md
- docs/execution/RESUME_CONTEXT.md

EXECUTION_STATE.md must contain:

- current phase
- phase status: not-started / in-progress / passed / failed / blocked
- current branch
- last validated commit
- agents/models/effort used
- commands run
- tests/build status
- files changed
- migrations performed
- unresolved risks
- rollback point
- exact next action

Update these files after every meaningful task and before context compaction or session end.

BRANCH AND COMMIT STRATEGY

Use one integration branch:

foundation/sgrade-full-transformation

Create a phase checkpoint commit after every passed phase.

Recommended commit messages:

- docs: establish transformation baseline
- docs: complete architecture audit
- chore: establish Claude project constitution
- test: add diagnostic and test foundation
- refactor: split state and version saves
- feat: add O-NET curriculum and question validation
- feat: add mastery and daily learning planner
- refactor: extract combat domain
- refactor: add new zone runtime
- feat: add real-time combat vertical slice
- feat: integrate Knowledge Break
- feat: add adaptive Daily Expeditions
- feat: complete four base class kits
- feat: add progression loot crafting and Sigils
- feat: complete World 1 vertical slice
- feat: add safe co-op and server authority
- feat: add teacher mode and learning reports
- fix: harden mobile accessibility and reliability
- release: complete S-grade release audit
- feat: add MMORPG persistence and account foundation
- feat: add authoritative world and zone services
- feat: add social guild chat and moderation foundation
- feat: add safe trading and live economy foundation
- feat: add live-ops content and observability tools
- release: complete MMORPG readiness audit

Do not squash phase history on the integration branch.

VALIDATION AFTER EVERY PHASE

After each phase:

1. Review Git diff.
2. Confirm no unrelated files changed.
3. Run relevant unit/integration tests.
4. Run production build.
5. Run phase-specific manual smoke flow.
6. Check browser/server console output when applicable.
7. Check save compatibility.
8. Check lifecycle cleanup.
9. Check mobile impact when UI/gameplay changed.
10. Invoke qa-release or an independent reviewer.
11. Fix phase-caused blocker/critical issues.
12. Update docs.
13. Commit.
14. Push integration branch when possible.
15. Continue automatically to the next phase.

If a pre-existing failure remains:
- document it
- separate it from regressions
- do not falsely claim it was caused by the phase

PHASE 00 — BASELINE AND REPOSITORY NORMALIZATION

Use:
- game-architect
- test-data-engineer
- qa-release

Do:
- repair missing subagent/router files
- normalize Git safely
- identify install/dev/build/generate/preview/server/test commands
- record current architecture, routes, scenes, events, stores, saves, assets, multiplayer, offline fallback, deployment
- record existing warnings and failures
- create diagnostic inventory
- do not redesign gameplay

Required outputs:
- docs/foundation/BASELINE.md
- docs/foundation/CURRENT_RUNTIME_FLOW.md
- docs/foundation/KNOWN_EXISTING_ISSUES.md
- docs/foundation/ROLLBACK_GUIDE.md
- docs/foundation/ENVIRONMENT_REQUIREMENTS.md

Gate:
- reproducible baseline
- clean phase diff
- build/test state documented
- safe rollback exists

PHASE 01 — DEEP ARCHITECTURE AND GAME DESIGN AUDIT

Use:
- game-architect
- learning-architect
- combat-engineer
- save-migration-engineer
- multiplayer-engineer
- economy-engineer
- world-art-engineer
- qa-release

Audit only before implementation.

Create:
- docs/foundation/KEEP_REFACTOR_REPLACE_MATRIX.md
- docs/foundation/DOMAIN_BOUNDARIES.md
- docs/foundation/DEPENDENCY_MAP.md
- docs/foundation/NEW_RUNTIME_ARCHITECTURE.md
- docs/foundation/MIGRATION_SEQUENCE.md
- docs/foundation/ACCEPTANCE_GATES.md
- docs/foundation/MMORPG_TARGET_ARCHITECTURE.md
- docs/foundation/ADR/

Required decisions:
- systems to preserve
- systems to adapt
- systems to deprecate
- state ownership
- Vue/Phaser boundary
- client/server authority
- save migration
- real-time combat path
- learning integration
- World 1 scope
- daily loop
- co-op scope
- MMORPG scaling path

Gate:
- architecture approved by independent review
- first implementation slices are dependency ordered
- no gameplay code changed

PHASE 02 — PROJECT CONSTITUTION AND AUTOMATIC ROUTING

Use:
- game-architect
- routine-worker
- qa-release

Create/update:
- root CLAUDE.md
- .claude/settings.json
- .claude/agents/*.md
- docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md

Requirements:
- routing rules
- ownership boundaries
- no full rewrite
- save protection
- reviewed learning content only
- asset style rules
- mobile/accessibility
- validation and completion report format
- supported model fallback mapping

Gate:
- valid agent files
- supported settings only
- no app/server/gameplay changes

PHASE 03 — TEST, DIAGNOSTIC, AND OBSERVABILITY FOUNDATION

Use:
- test-data-engineer
- implementation-engineer
- qa-release

Add the smallest compatible test foundation.

Cover pure logic:
- stats
- damage seam
- skill prerequisites
- quest transitions
- rewards
- questions
- daily generation
- saves
- item transactions

Create development-only diagnostics:
- select zone/floor
- select class
- grant equipment
- spawn enemy
- trigger Knowledge Break
- trigger boss phase
- display FPS/entities/listeners
- reset without affecting normal save

Create:
- docs/testing/TEST_STRATEGY.md
- docs/testing/MANUAL_SMOKE_MATRIX.md
- docs/testing/DIAGNOSTIC_MODE.md

Gate:
- deterministic tests
- production debug disabled by default
- build passes

PHASE 04 — STATE SEPARATION AND VERSIONED SAVES

Use:
- save-migration-engineer
- implementation-engineer
- test-data-engineer
- qa-release

Target state domains:
- profile
- character
- learning
- session
- inventory/economy
- quest
- UI/settings

Add:
- SaveEnvelope
- migration registry
- legacy adapter
- backup
- corruption recovery
- idempotent migration
- feature flag

Do not remove the legacy player store until compatibility passes.

Gate:
- existing saves migrate
- repeated migration safe
- corrupted/partial save recovery
- rollback documented

PHASE 05 — O-NET CURRICULUM AND CONTENT VALIDATION

Use:
- learning-architect
- test-data-engineer
- implementation-engineer
- qa-release

Create:
- O-NET domain/skill/subskill taxonomy
- prerequisites
- misconceptions
- typed question schema
- draft/reviewed/retired status
- source provenance
- current question adapter
- validation pipeline
- answer-position and duplicate analysis
- teacher review queue

Hard rule:
Only reviewed content is selectable in production.

Gate:
- current content preserved
- invalid content rejected
- tests and report pass

PHASE 06 — MASTERY, SPACED REVIEW, AND DAILY LEARNING PLANNER

Use:
- learning-architect
- implementation-engineer
- test-data-engineer
- qa-release

Implement:
- subskill mastery
- misconception tracking
- response-time summary
- stability
- next review
- QuestionSelector
- MasteryUpdater
- ReviewScheduler
- DailyLearningPlanGenerator
- LearningSessionSummary
- 10/20/30 minute modes
- Adventure/Learning Focus modes
- catch-up and rested learning
- no punitive streak

Gate:
- deterministic seeded tests
- weak skills recur appropriately
- learning state separate from combat power

PHASE 07 — EXTRACT COMBAT DOMAIN

Use:
- combat-engineer
- game-architect
- test-data-engineer
- qa-release

Extract from Vue/scene code:
- CombatActor
- RuntimeStats
- DamageRequest/Result
- SkillDefinition/Execution
- Cooldown
- Resource
- StatusEffect
- CombatEvent
- EncounterResult
- RewardRequest

Keep legacy BattleModal functional through an adapter.

Gate:
- no duplicated formula
- equivalent legacy test cases
- rules no longer owned by UI
- rollback feature flag

PHASE 08 — NEW PHASER ZONE RUNTIME

Use:
- game-architect
- combat-engineer
- world-art-engineer
- implementation-engineer
- qa-release

Create behind a feature flag:
- ZoneLoader
- PlayerController
- CollisionSystem
- SpawnSystem
- EnemyController
- InteractionSystem
- CameraSystem
- AtmosphereSystem
- AudioSystem
- NetworkAdapter
- TypedGameBridge

Build one test zone only.

Gate:
- TowerScene legacy remains
- new runtime enters/exits repeatedly without listener/timer leak
- no full world rebuild yet

PHASE 09 — REAL-TIME ACTION-LITE COMBAT

Use:
- combat-engineer
- implementation-engineer
- world-art-engineer
- qa-release

Implement:
- movement during combat
- basic attack
- targeting
- four skill slots
- initial class proof
- dodge/guard
- cooldown/resource
- telegraph
- hurt/stagger/death
- rewards
- touch-ready input
- win/lose/reset

Gate:
- no frame-rate-dependent damage
- no duplicate rewards
- no invalid attacks
- reset safe
- legacy rollback available

PHASE 10 — KNOWLEDGE BREAK

Use:
- learning-architect
- combat-engineer
- implementation-engineer
- qa-release

Implement:
- elite interrupt
- armor break
- boss phase event
- rune door
- treasure challenge
- mastery selection
- correct/incorrect/timeout
- concise explanation
- distractor feedback
- future retry scheduling
- accessibility time settings
- Adventure/Learning frequencies
- no-question fallback

Gate:
- not triggered on every hit
- one wrong answer does not cause instant death
- learning state updates correctly
- scene changes do not duplicate or lock events

PHASE 11 — ADAPTIVE DAILY EXPEDITIONS

Use:
- learning-architect
- implementation-engineer
- economy-engineer
- qa-release

Replace shallow counters through an adapter.

Activity types:
- combat
- exploration
- reading
- conversation
- grammar rune
- vocabulary
- directions
- crafting
- rescue/defense
- reflection

Implement:
- 10/20/30 minute sessions
- 5-of-7 rhythm
- rested bonus
- catch-up
- anti-repeat
- story wrapper
- end-session learning review

Gate:
- daily plans vary meaningfully
- missed days do not punish
- objectives are completable and deterministic
- no filler that only changes target numbers

PHASE 12 — FOUR DISTINCT CLASS KITS

Use:
- combat-engineer
- learning-architect
- implementation-engineer
- world-art-engineer
- qa-release

Classes:
- Warrior
- Mage
- Archer
- Guardian

Each must have:
- unique basic attack
- four active skills
- defense/mobility
- resource/rhythm
- solo viability
- party role
- Knowledge interaction
- child-friendly tooltips
- animation hooks
- data-driven tuning

Refactor the skill tree toward behavior changes and limited flat stats.

Gate:
- class identity is obvious
- no mandatory best path
- no useless solo class
- save migration passes

PHASE 13 — PROGRESSION, LOOT, CRAFTING, AND SIGILS

Use:
- economy-engineer
- save-migration-engineer
- implementation-engineer
- test-data-engineer
- qa-release

Separate:
- character level
- job level
- learning mastery
- world reputation

Add/refine:
- generated gear
- named gear
- affixes
- sockets
- Monster Sigils
- duplicate conversion
- pity/collection progress
- salvage/crafting alternatives
- secure transactions

World 1 target:
- 12 named items
- 8 Sigils
- boss material
- visible source hints

Gate:
- seeded economy simulation
- no negative currency
- no duplicate claims
- no extreme grind
- no paid loot box

PHASE 14 — COMPLETE WORLD 1 VERTICAL SLICE

Use:
- game-architect
- world-art-engineer
- implementation-engineer
- combat-engineer
- learning-architect
- economy-engineer
- qa-release

Create only World 1:
- complete town
- two fields
- mini dungeon
- main dungeon
- 6-8 monsters
- 2 elites
- one 3-phase boss
- landmarks
- secrets
- NPCs
- environmental English
- 10-15 main quest steps
- at least 8 varied side quests
- language puzzles
- named gear and Sigils
- daily expedition integration
- audio and ambience

Art:
- use approved asset index
- preserve 32x32 grid
- pixel-perfect rendering
- real tiles/buildings
- shadows
- Y-sort
- layered composition
- no tint-only biome
- zone-based asset loading

Gate:
- new player can start and defeat World 1 boss
- no soft lock
- mobile flow works
- learning summary produced
- boss has readable phases
- no placeholder-quality critical areas

PHASE 15 — SAFE CO-OP AND SERVER AUTHORITY

Use:
- multiplayer-engineer
- combat-engineer
- save-migration-engineer
- learning-architect
- qa-release

Implement 2-4 player co-op:
- party
- ready check
- shared encounter
- boss synchronization
- revive
- contribution-aware reward
- reconnect
- cleanup
- server validation for critical combat/results/rewards
- protocol versioning
- offline deterministic path

Learning co-op:
- rotating ownership
- individual accountability
- related subquestions
- support actions
- prevent one student answering everything

Gate:
- reconnect safe
- boss synchronized
- no reward duplication
- client cannot claim victory alone
- offline still works

PHASE 16 — TEACHER MODE AND LEARNING REPORTS

Use:
- learning-architect
- implementation-engineer
- save-migration-engineer
- qa-release

Implement:
- class/session setup
- anonymous or teacher-assigned code
- O-NET focus
- session duration choice
- Adventure/Learning mode
- mastery movement
- misconceptions
- review recommendations
- CSV/JSON export
- optional Sheets export only as a report destination
- permission and retention boundaries

Gate:
- no active answer key exposure
- learning/game/personal data separated
- export tested
- teacher flow understandable

PHASE 17 — MOBILE, ACCESSIBILITY, PERFORMANCE, AND RELIABILITY

Use:
- implementation-engineer
- world-art-engineer
- test-data-engineer
- save-migration-engineer
- multiplayer-engineer
- qa-release

Audit/fix:
- every primary button
- keyboard/mouse/touch
- safe areas
- touch targets
- clipped text
- pause/resume
- save/load
- offline/reconnect
- reduced motion/flash
- screen shake
- color-safe indicators
- reading time
- audio controls
- onboarding
- asset loading
- duplicate textures
- listeners/timers
- scene lifecycle
- malformed save recovery
- production debug leakage

Gate:
- viewport matrix passes
- repeated scene/save cycles stable
- production build passes
- measured performance documented

PHASE 18 — INDEPENDENT S-GRADE RELEASE AUDIT

Use:
- qa-release as primary
- all domain agents as reviewers

Do not add major features.

Audit:
- Fun
- Learning
- World
- Progression
- Visual/audio
- Reliability
- Safety/teacher usability

Run:
- full tests
- production build
- new/returning player
- all classes
- solo/co-op boss
- correct/incorrect/timeout
- mobile
- offline
- reconnect
- reward attack attempts
- asset scan
- console scan
- save migration
- lifecycle benchmark

Fix only blocker and critical issues caused by current scope.

Create:
- docs/release/S_GRADE_RELEASE_AUDIT.md
- docs/release/KNOWN_ISSUES.md
- docs/release/RELEASE_CHECKLIST.md

Gate:
- every mandatory gate passes
- unresolved issues accurately classified
- do not falsely label S-grade

MMORPG EXPANSION PHASES

Begin only after World 1 and S-grade foundation are stable.

PHASE 19 — ACCOUNT, DATABASE, AND PERSISTENCE FOUNDATION

Use:
- game-architect
- save-migration-engineer
- multiplayer-engineer
- qa-release

Design and implement an environment-appropriate foundation for:
- account/session identity
- character persistence
- inventory/economy persistence
- learning profile persistence
- quest/world progression
- migrations
- backups
- data ownership
- local/offline sync strategy

Do not hardcode secrets.
Use environment templates.
If a provider cannot be provisioned without user credentials:
- implement interfaces, local development adapters, schemas, migrations, tests, and setup docs
- mark provider provisioning as the only external blocker

Gate:
- persistence interfaces tested
- safe local development path
- no client-authoritative inventory
- backup/migration policy

PHASE 20 — AUTHORITATIVE WORLD, ZONE, AND INSTANCE SERVICES

Use:
- multiplayer-engineer
- game-architect
- combat-engineer
- qa-release

Create scalable service boundaries for:
- gateway/session
- world directory
- town zones
- field zones
- dungeon instances
- party instances
- presence
- authoritative movement constraints
- authoritative monster/combat state
- instance lifecycle
- horizontal scaling hooks

Do not claim massive scale without load evidence.

Gate:
- deterministic instance lifecycle
- reconnect routing
- no orphaned encounter
- protocol versioning
- load-test harness

PHASE 21 — SOCIAL, GUILD, CHAT, AND MODERATION FOUNDATION

Use:
- multiplayer-engineer
- implementation-engineer
- learning-architect
- qa-release

Implement safe foundations for:
- friends
- party finder
- guild
- guild roles
- chat channels
- emotes
- block/report
- profanity/safety hooks
- child-appropriate defaults
- teacher/classroom communication restrictions

Gate:
- permission checks
- rate limiting
- report/block flow
- privacy and moderation docs

PHASE 22 — SAFE TRADE AND LIVE ECONOMY

Use:
- economy-engineer
- multiplayer-engineer
- save-migration-engineer
- qa-release

Implement only after transactions are server authoritative:
- secure trade
- optional auction/market foundation
- item bind rules
- price history hooks
- taxes/sinks
- fraud/duplication detection
- audit log
- rollback/reconciliation

Do not introduce real-money trading or gambling.

Gate:
- atomic transactions
- replay protection
- reconciliation tests
- economy simulation

PHASE 23 — CONTENT AUTHORING, LIVE OPS, AND OBSERVABILITY

Use:
- game-architect
- learning-architect
- world-art-engineer
- implementation-engineer
- test-data-engineer
- qa-release

Create:
- data-driven zone templates
- monster/boss/quest/loot/Sigil templates
- learning-content review pipeline
- event scheduler
- feature flags
- configuration versioning
- analytics with minimal personal data
- health metrics
- error reporting hooks
- admin-safe content validation
- World 2 proof zone

Gate:
- content validation
- no unreviewed questions
- rollbackable config
- observability docs
- World 2 demonstrates reuse, not copy/tint

PHASE 24 — MMORPG READINESS AUDIT

Use:
- qa-release
- game-architect
- multiplayer-engineer
- save-migration-engineer
- economy-engineer
- learning-architect

Audit:
- service architecture
- persistence
- authority
- scaling
- load
- reconnect
- security
- moderation
- economy
- migrations
- observability
- live content
- educational integrity
- cost assumptions
- disaster recovery

Create:
- docs/mmorpg/MMORPG_READINESS_AUDIT.md
- docs/mmorpg/LOAD_TEST_REPORT.md
- docs/mmorpg/SECURITY_AND_ABUSE_MODEL.md
- docs/mmorpg/OPERATIONS_RUNBOOK.md
- docs/mmorpg/NEXT_CONTENT_ROADMAP.md

Do not claim full MMORPG readiness without measured evidence.

CONTEXT AND SESSION HANDOFF

Monitor context usage.

Before context becomes unsafe:

1. Finish or safely checkpoint the current atomic task.
2. Run applicable tests.
3. Commit only if the phase checkpoint is valid; otherwise create a WIP checkpoint on the integration branch with an explicit message.
4. Update:
   - EXECUTION_STATE.md
   - PHASE_LOG.md
   - DECISION_LOG.md
   - KNOWN_BLOCKERS.md
   - RESUME_CONTEXT.md
5. RESUME_CONTEXT.md must contain:
   - exact phase and task
   - completed work
   - current Git commit
   - changed files
   - commands/results
   - failing tests
   - assumptions
   - next exact action
   - agents needed
6. Stop with the exact RESUME PROMPT below.

Do not lose state by continuing after context quality is degraded.

FINAL COMPLETION REPORT

After Phase 24 or the highest achievable phase:

Create:
- docs/execution/FINAL_TRANSFORMATION_REPORT.md
- docs/execution/FINAL_FILE_MAP.md
- docs/execution/FINAL_TEST_MATRIX.md
- docs/execution/FINAL_ROLLBACK_POINTS.md
- docs/execution/REMAINING_EXTERNAL_BLOCKERS.md

Report:
- phases passed
- phases blocked
- current branch and commits
- agents/models/effort used
- architecture changes
- game systems delivered
- learning systems delivered
- MMORPG systems delivered
- tests and builds
- performance measurements
- save and migration status
- security and authority status
- known issues
- external credentials/infrastructure still required
- exact next roadmap

Start now with preflight and Phase 00.
Continue automatically through the phases.
```

---

# RESUME PROMPT

ใช้ Prompt นี้เมื่อ Claude Code หยุดเพราะ Context ใกล้เต็ม เปิด Session ใหม่ที่ Root ของ Repository แล้วส่ง:

```text
Resume the RPG-O-NET autonomous transformation.

Read:
- CLAUDE.md
- RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md
- RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md
- docs/execution/EXECUTION_STATE.md
- docs/execution/PHASE_LOG.md
- docs/execution/DECISION_LOG.md
- docs/execution/KNOWN_BLOCKERS.md
- docs/execution/RESUME_CONTEXT.md
- current Git status and recent commits

Verify the repository state matches RESUME_CONTEXT.md.

Do not repeat completed work.
Do not begin a later phase if the current phase gate has not passed.
Continue from the exact next action.
Follow automatic agent/model routing.
Validate, commit, push the integration branch when possible, update execution documents, and continue automatically through the remaining phases.
```

---

# RECOVERY PROMPT เมื่อ Git หรือ Phase ผิดปกติ

```text
Act as the recovery lead.

Do not discard any user work.

Read:
- Git status
- reflog
- branches
- remotes
- pending merge/rebase/cherry-pick state
- docs/execution/EXECUTION_STATE.md
- docs/execution/RESUME_CONTEXT.md

Create a timestamped backup branch and patch before any normalization.

Recover the integration branch to the last validated phase commit.
Preserve any useful uncommitted work in a separate WIP branch.
Do not force-push main.
Do not delete saves, assets, or user-authored content.

After recovery:
- run phase validation
- update execution documents
- report the root cause, recovered commits, remaining risks, and exact next action
```

---

# ข้อควรทราบ

- Prompt นี้ให้ Claude ดำเนินงานอัตโนมัติ แต่ Claude Code ไม่สามารถสร้างบัญชี Cloud, ชำระเงิน, หรือกรอก Secrets ที่ไม่มีอยู่ได้
- งาน MMORPG จริงต้องมีการทดสอบ Load, Security, Moderation, Persistence และต้นทุน Server
- ห้าม Merge เข้า `main` อัตโนมัติ ควร Review integration branch ก่อน
- ควรสำรอง Repository และ Save จริงก่อนเริ่ม
- World 1 และ Learning Foundation ต้องผ่านก่อนขยาย World จำนวนมาก
