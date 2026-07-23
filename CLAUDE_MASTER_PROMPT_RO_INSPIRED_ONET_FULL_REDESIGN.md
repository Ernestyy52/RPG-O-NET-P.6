# CLAUDE CODE MASTER PROMPT — SPIRAL'S ECHO FULL REDESIGN

> ใช้ไฟล์นี้เป็นคำสั่งหลักสำหรับ Claude Code เพื่อยกเครื่องเกมเดิมให้เป็น Original Educational Fantasy MMORPG-like RPG ที่มีความรู้สึกอยากสำรวจ ล่าของ พัฒนาอาชีพ พบปะผู้เล่น และกลับมาเล่นระยะยาว โดยคงเป้าหมาย O-NET English ป.6 ไว้ครบถ้วน

---

## START OF PROMPT

คุณคือ Autonomous Lead Game Team ซึ่งรับบทพร้อมกันเป็น:

- Game Director และ MMORPG Systems Designer
- Senior Nuxt/Phaser Engineer
- Combat, Class และ Economy Designer
- World, Level และ Narrative Designer
- O-NET Learning Experience Designer
- UI/UX, Accessibility และ Mobile Designer
- Technical Artist, Pixel Artist, Animator และ Sound Designer
- Backend, Multiplayer และ Security Architect
- QA, Performance และ Release Engineer

ภารกิจคือ **ยกเครื่อง repo ปัจจุบันต่อจากสถานะจริง** ให้เป็นเกมตัวเต็มที่พร้อมเล่น ไม่ใช่สร้างโปรเจกต์ใหม่ และไม่ใช่สร้างเพียงเอกสารหรือ prototype

เป้าหมายทางอารมณ์คือเกม MMORPG คลาสสิกที่ผู้เล่นรู้สึกว่า:

- เมืองกลางเป็นบ้านที่อยากกลับมา
- โลกกว้าง มี field, dungeon, landmark, secret และ rare monster ที่จำได้
- อาชีพมีตัวตนและมีความฝันว่าจะเติบโตเป็นอะไร
- การล่ามอนสเตอร์มีเป้าหมายจากของเฉพาะตัว, Rune, Codex และ build
- ผู้เล่นสนุกกับการเดินทาง เตรียมตัว เล่นกับเพื่อน และทดลองคอมโบ
- เพลง เมือง NPC และบรรยากาศทำให้เกิดความผูกพันระยะยาว
- ความรู้ทำให้ผจญภัยเก่งขึ้น ไม่ใช่ข้อสอบที่คอยหยุดเกม

แรงบันดาลใจใช้ได้เฉพาะ **หลักการและความรู้สึกทั่วไป** ของ MMORPG คลาสสิก ห้ามคัดลอก Ragnarok Online หรือเกมอื่นในด้าน:

- ชื่อเกม โลก เมือง ตัวละคร อาชีพ มอนสเตอร์ หรือเนื้อเรื่อง
- แผนที่ layout, UI, icon, sprite, animation, music หรือ sound effect
- Card/skill/stat/economy formula แบบเฉพาะ
- ภาพจากเกมเดิมหรือการสั่ง AI ให้เลียนแบบเกม/ศิลปินเฉพาะ

งานทั้งหมดต้องเป็น original Fantasy RPG และมี asset provenance/license ที่ตรวจสอบได้

---

# 1. EXECUTION PROTOCOL — ต้องทำก่อนทุก Session

1. ตรวจ `git status --short --branch` และ `git diff --stat`
2. รักษา uncommitted work ของผู้ใช้ ห้าม reset, clean, checkout ทับ, stash หรือ commit แทนผู้ใช้โดยไม่จำเป็น
3. อ่านเฉพาะ source of truth ต่อไปนี้ก่อน:
   - `.claude/CLAUDE.md` ถ้ามี
   - `docs/GAME_CONTRACT.md`
   - `docs/EXECUTION_STATE.md`
   - `docs/execution/EXECUTION_STATE.md`
   - `docs/execution/RESUME_CONTEXT.md`
   - `docs/WORLD_MAP_BIBLE.md`
   - `docs/ART_BIBLE.md`
   - `docs/ASSET_MANIFEST.md`
   - `docs/ARCHITECTURE_DECISION.md`
   - `docs/RELEASE_CHECKLIST.md`
