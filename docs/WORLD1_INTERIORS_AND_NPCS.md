# World 1 Interiors and NPC Ownership

World 1 uses physical NPC ownership for all actions that change game state. The HUD is a navigation and tracking surface; it is not a remote service counter.

## Player-facing rule

- Character and Journal may be opened anywhere.
- Explore shows directions and activity progress only.
- Quests, hunt contracts, rewards, shops, crafting, healing, travel, wardrobe changes, and lessons require the player to walk to the owning NPC.
- Returning from an interior places the player outside the matching door trigger, so a single input cannot immediately re-enter the building.

## Service ownership

| Building | NPC | Owned action |
| --- | --- | --- |
| Guild 1F | Guildmaster Mara | Accept and turn in quests |
| Guild 1F | Warden Rook | Regional hunt contracts and rewards |
| Guild 1F | Officer Lyra | Elite Hunt, Rare Spawn, and Daily Rift |
| Guild 2F | Five academy tutors | O-NET lessons by skill room |
| General Goods | Wren | Consumable shop |
| Blacksmith | Borin | Equipment shop |
| Blacksmith | Toma | Crafting |
| Hospital | Sena | Recovery |
| Gatehouse | Kael | World and tower travel |
| Tailor | Vela | Wardrobe and paper-doll equipment view |
| Inn | Hearthsong keeper | Free rest and recovery |
| Library, Town Hall, Shrine | Local keeper | Lore and guidance |

## Guild Academy 2F

The Academy is entered from the staircase inside Guild 1F. Its five walkable rooms map the O-NET material in `knowledge/` to focused tutors:

1. Grammar and sentence structure
2. Reading comprehension
3. Exam strategy, charts, and multi-condition prompts
4. Conversation and situational language
5. Vocabulary in context

The source analysis covers exam years 2558-2568 and 456 indexed items. Lesson completion is persisted and each lesson grants its mastery reward only once.

## Extension contract

1. Add the NPC catalog entry in `app/data/world1/npcs.ts`.
2. Add its service identifier to `app/data/town/services.ts` when it owns a new state-changing action.
3. Add the NPC and its coordinates to `app/data/town/interiors.ts`.
4. Route the interaction in `app/pages/index.vue`.
5. Keep global menu access read-only for that service.
6. Add an entry/return and service-ownership test in `test/town-npc-services.spec.ts`.

Door trigger geometry is centralized in `app/data/town/doors.ts`. New exterior doors should use the same small visible-door rectangle and must return the player outside that rectangle.
