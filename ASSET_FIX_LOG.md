# ASSET_FIX_LOG

Chronological log of asset processing / integration changes. Originals in `D:\Asset` are never modified;
all derived assets are generated into the project (`public/`, `assets/`) via reproducible scripts.

## 2026-07-06

### Added — boss spritesheets (craftpix-561178 → Phaser strips)
- **New script:** `scripts/sprite-crop/build-bosses.cjs` — composites individual per-frame PNGs into
  horizontal strip spritesheets using `sharp` (no per-frame trim → stable pivot). Auto-detects frame
  size and frame count from disk.
- **Generated:** `public/mob-sprites/`
  - `boss_dragon_idle.png` (256×256 ×3), `boss_dragon_walk.png` (×5)
  - `boss_demon_idle.png` (256×256 ×3), `boss_demon_walk.png` (×6)
  - `boss_medusa_idle.png` (128×128 ×3), `boss_medusa_walk.png` (×4)
  - `boss_small_dragon_idle.png` (128×128 ×3), `boss_small_dragon_walk.png` (×4)
  - `_boss_manifest.json` (frame sizes + counts)
- **Wired in:** `app/game/systems/textures.ts` (preload + anims + `bossVisualForFloor()`),
  `app/game/scenes/TowerScene.ts` (animated boss + shadow + float tween + shrunk physics body).
- **Retired:** `mob_dragon` (static 963-byte `dragon.png`) — no longer referenced.
- **Verified:** live preview, boss floor 10 — all 4 sheets load, correct sizes, anims playing, crisp.

### Added — asset scan tooling
- **New script:** `scripts/sprite-crop/scan-assets.ps1` — reads PNG/IHDR headers across `D:\Asset`,
  emits `scratchpad/asset-scan.csv` (14,449 rows) + per-pack dimension histogram. Basis for
  `ASSET_MASTER_INDEX.md`.

### Dev tooling
- `app/components/game/GameCanvas.client.vue` — added `import.meta.dev`-guarded `window.__game` handle
  for preview/verification (jump floors, inspect scenes). No-op in production builds.

## 2026-07-07

### Character sprites unified — map-walking sprite == UI icon (Main Character Asset)
- **Source analysed:** `D:\Asset\Main Character Asset\Character Asset\Occupation.png` (1402×1122). Thai
  labels confirm layout: นักรบ(Warrior)/นักธนู(Archer)/นักเวท(Mage)/นักโล่ป้องกัน(Guardian), each ชาย(male)/
  หญิง(female), sub-columns Idle/Movement; rows = down/left/right/up. Style = 64×64 JRPG (per overview
  sheet `Character Asset.png`).
- **New script:** `scripts/sprite-crop/build-overworld.cjs` — flood-fill crops the 8 class×gender cells
  into UNIFORM Phaser sheets (4 dir × [idle,move]) **and** a matching down-idle icon from the *same*
  cells, so the two can't drift apart.
- **Generated:** `public/character-sprites/<class>_<gender>.png` (+ `_sheet_manifest.json`) and
  `public/character-icons/<class>_<gender>.png` — 8 each.
- **Wired in:**
  - `app/game/systems/textures.ts` — `CLASS_SHEETS` manifest, `heroKey/heroAnim/heroSheetSize`,
    per class×gender idle/walk anims. Retired old `player-sprites/overworld/*` chibi sprites.
  - `app/game/scenes/TowerScene.ts` + `TownScene.ts` — player sprite now gender-aware, scaled to ~48px,
    foot-anchored. Removed the placeholder `CharacterLayeredSprite` equipment overlay from the map (the
    JRPG sprite already includes the class outfit + weapon, matching the icon).
  - `app/pages/index.vue` + `classIcon()` — class-select buttons and the character card now show
    `character-icons/<class>_<gender>.png`.
- **Verified:** live preview, female Guardian — icon and in-map sprite are identical; all 4 directions
  have idle+walk anims (frame pairs down[0,1]/left[2,3]/right[4,5]/up[6,7]); TownScene + TowerScene both
  render; assets return 200; zero console errors.
- **Note:** `characterLayeredSprite.ts` / `characterAppearance.ts` / `equipmentVisualMap.ts` remain in the
  tree (unused on the map) for a future craftpix modular-equipment layer; `classes.ts.sprite` (battle
  portraits) left untouched.

## 2026-07-07 (รอบสอง — ตรวจทิศเดิน + World Boss MCA + ระบบความสนุก)

### BUGFIX ทิศทางเดิน "ขวา" ผิดด้าน (ตรวจตามคำขอผู้ใช้)
- พิสูจน์ด้วย `verify-dirs.cjs` + `check-mirror.cjs`: แถว "right" ใน Occupation.png จริงๆ วาดหันซ้าย
  เหมือนแถว left → ตัวละครเดินขวาแต่หน้าหันซ้าย
- แก้ใน `build-overworld.cjs`: สร้างแถวขวาจาก mirror (flop) ของแถวซ้าย → diff(left, mirrored-right)=0
- ยืนยันในเกมจริง: down/left/right/up ครบ 4 ทิศถูกต้อง (screenshot line-up)
- mage_male fw เปลี่ยน 80→79 → อัปเดต CLASS_SHEETS ใน textures.ts

### BUGFIX dual-scene: TownScene+TowerScene ทำงานซ้อนกันตลอด
- Phaser auto-start scene แรกใน config array — แก้ createGame ใช้ scene.add(autoStart=false)

