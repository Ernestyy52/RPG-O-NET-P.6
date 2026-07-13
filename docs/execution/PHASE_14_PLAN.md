# PHASE 14 PLAN — World 1 Vertical Slice (game-architect, committed plan)

> Authored by **game-architect** (Fable 5, plan mode) at branch `foundation/sgrade-full-transformation`
> @ `c7ab53c`. Baseline verified: `npm run build` exit 0, `npm test` 177/177 (17 files).
> Inputs: `WORLD_01_ASSET_READINESS_AUDIT.md` (+ manifest, gaps doc; decision
> `PROCEED_WITH_NONCRITICAL_ASSET_BACKLOG`), roadmap L734–782, `MIGRATION_SEQUENCE.md` row 15,
> `CLAUDE.md` constitution. This document is the Increment-1 deliverable and the contract the
> remaining increments are reviewed against.

## 0. Scope & definitions

- **World 1** = floors 1–10, forest biome, theme "Verdant Slimes" (`monsterThemes.ts`), boss = Myco
  Colossus (`world01`). Floors 11+ remain the untouched legacy tower.
- **Live legacy path today:** `index.vue` → `GameCanvas` → `TownScene`/`TowerScene`/`BossScene` →
  turn-based `BattleModal.vue`; legacy Pinia `player` store authoritative (localStorage `player`).
- **Dormant, tested domains (7 flags, all `false`):** `COMBAT_DOMAIN_ENABLED`,
  `REALTIME_COMBAT_ENABLED` (`app/data/combat/index.ts`), `NEW_ZONE_RUNTIME_ENABLED`
  (`app/game/runtime/index.ts`), `CLASS_KITS_ENABLED` (`app/data/combat/classKits.ts`),
  `KNOWLEDGE_BREAK_ENABLED` (`app/data/learning/knowledgeBreak.ts`),
  `ADAPTIVE_EXPEDITIONS_ENABLED` (`app/data/learning/expedition.ts`), `SIGILS_ENABLED`
  (`app/data/economy/sigils.ts`).
- **Explicit non-goal:** `SAVE_ENVELOPE_ENABLED` (`app/utils/save/saveManager.ts`) **stays `false`**
  through all of Phase 14. The envelope cutover is a separate slice with its own gate; mixing it into
  the first big integration phase multiplies rollback ambiguity. Legacy `player` blob stays
  authoritative; envelope schema is kept in sync via a registered migration (see §5).

---

## 1. Increment breakdown

Five increments, strictly ordered. **Exit criteria for every increment:** `npm run build` exit 0,
`npm test` all green (count only grows), in-browser dev-server smoke of the touched flow, docs
(`EXECUTION_STATE.md`, `DECISION_LOG.md`) updated, **one checkpoint commit** by the main session.
Each increment is independently revertible (its commit reverts cleanly; flags return to `false`).

### Inc 1 — Architecture plan (this document)
| | |
|---|---|
| Owner | game-architect (Fable 5) |
| Tasks | This file; decision log entry for the flag order + envelope deferral |
| Exit | Plan committed; main session sign-off |

### Inc 2 — Standalone `DungeonScene.ts` (engineering prerequisite #1)
| | |
|---|---|
| Owners | world-art-engineer (tiles/slicing/composition, Sonnet 5) + implementation-engineer (scene/runtime wiring, Sonnet 5) |
| Tasks | 1. `app/game/scenes/DungeonScene.ts` — new standalone Phaser scene (see §2), first rendered consumer of `ZoneRuntime`. 2. `app/game/runtime/dungeonLayouts.ts` — two data-only layout configs: `world01-mini` (floor-5 sub-boss chamber) and `world01-main` (floor-10 pre-boss approach). 3. Slice `public/tiny-dungeon/tilemap_packed.png` (16px grid, 12×11) + `public/dungeon-assets/walls_floor.png` (16px grid, 13×23 — **verify slicing visually before use**) as zone-scoped spritesheets via `assetPath()`. 4. Shadows (`shadow_blob` reuse), Y-sort (`setDepth(y)`), layered composition (floor → floor-decal → walls/props Y-sorted → atmosphere), 32×32 render grid (16px tiles @ scale 2, pixel-perfect). 5. Entry: dungeon door object added to TowerScene floors 5 and 10 behind the World-1 zone gate helper (only TowerScene touch, ~10 LOC, flag-guarded). 6. `staircase.png` as the dungeon-entry landmark (manifest reservation). 7. Load on scene-enter, unload textures on `shutdown` (SceneLifecycle backbone). |
| Exit | Both layouts walkable in dev server (enter → explore → exit back to floor); no texture leak across scene restarts (lifecycle check); TowerScene behavior on floors 11+ byte-identical; build+tests green; committed |

