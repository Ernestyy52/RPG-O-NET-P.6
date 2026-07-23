# Aethergate Town — Home Hub Build Spec

เอกสารนี้เป็นทั้ง design contract และ prompt context สำหรับ Claude Code ในการเปลี่ยนภาพ mockup เป็นเมืองเกิดที่เล่นได้จริง โดยรักษาระบบเดิมและไม่สร้างบริการปลอม

## เป้าหมายประสบการณ์

Aethergate ต้องเป็น “บ้าน” ของผู้เล่น:

- จากจุดเกิดถึงลานกลางใช้เวลาเดินประมาณ 20–30 วินาที
- ผู้เล่นมองเห็น Guild, Hospital, Shop และ Tower landmark ได้เร็ว
- เดินเป็นวงรอบเมืองได้และมีทางตัดกลับลานกลาง
- ทุกครั้งที่กลับมีข้อมูลหรือกิจกรรมที่มีความหมาย แต่ไม่ใช้ FOMO หรือลงโทษคนที่ไม่ได้เข้าเกม
- ความเปลี่ยนแปลงของเนื้อเรื่องปรากฏผ่านธง ถ้วยรางวัล ตลาด เทศกาล NPC และการบูรณะเมือง
- อาคารทุกหลังมีหน้าที่ชัด ไม่ใช่ประตูที่เปิดเมนูว่าง

## ภาพอ้างอิง

| ไฟล์ | ใช้เพื่อ |
|---|---|
| [Town map](aethergate-town-map.png) | composition, district, landmark, main loop, spawn และ service placement |
| [Building exteriors](aethergate-building-exteriors.png) | facade/roof/sign language ของอาคาร 12 หลัง เรียง 4 x 3 |
| [Outdoor assets](aethergate-outdoor-assets.png) | terrain, water, plaza, gardens, navigation และ return-hook props |
| [Core interiors](aethergate-interiors-core.png) | Guild, Hospital, General Shop, Forge, Academy, Inn เรียง 3 x 2 |
| [Progression interiors](aethergate-interiors-progression.png) | Job Hall, Tower Gatehouse, Bank, Tailor, Town Hall, Companion Lodge เรียง 3 x 2 |
| [Core interior assets](aethergate-interior-assets-core.png) | modular walls/floors/props ของ interior ชุดแรก |
| [Progression interior assets](aethergate-interior-assets-progression.png) | modular walls/floors/props ของ interior ชุดสอง |

ภาพทุกภาพเป็น concept reference เท่านั้น ห้ามใช้ contact sheet ทั้งภาพเป็น runtime texture หรือ crop แล้วถือเป็น production-ready tileset

## ผังเมือง

### South — Arrival

- player spawn, tutorial guide และประตูเมือง
- ทางกว้างตรงไป central plaza
- secret garden shortcut เปิดภายหลัง
- Companion Lodge และ Inn อยู่ใกล้จุดเกิดเพื่อให้เมืองรู้สึกอบอุ่น

### Center — Daily Heart

- fountain และ waystone เป็น visual anchor
- daily/adventure board แบบไม่มีข้อความฝังใน asset
- event stage, rotating market, seating และ shade
- พื้นที่กว้างพอสำหรับ NPC/event โดยไม่บังทางหลัก

### West — Adventure

- Adventurers' Guild
- Job Hall
- Forge & Craft Workshop

### East — Care and Commerce

- Hospital
- General Shop
- Bank & Storage
- Tailor & Wardrobe

### North — Knowledge and Legacy

- Academy & Library
- Town Hall & Chronicle Museum
- Tower of Echoes Gatehouse

### Outer Ring

- stream, bridges, recovery/reading gardens
- field waystones/exits 4 ทิศ
- loop path ไม่มี service alley ที่เป็น dead end
- decorative stairs ต้องมี ramp route ที่เทียบเท่า

## อาคาร 12 หลังและเหตุผลให้กลับมา

