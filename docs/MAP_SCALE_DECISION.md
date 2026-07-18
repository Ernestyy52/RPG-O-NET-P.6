# MAP_SCALE_DECISION — world scale, character size, camera

> Phase S0–S3 ของ `docs/mockups/CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT.md`
> สถานะ: **S0 measured baseline DONE (2026-07-17)** — ยังไม่ตัดสิน profile ใดๆ
> ห้ามสรุป "ย่อฮีโร่" จากความรู้สึก; ทุกข้อสรุปต้องมาจาก greybox S1–S3

## S0 — ค่าคงที่ปัจจุบัน (ตรวจจากโค้ด ไม่ใช่จากความจำ)

| ค่า | ไฟล์:บรรทัด | ค่าจริง |
|---|---|---|
| Viewport | `app/game/createGame.ts:10` | 640×480, `Scale.FIT` + `CENTER_BOTH`, `pixelArt: true` |
| Camera zoom | (ไม่มี `setZoom` ในโค้ด) | 1.00 ทุกฉาก; follow player (Town/Tower/Dungeon) |
| Tile | `app/game/runtime/zone.ts:11` | TILE = 32 world px (source art 16px, integer 2×) |
| Hero display | `app/game/systems/textures.ts:45` | HERO_DISPLAY_H = 48 px (= 1.5 tiles) |
| Hero source frames | `textures.ts:18–23` | 43–53 × 96 px ต่อคลาส×เพศ (atlas เดียว); scale = 48/96 = 0.5 integer ✓ |
| Foot collider | `textures.ts:51–57` | 18×12 world px ที่เท้า (0.56×0.38 tile), offset -3px, เท่ากันทุกคลาส |
| Speeds | TownScene:312 / Interior:265 / Boss:366 / movement.ts:30 | Town 130 px/s; Interior/Boss 120; Tower (PLAYER_SPEED) 120 |
| ⚠ Diagonal | `runtime/movement.ts:38–42` | ไม่ normalize — เดินทแยง = √2× (~184 px/s ในเมือง) |
| Town dims | TownScene:27–29,135–136 | ART 1404×712 → WORLD_H 608 ⇒ world ≈1199×608 px (≈37.5×19 tiles) — **สเกลภาพ 0.854 ไม่ใช่ integer** |
| Tower floor | zone.ts | 24×18 tiles = 768×576 px |
| Dungeons | dungeonLayouts.ts | mini 18×14 (576×448), main 28×22 (896×704) |
| Interior | InteriorScene (data-driven) | world เล็กกว่า viewport 640×480 (เห็น letterbox ดำ) |

### เวลาเดินปัจจุบัน (คำนวณจาก world px / speed จริง)
| เส้นทาง | ระยะ | เวลา |
|---|---|---|
| ข้ามเมืองเต็มกว้าง | 1199 px @130 | ~9.2 s |
| spawn (595,367) → portal/plaza (629,164) | ~205 px | ~1.6 s |
| spawn → Guild door (944,176) | ~540 px (L) | ~4.2 s |
| spawn → Item shop door (256,407) | ~380 px (L) | ~2.9 s |
| เดิน loop รอบเมืองคร่าวๆ | ~3300 px | ~25 s |
| ข้าม tower floor | 768 px @120 | ~6.4 s |

เทียบเป้า repeat-visit ของ scale prompt (plaza 3–6s, service 4–10s, กลับ spawn ≤12s):
**เมืองปัจจุบันเล็กกว่าเป้า** — ทุก service ถึงใน <5s. แมพ mockup Aethergate (12 อาคาร 5 district)
ใหญ่กว่ามาก ⇒ ขนาด M1 64×48 (2048×1536) ข้ามเต็มผืน ~15.8s @130 — เป็น first candidate ตาม prompt

### วัดจริง (scripts/scale-lab-s0.mjs, Edge headless, 2026-07-17)
| | boot→TownScene | FPS (rAF 2s) | JS heap | browser errors |
|---|---|---|---|---|
| desktop 1280×800 | 2393 ms | 240 | 51 MB | 0 |
| mobile 390×844 (touch) | 2198 ms | 240 | 49 MB | 0 |

