# Claude Code Prompt — Mockup, Map Size, Character Scale and Camera Integration

ใช้ไฟล์นี้เป็น prompt โดยตรงกับ Claude Code

## BEGIN PROMPT

You are the world-scale, camera and map-integration owner for Spiral's Echo. Use the approved mockups and asset boards to build original production maps whose character, buildings, paths and camera feel believable and readable. Do not assume that the tiny figures painted inside a high-angle mockup define runtime scale.

Read first:

- docs/mockups/README.md
- docs/mockups/MOCKUP_MANIFEST.md
- docs/mockups/GALLERY.md
- docs/mockups/region-01-everbloom/aethergate-town/AETHERGATE_GALLERY.md
- docs/mockups/region-01-everbloom/aethergate-town/AETHERGATE_TOWN_BUILD_SPEC.md
- docs/WORLD_MAP_BIBLE.md
- docs/ART_BIBLE.md
- docs/ZONE_CONTRACT.md
- app/game/createGame.ts
- app/game/systems/textures.ts
- app/game/scenes/TownScene.ts
- app/game/scenes/InteriorScene.ts
- app/game/runtime/zone.ts
- current player, NPC, remote-player, paper-doll, collision, camera, minimap and save code

Goal:

1. Establish one evidence-based world-scale contract.
2. Select the best map size, character visual size and camera behavior.
3. Prove it first in an Aethergate greybox and scale lab.
4. Apply the approved contract to all 32 campaign maps, interiors and Endless Tower room archetypes.
5. Convert concept boards into original modular production assets; never ship contact sheets.

Known baseline — verify before changing:

- Phaser internal viewport: 640 x 480, Scale.FIT, pixelArt true.
- Source tile: 16px; current world tile: 32px.
- Hero source frames: roughly 43–53 x 96px; current HERO_DISPLAY_H: 48px.
- Current standard foot collider: 18 x 12 world px.
- Current Town art: 1404 x 712 scaled to WORLD_H 608, producing about 1199 x 608 world px.
- Current Town movement: 130 px/s; interiors and shared movement are about 120 px/s.
- Current camera follows the player at zoom 1 unless later code says otherwise.
- Mockups are 1536 x 1024 concept images, not dimension specifications or runtime backgrounds.

Non-negotiables:

- Never load, crop or slice a mockup/contact sheet as a production tileset.
- Never scale the 1536 x 1024 mockup down to WORLD_H 608 and place the current hero on it.
- Rebuild assets as original modular 16px-native tiles/props with provenance, atlas, collision and depth data.
- Preserve TILE=32 and collider 18 x 12 as the first baseline. Change grid/physics only if every visual/camera profile fails and evidence justifies migration.
- A visual-size experiment must not silently change speed, reach, interaction radius, physics fairness, save coordinates or network state.
- Player, NPC, remote player, equipment layers, weapon overlay, aura, shadow, nameplate and relevant VFX must use the same selected actor-scale contract.
- Keep nearest-neighbor rendering and integer-aligned positions. Reject blur, uneven pixels, shimmer and subpixel foot drift.
- Preserve existing IDs, quests, portals, interiors and user changes described in the Aethergate build spec.

## Phase S0 — Measured baseline

Create docs/MAP_SCALE_DECISION.md and record:

- exact current constants and file locations
- source/display dimensions for every class/gender and widest equipment
- tile, collider, speed, interaction radius, camera, CSS scale and viewport behavior
- current Town/interior/field dimensions in tiles, world px and walking seconds
- screenshots of current spawn, plaza, narrow path, main door and one interior at desktop and 390 x 844
- problems observed: scale, readability, navigation, clipping, empty travel, mobile size and pixel stability

Do not conclude “shrink the hero” from visual impression alone.

## Phase S1 — Aethergate greybox and map dimensions

Build a dev-only greybox from the Aethergate town mockup using tiles and primitive collision; do not use the PNG as runtime art.

Compare at least these starting candidates, or evidence-based equivalents:

| Profile | Town tiles | World px at TILE 32 | Purpose |
|---|---:|---:|---|
| M0 compact | 48 x 36 | 1536 x 1152 | fastest services |
| M1 balanced | 64 x 48 | 2048 x 1536 | preferred first candidate |
| M2 spacious | 80 x 60 | 2560 x 1920 | stronger exploration |

For each candidate calculate routeSec = measuredPathPx / actualSpeedPxSec.

Target repeat-visit travel:

- arrival/waystone to central plaza: 3–6s
- plaza to Guild, Hospital, Shop or Tower: 4–10s
- return spawn to any core service: no more than 12s
- longest meaningful cross-town route: 15–25s
- full town loop: about 35–60s
- no empty traversal longer than 8–10s without landmark, choice, NPC, interaction or ambience

The first arrival may take 20–30s only when guided by story, discovery or interaction. Do not force that delay on every return. If this conflicts with AETHERGATE_TOWN_BUILD_SPEC, update the spec with evidence.

Do not enlarge a map with empty ground. Preserve the mockup's districts, loop, shortcuts, sightlines and twelve-building identity while adjusting distances for play.

