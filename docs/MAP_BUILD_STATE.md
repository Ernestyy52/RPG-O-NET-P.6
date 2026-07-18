# MAP_BUILD_STATE — Spiral's Echo 32-map campaign + Endless Tower

> Persistent execution state สำหรับ `docs/mockups/CLAUDE_CODE_MAP_BUILD_PROMPT.md` (Phase 0–7)
> ทำงานคู่กับ `docs/mockups/CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT.md` (Phase S0–S4)
> อ่านไฟล์นี้ต้น session แล้วทำต่อ — ห้าม audit ซ้ำ / regenerate asset ที่อนุมัติแล้ว
> ลำดับใหญ่: MapBuild P0 (foundation) → Scale S0–S3 (greybox + scale gate) → S4/P1 (Aethergate +
> Whisperwood slice) → P2–P6 ตาม region → P7 Tower — **ห้าม mass-build 32 แมพก่อน scale gate ผ่าน**

CURRENT_PHASE: MapBuild Phase 0 — **GATE PASSED 2026-07-17** (tests 389/389 46 ไฟล์ รวม
  zone-validate ใหม่; vue-tsc exit 0; `npm run generate` exit 0; validator proof ใน unit test)
  · Scale S0 — **DONE 2026-07-17** (ดู docs/MAP_SCALE_DECISION.md: ค่าคงที่+เวลาเดิน+perf วัดจริง
  240fps/51MB/boot 2.4s + screenshots 10 ภาพ + ปัญหา 6 ข้อ — mobile canvas ~330px คือวิกฤตสุด)
NEXT_PHASE: S1 DONE · S2 **DONE 2026-07-18** (hero คง 48px — ปฏิเสธ 44/40 ด้วยหลักฐาน
  cadence/width-band/มือถือ<28px; "เห็นโลกเพิ่ม" ใช้ V1 800×600 + มือถือ MZ/MA;
  รายละเอียด+หลักฐานเต็มใน MAP_SCALE_DECISION.md §S2; unit 406/406, S2 playtest 16/16
  0 errors, S1 regression 16/16 เลขเดิม, generate+verify:pages PASS)
  → เหลือ mobile layout fix + S3 scoring → scale gate

## Phase 0 — Audit inventory (2026-07-17)

### สิ่งที่มีอยู่และใช้ต่อได้ (อย่าสร้างซ้ำ)
- **Scenes (5)**: TowerScene (fl.1–100, ZoneDefinition 24×18 legacy), TownScene (town-night.png
  1404×712 + ZONES/SLICES แบบพิกัดภาพ), InteriorScene (4 IDs: guild/hospital/item-shop/
  equipment-shop), DungeonScene (2 layouts data-driven), BossScene — ทั้งหมด wire minimap +
  lifecycle cleanup แล้ว
- **Zone runtime (pure, tested)**: `app/game/runtime/` — zone.ts (ZoneDefinition legacy tower),
  movement.ts (PLAYER_SPEED 120, left/up priority), spawn.ts, encounter.ts, lifecycle.ts,
  zoneRuntime.ts (scaffold), dungeonLayouts.ts (DungeonLayoutConfig + BFS), worldGraph.ts
  (9 โซน 17 edges + validateWorldGraph no-soft-lock + locationFromFloor)
- **Validator กลาง (ใหม่ Phase 0)**: `app/game/runtime/zoneValidate.ts` — WalkGrid +
  validateZoneReachability (spawn→objective→exit BFS) + validateSpawnRegion (capacity + ห้ามทับ
  safe pocket) + ZoneTileRole tile contract 12 บทบาท (ground/edge/wall/blocker/foreground/
  transition/prop/interaction/spawn/portal/secret/audio-region); dungeonLayouts delegate มาที่นี่
  แล้ว — ทุกชนิดแมพใช้ proof เดียวกัน; เทส `test/zone-validate.spec.ts`
