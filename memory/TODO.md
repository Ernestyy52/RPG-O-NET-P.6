# TODO

## กำลังทำ / ค้างอยู่
- [ ] ตรวจสอบว่า sprite/animation ใหม่ (classes 4 แบบ) ทำงานถูกต้องบน GitHub Pages จริง
- [ ] อัปเดต `.claude/CLAUDE.md` ให้ตรงกับระบบ classes/equipment/skills/title screen ที่เพิ่มเข้ามาใหม่

## แผนถัดไป
- [ ] เลือก asset pack จาก `docs/asset-index.md` มาแทนกำแพง/บันได/อาคารที่ยังเป็น Graphics วาดสด
- [x] เพิ่มคำถาม O-NET ให้ครอบคลุมมากขึ้น — ย้ายไปเป็น `data/questions.json` (69 ข้อ, generate จาก
      `knowledge/`) ดูรายละเอียดที่ `knowledge/README.md`; รันคำสั่ง "Generate N new O-NET Grade 6
      English questions using only knowledge/." เพื่อขยายคลังต่อในอนาคต แล้วเช็คด้วย
      `node scripts/validate-questions.cjs` ก่อน commit
- [ ] ระบบเสียง/เพลงประกอบ (มีไฟล์ BGM ใน `D:\Asset` รอใช้งาน)
- [ ] เมื่อมีข้อสอบ O-NET ปีใหม่เพิ่มใน `D:\ข้อสอบ O-net` ให้รันขั้นตอนวิเคราะห์ pattern ใหม่
      (ดู `knowledge/README.md`) แล้วค่อย generate คำถามเพิ่มเข้า `data/questions.json`

อัปเดตรายการนี้ทุกครั้งที่เริ่ม/จบงานแต่ละอย่าง — ย้ายรายการที่เสร็จไป `CHANGELOG.md`