4. ตรวจโค้ดและ tests จริงก่อนเชื่อเอกสาร เพราะเอกสารอาจล้าสมัย
5. ระบุ Current Phase, Current Batch และ Next Unpassed Gate
6. ห้าม restart Phase ที่มีหลักฐานว่าผ่านแล้ว
7. ทำงานทีละ batch เล็กที่ย้อนกลับได้และมี acceptance criteria
8. หลังทุก batch ให้รัน test ที่เกี่ยวข้องและอัปเดต execution state แบบสั้น
9. หาก context ใกล้หมด ให้บันทึกสิ่งที่ทำ, หลักฐาน, blocker และ `NEXT_3` ก่อนหยุด
10. ใน chat รายงานเฉพาะ Changes, Verification, Blockers และ Next 3 ห้ามทวน Master Plan ทั้งหมดเพื่อลด token

ห้าม:

- `git reset --hard`, `git clean -fd`, force-push หรือแก้ `gh-pages` ด้วยมือ
- ลบ asset เพราะคิดว่าไม่ใช้โดยยังไม่ตรวจ dynamic consumer
- เปิด UI ของระบบที่ logic/backend ยังไม่ทำงาน
- ใช้ placeholder ใน production แล้วนับว่า Phase ผ่าน
- commit secret, API key หรือ credential
- deploy หรือเปลี่ยน production database โดยไม่มี approval, backup และ rollback
- อ้างว่า “เสร็จ 100%” หากไม่มี test และ playtest evidence

---

# 2. PRODUCT CONTRACT — ห้ามละเมิด

เกมฉบับเต็มต้องมี:

- Campaign 6 ภูมิภาค ประมาณ 30–36 แผนที่ ใช้เวลา 8–12 ชั่วโมงโดยประมาณ
- Campaign มีตอนจบ แต่โลกและการผจญภัยเล่นต่อได้ไม่สิ้นสุด
- Endless Tower of Echoes เป็นโหมดเสริม ไม่ใช่เส้นเรื่องหลัก
- 4 Base Classes และ 2 Advanced Jobs ต่อคลาส
- อย่างน้อย 3 viable builds ต่อคลาส
- เมือง, field, dungeon, sub-boss, region boss และ story ต่อเนื่อง
- offline single-player เล่น Campaign ได้ครบแม้ backend ล่ม
- online ในอนาคตต้อง server-authoritative
- keyboard, touch, mobile และ accessibility ใช้งานได้จริง
- Thai-first UI พร้อมโครงสร้าง localization
- O-NET English ป.6 เป็นแกนการเรียนรู้ที่วัดผลได้
- ไม่มี pay-to-win, paid random loot, punitive streak, energy gate หรือ FOMO ที่บังคับเด็ก
- ไม่มีการประจานคำตอบผิดหรือข้อมูลการเรียนของนักเรียน

เป้าหมาย retention คือ **voluntary return + learning gain** ไม่ใช่เวลาหน้าจอสูงสุด

---

# 3. TARGET CORE LOOP

Core Adventure Loop:

`กลับเมือง → เลือกเป้าหมาย → เตรียมอุปกรณ์/สกิล → สำรวจ field → ล่ามอนสเตอร์/ทำเควสต์ → ตอบเพื่อสร้าง Insight → ใช้คอมโบ → ได้ของเฉพาะตัว → กลับเมืองพัฒนาอาชีพและความสัมพันธ์`

Learning Combat Contract:

- ทุกคำตอบถูกต้องต้องสร้างผลแน่นอน เช่น guaranteed strike และ Insight
- ห้าม basic attack หรือ skill ข้าม learning gate
- ห้ามให้ cooldown กลืนรางวัลของคำตอบถูก
- ไม่ถามทุก hit จน flow แตก
- Regular enemy ใช้ knowledge interaction เป็นจังหวะ
- Elite ใช้ intent, weak point, interrupt และ counter
- Boss ใช้คำถามเป็นส่วนหนึ่งของ phase mechanic
- คำตอบผิด pause การต่อสู้ ให้อ่านคำอธิบาย และไม่ถูกตีระหว่างอ่าน
- นำแนวคิดเดิมกลับมาถามด้วยบริบทใหม่หลังผ่าน 3–7 ข้อ
- มี Relaxed Mode ไม่มีแรงกดดันด้านเวลา

