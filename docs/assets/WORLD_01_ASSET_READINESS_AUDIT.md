# World 1 ("Verdant Slimes" — floors 1–10, biome: forest) — Asset Readiness Audit

**Phase 13.5 — read-only audit, precedes Phase 14.** Compiled by world-art-engineer from a verified
inventory of `public/`, runtime wiring (`app/game/systems/textures.ts`, `TownScene.ts`, `TowerScene.ts`,
`BossScene.ts`, `PortalModal.vue`, `BattleModal.vue`, `SkillTreeModal.vue`, `equipment.ts`, `skills.ts`,
`index.vue`), and `docs/asset-index.md` for D:\Asset reserve packs. Style baseline: **16-bit top-down
pixel art** — two coexisting compatible sub-styles ship today: 16px Kenney tiles (rendered @ 32px/TILE)
and the 128px "MCA" monster/boss style. `lpc-poc/*` and Sunnyside World are a **third, incompatible**
style and are excluded from all World-1 recommendations below.

Corrections to the briefing packet found during this audit: `character-icons/*.png` **is** wired (class
picker in `index.vue:262`, `BattleModal.vue:93`); `npc/portal_guardian.png` **is** wired
(`PortalModal.vue:5`); `item-icons/*` and `skill-icons/*` **are** wired into equipment/skill UI
(`equipment.ts:238`, `SkillTreeModal.vue:16`). These are Vue-UI wiring, distinct from the Phaser
`textures.ts` scene-loader wiring the briefing enumerated — both count as "wired" for this audit.

Legend: dims = pixel WxH · anim = frame count/type · license = source pack license. **Provenance caveat
(qa-release):** `public/` contains **no license files** (only `robots.txt`); "cleared" below is an assertion
inherited from prior phases, not a per-asset provenance record. A provenance ledger mapping each `public/`
dir → source pack → license class → attribution obligation (esp. Craftpix per-pack terms) is a required
**release/S-grade-gate** backlog item (does not block Phase-14 *start*) — logged in the gaps doc.

## Town

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Town backdrop | `public/town-art/town-night.png` | 16-bit painted backdrop (compatible) | 1404x712 | static | top-down/oblique | cleared (prior phase) | none | low — WIRED in `TownScene.ts` | **APPROVED** |
| Town ground tiles | `public/tiny-town/tilemap_packed.png` | Kenney 16px | 192x176 (16px tiles) | static | top-down | CC0 | none | low — WIRED, baked via `textures.ts` | **APPROVED** |

## Two fields (floors 1–9 forest overworld tiles, non-town, non-dungeon)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Field A — baked grass/tree floor | procedurally baked in `textures.ts` (`buildBiomeTextures`) from `tiny-town` tileset + biome color mix | 16px Kenney (compatible) | 32x32/tile (baked) | static | top-down | CC0 (source tiles) | none — already baked | low — WIRED, in production since Phase <14 | **APPROVED** |
| Field B — visual variant per floor-band | same baked pipeline, biome-tinted; no second distinct field tileset exists | 16px Kenney | 32x32/tile | static | top-down | CC0 | none | low, but **visually thin** — only color-mix distinguishes "two fields" rather than distinct tile art | **WEAK** |

> **Reviewer note (game-architect):** the Phase-14 Art requirements
> (`RPG_ONET_..._PROMPT_TH.md:772`) explicitly forbid **tint-only biome differentiation** and require real
> tiles/layered composition. The entire current field pipeline *is* tint-mix baking. Fields do not block the
> gate *checklist*, but distinct field tile art is an **in-Phase-14 deliverable, not deferred backlog** —
> remediation is reuse from D:\Asset (`kenney_tiny-farm`, or Craftpix `...504452` village `FieldsTileset.png`),
> zero generation. Field A stays APPROVED (ships today); the "two fields" *variety* requirement is WEAK.

