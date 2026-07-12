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
- กำแพง/บันได/เงา/อาคารเมืองยังเป็น Phaser Graphics วาดสด (ไม่มี asset จริงมาแทน)

## กติกาการทำงาน

- **โปรเจกต์นี้แยกจาก `onet-game-2569`** — เป็นโปรเจกต์ใหม่ที่สร้างขึ้นมาต่างหากตามคำขอผู้ใช้ ไม่ใช่โปรเจกต์เดิม
- Repo: `Ernestyy52/RPG-O-NET-P.6` บน GitHub, branch หลักคือ `main`
- ทุกครั้งที่แก้โค้ดที่กระทบหน้าเกม ให้รัน dev server ทดสอบจริงก่อนสรุปว่าเสร็จ (ดู `<preview_tools>` workflow)
- ระวัง path asset ต้องผ่าน `assetPath()`/`app.baseURL` เสมอ ห้าม hardcode `/` เพราะจะพังตอน deploy ขึ้น
  GitHub Pages subpath (บั๊กนี้เคยเกิดมาแล้ว — ดูคอมมิต "Fix sprite asset 404s on GitHub Pages")

## Automatic Model and Agent Routing

> Installed by the Auto Model & Effort Router (master plan §26–31). Main session runs
> `opusplan` + `high` (see `.claude/settings.json`); specialist agents in `.claude/agents/`
> carry their own `model`/`effort`. Full install report: `docs/claude/AUTO_MODEL_ROUTER_INSTALL_REPORT.md`.

For every substantive request, classify the work before editing.

### Mandatory routing

Delegate automatically:

- Whole-repository analysis, architecture, cross-domain refactors, unknown root-cause bugs, and final release decisions:
  use `game-architect`.

- O-NET taxonomy, question validation, mastery, spaced review, misconceptions, adaptive learning, and teacher analytics:
  use `learning-architect`.

- Phaser combat, skills, targeting, enemy AI, boss phases, status effects, Knowledge Break combat behavior:
  use `combat-engineer`.

- Save schema, persistence, migration, backup, recovery, and compatibility:
  use `save-migration-engineer`.

- Colyseus rooms, synchronization, server authority, reconnect, anti-duplication, and party state:
  use `multiplayer-engineer`.

- Loot, inventory transactions, crafting, prices, rewards, drop tables, Sigils, and economy exploits:
  use `economy-engineer`.

- Approved scoped implementation, UI, mobile controls, quests, adapters, and normal fixes:
  use `implementation-engineer`.

- Asset manifests, Phaser asset loading, map composition, animation slicing, Y-sort, collision, VFX and audio integration:
  use `world-art-engineer`.

- Tests, validators, fixtures, deterministic simulation, data cleanup, reports, and safe mechanical refactors:
  use `test-data-engineer`.

- Trivial documentation, exact renames, comments, and tiny configuration edits:
  use `routine-worker`.

- Independent completion review:
  use `qa-release`.

### Escalation rules

Escalate from Sonnet/Haiku to Opus/Fable when any condition is true:

- more than two domains are affected
- save compatibility is uncertain
- multiplayer state or rewards are involved
- the root cause remains unknown after one reproduction attempt
- the same fix failed twice
- architecture must change
- security, privacy, or educational correctness is at risk
- the task may remove or migrate data
- the task changes core combat or learning formulas
- release approval is requested

### De-escalation rules

Use Sonnet medium or Haiku only when:

- the expected files are already known
- behavior is fully specified
- no schema or architecture decision is needed
- rollback is trivial
- tests already cover the behavior
- no student data, rewards, save, combat, or network authority is involved

### Execution discipline

1. Classify the request.
2. Name the selected agent and why.
3. Delegate rather than changing the main session model repeatedly.
4. Do not delegate overlapping write ownership in parallel.
5. Use worktree isolation for risky implementation agents.
6. Require tests, build, changed-file report, risks, and rollback.
7. If an agent cannot access its configured model, use the strongest allowed model and disclose the fallback.
8. Do not claim completion until `qa-release` or a phase-specific reviewer passes the acceptance criteria.