Screenshots: `.playtest/s0-baseline/{desktop-1280x800,mobile-390x844}-{1-spawn,2-plaza,3-lane,4-guild-door,5-interior}.png`
(เส้นเดินเข้า Guild interior สำเร็จจริงทั้งสอง viewport — 5-interior คือใน Guild Hall)

## S0 — ปัญหาที่สังเกตได้จากหลักฐาน (ยังไม่ใช่ข้อสรุป)

1. **Mobile วิกฤตสุด**: HUD (title + status card + character card) กิน ~60% ของ 390×844 —
   canvas เหลือแถบ ~390×330; ตัวละครสูงจริงบนจอ ~15–17 px « เกณฑ์ขั้นต่ำ 28px ของ prompt;
   minimap ทับ title bar. ปัญหาใหญ่คือ **layout ของหน้า ไม่ใช่ scale ในเกมอย่างเดียว**
2. **Interior letterbox**: interior world เล็กกว่า viewport 640×480 → ภาพชิดซ้ายบน + พื้นที่ดำ
   ตาย (camera bounds clamp) — เสียจอโดยเปล่าและองค์ประกอบไม่กึ่งกลาง
3. **Town art สเกลเศษส่วน**: town-night.png ถูกย่อ 0.854 — ผิดกติกา integer-scale ของ
   ART_BIBLE อยู่แล้ววันนี้ (ภาพ painterly เลยไม่เห็น artefact ชัด แต่ tile-based จะเห็นทันที)
   → สนับสนุนทิศทาง rebuild เป็น modular 16px tiles
4. **ทแยงเร็วกว่า** √2× — กระทบ route timing ทุกตัวเลขข้างบนและความแฟร์ combat kiting
5. Desktop อ่านได้ดี: hero 48px บน viewport 640×480 เด่นพอ (rim light ช่วย), แต่เห็นเมือง
   ~53% ของกว้าง; ป้าย "Dungeon Portal" ทับ tip banner ตอน spawn
6. Hero frames กว้าง 43–53px (ไม่ใช่เลขคู่ของ 16) — โปรไฟล์ย่อ 44/40px จะมี pixel cadence
   ไม่สม่ำเสมอ ต้อง pre-scaled atlas ถ้าเลือกทางนั้น (ตามที่ prompt เตือน)

## S1 (ส่วน analytical — DONE 2026-07-17)

Greybox แบบ pure data: `app/game/runtime/scaleLab.ts` trace ผัง Aethergate จาก mockup
(12 อาคาร + น้ำพุ/เวที + ประตูใต้ + waystone) เป็น normalized coords → instantiate ที่
M0/M1/M2 → BFS shortest path → routeSec ที่ speed จริง 130 px/s; พิสูจน์ reachability ทุกประตู
ด้วย validateZoneReachability (validator เดียวกับทุกแมพ) — `test/scale-lab.spec.ts` 8 เทส
(ตาราง routeSec เต็มพิมพ์ใน test output ทุกครั้งที่รัน)

| Route (เป้า) | M0 48×36 | **M1 64×48** | M2 80×60 |
|---|---|---|---|
| south-gate→plaza (3–6s) | 2.7 ✗เร็ว | **3.9 ✓** | 4.9 ✓ |
| plaza→guild (4–10s) | 9.1 ✓ | **8.6 ✓** | 10.8 ✗ |
| plaza→hospital (4–10s) | 6.6 ✓ | **8.6 ✓** | 10.8 ✗ |
| plaza→item-shop (4–10s) | 3.2 ✗ | **4.4 ✓** | 5.7 ✓ |
| plaza→gatehouse (4–10s) | 3.9 ✗ | **5.4 ✓** | 6.9 ✓ |
| spawn→core service (≤12s) | 11.8 ✓ | **12.6 ✗ (+0.6)** | 15.8 ✗ |
| ข้ามเมืองไกลสุด inn→hospital (15–25s) | 13.5 ✗ | **17.2 ✓** | 21.7 ✓ |
| **สรุป in-band** | 4/8 | **6/8** | 4/8 |

