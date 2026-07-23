import { describe, expect, it } from 'vitest'
import {
  PLAYER_DEPTH_BASE,
  playerAuraDepth,
  playerRenderDepth,
  playerShadowDepth,
} from '~/game/runtime/renderDepth'

describe('local player render priority', () => {
  it('keeps the hero above scenery and weather depth bands', () => {
    expect(playerRenderDepth(0)).toBe(PLAYER_DEPTH_BASE)
    expect(playerRenderDepth(1536)).toBeGreaterThan(9000)
  })

  it('keeps aura and shadow below the hero without leaving the protected band', () => {
    const hero = playerRenderDepth(320)
    expect(playerAuraDepth(320)).toBeLessThan(playerShadowDepth(320))
    expect(playerShadowDepth(320)).toBeLessThan(hero)
    expect(playerAuraDepth(320)).toBeGreaterThan(9000)
  })
})
