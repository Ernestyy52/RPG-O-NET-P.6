# World 1 Completion State

วันที่ตรวจรับ: 2026-07-23

สถานะ: **พร้อมใช้เป็น vertical slice สำหรับพัฒนาต่อ**

## เส้นทางหลักที่ล็อกแล้ว

`Aethergate → Whisperleaf Meadow → Mosswood Trail → Deepgrove → Myco Sanctum → Myco Colossus → Aethergate`

- Aethergate เป็นเมืองศูนย์กลางและจุดเริ่ม/จบของ World 1
- สนามล่า 3 แห่งใช้ layout, landmark, monster roster และทางออกเฉพาะพื้นที่
- Rootcellar Hollow เป็น mini dungeon ทางเลือกจาก Mosswood Trail
- Myco Sanctum เป็น main dungeon และทางเข้าบอสของ World 1
- Endless Spire แยกเป็นโหมดจัดอันดับ ไม่กีดขวางเนื้อเรื่องหลัก

## Contract ที่ระบบต้องรักษา

- `currentZoneId` เป็นตำแหน่งปัจจุบันที่ authoritative สำหรับการเดินทาง
- `adventureRank` เก็บอันดับสูงสุดและต้องไม่ลดเมื่อผู้เล่นย้อนพื้นที่
- การเดินหน้าไปพื้นที่ถัดไปถูกล็อกด้วย World 1 quest step แต่การถอยกลับเปิดเสมอ
- การชนะ Myco Colossus เพิ่ม `verdant-frontier` ใน `completedRegionIds` แบบ idempotent
- การจบ World 1 ส่งผู้เล่นกลับ Aethergate และไม่เปิด World 2 อัตโนมัติ
- save เก่าถูก backfill ฟิลด์ใหม่ด้วย `ensurePlayerDefaults`; ยังไม่มีการเปลี่ยน save envelope ในรอบนี้

## Acceptance ที่ผ่านแล้ว

- ชุดทดสอบทั้งหมด: 506/506
- production build: ผ่าน
- ตรวจการเดินทางจริง: Whisperleaf → Aethergate → Whisperleaf ผ่าน
- ตรวจแผนที่มือถือ: current location, locks และ Adventure Rank ตรงกับสถานะจริง
- ตรวจ layout: 390×844 และ 1280×900 ไม่มี horizontal overflow
- `git diff --check`: ผ่าน (มีเฉพาะคำเตือน line ending เดิมของ worktree)
- fresh-save browser QA: สร้างบัญชี/ตัวละคร → รับเควสกิลด์ → เข้า Whisperleaf → reload แล้วตำแหน่งและ STEP 3/12 อยู่ครบ
- full-route simulation: ทั้ง 4 คลาสผ่านเควสหลัก ดันเจียน บอส และจบในช่วง Lv.8–11
- legacy completion regression: เซฟที่เคยจบก่อนมี clear reward รับแพ็กเกจใหม่ครั้งเดียว
- mobile loading: Phaser แยกจาก title bundle; หน้าต่อสู้ยังไม่ mount ในเมืองและโหลดก่อนเข้าสนามล่า

## งานที่ตั้งใจเลื่อนไปหลัง World 1

- World 2 content และการปลดล็อกภูมิภาคถัดไป
- production-scale multiplayer/backend และ authoritative server state
- ลดขนาด Phaser initial chunk เพิ่มเติม
- balance/playtest ระยะยาวด้วยผู้เล่นจริงหลายคลาส
- งาน asset/audio ขั้น final polish ที่ต้องตัดสินใจจาก session playtest

## World 2 Development Gate

1. DONE — fresh browser profile และ full-route simulation ครบทั้ง 4 คลาส
2. DONE — returning-save และ pre-reward completed-save regression
3. DONE — clear package: 550 EXP, 250 gold, 2 gems, Verdant Relic, Mega Potion ×2
4. DONE — World 2 handoff target Lv.10; acceptable Lv.8–11; Adventure Rank จบที่ 10
5. INVARIANT — ห้ามเปลี่ยน zone id ข้างต้นโดยไม่มี save migration
