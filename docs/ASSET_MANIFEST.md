# ASSET_MANIFEST — SPIRAL'S ECHO

> Top-level asset index: สถานะ, source/license, usage, สิ่งที่ขาด
> รายละเอียด World-1 ราย asset อยู่ที่ `docs/assets/WORLD_01_APPROVED_ASSET_MANIFEST.md`
> (+ audit/gaps คู่กัน); แคตตาล็อก pack ทั้งหมดใน `D:\Asset` ดู `docs/asset-index.md`
> กฎ: ทุก asset ต้องมีหลักฐานสิทธิ์ · โหลดผ่าน `assetPath()` เท่านั้น · ห้ามนับ placeholder ว่าเสร็จ

## Wired & licensed (ใช้จริงในเกมแล้ว)

| กลุ่ม | Path | Source/License | ใช้ที่ |
|---|---|---|---|
| Tileset เมือง/สนาม | `public/tiny-town/` | Kenney (CC0) | textures.ts → Town/Tower/Boss (baked biome) |
| Tileset ดันเจี้ยน | `public/tiny-dungeon/`, `public/dungeon-assets/` | Kenney (CC0) | DungeonScene |
| Player sprites 4 คลาส | `public/character-sprites/`, `character-icons/` | สืบทอดจาก onet-game-2569 (ตรวจแล้ว) | ทุก scene + creator |
| Mob sprites | `public/mob-sprites/` | เดียวกัน | Tower/Dungeon/Boss |
| NPC (Mara/Kael/Borin/Wren/Sena) | `public/npc-sprites/` | Craftpix (licensed, curated จาก `asset-packs/`) | TownScene/Interiors |
| Props W1 (foliage/braziers ฯลฯ) | `public/world1-props/`, `exterior-props/`, `interior-props/`, `guildhall-props/` | Craftpix (licensed) | Town/Interior/Dungeon/Boss decor |
| Town backdrop | `public/town-art/town-night.png` | โปรเจกต์ (user-provided) | TownScene |
| Title art | `public/branding/spirals-echo-title.png` | user-provided | index.vue |
| UI pack / item / skill / quest icons | `public/ui-pack/`, `item-icons/`, `skill-icons/`, `quest-icons/` | Kenney/Craftpix | Vue UI |
| Audio | `public/audio/` | ดู provenance ในโฟลเดอร์ | bgm.ts |

Raw pack dump 559 MB อยู่ `asset-packs/` (gitignored — build output คง ~24 MB);
curation ดึงเฉพาะไฟล์ที่ใช้เข้า `public/` พร้อมบันทึก license

## Gaps (blocker ระบุชัด — ยังไม่ปิด)

| Gap | ผลกระทบ | แผน |
|---|---|---|
| 12 named gear + 8 sigil icons ยังไม่มี icon เฉพาะ | ร้าน/inventory ใช้ icon กลาง | curate จาก `asset-packs/` (Phase 3 asset gate) |
| SFX ชุด combat (correct/wrong/hit/crit/heal/shield/loot/quest/gate/level) ยังไม่ครบ | เสียง feedback บางจุดเงียบ | curate จาก `D:\Asset` audio packs (Phase 2 audio manager + Phase 3 gate) |
| BGM แยก เมือง/field/dungeon/boss + ambience ต่อ region | ยังใช้เพลงร่วม | Phase 3 (W1) แล้วต่อ region ละชุด |
| กำแพง/บันได/เงาบางส่วนยังเป็น Phaser Graphics วาดสด | โทนภาพไม่ final | แทนด้วย tileset จริงระหว่าง Phase 2–3 |
| Hero/enemy/boss animation state ครบชุด (idle/walk/attack/cast/hit/KO ฯลฯ) | บาง state ยังใช้ tween แทน frame | Phase 2 animation state machine + Phase 3 art gate |
| Region 2–6 biome kits ทั้งหมด | ยังไม่เริ่ม | ต่อ region — เช็ค `docs/asset-index.md` ก่อน สร้างใหม่เมื่อจำเป็น |

## Art Bible (Phase 3 ต้องยึด)
16px pixel scale (แสดง 2x) · palette ธีม dark-fantasy กรอบทอง (`main.css` + `atmosphere.ts`) ·
outline เข้ม · แสง warm-torch ในเมือง/เย็นในดันเจี้ยน · UI pixel-window/glass-panel —
ห้าม emoji ปนกับ sprite งานหลักใน production UI