การตัดสินเบื้องต้น (ยัง provisional จนผ่าน feel-pass ในเบราว์เซอร์ + S2/S3):
- **M1 64×48 (2048×1536 px) คือ first candidate ตามคาดของ prompt** — เข้าเป้ามากสุด
- ที่ M1 หลุด: spawn→บริการไกล 12.6s เกิน 0.6s — แก้ด้วย unlockable shortcut ตามสัญญา
  per-map (mockup มี secret garden shortcut + waystone ข้างอยู่แล้ว) ไม่ใช่เหตุให้ย่อแมพ
- M0 ทำให้เมือง "จบเร็วเกิน" (4 เส้นทางต่ำกว่าเป้า) / M2 เกินเป้าโดยไม่มีเนื้อหารองรับ
- บั๊กที่ validator จับได้ระหว่าง trace (พิสูจน์คุณค่า validator): ประตู job-hall ตกใน
  footprint ของ Inn, ประตู town-hall โดนเวทีครอบเมื่อ M2 — แก้แล้วทั้งคู่

## S1 (ส่วน browser feel-pass — DONE 2026-07-17)

`/dev/scale-lab` (dev-only, ตัดจาก prod ผ่าน pages:extend): `app/game/dev/ScaleLabScene.ts`
render greybox จาก `buildGreybox()` ด้วย Phaser Graphics ล้วน (ไม่แตะ mockup PNG) ที่ viewport/
กล้อง/สปีดจริงของเกม (640×480 FIT, zoom 1, follow, 130 px/s, hero stand-in 48px + foot box 18×12,
diagonal ไม่ normalize ตามเกมจริงโดยตั้งใจ) — เดินเองด้วยลูกศร/WASD + auto-route เดิน BFS path
จับเวลา wall-clock บนจอ; ผล route โชว์เป็นตารางเทียบ analytic + target band สดบนหน้า

**Playtest (`scripts/playtest-scale-lab.mjs`, Edge headless): PASS 16/16, 0 browser errors**
- เวลาเดินจริงในเบราว์เซอร์ = ตาราง analytic **เป๊ะทุกเส้นทาง (Δ 0.0s)** — desktop M1 ครบ 8 เส้นทาง
  (in-band 6/8 ตามตาราง S1), M0/M2 key routes (2.7/13.5s และ 4.9/21.7s ตรงตาราง), mobile M1 ตรงด้วย
- keyboard walk ขยับจริงทั้ง 3 profile × 2 viewport; screenshots 12 ภาพ `.playtest/s1-greybox/`

**ข้อสังเกต feel จาก screenshot (หลักฐานภาพ ไม่ใช่ความรู้สึกลอยๆ):**
- M0: ที่ประตู hospital เห็น 3 อาคารเต็มๆ ในจอเดียว — แน่น/ถนนแคบ เมือง "จบเร็ว" สอดคล้อง 4 เส้นทางต่ำกว่าเป้า
- M1: spawn เห็นประตูใต้ + อาคารขนาบสองข้างพอดี มีที่หายใจ — องค์ประกอบใกล้ mockup ที่สุด
- M2: จอเดียวเห็นอาคารเดียว + ลานว่างเปล่ากว้าง — โล่งเกินโดยไม่มีเนื้อหารองรับ ตามคาด
- Mobile 390×844: FIT ย่อ 0.61 ⇒ hero บนจอจริง ~29px — เฉียดเกณฑ์ขั้นต่ำ 28px แบบพอดีเส้น
  และหน้า lab ที่ HUD บางแล้วยังเหลือพื้นที่ดำมาก → ยืนยัน S0 #1: ต้องแก้ mobile layout
  (canvas ต้องได้จอส่วนใหญ่) ก่อนตัดสิน hero profile บนมือถือใน S2

**สรุป S1: M1 64×48 ยืนยันเป็น candidate ด้วยหลักฐานเบราว์เซอร์แล้ว** (ยังรอ S2 hero profiles +
S3 scoring จึงตัดสินสุดท้าย); เส้นที่หลุด (spawn→บริการไกล 12.6s) คงแผนแก้ด้วย shortcut ตาม per-map
contract ไม่ย่อแมพ

## S2 — hero & camera profiles (DONE 2026-07-18)

