# Spiral's Echo — Map Mockup & Asset Manifest

สถานะ: ภาพอ้างอิงก่อนผลิต (concept reference) สำหรับแคมเปญ 32 แผนที่และ Endless Tower of Echoes  
สร้างเมื่อ: 2026-07-17  
เครื่องมือ: OpenAI built-in imagegen  
ทิศทางภาพ: original 16-bit fantasy RPG pixel art, top-down 3/4, ไม่มีข้อความ โลโก้ UI หรือ layout ที่ยืมจากเกมอื่น

## สิ่งที่เอกสารนี้ถือเป็นหลัก

1. ชื่อ ลำดับ และหน้าที่ของแผนที่ให้ยึด docs/WORLD_MAP_BIBLE.md
2. scale, perspective, lighting, readability และ accessibility ให้ยึด docs/ART_BIBLE.md
3. แคมเปญใหม่มี 6 region kits ที่ต่างกันจริง ข้อกำหนดนี้ใช้แทน legacy five-biome Tower palette เฉพาะในขอบเขต campaign
4. Region 1 ใช้ชื่อทางการว่า Verdant; ชื่อโฟลเดอร์ everbloom เป็น alias ของชุด mockup เท่านั้น
5. แผนที่สุดท้ายของ Region 6 ชื่อ Nexus ไม่ใช่แผนที่เพิ่มชื่อ Celestial Nexus

## กติกาการนำภาพไปใช้

- ภาพ PNG ทั้งหมดเป็นภาพอ้างอิง ไม่ใช่ runtime tileset และห้ามโหลดทั้ง contact sheet เข้าเกม
- Claude Code ต้องสร้าง source asset ใหม่เป็น modular 16px tiles/props แล้วแสดงด้วย integer 2x และ nearest-neighbor
- ใช้ภาพเพื่ออ้างอิง composition, palette, landmark, route grammar, prop family และ shape language เท่านั้น
- ทุก map ต้องมี entrance/exit, main loop, shortcut, safe pocket, danger landmark, optional secret และ landmark ที่จำได้
- พิสูจน์ว่า portal, objective และทางออกเดินถึงได้; spawn ไม่ทับ collision/safe zone; save/reload ไม่ทำให้ตำแหน่งหรือรางวัลเสีย
- แยก source concept, production source และ runtime optimized assets ออกจากกัน
- production asset ทุกชิ้นต้องบันทึก path, type, dimensions, hash, consumer, biome, source/tool, prompt/author, license และ provenance
- ห้ามคัดลอก sprite, map, UI, monster, music หรือชื่อเฉพาะจาก Ragnarok Online; เป้าหมายคืออารมณ์ social fantasy adventure ที่เป็น IP ของเกมนี้เอง

## Region 1 — Verdant

ไฟล์:

- [Map mockups](region-01-everbloom/region-01-map-mockups.png)
- [Asset board](region-01-everbloom/region-01-asset-board.png)

ลำดับช่องซ้ายไปขวา บนลงล่าง:

1. Aethergate Town
2. Whisperwood
3. Gelwater Fen
4. Rootbound Grotto
5. Ruined Archive
6. Stormgrass Plateau
7. Echo Citadel

Asset families: bright home town, verdant forest, wetland, root cave/crystal, ruined archive, storm plateau และ Echo Citadel. จำกัด mushroom identity ในภูมิภาคนี้เพื่อไม่ให้ชนกับ Region 4

### Aethergate Town detailed pack

- [Detailed gallery](region-01-everbloom/aethergate-town/AETHERGATE_GALLERY.md)
- [Claude Code build specification](region-01-everbloom/aethergate-town/AETHERGATE_TOWN_BUILD_SPEC.md)

ชุด 7 PNG ครอบคลุม town, building exteriors, outdoor environment, core interiors, progression interiors, core assets และ progression assets

## Region 2 — Sunveil Coast

ไฟล์:

- [Map mockups](region-02-sunveil/region-02-map-mockups.png)
- [Asset board](region-02-sunveil/region-02-asset-board.png)

ลำดับช่อง: Copperwind Outpost, Saffron Dunes, Mirrormere Oasis, Mangrove Reach, Buried Sun Temple

Asset families: sandstone-blue outpost, heat/shade desert, oasis water and gardens, tidal mangrove/boardwalk และ buried solar temple. Palette หลักคือ saffron, sandstone, turquoise, palm green และ sun gold

## Region 3 — Emberfrost Highlands

ไฟล์:

- [Map mockups](region-03-emberfrost/region-03-map-mockups.png)
- [Asset board](region-03-emberfrost/region-03-asset-board.png)

ลำดับช่อง: Emberhaven, Ashen Steppe, Basalt Foundry, Glacier Pass, Crown of Winter

Asset families: forge town, ash/lava field, basalt machinery, ice pass และ winter monastery/citadel. ใช้ warm/cold contrast เพื่อบอกพื้นที่ปลอดภัยและอันตรายโดยไม่พึ่งสีอย่างเดียว

## Region 4 — Mycelial Gloam

ไฟล์:

