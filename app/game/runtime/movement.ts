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
//
// S4 (scale contract): diagonal is normalized (×√2/2) so walking speed is identical in every
// direction — closes S0 issue #4 (diagonal used to be √2× faster, unfair for routes/kiting).
// ================================================================================================
import { FIELD_SPEED, DIAGONAL_FACTOR } from '../scaleContract'

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

/** Walking speed in px/s — single source: scale contract (FIELD_SPEED). */
export const PLAYER_SPEED = FIELD_SPEED

export function resolveMovement(input: MovementInput, prevFacing: Facing, speed: number = PLAYER_SPEED): MovementResult {
  let vx = 0
  let vy = 0
  let moving = false
  let facing = prevFacing

  if (input.left) { vx = -speed; facing = 'left'; moving = true }
  else if (input.right) { vx = speed; facing = 'right'; moving = true }

  if (input.up) { vy = -speed; facing = 'up'; moving = true }
  else if (input.down) { vy = speed; facing = 'down'; moving = true }

  // S4: เดินทแยงระยะทาง/วินาทีเท่าเดินตรง (contract — เดิมเร็ว √2× ไม่แฟร์)
  if (vx !== 0 && vy !== 0) {
    vx *= DIAGONAL_FACTOR
    vy *= DIAGONAL_FACTOR
  }

  return { vx, vy, facing, moving }
}
