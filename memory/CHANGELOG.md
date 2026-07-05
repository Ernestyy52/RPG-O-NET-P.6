# Changelog

บันทึกการเปลี่ยนแปลงสำคัญของโปรเจกต์ (สรุปสั้นๆ ต่อรอบงาน ไม่ใช่ commit log ละเอียด — ดู `git log` สำหรับรายละเอียด)

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
