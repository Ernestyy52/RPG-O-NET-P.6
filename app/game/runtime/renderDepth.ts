/**
 * Rendering priority for the local hero.
 *
 * World props continue to use Y sorting in their normal 0..world-height band.
 * The local player owns a dedicated band above scenery, monsters and weather,
 * while fixed UI remains above it at 100_000+.
 */
export const PLAYER_DEPTH_BASE = 50_000

export function playerRenderDepth(y: number): number {
  return PLAYER_DEPTH_BASE + Math.round(y * 10) / 10
}

export function playerShadowDepth(y: number): number {
  return playerRenderDepth(y) - 2
}

export function playerAuraDepth(y: number): number {
  return playerRenderDepth(y) - 3
}

