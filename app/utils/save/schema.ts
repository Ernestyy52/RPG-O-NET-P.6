// ================================================================================================
// SaveEnvelope schema (Phase 04, ADR 0001)
//
// A versioned container that splits the monolithic `player` store into independent domain slices.
// This module is the single source of truth for the persisted shape. It is introduced behind a
// feature flag (see saveManager) and does NOT replace the legacy `player` store yet — the legacy
// store remains authoritative until compatibility is proven.
// ================================================================================================
import type { HeroClassId } from '~/data/classes'
import type { EquipmentSlot } from '~/data/equipment'
import type { DailyQuest } from '~/data/quests'
import type { SubskillMastery } from '~/data/learning/mastery'
import { defaultLoadout } from '~/data/combat/classKits'
import { defaultSkillLoadout } from '~/data/combat/builds'

export type GenderId = 'male' | 'female'

/** Bump when the persisted shape changes; add a matching migration in migrations.ts.
 *  v1: initial envelope. v2: learning slice gains `mastery` + `lastSessionDate` (Phase 06).
 *  v3: character slice gains `kitLoadout` — the equipped class-kit ability ids (Phase 12).
 *  v4: inventory slice gains `sigils` + `socketedSigils` — sigil progression (Phase 13).
 *  v5: character slice gains `jobId` + `skillLoadout` — data-driven skills (Master Plan Phase 4).
 *  v6: session slice gains `restedExpPool` + `lastSeenAt` — rested bonus (Master Plan Phase 8).
 *  v7: character slice gains `statAlloc` — RO-inspired manual stat points (data/statAllocation.ts);
 *      zone-first PlayerLocation migration ที่จองไว้เดิมเลื่อนไปเป็น v8. */
export const CURRENT_SAVE_VERSION = 7

/** localStorage keys owned by the save system. */
export const SAVE_KEY = 'save:onet'
export const SAVE_BACKUP_KEY = 'save:onet:backup'
export const SAVE_CORRUPT_PREFIX = 'save:onet:corrupt:'
/** The pre-existing monolithic Pinia persist key (legacy source). */
export const LEGACY_PLAYER_KEY = 'player'

export interface ProfileSlice {
  isAuthenticated: boolean
  accountName: string
  characterCreated: boolean
  name: string
  gender: GenderId
  classId: HeroClassId
  appearance: { face: string; hair: string; color: string }
}

export interface CharacterSlice {
  level: number
  exp: number
  skillPoints: number
  learnedSkills: string[]
  /** equipped class-kit ability ids (Phase 12); defaults to the class's starter loadout. */
  kitLoadout: string[]
  /** advanced job ('' = none yet) — Master Plan Phase 4. */
  jobId: string
  /** equipped skill loadout (Master Plan Phase 4); defaults to the class's first preset build. */
  skillLoadout: { skills: string[]; ultimate: string; passives: string[] }
  /** manual stat points per attribute (v7 — RO-inspired allocation); empty = none spent yet. */
  statAlloc: Record<string, number>
}

/** Learning state is deliberately separate from combat power (ADR 0003). */
export interface LearningSlice {
  correctAnswers: number
  /** per-subskill spaced-review mastery (Phase 06). */
  mastery: Record<string, SubskillMastery>
  /** last day the learner studied (YYYY-MM-DD) — drives rested/catch-up, never a penalty. */
  lastSessionDate: string
}

export interface SessionSlice {
  currentFloor: number
  hp: number
  mp: number
  /** bonus combat EXP pool granted for time away — rested bonus, never a penalty (v6). */
  restedExpPool: number
  /** ms epoch of the last rewarded play moment — measures absence for rested accrual (v6). */
  lastSeenAt: number
}

export interface InventorySlice {
  gold: number
  gems: number
  inventory: Record<string, number>
  equipment: Partial<Record<EquipmentSlot, string>>
  /** owned sigils by id → count (Phase 13). */
  sigils: Record<string, number>
  /** sigils socketed per equipment slot (Phase 13). */
  socketedSigils: Partial<Record<EquipmentSlot, string[]>>
}

export interface QuestSlice {
  dailyDate: string
  dailyQuests: DailyQuest[]
  adventureLog: string[]
}

export interface SettingsSlice {
  sound: boolean
  reducedMotion: boolean
  language: string
}

export interface SaveSlices {
  profile: ProfileSlice
  character: CharacterSlice
  learning: LearningSlice
  session: SessionSlice
  inventory: InventorySlice
  quest: QuestSlice
  settings: SettingsSlice
}

export interface SaveEnvelope {
  version: number
  /** ms epoch of last write — used for backup provenance, never for gameplay. */
  savedAt: number
  slices: SaveSlices
}

export function defaultSlices(): SaveSlices {
  return {
    profile: {
      isAuthenticated: false,
      accountName: '',
      characterCreated: false,
      name: '',
      gender: 'male',
      classId: 'warrior',
      appearance: { face: 'calm', hair: 'short', color: 'amber' },
    },
    character: { level: 1, exp: 0, skillPoints: 0, learnedSkills: [], kitLoadout: defaultLoadout('warrior'), jobId: '', skillLoadout: defaultSkillLoadout('warrior'), statAlloc: {} },
    learning: { correctAnswers: 0, mastery: {}, lastSessionDate: '' },
    session: { currentFloor: 1, hp: 72, mp: 30, restedExpPool: 0, lastSeenAt: 0 },
    inventory: { gold: 90, gems: 0, inventory: { potion_s: 2 }, equipment: {}, sigils: {}, socketedSigils: {} },
    quest: { dailyDate: '', dailyQuests: [], adventureLog: [] },
    settings: { sound: true, reducedMotion: false, language: 'en' },
  }
}

export function defaultEnvelope(): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt: 0, slices: defaultSlices() }
}

/** Structural guard — true when `value` looks like a usable envelope with all slices present. */
export function isValidEnvelope(value: unknown): value is SaveEnvelope {
  if (!value || typeof value !== 'object') return false
  const env = value as Partial<SaveEnvelope>
  if (typeof env.version !== 'number' || !env.slices || typeof env.slices !== 'object') return false
  const required: (keyof SaveSlices)[] = ['profile', 'character', 'learning', 'session', 'inventory', 'quest', 'settings']
  return required.every((k) => (env.slices as Record<string, unknown>)[k] && typeof (env.slices as Record<string, unknown>)[k] === 'object')
}
