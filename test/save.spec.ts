import { describe, it, expect } from 'vitest'
import {
  SAVE_KEY, SAVE_BACKUP_KEY, SAVE_CORRUPT_PREFIX, LEGACY_PLAYER_KEY,
  CURRENT_SAVE_VERSION, defaultEnvelope, isValidEnvelope, type SaveEnvelope,
} from '~/utils/save/schema'
import { toEnvelope, toSlices, toLegacyPlayer, type LegacyPlayer } from '~/utils/save/legacyAdapter'
import { runMigrations, mergeSliceDefaults } from '~/utils/save/migrations'
import { loadSave, writeSave, migrateLegacyIfNeeded, type StorageLike } from '~/utils/save/saveManager'
import { defaultLoadout } from '~/data/combat/classKits'

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  keys() { return [...this.m.keys()] }
}

const sampleLegacy: LegacyPlayer = {
  isAuthenticated: true, accountName: 'Ada', characterCreated: true, name: 'Ada', gender: 'female',
  classId: 'mage', appearance: { face: 'sharp', hair: 'long', color: 'teal' },
  level: 7, exp: 42, gold: 355, gems: 3, currentFloor: 23, hp: 40, mp: 25, skillPoints: 2,
  learnedSkills: ['mage_attack_1', 'mage_attack_2'], inventory: { potion_s: 4, slime_gel: 9 },
  equipment: { weapon: 'staff_t2_rare' }, correctAnswers: 88,
  adventureLog: ['Defeated the Sand Wyrm.'], dailyDate: '2026-07-12',
  dailyQuests: [{ id: 'q1', kind: 'answer', label: 'x', target: 5, progress: 5, reward: { gold: 10, gems: 0, exp: 6 }, claimed: false }],
}

describe('save — legacy adapter round-trip', () => {
  it('maps a monolithic player into slices and back losslessly', () => {
    const slices = toSlices(sampleLegacy, { sound: false, reducedMotion: true, language: 'th' })
    const back = toLegacyPlayer(slices)
    // spot-check every domain landed in the right slice
    expect(slices.profile.classId).toBe('mage')
    expect(slices.character.level).toBe(7)
    expect(slices.learning.correctAnswers).toBe(88)
    expect(slices.session.currentFloor).toBe(23)
    expect(slices.inventory.gold).toBe(355)
    expect(slices.inventory.equipment.weapon).toBe('staff_t2_rare')
    expect(slices.quest.dailyDate).toBe('2026-07-12')
    expect(slices.settings.language).toBe('th')
    // round-trip reproduces the legacy fields the store hydrates from
    expect(back.name).toBe('Ada')
    expect(back.learnedSkills).toEqual(['mage_attack_1', 'mage_attack_2'])
    expect(back.inventory).toEqual({ potion_s: 4, slime_gel: 9 })
    expect(back.correctAnswers).toBe(88)
  })

  it('tolerates a partial/empty legacy save by filling defaults', () => {
    const slices = toSlices({}, {})
    expect(slices.character.level).toBe(1)
    expect(slices.inventory.gold).toBe(90)
    expect(slices.inventory.inventory).toEqual({ potion_s: 2 })
  })
})

describe('save — migrations are idempotent', () => {
  it('re-running migrations on a current envelope is a no-op', () => {
    const env = toEnvelope(sampleLegacy)
    expect(env.version).toBe(CURRENT_SAVE_VERSION)
    const once = runMigrations(env)
    const twice = runMigrations(once)
    expect(once.slices).toEqual(twice.slices)
    expect(twice.version).toBe(CURRENT_SAVE_VERSION)
  })

  it('upgrades a v0 (unversioned) envelope to the current version', () => {
    const v0 = { version: 0, savedAt: 0, slices: mergeSliceDefaults(undefined) } as SaveEnvelope
    const migrated = runMigrations(v0)
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(isValidEnvelope(migrated)).toBe(true)
  })

  it('normalizes an unknown future-gap version to current without throwing', () => {
    const weird = { version: 0.5, savedAt: 0, slices: {} } as unknown as SaveEnvelope
    const migrated = runMigrations(weird)
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(isValidEnvelope(migrated)).toBe(true)
  })
})