### Inc 3 — Flag flips into rendered scenes + boss 3-phase telegraph (engineering prerequisite #2)
| | |
|---|---|
| Owners | combat-engineer (boss phases/telegraph + engine flips, Opus 4.8), implementation-engineer (scene/UI wiring), learning-architect (Knowledge Break + expedition hooks, Opus 4.8) |
| Tasks | Flip the 7 flags in the order and with the per-zone gating defined in §3 — **one flag per commit**. Build the boss 3-phase state machine + telegraph per §4. Wire Knowledge Break into realtime fights (learning summary produced at fight end via `summarizeSession`), expeditions into the Guild UI with legacy daily-quest fallback intact. |
| Exit | Each flag commit independently: build+tests green + dev-server smoke of what it unlocked. After the last flip: full World-1 run (town → field → mini dungeon → field → main dungeon → boss) on the new path; floors 11+ still on legacy path; committed (7+ commits) |

### Inc 4 — World 1 content
| | |
|---|---|
| Owners | implementation-engineer (quests/NPCs/secrets wiring), learning-architect (language puzzles, environmental English, quest English review), economy-engineer (12 named gear + 8 Sigils + loot tables + sim, Opus 4.8), world-art-engineer (second field tileset, props, ambience), **save-migration-engineer for any persisted-shape change** (v5 envelope migration + additive legacy-store fields — ownership boundary, non-delegable) |
| Tasks | 1. Main quest chain: 10–15 steps (data-driven, `app/data/world1/quests.ts`), spanning town → both fields → mini dungeon → main dungeon → boss; every step completable offline; no step gates on RNG-only drops. 2. ≥8 varied side quests (NPC-given; kinds beyond kill-counters: fetch, escort-lite, puzzle, secret-find, vocab-hunt). 3. Language puzzles + environmental English (signs, NPC dialogue, item descriptions — sourced via `knowledge/` → `data/questions.json` pipeline only; **never hand-edit `app/data/questions.ts`**). 4. NPCs: guildmaster (`interior-props/guildmaster.png`, currently unwired), portal guardian, 3–5 quest NPCs from approved manifest art. 5. Secrets: ≥3 (hidden dungeon alcoves in layout configs, field clearing, town easter egg). 6. Economy: 12 named World-1 gear + 8 Sigils with **visible source hints**, loot via idempotent claim path (Phase 13 machinery), seeded economy sim re-run green. 7. Daily-expedition integration into the World-1 loop (objectives reference real World-1 content). 8. Second field tileset (Kenney `tiny-farm` / Craftpix FieldsTileset — kills the forbidden tint-only differentiation), elite tint+scale variants **plus nameplate/aura second tell**, SFX pull (Kenney CC0 oggs; answer-correct/answer-wrong cue first), ambience polish. |
| Exit | Full content playthrough possible; economy sim green (no negative currency, no dup claims, no extreme grind); question provenance validated; build+tests green; committed |

