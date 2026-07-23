# Map / Character Scale Analysis — Spiral's Echo

> เอกสารสรุปผลการวิเคราะห์สเกลแมพ-ตัวละคร-กล้อง ตามที่ผู้ใช้ขอ (2026-07-18)
> **สังเคราะห์จากหลักฐานที่วัดจริงแล้วใน Scale Phase S0–S3** — รายละเอียดการทดลองเต็มอยู่ที่
> `docs/MAP_SCALE_DECISION.md` (S0 baseline → S1 greybox 3 ขนาด → S2 hero/camera → S3 scoring)
> และ state งานแมพที่ `docs/MAP_BUILD_STATE.md` — **scale gate ผ่านแล้ว ห้ามทำการทดลองซ้ำ**

## Current State (วัดจากโค้ด/รันไทม์จริง ไม่ใช่ความจำ — ตาราง S0)

- Tile size: **32 world px** (source art 16px, integer 2×, `app/game/runtime/zone.ts`)
- Character frame size: **43–53 × 96 px ต่อคลาส×เพศ** (hero-atlas; ความสูงทั้งเฟรมคือ 96px)
- Character rendered size: **HERO_DISPLAY_H = 48px** (= 96 × 0.5 integer scale; สูง 1.5 tile)
- Anchor: origin (0.5, 0.92) — กึ่งกลางแนวเท้าด้านล่าง
- Collision size: **18×12 world px ที่เท้า** (offset ก้น -3px, เท่ากันทุกคลาส — แฟร์/sync ง่าย)
- Camera internal resolution: 640×480, `Scale.FIT`, `pixelArt: true` (= internal ไม่ใช่ CSS;
  CSS scale แปรตามจอ: desktop 1280×800 ≈ 1.26–1.67, mobile 390 ≈ 0.58–0.61)
- Camera zoom: 1.00 ทุกฉาก, follow player
- Existing town dimensions: town-night.png 1404×712 ย่อ 0.854 (**เศษส่วน — ผิดกติกา integer**)
  ⇒ world ~1199×608 px ≈ 37×19 tiles
- Mockup dimensions: 1536×1024 (concept board — ไม่ใช่ dimension spec / ไม่ใช่ background)

## Root Cause (ทำไมตัวละคร "ดูใหญ่เกินเมือง")

หลายปัจจัยร่วมกัน — **ไม่ใช่เพราะ hero 48px ใหญ่เกิน**:
1. **เมืองเดิมเล็กเกิน** (37×19 tiles): ทุก service ถึงใน <5s, อาคารจริงเล็กจน hero สูงเกือบ
   เท่าอาคาร — mockup มี 12 อาคาร 5 เขต ต้องการพื้นที่ระดับ 64×48
2. **town art เป็นภาพผืนเดียวย่อ 0.854** — สเกลอาคาร/ถนนถูกบีบตามภาพ ไม่ใช่ตาม tile grid
3. **มือถือ: layout หน้าเพจกิน ~60% ของจอ** ⇒ hero บนจอจริงเหลือ ~15–27px (< เกณฑ์ 28px) —
   ปัญหา layout ไม่ใช่ scale ในเกม (แก้แล้ว 2026-07-18)
4. มุมกล้อง mockup เป็น bird's-eye โชว์ทั้งเมือง — เป็น composition ของ concept ไม่ใช่สเปกกล้อง
   รันไทม์ (กล้องจริง 640×480 zoom1 เห็น 20×15 tiles = ถูกต้องสำหรับ top-down 3/4)

## Greybox Tests (S1 — เดินจริงในเบราว์เซอร์ที่สปีดจริง 130px/s; ห้ามใช้ mockup เป็น art)

Greybox 32px ล้วน (Phaser Graphics) trace ผัง 12 อาคาร+น้ำพุ+เวที+ประตูใต้+waystone จาก mockup
Aethergate → `/dev/scale-lab` เดินเองได้ + auto-route จับเวลา; ตัวเลขเต็ม 8 เส้นทางใน
MAP_SCALE_DECISION §S1:

| Option | Tiles | Pixels | Char scale | Zoom | Routes in-band | Score สรุป |
|---|---|---|---|---|---|---|
| M0 Compact | 48×36 | 1536×1152 | 1.0 (48px) | 1.0 | 4/8 — เมือง "จบเร็ว", ถนนแน่น | ตก |
| **M1 Balanced** | **64×48** | **2048×1536** | 1.0 | 1.0 | **6/8** — องค์ประกอบใกล้ mockup สุด | **ชนะ** |
| M2 Spacious | 80×60 | 2560×1920 | 1.0 | 1.0 | 4/8 — โล่งเกินโดยไม่มีเนื้อหา | ตก |

เส้นที่ M1 หลุด (spawn→บริการไกล 12.6s เกิน 0.6s) แก้ด้วย **unlockable shortcut** ตาม per-map
contract — ไม่ย่อแมพ ไม่ย่อตัวละคร

## Character Scale Tests (S2 — สไปรต์จริง + cadence 8 ทิศ + zoom ทางเลือก)

| Test | ผล |
|---|---|
| 48px (0.5×) คงเดิม | cadence สม่ำเสมอ {2} ✓, width band ครบ 8/8 คลาส ✓ — **ชนะ** |
| 44px (0.4583×) | cadence ไม่สม่ำเสมอ {2,3} ✗, ตาเบี้ยวเห็นจริงใน compare 4×, 2 คลาสหลุด band, มือถือ 26.8px < 28 ✗ |
| 40px (0.4167×) | แย่กว่า: หน้าแทบหาย, 6/8 คลาสหลุด band, มือถือ 24.4px ✗ |
| "คง 48 + เห็นโลกเพิ่มด้วยกล้อง" | V1 800×600 zoom1: +25% โลก/แกน, hero ยังอ่านชัด — **นี่คือคำตอบ ไม่ใช่ย่อตัวละคร** |