describe('save — v2 → v3 adds class-kit loadout (Phase 12)', () => {
  /** Build a version-2 envelope (no character.kitLoadout) for the given class. */
  function v2Envelope(classId: string): SaveEnvelope {
    const slices = toSlices({ ...sampleLegacy, classId })
    delete (slices.character as unknown as Record<string, unknown>).kitLoadout
    return { version: 2, savedAt: 0, slices } as SaveEnvelope
  }

  it('defaults kitLoadout to the SAVE\'s own class kit', () => {
    const migrated = runMigrations(v2Envelope('mage'))
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.slices.character.kitLoadout).toEqual(defaultLoadout('mage'))
  })

  it('is idempotent and preserves an existing custom loadout', () => {
    const migrated = runMigrations(v2Envelope('archer'))
    const again = runMigrations(migrated)
    expect(again.slices).toEqual(migrated.slices)

    const custom = v2Envelope('mage')
    custom.slices.character.kitLoadout = ['warrior_power_strike']
    const kept = runMigrations(custom)
    expect(kept.slices.character.kitLoadout).toEqual(['warrior_power_strike'])
  })

  it('legacy migration seeds kitLoadout from the class', () => {
    const env = toEnvelope({ ...sampleLegacy, classId: 'guardian' })
    expect(env.slices.character.kitLoadout).toEqual(defaultLoadout('guardian'))
  })
})

describe('save — v3 → v4 adds sigil inventory (Phase 13)', () => {
  it('adds empty sigils + socketedSigils while preserving inventory', () => {
    const slices = toSlices({ ...sampleLegacy })
    delete (slices.inventory as unknown as Record<string, unknown>).sigils
    delete (slices.inventory as unknown as Record<string, unknown>).socketedSigils
    const v3 = { version: 3, savedAt: 0, slices } as SaveEnvelope
    const migrated = runMigrations(v3)
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.slices.inventory.sigils).toEqual({})
    expect(migrated.slices.inventory.socketedSigils).toEqual({})
    expect(migrated.slices.inventory.gold).toBe(sampleLegacy.gold) // preserved
    // idempotent
    expect(runMigrations(migrated).slices).toEqual(migrated.slices)
  })
})

describe('save — v5 → v6 adds rested-bonus state (Master Plan Phase 8)', () => {
  it('adds zeroed restedExpPool + lastSeenAt while preserving session state', () => {
    const slices = toSlices({ ...sampleLegacy })
    delete (slices.session as unknown as Record<string, unknown>).restedExpPool
    delete (slices.session as unknown as Record<string, unknown>).lastSeenAt
    const v5 = { version: 5, savedAt: 0, slices } as SaveEnvelope
    const migrated = runMigrations(v5)
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.slices.session.restedExpPool).toBe(0)
    expect(migrated.slices.session.lastSeenAt).toBe(0)
    expect(migrated.slices.session.currentFloor).toBe(sampleLegacy.currentFloor) // preserved
    expect(migrated.slices.session.hp).toBe(sampleLegacy.hp)
    // idempotent
    expect(runMigrations(migrated).slices).toEqual(migrated.slices)
  })

  it('preserves an existing pool through migration and the legacy round-trip', () => {
    const withPool = toSlices({ ...sampleLegacy, restedExpPool: 44, lastSeenAt: 1_752_700_000_000 })
    expect(withPool.session.restedExpPool).toBe(44)
    const back = toLegacyPlayer(withPool)
    expect(back.restedExpPool).toBe(44)
    expect(back.lastSeenAt).toBe(1_752_700_000_000)
  })
})

