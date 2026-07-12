// ================================================================================================
// Migration registry (Phase 04, ADR 0001)
//
// Ordered, idempotent migrations that step a SaveEnvelope from its stored version up to
// CURRENT_SAVE_VERSION. Rules: each migration is pure and idempotent when re-applied to an
// already-current envelope (runMigrations is a no-op at CURRENT_SAVE_VERSION). Unknown/missing
// fields are filled from defaults so partial saves never throw.
//
// To add a future migration: bump CURRENT_SAVE_VERSION in schema.ts and append a { from, to,
// migrate } entry here. Never mutate the input; always return a new envelope.
// ================================================================================================
import {
  CURRENT_SAVE_VERSION, defaultSlices, type SaveEnvelope, type SaveSlices,
} from './schema'
import { defaultLoadout } from '~/data/combat/classKits'
import type { HeroClassId } from '~/data/classes'

export interface Migration {
  from: number
  to: number
  migrate: (env: SaveEnvelope) => SaveEnvelope
}

/** Fill any missing slice / slice-field from defaults without overwriting present values. */
export function mergeSliceDefaults(slices: Partial<SaveSlices> | undefined): SaveSlices {
  const d = defaultSlices()
  const src = (slices ?? {}) as Record<string, Record<string, unknown>>
  const out = {} as Record<string, Record<string, unknown>>
  for (const key of Object.keys(d) as (keyof SaveSlices)[]) {
    out[key] = { ...(d[key] as Record<string, unknown>), ...(src[key] ?? {}) }
  }
  return out as unknown as SaveSlices
}

export const MIGRATIONS: Migration[] = [
  // v0 (unversioned / pre-envelope) → v1: normalize slice shape and stamp the version.
  {
    from: 0,
    to: 1,
    migrate: (env) => ({
      version: 1,
      savedAt: env.savedAt ?? 0,
      slices: mergeSliceDefaults(env.slices),
    }),
  },
  // v1 → v2 (Phase 06): learning slice gains `mastery` + `lastSessionDate`. Existing learning data
  // (correctAnswers) is preserved; new fields default empty. mergeSliceDefaults fills them safely.
  {
    from: 1,
    to: 2,
    migrate: (env) => ({
      version: 2,
      savedAt: env.savedAt ?? 0,
      slices: mergeSliceDefaults(env.slices),
    }),
  },
  // v2 → v3 (Phase 12): character slice gains `kitLoadout`. When absent, default it to the SAVE's own
  // class starter kit (not the generic warrior default), so an existing mage/archer keeps its identity.
  // Idempotent: a save that already carries a kitLoadout is preserved untouched.
  {
    from: 2,
    to: 3,
    migrate: (env) => {
      const hadKit = Array.isArray(env.slices?.character?.kitLoadout) && env.slices.character.kitLoadout.length > 0
      const slices = mergeSliceDefaults(env.slices)
      if (!hadKit) {
        slices.character.kitLoadout = defaultLoadout((slices.profile.classId ?? 'warrior') as HeroClassId)
      }
      return { version: 3, savedAt: env.savedAt ?? 0, slices }
    },
  },
  // v3 → v4 (Phase 13): inventory slice gains `sigils` + `socketedSigils`. Both default empty and are
  // filled by mergeSliceDefaults; existing inventory (gold/gems/items/equipment) is preserved.
  {
    from: 3,
    to: 4,
    migrate: (env) => ({
      version: 4,
      savedAt: env.savedAt ?? 0,
      slices: mergeSliceDefaults(env.slices),
    }),
  },
]

/**
 * Step `env` up to CURRENT_SAVE_VERSION using the registry. Idempotent: an envelope already at the
 * current version is returned unchanged. If a version gap has no registered migration, the envelope
 * is safely normalized to current (defaults-merged) rather than left in an unusable state.
 */
export function runMigrations(input: SaveEnvelope): SaveEnvelope {
  let env: SaveEnvelope = input
  let guard = 0
  while (env.version < CURRENT_SAVE_VERSION) {
    if (guard++ > 100) break // defensive: never loop forever on a malformed registry
    const step = MIGRATIONS.find((m) => m.from === env.version)
    if (!step) {
      // No path from here — normalize and jump to current so the save stays loadable.
      env = { version: CURRENT_SAVE_VERSION, savedAt: env.savedAt ?? 0, slices: mergeSliceDefaults(env.slices) }
      break
    }
    env = step.migrate(env)
  }
  // Guarantee all slices/fields exist even when already at current version.
  return { version: env.version, savedAt: env.savedAt ?? 0, slices: mergeSliceDefaults(env.slices) }
}

/** True when the envelope is at the newest version and needs no migration. */
export function isCurrent(env: SaveEnvelope): boolean {
  return env.version === CURRENT_SAVE_VERSION
}
