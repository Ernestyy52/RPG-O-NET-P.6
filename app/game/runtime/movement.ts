// ================================================================================================
// PlayerController movement (Phase 08)
//
// Pure input→velocity resolution extracted from TowerScene.update. Given the four directional inputs
// and the previous facing, it returns the velocity vector, the new facing, and whether the player is
// moving — no Phaser import, so it is unit-testable. The scene applies the result to the sprite.
//
// Faithful to the legacy rules: horizontal keys resolve with left priority, vertical with up
// priority, and a pressed vertical key wins the facing over a horizontal one (matching the two
// independent if/else-if blocks in the original update loop).
// ================================================================================================

export type Facing = 'down' | 'left' | 'right' | 'up'

export interface MovementInput {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export interface MovementResult {
  vx: number
  vy: number
  facing: Facing
  moving: boolean
}

/** Walking speed in px/s (legacy TowerScene constant). */
export const PLAYER_SPEED = 120

export function resolveMovement(input: MovementInput, prevFacing: Facing, speed: number = PLAYER_SPEED): MovementResult {
  let vx = 0
  let vy = 0
  let moving = false
  let facing = prevFacing

  if (input.left) { vx = -speed; facing = 'left'; moving = true }
  else if (input.right) { vx = speed; facing = 'right'; moving = true }

  if (input.up) { vy = -speed; facing = 'up'; moving = true }
  else if (input.down) { vy = speed; facing = 'down'; moving = true }

  return { vx, vy, facing, moving }
}
