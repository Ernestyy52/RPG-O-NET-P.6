// S4 scale contract (app/game/scaleContract.ts) — the single production config from the passed
// scale gate. Locks: viewport picker (desktop 800×600 / mobile portrait 480×640), centered camera
// bounds for worlds smaller than the view, and the on-screen hero hard gate at both presets.
import { describe, it, expect } from 'vitest'
import {
  TILE_SIZE, HERO_VISUAL_H, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, TOWN_SPEED, FIELD_SPEED,
  DIAGONAL_FACTOR, DESKTOP_VIEWPORT, MOBILE_PORTRAIT_VIEWPORT, MOBILE_BREAKPOINT_PX,
  chooseViewport, centeredCameraBounds,
} from '~/game/scaleContract'
import { HERO_SRC_H } from '~/game/systems/heroFrames'

describe('scale contract — gate values locked', () => {
  it('carries the gate decision: TILE 32, hero 48, collider 18×12, speeds 130/120, √2/2', () => {
    expect(TILE_SIZE).toBe(32)
    expect(HERO_VISUAL_H).toBe(48)
    expect(PLAYER_BODY_WIDTH).toBe(18)
    expect(PLAYER_BODY_HEIGHT).toBe(12)
    expect(TOWN_SPEED).toBe(130)
    expect(FIELD_SPEED).toBe(120)
    expect(DIAGONAL_FACTOR).toBeCloseTo(Math.SQRT1_2, 10)
  })

  it('viewport picker: ≤560px container → portrait 480×640, else desktop 800×600', () => {
    expect(chooseViewport(390)).toEqual(MOBILE_PORTRAIT_VIEWPORT)
    expect(chooseViewport(MOBILE_BREAKPOINT_PX)).toEqual(MOBILE_PORTRAIT_VIEWPORT)
    expect(chooseViewport(MOBILE_BREAKPOINT_PX + 1)).toEqual(DESKTOP_VIEWPORT)
    expect(chooseViewport(1000)).toEqual(DESKTOP_VIEWPORT)
    expect(chooseViewport(0)).toEqual(DESKTOP_VIEWPORT) // unknown container → safe default
  })

  it('both presets keep the physical on-screen hero ≥28px at their smallest presentation', () => {
    // mobile 390px CSS width on the 480-wide viewport; desktop floor = 1024×768 container
    expect(HERO_VISUAL_H * (390 / MOBILE_PORTRAIT_VIEWPORT.width)).toBeGreaterThanOrEqual(28) // 39.0
    expect(HERO_VISUAL_H * (360 / MOBILE_PORTRAIT_VIEWPORT.width)).toBeGreaterThanOrEqual(28) // 36.0
    const desktopScale = Math.min(992 / DESKTOP_VIEWPORT.width, 768 / DESKTOP_VIEWPORT.height)
    expect(HERO_VISUAL_H * desktopScale).toBeGreaterThanOrEqual(28)
  })
})

describe('scale contract — centered camera bounds (S0 #2 letterbox fix)', () => {
  it('world bigger than view in both axes → plain 0,0 bounds (clamp as before)', () => {
    expect(centeredCameraBounds(2048, 1536, 800, 600)).toEqual({ x: 0, y: 0, width: 2048, height: 1536 })
  })

  it('world smaller than view → bounds expand symmetrically so the room sits centered', () => {
    // tower floor 768×576 inside desktop 800×600: 16px margin left/right, 12px top/bottom
    expect(centeredCameraBounds(768, 576, 800, 600)).toEqual({ x: -16, y: -12, width: 800, height: 600 })
    // small interior 448×320 inside portrait 480×640
    expect(centeredCameraBounds(448, 320, 480, 640)).toEqual({ x: -16, y: -160, width: 480, height: 640 })
  })

  it('mixed axes: only the smaller axis gets centered', () => {
    // legacy town 1199×608 on portrait 480×640: width clamps normally, height centers by 16
    expect(centeredCameraBounds(1199, 608, 480, 640)).toEqual({ x: 0, y: -16, width: 1199, height: 640 })
  })
})

describe('scale contract — single source of truth', () => {
  it('hero display height is an exact integer divisor of the 96px source (crisp cadence forever)', () => {
    expect(HERO_SRC_H / HERO_VISUAL_H).toBe(2) // 0.5× — the only even-cadence scale (S2 evidence)
  })
})
