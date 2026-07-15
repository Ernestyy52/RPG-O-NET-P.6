// ================================================================================================
// Town interiors — data integrity: every building has a real room spec, every sprite exists on
// disk (subpath-safe relative paths), positions stay in-bounds, the exit door stays clear, and
// the NPCs that moved indoors are real catalog NPCs (Kael keeps his portal post outside).
// ================================================================================================
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  TOWN_INTERIORS_ENABLED, TOWN_INTERIORS, interiorForEvent, getInterior,
  INTERIOR_NPC_IDS, INTERIOR_TOWN_DOORS,
} from '~/data/town/interiors'
import { TOWN_NPCS, getTownNpc } from '~/data/world1/npcs'

const PUBLIC = resolve(__dirname, '../public')

describe('town interiors — spec integrity', () => {
  it('flag is on and all four service buildings have interiors', () => {
    expect(TOWN_INTERIORS_ENABLED).toBe(true)
    expect(TOWN_INTERIORS.map((s) => s.id).sort()).toEqual(['equipment-shop', 'guild', 'hospital', 'item-shop'])
    for (const event of ['town:guild', 'town:item-shop', 'town:equipment-shop', 'town:hospital']) {
      expect(interiorForEvent(event)?.event).toBe(event)
    }
  })

  it('every prop sprite exists on disk with a subpath-safe relative path', () => {
    for (const spec of TOWN_INTERIORS) {
      for (const prop of spec.props) {
        if (!prop.sprite) continue // generated textures (interior_bed) have no file by design
        expect(prop.sprite.startsWith('/'), `${spec.id}/${prop.key} leading slash`).toBe(false)
        expect(existsSync(resolve(PUBLIC, prop.sprite)), `${spec.id}: missing ${prop.sprite}`).toBe(true)
      }
    }
  })

  it('every interior NPC is a real catalog NPC with an existing sprite — and Kael stays outside', () => {
    for (const spec of TOWN_INTERIORS) {
      const npc = getTownNpc(spec.npc.id)
      expect(npc, `${spec.id} npc ${spec.npc.id}`).toBeDefined()
      expect(existsSync(resolve(PUBLIC, npc!.sprite)), npc!.sprite).toBe(true)
      expect(spec.npc.dialogueTh.length).toBeGreaterThanOrEqual(2)
    }
    expect(INTERIOR_NPC_IDS.has('portal_guardian')).toBe(false)
    for (const id of INTERIOR_NPC_IDS) expect(TOWN_NPCS.some((n) => n.id === id), id).toBe(true)
  })

  it('positions stay inside the room and the bottom-center door stays clear of solid props', () => {
    for (const spec of TOWN_INTERIORS) {
      const { w, h } = spec.tiles
      const doorX = w / 2
      const check = (at: [number, number], label: string) => {
        expect(at[0], `${spec.id} ${label} x`).toBeGreaterThan(0)
        expect(at[0], `${spec.id} ${label} x`).toBeLessThan(w)
        expect(at[1], `${spec.id} ${label} y`).toBeGreaterThan(0)
        expect(at[1], `${spec.id} ${label} y`).toBeLessThan(h)
      }
      check(spec.npc.at, 'npc')
      for (const prop of spec.props) {
        check(prop.at, prop.key)
        if (prop.solid) {
          const nearDoor = Math.abs(prop.at[0] - doorX) < 2 && prop.at[1] > h - 3
          expect(nearDoor, `${spec.id}: ${prop.key} blocks the door`).toBe(false)
        }
      }
      // NPC ไม่ยืนทับแนวประตูเช่นกัน (ทางเข้า-ออกลื่นเสมอ)
      expect(Math.abs(spec.npc.at[1] - h) > 3, `${spec.id} npc too close to door row`).toBe(true)
    }
  })

  it('every interior has a town-door return position', () => {
    for (const spec of TOWN_INTERIORS) {
      const door = INTERIOR_TOWN_DOORS[spec.id]
      expect(door, spec.id).toBeDefined()
      expect(door[0]).toBeGreaterThan(0)
      expect(door[1]).toBeGreaterThan(0)
    }
    expect(getInterior('guild')?.id).toBe('guild')
  })
})
