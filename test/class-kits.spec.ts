import { describe, it, expect } from 'vitest'
import {
  CLASS_KITS, getClassKit, kitAbility, defaultLoadout, kitProfile, kitAbilityDamage,
  kitSlotMapping, heroDamage,
} from '~/data/combat'
import type { HeroClassId } from '~/data/classes'

// ================================================================================================
// Phase 12 — class kits: identity obvious, no mandatory best path, no useless solo class,
// save-facing loadout defaults. (Save migration itself is covered in save.spec.ts.)
// ================================================================================================

const CLASSES: HeroClassId[] = ['warrior', 'mage', 'archer', 'guardian']

describe('class kits — structure & loadout defaults', () => {
  it('each class has a signature and a 3-ability kit with unique ids', () => {
    const allIds: string[] = []
    for (const c of CLASSES) {
      const kit = getClassKit(c)
      expect(kit.signature.trim().length).toBeGreaterThan(10)
      expect(kit.abilities.length).toBe(3)
      for (const a of kit.abilities) {
        expect(a.classId).toBe(c)
        allIds.push(a.id)
      }
    }
    expect(new Set(allIds).size).toBe(allIds.length) // all 12 ability ids unique
  })

  it('defaultLoadout returns exactly the class kit ability ids', () => {
    for (const c of CLASSES) {
      expect(defaultLoadout(c)).toEqual(getClassKit(c).abilities.map((a) => a.id))
      for (const id of defaultLoadout(c)) expect(kitAbility(id)?.classId).toBe(c)
    }
  })
})

describe('class kits — identity is obvious (distinct axis leaders)', () => {
  const profiles = Object.fromEntries(CLASSES.map((c) => [c, kitProfile(c)])) as Record<HeroClassId, ReturnType<typeof kitProfile>>
  const leaderOf = (axis: 'dps' | 'mitigation' | 'sustain') =>
    CLASSES.reduce((best, c) => (profiles[c][axis] > profiles[best][axis] ? c : best), CLASSES[0])

  it('each combat axis is led by a different class', () => {
    const leaders = { dps: leaderOf('dps'), mitigation: leaderOf('mitigation'), sustain: leaderOf('sustain') }
    expect(new Set(Object.values(leaders)).size).toBe(3) // three distinct specialists
    // sanity: the intended specialists
    expect(leaders.dps).toBe('archer')
    expect(leaders.mitigation).toBe('guardian')
    expect(leaders.sustain).toBe('mage')
  })
})

describe('class kits — no mandatory best path', () => {
  const profiles = Object.fromEntries(CLASSES.map((c) => [c, kitProfile(c)])) as Record<HeroClassId, ReturnType<typeof kitProfile>>

  it('no class leads more than one axis', () => {
    const axes = ['dps', 'mitigation', 'sustain'] as const
    const leadCount: Record<string, number> = {}
    for (const axis of axes) {
      const leader = CLASSES.reduce((b, c) => (profiles[c][axis] > profiles[b][axis] ? c : b), CLASSES[0])
      leadCount[leader] = (leadCount[leader] ?? 0) + 1
    }
    expect(Math.max(...Object.values(leadCount))).toBe(1)
  })

  it('total kit value stays within a tight parity band', () => {
    const axes = ['dps', 'mitigation', 'sustain'] as const
    const max = Object.fromEntries(axes.map((a) => [a, Math.max(...CLASSES.map((c) => profiles[c][a]))]))
    const totals = CLASSES.map((c) => axes.reduce((s, a) => s + profiles[c][a] / max[a], 0))
    expect(Math.max(...totals) / Math.min(...totals)).toBeLessThan(1.4)
  })
})

describe('class kits — no useless solo class', () => {
  it('every kit can both deal damage and survive (mitigation or sustain)', () => {
    for (const c of CLASSES) {
      const p = kitProfile(c)
      expect(p.dps).toBeGreaterThan(0)
      expect(p.mitigation + p.sustain).toBeGreaterThan(0)
      // and structurally: a strike ability + a defensive/support ability
      const kinds = getClassKit(c).abilities.map((a) => a.kind)
      expect(kinds.includes('strike')).toBe(true)
      expect(kinds.some((k) => k === 'guard' || k === 'heal' || k === 'counter' || k === 'rally')).toBe(true)
    }
  })
})

describe('class kits — real-time HUD slot mapping (flip #5, dormant)', () => {
  const SLOTS = ['attack', 'counter', 'support'] as const

  it('every class fills all three slots from three DISTINCT kit abilities', () => {
    for (const c of CLASSES) {
      const map = kitSlotMapping(c)
      const ids = SLOTS.map((s) => map[s].id)
      for (const s of SLOTS) expect(map[s]).toBeDefined()
      expect(new Set(ids).size).toBe(3) // no slot reuses another slot's ability
      // and each mapped ability actually belongs to this class's kit
      for (const s of SLOTS) expect(map[s].classId).toBe(c)
    }
  })

  it('the attack slot is always the class strike (its damage identity)', () => {
    for (const c of CLASSES) {
      const attack = kitSlotMapping(c).attack
      expect(attack.kind).toBe('strike')
      expect(attack.damageMultiplier).toBeGreaterThan(0)
    }
  })

  it('the counter slot is a defensive/retaliation ability (counter or guard)', () => {
    for (const c of CLASSES) {
      expect(['counter', 'guard']).toContain(kitSlotMapping(c).counter.kind)
    }
  })

  it('the support slot is a sustain-or-utility ability (heal/rally/guard)', () => {
    for (const c of CLASSES) {
      expect(['heal', 'rally', 'guard']).toContain(kitSlotMapping(c).support.kind)
    }
  })

  it('guardian (no heal/rally) uses Retribution and Fortress — no ability dropped', () => {
    const map = kitSlotMapping('guardian')
    expect(map.attack.id).toBe('guardian_shield_bash')
    expect(map.counter.id).toBe('guardian_retribution')
    expect(map.support.id).toBe('guardian_fortress')
    // all three of the guardian kit's abilities are represented
    const kitIds = getClassKit('guardian').abilities.map((a) => a.id).sort()
    expect(SLOTS.map((s) => map[s].id).sort()).toEqual(kitIds)
  })

  it('is deterministic', () => {
    for (const c of CLASSES) expect(kitSlotMapping(c)).toEqual(kitSlotMapping(c))
  })
})

describe('class kits — damage reuses the domain formula', () => {
  it('kitAbilityDamage equals heroDamage with the ability multiplier', () => {
    const bolt = CLASS_KITS.mage.abilities.find((a) => a.kind === 'strike')!
    expect(kitAbilityDamage(bolt, 20, 12)).toBe(heroDamage(20, 12, bolt.damageMultiplier!, 1))
    const guard = CLASS_KITS.warrior.abilities.find((a) => a.kind === 'guard')!
    expect(kitAbilityDamage(guard, 20, 12)).toBe(0) // non-damaging ability ⇒ 0
  })
})