- **Asset truth**: `scripts/asset-truth.cjs` → `docs/ASSET_REGISTRY.json` 236 ไฟล์ (hash/consumers/
  provenance/budgets), broken refs 0; dev gallery `/dev/assets` (ตัดจาก prod ผ่าน pages:extend);
  `ART_BIBLE.md`; `verify-pages.cjs`
- **Save**: SaveEnvelope v6 + migrations idempotent + legacy adapter; Pinia `player` ยัง
  authoritative (SAVE_ENVELOPE_ENABLED=false); PlayerLocation รอ zone-first migration (→ v7
  ตอน Aethergate ลง — ทำครั้งเดียว)
- **Quest/NPC hooks ที่ห้ามพัง** (ดู AETHERGATE_TOWN_BUILD_SPEC §Compatibility): interior 4 IDs,
  NPC guildmaster/portal_guardian/blacksmith/forest_ranger/healer, event town:*, test
  town-interiors.spec ล็อก IDs
- **Tests**: 383+ ผ่าน (46 ไฟล์) รวม world-graph, dungeon reachability, zone-validate ใหม่

### Gaps ที่ Phase ถัดไปต้องปิด
- ZoneDefinition legacy = ผืน tower 24×18 เท่านั้น → campaign ZoneDefinition เต็มรูป (ตาม
  ZONE_CONTRACT.md + MapDimensionSpec จาก S1) ยังไม่มี — **อย่าออกแบบจนกว่า scale gate ผ่าน**
- Lazy zone loading: textures โหลดรวมตอน boot; ยังไม่มี per-zone asset dependency manifest
- Perf budget: มี budget ใน ASSET_REGISTRY แต่ FPS/memory/zone-load ยังไม่ "วัดจริง" → S0
- CI E2E gate (ค้างจาก roadmap P0 เดิม)
- Mockup PNGs (21 ภาพ) ยังไม่ลงทะเบียนใน ASSET_REGISTRY เป็น concept provenance

### ข้อขัดแย้งที่ตัดสินแล้ว (decision log)
- ZONE_CONTRACT.md (แนว town-night.png ภาพเต็มผืน) ขัดกับ MAP_BUILD non-negotiable #1–2
  (ห้าม contact sheet เป็น runtime art, ต้อง modular 16px tiles) → **ยึด MAP_BUILD prompt**:
  data shape ของ ZONE_CONTRACT (collision boxes/doors/spawns/slices) ยังใช้ แต่ art ต้อง
  rebuild เป็น modular tiles; town-night.png เดิมคงอยู่จนกว่า Aethergate production ผ่าน gate
  (no full rewrite — กติกา constitution ข้อ 6)
- Aethergate spec บอก spawn→plaza 20–30s แต่ scale prompt แก้เป็น "ครั้งแรกเท่านั้น; repeat
  visit 3–6s" → ยึด scale prompt (spec จะถูกอัปเดตพร้อมหลักฐานตอน S1)
- Tower ห้าม hardcode 100 ชั้นเป็นโหมดเดียว → รอ P7; ปัจจุบัน setFloor clamp 1..100 คงไว้ก่อน
  (Endless run state จะแยกจาก currentFloor ตาม Gatehouse contract — ห้าม relabel)

## Scale baseline (S0 — ค่าคงที่ตรวจจากโค้ดแล้ว 2026-07-17)
| ค่า | ที่อยู่ | ค่าจริง |
|---|---|---|
| Viewport | `createGame.ts` | 640×480, Scale.FIT, CENTER_BOTH, pixelArt true, zoom 1 (ไม่มี setZoom) |
| Tile | `runtime/zone.ts` | TILE=32 world px (source 16px) |
| Hero display | `systems/textures.ts` | HERO_DISPLAY_H=48; source frames 43–53×96 (8 คลาส×เพศ) |
| Collider | `applyStandardHeroBody` | 18×12 world px ที่เท้า, offset ก้น -3px, เท่ากันทุกคลาส |
| Speeds | scenes | Town 130, Interior/Boss 120, Tower/shared PLAYER_SPEED 120; **diagonal ไม่ normalize (√2×)** |
| Town dims | `TownScene.ts` | ART 1404×712 → WORLD_H 608 ⇒ world ~1199×608 px (~37×19 tiles) |
| Tower floor | `runtime/zone.ts` | 24×18 tiles = 768×576 px |
| Dungeons | `dungeonLayouts.ts` | mini 18×14, main 28×22 tiles |

## Evidence (Phase 0 gate)
- `npm test` → (รอผลรอบล่าสุดหลังเพิ่ม zone-validate) — ก่อนแก้ 382/382; vue-tsc exit 0
- Reachability proof: `test/zone-validate.spec.ts` (สังเคราะห์ + real layouts) +
  `test/dungeon` spec เดิมยังผ่าน (delegate ไม่เปลี่ยนพฤติกรรม)
- world graph no-soft-lock: `test/world-graph.spec.ts`

## NEXT ACTION (เรียงตามลำดับ)
1. ~~Phase 0 gate~~ DONE · ~~S0~~ DONE · ~~S1~~ DONE · ~~S2 hero/camera profiles~~
   **DONE 2026-07-18** — hero คง 48px (P1 44/P2 40 ปฏิเสธ: cadence ไม่สม่ำเสมอ {2,3},
   ตาเบี้ยว/หน้าหายใน compare 4×, width band หลุด 2/6 คลาส, มือถือ V0 26.8/24.4 < 28px);
   "เห็นโลกมากขึ้น" = V1 800×600 zoom1 (desktop finalist), มือถือ P3-adaptive hero48+MZ/MA
   (35.1/37.4px วัดจริง); ฟิสิกส์พิสูจน์ไม่เปลี่ยนตาม profile (P2 route = analytic Δ0.0);
   ไฟล์: scaleLab.ts (+HERO_PROFILES/rowCadence/classWidths/VIEW_PRESETS), ScaleLabScene
   (สไปรต์จริง+NPC stand-in+cadence 8 ทิศ), scale-lab.vue (hero/view switch + on-screen px),
   heroFrames.ts ใหม่ (textures.ts import ต่อ), playtest-scale-lab-s2.mjs,
   s2-cadence-zoom.mjs; หลักฐาน `.playtest/s2-hero/` + MAP_SCALE_DECISION §S2
2. ~~แก้ mobile layout~~ **DONE 2026-07-18 (production)** — Hud.vue compact ≤560px (ซ่อน banner,
   แถบนอน, ปุ่มครบ), canvas เต็มกว้างมือถือ (`index.vue` -mx-4) ⇒ **hero มือถือ 26.8→29.1px ≥28 ✓**,
   canvas เริ่ม y≈150 (เดิม HUD กิน ~60%), minimap ย้าย absolute เข้าในกรอบ canvas (เลิกทับ
   title bar ทั้งสอง viewport), nav/currency ย่อใน main.css; หลักฐาน
   `scripts/playtest-mobile-layout.mjs` PASS 17/17 + minimap regression 6/6 + screenshots
   `.playtest/mobile-layout/`; canvas มือถือยังเป็น 4:3 — สูงเต็มจอรอ MA (การตัดสิน S3/S4)
3. ~~S3 scoring~~ **DONE 2026-07-18 → SCALE GATE PASSED** — winner contract C 93/100
   (ไม่มีหมวด <80%): hero 48 / TILE 32 integer 2× / town M1 64×48 / desktop V1 800×600 zoom1 /
   mobile MA portrait-adaptive 480×fit zoom1; MZ 1.25 = opt-in accessibility เท่านั้น (tile 2.5×
   หลุด integer); V0 640×480 = fallback. Matrix `scripts/playtest-scale-lab-s3.mjs` PASS 47/47
   0 errors ครบ 10 scenario × 5 resolution + interiors/night/คลาสแคบ-กว้าง; หลักฐาน+scoring เต็ม
   ใน MAP_SCALE_DECISION §S3; **หนี้ S4**: interior ≥ viewport/camera-fit, lane academy↔gatehouse
   ≥2 tiles, diagonal normalize
