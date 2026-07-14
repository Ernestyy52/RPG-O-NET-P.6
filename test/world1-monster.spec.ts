import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { WORLD_THEMES } from '~/data/monsterThemes'

// ================================================================================================
// Phase 14 Inc 4 — the new World-1 (verdant) monster is registered AND its sprite exists on disk,
// so preloadFloorMonsters (which loads mob-sprites/mca/<slug>.png for every theme monster) won't 404.
// ================================================================================================

describe('World-1 verdant monster — forest_lizard', () => {
  const verdant = WORLD_THEMES.find((t) => t.id === 'verdant')!

  it('is listed in the verdant theme', () => {
    expect(verdant.monsters).toContain('forest_lizard')
  })

  it('every verdant monster slug has a mob sprite on disk (no 404 at preload)', () => {
    for (const slug of verdant.monsters) {
      const p = resolve(process.cwd(), 'public/mob-sprites/mca', `${slug}.png`)
      expect(existsSync(p), `missing sprite for ${slug}`).toBe(true)
    }
  })
})