| # | อาคาร | Stable ID / compatibility | เหตุผลที่กลับมา | สถานะระบบ |
|---|---|---|---|---|
| 1 | Adventurers' Guild | reuse guild, town:guild, guildmaster | daily/adaptive expedition, party, quest, trophies | มีระบบจริง; ต้องรักษา quest hooks |
| 2 | Brightleaf Hospital | reuse hospital, town:hospital, healer | ฟื้น HP/MP, recovery garden, learning reflection | มีระบบจริง; UI ต้องบอกค่าใช้จ่าย |
| 3 | General Goods Shop | reuse item-shop, town:item-shop | consumable, rotating stock แบบไม่ FOMO, supply quest | มีระบบร้าน; อย่าลบ forest_ranger quest data |
| 4 | Forge & Craft Workshop | reuse equipment-shop, town:equipment-shop, blacksmith | equipment, crafting, upgrade, material orders | ร้านมีจริง; ต้องเชื่อม CraftModal อย่างถูกต้อง |
| 5 | Academy & Library | new academy-library; reuse existing study data | mastery review, lessons, reading, Chronicle study | ย้าย/เปิดทางเข้าระบบเดิม ห้ามทำ study state ซ้ำ |
| 6 | Hearthsong Inn & Tavern | new hearthsong-inn | rested bonus, party meeting, rumors, player room | ต้องสร้างระบบจริงก่อนเปิดบริการเต็ม |
| 7 | Job Hall | new job-hall; wrap existing job/skill tree | class quest, build planning, skill reset/training | reuse chooseJob และ JOB_UNLOCK_LEVEL เดิม |
| 8 | Tower of Echoes Gatehouse | preserve town:portal; add town:endless-tower | campaign gate, party prep, endless runs, ascension | ต้องมี portal สองเส้นทาง ห้าม relabel ของเดิม |
| 9 | Bank & Storage | new bank-storage | storage, loadout, safe item organization | ยังไม่มี domain; ปิดแบบมีคำอธิบายจน state/migration พร้อม |
| 10 | Tailor & Wardrobe | new tailor-wardrobe | equipment appearance, dye, saved looks | ต้องมี layered appearance pipeline ก่อนเปิด |
| 11 | Town Hall & Chronicle | new town-hall-chronicle | story replay, regional trophies, restoration progress | reuse adventure log/quest/secrets; ไม่สร้าง progress ซ้ำ |
| 12 | Companion Lodge | new companion-lodge | companion roster, bonding, training | ยังไม่มี companion domain; ห้าม fake interaction |

## Compatibility ที่ห้ามทำพัง

ระบบปัจจุบัน:

- ผู้เล่นใหม่เข้า TownScene ด้วย currentFloor = 1
- เมืองเดิมใช้ public/town-art/town-night.png และ SLICES ไม่ใช่ tilemap
- interior เดิมมี 4 IDs: guild, hospital, item-shop, equipment-shop
- world nodes เดิม: town, interior:guild, interior:hospital, interior:item-shop, interior:equipment-shop, tower
- NPC IDs ที่ต้องรักษา: guildmaster, portal_guardian, blacksmith, forest_ranger, healer
- portal เดิมใช้ town:portal แล้วเข้า TowerScene แบบ floor + 1
- test/town-interiors.spec.ts ล็อก exact four IDs อยู่

ข้อบังคับ:

1. อย่านำพิกัด ZONES/SLICES เดิมไปวางบนภาพใหม่ เพราะ composition เปลี่ยนทั้งหมด
2. รักษา adapter สำหรับ 4 interiors เดิมระหว่าง migration
3. ขยาย InteriorSpec จากห้อง/NPC/service เดียวเป็น npcs[], interactions[], exits[] และ rooms/floors โดยไม่ทำให้ของเดิมเสีย
4. เพิ่ม world graph edge ไป-กลับ town ให้ทุก interior และให้ validateWorldGraph ผ่าน
5. เพิ่ม stable zoneId/spawnId แล้ว migrate save; ห้ามพึ่ง currentFloor อย่างเดียว
6. Guild และ campaign portal ต้องยัง dispatch talk-npc/quest hooks เดิม
7. เพิ่ม shopkeeper ใหม่ได้ แต่ห้ามลบ forest_ranger หรือย้าย quest โดยไม่มี migration
8. menu shortcut ที่เปิดจาก HUD ต้องใช้ service เดียวกับอาคาร หรือประกาศชัดว่าเป็น accessibility shortcut; ห้ามมีสอง implementation ที่ให้ผลต่างกัน

## Tower Gatehouse Contract

Gatehouse มี portal สองแบบ:

1. Campaign/Story Portal
   - รักษา town:portal, portal_guardian และ quest chain เดิม
   - ใช้จน campaign zone migration เสร็จ

2. Endless Tower Portal
   - event ใหม่ town:endless-tower
   - lock จนผ่าน postgame unlock
   - เข้า Endless Tower run state แยกจาก currentFloor
   - มี return-to-town ที่ checkpoint/sanctuary และหลังจบ run
   - ห้ามแก้ setFloor clamp หรือเปลี่ยนชื่อ legacy tower แล้วอ้างว่า endless เสร็จ

## Interior Contract ร่วม

ทุก interior ต้องมี:

- stable interior ID, entry spawn และ return spawn
- bottom/obvious exit ที่เดินกลับเมืองได้ตลอด
- NPC/service position ไม่ขวางทาง
- circulation loop หรือ turnaround ที่ไม่ติด furniture
- interaction clearance อย่างน้อยหนึ่ง tile
- protected feedback/reading area
- foreground/depth layers และ collision ตรง silhouette
- service, optional interaction, ambient prop และ landmark
- seasonal/progress sockets ที่ไม่เปลี่ยน collision
- keyboard/touch focus, readable prompt และ reduced-motion state
- audio ambience ที่ไม่ซ้อนเมื่อเข้า-ออก

## Return Loop ที่ไม่บังคับ