เครื่องมือ: ScaleLabScene อัพเกรดเป็นสไปรต์ hero atlas จริง (warrior_male + NPC stand-in
guardian_male กว้างสุด 53 / warrior_female แคบสุด 43 / mage_female ที่ plaza พร้อม nameplate 10px),
สลับ hero profile P0 48 / P1 44 / P2 40, view preset V0/V1/MZ/MA, cadence walk 8 ทิศ
out-and-back ที่ anchor ใหม่ `cadence` — ฟิสิกส์ล็อกเท่าเดิมทุก profile (foot box 18×12,
สปีด 130, diagonal ไม่ normalize ตามเกมจริง); โมดูล pure ใหม่ `app/game/systems/heroFrames.ts`
(ขนาดเฟรมแหล่งเดียว textures.ts import ต่อ)

### หลักฐาน (ทั้งหมดวัด/มองจริง ไม่ใช่ความรู้สึก)
- **Unit (pure math, `test/scale-lab.spec.ts` S2 blocks — รวมชุด 406/406 ผ่าน)**:
  - Row cadence ของ source 96px: P0 0.5× ช่องว่างแถว `{2}` สม่ำเสมอ ✓; P1 44px และ P2 40px
    `{2,3}` ไม่สม่ำเสมอ ✗ (แถว anatomy ยุบไม่เท่ากัน — ตามที่ prompt เตือน)
  - Width band 0.65–0.85 tile (20.8–27.2px): P0 ครบ 8/8 คลาส ✓; P1 หลุด 2 (warrior_female 19.7,
    archer_female 20.2); P2 หลุด 6/8 — ย่อ hero ทำคลาสผอมหลุดเกณฑ์อ่านออกจริงตามตัวเลข
  - On-screen ≥28px (มือถือ 390×844 เปล่า): V0 → P0 29.3✓ P1 26.8✗ P2 24.4✗;
    MZ zoom1.25 → 36.6✓; MA 480×portrait → 39.0✓; V1 800×600 → 23.4✗ (V1 ไม่ใช่คำตอบมือถือ)
- **Browser (`scripts/playtest-scale-lab-s2.mjs` — PASS 16/16, 0 errors, Edge headless)**:
  - hero atlas โหลดจริงใน lab (ไม่ใช่ stand-in), P0>P1>P2 ขนาดจริงบนจอ
  - **ฟิสิกส์ไม่เปลี่ยนตามภาพ**: เดิน route บน P2 ได้ 3.9s/17.2s = ตาราง analytic เป๊ะ (Δ 0.0)
  - Desktop V0 (หน้า lab จริง): P0 60.4 / P1 55.4 / P2 50.3 px บนจอ; V1 (800×600, hero คง 48)
    วัดได้ 75.8px เพราะ host หน้า lab สูงยืดได้ — ใน container เกมจริง (สูงตรึง) ค่า analytic
    คือ 64px และเห็นโลกเพิ่ม +25%/แกน
  - **Mobile V0 P0 = 28.0px พอดีเส้น** (padding หน้า 8px×2 กิน margin จาก 29.3 → 28.0) —
    ยืนยัน S0/S1 อีกครั้งว่า layout มือถือคือคอขวด ไม่ใช่ตัว profile; MZ วัดจริง 35.1 ✓,
    MA วัดจริง 37.4 ✓ (canvas internal 480×fit จริง)
  - Screenshots 40+ ภาพ `.playtest/s2-hero/` รวม crop hero กลางจอครบ 8 ทิศ × 3 profile
- **Visual cadence (ขยาย 4× nearest-neighbor, `compare-{E,S,N}-P0-P1-P2-4x.png`
  จาก `scripts/s2-cadence-zoom.mjs`)**: P0 คม ตาสมมาตร รายละเอียดเกราะครบ; P1 ตาเริ่มเบี้ยว
  (ข้างใหญ่ข้างเล็กในมุมหน้าตรง); P2 หน้าแทบหาย ตัวแคบผิดสัดส่วน เส้นขอบเป็นขั้นไม่เท่ากัน —
  ตรงกับ analytic ทุกข้อ
- Regression: S1 playtest เดิม PASS 16/16 ตัวเลข route เท่าเดิมทุกค่า; vue-tsc 0;
  `npm run generate` (NUXT_APP_BASE_URL=/RPG-O-NET-P.6/) exit 0 + verify:pages PASS
  (/dev/scale-lab ยังไม่ leak เข้า prod)

