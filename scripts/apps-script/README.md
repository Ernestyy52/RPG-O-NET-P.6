# Google Sheets + Apps Script Backend

1. สร้าง Google Sheet ใหม่ (ว่างเปล่า) ตั้งชื่อเช่น "onet-tower-db"
2. เปิด Extensions > Apps Script
3. ลบโค้ดเดิมทั้งหมด แล้ววาง `Code.gs` จากโฟลเดอร์นี้
4. กด Deploy > New deployment > เลือกประเภท "Web app"
   - Execute as: Me
   - Who has access: Anyone
5. คัดลอก Web app URL ที่ได้ (ลงท้ายด้วย `/exec`)
6. ใส่ URL นั้นใน `.env` ของโปรเจกต์ Nuxt:
   ```
   NUXT_PUBLIC_SHEETS_API_URL=https://script.google.com/macros/s/XXXXX/exec
   ```
7. Endpoint ที่ใช้ได้:
   - `GET  ?action=load&name=Hero` — โหลดข้อมูลผู้เล่น
   - `GET  ?action=leaderboard` — อันดับผู้เล่น 20 อันดับแรกตามชั้นสูงสุด
   - `POST { "action": "save", "data": { name, level, exp, gold, currentFloor, maxHp, hp, atk, inventory } }` — บันทึกข้อมูล
