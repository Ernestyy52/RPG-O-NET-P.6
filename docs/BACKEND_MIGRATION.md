# BACKEND_MIGRATION

> Phase 0 snapshot — data ownership จริงวันนี้ และเส้นทางย้าย authority (ลงมือจริง Phase 7)

## Data ownership ปัจจุบัน (ความจริง ณ 2026-07-16)
- **Save/inventory/gold/floor:** client ทั้งหมด — Pinia + localStorage (schema v4, มี migration)
- **Cloud sync + leaderboard:** Google Apps Script (`scripts/apps-script/Code.gs`) ผ่าน
  `NUXT_PUBLIC_SHEETS_API_URL` — endpoint public, client ส่งค่าเองทั้งหมด (**client-trusted**)
- **Multiplayer:** Colyseus client + `server/` prototype — `NUXT_PUBLIC_COLYSEUS_URL` ว่าง = offline
- **คำถาม/เนื้อหา:** `knowledge/` → `data/questions.json` → bundle ตอน build (read-only บน client)

## KEEP
- GitHub Pages เป็น static frontend เท่านั้น; offline play ไม่พึ่ง backend ใดๆ
- Sheets/Apps Script สำหรับ question authoring + aggregate teacher report

## REPLACE (Phase 7)
- Apps Script ในบทบาท save/reward authority → backend server-authoritative
  (Auth + DB + validated reward ledger + idempotency) ผ่าน `BackendAdapter` interface
  (Local / Legacy / Firebase) — game logic ห้ามผูก vendor ตรง

## MIGRATE (Phase 7 order)
1. Local fallback → 2. Emulator → 3. Auth/schema/rules → 4. Migration script →
5. Staging import → 6. checksum compare → 7. shadow read → 8. cutover ทีละ domain →
9. ปิด legacy public writes หลัง approval — ห้าม long-term dual-write

## REMOVE (จาก production authority — Phase 7)
- Player name เป็น identity; client-authoritative gold/item/floor; Sheets เป็น live inventory DB;
  public Apps Script เป็น reward authority

## BLOCKER
- ยังไม่มี credential/approval สำหรับ cloud resource ใดๆ — ห้าม deploy จนผู้ใช้ให้
- Apps Script ปัจจุบันเชื่อค่าจาก client — ยอมรับได้ชั่วคราวเพราะเป็น leaderboard/backup
  ที่ไม่จ่าย reward กลับเข้าเกม (ความเสี่ยง: คะแนน leaderboard ปลอมได้ — แก้จริง Phase 7)

## ACCEPTANCE (Phase 0 scope)
- ไม่มี secret ใน client bundle (`NUXT_PUBLIC_*` เป็น public URL เท่านั้น) — ตรวจแล้ว
- Offline play ไม่แตะ network ที่จำเป็นต่อการเล่น