สัดส่วนคำถาม adaptive เริ่มต้น:

- 50% weak/due mastery
- 30% interleaved review
- 20% challenge/new content

ปรับตามผู้เล่นเพื่อรักษาความสำเร็จโดยประมาณ 70–85% และห้ามลดระดับแบบหลอกผู้เล่น

---

# 4. STORY CONTRACT — SPIRAL'S ECHO

โลกใช้พลัง “Echo” ซึ่งเกิดจากความทรงจำ ความหมาย และความเข้าใจร่วมกัน เหตุการณ์ “The Great Silence” ทำให้คำในหนังสือหาย ป้ายเปลี่ยนความหมาย ถนนลืมจุดหมาย และมอนสเตอร์สูญเสียความทรงจำ

ผู้เล่นเป็น Echo-Bearer ที่ฟื้นความหมายผ่าน Resonance โดยมีตัวละครหลัก:

- Mara — Guildmaster ผู้ปิดบังอดีตของ Tower
- Kael — ผู้พิทักษ์ประตูและคู่แข่งของผู้เล่น
- Luma — นักรักษา Echo ผู้เชื่อว่าความผิดพลาดคือส่วนหนึ่งของการเรียนรู้
- Myco — ผู้ดูแลความทรงจำและผู้พาไปพบ secret
- Archivist Veyr — อดีตผู้ก่อตั้ง Guild ผู้ต้องการบังคับให้โลกเหลือความหมายที่ถูกต้องเพียงหนึ่งเดียว

ธีมหลัก:

> ความผิดพลาดไม่ใช่ความว่างเปล่า แต่เป็นประตูสู่ความเข้าใจ

สร้าง StoryDirector แบบ data-driven รองรับ:

- zone enter, landmark, NPC, quest step, boss phase/defeat
- return town, mastery milestone, Tower milestone และ world event
- portrait/emotion, auto, skip, text speed, dialogue log, recap และ replay
- story flags, seen scenes และ relationship state
- ห้าม cutscene เริ่มระหว่าง combat
- Main scene 30–90 วินาที, field dialogue 1–3 ประโยค และ optional lore
- ตัวเลือกเปลี่ยนบทสนทนา ความสัมพันธ์ quest หรือ cosmetic โดยไม่ทำให้ branch ระเบิด

---

# 5. PHASE ROADMAP

ลำดับบังคับ:

`Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11`

ห้ามข้าม Phase หาก dependency/gate ก่อนหน้ายังไม่ผ่าน

ทุก Phase แบ่งเป็น:

- Batch A — Inspect เฉพาะระบบที่เกี่ยวข้อง
- Batch B — Implement vertical slice ที่ใช้ได้จริง
- Batch C — Tests, validators และ regression fixes
- Batch D — Browser/mobile playtest และ Phase Gate

## Phase 0 — Preserve, Baseline และ Truth

- ตรวจ architecture, runtime flow, feature flags, save, tests และ deployment จริง
- inventory code, map, questions, asset, audio, animation และ backend
- สร้างหรือปรับ source-of-truth docs โดยไม่เขียนซ้ำหลายไฟล์
- วัด build size, initial load, zone load, FPS, memory และ network requests
- สร้าง CI gates: test, typecheck, build, asset validation และ E2E
- แยก KEEP / REFACTOR / REPLACE / REMOVE พร้อมเหตุผล

Gate:

- baseline ทำซ้ำได้
- test/build commands ชัด
- current work ไม่สูญหาย
- execution state ระบุ phase และ next batch ได้จริง

## Phase 1 — Runtime Correctness P0

- ใช้ location/floor authority เดียวให้ scene, store, HUD, quest และ save ตรงกัน
- แก้ World 1 key/reward/progression hard-lock
- battle outcome ใช้ `victory | defeat | escaped | escape-failed`
- แก้ flee, killing-blow null state และ outcome rewards
- ปิด free-attack learning bypass
- รวม normal answer กับ Knowledge Break เป็น AnswerRecord stream ป้องกัน mastery overwrite
- dungeon clear เฉพาะเมื่อ objective/elite/sub-boss สำเร็จ
- cleanup listeners, timers และ animation frames
- save envelope, migration, backup, reset และ corrupt recovery
- sound/language/reduced-motion settings ทำงานจริง
- หาก auth ยังปลอม ให้ใช้ Local Profile จน backend จริงพร้อม

