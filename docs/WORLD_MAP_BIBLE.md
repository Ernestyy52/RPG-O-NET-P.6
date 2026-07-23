# WORLD_MAP_BIBLE — SPIRAL'S ECHO

> แผนที่ทั้งหมดของ campaign 6 ภูมิภาค + Tower of Echoes (โหมดเสริม)
> สถานะ: ✅ เล่นได้จริง · 🔨 บางส่วน · ⬜ ยังไม่เริ่ม
> กติกา: จบ region ให้ final ก่อนขยาย — ห้ามครึ่งสำเร็จหลายภูมิภาคพร้อมกัน

## สถานะ implementation ปัจจุบัน (Tower-first legacy)
เกมปัจจุบันเดินบน TowerScene (ชั้น 1–100, ไบโอมวนทุก 10 ชั้น) + TownScene (hub + 4 interiors)
+ DungeonScene (`world01-mini` fl.5, `world01-main` fl.10) + BossScene (Myco Colossus)
World-1 = ชั้น 1–10 (realtime combat + Knowledge Break + main quest 12 ขั้น + 9 side quests + 3 secrets)
→ Phase 2 จะยกเป็น `ZoneDefinition` data-driven แล้ว campaign maps ทั้งหมด reuse runtime เดียว

## Region 1 — Verdant (World 1) · Learning: Vocabulary/Conversation/Reading/Grammar พื้นฐาน
| Map | Biome/Type | เชื่อมต่อ | สถานะ |
|---|---|---|---|
| Aethergate Town | hub — Guild/Job/Study/shop/crafting | ↔ ทุก field W1 | 🔨 (TownScene + 4 interiors, ยังผูกกับ floor) |
| Whisperwood | ป่าฝน / field | Town ↔ Gelwater Fen | 🔨 (คือ fl.1–4 เดิม) |
| Gelwater Fen | ที่ชุ่มน้ำ / field | Whisperwood ↔ Grotto | ⬜ |
| Rootbound Grotto | mini dungeon + sub-boss | Fen ↔ Archive | 🔨 (`world01-mini`) |
| Ruined Archive | Reading + environment puzzle | Grotto ↔ Plateau | ⬜ |
| Stormgrass Plateau | พายุ / field | Archive ↔ Citadel | ⬜ |
| Echo Citadel | final dungeon + region boss | Plateau (ทางออก → Region 2) | 🔨 (`world01-main` + Myco Colossus) |

เป้า Phase 3: เล่น 45–60 นาที, onboarding 3–5 นาที, 5 enemy archetypes
(charger/caster/healer/shield/trickster), landmark/loop/shortcut/secret ทุก map, final art/audio

## Region 2 — Sunveil Coast · Learning: daily conversation, shopping, directions, schedules
Copperwind Outpost (hub) → Saffron Dunes (desert, heat/shade) → Mirrormere Oasis →
Mangrove Reach (tide/water route) → Buried Sun Temple (dungeon, sandstorm visibility) — ทั้งหมด ⬜

## Region 3 — Emberfrost Highlands · Learning: instructions, tense, comparison, sequencing
Emberhaven (hub) → Ashen Steppe (lava cycles) → Basalt Foundry (forge machinery) →
Glacier Pass (ice movement) → Crown of Winter (warmth shelters, boss) — ⬜

## Region 4 — Mycelial Gloam · Learning: cause/effect, conditionals, context
Sporewood (spores) → Miresong Marsh → Lumencap Caverns (light/shadow) →
Haunted Archive → Mycelium Sanctum (corruption/cleanse, boss) — ⬜

## Region 5 — Skyclock Meridian · Learning: inference, systems, long reading
Skyhold (hub) → Zephyr Meadows (wind routes) → Broken Observatory →
Brassward (moving machinery) → Tempest Engine (power routing + relaxed alternative, boss) — ⬜

## Region 6 — Astral Rift · Learning: mixed capstone
Last Observatory → Starfall Expanse → Memory Constellation (remix ระบบเดิม) →
Celestial Approach → Nexus (final dungeon/boss + player choice) — ⬜
ต้องมี: ending, credits, post-game world state; final boss ใช้ class build + mastery;
ไม่มี reaction-speed gate กีดกันผู้อ่านช้า

## Tower of Echoes (optional endgame)
- Launch = **30 curated floors** (checkpoint ทุก 5, boss ทุก 10) — remix biome/mechanic
  จากภูมิภาคที่ผ่าน + adaptive questions จาก weak/due mastery
- ปัจจุบัน: TowerScene 100 ชั้น formula-scaled (`floors.ts`, `FLOOR_VARIETY` seeded) —
  จะ curate 30 ชั้นแรกใน Phase 8; แพ้ใน Tower ไม่ทำ campaign ถอย
- ขยายเกิน 30 เฉพาะเมื่อ encounter/question pool ผ่าน anti-repeat gate — ห้าม recolor filler

## Validators ที่ทุก map ต้องผ่าน (Phase 2 engine)
portal/exit/quest reachable · spawn ไม่ทับ collision/safe zone · no soft-lock (BFS พิสูจน์แล้วใน
`dungeonLayouts.ts` — ขยายไปทุก zone) · save/reload ทุก spawn · fast travel เมื่อค้นพบ waystone
