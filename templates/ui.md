# UI Component Template

ใช้เทมเพลตนี้เวลาสร้าง Vue component ใหม่ในเกม ให้ตรงธีม pixel/glassmorphism ที่มีอยู่

- **ชื่อ component**: (`components/game/XxxModal.vue`)
- **โครงหลัก**: ใช้ `pixel-window` + `pixel-titlebar` เป็นกรอบนอก
- **ปุ่ม**: `btn-primary` (ปุ่มหลัก), `btn-secondary` (ปุ่มรอง)
- **การ์ด/แผง**: `glass-panel`
- **สถานะ/HUD**: `hud-bar`, `gold-text` สำหรับข้อความเน้น
- **การเชื่อมกับ store**: ใช้ `usePlayerStore()` จาก `stores/player.ts`
- **event ที่ต้อง emit/listen**: ตรวจสอบ `game/systems/eventBus.ts` ว่ามี event ที่ต้องการหรือยัง
