# O-NET English Tower

เกม RPG 2D top-down ติวสอบ O-NET ภาษาอังกฤษ ป.6 — เดินสำรวจหอคอย 100+ ชั้น ชนมอนสเตอร์เพื่อตอบคำถาม
ภาษาอังกฤษแนว O-NET รับ EXP/เงินไปอัพเลเวลและซื้อของในร้านค้า

## Stack

- **Frontend**: Nuxt 4 (SPA mode, `ssr: false`) + Phaser 4 (เกมเอนจิน, mount ผ่าน `GameCanvas.client.vue`)
  + Pinia (state/save ผ่าน `pinia-plugin-persistedstate`) + Tailwind CSS
- **Backend**: Google Sheets + Google Apps Script (`scripts/apps-script/Code.gs`) — save/load ผู้เล่น + leaderboard
- **Hosting**: GitHub Pages (static export ผ่าน `nuxt generate`), deploy อัตโนมัติด้วย GitHub Actions
  → push ไป branch `gh-pages` (ตั้งค่า Pages source เป็น "Deploy from a branch")

## โครงสร้างโค้ดสำคัญ

Nuxt 4 ใช้ `app/` เป็น srcDir หลัก (ไม่ใช่ root) — ไฟล์ pages/components/stores/data/game ทั้งหมดอยู่ใต้ `app/`

- `app/game/scenes/TowerScene.ts` — ฉากหลักของเกม เดิน/ชนมอนสเตอร์/ขึ้นบันได
- `app/game/systems/textures.ts` — โหลด sprite จริงจาก `public/` (tiny-town, player-sprites, mob-sprites)
  และ bake grass/tree ผสมสีตามไบโอม (`assetPath()` ต้องเติม `app.baseURL` เสมอ ห้าม hardcode `/...`
  เพราะ GitHub Pages serve อยู่ใต้ subpath `/RPG-O-NET-P.6/`)
- `app/data/biomes.ts` — ไบโอม 5 แบบ วนทุก 10 ชั้น
- `app/data/floors.ts` — สูตร scaling ความยาก/EXP/Gold ตามชั้น (รองรับ 100+ ชั้น)
- `app/data/questions.ts` — โหลดคำถามจาก `data/questions.json` (root) + shuffle-bag กันคำถามซ้ำ
  ต่อระดับ CEFR ห้ามแก้คำถามในไฟล์นี้ตรงๆ ให้แก้ที่ `data/questions.json` แทน
- `knowledge/` — คลัง pattern ข้อสอบ O-NET ป.6 ที่สกัดจากข้อสอบจริง (ไม่เก็บข้อสอบจริง) ใช้ generate
  คำถามใหม่เข้า `data/questions.json` เท่านั้น กติกาเต็มอยู่ที่ `knowledge/README.md`
- `app/stores/player.ts` — Pinia store ผู้เล่น (level/exp/gold/hp/atk/inventory), persist ผ่าน localStorage
- `app/composables/useSheetsSync.ts` — เรียก Apps Script backend (`NUXT_PUBLIC_SHEETS_API_URL`)
- `app/assets/css/main.css` + `tailwind.config.ts` — ธีม pixel/glassmorphism (`pixel-window`, `glass-panel`,
  `btn-primary`, `btn-secondary`, `hud-bar`, `gold-text`) — พอร์ตมาจากโปรเจกต์พี่น้อง `onet-game-2569`
- `docs/asset-index.md` — แคตตาล็อก asset pack ทั้งหมดใน `D:\Asset` (Kenney/Craftpix/Sunnyside World ฯลฯ)
  ใช้เช็คก่อนเลือก asset มาแทนของเดิม

## Asset

- Sprite ที่ใช้อยู่ตอนนี้ copy มาจาก `C:\Users\MONSTER\OneDrive\Desktop\onet-game-2569\public`
  (ไม่รวม boss-sprites 44MB) — tiny-town/tiny-dungeon tileset, player-sprites (warrior/archer/guardian/mage),
  mob-sprites (goblin/skeleton/slime/dragon ฯลฯ)
- มี asset pack เพิ่มเติมให้เลือกใช้ที่ `D:\Asset` ดูรายละเอียดใน `docs/asset-index.md`
- กำแพง/บันได/เงาในดันเจี้ยนยังเป็น Phaser Graphics วาดสด (ไม่มี asset จริงมาแทน)
- เมือง (TownScene) ใช้ภาพ mockup `public/town-art/aethergate-town.png` เป็นแมพทั้งเมือง
  (มาจาก `docs/mockups/.../aethergate-town-map.png`, scale 1.5×) + slice อาคารตัดรันไทม์เพื่อ y-sort
  + กล่องชน/interact ล่องหน — ดู `docs/map-rebuild/` (analysis, manifest, crop pipeline, screenshots)

## กติกาการทำงาน

- **โปรเจกต์นี้แยกจาก `onet-game-2569`** — เป็นโปรเจกต์ใหม่ที่สร้างขึ้นมาต่างหากตามคำขอผู้ใช้ ไม่ใช่โปรเจกต์เดิม
- Repo: `Ernestyy52/RPG-O-NET-P.6` บน GitHub, branch หลักคือ `main`
- ทุกครั้งที่แก้โค้ดที่กระทบหน้าเกม ให้รัน dev server ทดสอบจริงก่อนสรุปว่าเสร็จ (ดู `<preview_tools>` workflow)
- ระวัง path asset ต้องผ่าน `assetPath()`/`app.baseURL` เสมอ ห้าม hardcode `/` เพราะจะพังตอน deploy ขึ้น
  GitHub Pages subpath (บั๊กนี้เคยเกิดมาแล้ว — ดูคอมมิต "Fix sprite asset 404s on GitHub Pages")
