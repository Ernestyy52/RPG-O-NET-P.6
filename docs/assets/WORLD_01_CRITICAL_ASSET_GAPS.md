# World 1 — Critical Asset Gaps & Remediation

Companion to `WORLD_01_ASSET_READINESS_AUDIT.md`. Every MISSING_CRITICAL / WEAK / MISSING_NONCRITICAL
item, with a concrete remediation path and an explicit Phase-14-gate call. Phase 14 gate = a new player
can complete the World-1 forest slice (town → fields → dungeon → boss), readable boss phases, no
placeholder-critical areas, mobile-OK.

> **Post-reviewer reconciliation:** after game-architect + qa-release + combat-engineer review, there are
> **0 MISSING_CRITICAL assets** — the dungeon art is present/licensed/style-correct, so what was previously
> logged as MISSING_CRITICAL is reclassified **REUSABLE (blocked-on-scene)** and captured below as
> **engineering prerequisites** (scene + telegraph), which are owned by implementation-engineer /
> game-architect, not world-art. No asset requires sourcing or ComfyUI generation.

## Engineering prerequisites for the Phase-14 gate (NOT asset gaps — no generation, no new art)

### 1. No dungeon-interior scene exists (blocks both "mini dungeon" and "main dungeon" checklist items)

- **What's missing:** `TowerScene.ts` renders every floor — including the mid-World-1 mini-boss floor and
  the floor-10 approach — with the same generic baked forest-biome tiles used everywhere else. There is
  no `DungeonScene.ts` (or equivalent) that reads `tiny-dungeon/tilemap_packed.png` or
  `dungeon-assets/walls_floor.png`. Both files sit in `public/` fully licensed and un-consumed.
- **Remediation path: neither reuse-from-D:\Asset nor ComfyUI generation — this is a scene-build task.**
  The art already exists and is style-compatible (16px Kenney, matches the wired `tiny-town` set). The
  fix is: author a **standalone `DungeonScene.ts`** (following the `TownScene.ts` pattern) that loads
  `tiny-dungeon/tilemap_packed.png` for floor/wall tiles and `dungeon-assets/walls_floor.png` for
  wall-facing variants. **Reviewer steer (game-architect):** prefer a standalone scene over a `dungeon`
  mode-flag on `TowerScene.ts` — TowerScene already carries multiplayer join, biome baking, and mob
  spawning; a mode flag increases blast radius on the only load-bearing gameplay scene. **"Mini dungeon"
  and "main dungeon" are two distinct *layout configs* of this one scene** (roadmap L748–749), not two
  tilesets. New loader must route through `assetPath()` (GitHub Pages subpath 404 bug) and load
  `tiny-dungeon` only on scene-enter (zone-scoped load/unload, roadmap L773). This is implementation-engineer
  / game-architect work, outside world-art-engineer's boundary.
- **Optional art supplement (if the scene build wants more variety):** D:\Asset → Craftpix "dungeon pack"
  + "dungeon-objects" (per `docs/asset-index.md`), free-license with attribution/terms.txt — same
  top-down pixel register, usable without ComfyUI if the team wants richer dungeon dressing beyond the
  two files already in `public/`.
- **Blocks Phase 14 gate?** **YES, as currently scoped** — "town → fields → **dungeon** → boss" is
  explicit in the gate definition, and no scene renders a dungeon today. However, since the art is
  already present and licensed, this is the cheapest possible critical gap to close (a scene-authoring
  task, zero generation, zero new licensing) and should not by itself justify
  `INSTALL_COMFYUI_BEFORE_PHASE_14`.

### 1b. "Readable boss phases" has no supporting state machine or telegraph (combat-engineer + qa-release)

- **What's missing:** the Phase-14 gate requires "readable boss phases," but the World-1 boss fights via
  `BattleModal.vue` as a **static portrait `<img>`** (CSS shake/flash) — the `world01_idle.png` strip only
  plays during the overworld approach, never in the fight — and `realtime.ts` has **no phase/HP-threshold
  state and no telegraph hook**. The boss *asset* is APPROVED; the *phase readability* is unbuilt.
