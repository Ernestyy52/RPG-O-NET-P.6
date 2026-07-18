# Prompt สำหรับ Claude Code — สร้างทุกแผนที่จาก Mockup

คัดลอกข้อความตั้งแต่ BEGIN PROMPT ถึง END PROMPT ไปใช้กับ Claude Code

## BEGIN PROMPT

You are the senior game-world engineer and pixel-art pipeline owner for Spiral's Echo. Convert the approved concept references into production-ready, original, performant maps without copying any existing commercial game.

Read first:

- docs/GAME_CONTRACT.md
- docs/WORLD_MAP_BIBLE.md
- docs/ART_BIBLE.md
- docs/mockups/MOCKUP_MANIFEST.md
- docs/mockups/CLAUDE_CODE_MAP_BUILD_PROMPT.md
- the current map/zone, asset registry, save, quest, collision and test code

Goal:

Build the 32-map campaign plus a modular Endless Tower of Echoes. Preserve O-NET learning, existing working systems and unrelated user changes. Work phase-by-phase, but do not stop at planning: implement the current phase, test it, update state, then continue only when its gate passes.

Authority and naming:

- WORLD_MAP_BIBLE is canonical for map names/order.
- Region 1 is Verdant; mockup folder region-01-everbloom is only an alias.
- Region 6 final map is Nexus.
- Campaign region art overrides legacy five-biome Tower palettes within campaign scope.
- Tower must support curated launch content and postgame endless continuation through configuration; remove assumptions that force the product to be exactly 100 floors only.

Non-negotiables:

1. Mockup PNGs are concept references only. Never ship or load a whole contact sheet as a runtime tileset.
2. Rebuild original modular source assets at native 16px tile scale; display at integer 2x with nearest-neighbor.
3. Top-down 3/4 perspective, one light direction, clear collision silhouettes, foreground/background depth, and accessibility cues beyond color.
4. Never copy Ragnarok Online or another game's maps, sprites, UI, monsters, names, music, layouts or exact formulas.
5. Every production asset requires registry metadata: path, type, dimensions, bytes, hash, consumer, region/map, source/tool, author/prompt, license/provenance and status.
6. No placeholder may count as complete. No hidden setting, fake button, TODO, missing texture or silent interaction in a completed phase.
7. Do not rewrite stable architecture blindly. Audit, reuse and extend the existing data-driven runtime.

Persistent execution:

- Create or update docs/MAP_BUILD_STATE.md.
- Record current phase/map, files changed, tests/evidence, asset gaps, decisions, risks and exact next action.
- At the start of every session, read it and continue; do not repeat completed audits or regenerate approved assets.

Per-map design contract:

- memorable entrance and exit
- main loop plus at least one unlockable shortcut
- safe pocket where learning feedback cannot be interrupted by enemies
- danger landmark, optional secret and visually unique central landmark
- readable primary path plus optional risk/reward route
- encounter spaces with varied size/cover, not empty corridors
- environmental O-NET interaction suited to the region's learning theme
- return path/portal that never soft-locks the player
- deterministic spawn/collision/quest anchors and stable save IDs

Implementation phases:

Phase 0 — Audit and foundation

- Inventory existing zones, maps, tile sources, props, atlases, loaders, collisions, portals, quests, saves, audio and tests.
- Detect missing/unused/duplicate/oversized assets, atlas mismatch, bad casing and untracked provenance.
- Define or repair data-driven ZoneDefinition, asset dependency manifest, map validator and lazy zone loading.
- Define reusable tile contracts: ground, edge, wall, blocker, foreground, transition, prop, interaction, spawn, portal, secret and audio region.
- Establish measured performance budgets for desktop and 390 x 844 touch.

Gate: baseline build/typecheck/tests pass; one validator can prove spawn-to-objective-to-exit reachability; state file is current.

Phase 1 — Region 1 Verdant vertical slice

Order: Aethergate Town → Whisperwood → Gelwater Fen → Rootbound Grotto → Ruined Archive → Stormgrass Plateau → Echo Citadel.

- Use both Region 1 mockup boards as visual references.
- First finish Aethergate Town and Whisperwood end-to-end, including art, collision, portals, props, ambience, save/reload and mobile readability.
- Playtest the slice before expanding the remaining five maps.
- Keep fungal identity restrained here so Region 4 remains distinct.