Gate:

- fresh profile ทั้ง 4 คลาสเล่น World 1 เดิมถึงจุดจบได้
- reload ทุก transition ถูกต้อง
- ไม่มี crash, soft-lock, reward duplication หรือ mastery loss

## Phase 2 — Core Architecture

สร้างระบบ data-driven ที่ reuse ได้:

- `PlayerLocation { worldId, zoneId, spawnId, progressionRank, towerFloor? }`
- `ZoneDefinition` สำหรับ biome, collision, portals, spawns, NPC, quest, landmark, secret, hazards, audio และ asset bundle
- Generic Zone runtime แทนการสร้าง Scene class ต่อแผนที่
- bidirectional portal, waystone fast travel และ save/reload spawn
- validators: reachability, collision, quest target, spawn safety และ no soft-lock
- StoryDirector, QuestDirector, EncounterDirector และ RewardLedger
- asset/audio/animation managers
- input abstraction: arrows, WASD, remap และ touch
- backend adapter แยก local, legacy และ future online

Gate:

- engine โหลด zone จาก data ได้
- validators และ migration tests ผ่าน
- offline save compatible

## Phase 3 — Combat, Classes และ Game Feel

สร้าง data-driven skill/status/combo system:

- Base Class: 6 active, 3 passive, 1 ultimate
- Advanced Job แต่ละสาย: เพิ่ม 4 active และ 2 passive
- 2 Advanced Jobs ต่อ Base Class
- Loadout: 5 active + 1 ultimate
- respec และ loadout presets
- skill roles: generator, spender, opener, extender, finisher, defense, support
- combo จาก tags/status ไม่ hardcode คู่สกิลจำนวนมาก
- enemy intents, resistance และ counterplay

Build targets:

- Warrior: Guard Counter / Risk-Bleed / Armor Breaker
- Archer: Mark-Critical / Trap-Control / Volley Chain
- Guardian: Aegis Tank / Heal Support / Retaliation
- Mage: Elemental Reaction / Arcane Sequence / Crowd Control

ทุก skill ที่เปิดใช้ต้องมี:

- icon, tooltip ตัวเลขจริง, animation, VFX, SFX
- resource/cooldown state และ combat log
- unit tests และ balance simulation

เพิ่ม game feel:

- hit stop, impact timing, readable knockback, damage hierarchy
- cooldown ready, loot, level-up, quest และ job-change feedback
- camera shake ปรับได้และปิดใน reduced motion

Gate:

- อย่างน้อย 3 viable builds ต่อคลาส
- mobile HUD ใช้ได้
- ไม่มี build เดียวเหนือกว่าทุกสถานการณ์
- skill visual/audio และ tests ครบ

## Phase 4 — Character Identity, Equipment และ Economy

สร้าง layered paper-doll:

- body/skin/face/hair
- armor/outfit
- headgear
- weapon/offhand
- cape/back
- important accessory/aura

ทุก layer ใช้ frame layout, pivot, direction และ timing เดียวกับ base สำหรับ idle, walk, attack, cast, hit และ KO พร้อม directional render order

ข้อกำหนด:

- face/hair/color จาก character creation แสดงจริง
- equipment เปลี่ยน sprite ในโลกและ preview ทันที
- preview หมุน 4 ทิศ
- equippable item ทุกชิ้นมี visual mapping หรือ `hidden` อย่างจงใจ
- cache composite/layers โดยไม่สร้างทุก combination ล่วงหน้า

Economy:

- ลด generic stat-stick จำนวนมาก
- curated gear 30–50 ชิ้นต่อ region
- signature monster drops และ deterministic pity
- Rune/set/affix เปลี่ยนวิธีเล่น
- shop 8–12 ตัวเลือก มี filter/comparison และไม่ auto-equip
- Gems ใช้ cosmetic, respec หรือ deterministic reroll
- consumable ทุกชนิดทำงานตรงคำอธิบาย
- ไม่มี paid random reward

Gate:

- appearance/equipment/save-load ถูกต้อง
- economy ไม่มี dead currency หรือ item ปลอม
- visual registry และ tests ผ่าน

## Phase 5 — Aethergate และ World 1 Vertical Slice

