# BASELINE — RPG-O-NET P.6 (Phase 00)

> Snapshot of the repository as found at the start of the S-grade transformation.
> Purpose: a reproducible, factual reference. No gameplay redesign is recorded here.

- **Date captured:** 2026-07-12
- **Integration branch:** `foundation/sgrade-full-transformation`
- **Baseline commit:** `64a26d6` (router install) on top of `33a2815` "Per-biome procedural dungeon/boss floor tiles"
- **Backup tag:** `backup/pre-transformation-20260712-162236`
- **In-game title:** *SPIRAL'S ECHO: THE FLOATING REALMS* (repo name: RPG-O-NET-P.6)

## 1. Stack (as built)

| Layer | Technology | Notes |
|---|---|---|
| App framework | Nuxt `4.4.8` (SPA, `ssr: false`) | `nitro.preset: 'static'`, static export for GitHub Pages |
| Game engine | Phaser `4.2.0` | mounted via `GameCanvas.client.vue`, 640×480 viewport, `Scale.FIT` |
| State/save | Pinia `3.0.4` + `pinia-plugin-persistedstate 4.7.1` | single `player` store → localStorage key `player` |
| Styling | Tailwind (`@nuxtjs/tailwindcss 6.14`) | pixel/ornate theme in `app/assets/css/main.css` |
| Realtime (optional) | `colyseus.js 0.15` client + `server/` Colyseus server | client-authoritative movement (prototype) |
| Event bus | `mitt 3.0` | `app/game/systems/eventBus.ts` typed events |
| Image tooling | `sharp 0.35` (devDep) | asset baking scripts |

**Node scripts:** `build` (`nuxt build`), `dev` (`nuxt dev`), `generate` (`nuxt generate`), `preview` (`nuxt preview`), `postinstall` (`nuxt prepare`). **No test script and no test framework are configured** (addressed in Phase 03).

## 2. Source layout (`app/` is Nuxt srcDir)

- **Total app source:** ~6,143 LOC across `.ts` + `.vue`.
- **Pages:** single `app/pages/index.vue` (306 LOC) — title screen, character creation, and the whole in-game HUD/modal shell.
- **Game (Phaser):**
  - `game/createGame.ts` — boots Phaser, registers `TownScene`/`TowerScene`/`BossScene` with `autoStart:false`, starts one.
  - `game/scenes/` — `TowerScene.ts` (471), `TownScene.ts` (298), `BossScene.ts` (249).
  - `game/systems/` — `textures.ts` (494, real sprite loading + biome baking), `buildingArt.ts` (464), `atmosphere.ts` (310), `net.ts` (147, Colyseus client), `remotePlayers.ts` (93), `eventBus.ts` (30), `bgm.ts` (29).
- **Components:** `app/components/game/*` — `Hud.vue` (312), `BattleModal.vue` (246, turn-based Q&A combat), plus Status/Quest/Map/Log/System/Shop/SkillTree/Guild/Craft/Town/Portal/BossGate modals, `GameCanvas.client.vue`.
- **Stores:** `player.ts` (305), `settings.ts`.
- **Data (`app/data/`):** biomes, floors, classes, skills, equipment (275), study (245), quests, loot, world, monsterThemes, bossRequirements, branding, questions (loader).
- **Composables:** `useSheetsSync.ts` (Apps Script backend calls).

## 3. Content & knowledge

- `data/questions.json` (root) — **69 questions** loaded by `app/data/questions.ts` (shuffle-bag per CEFR level).
- `knowledge/` — O-NET pattern base (`knowledge_base.json`, `manifest.json`, `analyzed/`, `README.md`). Pattern-only; used to generate into `data/questions.json`. **Never edit `app/data/questions.ts` directly.**
- `docs/AI_Development_Bible_V2/` — 29 design docs (00_VISION … 28_RELEASE) that serve as the effective design bible (see §7).

## 4. Backend / services

- `server/` — standalone Colyseus server (`server/index.js`). Town room broadcasting player position/facing/status; **movement trusted from client** with clamp + rate-limit only. Own `package.json`/`node_modules`. See `docs/multiplayer.md`.
- Google Apps Script backend (`scripts/apps-script/`) for save/load + leaderboard via `NUXT_PUBLIC_SHEETS_API_URL`.
- Config via `runtimeConfig.public`: `sheetsApiUrl`, `colyseusUrl` (empty ⇒ offline single-player).

## 5. Build state (measured 2026-07-12)

- `npm run build` → **exit 0**. Client built in ~13,992ms, server ~44ms. Prerendered 4 routes in ~1.97s. Output `.output/public` ≈ **24 MB**.
- Benign warnings only: module-preload-polyfill sourcemap note, Vite chunk-size warning, nitro `cache-driver` external-dependency note. None block the build.

## 6. Save model (as found)

Single monolithic Pinia store `player` persisted whole to localStorage. State fields: identity (`isAuthenticated`, `accountName`, `characterCreated`, `name`, `gender`, `classId`, `appearance`), progression (`level`, `exp`, `gold`, `gems`, `currentFloor`, `skillPoints`, `learnedSkills`), combat (`hp`, `mp`), economy (`inventory`, `equipment`), learning (`correctAnswers`), log (`adventureLog`), dailies (`dailyDate`, `dailyQuests`). **No `version` field / migration path.** Only guard is `afterHydrate` clamping `hp`/`mp` to computed maxes. This is the primary Phase 04 target.

## 7. Design foundation reference

The referenced `RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md` is **absent from disk** (documented as an assumption/known gap — see DECISION_LOG). The authoritative design intent is taken from: the 24-phase roadmap in `RPG_ONET_CLAUDE_CODE_FULL_AUTONOMOUS_EXECUTION_PROMPT_TH.md`, and `docs/AI_Development_Bible_V2/` (VISION, CORE_LOOP, COMBAT, LEARNING, ONET, CLASSES, ITEMS, WORLD, QUESTS, MONSTERS, BOSSES, ARCHITECTURE, SAVE_SYSTEM, TESTING, etc.).