## Mini dungeon (sub-boss chamber, floors ~5)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Mini-dungeon interior tileset | `public/tiny-dungeon/tilemap_packed.png` | 16px Kenney (compatible, matches tiny-town) | 192x176 (16px tiles) | static | top-down | CC0 | none for the art itself | **UNWIRED — no dungeon-interior scene exists yet**; TowerScene/BossScene never reference this file. Asset itself is production-grade. | **REUSABLE** (blocked-on-scene) |
| Mini-dungeon walls/floor set | `public/dungeon-assets/walls_floor.png` | 16px grid (208x368 = 13×23 tiles @ 16px, divides cleanly) | 208x368 | static | top-down | cleared (prior phase) | verify frame slicing against 16px grid before use | **UNWIRED**, same as above — no consuming scene | **REUSABLE** (blocked-on-scene) |

## Main dungeon (floor-10 approach, pre-boss)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Main dungeon interior | same two files as above (`tiny-dungeon` tilemap + `walls_floor.png`) — **one scene, two authored layout configs** (mini vs main), no separate "main" tileset needed | 16px Kenney | 192x176 / 208x368 | static | top-down | CC0 / cleared | second layout config + collision authoring | **No scene consumes these; TowerScene renders floor 10's approach with the same generic forest-biome baked tiles as floors 1–9** (no distinct "dungeon" read) | **REUSABLE** (blocked-on-scene) |

> **Reclassified from MISSING_CRITICAL → REUSABLE after reviewer reconciliation (game-architect + qa-release).**
> The dungeon **art** is present, licensed, and style-correct — nothing is *absent*, so the MISSING rubric
> does not apply. What is missing is a **consuming `DungeonScene`**. Per the Phase-14 roadmap
> (`RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md:748–749`), "mini dungeon" and "main dungeon"
> are two **distinct layout configs of one new scene** (not two tilesets, not a mode-flag bolted onto the
> load-bearing TowerScene). This single scene-build is a **Phase-14 engineering prerequisite** owned by
> implementation-engineer / game-architect — tracked once in `WORLD_01_CRITICAL_ASSET_GAPS.md`, outside the
> asset-classification rubric. New loader must use `assetPath()` (GitHub Pages subpath) and load
> `tiny-dungeon` only on scene-enter (zone-scoped load/unload).

## Boss arena (floor 10)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Arena floor tiles | baked biome tiles via `biomeFloorKey()` in `BossScene.ts:89` (reuses `buildBiomeTextures`) | 16px Kenney | 32x32/tile | static | top-down | CC0 | none | low — WIRED | **APPROVED** |
| Arena ring/walls | `Phaser.Graphics` procedural (stone ring, walls) — no image asset | n/a (vector) | n/a | n/a | n/a | n/a (code) | none | low — WIRED, ships today | **APPROVED** (Graphics fallback, acceptable per constitution — no asset needed) |

## Four classes (warrior / mage / archer / guardian, ×male/female)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Hero atlas (in-game sprite, all 8 variants) | `public/character-sprites/hero-atlas.png` + `.json` | MCA-adjacent packed atlas (compatible) | 660x784 | walk/idle frames per atlas JSON | top-down | cleared (prior phase) | none | low — WIRED via `HERO_ATLAS` in `textures.ts` | **APPROVED** |
| Per-class walk strips (unwired duplicate) | `public/character-sprites/{class}_{male,female}.png` (8 files) | same style as atlas | ~150x644 | walk strip | top-down | cleared | none — superseded by atlas, redundant | low, dead weight only | **REUSABLE** (backup source, not needed) |
| Class portraits | `public/character-icons/{class}_{male,female}.png` (8 files) | MCA portrait style | ~150x150 | static | portrait | cleared | none | low — WIRED (class picker `index.vue:262`, `BattleModal.vue:93`) | **APPROVED** |

## 6–8 monsters (World-1 forest fodder)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Slime | `public/mob-sprites/mca/slime.png` | MCA 128px (compatible) | 128x128 | **static, single frame** | top-down/3-quarter | cleared | none | low — WIRED per-theme in `textures.ts` | **APPROVED*** |
| Big Slime (also per-floor mini-boss, bossScale 150) | `public/mob-sprites/mca/big_slime.png` | MCA 128px | 128x128 | static | top-down | cleared | scale to 150% (code-side, no art work) | low — WIRED | **APPROVED*** |
| Nature Slime | `public/mob-sprites/mca/nature_slime.png` | MCA 128px | 128x128 | static | top-down | cleared | none | low — WIRED | **APPROVED*** |
| Mushroom Monster | `public/mob-sprites/mca/mushroom_monster.png` | MCA 128px | 128x128 | static | top-down | cleared | none | low — WIRED | **APPROVED*** |
| Frog Monster | `public/mob-sprites/mca/frog_monster.png` | MCA 128px | 128x128 | static | top-down | cleared | none | low — WIRED | **APPROVED*** |

