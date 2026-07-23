import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  TOWN_INTERIORS_ENABLED, TOWN_INTERIORS, allInteriorNpcs, interiorForEvent, getInterior,
  INTERIOR_NPC_IDS, INTERIOR_TOWN_DOORS,
} from '~/data/town/interiors'
import { TOWN_NPCS, getTownNpc } from '~/data/world1/npcs'

const PUBLIC = resolve(__dirname, '../public')
const EXTERIOR_IDS = [
  'bank', 'crystal-shrine', 'equipment-shop', 'festival-hall', 'gatehouse', 'guild', 'hospital',
  'inn', 'item-shop', 'library', 'stable', 'tailor', 'town-hall',
]

describe('town interiors — full World 1 contract', () => {
  it('wires every enclosed Aethergate building plus the Guild Academy 2F', () => {
    expect(TOWN_INTERIORS_ENABLED).toBe(true)
    expect(TOWN_INTERIORS.map((spec) => spec.id).sort()).toEqual([...EXTERIOR_IDS, 'guild-academy'].sort())
    for (const event of [
      'town:guild', 'town:item-shop', 'town:equipment-shop', 'town:hospital', 'town:library',
      'town:town-hall', 'town:crystal-shrine', 'town:festival-hall', 'town:tailor', 'town:inn',
      'town:stable', 'town:bank', 'town:gatehouse',
    ]) expect(interiorForEvent(event)?.event).toBe(event)
  })

  it('ships every referenced prop sprite at a subpath-safe path', () => {
    for (const spec of TOWN_INTERIORS) {
      for (const prop of spec.props) {
        if (!prop.sprite) continue
        expect(prop.sprite.startsWith('/'), `${spec.id}/${prop.key}`).toBe(false)
        expect(existsSync(resolve(PUBLIC, prop.sprite)), `${spec.id}: missing ${prop.sprite}`).toBe(true)
      }
    }
  })

  it('gives every room a real named NPC and gives Academy 2F five tutors', () => {
    for (const spec of TOWN_INTERIORS) {
      for (const npcSpec of allInteriorNpcs(spec)) {
        const npc = getTownNpc(npcSpec.id)
        expect(npc, `${spec.id}/${npcSpec.id}`).toBeDefined()
        expect(existsSync(resolve(PUBLIC, npc!.sprite)), npc!.sprite).toBe(true)
        expect(npcSpec.dialogueTh.length).toBeGreaterThanOrEqual(2)
        expect(npcSpec.service, `${spec.id}/${npcSpec.id} service`).toBeTruthy()
      }
    }
    expect(allInteriorNpcs(getInterior('guild-academy')!)).toHaveLength(5)
    expect(INTERIOR_NPC_IDS.has('portal_guardian')).toBe(true)
    for (const id of INTERIOR_NPC_IDS) expect(TOWN_NPCS.some((npc) => npc.id === id), id).toBe(true)
  })

  it('keeps NPCs, transitions and props inside each room', () => {
    for (const spec of TOWN_INTERIORS) {
      const { w, h } = spec.tiles
      const check = (at: [number, number], label: string) => {
        expect(at[0], `${spec.id}/${label}/x`).toBeGreaterThan(0)
        expect(at[0], `${spec.id}/${label}/x`).toBeLessThan(w)
        expect(at[1], `${spec.id}/${label}/y`).toBeGreaterThan(0)
        expect(at[1], `${spec.id}/${label}/y`).toBeLessThan(h)
      }
      for (const npc of allInteriorNpcs(spec)) check(npc.at, npc.id)
      for (const prop of spec.props) check(prop.at, prop.key)
      for (const transition of spec.transitions ?? []) {
        expect(transition.at[0]).toBeGreaterThan(0)
        expect(transition.at[0]).toBeLessThan(spec.art.width)
        expect(transition.at[1]).toBeGreaterThan(0)
        expect(transition.at[1]).toBeLessThan(spec.art.height)
        expect(getInterior(transition.target)).toBeDefined()
      }
    }
  })

  it('returns exterior rooms below their own town door and Academy 2F only to Guild 1F', () => {
    for (const id of EXTERIOR_IDS) {
      const door = INTERIOR_TOWN_DOORS[id as keyof typeof INTERIOR_TOWN_DOORS]
      expect(door, id).toBeDefined()
      expect(door![0]).toBeGreaterThan(0)
      expect(door![1]).toBeGreaterThan(0)
    }
    expect(INTERIOR_TOWN_DOORS['guild-academy']).toBeUndefined()
    expect(getInterior('guild-academy')?.exitTarget?.building).toBe('guild')
  })
})