- Daily Adventure เลือก 10/20/30 นาทีจาก Guild
- rested bonus จาก Inn แทนการลงโทษ streak
- mastery review ที่ Academy เลือกได้ตามจุดอ่อน/ข้อถึงเวลาทบทวน
- rotating market เปลี่ยนบรรยากาศและของใช้ทั่วไป แต่ของสำคัญต้องมีทางได้แบบถาวร
- Forge orders และ town restoration ใช้ของจากการสำรวจโดยมี deterministic progress
- Chronicle แสดงผลเนื้อเรื่องและเปิด replay โดยไม่ทำให้เนื้อหาหายตาม season
- Tower milestones เพิ่มถ้วยรางวัล/แสง/ธงในเมือง
- NPC dialogue เปลี่ยนตาม region progress และจำเหตุการณ์สำคัญ

## Implementation Phases

### A0 — Audit and migration contract

- บันทึก baseline ของ TownScene, events, world graph, saves, quests และ tests
- สร้าง Aethergate zone spec และ coordinate plan จาก mockup โดยไม่ hardcode จนตรวจขนาดจริง
- สร้าง asset registry/provenance สำหรับ production tiles/props

Gate: build/tests เดิมผ่านและ compatibility mapping ได้รับการบันทึก

### A1 — Exterior vertical slice

- สร้าง town ground/path/water/collision/depth
- วาง spawn, central plaza, Guild, Hospital, Shop, Forge และ campaign portal
- เชื่อม 4 interiors เดิมผ่าน adapter
- เพิ่ม loop, shortcut, ramps, garden และ return spawn

Gate: fresh save เดิน spawn → plaza → อาคารทั้ง 4 → town ได้; quest hooks เดิมทำงาน; no soft-lock

### A2 — Rebuild four existing interiors

- ใช้ core interior mockup/assets
- Guild รองรับหลาย NPC/interactions และ study staircase
- Hospital/Shop/Forge รักษาผลบริการเดิม
- แยก service logic ออกจากภาพและ scene coordinates

Gate: save/reload ทุก interior, service result, gold/reward และ exit ถูกต้อง

### A3 — Real new services

- Academy เปิด existing study/mastery data
- Job Hall เปิด existing job/skill tree
- Chronicle แสดง existing quest/adventure/secrets
- Inn เปิดเมื่อ rested/room/party functions ทำงานจริง

Gate: ไม่มี duplicate state และไม่มี UI ปลอม

### A4 — Endless Gatehouse

- สร้าง separate endless run state, unlock, return path และ checkpoint integration
- รักษา campaign portal จน migration จบ

Gate: campaign quest และ endless run ไม่แก้ state ของกันและกัน

### A5 — Future services

- Bank หลัง inventory storage, transaction, save migration และ server authority พร้อม
- Tailor หลัง appearance layers เปลี่ยน sprite จริงทุกทิศ/animation
- Companion Lodge หลัง companion domain, save และ UI พร้อม

Gate: อาคารที่เปิดทุกหลังให้ผลจริง; อาคารที่ยังไม่พร้อมใช้ honest locked-state dialogue ไม่มีปุ่มหลอก

### A6 — Living town polish

- day/evening lighting, ambience, market and festival state
- NPC schedules, story-reactive props, trophies and restoration
- culling, atlas, lazy load, mobile and accessibility pass

Gate: กลับเมือง 3 ช่วง progress แล้วเห็น/ได้ยินความเปลี่ยนแปลงที่มีความหมาย โดย performance ไม่ตก

## Acceptance Criteria

- 12 exteriors มี silhouette/sign/door ต่างกันและหาได้จาก plaza
- interior ทุกหลังมีทางกลับ town และ world graph ไม่มี dead end
- spawn ถึง plaza ไม่เกินเป้าหมาย 20–30 วินาทีในการเดินปกติ
- main services เข้าถึงได้โดยไม่ต้องวนเกินครึ่งเมือง
- quest, NPC และ event IDs เดิมไม่หาย
- campaign portal และ Endless Tower portal แยก state ชัด
- save/reload รักษา zone, spawn, quest, shortcut และ claimed reward
- ไม่มี missing texture, placeholder, fake service, silent button หรือ console error
- ผ่าน 390 x 844 touch, keyboard/remap, readable prompts, reduced motion และ color-independent cues
- ภาพ production เป็น original 16px-native modular assets พร้อม provenance ไม่ใช่ contact-sheet crop

## คำสั่งเริ่มงานสำหรับ Claude Code

Read this spec, ../../../WORLD_MAP_BIBLE.md, ../../../ART_BIBLE.md, ../../MOCKUP_MANIFEST.md and all seven Aethergate PNG references. Audit the current TownScene/interior/events/world-graph/save/quest code first. Then implement phase A0 and the smallest complete A1 vertical slice without stopping at a plan. Preserve the four legacy interior IDs, NPC IDs and quest hooks through an adapter. Never load a contact sheet at runtime. Build original modular 16px assets, register provenance, validate reachability and save/reload, run relevant tests/build, update docs/MAP_BUILD_STATE.md with evidence, and do not start the next phase until the current gate passes.
