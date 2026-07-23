# GAME_CONTRACT — SPIRAL'S ECHO

> กฎที่ห้ามเปลี่ยนโดยไม่มีการตัดสินใจระดับ product (บันทึกใน `docs/execution/DECISION_LOG.md`).
> อ่านคู่กับ `CLAUDE.md` (constitution) และ `docs/EXECUTION_STATE.md` (สถานะปัจจุบัน)

## Vision
Original 16-bit fantasy educational RPG สอน O-NET English ป.6 ที่ "ความรู้ทำให้ผจญภัยเก่งขึ้น"
— ไม่ใช่ quiz ที่หยุดเกม ผู้เล่นกลับมาเพราะ สำรวจ/ล่าของ/พัฒนาอาชีพ/บอส สนุกจริง
และทุก session ยกระดับภาษาอังกฤษที่วัดผลได้

## โครงสร้างเกมเป้าหมาย (Full Release)
- **Campaign หลัก 6 ภูมิภาค ~32 แผนที่** (~8–12 ชม. ไม่รวม endgame) — เมือง/Field/Dungeon/Boss
  เชื่อมกันและย้อนกลับได้
  1. **World 1 (Verdant)** — Aethergate Town, Whisperwood, Gelwater Fen, Rootbound Grotto,
     Ruined Archive, Stormgrass Plateau, Echo Citadel
  2. **Sunveil Coast** · 3. **Emberfrost Highlands** · 4. **Mycelial Gloam**
  5. **Skyclock Meridian** · 6. **Astral Rift** (รายละเอียดใน `docs/WORLD_MAP_BIBLE.md`)
- **Tower of Echoes = โหมดเสริม** (ไม่ใช่เนื้อเรื่องหลัก): launch 30 ชั้น curated,
  checkpoint ทุก 5 / boss ทุก 10, adaptive จาก weak mastery; architecture รองรับ 100 ชั้น
  แต่**ห้ามสร้าง filler เพื่อให้ครบตัวเลข**
- **4 คลาสหลัก** (warrior/archer/guardian/mage) + **อาชีพขั้นสอง 2 ทางต่อคลาส** (8 advanced jobs)

## Core loop
สำรวจ → เจอศัตรู → ตอบคำถาม English สร้าง **Insight** (guaranteed strike) → ใช้สกิล/build →
loot/quest → พัฒนาอาชีพ → กลับเมือง craft/study → ออกสำรวจต่อ
- **ดาเมจต้องมีความรู้หนุน**: การโจมตีหลักจ่าย Insight 1 หน่วย (ได้จากตอบถูกเท่านั้น, cap 5,
  ตอบผิดไม่ริบ) — ปิดทาง combat bypass ถาวร
- ห้ามถามทุก hit จนเสีย flow: regular = knowledge เป็นช่วง, elite = intent/weak point,
  boss = คำถามใน phase mechanic
- ตอบผิด = pause ไม่จำกัดเวลา + explanation; Relaxed mode ไม่มี time pressure
- Selection กรองตาม CEFR + mastery + recent history (anti-repeat)

## Architecture (ห้าม rewrite — refactor หลัง feature flag เท่านั้น)
- Nuxt 4 SPA (`ssr:false`, srcDir `app/`) + Phaser 4 + Pinia persist + Tailwind;
  static export → GitHub Pages subpath (**ทุก asset ผ่าน `assetPath()`**)
- **Pure domain layers ใต้ `app/data/`** (combat/learning/economy/curriculum/coop/teacher/mmo)
  — ไม่มี Vue/Phaser import, ทุก formula มีที่เดียว, Vitest ครอบ
- Scenes: TownScene / TowerScene / DungeonScene / BossScene / InteriorScene ผ่าน
  `eventBus` (typed) → Vue UI; **`battle:end` ใช้ `BattleOutcome` enum**
  (`victory | defeat | escaped | escape-failed`) — `won:boolean` คงไว้เพื่อ compat เท่านั้น
- **Location authority**: `player.setFloor(destination)` (clamp+idempotent) คือทางเดียว
  ที่เปลี่ยนชั้น; Phase 2 จะยกเป็น `PlayerLocation {worldId, zoneId, spawnId, ...}` +
  `ZoneDefinition` data-driven (ห้ามสร้าง Scene class ใหม่ทุกแผนที่)
- **Save**: versioned envelope (CURRENT_SAVE_VERSION=4, migrations idempotent+tested);
  legacy localStorage `player` ยัง authoritative จนกว่า envelope cutover จะผ่าน gate
- **Learning ≠ combat power** (ADR 0003): mastery store แยกจาก combat stats;
  ทุกคำตอบ (ปกติ + Knowledge Break) เข้า AnswerRecord stream เดียวผ่าน
  `recordBattleAnswer` / mastery สด — ห้าม snapshot เก่าเขียนทับ
- **Rewards**: `RewardLedger` idempotent, ห้ามเชื่อ UI; single-player ต้องเล่นได้เต็ม offline
- Questions: generate จาก `knowledge/` → `data/questions.json` เท่านั้น (150 reviewed items,
  ทุกข้อมี explanation + distractor reasoning + provenance + subskillId)

## Feature flags ที่ LIVE (legacy path คงไว้)
`NEW_ZONE_RUNTIME` · `COMBAT_DOMAIN` · `REALTIME_COMBAT` (World-1 fl.1–10) ·
`KNOWLEDGE_BREAK` · `CLASS_KITS` · `SIGILS` · `ADAPTIVE_EXPEDITIONS` · `MASTERY_BATTLE_SELECTION` ·
`FLOOR_VARIETY` · `MONSTER_INTENTS` · `TOWN_INTERIORS` · `TEACHER` — ยัง off: `SAVE_ENVELOPE`, `COOP`

## ข้อห้ามถาวร
1. ห้ามคัดลอกชื่อ/เพลง/UI/sprite/monster/map จากเกมอื่น; asset ทุกชิ้นต้องมีหลักฐานสิทธิ์
2. ห้าม reset/ลบ/เขียนทับ uncommitted work ที่ไม่เกี่ยวข้อง; player data is sacred
3. ห้ามแสดงระบบใน UI ที่ยังไม่ทำงาน; ห้าม placeholder/TODO/dev text ใน production
4. ห้าม permanent death, loot box, gambling, pay-to-win, punitive streak
5. ห้ามสร้างหลายภูมิภาคพร้อมกันแบบครึ่งสำเร็จ — จบ region ให้ final ก่อนขยาย
6. ห้ามประกาศ phase เสร็จหาก quality gate ยังไม่ผ่าน (`docs/RELEASE_CHECKLIST.md`)
7. ห้าม commit/push/deploy จนกว่าผู้ใช้สั่ง
8. ห้ามใช้ login ปลอม/Apps Script lookup-by-name เป็น authentication — offline = Local Profile
9. Gems = cosmetic/respec/deterministic reroll เท่านั้น
10. ห้าม mark "SME-reviewed" หากไม่มี human review จริง

## Definition of Done (ทุก phase)
Implementation ทำงานจริง · tests/typecheck/build ผ่าน · ไม่มี console error ·
save/reload ถูกต้อง · desktop + 390×844 · keyboard/touch · reduced-motion/sound ทำงาน ·
asset เป็น final หรือ blocker ระบุชัด · docs อัปเดต · ไม่มี regression