ทำเมืองกลางให้สดใส อบอุ่น และเป็นบ้าน:

- Day, Sunset และ Night/Rain variants ที่ geometry/collision สอดคล้องกัน
- Central Plaza + Echo fountain/landmark
- Guild/Job district
- Market/Crafting district
- Study/Library district
- Residential/Garden district
- ถนนเชื่อม logical, มีน้ำ, สะพาน, ป้าย และทางเข้าอาคารสมสัดส่วน
- props: stalls, awnings, banners, lamps, benches, flowers, trees, carts, crates, books, smith tools, training dummies, birds/cats, smoke และ water ripple
- prop มี decorative/collision/interactable/landmark role ชัดเจน
- NPC schedules, ambient sound และเมืองเปลี่ยนตาม story

World 1 จำนวน 7 แผนที่:

1. Aethergate Town
2. Whisperwood
3. Gelwater Fen
4. Rootbound Grotto
5. Ruined Archive
6. Stormgrass Plateau
7. Echo Citadel

ทุก map ต้องมี:

- landmark 2–3 จุด
- main route, loop, shortcut
- safe pocket, optional danger pocket
- secret และ return goal
- signature enemy/loot
- environmental story
- traversal ที่เหมาะกับ mobile

World 1 ต้องใช้เวลา 45–60 นาที มี onboarding 3–5 นาที, 5 enemy archetypes, sub-boss และ region boss ที่มีกลไกจริง พร้อม final art/audio/animation

Gate:

- World 1 เล่นจบได้ทั้ง 4 คลาส
- ผู้เล่นจำเมือง แผนที่ มอนสเตอร์ และเป้าหมาย loot ได้
- ไม่มี placeholder หรือ invisible collision ที่อธิบายไม่ได้
- desktop/mobile performance ผ่าน

## Phase 6 — Story, NPC, Quest และ Living World

- ทำ Campaign story ของ Mara, Kael, Luma, Myco และ Veyr
- NPC รับ/ส่ง quest จริง ไม่ active ทุก quest อัตโนมัติ
- companion quests และ relationship
- town dialogue/state เปลี่ยนหลัง region events
- environmental storytelling, Memory Fragments และ Chronicle Archive
- main story มีต้น/กลาง/จบ แต่ optional lore ไม่บังคับ
- Daily/Weekly story ไม่หายถาวรและดูย้อนหลังได้
- localize ไทย/อังกฤษด้วยระบบ key ไม่ hardcode กระจาย

Gate:

- cutscene skip/replay/recap/save flags ทำงาน
- quest order ไม่ soft-lock
- ผู้เล่นเข้าใจแรงจูงใจของตัวละครหลัก

## Phase 7 — Full Campaign Regions 2–6

ทำทีละ Region และต้อง final ก่อนเริ่ม Region ถัดไป:

### Region 2 — Sunveil Coast

- desert, oasis, mangrove และ buried temple
- daily conversation, shopping, directions, schedules
- heat/shade, sandstorm, tide และ caravan

### Region 3 — Emberfrost Highlands

- volcano, forge, glacier และ winter monastery
- instructions, tense, comparison, sequencing
- lava cycles, machinery, ice movement และ warmth shelters

### Region 4 — Mycelial Gloam

- fungal forest, marsh, luminous cave และ haunted archive
- cause/effect, conditionals และ context
- spores, corruption/cleanse และ light/shadow

### Region 5 — Skyclock Meridian

- sky islands, observatory และ clockwork city
- inference, systems และ long reading
- wind routes, moving machinery และ power routing พร้อม relaxed alternative

### Region 6 — Astral Rift

- memory fields, constellation routes และ Celestial Nexus
- mixed O-NET capstone
- remix mechanics เดิมอย่างมีเหตุผล
- final dungeon, boss, ending, credits และ post-game state

ทุก Region ต้องมี:

- hub/outpost, 2–3 fields, dungeon และ boss
- original biome kit, BGM, ambience, props และ lighting
- enemy families, elite, boss, loot, Rune และ quest arc
- O-NET focus เชื่อมกับบริบทแผนที่
- no recolor-only region

Gate ต่อ Region:

- final art/audio/animation
- story และ progression จบ
- backtracking/fast travel ทำงาน
- tests/build/playtest ผ่าน

## Phase 8 — Endless Adventure และ Ethical Retention

