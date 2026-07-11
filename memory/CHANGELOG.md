# Changelog

บันทึกการเปลี่ยนแปลงสำคัญของโปรเจกต์ (สรุปสั้นๆ ต่อรอบงาน ไม่ใช่ commit log ละเอียด — ดู `git log` สำหรับรายละเอียด)

## 2026-07-12
- เพิ่ม `knowledge/` (manifest.json, analyzed/<year>.json, knowledge_base.json) — คลัง pattern
  ข้อสอบ O-NET ป.6 ที่สกัดมาจาก 11 ปีข้อสอบจริง (2558-2568) โดยเก็บเฉพาะ pattern (skill/grammar/
  question type/distractor ฯลฯ) **ห้ามเก็บข้อสอบจริง** ดูกติกาที่ `knowledge/README.md`
- สร้าง `data/questions.json` (69 ข้อ ครบ 4 ระดับ CEFR) ด้วยการ generate จาก `knowledge/` เท่านั้น
  ไม่แตะไฟล์ต้นฉบับ `D:\ข้อสอบ O-net` เลยในขั้นตอนนี้
- แก้ `app/data/questions.ts` ให้ import คำถามจาก `data/questions.json` แทนของ hardcode เดิม (12 ข้อ)
  และเปลี่ยนระบบกันคำถามซ้ำจาก "จำ 4 ข้อล่าสุด" เป็น shuffle-bag ต่อระดับ CEFR (ไม่ซ้ำข้อไหนเลย
  จนกว่าจะเจอครบทุกข้อในระดับนั้นก่อน)
- แก้ `app/game/scenes/TowerScene.ts::rollMonsterSpawns` จากสุ่มพิกัดอิสระ (มักจับกลุ่มกันโดยบังเอิญ)
  เป็นแบ่งพื้นที่เดินเป็นตาราง cell ~เท่าจำนวนมอนสเตอร์แล้วสุ่มมี jitter ในแต่ละ cell — วัดผลจำลอง
  พบว่าระยะห่างคู่ใกล้สุดเฉลี่ยเพิ่มจาก ~1.8 ช่องเป็น ~3.6 ช่อง (สัดส่วนที่มอนสเตอร์ยืนใกล้กันเกินไป
  ลดจาก 63% เหลือ ~1%)
- เพิ่ม `scripts/validate-questions.cjs` เช็ค schema + id/prompt ซ้ำใน `data/questions.json` ก่อนใช้งาน

## 2026-07-05
- สร้างโปรเจกต์ใหม่ (Nuxt 4 + Phaser) แยกจาก `onet-game-2569`
- Vertical slice: เดิน/ชนมอนสเตอร์/ตอบคำถาม O-NET/EXP-Gold/ร้านค้า/ขึ้นชั้น
- ต่อ Google Sheets + Apps Script backend (save/load/leaderboard)
- ตั้งค่า deploy อัตโนมัติขึ้น GitHub Pages ผ่าน GitHub Actions (`gh-pages` branch)
- พอร์ตระบบไบโอมและธีม UI แบบ pixel/glassmorphism จาก `onet-game-2569`
- เปลี่ยนจากรูปวาด Graphics เป็น sprite จริง (tiny-town, player-sprites, mob-sprites)
- แก้บั๊ก asset 404 บน GitHub Pages (path ต้องผ่าน `app.baseURL`)
- สร้าง asset index จาก `D:\Asset` (41 pack)
- (งานคู่ขนานจากทีม/เครื่องมืออื่น) เพิ่มระบบ classes/equipment/skills, title screen,
  character creation, เอกสาร AI Development Bible
