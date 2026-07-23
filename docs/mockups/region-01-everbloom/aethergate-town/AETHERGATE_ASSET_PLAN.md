# AETHERGATE ASSET PLAN — แผนผลิต asset ก่อนสร้างไฟล์ (MapBuild P1, ขั้นบังคับตาม workflow ข้อ 2)

> เขียน 2026-07-18 หลัง scale gate ผ่าน (MAP_SCALE_DECISION §S3–S4) — ทุกชิ้นผลิตที่ **16px native,
> แสดง integer 2× (TILE 32)**, world เมือง **M1 64×48 tiles (2048×1536 px)** ตามผัง greybox
> ที่พิสูจน์ reachability/route แล้ว (`app/game/runtime/scaleLab.ts` — AETHERGATE_BUILDINGS 12 หลัง)
> ภาพอ้างอิง: 7 PNG ใน pack นี้ (ลงทะเบียน concept-reference ใน ASSET_REGISTRY แล้ว) —
> **ห้ามตัด/ย่อภาพเหล่านี้ไปเป็น runtime art** (non-negotiable #1)

## 1) Reusable base kit — "R1 Verdant ground & street" (ใช้ซ้ำทั้ง Region 1)

| กลุ่ม | ชิ้นที่ต้องมี (ตาม outdoor board แถวบน-ซ้าย) | แหล่งก่อนสร้างใหม่ (กติกา: ใช้ของเดิมก่อน) |
|---|---|---|
| พื้นหญ้า | base ×3 variant + edge ตรง 4 ทิศ + inner/outer corner | tiny-town (CC0, 16px, มีใน public/ แล้ว) — ตรวจ frame ใน `docs/asset-index.md` ก่อน; ขาดค่อยวาดเพิ่ม |
| ทางเดินหิน/ดิน | base ×3 + edge/corner + รอยต่อหญ้า↔ทาง (transition) | tiny-town paths (40–43) มีอยู่ — เพิ่ม corner/transition ที่ขาด |
| ลานหิน plaza | แผ่นใหญ่ + วงแหวนรอบน้ำพุ (วงกลม ~7 tiles) | วาดใหม่ (ไม่มีในแพ็ค) — อิง mockup ช่องกลาง |
| น้ำ/ลำธาร | base + ขอบตลิ่ง + waterfall 2 เฟรม + สะพานหิน/ไม้ (แนวนอน+แนวตั้ง) | เช็ค Sunnyside World / Kenney ใน `D:\Asset` ตาม asset-index ก่อน; waterfall อาจต้องวาด |
| รั้ว/กำแพงเตี้ย | รั้วไม้ (มี tiny-town 80–82,71) + กำแพงหินขอบเมือง + ประตูรั้ว | tiny-town + วาดเสริมกำแพงหิน |
| ต้นไม้/พุ่ม | ต้นใหญ่ ×2, ต้นซากุระ landmark ×1, พุ่ม/แปลงดอกไม้ ×4, ซุ้มไม้เลื้อย | tiny-town tree + Craftpix exterior-props (มี license แล้ว) + วาด landmark |

**Depth/collision กติกาเดียวกันทุกชิ้น**: prop สูง = 2 ส่วน (foreground overlay เหนือหัว + collision
footprint ที่โคน), เงาทิศเดียว (แสงบนซ้ายตาม ART_BIBLE), silhouette ขอบชัดบนพื้นทุกสี

## 2) Landmark เฉพาะแมพ (จาก town map mockup — 12 อาคาร + 4 จุดเด่น)

| ชิ้น | footprint (tiles จาก greybox M1) | หมายเหตุ art |
|---|---|---|
| Guild Hall (ซ้ายบน โทนน้ำเงิน-ดาบไขว้) | ~10×7 | ป้าย guild + ธง; ประตู 2 tiles |
| Library/Academy (เขียวหนังสือ) | ~9×6 | กระจก stained-glass เขียว |
| **Aether Portal Gate (กลางบน)** — landmark หลัก | ~8×8 + วงพอร์ทัล | พอร์ทัลวน 4 เฟรม; คือประตูสู่ Whisperwood |
| Town Hall (แดง-นาฬิกา) | ~9×6 | หอนาฬิกา + รูปปั้นหน้าตึก |
| Eco/Herb House (เขียวใบไม้ ขวาบน) | ~8×6 | น้ำพุเล็กข้างตึก |
| Forge (แดงเข้ม-ค้อน) | ~7×5 | ปล่องควัน + ไฟเตา 2 เฟรม |
| Shrine/Waystone Hall (ม่วง-คริสตัล 3 สี) | ~8×6 | คริสตัล แดง/น้ำเงิน/เขียว เรืองแสง |
| Inn (ส้ม-เหยือกเบียร์) | ~11×7 | ร่ม/โต๊ะหน้าร้าน (safe pocket โซนพัก) |
| Stable/Lodge (เขียว-ม้า) | ~9×7 | คอกม้า + กองฟาง (สัตว์ = prop เคลื่อนไหว 2 เฟรม) |
| Boutique/Tailor (ชมพู) | ~7×5 | กันสาดลาย + ดอกไม้ |
| Bank/Job Hall (ม่วง-ถุงเงิน / น้ำเงิน-กระเป๋า) | ~8×6 ×2 | สองหลังฝั่งขวา; Job Hall = จุดพิธีเปลี่ยนอาชีพ (RO_FEEL_GAP #2) |
| น้ำพุกลางเมือง | 4×4 + วงแหวน | น้ำ 4 เฟรม — จุด teleport-in ของ waystone |
| เวทีเทศกาล (ขวาบนของ plaza) | 6×5 | ธง+ไฟราว — จุดกิจกรรม O-NET event |
| ประตูใต้ + รูปปั้นเทวทูต ×2 | 6×3 | ทางเข้าเมือง (spawn ครั้งแรก) |
| Waystone มุมเมือง ×4 (ฟ้า) | 2×2 ต่อจุด | เรืองแสง 2 เฟรม — เสา fast-travel/**shortcut ปิดเส้น spawn→บริการไกล 12.6s** (S1) |
| ตลาดนัดกลาง (แผง ×6 + เกวียน) | 2×2 ต่อแผง | กันสาดสลับสี — encounter "environmental English" (ป้ายราคา/บทสนทนาซื้อของ) |

## 3) Transition / Animation / VFX / Audio ที่ต้องมี

- **Animation**: น้ำพุ (4f), พอร์ทัล (4f), waystone glow (2f), ไฟเตา forge (2f), ธง/กันสาดไหว (2f), น้ำตกลำธาร (2f)
- **VFX**: ประกาย aether ลอย (particle เบา ๆ รอบ portal/waystone — reduced-motion ต้องปิดได้)
- **Transition tiles**: หญ้า↔ทาง, ทาง↔ลานหิน, ตลิ่ง↔น้ำ, ขอบเมือง↔ป่า (เข้า Whisperwood ฝั่งเหนือ)
- **Audio (backlog Phase 10 — บันทึกไว้ ไม่บล็อก slice)**: ambience เมือง กลางวัน/กลางคืน, เสียงน้ำพุใกล้ plaza, ระฆังเมื่อเปลี่ยน day-phase

## 4) กติกา production (ผูกกับ validator/registry)

1. Source แยกชิ้น 16px ใน `public/aethergate/` (โฟลเดอร์ใหม่ + provenance ใน asset-truth PROVENANCE)
   → atlas ต่อโซน (`aethergate-atlas.png/json`) ก่อน ship; dev gallery `/dev/assets` ต้องโชว์ครบ
2. ทุกไฟล์ = ต้นฉบับวาดใหม่/curate จากแพ็คที่มี license (tiny-town CC0, Craftpix licensed, `D:\Asset`)
   — **ห้าม recolor-only แทน biome อื่น, ห้าม copy RO**; บันทึก source/tool/prompt ต่อชิ้น
3. ZoneDefinition M1 64×48 ใช้ผัง greybox เดิม + แก้ตามหนี้ S3: **lane academy↔gatehouse ≥2 tiles**
   (ขยับ footprint), **interior ใหม่ ≥ 20×15 tiles** (guild) — ห้องเล็กใช้กล้องกึ่งกลาง + backdrop แต่งแล้ว
4. Slice order (เล่นได้ก่อนสวยครบ): base kit → ถนน/ลาน → Portal Gate + Guild + Item Shop + Inn
   (ครบ loop เดิน Town→Whisperwood→Town) → อาคารที่เหลือ → ตลาด/เวที/สวนลับ (secret garden = optional secret)
5. Gate ต่อแมพตาม MOCKUP_MANIFEST §Production gate (reachability, save/reload, มือถือ 390×844, budget วัดจริง)

## 5) สิ่งที่ยังไม่ตัดสิน (ต้องดูของจริงตอนลงมือ)

- แพ็คไหนใน `D:\Asset` ใกล้ mockup พอให้ curate เป็น base kit ได้บ้าง — ต้องเปิดดูจริงตาม
  `docs/asset-index.md` แล้วบันทึกผลใน plan นี้ (คอลัมน์ "แหล่ง" ด้านบนเป็น candidate ไม่ใช่ข้อสรุป)
- ปริมาณ variant ต่อพื้น (3 พอไหมสำหรับ 64×48 ไม่ให้ลายซ้ำสะดุดตา) — ตัดสินจาก in-game screenshot
