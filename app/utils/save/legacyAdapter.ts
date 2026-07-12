// ================================================================================================
// Legacy adapter (Phase 04, ADR 0001)
//
// Bridges the monolithic Pinia `player` blob (localStorage key `player`) to/from SaveEnvelope slices.
// `toEnvelope` is used to migrate an existing save into the new versioned shape; `toLegacy` reproduces
// the exact monolithic object so the existing Pinia store can hydrate unchanged (compatibility path).
// Both are total and tolerant of missing fields (fills from defaults), so partial saves never throw.
// ================================================================================================
import {
  CURRENT_SAVE_VERSION, defaultSlices, type SaveEnvelope, type SaveSlices, type SettingsSlice,
} from './schema'
import { defaultLoadout } from '~/data/combat/classKits'
import type { HeroClassId } from '~/data/classes'

/** Shape of the pre-Phase-04 monolithic player store (all optional for partial-save tolerance). */
export interface LegacyPlayer {
  isAuthenticated?: boolean
  accountName?: string
  characterCreated?: boolean
  name?: string
  gender?: 'male' | 'female'
  classId?: string
  appearance?: { face?: string; hair?: string; color?: string }
  level?: number
  exp?: number
  gold?: number
  gems?: number
  currentFloor?: number
  hp?: number
  mp?: number
  skillPoints?: number
  learnedSkills?: string[]
  inventory?: Record<string, number>
  equipment?: Record<string, string>
  correctAnswers?: number
  adventureLog?: string[]
  dailyDate?: string
  dailyQuests?: unknown[]
}

export interface LegacySettings {
  sound?: boolean
  reducedMotion?: boolean
  language?: string
}

function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined || value === null ? fallback : value
}

/** Monolithic player (+ optional settings) → versioned slices. */
export function toSlices(legacy: LegacyPlayer = {}, settings: LegacySettings = {}): SaveSlices {
  const d = defaultSlices()
  return {
    profile: {
      isAuthenticated: pick(legacy.isAuthenticated, d.profile.isAuthenticated),
      accountName: pick(legacy.accountName, d.profile.accountName),
      characterCreated: pick(legacy.characterCreated, d.profile.characterCreated),
      name: pick(legacy.name, d.profile.name),
      gender: pick(legacy.gender, d.profile.gender),
      classId: pick(legacy.classId, d.profile.classId) as SaveSlices['profile']['classId'],
      appearance: {
        face: pick(legacy.appearance?.face, d.profile.appearance.face),
        hair: pick(legacy.appearance?.hair, d.profile.appearance.hair),
        color: pick(legacy.appearance?.color, d.profile.appearance.color),
      },
    },
    character: {
      level: pick(legacy.level, d.character.level),
      exp: pick(legacy.exp, d.character.exp),
      skillPoints: pick(legacy.skillPoints, d.character.skillPoints),
      learnedSkills: pick(legacy.learnedSkills, d.character.learnedSkills),
      // Kits did not exist pre-Phase-12 — start with the class's default loadout.
      kitLoadout: defaultLoadout(pick(legacy.classId, d.profile.classId) as HeroClassId),
    },
    learning: {
      correctAnswers: pick(legacy.correctAnswers, d.learning.correctAnswers),
      // Mastery/session-date did not exist pre-Phase-06; default them (populated at runtime later).
      mastery: d.learning.mastery,
      lastSessionDate: d.learning.lastSessionDate,
    },
    session: {
      currentFloor: pick(legacy.currentFloor, d.session.currentFloor),
      hp: pick(legacy.hp, d.session.hp),
      mp: pick(legacy.mp, d.session.mp),
    },
    inventory: {
      gold: pick(legacy.gold, d.inventory.gold),
      gems: pick(legacy.gems, d.inventory.gems),
      inventory: pick(legacy.inventory, d.inventory.inventory),
      equipment: pick(legacy.equipment, d.inventory.equipment) as SaveSlices['inventory']['equipment'],
      // Sigils did not exist pre-Phase-13 — start empty.
      sigils: d.inventory.sigils,
      socketedSigils: d.inventory.socketedSigils,
    },
    quest: {
      dailyDate: pick(legacy.dailyDate, d.quest.dailyDate),
      dailyQuests: pick(legacy.dailyQuests, d.quest.dailyQuests) as SaveSlices['quest']['dailyQuests'],
      adventureLog: pick(legacy.adventureLog, d.quest.adventureLog),
    },
    settings: {
      sound: pick(settings.sound, d.settings.sound),
      reducedMotion: pick(settings.reducedMotion, d.settings.reducedMotion),
      language: pick(settings.language, d.settings.language),
    },
  }
}

/** Monolithic player (+ optional settings) → full envelope at the current version. */
export function toEnvelope(legacy: LegacyPlayer = {}, settings: LegacySettings = {}, savedAt = Date.now()): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt, slices: toSlices(legacy, settings) }
}

/** Slices → the monolithic player object the existing Pinia store expects (inverse of toSlices). */
export function toLegacyPlayer(slices: SaveSlices): Required<Omit<LegacyPlayer, 'equipment'>> & { equipment: Record<string, string> } {
  return {
    isAuthenticated: slices.profile.isAuthenticated,
    accountName: slices.profile.accountName,
    characterCreated: slices.profile.characterCreated,
    name: slices.profile.name,
    gender: slices.profile.gender,
    classId: slices.profile.classId,
    appearance: { ...slices.profile.appearance },
    level: slices.character.level,
    exp: slices.character.exp,
    skillPoints: slices.character.skillPoints,
    learnedSkills: [...slices.character.learnedSkills],
    correctAnswers: slices.learning.correctAnswers,
    currentFloor: slices.session.currentFloor,
    hp: slices.session.hp,
    mp: slices.session.mp,
    gold: slices.inventory.gold,
    gems: slices.inventory.gems,
    inventory: { ...slices.inventory.inventory },
    equipment: { ...(slices.inventory.equipment as Record<string, string>) },
    adventureLog: [...slices.quest.adventureLog],
    dailyDate: slices.quest.dailyDate,
    dailyQuests: [...slices.quest.dailyQuests],
  }
}

/** Slices → the settings object the settings store expects. */
export function toLegacySettings(slices: SaveSlices): SettingsSlice {
  return { ...slices.settings }
}