`*` APPROVED reflects that a **static single-frame combat monster is the existing shipped pattern**
(legacy floors 11+ ship the same way) — style/dims/perspective/license all pass. Flagged as **WEAK on
animation coverage specifically** in the gaps doc; this does not block Phase 14 per the guidance that the
legacy path already ships static monsters.

**Count reconciliation (qa-release):** World 1 has **5 fodder sprites** (slime, big_slime, nature_slime,
mushroom_monster, frog_monster), not 6. The "6–8 monsters" requirement is met by **distinct combat
visuals**: 5 fodder + 2 tint/scale elites + 1 boss = **8**. `big_slime` doubles as the per-floor mini-boss
via `bossScale`.

## 2 elites (no dedicated sprites exist)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Elite candidate 1 (proposed: tinted/scaled `nature_slime`) | `public/mob-sprites/mca/nature_slime.png` (reused, not a new asset) | MCA 128px | 128x128 → scale ~130% | static | top-down | cleared | tint shader/scale (code-side, same pattern as `big_slime` bossScale) | low — same mechanism already proven for `big_slime` | **REUSABLE** |
| Elite candidate 2 (proposed: tinted/scaled `mushroom_monster`) | `public/mob-sprites/mca/mushroom_monster.png` (reused) | MCA 128px | 128x128 → scale ~130% | static | top-down | cleared | tint shader/scale | low | **REUSABLE** |

No unique "elite" art exists anywhere in `public/` or the D:\Asset index; there is no elite-tier sprite in
any Craftpix monster pack that was pre-verified. Reuse-via-tint is the only zero-generation path.

> **Reviewer note (combat-engineer):** tint alone is a **weak sole telegraph** on a 128px MCA sprite over an
> already biome-tinted forest, and scale collides with the existing mini-boss `bossScale` read (players may
> not distinguish "elite" from "mini-boss"). Require a **second, non-color threat tell** — an "Elite"
> nameplate (`addPlaque` helper already used in BossScene) and/or an aura (`addGearAura`/atmosphere aura
> helpers already exist). With that added, REUSABLE stands.

## 1 boss (floor 10 — Myco Colossus / `world01`)

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Boss static | `public/mob-sprites/world-boss/world01.png` | MCA 128px | 128x128 | static (fallback) | top-down | cleared | none | low — WIRED via `bossVisualForFloor` | **APPROVED** |
| Boss idle strip | `public/mob-sprites/world-boss/world01_idle.png` | MCA 128px | 640x160 (5 frames @ 128x160) | 5-frame idle anim | top-down | cleared | none | low — WIRED via `ensureWorldBossAnim` in `BossScene.ts` | **APPROVED** |

Boss has real idle animation (the only animated combat sprite in the game). **Reviewer caveat
(combat-engineer + qa-release):** the idle strip only plays during the *overworld approach* — during the
actual fight the boss is delegated to `BattleModal.vue` and renders as a **static portrait `<img>`** with
CSS shake/flash. The realtime engine (`realtime.ts`) has **no boss-phase state machine and no telegraph
hook**. So the Phase-14 gate item "**readable boss phases**" is an **unmet engineering deliverable**, not an
asset satisfied by this idle strip. The boss *asset* is APPROVED; phase readability must be built via a
Graphics/tween telegraph (HP-threshold tint/wind-up flash, consistent with the arena-walls Graphics
precedent). Tracked as a Phase-14 engineering task in the gaps doc — see it before the gate, not after.