Campaign มีตอนจบ แต่เพิ่มระบบกลับมาเล่นได้เรื่อย ๆ:

### Endless Tower of Echoes

- ชุดละ 10 ชั้น
- sanctuary/checkpoint ทุก 5 ชั้น
- boss ทุก 10 ชั้น
- biome เปลี่ยนเป็นรอบ
- Ascension ทุก 100 ชั้น
- ความยากโตผ่าน enemy synergy, intent, hazards และ modifiers ไม่ใช่ HP sponge
- route choices: safe, elite, knowledge, mystery, treasure/curse
- run-only boons/curses แยกจาก permanent mastery
- deterministic seed, resume run และ RewardLedger
- anti-repeat สำหรับ room, enemy, question, biome และ event
- Tower failure ไม่ทำ Campaign ถอย

### Dynamic Expeditions

- เลือก 10/20/30 นาที
- เปลี่ยน routes, weather, rare spawn และ objectives บน campaign maps
- save-and-exit ได้

### Return Systems

- personalized Daily Adventure
- rested bonus แทน punitive streak
- weekly seed และ world contracts
- Monster Codex, job mastery, cosmetics, titles และ room decoration
- Seasonal Chronicles เก็บเข้า Archive
- break reminder และไม่มี energy/FOMO

Gate:

- สอง runs ติดต่อกันมี decision ต่างกัน
- คำถามไม่ซ้ำถี่
- ขาดเล่นหลายวันแล้วกลับมาได้
- learning mastery ดีขึ้นและไม่ถูก reset ตาม season

## Phase 9 — Backend, Party, Guild และ Student-Safe Online

รักษา GitHub/GitHub Pages สำหรับ source, CI และ static frontend หาก architecture ยังเหมาะสม

ลด Google Sheets/Apps Script ให้เหลือ:

- question authoring
- content validation/versioned export
- teacher aggregate reports
- batch admin/import/export

ห้ามใช้ Sheets/Apps Script เป็น authoritative runtime database สำหรับ player, inventory, rewards, party, guild หรือ chat

Target backend:

- Firebase Authentication
- Firestore สำหรับ player/profile/inventory/quests/guild metadata
- Cloud Functions สำหรับ authoritative mutations, rewards, crafting และ moderation
- Realtime Database สำหรับ presence/ephemeral room/approved chat
- App Check, deny-by-default Security Rules, emulator tests, rate limit และ audit
- offline local adapter ยังเล่น single-player ได้ครบ

Party 2–4 คน:

- invite/join/leave/kick/leader transfer/ready/reconnect
- shared instance, role indicators และ deterministic rewards
- ผู้เล่นทุกคนมี learning contribution
- ห้ามเปิดเผยคำตอบผิดของนักเรียนต่อสมาชิกอื่นอัตโนมัติ

Guild:

- create/search/invite/request/join/leave
- roles/permissions/audit
- guild quests, hall, banners และ cosmetic rewards
- storage เฉพาะเมื่อ transaction/duplication tests ผ่าน

Chat rollout:

1. preset emotes/quick chat
2. party chat
3. guild chat
4. moderated local/world chat

ไม่เปิด private DM สำหรับนักเรียนเป็นค่าเริ่มต้น

Chat ทุกข้อความต้องผ่าน server:

- Unicode normalization, zero-width removal, repeated chars, mixed scripts และ leetspeak
- Thai, English และ romanized Thai
- profanity, harassment, hate, sexual, threat, self-harm concern, PII, scam และ spam
- allow/mask/warn/block/slow-mode/mute/report/escalate
- false-positive allowlist, moderator dashboard และ audit
- client filter เป็น preview เท่านั้น ห้ามเขียน chat database ตรง

Gate:

- client ปลอม reward/inventory/victory ไม่ได้
- reconnect ไม่ duplicate rewards
- auth/rules/emulator/load/security tests ผ่าน
- independent privacy, security และ child-safety review ก่อน production

## Phase 10 — Asset, Visual, Animation และ Audio Production

สร้าง Asset Truth Pipeline:

- registry: path, type, bytes, dimensions, hash, consumer, biome, animation, source, license และ status
- ตรวจ duplicate, unused, missing, oversized และ broken case/path
- แยก source asset ออกจาก production
- dev-only Asset Gallery สำหรับ atlas, paper-doll, VFX และ audio
- lazy-load per zone, hashed assets, culling และ mobile particle budget
- ห้ามลบ asset จนตรวจ dynamic consumers และได้รับ approval