Scale 0.875/0.75 ตามข้อเสนอ = 42/36px จาก 96px source → non-integer เช่นเดียวกับ 44/40
(pixel cadence พังแบบเดียวกัน) — ครอบคลุมโดยผลข้างบนแล้ว; พิสูจน์ด้วยฟังก์ชัน `rowCadence()`
(unit test) ว่า **มีเพียง integer divisor (0.5×) เท่านั้นที่ cadence เรียบ**

ฟิสิกส์ไม่เปลี่ยนทุกการทดลอง: เดิน route บนทุก hero profile ได้เวลา = ตาราง analytic เป๊ะ (Δ0.0s)

## Final Decision (S3 scoring 93/100, ไม่มีหมวด <80% → SCALE GATE PASSED)

- Selected option: **Contract C** — M1 64×48 + hero 48px + desktop V1 800×600 zoom1 +
  mobile MA portrait-adaptive (480×fit-container) zoom1; MZ zoom1.25 = opt-in accessibility
  (tile กลายเป็น 2.5× → หลุด integer จึงห้ามเป็น default); V0 640×480 = fallback
- Character scale before/after: 48px → **48px (ไม่เปลี่ยน)**; collider 18×12 → **18×12 (ไม่เปลี่ยน)**
- Camera zoom before/after: 1.0 → **1.0** (เปลี่ยน internal viewport แทน zoom — คม integer เสมอ)
- Map size before/after: town 37×19 → **64×48 tiles** (Aethergate production ตอน S4/P1)
- เหตุผล: เข้าเป้าเวลาเดินมากสุด (6/8), องค์ประกอบใกล้ mockup สุด, ตัวเลือกย่อ hero ตกทั้ง
  หลักฐานคณิต (cadence/width band) และภาพ (ตาเบี้ยว/หน้าหาย) และเกณฑ์มือถือ ≥28px

## Mockup Integration

- Mockups used: Aethergate town map board (trace เป็น normalized layout ใน
  `app/game/runtime/scaleLab.ts` — **ไม่เคยโหลด PNG เข้ารันไทม์**)
- Layout elements used: 12 อาคาร, น้ำพุ/เวที blockers, ประตูใต้, plaza, waystone 4 จุด, เขตถนน
- Assets used: hero-atlas จริง (ผู้เล่น+NPC stand-in) ใน scale lab
- Assets modified: ไม่มี (greybox = Graphics ล้วน)
- Missing assets: modular 16px tiles ทั้งหมดของ Aethergate (สร้างใน S4 จาก 7 ภาพ detailed)
- Placeholders: greybox ทั้งหมดเป็น dev-only (`/dev/scale-lab` ตัดจาก prod ผ่าน pages:extend —
  พิสูจน์ด้วย verify:pages) — **ไม่มี placeholder ใน production**

## Validation

- Build: `nuxt generate` (NUXT_APP_BASE_URL=/RPG-O-NET-P.6/) exit 0 + verify:pages PASS
- Tests: vitest 409/409 (47 ไฟล์) + vue-tsc exit 0
- Runtime: playtests Edge headless ทั้งหมด 0 browser errors —
  S1 16/16 · S2 16/16 · S3 matrix 47/47 (5 resolutions) · mobile-layout 17/17 · minimap 6/6
- Collision: foot box 18×12 เดินจริงทุก greybox; reachability พิสูจน์ด้วย validator กลาง
  (`zoneValidate.ts` — BFS spawn→ทุกประตู/anchor ทุกขนาดแมพ)
- Animation: walk 4 ทิศ + cadence 8 ทิศ บนสไปรต์จริง (screenshot crop ทุกทิศ×ทุก profile)
- Camera: follow + bounds + FIT ตรวจใน 1280×800 / 1440×900 / 1024×768 / 390×844 / 360×640
- Remaining issues (หนี้ S4 — บันทึกใน MAP_SCALE_DECISION §S3): interior ต้อง ≥ viewport
  หรือ camera-fit (letterbox), lane academy↔gatehouse ต้อง ≥2 tiles ใน production map,
  diagonal movement ไม่ normalize (√2×) ต้องแก้ก่อน apply contract

## Changed Files (workstream scale ทั้งหมด อยู่ใน working tree — ยังไม่ commit ตามคำสั่งผู้ใช้)

- `app/game/runtime/scaleLab.ts` — greybox trace + โปรไฟล์แมพ/hero/view + cadence/width/on-screen math + interiors
- `app/game/dev/ScaleLabScene.ts` — dev lab: สไปรต์จริง, cadence walk, teleport, night, class switch, fps overlay
- `app/pages/dev/scale-lab.vue` — dev page (ตัดจาก prod)
- `app/game/systems/heroFrames.ts` (ใหม่) + `app/game/systems/textures.ts` — ขนาดเฟรม pure module
- `app/pages/index.vue`, `app/components/game/Hud.vue`, `app/components/game/Minimap.vue`,
  `app/assets/css/main.css` — mobile layout fix (production)
- `test/scale-lab.spec.ts` — 20 เทส (greybox/cadence/width/on-screen/interior/lane)
- `scripts/playtest-scale-lab{,-s2,-s3}.mjs`, `scripts/playtest-mobile-layout.mjs`,
  `scripts/s2-cadence-zoom.mjs` — หลักฐานอัตโนมัติ
- เอกสาร: `docs/MAP_SCALE_DECISION.md`, `docs/MAP_BUILD_STATE.md`, `docs/EXECUTION_STATE.md`, ไฟล์นี้
