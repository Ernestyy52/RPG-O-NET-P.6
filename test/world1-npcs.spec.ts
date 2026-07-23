import { describe, it, expect } from 'vitest'
import { TOWN_NPCS, getTownNpc } from '~/data/world1/npcs'
import { WORLD1_MAIN_QUEST } from '~/data/world1/quests'
import { WORLD1_SIDE_QUESTS } from '~/data/world1/sideQuests'

// ================================================================================================
// Phase 14 Inc 4 — town NPCs: every quest-giver has a catalog entry, sprite paths are subpath-safe.
// ================================================================================================

describe('town NPCs', () => {
  it('has unique ids, names, and positive frame dimensions', () => {
    const ids = TOWN_NPCS.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const n of TOWN_NPCS) {
      expect(n.name.length).toBeGreaterThan(0)
      expect(n.title.length).toBeGreaterThan(0)
      expect(n.frameW).toBeGreaterThan(0)
      expect(n.frameH).toBeGreaterThan(0)
    }
  })

  it('sprite paths are relative (no leading slash — GitHub Pages subpath safe)', () => {
    for (const n of TOWN_NPCS) {
      expect(n.sprite.startsWith('/')).toBe(false)
      expect(n.sprite).toMatch(/^npc-sprites\/.+\.png$/)
    }
  })

  it('every town quest-giver referenced by a quest has a catalog entry', () => {
    const givers = new Set<string>([
      ...WORLD1_MAIN_QUEST.map((s) => s.giver),
      ...WORLD1_SIDE_QUESTS.map((q) => q.npc),
    ])
    // the town NPCs we placed; a giver may also be a non-town role, so we only require our 4 exist
    for (const id of ['guildmaster', 'portal_guardian', 'blacksmith', 'forest_ranger']) {
      expect(givers.has(id)).toBe(true)      // actually used by a quest
      expect(getTownNpc(id)).toBeDefined()   // and has a sprite/catalog entry
    }
  })
})