### BUGFIX Phaser 4: setTintFill ถูกลบ → hit-flash พัง
- แก้เป็น setTint(0xffffff).setTintMode(Phaser.TintModes.FILL) ยืนยัน 0 error ตอนชนมอนสเตอร์

### World Boss จาก MCA Boss folder (แทน craftpix — MCA ล้วนตามคำขอ)
- ค้นพบ: `Character Asset\Boss` = ชีต 4x4 (idle/attack/hurt/death x4 เฟรม) 50 แบบ พื้นขาว 1254px
- `build-mca-bosses.cjs`: ลบพื้นขาวด้วย edge flood-fill → strip idle 4 เฟรม 160px + portrait 128px
- เลือก 10 ตัวแมตช์ธีมโลก (Myco Colossus, Dune Serpent, Frost Giant, Magma Golem, Amethyst Golem,
  Grove Golem, Pharaoh Eternal, Frost Lich King, Winged Abyss Demon, The Kraken)
- ลบ craftpix boss strips ที่ไม่ใช้แล้วออกจาก public/

### BGM ประจำไบโอม (MCA Audio)
- `copy-bgm.cjs`: 6 เพลง (forest/desert/snow/volcano/cave/town, ~278KB/เพลง) → `app/game/systems/bgm.ts`
  เล่นวนต่อเนื่อง เปลี่ยนเฉพาะตอนเปลี่ยนไบโอม — ยืนยันเล่นจริง (bgm_forest playing, unlocked)

### ระบบความสนุก
- คอมโบ: ตอบถูกติดกัน +15%/สแตค (สูงสุด +60%) ตอบผิดรีเซ็ต + badge แสดงใน BattleModal
- Hit feedback: มอนสเตอร์แฟลชขาว/สั่น + ฝั่งผู้เล่นสั่นตอนโดนตี (CSS keyframes)
- มอนสเตอร์เดินสุ่มทิศ (wander 40%/1.4s, ชนกำแพง/กันเอง, depth ตาม y) — โลกมีชีวิต
- Battle hero icon เปลี่ยนเป็น character-icons (ตรงกับ sprite ในแมพ)

## 2026-07-07 (รอบสาม — ล้าง sprite นอก MCA + ประตูผู้เฝ้า Portal.png)

### ลบ Character asset/sprite ที่มาจาก asset index (ไม่ใช่ MCA) ทั้งหมด
- ลบไฟล์ public: `player-sprites/` (battle+overworld chibi ของ onet-game-2569), `character-layers/`,
  และ `mob-sprites/*.png` ระดับ root (orc/skeleton/slime/demon/ghost/lizardman/medusa/wyvern/dragon เก่า)
  → เหลือเฉพาะ `mob-sprites/mca/` + `mob-sprites/world-boss/` (MCA ล้วน)
- ลบโค้ดตาย: `buildMonsterAnimations`, `MONSTER_KINDS`, `monsterAnimKey`, `buildDungeonGate`,
  `buildCharacterLayerPlaceholders`, โหลด anim_goblin/skeleton/slime ใน textures.ts
- ลบโมดูลระบบเลเยอร์ที่เลิกใช้: `characterLayeredSprite.ts`, `characterAppearance.ts`, `equipmentVisualMap.ts`
- `classes.ts`: ลบฟิลด์ `sprite` (ชี้ player-sprites เดิม) — sprite/icon ทั้งหมดมาจาก MCA แล้ว
- Character creation preview: เปลี่ยนจาก overlay base+occupation เป็น sprite อาชีพ+เพศจริง (MCA character-icons)

### ประตูดันเจี้ยน = ผู้เฝ้าประตู จาก Portal.png (วิเคราะห์ภาพ+ตัวหนังสือในภาพ)
- Portal.png = ผู้เฝ้าประตูมีคาถา + ซุ้มหิน + กุญแจล็อก + บทพูดไทยในภาพ mockup
- `build-portal.cjs`: สกัดซุ้มประตู → `public/npc/portal_gate.png` + portrait → `public/npc/portal_guardian.png`
- แทนประตู Graphics เดิมในเมืองด้วย portal_gate (ลอยเรืองแสง)
- `PortalModal.vue` ใหม่: กล่องสนทนาผู้เฝ้าประตู ใช้บทพูดไทย **ตรงจากในภาพ** ("ข้ามิใช่ผู้ขวางเจ้า...")
  + ตัวเลือก "1. เข้าดันเจี้ยน / 2. ถอยออกไป" — ยืนยันก่อนเข้าดันเจี้ยน
- flow: เดินชนประตู → emit town:portal → เปิดกล่อง → กด "เข้าดันเจี้ยน" → emit town:enter-dungeon →
  TownScene start TowerScene (ยืนยันในเกม: floor 2, 25 monsters, 0 error)

## Standardization decisions (applied going forward)
- Derived sprites live under `public/` (runtime) or `assets/` (source crops); scripts under
  `scripts/sprite-crop/`. Naming: `boss_<creature>_<state>.png`, `<char>_<state>_<dir>_NN.png`.
- Do **not** per-frame trim animated creature frames (keeps pivot stable).
- Prefer integer scale factors; craftpix family only for in-world art coherence.

## Pending (not yet applied — see MAP_ASSET_USAGE / MISSING_OR_WEAK_ASSETS)
- Village tileset slicing (504452) for ground/wall variation.
- Foliage-with-shadow (141354), ruins (934618), town building set (477438/189780/504452).
- Slime recolors (788364), biome spawn tables.
