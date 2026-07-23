# KEEP / REFACTOR / REPLACE MATRIX (Phase 01)

Audit-only. Classifies every existing system for the transformation. **KEEP** = preserve as-is; **REFACTOR** = keep behavior, restructure/extract; **REPLACE** = supersede behind a feature flag with an adapter; **ADD** = net-new.

| System | File(s) | Verdict | Rationale / target phase |
|---|---|---|---|
| Nuxt 4 SPA + static export | `nuxt.config.ts` | **KEEP** | Solid, GitHub-Pages friendly. baseURL discipline stays. |
| Phaser boot & scene registration | `game/createGame.ts` | **KEEP/REFACTOR** | Boot is fine; add ZoneLoader-based runtime alongside (Phase 08). Keep autoStart:false fix. |
| `TowerScene` exploration | `game/scenes/TowerScene.ts` | **REFACTOR→REPLACE** | Split movement/collision/spawn/interaction into systems (Phase 08). Legacy scene stays behind flag until World 1. |
| `TownScene` / `BossScene` | `game/scenes/*.ts` | **REFACTOR** | Keep as content; migrate onto new systems incrementally. |
| Texture/atmosphere/building art | `game/systems/{textures,atmosphere,buildingArt}.ts` | **KEEP** | Real asset pipeline is an asset. Feed the new AtmosphereSystem (Phase 08/14). |
| Event bus (mitt) | `game/systems/eventBus.ts` | **REFACTOR** | Becomes the TypedGameBridge contract; widen event set, keep typed. |
| **Combat (turn-based Q&A)** | `components/game/BattleModal.vue` | **REFACTOR→REPLACE** | Formulas (`heroDamage`, `monsterAttack`, rewards, loot) extracted to a pure combat domain (Phase 07); real-time action-lite combat replaces the modal behind a flag (Phase 09). Legacy modal kept via adapter. |
| Player store (monolithic) | `stores/player.ts` | **REFACTOR** | Split into profile/character/learning/session/inventory/quest/settings domains + versioned SaveEnvelope (Phase 04). Legacy store retained until compat passes. |
| Persistence (persistedstate) | `stores/*` persist | **REFACTOR** | Wrap in migration registry + backup + corruption recovery (Phase 04). |
| Classes (stat blocks only) | `data/classes.ts` | **REFACTOR/ADD** | Keep stat identity; ADD 4-skill kits, unique basic attacks, resources (Phase 12). |
| Skills tree | `data/skills.ts` | **REFACTOR** | Move from flat-stat nodes toward behavior-changing skills (Phase 12). |
| Questions (loader + 69 items) | `data/questions.ts`, `data/questions.json` | **KEEP/REFACTOR** | Keep content; ADD typed schema, status (draft/reviewed/retired), provenance, validation pipeline (Phase 05). Adapter preserves current questions. |
| Knowledge base | `knowledge/` | **KEEP** | Pattern-only source for generating reviewed questions. |
| Floors/biomes/world scaling | `data/{floors,biomes,world}.ts` | **KEEP** | Reusable difficulty/scaling; feed World 1 slice (Phase 14). |
| Equipment/loot/craft | `data/{equipment,loot}.ts` | **REFACTOR** | Add affixes/sockets/Sigils/pity + reward idempotency (Phase 13). |
| Daily quests | `data/quests.ts` | **REPLACE** | Shallow counters → adaptive Daily Expeditions via adapter (Phase 11). |
| Boss requirements/gate | `data/bossRequirements.ts` | **KEEP** | Gate pattern reused for readable boss phases. |
| Colyseus town server | `server/index.js` | **REFACTOR→REPLACE** | Prototype presence stays; authoritative co-op/services added (Phases 15, 20). |
| Sheets sync | `composables/useSheetsSync.ts` | **KEEP** | Optional report destination (Phase 16). |
| HUD & modals | `components/game/*` | **REFACTOR** | Decompose `index.vue` god-component; keep visual theme. |
| Settings store | `stores/settings.ts` | **KEEP/ADD** | Add accessibility (reduced motion/flash, reading time) (Phase 17). |
| Tests | — | **ADD** | Vitest pure-logic foundation + diagnostics (Phase 03). |
| Learning mastery/spaced review | — | **ADD** | New domain (Phase 06). |
| Teacher mode/reports | — | **ADD** | New (Phase 16). |

## Non-negotiables carried through every verdict
- Learning mastery stays separate from combat power.
- No unreviewed question reaches production.
- Rewards are server/domain-validated and idempotent; never trusted from UI.
- No permanent death, paid loot box, gambling, punitive streak, or pay-to-win.
- Asset paths always via `assetPath()`/`app.baseURL`.