### Inc 5 — Independent verification (gate)
| | |
|---|---|
| Owner | qa-release (Fable 5, independent — did not implement) |
| Tasks | 1. Fresh-profile smoke playthrough: new player → character create → beat World-1 boss (record time; target a school-session-friendly ≤~90 min without grind walls). 2. Soft-lock hunt: death in each zone, quit/resume mid-dungeon, mid-Knowledge-Break, mid-boss-phase; boss requirement always re-earnable. 3. Save-compat: pre-Phase-14 `player` blob (captured at `c7ab53c`) loads with zero data loss; flags-off replay still works. 4. Asset-path validation: `nuxt generate` output grep for hardcoded root `/` asset refs; subpath smoke (GitHub Pages `/RPG-O-NET-P.6/` simulation). 5. Mobile flow: touch controls through the full slice, reduced-motion honored in telegraphs, perf spot-check (scene-enter load, dungeon FPS on a throttled profile). 6. Boss-phase readability check (§4 protocol). 7. Gate table (§6) signed line-by-line; docs updated. |
| Exit | Every gate row VERIFIED or the phase does not pass; report in constitution format; committed |

---

## 2. DungeonScene architecture

### Why a standalone scene (blast-radius argument)
`TowerScene` is the only load-bearing gameplay scene: it owns multiplayer join/seed
(`setupMultiplayer`, Colyseus monster sync), offline respawn timers, biome texture baking, boss-door
requirement flow, and battle-lock semantics. A `dungeon` mode-flag would thread new conditionals
through all of that — every dungeon bug becomes a potential floors-11+ regression, and rollback
means untangling a diff inside 450 live LOC. A standalone `DungeonScene` is **purely additive**: the
only legacy diff is the flag-guarded entry door. Rollback = don't route to it. This also matches the
audit reconciliation (finding #2) and the TownScene/BossScene precedent of purpose-specific scenes.

### Class shape
```
app/game/scenes/DungeonScene.ts
  class DungeonScene extends Phaser.Scene ('DungeonScene')
    init({ layoutId: DungeonLayoutId; floor: number; classId: HeroClassId })
    preload()  // zone-scoped ONLY: tiny-dungeon sheet, walls_floor sheet, floor monsters,
               // dungeon bgm — every URL through assetPath()
    create()   // build from DungeonLayoutConfig via ZoneRuntime (first rendered consumer,
               // NEW_ZONE_RUNTIME_ENABLED); movement/spawn/encounter from app/game/runtime
    update()   // resolveMovement + Y-sort, same contract as TowerScene
    shutdown → SceneLifecycle teardown: off() all gameEvents, destroy tweens/timers,
               remove zone-scoped textures (load/unload per roadmap L773)
```
- **No multiplayer in Inc 2.** DungeonScene is offline-deterministic; co-op joins in Phase 15. It
  therefore imports nothing from `systems/net.ts`.
- Reuses as-is: `heroKey/heroAnim/applyStandardHeroBody`, `addPlaque`, `addGearAura`,
  `createIdleBreath`, `applyAtmosphere` (dark preset), `preloadBgm/playBgm`, `gameEvents` battle
  contract (`battle:start`/`battle:end`) so either combat front-end (BattleModal or realtime) can sit
  behind it.
- **Touches TowerScene only at:** the flag-guarded dungeon-entry door on World-1 floors 5/10 (emit
  `dungeon:enter { layoutId }` → `scene.start('DungeonScene', …)`), plus scene registration in
  `GameCanvas.client.vue`'s scene list.

### Tile slicing
| Sheet | Grid | Use |
|---|---|---|
| `public/tiny-dungeon/tilemap_packed.png` (192×176) | 16px, 12 cols × 11 rows, frame index = row*12+col | floors, wall tops, props, doors |
| `public/dungeon-assets/walls_floor.png` (208×368) | 16px, 13 cols × 23 rows — **visually verify before authoring indices** (audit: "verify frame slicing") | wall-facing variants (N/S/E/W faces, corners) |

Loaded as `spritesheet` with `frameWidth/Height: 16`, rendered at 32×32 (scale 2, `pixelArt: true`
already set globally, no sub-pixel positions). Frame indices live **only** in the layout configs and
one `dungeonTiles.ts` constant map — no magic numbers in the scene.

### Rendering / composition
- **Layers:** (0) floor images, (0.5) floor decals (cracks, moss — Graphics-free, real tiles),
  (y-sorted) walls/props/monsters/player at `setDepth(y)` matching the shipped convention,
  (90+) atmosphere vignette/torch glow, (100) fixed plaques.
- **Shadows:** `shadow_blob` under player/monsters/large props, same offsets as TowerScene.
- **Y-sort:** identical `setDepth(y)` contract; wall *tops* get `depth = tileY*TILE` so the player
  walks behind them — this is the "layered composition" the Art rules require, impossible with the
  tint-bake pipeline.

### Layout-config data shape (`app/game/runtime/dungeonLayouts.ts`, pure data + tests)
```ts
type DungeonLayoutId = 'world01-mini' | 'world01-main'
interface DungeonLayoutConfig {
  id: DungeonLayoutId
  cols: number; rows: number                    // mini ~18×14, main ~28×22 (still one camera-bounded zone)
  floorGrid: number[][]                         // tiny-dungeon frame index per tile
  wallGrid: (number | null)[][]                 // walls_floor frame index or null (null = walkable)
  props: { x: number; y: number; frame: number; blocking: boolean; sheet: 'dungeon' | 'guildhall' }[]
  torches: TileXY[]                             // atmosphere glow anchors
  entry: TileXY; exit: TileXY                   // exit returns to the owning tower floor
  spawns: { slug: string; count: number; bounds: SpawnBounds }[]
  elite?: { slug: string; at: TileXY }          // world01-main: 2 elites (tint+scale+nameplate/aura)
  bossGate?: TileXY                             // world01-main only → BossScene handoff
  secrets: { at: TileXY; kind: 'alcove' | 'chest' | 'inscription'; id: string }[]
}
```
Collision derives from `wallGrid`/`props.blocking` — a pure `buildCollisionMap(config)` in the
runtime package gets unit tests (entry/exit reachable, boss gate reachable, secrets reachable ⇒
**no-soft-lock proven by test**, not just by playthrough).

---

## 3. Flag-flip strategy

### Principles
- **One flag per commit**, verified live before the next. Any regression: `git revert <that commit>`
  — every flip is a single-line `false→true` plus its wiring, kept revert-clean.
- **Per-zone gating:** new helper `isWorld1Floor(floor) => floor >= 1 && floor <= 10` (single source,
  `app/data/world.ts` or sibling). Realtime combat, Knowledge Break, and dungeon routing apply only
  where `isWorld1Floor(...)`; floors 11+ run the legacy TowerScene + BattleModal path **unchanged in
  both flag states**. This is the roadmap's "per-zone flags" rollback story.
- Legacy paths are **kept, not deleted** (constitution rule 6) until the Phase-14 gate passes — and
  the turn-based BattleModal remains permanently reachable as the floors-11+ path anyway.

### Order (dependency-driven)
| # | Flag | Unlocks in live path | Gated by zone? | Why this position | Rollback |
|---|---|---|---|---|---|
| 1 | `COMBAT_DOMAIN_ENABLED` | BattleModal turns computed by the domain engine (`setupEncounter`/`resolveHeroSkill`/`resolveMonsterAttack`) instead of inline | No (engine output must equal legacy everywhere — verified by existing parity tests + live smoke) | Foundation for everything combat-flavored; zero visual change = cleanest first flip | revert commit → inline math returns |
| 2 | `NEW_ZONE_RUNTIME_ENABLED` | DungeonScene (Inc 2) becomes reachable — ZoneRuntime drives its first rendered scene; TowerScene keeps consuming only the pure systems | Yes — dungeon doors exist only on World-1 floors | Scene shell must be live before realtime combat has a home | revert → doors vanish, dungeon unreachable, nothing else changes |
| 3 | `REALTIME_COMBAT_ENABLED` | Action-lite realtime loop inside DungeonScene (and World-1 field encounters if smoke is clean; otherwise dungeon-only for the gate) | Yes — `isWorld1Floor` + scene check; floors 11+ stay on BattleModal | Needs #1 (formulas) + #2 (a rendered host) | revert → World-1 encounters fall back to BattleModal via the retained `battle:start` path |
| 4 | `KNOWLEDGE_BREAK_ENABLED` | Knowledge Breaks interrupt realtime fights; answers feed mastery; session summary emitted at fight end | Yes (rides realtime scope) | Needs #3; carries the "learning summary produced" gate item | revert → realtime fights run break-free (built-in no-question fallback path) |
| 5 | `CLASS_KITS_ENABLED` | Four class kits drive skills/resources in engine combat (both BattleModal-engine and realtime) | No (kit data is per-class, all floors) | Needs #1; before economy so gear/Sigils balance against real kits | revert → generic legacy skill set returns; v3 loadout save data is additive and simply ignored |
| 6 | `SIGILS_ENABLED` | Sigil socketing UI + stat application through the engine; loot tables may drop Sigils | No (UI + engine mod) | Needs #1 + #5 for correct stat stacking; feeds Inc-4 economy content | revert → sockets hidden; v4 sigil inventory data preserved but inert (idempotent claims already tested) |
| 7 | `ADAPTIVE_EXPEDITIONS_ENABLED` | Guild UI serves adaptive expeditions; legacy `rollDailyQuests` retained as the explicit fallback (expedition `fallback:true` routes to it) | No (UI-level) | Independent of combat chain; last so expedition objectives can reference the live World-1 loop | revert → legacy daily quests, which never left |

`SAVE_ENVELOPE_ENABLED` is **not** flipped (see §0, §5).

---

## 4. Boss 3-phase design (Myco Colossus, floor 10)

### State (combat domain — combat-engineer)
New pure module `app/data/combat/bossPhases.ts` (exported via the combat barrel):
```ts
interface BossPhaseConfig { thresholds: [number, number] /* hpFraction, e.g. 0.70, 0.35 */,
  phases: [PhaseSpec, PhaseSpec, PhaseSpec] }
interface PhaseSpec { id: 1|2|3; attackIntervalMs: number; damageMod: number;
  pattern: 'single'|'double'|'aoe-slam'; telegraphMs: number; tint: number }
advanceBossPhase(state, hpFraction) -> { state, event?: 'boss-phase-change' }
```
- Transitions at HP ≤70% (phase 2) and ≤35% (phase 3); **monotonic** (never regresses on heals),
  idempotent per threshold, deterministic — pure-function unit tests assert all three plus
  mid-fight save/quit/resume re-derivation from HP (no soft lock, no double-trigger).
- Integrates with `realtime.ts` via the existing `CombatEvent` stream: new events
  `boss-phase-change` and `boss-telegraph` (the gaps doc's named binding point). Each phase raises
  tempo/pattern, and `telegraphMs` **grows** with danger (bigger hit = longer readable wind-up:
  ≥600/800/1000 ms) — pace rises, readability never falls.

### Telegraph (scene — no new sprite; Graphics/tween per arena-walls precedent)
On `boss-telegraph`: wind-up scale pulse + tint flash on the boss sprite in the phase color; for
`aoe-slam`, a Graphics danger circle strokes/fills on the arena floor for `telegraphMs` before
impact. On `boss-phase-change`: arena ring (`BossScene` Graphics) recolors to the phase tint, brief
camera punch, phase banner via `addPlaque` ("Phase 2 — Sporestorm"), and an HP-bar phase marker in
the battle UI. **Reduced-motion setting** (`settings.reducedMotion`) swaps flashes for static
color+text tells — accessibility rule 8.
Note: this requires the boss fight to run on the realtime path (flip #3) inside BossScene/DungeonScene;
the static-portrait BattleModal boss is the floors-11+ legacy fallback only.

### How "readable phases" is verified
1. **Unit:** threshold/monotonic/deterministic tests on `bossPhases.ts`; event-emission tests on the
   realtime integration; telegraph-duration ≥600 ms asserted in config tests.
2. **Smoke protocol (qa-release, Inc 5):** during the playthrough, at any moment the reviewer must be
   able to state the current phase using each of **three independent channels** (arena/boss color,
   banner/plaque text, attack pattern) — any single channel failing the "glance test" fails the gate.
   Checked on desktop + mobile + reduced-motion.

---

## 5. Preservation constraints (enforced in every increment)

| Constraint | Mechanism |
|---|---|
| **Saves (v4, no reset, idempotent)** | Legacy `player` blob stays authoritative (`SAVE_ENVELOPE_ENABLED=false` throughout). All new persisted state (main-quest progress, side-quest flags, secrets found, expedition state) is **additive with safe defaults** in the Pinia store — an old blob loads and every new field defaults sanely; no field is renamed/removed. In parallel, save-migration-engineer registers **envelope v4→v5** carrying the same shape (idempotent, tested, backup-before-write) so the future envelope cutover never diverges. Reward grants ride the Phase-13 idempotent claim path — no duplication, no negative currency (rule 3). Backup capture of a real pre-Phase-14 blob is an Inc-5 fixture. |
| **Offline determinism** | DungeonScene has no net dependency in Phase 14; realtime combat, boss phases, spawns, expeditions, and daily quests are all seeded/pure (existing Rng ports). Multiplayer remains legacy-TowerScene-only until Phase 15. |
| **Multiplayer authority boundary** | No new client-trusted writes: dungeon/boss rewards resolve through the same validated reward path; no changes to `systems/net.ts` protocol. Clients stay untrusted for online-critical flows (rule 9) — nothing in Phase 14 widens the online surface. |
| **Mobile performance** | 32×32 grid preserved; zone-scoped load/unload (dungeon sheets load on scene-enter, textures removed on shutdown); layouts are single camera-bounded zones (≤28×22 tiles); static 16px sheets, no per-frame Graphics redraw in update(); tweens capped per shipped patterns; touch input parity via existing `resolveMovement` contract; reduced-motion honored in all new VFX. Perf spot-check is an Inc-5 gate task. |
| **Rollback** | **Rollback point: commit `c7ab53c`** (tag it `backup/pre-phase-14` before Inc 2 lands); catastrophic fallback `backup/pre-transformation-20260712-162236`. Between those: every flag is a one-commit revert (§3), DungeonScene is additive, floors 11+ never leave the legacy path. No force-push, no squash of phase history. |
| **Content provenance** | All question-bearing content flows `knowledge/` → generator → `data/questions.json` with validation (rule 2). Learning state stays separate from combat power (rule 1): Knowledge Break effects are empower/combo only, never stat-permanent. |

---

## 6. Gate-criteria traceability

| Phase-14 gate item | Satisfied by | Verified how (Inc 5 unless noted) |
|---|---|---|
| New player can start and defeat World-1 boss | Inc 2 (scenes) + Inc 3 (combat/boss) + Inc 4 (content/progression curve) | Fresh-profile full playthrough on desktop + mobile; boss defeated without dev tools |
| No soft lock | Inc 2 (`buildCollisionMap` reachability **unit tests**), Inc 3 (phase re-derivation from HP; break `cancel()` on teardown), Inc 4 (no RNG-gated quest steps) | Unit tests (Inc 2/3) + adversarial smoke: die in each zone, quit/resume mid-dungeon / mid-break / mid-boss-phase, abandon quests and re-accept |
| Mobile flow works | Inc 2 (touch parity in DungeonScene), Inc 3 (touch targets in break/telegraph UI), Inc 4 (quest/expedition UI) | Full slice on a real/emulated mobile viewport, touch-only; perf spot-check |
| Learning summary produced | Inc 3 flip #4 (`summarizeSession` at fight end) + Inc 4 (summary surfaced in UI) | Play a fight with breaks → summary renders with real mastery deltas; persists across reload |
| Boss has readable phases | Inc 3 (§4 state machine + telegraph) | §4 protocol: 3-channel glance test, desktop + mobile + reduced-motion; unit tests on thresholds |
| No placeholder-quality critical areas | Inc 2 (real dungeon tiles replace nothing-existed), Inc 4 (second field tileset kills tint-only; town/props from approved manifest) | Visual sweep of town, both fields, both dungeons, arena against the Art rules (L764–773); zero Graphics-only *critical* surfaces (arena ring Graphics stays — constitution-accepted) |
| (Art rule) zone-based asset loading, `assetPath()` everywhere | Inc 2 | Lifecycle check (texture unload on shutdown) + `nuxt generate` grep for hardcoded root paths + subpath smoke |

---

## 7. Risk register

| # | Risk | L×I | Mitigation |
|---|---|---|---|
| 1 | **Flag interactions** — 7 flips composing for the first time; a pair works alone but not together (e.g., class-kit resources × Knowledge Break empower × Sigil stat mods stacking wrong) | M×H | Strict §3 order, one flag per commit with live smoke before the next; parity tests for flip #1; after flips #5/#6 re-run the economy/combat sims; qa-release replays the *full* stack in Inc 5 |
| 2 | **Save-shape drift** — Inc-4 content adds persisted fields; a mistake resets or corrupts a real student save (violates rule 5) | L×**Critical** | Additive-only fields with defaults; save-migration-engineer owns every persisted-shape diff (boundary is non-delegable); envelope v5 migration tested idempotent; real pre-phase blob captured as an Inc-5 fixture; `SAVE_ENVELOPE_ENABLED` untouched |
| 3 | **Scene-load performance / leaks** — new dungeon sheets + realtime loop on mobile; texture leak across enter/exit cycles degrades long sessions | M×M | Zone-scoped load/unload via SceneLifecycle with an explicit repeat-entry leak check in Inc 2 exit criteria; small bounded layouts; Inc-5 throttled-profile FPS check |
| 4 | **Realtime combat is the first-ever live run of the Phase-09 engine** — unit-tested but never player-driven; feel/balance may be wrong late in the phase | M×M | Flip #3 lands dungeon-only first (smallest blast radius) before any field rollout; BattleModal fallback stays one revert away; combat-engineer owns tuning with the sim harness |
| 5 | **Boss telegraph readability subjective** — passes engineering checks but a Grade-6 player on a phone can't read it | M×M | Three redundant channels (§4) so no single tell is load-bearing; ≥600 ms floor asserted in tests; explicit 3-channel glance protocol in Inc 5 rather than "looks fine" |
| 6 | **Scope blowout in Inc 4** (10–15 quest steps + 8 side quests + puzzles + economy + audio is the largest content drop yet) | H×M | Inc 4 starts only after Inc 3's gate-critical engineering is committed (gate blockers can't be hostage to content); content is data-driven (quests/layouts as data) so cuts are config-level; the audit's non-critical backlog (skill_effects VFX, extra SFX) is pre-authorized to slip |
| 7 | **`walls_floor.png` grid assumption wrong** (13×23@16px unverified visually) | L×L | Inc-2 first task: render a slicing contact-sheet in dev before authoring layouts (world-art mandate: never guess frame dimensions) |

---

## 8. Decision log entries to record on commit

1. Standalone `DungeonScene` over TowerScene mode-flag (blast radius, §2).
2. Flag order §3; one-flag-per-commit revert discipline.
3. `SAVE_ENVELOPE_ENABLED` deferred out of Phase 14; envelope kept in sync via v5 migration.
4. Realtime combat scoped dungeon-first, field rollout only on clean smoke; floors 11+ permanently
   legacy until a later phase decides otherwise.
5. Boss phases derived from HP fraction (re-derivable on resume) rather than stored phase counters.
