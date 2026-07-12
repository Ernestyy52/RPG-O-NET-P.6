# SAVE MIGRATION GUIDE (Phase 04, ADR 0001)

How the versioned save system works, how to turn it on safely, and how to roll back.

## What shipped
A framework-agnostic, fully tested save library under `app/utils/save/` — **not yet wired into live
persistence**. The legacy Pinia `player` store remains the authoritative save path until the envelope
path is verified against real saves (roadmap: "do not remove the legacy player store until
compatibility passes").

| Module | Responsibility |
|---|---|
| `schema.ts` | `SaveEnvelope { version, savedAt, slices }`; slices `profile/character/learning/session/inventory/quest/settings`; keys; defaults; `isValidEnvelope`. |
| `legacyAdapter.ts` | `toSlices`/`toEnvelope` (monolithic `player` → slices) and `toLegacyPlayer`/`toLegacySettings` (slices → shapes the existing stores hydrate from). Total & partial-save tolerant. |
| `migrations.ts` | Ordered, idempotent `MIGRATIONS` registry + `runMigrations` (steps to `CURRENT_SAVE_VERSION`; normalizes gaps; no-op at current). |
| `saveManager.ts` | `loadSave` (primary→backup→legacy→default with corrupt-blob preservation), `writeSave` (backup-before-write), `migrateLegacyIfNeeded` (one-time), injectable `StorageLike`. `SAVE_ENVELOPE_ENABLED = false`. |

## Storage keys
- `save:onet` — primary envelope
- `save:onet:backup` — previous primary (auto before each write)
- `save:onet:corrupt:<ts>` — preserved unreadable blobs (never silently discarded)
- `player`, `settings` — legacy monolithic stores (still authoritative today)

## Safety properties (all covered by `test/save.spec.ts`, 11 tests)
- **Existing saves migrate:** a legacy `player` blob loads via `source: 'legacy'` into a current envelope.
- **Idempotent:** re-running migrations or `migrateLegacyIfNeeded` never changes/clobbers a current save.
- **Corruption recovery:** a corrupt primary falls back to backup, then legacy, then a fresh default — and the corrupt blob is retained for forensics.
- **Partial saves:** missing fields fill from defaults; never throws.
- **Backup before write:** the prior primary is copied to the backup slot on every write.
- **No silent reset:** default is only used when nothing recoverable exists.

## Turning it on (future integration step — deliberately not done in Phase 04)
1. Set `SAVE_ENVELOPE_ENABLED = true` (or promote to a `runtimeConfig.public` flag).
2. On app init (client plugin): call `migrateLegacyIfNeeded()` once, then `loadSave()`; hydrate the
   Pinia stores from `toLegacyPlayer(envelope.slices)` / `toLegacySettings(...)`.
3. On store `$subscribe`, debounce `writeSave(toEnvelope(player.$state, settings.$state))`.
4. Keep writing the legacy `player` key in parallel for one release (dual-write) so a rollback loses nothing.

## Rollback
- **Flag off (default):** delete/ignore `save:onet*` keys; the legacy `player` store is untouched and
  fully authoritative. Zero player-data impact.
- **After enabling + dual-write:** flip the flag off; the legacy `player` key still holds current state.
- **Corrupt primary in the field:** `loadSave` auto-recovers from `save:onet:backup`; the bad blob is
  under `save:onet:corrupt:<ts>` if manual inspection is needed.
- Git rollback of the code is safe — the modules are additive and imported by nothing at runtime while
  the flag is off (see `docs/foundation/ROLLBACK_GUIDE.md`).