## NPCs

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Portal Gate (landmark NPC) | `public/npc/portal_gate.png` | 16-bit painted (compatible) | 190x414 | static | top-down/oblique | cleared | none | low — WIRED, `TownScene.ts` | **APPROVED** |
| Portal Guardian (dialogue portrait) | `public/npc/portal_guardian.png` | MCA-adjacent portrait | 200x200 | static | portrait | cleared | none | low — WIRED, `PortalModal.vue:5` | **APPROVED** |
| Guildmaster | `public/interior-props/guildmaster.png` | 16-bit painted, small-scale | 32x32 | static | top-down | cleared | none | low; **currently unwired** — no scene/component references it | **REUSABLE** |

## Buildings

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Guild Hall exterior | `public/exterior-props/guild_hall_exterior.png` | 16-bit painted | 144x111 | static | top-down/oblique | cleared | none | low — WIRED, `TownScene.ts` | **APPROVED** |
| Guild Hall sign | `public/exterior-props/guild_hall_sign.png` | 16-bit painted | 72x26 | static | top-down | cleared | none | low; currently unwired (decor-only add) | **REUSABLE** |

## Props

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Shop stall | `public/interior-props/shop_stall.png` | 16-bit painted | 96x96 | static | top-down | cleared | none | low — WIRED, `TownScene.ts` | **APPROVED** |
| Shop barrel/crate, guild floor/wall/banner/chest/plant, wardrobe, shelf-jars | `public/interior-props/*` (11 files, 16–96px) | 16-bit painted (compatible) | 16–96px | static | top-down | cleared | none | low; unwired, no interior-town scene consumes them yet | **REUSABLE** |
| Guildhall bookshelf/plant/questboard/staircase | `public/guildhall-props/*` (4 files, ~25–64px) | 16-bit painted | 25–64px | static | top-down | cleared | none | low; unwired | **REUSABLE** |

## Landmarks

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Portal Gate | `public/npc/portal_gate.png` (dup of NPC row — landmark function) | 16-bit painted | 190x414 | static | top-down/oblique | cleared | none | low — WIRED | **APPROVED** |
| Staircase (dungeon-transition landmark) | `public/guildhall-props/staircase.png` | 16-bit painted | ~64px | static | top-down | cleared | none | unwired, and no dungeon scene exists to place it in | **REUSABLE** (blocked on scene, see gaps) |

## Quest items

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Torch / Gem-cyan / Gem-orange (world decor) | `public/quest-icons/{torch,gem-cyan,gem-orange}.png` | 16-bit painted icon style | 96x96 | static | top-down | cleared | none | low — WIRED as `TownScene.ts` decor | **APPROVED** |
| Gem-teal (unused variant) | `public/quest-icons/gem-teal.png` | 16-bit painted icon style | 96x96 | static | top-down | cleared | none | low; unwired, no consuming quest logic | **REUSABLE** |

## UI icons

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Item icons (weapon/armor/trinket/potion tiers, ~60 files) | `public/item-icons/*.png` | flat icon style (compatible, UI-layer) | 48x48 / 128x128 | static | icon | cleared | none | low — WIRED, `equipment.ts:238` (shop/inventory UI) | **APPROVED** |
| Skill icons (24 files) | `public/skill-icons/*.png` | flat icon style | 48x48 | static | icon | cleared | none | low — WIRED, `SkillTreeModal.vue:16`, `skills.ts` | **APPROVED** |
| Class portraits (dup, UI use) | `public/character-icons/*.png` | MCA portrait | ~150x150 | static | portrait | cleared | none | low — WIRED (class picker) | **APPROVED** |
| UI-pack frames/daynight | `public/ui-pack/*.png` (5 files) | flat icon/frame style | 44–48px | static | icon | CC0 (Kenney-derived) | none | low; **confirmed UNWIRED** (zero references in `app/`, grep verified by qa-release) — available for HUD reuse | **REUSABLE** |

