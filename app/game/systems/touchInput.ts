// ================================================================================================
// Shared on-screen touch/joystick input (mobile movement — release blocker per the scale-integration
// prompt). Pure module (no Phaser, no Vue): a TouchJoystick.vue writes the analog axis here, and every
// scene's movement read ORs `touchDirections()` into the SAME {left,right,up,down} object it already
// feeds `resolveMovement`. This changes nothing about physics — a joystick push is identical to holding
// the matching arrow key; diagonal normalization (√2/2) still happens downstream in resolveMovement.
// Keyboard and touch are additive, so a desktop tester with a touchscreen can use either.
// ================================================================================================

let axisX = 0 // -1 (left) .. 1 (right)
let axisY = 0 // -1 (up)   .. 1 (down)

/** Below this magnitude the stick reads as centred (no movement) — avoids drift/jitter at rest. */
const DEADZONE = 0.30
/** Per-axis threshold to convert the analog vector into 4-way booleans (keeps clean diagonals). */
const AXIS_ON = 0.38

export function setTouchAxis(x: number, y: number): void {
  axisX = x < -1 ? -1 : x > 1 ? 1 : x
  axisY = y < -1 ? -1 : y > 1 ? 1 : y
}

export function clearTouchAxis(): void {
  axisX = 0
  axisY = 0
}

export function getTouchAxis(): { x: number; y: number } {
  return { x: axisX, y: axisY }
}

export interface DirInput { left: boolean; right: boolean; up: boolean; down: boolean }

/** Current joystick state as 4-way directions (same shape the keyboard produces). */
export function touchDirections(): DirInput {
  if (Math.hypot(axisX, axisY) < DEADZONE) return { left: false, right: false, up: false, down: false }
  return {
    left: axisX < -AXIS_ON,
    right: axisX > AXIS_ON,
    up: axisY < -AXIS_ON,
    down: axisY > AXIS_ON,
  }
}

/** OR the live joystick directions into a keyboard-derived input (either source can drive a direction). */
export function mergeTouch(input: DirInput): DirInput {
  const t = touchDirections()
  return {
    left: input.left || t.left,
    right: input.right || t.right,
    up: input.up || t.up,
    down: input.down || t.down,
  }
}
