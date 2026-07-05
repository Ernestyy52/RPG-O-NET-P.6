# LPC POC — เครดิต asset (เฉพาะ Proof-of-Concept อาชีพนักรบ)

ไฟล์ในโฟลเดอร์นี้เป็นเลเยอร์ pixel-art จากระบบ **LPC "Universal Sprite Sheet" convention**
ดาวน์โหลดผ่าน generator: https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator

ทุกไฟล์อยู่ภายใต้สัญญาอนุญาต **OGA-BY 3.0** เท่านั้น (ไม่ใช้ไฟล์ที่มีเงื่อนไข copyleft แบบ CC-BY-SA/GPL)
ตามที่ระบุใน `CREDITS.csv` ของ repo ต้นทาง

## ไฟล์ที่ใช้

| ไฟล์ | ชั้น (layer) | ผู้สร้างต้นฉบับ |
|---|---|---|
| `body_female_light.png` | ร่างกาย (zPos 10, ล่างสุด) | ElizaWy |
| `legs_leggings_thin_brown.png` | ขา/กางเกง | Johannes Sjölund (wulax) |
| `torso_leather_female.png` | เสื้อ/เกราะหนัง | bluecarrot16, JaidynReiman |
| `hair_curly_short_darkbrown.png` | ผม (บนสุด) | ElizaWy |

หมายเหตุ: ผู้สร้างที่ระบุอ้างอิงจาก `CREDITS.csv` ของ Universal-LPC-Spritesheet-Character-Generator
สำหรับชุดเลเยอร์นี้ ทุกไฟล์ยืนยันแล้วว่าอยู่ภายใต้ OGA-BY 3.0 เท่านั้น (ไม่มีไฟล์ที่ติด GPL/CC-BY-SA)

## สถานะ

ใช้เฉพาะใน **Proof-of-Concept อาชีพนักรบ** (`game/entities/Player.ts`, ธง `LPC_POC_ENABLED`)
เพื่อทดลองแนวทาง layered pixel-art ก่อนตัดสินใจ roll out ให้ครบ 4 อาชีพ
ยังไม่รองรับการ recolor ตามสีผิว/ผมที่ผู้เล่นเลือกตอนสร้างตัวละคร (ข้อจำกัดที่ทราบอยู่แล้วของ POC นี้)
