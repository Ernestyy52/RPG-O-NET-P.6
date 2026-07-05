# Boss Template

ใช้เทมเพลตนี้เวลาออกแบบบอสประจำชั้นใหม่ (ทุก 10 ชั้น)

- **ชื่อ**:
- **ชั้นที่ปรากฏ**:
- **ไบโอม**: (อ้างอิง `data/biomes.ts`)
- **HP / ATK**: อิงสูตร scaling ใน `data/floors.ts` (`isBossFloor` คูณ HP x4, ATK x2)
- **Sprite**: ระบุ path asset ที่ใช้ (ต้องผ่าน `assetPath()`)
- **รูปแบบการต่อสู้ / กติกาพิเศษ**:
- **คำถามที่ใช้**: ระดับความยากตาม `getQuestionDifficulty(floor)`
- **รางวัลพิเศษ (ถ้ามี)**:
