# Execution State

> Roadmap ที่ active (2026-07-17): `CLAUDE_MASTER_PROMPT_RO_INSPIRED_ONET_FULL_REDESIGN.md` (Phase 0–11,
> ทุก Phase มี Batch A=inspect / B=implement / C=tests / D=playtest+gate)
> อ่านคู่กับ `docs/GAME_CONTRACT.md`, `docs/ARCHITECTURE_DECISION.md`, `docs/BACKEND_MIGRATION.md`
> ประวัติ: roadmap GH-Pages เดิม (`CLAUDE_MASTER_PLAN_RPG_ONET_GITHUB_PAGES_BRANCH.md`) + 24-phase เดิม
> → `docs/execution/EXECUTION_STATE.md`
>
> ROADMAP MAPPING (ไม่ย้อนทำ Phase ที่ผ่านแล้ว — งานที่ผ่านนับตามเนื้องาน ไม่ใช่ตามเลข):
> - ใหม่ Phase 0 (Baseline/Truth) ≈ เดิม Phase 0+2 → มีแล้ว: asset registry/validators, verify:pages,
>   ART_BIBLE, dev gallery — ถือว่า core ผ่าน (CI E2E gate ยังไม่มี — ติดตามใน Phase 11)
> - ใหม่ Phase 1 (Runtime Correctness) ≈ เดิม P0 batch + Phase 1 → ผ่าน (P0.1–P0.9, save envelope,
>   outcome semantics, listener cleanup)
> - ใหม่ Phase 2 (Core Architecture: ZoneDefinition/generic zone runtime/StoryDirector) → ยังไม่เริ่ม
>   (ปัจจุบันยังเป็น Scene class ต่อแผนที่) — งานถัดไปหลังปิด Phase 3
> - ใหม่ Phase 3 (Combat/Classes/Game Feel) ≈ เดิม Phase 4 → **Batch A–D ทำแล้ว (ดูล่าง)**
> - ใหม่ Phase 4 (Identity/Equipment/Economy) ≈ เดิม Phase 3 (ทำ PARTIAL — art blockers เดิม)

CURRENT_PHASE: 2 (Core Architecture — เลขตาม roadmap ใหม่; Phase 3 combat ปิด Batch D แล้ว)
CURRENT_BATCH: 2A+2B บางส่วน DONE (world graph + PlayerLocation + validators + ZONE_CONTRACT);
  งาน px-level ZoneDefinition รอ mockup แมพชุดใหม่ของผู้ใช้ (ผู้ใช้แจ้ง 2026-07-17: กำลังทำ
  mockup แมพ + asset — session หน้าจะ "เปลี่ยนแมพครั้งใหญ่")
PHASE_STATUS: ACTIVE

MINIMAP (คำขอผู้ใช้ 2026-07-17 — DONE, playtest ผ่าน):
- contract: `minimap:layout` / `minimap:tick` / `minimap:clear` บน eventBus (world-px —
  รอดการเปลี่ยนแมพ: แมพใหม่แค่ publish ข้อมูลใหม่ ตัววาดไม่ต้องแก้)
- `app/game/systems/minimap.ts` — pure helpers (tileRect/rectsFromWallGrid/borderRects/
  minimapScale) + MinimapTicker throttle 140ms (test/minimap.spec.ts — จับ edge tick แรก t=0 แล้วแก้)
- `app/components/game/Minimap.vue` — canvas HUD มุมขวาบน, toggle ปุ่ม+คีย์ M, มือถือย่อขนาด,
  marker แยกรูปทรงตามชนิด (color-blind cue), mount ใน index.vue
- wire ครบ 5 ฉาก: Tower (กำแพง/ต้นไม้/ประตูบอส/dungeon entry/หีบ — หีบเก็บแล้ว marker หายทันที),
  Town (อาคาร/ประตูบริการ/พอร์ทัล/NPC), Dungeon (wallGrid+props/exit/boss gate — secrets จงใจไม่โชว์),
  Interior (ผนัง/พร็อพ/NPC/ทางออก), Boss (ลาน/เสา/ตำแหน่งบอส); clear ตอน shutdown ทุกฉาก
- playtest จริง (scripts/playtest-minimap.mjs, Edge): desktop+mobile 6/6 PASS, 0 browser errors
  (กรองเฉพาะ ERR_CONNECTION_REFUSED ของ Colyseus offline fallback ที่ออกแบบไว้)

PHASE_2_PROGRESS:
- มีอยู่ก่อนแล้ว (Phase 08/14 เดิม): ZoneDefinition พื้นฐาน, ZoneRuntime scaffold + lifecycle,
  DungeonLayoutConfig + BFS reachability, pure movement/spawn/encounter systems
- ใหม่ session นี้: `app/game/runtime/worldGraph.ts` — PlayerLocation ตาม contract,
  WORLD_GRAPH (9 โซน 17 edges ตาม routing จริงวันนี้), validateWorldGraph (dangling edge +
  ไป-กลับเมืองได้ทุกโซน = no soft-lock ระดับโลก, BFS) + locationFromFloor adapter;
  test/world-graph.spec.ts 4 เทส
- `docs/ZONE_CONTRACT.md` — สัญญาข้อมูลต่อแมพหนึ่งผืนสำหรับการเปลี่ยนแมพครั้งใหญ่ session หน้า
  (อิงแนวทาง TownScene + town-night.png ที่พิสูจน์แล้ว): ภาพ, กล่องชน, ประตู+ปลายทาง, spawns,
  SLICES y-sort, landmarks, monster bounds, provenance

PHASE_3_PROGRESS (เลขใหม่; = เดิม Phase 4):
- Batch A (data): skillDefs.ts 88 สกิล (4 คลาส × 6A/3P/1U + 8 jobs × 4A/2P), statusEffects.ts
  6 สถานะ, builds.ts 12 preset (3/คลาส), validateSkillDefs/validateBuilds บังคับใน test
- Batch B (engine): loadoutEngine.ts — LoadoutCombat 5+1, data-driven combo (apply→consume),
  passive hooks 7 แบบ, learning gate (damage ⇒ Insight), validateLoadout; balance sim
  (test/skill-balance.spec.ts): ทุก build ชนะทุก scenario, ไม่มี build เดียวชนะหมด,
  parity band ≤2.2 ในคลาส / ≤1.9 ข้ามคลาส; save v5 (jobId+skillLoadout) + legacy adapter
- Batch C (wiring+UI, 2026-07-17 session นี้):
  • RealtimeBattle.vue: SKILL_LOADOUT_ENABLED=true ⇒ LoadoutCombat แทน RealtimeCombat ทั้งไฟต์
    (flag off = เส้นทาง 3 ปุ่มเดิม byte-identical); แถบสกิล 5+1 พร้อม cd veil, ✦/MP cost,
    combo-ready glow (readyCombos telegraph), status badges (รูปทรง+ฝั่ง ไม่พึ่งสีเดียว),
    tooltip เต็ม; ตอบถูก = auto-strike สกิลดาเมจ (คอมโบพร้อมก่อน, ultimate ไม่ auto) + คิวเมื่อ
    ติด cd (ไม่มีคำตอบถูกสูญเปล่า); loadout ในเซฟ invalid ⇒ ถอย preset อัตโนมัติ
  • SkillTreeModal.vue: แท็บ Loadout/Talents — เลือก job (Lv15, เปลี่ยนฟรี), preset builds
    (Equip), custom editor 5 active + ultimate + 2 passive พร้อม validateLoadout สด, Respec
  • player.ts: chooseJob sanitize loadout ข้าม job (ถอย preset เมื่อ invalid)
- Batch D (playtest+gate, 2026-07-17):
  • harness `/dev/battle` (dev-only, ตัดจาก prod ผ่าน pages:extend — ยืนยันใน .output แล้ว):
    seed profile 4 คลาส, start battle/boss, เปิด Skills modal
  • `scripts/playtest-battle.mjs` (playwright-core + Edge channel, ไม่ต้องโหลด browser):
    desktop 1280×800 + mobile 375×667 → **PASS 18/18, 0 browser errors** — แถบ 5+1, ชนะไฟต์จริง,
    Correct-log, combo telegraph glow, status badges, ไม่มี horizontal overflow, preset equip,
    respec, custom apply, job ปลดล็อก Lv15 ขยาย pool 6→10, boss phase banner, Flee disabled
  • playtest จับบั๊ก UX 2 ตัวแล้วแก้: (1) log "Correct!" ถูกชื่อสกิลทับทันที → prefix รวมบรรทัดเดียว
    (2) combo telegraph ไม่มีวันเรือง (เช็ค insight ที่ auto-strike ใช้หมดพอดี) → telegraph จาก
    status+cooldown เท่านั้น (เรือง+disabled = สอน "ตอบถูกอีกข้อแล้วระเบิด")
  • data-testid เพิ่มใน RealtimeBattle/SkillTreeModal (attribute เฉยๆ); devDep ใหม่: playwright-core

PHASE_3_GATE_EVIDENCE:
- 3 viable builds/คลาส + ไม่มี build เดียวชนะหมด → skill-balance.spec (sim 12 build × 3 scenario)
- combo ทำงานจาก data → loadout-engine.spec + playtest เห็น glow/badge จริงใน browser
- mobile HUD ใช้จริง → playtest mobile pass, screenshot แนบใน scratchpad session
- respec/save/loadout → playtest UI pass + save v5 migration tests
- ยังไม่ปิดสนิท (ค้างแบบบันทึกไว้ ไม่ block phase ถัดไป):
  (a) VFX/SFX/animation asset จริงต่อสกิล — key ครบใน data แต่ asset เป็น art blocker เดิม → Phase 10
  (b) game feel (hit stop/camera shake/reduced-motion toggle) — ยังไม่ทำ → รวมใน Phase 10 polish
  (c) enemy resistance/counterplay ต่อสกิล tag — intents มีแล้ว, resistance ยัง → Phase 5/7 content

PHASE_8_AUDIT (2026-07-17 — NEXT_3 ข้อ 3 เดิม, DONE):
ตรวจกับ Phase 8 "Return Systems" + non-negotiables (ไม่มี punitive streak/energy gate/FOMO):
- ✅ ไม่มี punitive streak ที่ไหนเลย — daily quests roll ใหม่ต่อวัน (deterministic ต่อ dateKey,
  ทุก client ได้ชุดเดียวกัน), วันที่ขาดหาย = แค่ไม่ได้รางวัลวันนั้น ไม่มีอะไรถูกริบ/รีเซ็ต
- ✅ ไม่มี energy gate; รางวัลเควส claim-only + idempotent (claimed flag) + RewardLedger ฝั่ง combat
- ✅ แพ้ไม่ลงโทษ: KO → restart ชั้นเดิม (TowerScene/DungeonScene) ไม่เสีย gold/EXP/floor
  = "Tower failure ไม่ทำ Campaign ถอย" ผ่าน
- ✅ rested bonus ฝั่ง learning มีอยู่แล้ว (planner.ts: gap ≥2 วัน ⇒ review slots เพิ่ม cap 6;
  expedition.ts: bonus objectives — additive เท่านั้น) — ADR 0003 แยกจาก combat ถูกต้อง
- ⚠️ ค้างบันทึกไว้ (เนื้องานใหญ่ Phase 8 จริง ไม่ block): sanctuary/checkpoint ทุก 5 ชั้น,
  route choices, run-boons/curses, Ascension, anti-repeat audit → ทำพร้อมรอบแมพใหม่/P8 เต็ม

RESTED_BONUS + BREAK_REMINDER (2026-07-17 session นี้ — ปิด gap จาก audit):
- `app/data/rested.ts` (ใหม่, pure + RESTED_BONUS_ENABLED flag): ห่าง ≥8 ชม.เริ่มสะสม,
  25% ของ EXP เลเวลถัดไปต่อ 24 ชม., cap 1 เลเวล; ใช้เป็นโบนัส +50% EXP จากไฟต์จนหมด pool;
  grant-only ทุกฟังก์ชัน (นาฬิกาถอยหลัง/ค่า corrupt ⇒ 0 ไม่มีทางติดลบ)
- player store: `restedExpPool`+`lastSeenAt` (additive, ensurePlayerDefaults backfill),
  `gainCombatRewards` (เฉพาะ combat — เควส/secret ไม่ boost), `checkInRested` เรียกตอน mount index.vue
- save v6: session slice + migration v5→v6 + legacy adapter สองทาง (schema/migrations/legacyAdapter)
- break reminder: index.vue notice อ่อนโยนทุก 60 นาทีเล่นต่อเนื่อง (ไม่บล็อก ไม่มีบทลงโทษ)
- tests: test/rested.spec.ts 8 เทส + save.spec v6 2 เคส → npm test 382/382 (45 ไฟล์);
  vue-tsc exit 0; playtest-battle 18/18 0 browser errors (รอบแรก 17/18 — mobile strike-log
  เป็น stochastic flake, รันซ้ำผ่านหมด) — ยืนยันเส้นทาง gainCombatRewards จริงในเบราว์เซอร์
- ✅ `scripts/playtest-rested.mjs` PASS (2026-07-17 session ถัดมา): seed lastSeenAt เก่า 24 ชม.
  → pool accrue 126 EXP ตรงสูตร (level 7), log "You feel rested!" ขึ้น, 0 browser errors
  — Phase 8 pass ปิดสมบูรณ์ทุกชิ้น

PASSED_PHASES: 0, 1, 2, 3(PARTIAL — art blockers)
PASSED_GATES:
- Phase 0 Gate (2026-07-16): repo/deploy/data-ownership บันทึกแล้ว, baseline generate exit 0
- Phase 1 Gate (2026-07-16): deploy เดิมถูกต้อง ไม่ rewrite; แก้ hardcoded path player.ts;
  verify:pages PASS; Pages settings ยืนยันผ่าน gh api
- Phase 2 Gate (2026-07-17): scripts/asset-truth.cjs → registry 236 ไฟล์ (used/unused/dup/dev-only,
  hash, consumers, provenance ครบ), broken refs=0, case=0; dev gallery /dev/assets (ตัดจาก prod
  ผ่าน pages:extend hook — ตรวจแล้วไม่ leak); ART_BIBLE.md; budgets ใน registry
- Phase 3 Gate (2026-07-17) **PARTIAL**: weapon เปลี่ยน sprite จริง (WeaponOverlay ใน 5 scenes,
  held-icon ต่อประเภทอาวุธ + anchor 4 ทิศ); EquipmentVisual registry ครอบทุก item (weapon=held-icon,
  armor/trinket=aura+hiddenReason); StatusModal preview 4 ทิศ; atlas truth tests (96 เฟรม align)
  — **ค้าง (art blocker, ดู ASSET_MANIFEST gaps):** face/hair overlay art, armor overlay art,
  attack/cast/hit/KO animation states

ACTIVE_WORK:
- ยังไม่ commit ทั้งหมด (คำสั่งผู้ใช้: ห้าม commit จนกว่าสั่ง) — มี P0 batch เดิม ~14 ไฟล์
  + งาน session นี้: `app/game/systems/assetBase.ts` (ใหม่), `textures.ts` (re-export),
  `player.ts` (getter ผ่าน assetPath), `scripts/verify-pages.cjs` (ใหม่), `package.json`
  (+`verify:pages`), docs (ARCHITECTURE_DECISION, BACKEND_MIGRATION, ไฟล์นี้)
- Phase 8 pass (2026-07-17): `app/data/rested.ts` (ใหม่), `test/rested.spec.ts` (ใหม่),
  `app/stores/player.ts`, `app/pages/index.vue`, `app/components/game/BattleModal.vue`,
  `app/components/game/RealtimeBattle.vue`, `app/utils/save/{schema,migrations,legacyAdapter}.ts`,
  `test/save.spec.ts`

ACTIVE_BLOCKERS:
- ไม่มีสำหรับ Phase 1 Gate
- ค้างจาก roadmap เดิม: human browser playthrough (fresh profile 4 คลาส ถึงชั้น 11) ยังไม่ทำ
- หมายเหตุ: build local บน Git Bash ต้องกัน MSYS path conversion — ใช้ PowerShell
  `$env:NUXT_APP_BASE_URL='/RPG-O-NET-P.6/'; npm run generate` (CI/Linux ไม่มีปัญหานี้)

LAST_VERIFICATION (2026-07-17, minimap + Phase 2 batch):
- command: `npm test` → **372/372 ผ่าน (44 ไฟล์)** — รวม minimap.spec + world-graph.spec ใหม่
- command: `npx vue-tsc --noEmit` → exit 0
- command: `node scripts/playtest-minimap.mjs` → **PASS 6/6, 0 browser errors** — เล่นจริงจากหน้า
  title → สร้างตัวละคร → เมือง: minimap โผล่, จุดผู้เล่นขยับตามการเดินจริง (canvas diff), toggle ทำงาน
  ทั้ง desktop 1280×800 + mobile 375×667; screenshot ใน scratchpad `playtest/`
- command: `node scripts/playtest-battle.mjs` (run ก่อนหน้า วันเดียวกัน) → PASS 18/18
- command: `npm run generate` (NUXT_APP_BASE_URL=/RPG-O-NET-P.6/) → exit 0
- command: `npm run verify:pages` → PASS ทั้งหมด
- ยังไม่ commit — คำสั่งผู้ใช้เดิม: ห้าม commit จนกว่าสั่ง

PHASE_STATUS_SUMMARY (roadmap ใหม่ 0–11 — สถานะตรงไปตรงมา ไม่เคลมเกินหลักฐาน):
- P0 Baseline/Truth: core ผ่าน (registry/validators/verify:pages/ART_BIBLE) — ค้าง CI E2E gate
- P1 Runtime Correctness: ผ่าน (P0.1–P0.10 + save envelope + outcome semantics)
- P2 Core Architecture: ACTIVE — world graph/PlayerLocation/validators เสร็จ; px-level zones
  **บล็อกโดยตั้งใจ: รอ mockup แมพของผู้ใช้** (ZONE_CONTRACT.md พร้อมรับ)
- P3 Combat/Classes: Batch A–D ผ่านพร้อมหลักฐาน — ค้างบันทึกไว้: VFX/SFX จริง (→P10), game feel (→P10)
- P4 Identity/Equipment/Economy: PARTIAL (paper-doll weapon จริง, EquipmentVisual registry ครบ) —
  ค้าง art: face/hair/armor overlay + anim states (→ asset ของผู้ใช้/P10)
- P5–P7 Town redesign + World1 slice + Regions 2–6: **บล็อกโดยตั้งใจ — ผู้ใช้กำลังทำ mockup แมพ
  ครั้งใหญ่; เริ่มก่อนคือทำทิ้ง** (ZONE_CONTRACT.md คือ prep ที่ทำได้และทำแล้ว)
- P8 Endless/Retention: audit ผ่านแล้ว (2026-07-17 — ดู PHASE_8_AUDIT) + rested bonus/break
  reminder ลงแล้ว; ค้างเนื้องานใหญ่: sanctuary/route choices/boons/Ascension (ทำพร้อมแมพใหม่)
- P9 Backend/Party/Guild: มี Colyseus co-op พื้นฐาน + Sheets sync; Firebase migration ยังไม่เริ่ม
  (ต้องการ Firebase project/credentials จากผู้ใช้ก่อน — ทำไม่ได้ฝ่ายเดียว)
- P10 Asset/Audio production: บล็อกด้วย asset จริง (art bible + registry + gaps บันทึกครบแล้ว)
- P11 Release: ยังไม่ถึง (ต้องผ่าน P5–P10 + SME review + student playtest — ห้าม mark เอง)

RO_FEEL_PASS (2026-07-18 — คำขอผู้ใช้: กลิ่นอาย RO / อาชีพ / หมวดเมนู / อัพสเตตัส — DONE):
- **Stat allocation (RO-inspired, สูตรของเราเอง)**: `app/data/statAllocation.ts` (pure +
  `STAT_ALLOC_ENABLED`) — +3 แต้ม/เลเวล, VIT/ATK/DEF/MAG/SPD/WIS, ราคาแพงขึ้นทุก 10 แต้ม,
  Reset ฟรี; player store getters/actions; UI หน้า Status (testids stat-points/alloc-*/stat-reset)
  + badge แต้มค้างบนปุ่ม Status; **เซฟ v7** (statAlloc ใน character slice — additive default {},
  migration idempotent, legacyAdapter สองทาง; **zone-first migration เลื่อนเป็น v8**)
- **เมนูล่างจัดหมวด 3 กลุ่ม**: Character (Status/Inventory/Skills) · Journal (Quests/Map/Log) ·
  World (Town/Guild/Craft) — ปุ่ม/handler/badge เดิมครบ (`.nav-group` ใน main.css)
- **อาชีพ**: audit แล้ว **คงโรสเตอร์ 4×2 = 8** (balance sim ผูกอยู่ ลบ = เซฟเสีย identity,
  เพิ่ม = ต้อง content ใหม่); บันได tier-3 (~Lv40, →16) จองเป็น content Region 3+;
  พิธีเปลี่ยนอาชีพย้ายเข้า Job Hall ตอน P1 town — วิเคราะห์เต็มใน `docs/RO_FEEL_GAP_ANALYSIS.md`