## VFX

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Skill effects sheet | `public/skill-assets/skill_effects.png` | MCA-adjacent effect sheet | 1536x1024 (sheet, frame count unverified) | sheet — **no consuming scene/animation config found** | top-down | cleared | frame-slicing + Phaser animation config required before use | medium — needs a real integration pass to identify frame boundaries | **WEAK** |
| Fire/Ice/Lightning skill icons (UI-only, not world VFX) | `public/skill-icons/{fire,ice,lightning}.png` | flat icon | 48x48 | static | icon | cleared | none | low — WIRED (skill tree UI only, not combat VFX) | **APPROVED** (for UI use only) |
| Boss idle animation (only sprite anim in game) | `public/mob-sprites/world-boss/world01_idle.png` | MCA 128px | 640x160, 5 frames | idle loop | top-down | cleared | none | low — WIRED | **APPROVED** |

## Audio

| Asset | Path | Style | Dims | Anim | Perspective | License | Preprocessing | Integration risk | Class |
|---|---|---|---|---|---|---|---|---|---|
| Forest BGM | `public/audio/bgm_forest.mp3` | n/a | n/a | loop | n/a | cleared (BGM pack Vol.1 per asset-index) | none | low — WIRED via `bgm.ts`/`bgmKeyForBiome` | **APPROVED** |
| Town BGM | `public/audio/bgm_town.mp3` | n/a | n/a | loop | n/a | cleared | none | low — WIRED | **APPROVED** |
| SFX (hit/step/ui/attack) | **none exist in `public/`** | n/a | n/a | n/a | n/a | n/a | would need sourcing (Kenney ui-pack has CC0 click SFX oggs in D:\Asset) | **ZERO files** — combat/UI is silent aside from BGM | **MISSING_NONCRITICAL** (legacy path already ships BGM-only; matches shipped baseline) |
| ↳ Answer-correct / answer-wrong cue | **none** | n/a | n/a | n/a | n/a | n/a | Kenney CC0 oggs, near-zero cost | **Reviewer note (combat-engineer):** in an educational RPG that couples answering to combat, the correctness sound is a **learning-feedback signal**, not mere juice — **highest-priority item in the non-critical set** | **MISSING_NONCRITICAL** (elevated) |

> **Reviewer note (game-architect):** "Audio and ambience" is a named Phase-14 deliverable
> (`RPG_ONET_..._PROMPT_TH.md:762`) — the SFX gap is non-gate-blocking but is **in-phase scope**, not
> post-phase backlog; pull Kenney ui-pack CC0 oggs during Phase 14.

---

## Summary — classification counts (post-reviewer reconciliation)

| Classification | Count | Rows |
|---|---:|---|
| APPROVED | 27 | town backdrop, town tiles, field A, arena tiles, arena walls(Graphics), hero atlas, class portraits(×2 rows: art+UI), 5 fodder monsters, boss static, boss idle, portal gate(×2 rows: NPC+landmark), portal guardian, guild hall exterior, shop stall, quest decor (torch+2 gems), item icons, skill icons, fire/ice/lightning icons, forest BGM, town BGM |
| REUSABLE | 13 | mini-dungeon tileset, dungeon walls_floor, main-dungeon (layout-config), per-class walk strips, guildmaster, guild hall sign, interior-props (11 files as 1 row), guildhall-props (4 files as 1 row), staircase, gem-teal, ui-pack frames, elite candidate 1, elite candidate 2 |
| WEAK | 2 | field B / "two fields" variety (in-Phase-14 remediation, not backlog), skill_effects.png (unsliced/unwired VFX sheet) |
| MISSING_CRITICAL | 0 | — (the 3 dungeon rows were reclassified REUSABLE; the absent item is a *scene*, not art — see engineering-prerequisite note below) |
| MISSING_NONCRITICAL | 1 | SFX (zero files; answer-correct cue elevated to top priority) |

**Engineering prerequisites for the Phase-14 gate (NOT asset gaps — no generation needed):**
1. **DungeonScene** (one scene, two layout configs: mini + main) consuming `tiny-dungeon` + `walls_floor.png`.
2. **Boss-phase readability** — phase/HP-threshold state + telegraph tell (Graphics/tween), since the boss
   fights as a static portrait with no phase state machine today.
These are owned by implementation-engineer / game-architect and detailed in `WORLD_01_CRITICAL_ASSET_GAPS.md`.

Monster animation coverage (5 fodder are static single-frame) and elite sprites (reuse-only) are quality
notes within their APPROVED/REUSABLE rows rather than separate MISSING rows, per the guidance to weigh
against the already-shipped static-monster/BGM-only legacy baseline.