- [Map mockups](region-04-mycelial-gloam/region-04-map-mockups.png)
- [Asset board](region-04-mycelial-gloam/region-04-asset-board.png)

ลำดับช่อง: Sporewood, Miresong Marsh, Lumencap Caverns, Haunted Archive, Mycelium Sanctum

Asset families: bioluminescent fungal forest, violet-teal swamp, luminous cave/crystals, gothic haunted library และ living fungal sanctum. Palette มืดได้แต่เส้นทางต้องอ่านง่ายและมี warm navigation lights

## Region 5 — Skyclock Meridian

ไฟล์:

- [Map mockups](region-05-skyclock-meridian/region-05-map-mockups.png)
- [Asset board](region-05-skyclock-meridian/region-05-asset-board.png)

ลำดับช่อง: Skyhold, Zephyr Meadows, Broken Observatory, Brassward, Tempest Engine

Asset families: floating home city, sky meadow/island edges, astronomical ruin, brass city และ storm engine. Palette หลักคือ sky blue, white, gold, brass และ electric cyan; walkable surface กับ void ต้องแยกชัดเสมอ

## Region 6 — Astral Rift

ไฟล์:

- [Map mockups](region-06-astral-rift/region-06-map-mockups.png)
- [Asset board](region-06-astral-rift/region-06-asset-board.png)

ลำดับช่อง: Last Observatory, Starfall Expanse, Memory Constellation, Celestial Approach, Nexus

Asset families: final outpost, starfall field, memory/biome echoes, celestial fortress และ spiral Nexus. Nexus ต้องมี ending route และ postgame gateway ไป Endless Tower โดยแยกกันชัด

## Endless Tower of Echoes

ไฟล์:

- [Room archetypes](endless-tower-of-echoes/tower-room-archetypes.png)
- [Modular asset board](endless-tower-of-echoes/tower-asset-board.png)

Room archetypes ตามลำดับช่อง 4 x 2:

1. Arrival Crossroads
2. Combat Loop
3. Route Choice Gauntlet
4. Knowledge Puzzle Chamber
5. Treasure and Curse Vault
6. Sanctuary Checkpoint
7. Boss Floor
8. Ascension Floor

Asset groups ตามลำดับช่อง 3 x 2: Tower shell/sockets, objectives/hazards, route/rewards, sanctuary/learning, six-region overlays และ boss/ascension.

ชุดนี้ออกแบบเป็น room grammar เพื่อรองรับ curated launch floors และขยายเป็น endless ได้ในภายหลัง ไม่ใช่ภาพเฉพาะชั้น 1–100. Generator ต้องใช้ seed, socket compatibility, anti-repeat, difficulty budget, route choice และ checkpoint rule; ความยากต้องเพิ่มจาก mechanics/composition ไม่ใช่เพิ่ม HP อย่างเดียว

## Prompt recipe ที่ใช้สร้างภาพ

Map board prompt family:

- สร้าง contact sheet แบบ original 16-bit fantasy RPG, top-down 3/4
- ระบุจำนวนช่องและลำดับชื่อ map อย่างตายตัว
- ทุกช่องต้องมี entrance/exit, loop, shortcut, safe pocket, danger landmark, secret และ central landmark
- ระบุ biome mechanic และ palette ของแต่ละ map
- ห้ามข้อความ UI โลโก้ ตัวละคร/แผนที่มีลิขสิทธิ์ ภาพเบลอ และ pasted screenshot

Asset board prompt family:

- สร้าง isolated modular environment assets บนพื้นหลังเข้ม
- แยก group ตาม map และเรียงลำดับเดียวกับ map board
- ขอ straight edge, inner/outer corner, transitions, intact/damaged state, blocker, small prop, navigation light, interactive prop และ encounter landmark
- รักษา top-down 3/4, grid-friendly scale, readable collision และ cohesive palette
- ห้าม character sprite, readable writing, cropped object และการ recolor อย่างเดียวเพื่อแทน biome ใหม่

## Production gate ต่อหนึ่งแผนที่

- มี ZoneDefinition และ asset dependency ที่ชัดเจน
- collision, depth sorting, spawn, portal, objective, shortcut และ secret ทำงานจริง
- ผ่าน reachability/soft-lock validator
- ผ่าน fresh save, save/reload และ fast-travel test
- ไม่มี missing texture, placeholder, silent interaction หรือ console error
- เล่นได้ด้วย keyboard และ touch ที่ 390 x 844
- FPS, memory และ zone-load อยู่ใน budget ที่วัดจากเครื่องเป้าหมาย
- playtest ยืนยันว่าผู้เล่นจำ landmark ได้และอธิบายเส้นทางกลับเมืองได้

## Provenance

ภาพ concept ทั้ง 21 ภาพสร้างด้วย OpenAI built-in imagegen จาก prompt recipe ด้านบนและบันทึกไว้ในโฟลเดอร์นี้ ผู้พัฒนาต้องลงทะเบียน production assets ที่สร้างต่อจากภาพเหล่านี้แยกอีกครั้ง เพราะ concept provenance ไม่ครอบคลุมไฟล์ runtime ที่ถูกวาด ตัด แก้ หรือสร้างใหม่ภายหลัง
