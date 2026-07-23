# ARCHITECTURE_DECISION

> Phase 0 (Master Plan GitHub Pages Branch) — ความจริงกลางของสถาปัตยกรรม ณ 2026-07-16
> อ่านคู่กับ `docs/foundation/` (รายละเอียดเดิม) และ `docs/BACKEND_MIGRATION.md`

## KEEP
- Nuxt 4 SPA (`ssr: false`) + Nitro `static` preset + `npm run generate` → `.output/public`
- Phaser 4 (mount ผ่าน `GameCanvas.client.vue`), Pinia + persistedstate (localStorage save, schema v4)
- `.github/workflows/deploy.yml` — push `main` → build → peaceiris/actions-gh-pages@v4 →
  publish `.output/public` ไป `gh-pages` (force_orphan) — **ตรงกับ contract ของ Master Plan อยู่แล้ว ห้าม rewrite**
- GitHub Pages: Deploy from a branch / `gh-pages` / root — base `/RPG-O-NET-P.6/`
- `app.baseURL` จาก `NUXT_APP_BASE_URL` (workflow ใช้ `/${repo-name}/` = equivalent)
- `assetPath()`/`setAssetBase()` — utility กลางตัวเดียว (ย้ายไป `app/game/systems/assetBase.ts`,
  `textures.ts` re-export API เดิม เพื่อไม่ลาก Phaser เข้า store/test)
- คำถามจาก `data/questions.json` bundle ผ่าน static import (base-path safe โดยธรรมชาติ)
- Offline single-player ครบโดยไม่มี backend (`useSheetsSync` inert เมื่อ apiUrl ว่าง)

## REPLACE
- (Phase 7) Client-authoritative save/reward ผ่าน Apps Script → server-authoritative backend
  ตาม `docs/BACKEND_MIGRATION.md` — ยังไม่ทำใน Phase 0–1

## MIGRATE
- (Phase 7) Identity แบบ player-name → Auth จริง; Sheets เหลือหน้าที่ authoring/report

## REMOVE
- Hardcoded root-absolute asset path ใน runtime — พบ 1 จุด (`player.ts` getters) แก้แล้วให้ผ่าน `assetPath()`
- ไม่มีอย่างอื่นถูกลบใน Phase 0–1

## BLOCKER
- Pages settings ตรวจผ่าน API ต้องมี `gh` auth — หากไม่มีให้ยืนยัน manual (ดู EXECUTION_STATE)
- `server/` (Colyseus prototype) อยู่นอก static build — ไม่ blocking GitHub Pages

## ACCEPTANCE
- `npm test` 333/333 ผ่าน, `npm run generate` (base `/RPG-O-NET-P.6/`) exit 0
- ไม่มี root-absolute runtime asset path; subpath simulation ผ่าน (`scripts/verify-pages.mjs`)
