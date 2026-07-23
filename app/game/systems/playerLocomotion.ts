import Phaser from 'phaser'
import { resolveMovement, type Facing, type MovementResult } from '../runtime/movement'
import { buildNavigationPath, movementToPoint, smoothVelocity, type NavigationRect } from '../runtime/locomotion'
import { mergeTouch } from './touchInput'
import { playSfx } from './bgm'

type WalkKeys = { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key }

/** Shared arrows/WASD/joystick + obstacle-aware click-to-walk locomotion. */
export class PlayerLocomotion {
  private readonly keys?: WalkKeys
  private destination?: Phaser.Math.Vector2
  private waypoints: Phaser.Math.Vector2[] = []
  private marker?: Phaser.GameObjects.Arc
  private sampleAt = 0
  private nextFootstepAt = 0
  private samplePosition = new Phaser.Math.Vector2()
  private readonly onPointerDown: (pointer: Phaser.Input.Pointer) => void

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly speed: number,
    private readonly obstacles?: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.keys = scene.input.keyboard?.addKeys({ left: 'A', right: 'D', up: 'W', down: 'S' }) as WalkKeys | undefined
    this.onPointerDown = (pointer) => {
      if (pointer.button !== 0 || !this.player.active) return
      const point = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2
      const bounds = this.scene.physics.world.bounds
      const requested = {
        x: Phaser.Math.Clamp(Math.round(point.x), bounds.left + 10, bounds.right - 10),
        y: Phaser.Math.Clamp(Math.round(point.y), bounds.top + 8, bounds.bottom - 8),
      }
      const blockers = this.navigationBlockers()
      const route = blockers.length
        ? buildNavigationPath(this.player, requested, bounds, blockers)
        : [requested]
      if (!route.length) { this.clearDestination(); return }
      this.waypoints = route.map((waypoint) => new Phaser.Math.Vector2(waypoint.x, waypoint.y))
      this.destination = this.waypoints.shift()
      this.sampleAt = this.scene.time.now
      this.samplePosition.set(this.player.x, this.player.y)
      this.showMarker(route[route.length - 1]!)
    }
    scene.input.on('pointerdown', this.onPointerDown)
    scene.events.once('shutdown', () => this.destroy())
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, previousFacing: Facing, deltaMs: number): MovementResult {
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    if (!this.player.active || !body?.enable) {
      return { vx: 0, vy: 0, facing: previousFacing, moving: false }
    }
    const manual = mergeTouch({
      left: !!cursors.left?.isDown || !!this.keys?.left.isDown,
      right: !!cursors.right?.isDown || !!this.keys?.right.isDown,
      up: !!cursors.up?.isDown || !!this.keys?.up.isDown,
      down: !!cursors.down?.isDown || !!this.keys?.down.isDown,
    })
    const manualTarget = resolveMovement(manual, previousFacing, this.speed)
    let desired: MovementResult = manualTarget

    if (manualTarget.moving) {
      this.clearDestination()
    } else if (this.destination) {
      let clickTarget = movementToPoint(this.player, this.destination, previousFacing, this.speed)
      while (clickTarget.arrived && this.waypoints.length) {
        this.destination = this.waypoints.shift()
        clickTarget = movementToPoint(this.player, this.destination!, clickTarget.facing, this.speed)
      }
      desired = clickTarget
      if (clickTarget.arrived) this.clearDestination()
      else this.cancelIfStalled()
    }

    const eased = smoothVelocity({ vx: body.velocity.x, vy: body.velocity.y }, desired, deltaMs, this.speed)
    const moving = Math.hypot(eased.vx, eased.vy) > 7
    if (moving && this.scene.time.now >= this.nextFootstepAt) {
      playSfx(this.scene, 'footstep', 0.92 + Math.random() * 0.16)
      this.nextFootstepAt = this.scene.time.now + 285
    }
    return { vx: eased.vx, vy: eased.vy, facing: desired.facing, moving }
  }

  stopImmediate(): void {
    this.clearDestination()
    if (this.player.active && this.player.body)
      this.player.setVelocity(0, 0)
  }

  private navigationBlockers(): NavigationRect[] {
    if (!this.obstacles) return []
    const blockers: NavigationRect[] = []
    for (const child of this.obstacles.getChildren()) {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody | undefined
      if (!body?.enable || body.width <= 0 || body.height <= 0) continue
      blockers.push({ x: body.x, y: body.y, w: body.width, h: body.height })
    }
    return blockers
  }

  private cancelIfStalled(): void {
    if (!this.destination || this.scene.time.now - this.sampleAt < 320) return
    const moved = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.samplePosition.x, this.samplePosition.y)
    this.sampleAt = this.scene.time.now
    this.samplePosition.set(this.player.x, this.player.y)
    if (moved < 1.5) this.clearDestination()
  }

  private showMarker(point: { x: number; y: number }): void {
    this.marker?.destroy()
    this.marker = this.scene.add.circle(point.x, point.y, 7, 0xffe2a8, 0.12)
      .setStrokeStyle(1, 0xffe2a8, 0.85)
      .setDepth(point.y - 2)
  }

  private clearDestination(): void {
    this.destination = undefined
    this.waypoints = []
    this.marker?.destroy()
    this.marker = undefined
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown)
    this.clearDestination()
  }
}
