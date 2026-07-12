# CURRENT RUNTIME FLOW (Phase 00)

Factual trace of how the game currently runs. No proposed changes here.

## 1. Boot & auth

1. `app/app.vue` → `app/pages/index.vue` renders. Pinia stores `player` (persisted) and `settings` hydrate from localStorage.
2. If `!player.isAuthenticated` → **title screen** (*SPIRAL'S ECHO*). Login/Register/Continue/Guest all call `player.login(name)` (no real auth; `Register`==`login`). Guest logs in as "Guest".
3. After login, if `!player.characterCreated` → **character creation** (name, gender, face, hair, color, class ∈ warrior/mage/archer/guardian). `finishCharacter()` → `player.createCharacter(draft)` then `savePlayer()` (Sheets sync, best-effort).
4. Once `characterCreated` → in-game shell: `GameHud`, `GameCanvas` (Phaser), bottom nav bar, currency panel, and all modals.

## 2. Phaser lifecycle

- `GameCanvas.client.vue` calls `createGame(parent, startFloor, classId)`.
- `createGame` builds a 640×480 `Phaser.Game` (`pixelArt`, `Scale.FIT`, arcade physics no gravity), registers `TownScene`/`TowerScene`/`BossScene` with `autoStart:false`, then `scene.start(isTownFloor(floor) ? 'TownScene' : 'TowerScene', { floor, classId })`.
- **Known prior bug (fixed):** scenes must NOT be passed in the Phaser config `scene` array — Phaser auto-starts the first, causing TownScene+TowerScene to run simultaneously (double physics/update). Comment preserved in `createGame.ts`.

## 3. Exploration → combat loop

1. In `TowerScene` the player walks a tiled floor; monsters spawn/respawn (~10s). Collision with a monster body emits `battle:start` (`EncounterInfo`) on the `mitt` event bus.
2. `BattleModal.vue` opens: **turn-based English-question combat**. Correct answers deal damage / advance; `player.recordCorrectAnswer()` (+2 MP, quest progress), `recordDefeat()` on kill. Wrong answers let the monster hit (`player.takeDamage`). Rewards via `player.gainRewards(exp, gold, gems)` with in-store level-up loop.
3. `battle:end { won, isBoss }` closes the modal and returns control to the scene.
4. Reaching stairs/exit emits `floor:advance` → `player.advanceFloor()` (+quest 'climb'), log, `savePlayer()`.

## 4. Town, boss, portals

- `TownScene` interactions emit: `town:hospital` (heal, gold cost), `town:item-shop` / `town:equipment-shop` (open `ShopModal`), `town:guild` (GuildModal), `town:portal { floor }` (PortalModal), `town:enter-dungeon`.
- Boss flow: walking into a boss door emits `boss:gate { floor }` → `BossGateModal` shows requirements (`data/bossRequirements.ts` + `describeMissingRequirements`). Meeting them + entering emits `boss:enter` → `BossScene` (dedicated arena, exit portal).
- `notice { text }` → transient toast in `index.vue` (3.2s, cleared via timer).

## 5. State & persistence

- All progression mutations go through `usePlayerStore` actions; `stats` getter composes class base + growth×level + learned-skill stats + equipped-item stats.
- Persistence: `pinia-plugin-persistedstate` writes the whole `player` state to localStorage key `player` on change. `afterHydrate` clamps `hp`/`mp` to computed max. Optional `savePlayer()` pushes `player.$state` to Apps Script.
- `settings` store persists sound / reducedMotion / language.

## 6. Multiplayer (optional, off by default)

- If `NUXT_PUBLIC_COLYSEUS_URL` is set, `game/systems/net.ts` connects; `remotePlayers.ts` renders other players in town. Movement is client-reported (server clamps + rate-limits only). Empty URL ⇒ pure offline play.

## 7. Event bus contract (`eventBus.ts`)

`battle:start`, `battle:end`, `floor:advance`, `town:hospital`, `town:item-shop`, `town:equipment-shop`, `town:guild`, `town:portal`, `town:enter-dungeon`, `boss:gate`, `boss:enter`, `notice`. This is the current seam between Phaser scenes and the Vue/Pinia layer — a key integration boundary for later phases.
