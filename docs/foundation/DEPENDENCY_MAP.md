# DEPENDENCY MAP (Phase 01)

Current coupling between modules (observed statically at baseline). Arrow = "imports/depends on".

## High-level

```
pages/index.vue ──┬─> stores/player, stores/settings
                  ├─> data/branding, data/classes, data/bossRequirements
                  ├─> composables/useSheetsSync
                  └─> game/systems/eventBus  (mitt)
                          ▲
components/game/GameCanvas.client.vue ─> game/createGame ─> game/scenes/{Tower,Town,Boss}
components/game/BattleModal.vue ──> game/systems/eventBus
                                └─> stores/player
                                └─> data/{floors, questions, world, loot}
game/scenes/TowerScene ──> game/systems/{textures, atmosphere, buildingArt, eventBus, net}
game/systems/net ──> colyseus.js ──> (server/ Colyseus)
stores/player ──> data/{classes, equipment, quests, skills}
data/questions ──> data/questions.json (root)
```

## Key seams (integration points)

- **eventBus (mitt):** the only decoupled seam between Phaser scenes and Vue/Pinia. All battle/town/boss/floor/notice traffic flows here. → hardens into TypedGameBridge.
- **stores/player:** central hub imported by UI + combat modal. High fan-in → split into domain stores (Phase 04) to reduce coupling.
- **data/*:** mostly leaf modules (pure data + small helpers); safe to extend. `questions.ts` is the only one reading an external JSON.

## Coupling risks

- 🔴 **BattleModal ↔ player ↔ data/loot** tight triangle: combat outcome, reward grant, and loot roll all in the view layer. Extraction must keep a single source of the damage/reward formula (no duplication) — Phase 07 gate.
- 🟠 **index.vue fan-out:** subscribes to 8 event types and owns 13 modal refs; changes here ripple widely. Decompose into feature components + a small orchestrator composable.
- 🟠 **player store fan-in:** any schema split must ship a legacy adapter so existing imports keep working during migration (Phase 04).
- 🟡 **net/remotePlayers → server schema:** protocol is implicit (Colyseus `defineTypes`); add explicit protocol versioning before authoritative co-op (Phase 15/20).

## External dependencies

- Runtime: `phaser`, `vue`, `vue-router`, `pinia`, `pinia-plugin-persistedstate`, `mitt`, `colyseus.js`.
- Build/dev: `nuxt`, `@pinia/nuxt`, `@nuxtjs/tailwindcss`, `sharp`.
- Server: `colyseus`, `@colyseus/schema`, express stack (in `server/`).
- **To add (Phase 03):** `vitest` (+ `@vitejs/plugin-vue`/`happy-dom` only if component tests are needed; pure-logic tests need neither).
