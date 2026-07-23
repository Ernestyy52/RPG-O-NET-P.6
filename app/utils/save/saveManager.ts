// ================================================================================================
// Save manager (Phase 04, ADR 0001)
//
// Orchestrates versioned persistence: backup-before-write, corruption recovery, and one-time
// migration of the legacy monolithic `player` blob into a SaveEnvelope. Every function takes an
// injectable Storage-like object (defaults to localStorage) so the logic is unit-testable in Node.
//
// FEATURE FLAG: SAVE_ENVELOPE_ENABLED is false by default — the machinery ships and is fully tested,
// but the live Pinia `player` store remains the authoritative persistence path until compatibility
// is proven (roadmap: "do not remove the legacy player store until compatibility passes"). Nothing
// here changes runtime behavior while the flag is off.
// ================================================================================================
import {
  CURRENT_SAVE_VERSION, SAVE_KEY, SAVE_BACKUP_KEY, SAVE_CORRUPT_PREFIX, LEGACY_PLAYER_KEY,
  defaultEnvelope, isValidEnvelope, type SaveEnvelope,
} from './schema'
import { runMigrations } from './migrations'
import { toEnvelope, type LegacyPlayer, type LegacySettings } from './legacyAdapter'

/** Feature flag — keep false until the envelope path is verified against real saves. */
export const SAVE_ENVELOPE_ENABLED = false

const LEGACY_SETTINGS_KEY = 'settings'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type LoadSource = 'primary' | 'backup' | 'legacy' | 'default'

export interface LoadResult {
  envelope: SaveEnvelope
  source: LoadSource
  /** true when the primary save was unreadable and we fell back to backup/default. */
  recovered: boolean
  /** true when a legacy `player` blob was migrated into the envelope. */
  migratedFromLegacy: boolean
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof localStorage !== 'undefined') return localStorage as unknown as StorageLike
  return null
}

function tryParseEnvelope(raw: string | null): SaveEnvelope | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return isValidEnvelope(parsed) ? parsed : null
  } catch {
    return null
  }
}

function tryParseObject<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

/**
 * Load the save with recovery precedence: primary → backup → migrate-legacy → default.
 * A corrupted primary blob is preserved under `save:onet:corrupt:<ts>` (never silently discarded).
 * Always returns a migrated, current-version envelope.
 */
export function loadSave(storage?: StorageLike, now: number = Date.now()): LoadResult {
  const store = resolveStorage(storage)
  if (!store) {
    return { envelope: defaultEnvelope(), source: 'default', recovered: false, migratedFromLegacy: false }
  }

  const primaryRaw = store.getItem(SAVE_KEY)
  const primary = tryParseEnvelope(primaryRaw)
  if (primary) {
    return { envelope: runMigrations(primary), source: 'primary', recovered: false, migratedFromLegacy: false }
  }

  // Primary missing or corrupt.
  if (primaryRaw) {
    // Preserve the corrupt blob for forensics/recovery — never lose player data silently.
    try { store.setItem(`${SAVE_CORRUPT_PREFIX}${now}`, primaryRaw) } catch { /* storage full — best effort */ }
  }

  const backup = tryParseEnvelope(store.getItem(SAVE_BACKUP_KEY))
  if (backup) {
    return { envelope: runMigrations(backup), source: 'backup', recovered: true, migratedFromLegacy: false }
  }

  // No envelope at all — try the legacy monolithic player blob.
  const legacy = tryParseObject<LegacyPlayer>(store.getItem(LEGACY_PLAYER_KEY))
  if (legacy) {
    const legacySettings = tryParseObject<LegacySettings>(store.getItem(LEGACY_SETTINGS_KEY)) ?? {}
    const env = runMigrations(toEnvelope(legacy, legacySettings, now))
    return { envelope: env, source: 'legacy', recovered: !!primaryRaw, migratedFromLegacy: true }
  }

  return { envelope: defaultEnvelope(), source: 'default', recovered: !!primaryRaw, migratedFromLegacy: false }
}

/**
 * Persist an envelope, backing up the previous primary save first. Stamps version + savedAt.
 * Idempotent-friendly: writing the same logical state repeatedly is safe.
 */
export function writeSave(envelope: SaveEnvelope, storage?: StorageLike, now: number = Date.now()): void {
  const store = resolveStorage(storage)
  if (!store) return
  const existing = store.getItem(SAVE_KEY)
  if (existing) {
    try { store.setItem(SAVE_BACKUP_KEY, existing) } catch { /* best effort */ }
  }
  const toWrite: SaveEnvelope = { version: CURRENT_SAVE_VERSION, savedAt: now, slices: envelope.slices }
  store.setItem(SAVE_KEY, JSON.stringify(toWrite))
}

/**
 * One-time migration: if no envelope exists yet but a legacy `player` blob does, write an envelope
 * derived from it. Idempotent — does nothing if an envelope is already present.
 */
export function migrateLegacyIfNeeded(storage?: StorageLike, now: number = Date.now()): SaveEnvelope | null {
  const store = resolveStorage(storage)
  if (!store) return null
  if (tryParseEnvelope(store.getItem(SAVE_KEY))) return null // already migrated
  const legacy = tryParseObject<LegacyPlayer>(store.getItem(LEGACY_PLAYER_KEY))
  if (!legacy) return null
  const legacySettings = tryParseObject<LegacySettings>(store.getItem(LEGACY_SETTINGS_KEY)) ?? {}
  const env = runMigrations(toEnvelope(legacy, legacySettings, now))
  writeSave(env, store, now)
  return env
}