describe('save — v6 → v7 adds manual stat allocation (RO-feel)', () => {
  it('adds empty statAlloc while preserving character state', () => {
    const slices = toSlices({ ...sampleLegacy })
    delete (slices.character as unknown as Record<string, unknown>).statAlloc
    const v6 = { version: 6, savedAt: 0, slices } as SaveEnvelope
    const migrated = runMigrations(v6)
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.slices.character.statAlloc).toEqual({})
    expect(migrated.slices.character.level).toBe(sampleLegacy.level) // preserved
    expect(migrated.slices.character.learnedSkills).toEqual(sampleLegacy.learnedSkills)
    // idempotent
    expect(runMigrations(migrated).slices).toEqual(migrated.slices)
  })

  it('preserves allocated points through migration and the legacy round-trip', () => {
    const withAlloc = toSlices({ ...sampleLegacy, statAlloc: { vit: 4, atk: 2 } })
    expect(withAlloc.character.statAlloc).toEqual({ vit: 4, atk: 2 })
    const back = toLegacyPlayer(withAlloc)
    expect(back.statAlloc).toEqual({ vit: 4, atk: 2 })
  })
})

describe('save — load precedence & corruption recovery', () => {
  it('reads a valid primary envelope', () => {
    const s = new MemoryStorage()
    writeSave(toEnvelope(sampleLegacy), s)
    const res = loadSave(s)
    expect(res.source).toBe('primary')
    expect(res.recovered).toBe(false)
    expect(res.envelope.slices.profile.name).toBe('Ada')
  })

  it('recovers from a corrupt primary using the backup, preserving the corrupt blob', () => {
    const s = new MemoryStorage()
    const good = JSON.stringify(toEnvelope(sampleLegacy))
    s.setItem(SAVE_BACKUP_KEY, good)
    s.setItem(SAVE_KEY, '{ this is : not json ')
    const res = loadSave(s, 12345)
    expect(res.source).toBe('backup')
    expect(res.recovered).toBe(true)
    expect(res.envelope.slices.profile.name).toBe('Ada')
    // corrupt blob preserved, not discarded
    expect(s.getItem(`${SAVE_CORRUPT_PREFIX}12345`)).toBe('{ this is : not json ')
  })

  it('migrates a legacy player blob when no envelope exists', () => {
    const s = new MemoryStorage()
    s.setItem(LEGACY_PLAYER_KEY, JSON.stringify(sampleLegacy))
    const res = loadSave(s)
    expect(res.source).toBe('legacy')
    expect(res.migratedFromLegacy).toBe(true)
    expect(res.envelope.slices.character.level).toBe(7)
  })

  it('falls back to a fresh default when nothing is present', () => {
    const res = loadSave(new MemoryStorage())
    expect(res.source).toBe('default')
    expect(res.envelope).toEqual(expect.objectContaining({ version: CURRENT_SAVE_VERSION }))
  })
})

describe('save — write backs up the previous save', () => {
  it('moves the prior primary into the backup slot before overwriting', () => {
    const s = new MemoryStorage()
    writeSave(toEnvelope({ ...sampleLegacy, gold: 100 }), s)
    writeSave(toEnvelope({ ...sampleLegacy, gold: 200 }), s)
    const primary = JSON.parse(s.getItem(SAVE_KEY)!) as SaveEnvelope
    const backup = JSON.parse(s.getItem(SAVE_BACKUP_KEY)!) as SaveEnvelope
    expect(primary.slices.inventory.gold).toBe(200)
    expect(backup.slices.inventory.gold).toBe(100)
  })
})

describe('save — legacy migration is one-time / idempotent', () => {
  it('writes an envelope from legacy once and does not overwrite it on re-run', () => {
    const s = new MemoryStorage()
    s.setItem(LEGACY_PLAYER_KEY, JSON.stringify(sampleLegacy))
    const first = migrateLegacyIfNeeded(s)
    expect(first).not.toBeNull()
    expect(isValidEnvelope(JSON.parse(s.getItem(SAVE_KEY)!))).toBe(true)
    // mutate the envelope, then re-run: migration must NOT clobber the existing save
    const edited = loadSave(s).envelope
    edited.slices.inventory.gold = 9999
    writeSave(edited, s)
    const second = migrateLegacyIfNeeded(s)
    expect(second).toBeNull()
    expect(loadSave(s).envelope.slices.inventory.gold).toBe(9999)
  })
})
