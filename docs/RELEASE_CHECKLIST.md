# RELEASE_CHECKLIST — Full Game Definition & Acceptance Criteria

> Phase ใดประกาศ "ผ่าน" ได้เมื่อแถวที่เกี่ยวข้องทั้งหมดเขียว — ห้ามนับ placeholder ว่าเสร็จ
> Gate ราย phase เดิมดู `docs/foundation/ACCEPTANCE_GATES.md`

## Per-phase Definition of Done (ใช้ทุก phase)
- [ ] Implementation ทำงานจริง (เล่นจริงใน dev server ไม่ใช่แค่ unit test)
- [ ] Unit/integration tests ที่เกี่ยวข้องผ่าน (`npm test` เขียวทั้ง suite)
- [ ] Typecheck + `npm run build` exit 0 · ไม่มี console/runtime error
- [ ] Save → reload ถูกต้อง (schema versioned, migration idempotent)
- [ ] Desktop + mobile 390×844 เล่นได้ · keyboard + touch ใช้งานได้
- [ ] Reduced motion + sound settings ทำงานจริง
- [ ] Asset ของ phase เป็น final หรือ blocker ระบุชัดใน `ASSET_MANIFEST.md`
- [ ] `docs/EXECUTION_STATE.md` อัปเดต · ไม่มี regression ใน phase ที่ผ่านแล้ว

## Full Game Definition (Release)
### Content
- [ ] Campaign 6 Regions / ~32 maps เล่นจบได้จาก fresh save (manual playthrough ไม่มี blocker)
- [ ] 4 base classes + 8 advanced jobs — identity ต่างจริง, clear time ใกล้กัน, ไม่มี build เดียวเหนือทุกอย่าง
- [ ] Tower of Echoes 30 curated floors (checkpoint/5, boss/10, adaptive, anti-repeat)
- [ ] Ending + credits + post-game world state · New Game path ถูกต้อง
- [ ] ไม่มี dead currency / fake item / ระบบโชว์ใน UI ที่ไม่ทำงาน

### Learning
- [ ] ทุก production question ผ่าน validation + **human SME review record จริง**
- [ ] Anti-repeat + CEFR progression + selection จาก mastery/recent history
- [ ] ตอบผิด = explanation ไม่จำกัดเวลา · Relaxed mode ไม่มี time pressure
- [ ] Reading/image/map/table/audio stimuli ครบตาม curriculum
- [ ] Teacher dashboard ใช้ event จริง · ไม่มี answer-key รั่ว
- [ ] Misconception codes + lesson deep links จากข้อผิด

### Quality / Accessibility
- [ ] Thai/English localization ครบ · font scale / high contrast / reduced motion
- [ ] keyboard/touch/remap · modal focus trap + Escape
- [ ] ไม่มี placeholder/TODO/dev text · ไม่มี broken link/missing texture/silent button
- [ ] Accessibility cue ไม่พึ่งสีอย่างเดียว (boss phase/elite tell มี shape+banner)
- [ ] ไม่มี reaction-speed gate ที่กีดกันผู้เล่นอ่านช้า

### Engineering
- [ ] Save migration + backup + corrupt recovery ทดสอบแล้ว (fresh-install / fresh-save / upgrade-save)
- [ ] Single-player เล่นเต็มได้ offline ไม่พึ่ง external service (Sheets sync = optional เท่านั้น)
- [ ] Online (ถ้ามี) ผ่าน security gate: real auth, server-authoritative rewards, rate limit,
      privacy/moderation สำหรับเด็ก — ไม่ผ่าน = ship offline, online เป็น post-launch
- [ ] CI: tests + typecheck + build + E2E เขียว · performance budgets + asset compression
- [ ] Device/browser matrix ผ่าน (`docs/testing/MANUAL_SMOKE_MATRIX.md`)
- [ ] Asset license/provenance ครบทุกชิ้น · credits/license/privacy pages
- [ ] Production packaging (GitHub Pages subpath ผ่าน `assetPath()`) + release notes

## Outstanding (2026-07-16)
- Phase-1 gate: human browser playthrough (fresh profile 4 คลาส → ชั้น 11)
- Class A (human-at-browser) + Class B (live infra) rows ใน `docs/execution/S_GRADE_AUDIT.md`
- Save-envelope cutover ยัง off (legacy authoritative) — ต้องผ่าน gate ก่อน release
