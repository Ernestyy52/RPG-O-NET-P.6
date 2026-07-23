# ART_BIBLE — SPIRAL'S ECHO

> กติกาภาพที่ทุก asset ใหม่ต้องยึด (Master Plan Phase 2 Batch E) — ขยายจากส่วน Art Bible ใน
> `docs/ASSET_MANIFEST.md`; ห้ามเลียนแบบเกม/ศิลปินเฉพาะ; asset ใหม่ต้อง original + provenance ครบ

## Scale
- **Native sprite scale:** 16px tile (Kenney tiny-town/tiny-dungeon) — งาน hero/mob จาก MCA pack
  ใช้ native ของ pack แล้วคุมด้วย display scale
- **Integer display scale เท่านั้น:** 2x เป็นหลัก (TILE 32 จาก SRC 16) — ห้าม scale เศษส่วน
- **Nearest-neighbor เสมอ** สำหรับ pixel art (Phaser: `pixelArt: true`, CSS: `image-rendering: pixelated`)
- **สัดส่วนตัวละคร:door:อาคาร** — ประตูสูง ≥ ตัวละคร 1.25x, อาคารหลัก ≥ 3 tiles สูง, NPC เท่าผู้เล่น

## Palette / Lighting
- ธีมหลัก **dark-fantasy กรอบทอง** (`main.css`: pixel-window, glass-panel, gold-text;
  `atmosphere.ts`) — UI โทนเข้ม + accent ทอง `#ffe08a`, outline เข้ม `#2a1e1c`
- **Palette ต่อ biome** (5 biome วนทุก 10 ชั้น): forest เขียวอุ่น / desert ทรายส้ม / snow ฟ้าเย็น /
  volcano แดงดำ / cave ม่วงเทา — bake ผ่าน `textures.ts` เท่านั้น ห้ามทำ tileset แยกต่อ biome โดยไม่จำเป็น
- **แสง:** เมือง = warm torch (เหลืองส้ม, มุมแสงบน-ซ้าย), ดันเจี้ยน = เย็น (ฟ้า/ม่วง)
- **เงา:** ellipse เข้มโปร่ง 30–40% ใต้เท้า, ทิศเดียวกันทั้ง scene
- **Saturation/contrast:** sprite หลัก contrast สูงกว่า background; prop ตกแต่ง desaturate ลง ~15%

## UI / Icons
- Icon style: กรอบ 1px เข้ม + fill flat + highlight มุมบนซ้าย — ขนาดฐาน 16/32px
- **ห้าม emoji เป็น production icon หลัก** — ใช้ได้เฉพาะ dev/placeholder หลัง flag
- ทุก item/skill ที่เปิดใช้ต้องมี icon + tooltip จริง

## VFX shape language ต่อคลาส
- **Warrior** เส้นตัด/arc หนัก โทนแดงส้ม · **Archer** เส้นตรงเร็ว/เรียว โทนเขียว
- **Mage** วงกลม/รูน โทนม่วงฟ้า · **Guardian** โล่/หกเหลี่ยม โทนทอง
- ห้ามใช้ effect เดียวเปลี่ยนสีแทนทุก skill — รูปทรงต้องสื่อผลของ skill

## Accessibility
- Color-blind: ทุกสถานะสำคัญต้องมี shape/icon/ตำแหน่ง ประกอบสีเสมอ (เช่น intent ของมอนสเตอร์
  ใช้ไอคอนรูปทรงต่างกัน ไม่ใช่สีเดียว)
- Reduced motion: ทุก VFX loop ต้องมีเวอร์ชันลด/ปิด ตาม setting เดิม (P17)
- Text บน HUD ≥ 12px ที่ viewport 390×844

## Perspective
- Top-down 3/4 (มองลง ~30°) — prop ตั้งฉากหน้าตรง, หลังคาเห็นด้านบน
- ห้าม mix isometric เข้ากับ top-down ใน scene เดียว