### คำตัดสิน S2 (เข้าสู่ S3 ในฐานะ finalist)
- **เลือก P0 hero 48px (0.5×) เป็น actor scale เดียว** — ทางเดียวที่ cadence สม่ำเสมอ,
  ครบ width band ทุกคลาส, และรอดเกณฑ์มือถือ; **ปฏิเสธ P1/P2** — pre-scaled atlas แก้ได้แค่
  temporal shimmer แต่แก้ตาเบี้ยว/ตัวผอมหลุด band/มือถือต่ำกว่า 28px ไม่ได้
- **"เห็นโลกมากขึ้น" ตอบด้วยกล้อง/viewport ไม่ใช่ย่อตัวละคร**: V1 800×600 zoom 1 (hero คง 48)
  เป็น finalist ฝั่ง desktop ของ S3; มือถือใช้ P3-adaptive = hero 48 + MZ (zoom 1.25 view-only)
  หรือ MA (portrait-adaptive 480×fit) — ตัดสินสุดท้ายใน S3 หลังแก้ mobile layout
- Diagonal √2× ยังเป็นหนี้ฟิสิกส์ (S0 #4) — ไม่ใช่ประเด็น scale แต่ต้องปิดก่อน S4 apply

## Mobile layout fix (S0 ปัญหา #1 — DONE 2026-07-18, production)

เปลี่ยน layout เท่านั้น — ไม่แตะ scale/ฟิสิกส์/viewport ภายใน (นั่นคือหน้าที่ S3/S4):
- `Hud.vue` ≤560px: ซ่อน banner ชื่อเกม (มีบนหน้า title แล้ว), char panel เป็นแถบนอน
  (avatar 40px + ชื่อ/Lv + HP/MP/EXP), ซ่อน ATK/DEF/SPD (ดูใน Status modal),
  sys panel เป็นแถบนอน — **ปุ่มครบทุกปุ่ม** (ไอคอนระบบ + Recreate/Reset ยังกดได้ ไม่มี hidden UI)
- `index.vue`: กรอบ canvas เต็มกว้างจอมือถือ (`-mx-4`) + desktop กรอบ hug canvas
  (`max-w-[802px]`); ย้าย `<GameMinimap />` เข้าไปในกรอบ canvas
- `Minimap.vue`: `fixed` → `absolute` ในกรอบ canvas — **เลิกทับ title bar ถาวรทั้งสอง viewport**
- `main.css` ≤560px: nav-btn/currency-panel ย่อ

ผลวัดจริง (`scripts/playtest-mobile-layout.mjs` — **PASS 17/17, 0 browser errors**):
- มือถือ 390×844: canvas กว้าง 388px (เดิม ~358) ⇒ **hero บนจอ 29.1px ≥28 ✓** (เดิม 26.8 ✗);
  canvas เริ่มที่ y≈150 (< 160 gate; เดิม HUD กิน ~60% ของจอ); ไม่มี horizontal overflow;
  ปุ่มทุกปุ่ม visible; เดินด้วยคีย์บอร์ดได้ปกติ
- Desktop 1280×800: banner เต็มคงเดิม, canvas ≤800, minimap อยู่ในกรอบเกม
- Regression: playtest-minimap 6/6 PASS, vitest 406/406, vue-tsc 0, generate+verify:pages PASS
- Screenshots: `.playtest/mobile-layout/{mobile-390x844,desktop-1280x800}-town.png`

หมายเหตุตรงไปตรงมา: canvas มือถือยังเป็นแถบ 4:3 (388×291) — layout ปลดคอขวดหน้าเพจแล้ว
แต่ "canvas สูงเต็มจอ" ต้องรอ MA portrait-adaptive viewport ซึ่งเป็นการตัดสินของ S3/S4
(จอที่เหลือด้านล่างพร้อมรับแล้ว)

## S3 — objective comparison + scoring (DONE 2026-07-18) → **SCALE GATE PASSED**

เครื่องมือเพิ่มใน lab: interior greybox 2 ขนาด (shop 14×10, guild 22×14 — validator เดียวกัน),
night mode (tint 0.42 + โคมไฟรูปทรงที่ประตู ไม่พึ่งสีเดียว), class switch (แคบสุด warrior_female /
กว้างสุด guardian_male), anchor `lane`, teleport API, metadata overlay ในทุก screenshot
(map/tile/hero/zoom/night/class/fps/pos — ตามข้อบังคับ prompt); unit 20/20 ในไฟล์ scale-lab.spec

### Matrix (`scripts/playtest-scale-lab-s3.mjs` — **PASS 47/47, 0 browser errors**)
เต็ม 10 scenario บน 1280×800 + 390×844; smoke gates บน 1440×900, 1024×768, 360×640;
ภาพทั้งหมด + `measurements.json` ใน `.playtest/s3-matrix/` (hero P0 48px ล็อกจาก S2, แมพ M1)

| Finalist | on-screen hero (px) ตาม resolution | fps | gate ≥28 |
|---|---|---|---|
| V0 desktop | 53.8 (1024) / 57.0 (1280) / 70.4 (1440) | 101–123 | ✓ |
| **V1 desktop 800×600** | 60.5 / 75.8 / 85.4 | 103–104 | ✓ |
| V0 mobile (control) | 28.0 (390×844) | 101 | ✓ พอดีเส้น (0 margin) |
| MZ mobile zoom1.25 | 32.3 (360×640) / 35.1 (390×844) | 104 | ✓ |
| **MA mobile portrait** | 34.4 (360×640) / 37.4 (390×844) | 104 | ✓ |

### ข้อค้นพบจากภาพ (บันทึกเป็นหนี้งาน ไม่ใช่ blocker ของ gate)
1. **MZ zoom 1.25 ทำ tile หลุด integer scale** (16px→40px = 2.5×) — ขัดกติกา integer 2× ของ
   ART_BIBLE → MZ เป็นได้แค่ accessibility preset ที่ผู้ใช้เลือกเอง ห้ามเป็น default
2. **Interior letterbox (S0 #2) ยังอยู่ที่ V0**: guild 22×14 มีแถบดำล่าง 32px; shop 14×10 หนักกว่า
   → S4: interior size class ต้อง ≥ viewport tiles หรือกล้อง fit ห้อง + backdrop
3. **Lane academy↔gatehouse ที่ M1 กว้าง 1 tile** — ต่ำกว่ากติกา secondary path ≥2 tiles
   → production Aethergate ต้องขยับ footprint ให้ได้ ≥2 (บันทึกใน scaleLab.ts แล้ว)
4. MA ใน lab ได้ 480×424 เพราะ host หน้า lab เตี้ยบนมือถือ — พฤติกรรม adaptive ถูกต้อง
   (fill container ไม่มี letterbox); ในเกมจริง layout fix เตรียมพื้นที่สูงไว้แล้ว
5. Night: silhouette + nameplate ยังอ่านได้ใต้ tint; โคมประตูเป็น shape cue ✓

### Scoring (เกณฑ์ prompt: world-scale 25 / readability 25 / navigation 20 / interaction 15 /
mobile 10 / performance 5; ผ่าน ≥85 และห้ามหมวดใดต่ำกว่า 80%)

| Contract | world | read | nav | interact | mobile | perf | รวม | ผล |
|---|---|---|---|---|---|---|---|---|
| A: V0 ทุกจอ (status quo) | 21 | 23 | 16 | 14 | **7 (70% ✗)** | 5 | 86 | **ตก hard rule** — มือถือ 28.0px margin ศูนย์ |
| B: V1 desktop + MZ mobile | 23 | 23 | 18 | 14 | 8 | 5 | 91 | ผ่าน แต่ MZ ทำ tile 2.5× (ข้อค้นพบ #1) |
| **C: V1 desktop + MA mobile** | **23** | **24** | **18** | **14** | **9** | **5** | **93** | **ชนะ** |

B–C ต่างกัน 2 คะแนน (≤3) → กติกาให้เลือกตัว "simpler, crisper, lower-risk": MZ เรียบง่ายกว่า
แต่**ไม่ crisper** (tile 2.5× fractional) — MA คง zoom 1 integer ทุกอย่าง → เลือก **C**

### คำตัดสินสุดท้าย (scale contract — ใช้กับทุกแมพตั้งแต่ S4)
- **Actor**: hero 48px (0.5× จาก 96px source) ทุกฉาก ทุกคลาส; collider 18×12 world px;
  NPC/remote/paper-doll/nameplate ใช้ contract เดียวกัน
- **Grid**: TILE 32 world px (source 16px, integer 2×), town M1 64×48 (2048×1536)
- **View**: desktop = 800×600 zoom 1 (V1); mobile portrait = adaptive กว้าง 480 สูงตาม container
  zoom 1 (MA); MZ zoom 1.25 = ตัวเลือก accessibility (opt-in, บันทึก tradeoff); 640×480 = fallback
- **Physics ไม่เปลี่ยนจาก view ใดๆ** (พิสูจน์แล้ว S2: route = analytic ทุก profile)
- หนี้ที่ต้องปิดใน S4: interior fit (#2), lane ≥2 tiles (#3), diagonal √2× normalize (S0 #4)

## S4 — implement the decision (DONE 2026-07-18, ยกเว้นงาน production assets)

- **Config กลาง**: `app/game/scaleContract.ts` (pure, มีเอกสารหัวไฟล์) — TILE 32 / hero 48 /
  collider 18×12+offset / สปีด 130/120 / DIAGONAL_FACTOR √2/2 / viewport presets + `chooseViewport`
  + `centeredCameraBounds`; textures.ts, movement.ts, scaleLab.ts ดึงค่าจากที่นี่ (เลิก hardcode)
- **Viewport จริงตาม contract**: `createGame.ts` เลือกจาก container ตอน boot —
  **desktop 800×600** (จอ CSS โตได้ถึง 1000px ⇒ hero บนจอ 48–60px), **มือถือแนวตั้ง ≤560px =
  480×640 portrait** ⇒ hero บนจอ ~38.8px (เดิม 26.8 → 29.1 → 38.8); `GameCanvas` aspect
  4:3 ↔ 3:4 breakpoint เดียวกับ contract; หน้าเพจกว้างขึ้นเป็น max-w-5xl บน lg
- **Diagonal normalize (ปิดหนี้ S0 #4)**: รวมกติกาเดินไว้ที่ `resolveMovement` ที่เดียว —
  Town/Interior/Boss เลิก hand-roll, Tower/Dungeon ได้ผ่านโมดูลเดิม; ScaleLabScene ปรับตาม
- **กล้องกึ่งกลางโลกเล็ก (ปิดหนี้ S0 #2)**: `centeredCameraBounds` ใช้ครบ 5 ฉาก
  (Tower 768×576 ใน 800×600, Dungeon mini, Interior, Boss — ภาพกึ่งกลาง แถบสมมาตร)
- **Evidence**: unit 424/424 (49 ไฟล์ รวม scale-contract.spec ใหม่ 7 เทส + movement diagonal
  แก้ตาม contract), vue-tsc 0; playtests 0 errors ทุกชุด — mobile-layout **20/20**
  (internal 480/800 ยืนยันจาก canvas จริง), minimap 6/6, battle 18/18, stat-alloc 13/13,
  scale-lab S2 16/16; screenshots: `.playtest/s4-tower-centered.png` (tower กึ่งกลางในจอ 800×600),
  `.playtest/mobile-layout/mobile-390x844-town.png` (portrait 480×640 จริง)
- **คงเหลือของ S4 (งาน content ถัดไป)**: Aethergate production assets จาก 7 ภาพ detailed
  (modular 16px + provenance + atlas) → MapBuild P1 slice (Aethergate + Whisperwood end-to-end);
  interior "ขนาดห้อง ≥ viewport" เป็นกติกาออกแบบแมพใหม่ (ห้องเก่ากึ่งกลางแล้ว ไม่บล็อก);
  lane ≥2 tiles บังคับใน production Aethergate → S4

LAST_UPDATED: 2026-07-18 (S4 code DONE — scale contract บังคับใช้จริงทั้งเกม: viewport
800×600/480×640, กล้องกึ่งกลาง 5 ฉาก, diagonal normalize; unit 424/424, mobile-layout 20/20,
playtests อื่นเขียวหมด 0 errors, generate+verify:pages PASS; เหลือของ S4: Aethergate production
assets → P1 slice)
