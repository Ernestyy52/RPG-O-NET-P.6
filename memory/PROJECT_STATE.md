# Project State

สถานะปัจจุบันของโปรเจกต์ O-NET English Tower (SPIRAL'S ECHO) ณ วันที่อัปเดตล่าสุด

## Stack
- Nuxt 4 (SPA, `ssr:false`) + Phaser + Pinia + Tailwind
- Backend: Google Sheets + Apps Script
- Hosting: GitHub Pages (`gh-pages` branch, deploy อัตโนมัติผ่าน GitHub Actions)
- Repo: `Ernestyy52/RPG-O-NET-P.6`

## ระบบที่มีแล้ว
- เดินสำรวจหอคอย 2D top-down, ชนมอนสเตอร์ → ตอบคำถาม O-NET ป.6 → EXP/Gold
- ไบโอม 5 แบบ วนทุก 10 ชั้น, scaling ความยาก/รางวัลตามชั้น (`data/floors.ts`)
- ระบบ classes/equipment/skills (`data/classes.ts`, `data/equipment.ts`, `data/skills.ts`)
- หน้า title screen + character creation (`pages/index.vue`)
- ธีม UI แบบ pixel/glassmorphism (`assets/css/main.css`)
- Sprite จริงจาก asset pack (tiny-town, player-sprites, mob-sprites) — ดู `docs/asset-index.md`
  สำหรับ asset pack เพิ่มเติมที่มีให้เลือกใน `D:\Asset`
- คลังข้อสอบ O-NET: `knowledge/` เก็บเฉพาะ pattern ที่สกัดจากข้อสอบจริง 11 ปี (2558-2568)
  **ห้ามเก็บข้อสอบจริงใน repo นี้เด็ดขาด** — กติกา/วิธี generate ดูที่ `knowledge/README.md`
  → คำถามจริงที่ใช้ในเกมอยู่ที่ `data/questions.json` (generate จาก `knowledge/` เท่านั้น
  ห้ามอ่าน `D:\ข้อสอบ O-net` เว้นแต่ `knowledge/` หายไป) โหลดเข้าเกมผ่าน `app/data/questions.ts`
  ซึ่งมีระบบกันคำถามซ้ำแบบ shuffle-bag ต่อระดับ CEFR (ไม่ซ้ำจนกว่าจะครบทุกข้อในระดับนั้น)
- มอนสเตอร์ในดันเจี้ยน (`TowerScene::rollMonsterSpawns`) กระจายตำแหน่งแบบตาราง cell + jitter
  แทนสุ่มอิสระ เพื่อไม่ให้ยืนจับกลุ่มกันโดยบังเอิญ

## จุดที่ต้องระวัง
- Path asset ต้องผ่าน `assetPath()`/`app.baseURL` เสมอ ห้าม hardcode `/...`
  (เคยพังตอน deploy ขึ้น GitHub Pages subpath มาแล้ว)
- โปรเจกต์นี้มีคนอื่น/เครื่องมืออื่นทำงานคู่ขนานบน repo เดียวกัน — เช็ค `git log`/`git pull`
  ก่อนเริ่มงานทุกครั้งเพื่อไม่ให้ตกหล่นงานที่เพิ่งเข้ามา

อัปเดตไฟล์นี้ทุกครั้งที่มีการเปลี่ยนแปลงสถานะใหญ่ๆ ของโปรเจกต์