- Verification: vitest **417/417** (48 ไฟล์; +stat-allocation 6, +save v7 2), vue-tsc 0,
  playtest-stat-alloc **13/13**, mobile-layout 17/17, battle 18/18 — 0 browser errors ทุกชุด;
  generate (base /RPG-O-NET-P.6/) exit 0 + verify:pages PASS
- ไฟล์: statAllocation.ts (ใหม่), player.ts, StatusModal.vue, index.vue, main.css,
  save/{schema,migrations,legacyAdapter}.ts, test/{stat-allocation,save}.spec.ts,
  scripts/playtest-stat-alloc.mjs (ใหม่), docs/RO_FEEL_GAP_ANALYSIS.md (ใหม่),
  docs/map-character-scale-analysis.md (ใหม่ — สรุป scale gate ตามที่ผู้ใช้ขอ)

MAP_BUILD_WORKSTREAM (2026-07-17 — mockup มาถึงแล้ว, ปลดบล็อก P5–P7):
ผู้ใช้ส่ง mockup 21 ภาพ (6 region + tower + Aethergate detailed pack) + 2 prompt ใหม่:
`docs/mockups/CLAUDE_CODE_MAP_BUILD_PROMPT.md` (MapBuild Phase 0–7) และ
`CLAUDE_CODE_MOCKUP_SCALE_INTEGRATION_PROMPT.md` (Scale S0–S4 — ห้าม mass-build ก่อน scale gate)
**สถานะและ next action ทั้งหมดอยู่ที่ `docs/MAP_BUILD_STATE.md` + `docs/MAP_SCALE_DECISION.md`**
— P0 gate ผ่าน (zoneValidate กลาง + tile contracts), S0 baseline วัดแล้ว, S1 analytical:
M1 64×48 = provisional candidate (6/8 เส้นทางเข้าเป้า)
หมายเหตุ: save v6 ถูกใช้ไปกับ rested bonus แล้ว → zone-first migration จะเป็น **v7**

NEXT_3:
1. MapBuild/Scale: ~~S1~~ ~~S2~~ ~~mobile layout fix~~ ~~S3~~ ทั้งหมด DONE 2026-07-18 —
   **SCALE GATE PASSED**: contract C 93/100 = hero 48 / TILE 32 integer 2× / town M1 64×48 /
   desktop V1 800×600 zoom1 / mobile MA portrait-adaptive zoom1 (MZ = opt-in accessibility;
   V0 fallback) — scoring+หลักฐานเต็มใน MAP_SCALE_DECISION §S2–S3; mobile layout fix ลง
   production แล้ว (Hud compact, canvas เต็มกว้าง, minimap ในกรอบ canvas — playtest 17/17 + 6/6)
   · ~~S4 ส่วนโค้ด~~ DONE 2026-07-18: `scaleContract.ts` บังคับใช้จริง — viewport desktop
   800×600 / มือถือ portrait 480×640 (hero มือถือ 38.8px), กล้องกึ่งกลาง 5 ฉาก, diagonal
   normalize (unit 424/424, mobile-layout 20/20, playtests เขียวหมด, generate+verify PASS)
   → **งานถัดไป = MapBuild P1**: Aethergate production assets (modular 16px จาก 7 ภาพ
   detailed) → ZoneDefinition 64×48 → Whisperwood → slice playtest end-to-end
2. Phase 2 ต่อ: save v7 zone-first (PlayerLocation แทน currentFloor เป็น authority) หลังแมพใหม่ลง
   เพื่อ migrate ครั้งเดียว ไม่ migrate สองรอบ
3. ~~Phase 8 audit เล็ก~~ DONE 2026-07-17 (ดู PHASE_8_AUDIT + RESTED_BONUS) — งานถัดไปที่ไม่ชน
   แมพใหม่: Phase 8 เนื้องานใหญ่ (sanctuary/route choices) หรือ CI E2E gate ที่ค้างจาก P0

LAST_UPDATED: 2026-07-17 (S1 browser feel-pass: /dev/scale-lab + ScaleLabScene +
playtest-scale-lab 16/16 0 errors; tests 397/397, vue-tsc 0, generate 0, verify:pages PASS)
