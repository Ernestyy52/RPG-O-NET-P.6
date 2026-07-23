# ZONE CONTRACT — สัญญาข้อมูลสำหรับการเปลี่ยนแมพครั้งใหญ่

> เขียนไว้ล่วงหน้าสำหรับ session ถัดไป: ผู้ใช้กำลังทำ mockup แมพ + asset ชุดใหม่
> เอกสารนี้บอกว่า "แมพหนึ่งผืน" ต้องให้ข้อมูลอะไรบ้าง จึงเสียบเข้าระบบที่มีอยู่ได้ทันที
> โดยไม่ต้องแก้ engine/HUD — อิงของจริงที่ TownScene ทำสำเร็จแล้วกับภาพ `town-night.png`

## บทเรียนจาก TownScene (แนวทางที่พิสูจน์แล้ว)

เมืองปัจจุบันใช้ **ภาพ mockup เต็มผืนเดียว** (`public/town-art/town-night.png`, 1404×712) แล้ววางข้อมูลทับ:

1. `ZONES` — กล่องชน (พิกัดภาพต้นฉบับ) + จุดประตู + event ที่เปิด
2. `SLICES` — สี่เหลี่ยมที่ครอปจากภาพมา y-sort ให้ผู้เล่นเดินอ้อมหลังอาคารได้
3. จุดแสง/เอฟเฟกต์ (โคม, หน้าต่าง, เปลวไฟ) เป็น list พิกัด

ทุกพิกัดอ้าง "พิกเซลภาพต้นฉบับ" คูณ scale ตอนสร้างฉาก — **แมพใหม่ทุกผืนใช้สูตรเดียวกันนี้ได้เลย**

## สิ่งที่แมพใหม่หนึ่งผืนต้องส่งมอบ (ต่อผืน)

| ข้อมูล | รูปแบบ | ใครใช้ |
|---|---|---|
| ภาพแมพเต็มผืน (PNG) | ขนาดจริง เช่น 1404×712, ไม่มี UI ในภาพ | scene พื้นหลัง |
| กล่องชน (collision boxes) | `[x0, y0, x1, y1]` พิกัดภาพ | physics + minimap `blocks` |
| ประตู/พอร์ทัล | จุด `[x, y]` + ปลายทาง (`zoneId` + `spawnId`) | portal trigger + world graph edge |
| จุดเกิด (spawns) | `id` + `[x, y]` — อย่างน้อย `default` และหนึ่งจุดต่อประตูขาเข้า | เกิด/กลับจากโซนอื่น |
| อาคาร/ก้อนที่ต้อง y-sort | สี่เหลี่ยมครอป `[x, y, w, h]` | SLICES |
| จุดแสง/เอฟเฟกต์ (ถ้ามี) | list พิกัดต่อชนิด | atmosphere |
| landmark 2–3 จุด + ชื่อ | `id`, `name`, `[x, y]` | quest/บทพูด/minimap |
| โซนเกิดมอนสเตอร์ (field/dungeon) | กรอบ `minX/maxX/minY/maxY` + slug + จำนวน | SpawnSystem |
| provenance ของภาพ/asset | ที่มา + license + เครื่องมือที่ใช้ | ASSET_REGISTRY (กติกา Phase 10) |

## สิ่งที่ engine มีให้แล้ว (ไม่ต้องทำใหม่ต่อแมพ)

- **Minimap** — publish `minimap:layout` (blocks + markers ใน world px) แล้ว HUD วาดเอง
  (`app/game/systems/minimap.ts` + `app/components/game/Minimap.vue`) ทุกฉาก wire แล้วเป็นตัวอย่าง
- **World graph + validator** — เพิ่มโซน/edge ใน `app/game/runtime/worldGraph.ts` แล้ว
  `validateWorldGraph()` บังคับว่า ไปถึงได้จากเมือง + กลับเมืองได้ (no soft-lock) ผ่าน unit test
- **PlayerLocation** — `{ worldId, zoneId, spawnId, progressionRank, towerFloor? }` พร้อม adapter
  `locationFromFloor()` จากเซฟปัจจุบัน (save v6 zone-first จะตามมาเมื่อแมพใหม่ลง)
- **Dungeon layout pipeline** — `DungeonLayoutConfig` + `buildCollisionMap` + `layoutReachability`
  (BFS พิสูจน์ no-soft-lock ราย px) — ดันเจี้ยนใหม่ทำตาม `app/game/runtime/dungeonLayouts.ts`
- **Movement/Spawn/Encounter** — pure systems ใน `app/game/runtime/` ใช้ซ้ำได้ทุกฉาก
- **Loadout combat + learning gate** — ไม่ผูกกับแมพ ใช้ได้ทันทีทุกโซน World-1

## ลำดับงานตอน mockup มาถึง (แนะนำ)

1. วางภาพลง `public/` + ลงทะเบียน provenance ใน ASSET_REGISTRY
2. สร้าง data ผืนแมพ (ตารางด้านบน) ในไฟล์ `app/data/zones/<id>.ts`
3. เพิ่ม node/edge ใน world graph → รัน `test/world-graph.spec.ts`
4. ชี้ scene (Town-style หรือ Dungeon-style) ไปที่ data ใหม่ — engine เดิม render ได้เลย
5. Minimap/quest/marker ได้มาฟรีจาก contract เดียวกัน