- **Remediation path: engineering, not art.** Add HP-threshold phase state + a telegraph tell using the
  Graphics/tween precedent already established for the arena walls (wind-up scale, tint flash, phase-shift
  color/log cue). No new sprite required. The realtime engine's existing `CombatEvent` stream
  (`monster-attack`/`hero-attack`/`monster-defeated`) is the natural binding point where telegraph VFX,
  impact VFX, and SFX would all attach.
- **Blocks Phase 14 gate?** **YES as a gate criterion** — must be built before the gate, but it is
  implementation work with zero asset dependency.

## WEAK

### 2. Two forest "fields" are visually the same tileset with only a color tint distinguishing them

- **What's missing:** the audit's "two fields" checklist item is met today by one baked tile pipeline
  (`buildBiomeTextures`) applied with different color mixes per floor band — there's no second distinct
  field tileset (e.g., a clearing vs. a deep-woods variant with different prop density).
- **Remediation path:**
  - *Reuse-from-D:\Asset:* Kenney "rpg-urban" or "pico-8-city" packs are wrong register; better fit is
    checking `docs/asset-index.md` for a second Kenney nature/farm tile variant already indexed
    (`tiny-farm`) — could supply a genuinely distinct second field look (hedgerows/crop rows) at the same
    16px grid.
  - *Phaser-Graphics-fallback:* increase baked-tile prop density variance (more tree clusters / rock
    scatter) programmatically per floor band — zero new assets, code-only tweak in `textures.ts`.
  - *Generate-in-ComfyUI:* lowest priority; only worth it once ComfyUI is actually installed (see
    `docs/assets/COMFYUI_PREFLIGHT_REPORT.md` — not installed today).
- **Blocks Phase 14 gate?** **NO** for the gate *checklist*, but **in-Phase-14 scope, not deferred
  backlog** — roadmap L772 explicitly forbids tint-only biome differentiation and requires real
  tiles/layered composition. Distinct field tile art must be pulled during Phase 14 (Kenney `tiny-farm`
  or Craftpix `...504452` `FieldsTileset.png`), zero generation.

### 3. `skill_effects.png` VFX sheet is unsliced and unwired to any scene or animation config

- **What's missing:** `public/skill-assets/skill_effects.png` (1536x1024) exists and is licensed, but no
  frame boundaries are defined and no scene loads it — combat currently has zero in-world particle/impact
  VFX beyond the boss's idle animation.
- **Remediation path:**
  - *Preprocessing:* have world-art-engineer (or test-data-engineer for measurement) determine the actual
    frame grid (likely a fixed NxM sheet — needs visual inspection, "never guess frame dimensions" per
    role mandate) and author a Phaser animation config, then wire minimal hit/cast flashes into
    `TowerScene.ts`/`BossScene.ts` combat resolution.
  - *Phaser-Graphics-fallback:* ship Phase 14 with tween/flash-based hit feedback (scale pulse + tint
    flash on the monster sprite) instead — zero new art dependency, matches the "no full rewrite, use
    Graphics where no asset exists" precedent already set for boss-arena walls.
- **Blocks Phase 14 gate?** **NO** — combat is legible without particle VFX (legacy floors ship this way
  today); tracked as non-critical polish backlog.

## MISSING_NONCRITICAL

### 4. Zero SFX files anywhere in `public/audio/`

- **What's missing:** no hit/step/UI-click/attack sound files exist at all — only 6 BGM tracks.
- **Highest priority within this gap (combat-engineer): the answer-correct / answer-wrong cue.** In an
  educational RPG that couples answering to combat (`registerAnswer` → combo/MP), the correctness sound is
  a **learning-feedback signal**, not mere juice — rank it above all other SFX.
- **Remediation path:**
  - *Reuse-from-D:\Asset:* Kenney `ui-pack` (per `docs/asset-index.md`) ships `+click SFX` `.ogg` files
    already licensed CC0 — lowest-effort path for UI-click + answer-cue feedback. Combat hit/step SFX
    would need a separate Kenney or Craftpix audio pack lookup (not yet indexed in this audit — flag for
    a future asset-index pass if the team wants combat SFX before Phase 15+).
  - *Generate-in-ComfyUI:* not applicable — ComfyUI in this environment is image/video-focused per the
    preflight report; audio generation is out of scope for the installed pipeline.
