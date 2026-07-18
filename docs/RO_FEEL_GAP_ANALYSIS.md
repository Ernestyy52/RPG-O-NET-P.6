# RO-Feel Gap Analysis — "กลิ่นอาย Ragnarok Online" (2026-07-18)

> กติกาเหล็ก (GAME_CONTRACT / MAP_BUILD non-negotiable #4): **แรงบันดาลใจเท่านั้น ห้าม copy**
> แมพ/สไปรต์/UI/มอนสเตอร์/ชื่อ/เพลง/สูตรตรงๆ ของ RO หรือเกมอื่น — ทุกระบบด้านล่างเป็นสูตร/ชื่อ
> ของเราเอง

## มีแล้ววันนี้ (นับเป็นกลิ่นอาย RO ที่ทำงานจริง)

| ระบบ RO-like | สถานะในเกมเรา |
|---|---|
| คลาส + เปลี่ยนอาชีพ | 4 คลาสฐาน → เลือก 1 จาก 2 อาชีพขั้นสูงที่ Lv15 (8 อาชีพ, เปลี่ยนฟรี) — โครง 2 ชั้นแบบ Novice→Job แล้ว |
| สกิลบิลด์ | loadout 5+1+2 passive, preset 3/คลาส + custom + Respec ฟรี, balance sim บังคับ parity |
| **อัพสเตตัสเอง** | **ลงแล้ว 2026-07-18**: +3 แต้ม/เลเวล กด VIT/ATK/DEF/MAG/SPD/WIS ในหน้า Status, ราคาแพงขึ้นทุก 10 แต้ม (กัน dump), Reset ฟรี, เซฟ v7 |
| ของสวม + ออร่า rarity | paper-doll weapon จริง + gear aura + trinket |
| การ์ด/ซ็อกเก็ต analog | Sigils craft + socket (บวก stat แบบ bounded) — ของเราเอง ไม่ใช่การ์ดมอนสเตอร์ |
| เมืองศูนย์กลาง + บริการ | Town + Guild/Hospital/Shop/Forge; แผน Aethergate มี Job Hall/Bank/Inn ครบ 12 อาคาร |
| World boss | บอสประจำโลก 10 โลก + boss arena แยก |
| Multiplayer รากฐาน | Colyseus co-op พื้นฐาน + leaderboard (Sheets) |
| Rested/inn feel | rested bonus เมื่อห่างเกม ≥8 ชม. (ethical — ไม่มี punishment) |

## ช่องว่างที่เหลือ (เรียงตามผลต่อ "กลิ่นอาย" ต่อหน่วยงาน)

1. **โลกที่เดินต่อเนื่อง เมือง→ทุ่ง→ดันเจี้ยน** — ตัวชี้วัด RO ที่แรงสุด ปัจจุบันคือ tower ชั้นๆ
   → **กำลังทำอยู่แล้ว**: scale gate ผ่าน (M1 64×48), S4/P1 = Aethergate + Whisperwood slice
   (32-map campaign = สิ่งนี้ตรงๆ) — ห้ามเริ่มระบบใหม่ตัดหน้า S4
2. **พิธีเปลี่ยนอาชีพที่ "เป็นสถานที่"** — ตอนนี้เปลี่ยนในโมดัล; ควรผูกกับ Job Hall ใน Aethergate
   (NPC + เควสต์สั้น) → hook ไว้ทำพร้อม P1 town (ไม่ต้องแตะ data — JOBS พร้อมแล้ว)
3. **มอนสเตอร์ยืนฟาร์มเป็นโซน + วงจร respawn เห็นได้** — มี respawn 10s แล้ว; ที่ขาดคือ
   field map ที่ mob กระจายเป็นย่านตามธีม (มาพร้อม P1 Whisperwood zone design)
4. **Drop loop ของ Sigil/วัสดุจากมอนสเตอร์เฉพาะตัว** (การ์ดตก-จากตัวไหน-ฟาร์มตัวนั้น) —
   ตอนนี้ sigil มาจาก craft เป็นหลัก → เพิ่ม per-monster drop table ตอนทำ region content
5. เศรษฐกิจผู้เล่น (ฝากของ Bank ใน town ใหม่, trade/vending ต้อง backend P9 — บันทึกไว้ ห้ามทำ offline หลอกๆ)
6. เพลง/SFX ประจำแมพ + ambience (art/audio blocker เดิม → Phase 10)

## คำตัดสินเรื่อง "เพิ่ม/ลดอาชีพ" (audit 2026-07-18)

**คงโรสเตอร์ 4 คลาส × 2 อาชีพ = 8 ไว้** — เหตุผลจากหลักฐาน:
- ทุกอาชีพมี identity ชัด (Berserker/Warmaster, Stormcaller/Lorekeeper, Sharpshooter/Trickster,
  Bulwark/Lightwarden) และผ่าน balance sim (ทุก build ชนะทุก scenario, ไม่มี build เดียวกินรวบ,
  parity band ≤2.2 ในคลาส / ≤1.9 ข้ามคลาส) — ลบอาชีพ = เซฟที่ถืออาชีพนั้นเสีย identity + ต้อง
  migration; เพิ่มอาชีพ = ต้องมีสกิลใหม่ ≥6 + builds + sim ใหม่ (งาน content ไม่ใช่งานแก้บั๊ก)
- กลิ่นอาย RO ไม่ได้มาจาก "จำนวน" อาชีพ แต่มาจาก **บันได**: สิ่งที่ควรเพิ่มคือชั้นที่ 3
  (2nd-tier job ที่ ~Lv40, 2 ทางต่ออาชีพ → 16) **เป็น content ของ Region 3+** — จองไว้ใน
  backlog, ห้าม hardcode ตอนนี้ (JOBS เป็น data-driven อยู่แล้ว รองรับการเพิ่มโดยไม่แก้ engine)

## สิ่งที่ลงมือแล้วในรอบนี้ (2026-07-18)

- **Stat allocation** (`app/data/statAllocation.ts` pure + flag `STAT_ALLOC_ENABLED`):
  store getters/actions ใน `player.ts`, UI ในหน้า Status (แต้ม/ราคา/Reset + badge บนปุ่ม Status),
  เซฟ v7 (schema/migration/legacyAdapter — additive, เซฟเก่า stat เดิมเป๊ะจนกว่าจะกดเอง;
  zone-first migration เลื่อนเป็น v8), เทส: `test/stat-allocation.spec.ts` 6 + save v7 อีก 2
  → รวม 417/417; playtest `scripts/playtest-stat-alloc.mjs` **PASS 13/13, 0 errors**
  (seed เซฟเก่า level 5 → hydration สะอาด, +ATK เพิ่ม ATK จริง, persist ข้าม reload, Reset คืนครบ)
- **จัดหมวดเมนูล่าง 3 กลุ่ม** Character (Status/Inventory/Skills) · Journal (Quests/Map/Log) ·
  World (Town/Guild/Craft) — ปุ่ม/handler/badge ครบเดิม + badge แต้มค้างบนปุ่ม Status;
  regression: mobile-layout 17/17, battle 18/18