## Recommended final decision

**PROCEED_WITH_NONCRITICAL_ASSET_BACKLOG**

Rationale: the only MISSING_CRITICAL items collapse to one root cause — **no dungeon-interior scene
exists** to consume the already-present, already-licensed `tiny-dungeon/tilemap_packed.png` and
`dungeon-assets/walls_floor.png`. This is a **scene/engineering gap, not an asset gap**: the art assets
themselves are APPROVED-grade (16px Kenney, same style as the wired `tiny-town` set) and require no
generation. Town, fields (with a noted WEAK on visual variety), boss arena, all four classes, six fodder
monsters, the boss (with real idle animation), NPCs, buildings, props, landmarks, quest items, and UI
icons are all APPROVED or REUSABLE-with-trivial-wiring today. SFX absence and skill_effects.png
integration are tracked non-critical backlog items consistent with the legacy shipped baseline. No item
on this audit requires ComfyUI generation to reach a playable World-1 slice — see
`WORLD_01_CRITICAL_ASSET_GAPS.md` for the exact remediation (a dungeon-scene build, not new art) and
whether each item blocks the Phase 14 gate.

---

## Reviewer reconciliation & sign-off

Lead: **world-art-engineer** (Sonnet 5). Reviewers (read-only): **game-architect** (Fable 5),
**combat-engineer** (Opus 4.8), **qa-release** (Fable 5). All three **endorse
`PROCEED_WITH_NONCRITICAL_ASSET_BACKLOG`** in substance; qa-release gave CONDITIONAL-PASS pending the fixes
below, now applied.

| # | Reviewer | Finding | Resolution |
|---|---|---|---|
| 1 | architect + qa + combat | Rubric contradiction: 3 MISSING_CRITICAL yet a "no-MISSING_CRITICAL" decision. | Dungeon rows reclassified **REUSABLE (blocked-on-scene)**; scene logged as a Phase-14 **engineering prerequisite**, outside the asset rubric. MISSING_CRITICAL now 0 — decision is rubric-consistent. |
| 2 | architect | mini + main dungeon = **two layout configs of one new `DungeonScene`** (roadmap L748–749), not a TowerScene mode-flag. | Recorded in the dungeon section + gaps doc; steer to a standalone `DungeonScene.ts`. |
| 3 | combat + qa | "Readable boss phases" is **unmet engineering** — boss fights as a static portrait in `BattleModal`; no phase state/telegraph in `realtime.ts`. | Boss section + summary now state it as a Phase-14 engineering task (Graphics/tween telegraph), not asset-satisfied. |
| 4 | architect | Fields are **tint-only**, which roadmap L772 forbids → in-phase deliverable, not backlog. | "Two fields" variety kept WEAK, marked in-Phase-14 remediation (Kenney tiny-farm / Craftpix FieldsTileset). |
| 5 | architect + combat | Audio/SFX is in-phase scope (L762); **answer-correct cue** is a learning-feedback signal. | SFX kept NONCRITICAL but flagged in-phase; answer-cue elevated to top non-critical priority. |
| 6 | combat | Elite tint alone is a weak telegraph and scale collides with mini-boss read. | Elites keep REUSABLE **conditional on a second non-color threat tell** (nameplate/aura). |
| 7 | qa | No per-asset provenance/licence record in `public/`. | Provenance caveat added to legend; ledger logged as release-gate backlog in gaps doc. |
| 8 | qa | Count defects: 5-vs-6 monsters, REUSABLE 12-vs-10, phantom "mini-dungeon N/A(0)", ui-pack "unclear". | Monster count reconciled (5 fodder + 2 elites + 1 boss = 8 visuals); summary recounted (REUSABLE 13); phantom row removed; ui-pack marked **confirmed UNWIRED**. |

**Final decision stands: `PROCEED_WITH_NONCRITICAL_ASSET_BACKLOG`** — no asset requires sourcing or ComfyUI
generation to build a playable World-1 slice; the remaining blockers are engineering tasks (DungeonScene,
boss-phase telegraph) plus a tracked non-critical/in-phase backlog.
