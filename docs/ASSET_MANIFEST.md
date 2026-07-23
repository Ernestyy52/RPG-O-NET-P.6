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
| Paper-doll 5 outfits + 5 headgear + 3 shields + 12 weapon families | `public/paperdoll/` (source: `assets/generated/`) | OpenAI-generated, project-owned · 2026-07-20 | GearPaperdoll + paperdoll.ts all scenes; true 4-direction × 3-phase frames |
| Mob sprites | `public/mob-sprites/` | เดียวกัน | Tower/Dungeon/Boss |
| NPC (Mara/Kael/Borin/Wren/Sena) | `public/npc-sprites/` | Craftpix (licensed, curated จาก `asset-packs/`) | TownScene/Interiors |
| Props W1 (foliage/braziers ฯลฯ) | `public/world1-props/`, `exterior-props/`, `interior-props/`, `guildhall-props/` | Craftpix (licensed) | Town/Interior/Dungeon/Boss decor |
| Town + service interiors | `public/town-art/aethergate-town.png`, `public/interior-maps/` | โปรเจกต์ (approved mockups, 1:1 standalone crops) | TownScene / InteriorScene |
| Title art | `public/branding/spirals-echo-title.png` | user-provided | index.vue |
| UI pack / item / skill / quest icons | `public/ui-pack/`, `item-icons/`, `skill-icons/`, `quest-icons/` | Kenney/Craftpix | Vue UI |
| Audio | `public/audio/` | MCA BGM pack (licensed) + project-owned procedural dungeon/boss/SFX; see `public/audio/CREDITS.md` | bgm.ts · city/field/dungeon/boss + gameplay SFX; dungeon/boss ship as mobile OGG |

Raw pack dump 559 MB อยู่ `asset-packs/` (gitignored — build output คง ~24 MB);
curation ดึงเฉพาะไฟล์ที่ใช้เข้า `public/` พร้อมบันทึก license

## Gaps (blocker ระบุชัด — ยังไม่ปิด)

| Gap | ผลกระทบ | แผน |
|---|---|---|
| 12 named gear + 8 sigil icons ยังไม่มี icon เฉพาะ | ร้าน/inventory ใช้ icon กลาง | curate จาก `asset-packs/` (Phase 3 asset gate) |
| Secondary SFX cues (correct/wrong/crit/heal/shield/quest/level) ยังใช้เสียงหลักร่วมกันบางจุด | feedback รายละเอียดยังซ้ำกัน | เพิ่ม cue เฉพาะเหตุการณ์ในรอบ polish ถัดไป |
| Regional ambience เฉพาะพื้นที่ย่อยยังไม่มีทุกจุด | บางแผนที่ใน biome เดียวกันยังใช้อารมณ์ร่วม | เพิ่ม ambience layer ต่อ region; city/field/dungeon/boss แยกแล้ว |
| กำแพง/บันได/เงาบางส่วนยังเป็น Phaser Graphics วาดสด | โทนภาพไม่ final | แทนด้วย tilesetจริงระหว่าง Phase 2–3 |
| Hero/enemy/boss animation state ครบชุด (idle/walk/attack/cast/hit/KO ฯลฯ) | บาง state ยังใช้ tween แทน frame | Phase 2 animation state machine + Phase 3 art gate |
| Region 2–6 biome kits ทั้งหมด | ยังไม่เริ่ม | ต่อ region — เช็ค `docs/asset-index.md` ก่อน สร้างใหม่เมื่อจำเป็น |

## Art Bible (Phase 3 ต้องยึด)
16px pixel scale (แสดง 2x) · palette ธีม dark-fantasy กรอบทอง (`main.css` + `atmosphere.ts`) ·
outline เข้ม · แสง warm-torch ในเมือง/เย็นในดันเจี้ยน · UI pixel-window/glass-panel —
ห้าม emoji ปนกับ sprite งานหลักใน production UI


## Animated title screen v3

- Source: `assets/generated/title-screen/title-background-v2.png` (project-owned OpenAI-generated edit of the existing title art)
- Runtime: `public/branding/title-background-v2.webp`
- Build: `npm run build:title`
- The game logo is rendered as responsive HTML/CSS so it remains crisp and can animate independently of the background.
