# Decisions

บันทึกการตัดสินใจสำคัญที่มีผลต่อสถาปัตยกรรม/ทิศทางโปรเจกต์ พร้อมเหตุผล

## Nuxt 4 + Phaser (ไม่ใช่ React/PixiJS)
ต่อยอดจากสไตล์และประสบการณ์ของโปรเจกต์พี่น้อง `onet-game-2569` ที่ใช้ stack เดียวกันมาก่อน

## ssr:false (SPA mode)
เกม Phaser ต้องรันฝั่ง client เท่านั้น และ deploy เป็น static site บน GitHub Pages
ไม่จำเป็นต้องมี SSR

## Backend เป็น Google Sheets + Apps Script (ไม่ใช่ database จริง)
ตามโจทย์ผู้ใช้ตั้งแต่แรก ต้องการระบบที่ตั้งค่า/ดูแลง่ายโดยไม่ต้องมี server ของตัวเอง

## แยกโปรเจกต์ใหม่จาก onet-game-2569 แทนที่จะทำต่อในโปรเจกต์เดิม
ผู้ใช้ขอให้สร้างโปรเจกต์ใหม่จริงๆ ในโฟลเดอร์นี้แทนการทำงานต่อในโปรเจกต์เดิม แต่ยังคง "ยืม" ระบบ/
asset ที่ดีจากโปรเจกต์เดิมมาปรับใช้ได้

## Asset path ต้องผ่าน app.baseURL เสมอ
เคยเกิดบั๊ก asset โหลดไม่เจอบน GitHub Pages subpath เพราะ hardcode `/path` ตรงๆ —
แก้ด้วย `setAssetBase()` + `assetPath()` ใน `game/systems/textures.ts`