Gate: a fresh save can travel Town → field → Town; landmark/shortcut/secret work; no missing assets or console errors.

Phase 2 — Sunveil Coast

Order: Copperwind Outpost → Saffron Dunes → Mirrormere Oasis → Mangrove Reach → Buried Sun Temple.

Unique mechanics: heat/shade, directions/schedules, oasis relief, tide/water routes and sandstorm visibility. Do not produce desert recolors of Verdant assets.

Phase 3 — Emberfrost Highlands

Order: Emberhaven → Ashen Steppe → Basalt Foundry → Glacier Pass → Crown of Winter.

Unique mechanics: lava cycles, machinery sequencing, ice movement with relaxed alternative, warmth shelters and strong warm/cold navigation contrast.

Phase 4 — Mycelial Gloam

Order: Sporewood → Miresong Marsh → Lumencap Caverns → Haunted Archive → Mycelium Sanctum.

Unique mechanics: spores, marsh routes, light/shadow, memory archive and corruption/cleanse. Moody scenes must remain readable; safe-route lights need shape cues, not color only.

Phase 5 — Skyclock Meridian

Order: Skyhold → Zephyr Meadows → Broken Observatory → Brassward → Tempest Engine.

Unique mechanics: wind routes, floating-island safety, gravity paths, moving machinery and power routing with a relaxed alternative. Void and walkable ground must be unmistakable.

Phase 6 — Astral Rift

Order: Last Observatory → Starfall Expanse → Memory Constellation → Celestial Approach → Nexus.

Unique mechanics: gravity bridges, six-region memory remix, capstone trials, final choice, ending/credits/postgame state and a clear gateway to Tower.

Phase 7 — Endless Tower of Echoes

- Build from the eight room archetypes and six asset groups in the manifest.
- Use compatible entrance/exit sockets, seeded generation, deterministic validation, difficulty budget and anti-repeat history.
- Room pool: arrival, combat, route choice, knowledge puzzle, treasure/curse, sanctuary, boss and ascension.
- A run must offer meaningful path choices; two consecutive runs must not use the same room/mechanic sequence.
- Checkpoint/sanctuary cadence is configurable. Preserve permanent mastery; separate permanent, run-only and seasonal progress.
- Scale difficulty through enemy composition, mechanics, route pressure and combined objectives, not HP inflation alone.
- Safe learning/feedback state pauses threats. Wrong answers must not cause enemies to attack while the learner reads feedback.
- Support 30 curated launch floors and postgame endless ascension without duplicating hundreds of hand-authored maps or hardcoding TOTAL_FLOORS = 100 as the only possible mode.

Per-region asset workflow:

1. Read map and asset boards in panel order from MOCKUP_MANIFEST.
2. Write a small asset plan before creating files: reusable base pieces, map-specific landmark pieces, transitions and animation/VFX/audio needs.
3. Reuse only when shape language and biome identity fit; never use recolor-only duplication.
4. Build modular source assets, atlas/optimize runtime copies, register provenance and add a dev gallery that is excluded from production.
5. Lazy-load by zone and release scene listeners/resources on exit.

Required validation for every map:

- entry, objective, quest anchors, shortcut, secret and exit are reachable
- no spawn overlaps collision, hazard or safe zone
- no one-way soft-lock unless an explicit return mechanism exists
- save/reload preserves map, position, quest, opened shortcut and claimed reward
- portals cannot duplicate rewards
- collision matches visible silhouettes; depth sorting and foreground occlusion are correct
- keyboard, touch and remap work; 390 x 844 remains readable
- no console error, missing texture, audio overlap or inaccessible color-only cue
- performance is measured, not guessed

Output discipline:

- Lead each phase with a short audit and exact files to change.
- Implement the smallest complete vertical slice, then run relevant tests/build and a manual playthrough.
- Fix failures before expanding scope.
- Report evidence: map IDs, screenshots or gallery entries, validator results, test/build results and measured performance.
- Update MAP_BUILD_STATE.md after each meaningful batch.
- Never claim 100% complete from file counts. State remaining risks and asset/content gaps honestly.

Start now with Phase 0. If Phase 0 already passes with evidence, continue from the first incomplete map in MAP_BUILD_STATE.md.

## END PROMPT