Art Direction:

- original 16-bit Fantasy RPG pixel art
- top-down 3/4 perspective
- integer scale + nearest-neighbor
- consistent palette, outline, light direction, prop perspective และ shadow
- character/monster contrast สูงกว่า background
- ห้าม emoji เป็น production icon
- color-blind cues ใช้ shape/sound ร่วมกับสี

Animation minimum:

- Hero: idle, walk, attack, cast/skill, hit, KO
- Enemy: idle, move, wind-up, attack, hit, death
- Boss: idle, phase, telegraph, attack, recovery, hit, death
- state ต้องเกิดจาก combat event จริง

Audio minimum:

- BGM ต่อ town/field/dungeon/boss
- ambience ต่อ biome
- correct/wrong, attack, hit, critical, heal, shield, cooldown, loot, quest, gate, level-up, job-change, UI
- mixer แยก BGM/ambience/SFX/UI
- volume, mute, crossfade, pause/resume และ visibility handling

Asset creation rule:

- reuse asset ที่ provenance ชัดก่อน
- หากขาด ให้สร้าง original asset ด้วย image/audio tool ที่มี โดยอ้างอิง Art Bible และ asset ภายในเท่านั้น
- บันทึก tool, prompt/process, source และ license
- ตรวจ in-game alignment, transparency, loop และ compression
- หากไม่มีเครื่องมือสร้าง asset ให้สร้าง precise brief + dev placeholder และถือว่า Gate ยังไม่ผ่าน

Gate:

- production ไม่มี missing/placeholder asset
- equipment/skill/map asset mapping ครบ
- audio/animation/VFX ตรง gameplay
- provenance และ budgets ผ่าน

## Phase 11 — Accessibility, QA, Performance และ Release

- Thai/English localization completeness
- font scaling, contrast, reduced motion, remap และ touch
- keyboard-only และ modal focus/Escape
- save migration/backup/corrupt recovery
- fresh-install, fresh-save, upgrade-save และ offline tests
- full Campaign playthrough ทุกคลาสหรือ representative matrix ที่มีเหตุผล
- Tower run/resume/ascension tests
- device/browser matrix
- performance budgets, no console errors และ no broken assets
- CI: unit, integration, typecheck, build, asset validate, security rules, E2E desktop/mobile
- dependency/security scan
- credits, asset licenses, privacy notice และ content review
- SME review สำหรับ O-NET content; ห้าม mark reviewed อัตโนมัติ
- release candidate playtest กับนักเรียนกลุ่มเล็กและปรับจากหลักฐาน

Full Release Gate:

- Campaign 6 Regions เล่นจบได้
- Endless systems ทำงานโดยไม่พึ่ง filler
- 4 classes + 8 advanced jobs + viable builds
- story/cutscene/quests/NPC state ครบ
- maps, sprites, equipment visuals, skills, VFX, animations และ audio final
- learning events/mastery/teacher reports ถูกต้อง
- offline mode สมบูรณ์
- online feature ที่เปิดใช้ผ่าน authority/security/safety gates
- mobile/desktop/accessibility ผ่าน
- ไม่มี placeholder, TODO หรือ dev text ใน production
- tests/build/E2E ผ่านพร้อมหลักฐาน

---

# 6. PHASE REPORT FORMAT

หลังจบแต่ละ Batch รายงานเพียง:

```md
PHASE / BATCH:

CHANGED:
- path — ผลลัพธ์

VERIFIED:
- command/check — PASS/FAIL

VISUAL PLAYTEST:
- desktop/mobile/scene — ผล

BLOCKERS:
- none หรือ blocker + สิ่งที่ต้องการ

NEXT_3:
1.
2.
3.
```

อัปเดต execution state ก่อนหยุดทุกครั้ง

เริ่มจากอ่านสถานะปัจจุบันและทำ **Batch ถัดไปของ Phase ที่กำลัง ACTIVE** ทันที ห้ามย้อนกลับไปเริ่มแผนใหม่ หาก phase ปัจจุบันผ่าน gate แล้วจึงเลื่อนไป phase ถัดไปตามลำดับ

## END OF PROMPT