- **Blocks Phase 14 gate?** **NO** for the gate checklist (legacy baseline is BGM-only), but "Audio and
  ambience" is a **named Phase-14 deliverable** (roadmap L762) — **in-phase scope**, not post-phase backlog.
  Pull Kenney CC0 oggs during Phase 14, answer-cue first.

### 5. Elite-tier monsters have no dedicated sprites (context, not a blocking gap)

- **What's missing:** no unique "elite" art exists in `public/` or the indexed D:\Asset packs.
- **Remediation path (already selected in the audit/manifest):** reuse `nature_slime.png` and
  `mushroom_monster.png` tinted + scaled ~130%, using the exact mechanism already shipped for
  `big_slime`'s `bossScale: 150`. Zero new art, one small `textures.ts` code addition (elite variant key +
  tint). This is recorded as REUSABLE in the manifest, listed here only for completeness since "2 elites"
  is an explicit checklist item.
- **Reviewer condition (combat-engineer):** tint alone is a weak telegraph and scale collides with the
  mini-boss `bossScale` read — add a **second, non-color threat tell** (an "Elite" nameplate via the
  `addPlaque` helper already used in BossScene, and/or an aura via `addGearAura`/atmosphere helpers).
- **Blocks Phase 14 gate?** **NO** — reuse path is zero-cost and already proven in the codebase.

### 6. No per-asset provenance/licence ledger (qa-release — release-gate backlog)

- **What's missing:** `public/` has no license files (only `robots.txt`); "cleared" in the audit is an
  inherited assertion, not a provenance record. Craftpix-derived packs carry per-pack attribution/terms.
- **Remediation path:** author `docs/assets/ASSET_PROVENANCE.md` (or `LICENSES/` entries) mapping each
  `public/` asset dir → source pack (from `docs/asset-index.md`) → license class (CC0 / Craftpix free) →
  attribution obligation. Pure documentation, zero code/art.
- **Blocks Phase 14 gate?** **NO** — but it **blocks the release / S-grade audit gate** (Phase 18). Track
  now so it isn't discovered late.

---

## Gate-blocking summary

| # | Item | Type | Blocks Phase 14 gate? | Fastest path |
|---|---|---|---|---|
| 1 | No dungeon-interior scene (mini + main dungeon) | Engineering | **YES** | Standalone `DungeonScene.ts`, two layout configs, using already-licensed `tiny-dungeon`/`walls_floor.png` — implementation-engineer/game-architect, no art |
| 1b | Boss-phase readability (no phase state / telegraph) | Engineering | **YES (gate criterion)** | HP-threshold phase state + Graphics/tween telegraph; no new sprite |
| 2 | "Two fields" tint-only (roadmap forbids) | Asset (in-phase) | No (checklist) / in-phase | Reuse Kenney `tiny-farm` / Craftpix `FieldsTileset.png` during Phase 14 |
| 3 | `skill_effects.png` unsliced/unwired | Asset (backlog) | No | Tween/flash Graphics-fallback for Phase 14; real VFX later |
| 4 | Zero SFX (answer-cue first) | Asset (in-phase) | No | Kenney ui-pack CC0 oggs during Phase 14, answer-cue prioritized |
| 5 | No elite sprites | Asset (reuse) | No | Tint/scale reuse + a non-color threat tell (nameplate/aura) |
| 6 | No provenance/licence ledger | Docs | No (blocks release/S-grade gate) | Author `ASSET_PROVENANCE.md` |

**No item requires new art or ComfyUI generation.** The two gate blockers (#1, #1b) are pure engineering
using assets that already pass all 8 check dimensions — which is why the decision is
`PROCEED_WITH_NONCRITICAL_ASSET_BACKLOG`, not `INSTALL_COMFYUI_BEFORE_PHASE_14`. Reviewers (game-architect,
combat-engineer, qa-release) endorse this decision; see the reconciliation table in the audit doc.