4. ~~S4 ส่วนโค้ด~~ **DONE 2026-07-18** — `app/game/scaleContract.ts` (config กลาง documented)
   บังคับใช้จริง: createGame เลือก viewport ตาม contract (desktop 800×600 / มือถือ portrait
   480×640 ⇒ hero มือถือ 38.8px), กล้องกึ่งกลางโลกเล็กครบ 5 ฉาก (ปิด S0 #2),
   diagonal normalize รวมที่ resolveMovement (ปิด S0 #4 — Town/Interior/Boss เลิก hand-roll);
   หลักฐาน: unit 424/424, mobile-layout 20/20, minimap/battle/stat-alloc/scale-lab เขียวหมด
   0 errors, screenshots `.playtest/s4-tower-centered.png` + `mobile-layout/`; รายละเอียด
   MAP_SCALE_DECISION §S4
5. **MapBuild P1 — เริ่มแล้ว (ชั้นข้อมูลเสร็จ 2026-07-18):**
   - ~~ลงทะเบียน mockup 21 ภาพเป็น concept-reference~~ DONE — `scripts/asset-truth.cjs` เพิ่ม
     บล็อก conceptReferences (21 ภาพใน docs/mockups มี hash/dimensions/provenance), แยกจาก
     production assets ไม่ปน unused/duplicate; ASSET_REGISTRY.json regenerated (totals.conceptRefs=21)
   - ~~Aethergate ZoneDefinition (ชั้นข้อมูล)~~ **DONE + tested** — `app/game/runtime/campaignZone.ts`
     (CampaignZone generic + `validateCampaignZone` = per-map contract validator ใช้ได้ทั้ง 32 แมพ)
     + `app/data/zones/aethergate.ts` (64×48 จาก greybox ที่พิสูจน์แล้ว: 12 อาคาร, น้ำพุ/เวที,
     4 interior door portals จริง (guild/hospital/item-shop/forge→equipment-shop) + 8 อาคารเป็น
     interaction anchor (ไม่ fake ประตู), arrival return + tower gate, waystone shortcut, secret
     garden, safe pocket plaza+inn, capacity 0 (hub ปลอดภัย), **แก้หนี้ S3: lane ≥2 tiles**);
     asset dependency manifest ในไฟล์ (reuse/author ต่อ role); `test/aethergate-zone.spec.ts`
     9 เทส + ASCII dump ยืนยันผังตรง mockup; unit รวม 433/433
   - **งานถัดไปของ P1 (ยังไม่ทำ — งาน art + scene จริง)**: (a) curate/author production 16px tiles
     ตาม AETHERGATE_ASSET_MANIFEST (tiny-town CC0 + craftpix path/village/bushes ใน D:\Asset →
     atlas → public/aethergate/ + provenance) (b) AethergateScene เรนเดอร์ zone data ด้วย tile
     จริง (ไม่ใช่ mockup PNG) + wire portals→InteriorScene/tower + spawn/collision/depth (c)
     playtest ในเบราว์เซอร์ (Town→interior→Town, save/reload, มือถือ 390×844) (d) Whisperwood
     field → slice loop — **ต้องมี art จริงก่อน mark map complete (non-negotiable #6)**

LAST_UPDATED: 2026-07-18 (S2+S3+mobile fix+S4 code DONE — **SCALE GATE PASSED + APPLIED**;
RO-feel pass ลงด้วย (stat allocation v7, เมนู 3 หมวด — ดู RO_FEEL_GAP_ANALYSIS.md);
unit 424/424 49 ไฟล์, vue-tsc 0, playtests 0 errors ทุกชุด, generate+verify:pages PASS)