After Aethergate is approved, define size classes for:

- small/large interiors
- hub towns
- fields
- mini dungeons
- region dungeons
- boss arenas
- Endless Tower rooms

Create a compact MapDimensionSpec for every canonical map: tile, cols, rows, world width/height, route-time targets, encounter capacity, landmark cadence and camera profile. Do not implement all maps blindly before the scale gate passes.

## Phase S2 — Character and camera profiles

Test the same seeded greybox state with:

| Profile | Hero visual height | Camera |
|---|---:|---:|
| P0 control | 48px | zoom 1.00 |
| P1 | 44px | zoom 1.00 |
| P2 likely candidate | 40px | zoom 1.00 |
| P3 adaptive | selected desktop size | mobile accessibility zoom sufficient for readability |

Also test “keep hero 48 and show more world through a safe viewport/camera solution” before assuming hero reduction is best.

Rules:

- target hero visual height is normally 1.25–1.50 tiles
- visual width should read near 0.65–0.85 tile depending on class/equipment
- foot collider baseline remains about 0.56 x 0.38 tile
- physical on-screen hero height should remain at least 28px on the smallest supported mobile presentation
- main town paths: at least 4 tiles; secondary paths: 2–3; main doors: at least 2; interior corridors: at least 2
- interaction points need at least 1 clear tile
- main building openings should be at least 1.25 times character visual/collider clearance

The 96px source hero scaled to 44 or 40 may produce uneven pixel cadence. Inspect motion in every direction. If it shimmers, either choose the crisp profile or generate a properly nearest-neighbor pre-scaled atlas and realign all paper-doll/equipment layers; do not accept blur.

Changing camera zoom can also create fractional tile pixels. Prefer stable pixel cadence, integer-aligned camera scroll and roundPixels where appropriate. Mobile zoom may be an accessibility/view preset, but it must not change physics.

## Phase S3 — Objective comparison

Generate identical screenshots for every finalist:

- desktop 1280 x 800 and mobile 390 x 844
- spawn
- central plaza with several NPC/remote-player stand-ins
- 2-tile side lane
- main building door
- small shop interior
- large Guild or Tower interior
- day and night
- narrowest and widest class/equipment combination

Every screenshot must record profile, tile size, hero world height, camera zoom, CSS scale, coordinates and FPS. Use the same seed and camera/player position for fair comparison.

Finalists must also pass 1440 x 900, 1024 x 768 and 360 x 640.

Hard rejection:

- blur, shimmer, clipping, foot sliding or wrong y-sort
- door/corner snag or collision mismatch
- character lost against scenery
- touch UI covers player, door or interaction prompt
- nameplate/equipment/VFX alignment broken
- important state communicated by color only
- route, portal, shortcut or return spawn unreachable
- performance or memory regression above the measured budget

Score only profiles that pass hard gates:

- world-scale plausibility 25
- player/NPC readability 25
- navigation and travel feel 20
- interaction/collision 15
- mobile/accessibility 10
- performance 5

Winner must score at least 85/100 with no category below 80%. If finalists differ by 3 points or less, choose the simpler, crisper and lower-risk profile.

Run a small navigation test if possible: 3–5 people must locate the player, door, Guild, Hospital, Shop and Tower without instruction. Record time-to-locate, wrong turns, collision snags and readability rating.

## Phase S4 — Implement the decision

Only after the scale gate:

- centralize selected actor visual size, collider, interaction, camera and view presets in one documented config
- update Town, field, dungeon, boss, interior, NPC and remote-player consumers
- realign paper-doll, weapon overlay, aura, shadow, nameplate and VFX
- keep physics/network state stable unless an approved migration says otherwise
- build Aethergate production assets from its seven detailed references
- register every production asset's dimensions, hash, consumer, source/tool, prompt/author, license and provenance
- use lazy zone loading, atlas/culling/chunks and exclude dev galleries/scale lab from production
- update ART_BIBLE, AETHERGATE_TOWN_BUILD_SPEC and MAP_SCALE_DECISION with the chosen values and rejected alternatives

Then continue through MOCKUP_MANIFEST region order. Each map must use the approved world-unit contract but may choose an evidence-based size class.

## Required verification

- unit/integration tests, typecheck and production build
- reachability/no-soft-lock, portal/return spawn and save/reload
- all class/gender/equipment combinations
- keyboard, touch, remap and reduced motion
- desktop and 390 x 844 minimum; 360 x 640 smoke test
- no missing texture, fake service, console error or monolithic mockup texture
- measured FPS/memory/zone-load compared with baseline

Output discipline:

- Be concise; reference files instead of repeating their contents.
- Start with S0, create the greybox/scale lab and gather evidence; do not stop after writing a plan.
- Do not mass-build 32 maps before choosing a scale winner.
- Report exact measurements, screenshot paths, chosen/rejected reasons, files changed, tests and remaining risks.
- Update docs/MAP_BUILD_STATE.md so the next session continues without repeating the audit.

## END PROMPT
