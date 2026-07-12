# KNOWN_BLOCKERS

Only items that genuinely require an owner decision, credential, payment, legal/licensing input, or unverifiable educational correctness. Normal implementation uncertainty is NOT a blocker.

## Active blockers
_None currently blocking Phases 00–03._

## Deferred / external (will block specific later phases, not now)

| ID | Blocker | Blocks | Needed from owner |
|---|---|---|---|
| B-01 | Google Apps Script / Sheets endpoint URL + deploy | Live save-sync & leaderboard testing (optional) | `NUXT_PUBLIC_SHEETS_API_URL`, script deployment |
| B-02 | Hosted Colyseus server (Render/Fly/Railway) | Real multiplayer/co-op integration testing (Phase 15) | hosting account + `NUXT_PUBLIC_COLYSEUS_URL` |
| B-03 | Account/persistence database provider | MMORPG persistence (Phase 19) | DB provisioning + credentials (payment) |
| B-04 | Load/security/moderation infrastructure | MMORPG readiness (Phases 20–24) | infra provisioning + cost approval |
| B-05 | Licensed art/audio provenance for any asset lacking clear license | World 1 art polish (Phase 14) if a needed asset has no license | licensing confirmation |

## Documentation gaps (assumptions, not blockers)

- `RPG_ONET_NEW_GAME_FOUNDATION_MASTER_PLAN_TH.md` missing — see DECISION_LOG D-001. Proceeding on the execution-prompt roadmap + AI_Development_Bible_V2.
