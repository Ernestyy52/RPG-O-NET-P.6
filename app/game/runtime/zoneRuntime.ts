// ================================================================================================
// ZoneRuntime (Phase 08)
//
// Orchestrates a zone's lifetime through a SceneLifecycle so entering and exiting repeatedly leaks no
// listener or timer (Phase 08 gate). Systems register their timers and event subscriptions via a
// RuntimeHost port that returns a Disposer for each; `enter()` opens a fresh lifecycle and registers
// them, `exit()` disposes it. The port keeps this class free of Phaser/Vue so the enter/exit contract
// is unit-testable against a fake host.
//
// This is the runtime SCAFFOLD: the legacy TowerScene remains the active renderer and is unaffected
// (rollback). Wiring a rendered scene onto this runtime happens later (behind NEW_ZONE_RUNTIME_ENABLED).
// ================================================================================================
import { SceneLifecycle, type Disposer } from './lifecycle'

/** Abstraction over the host scene: creating timers and subscribing to game events, each undoable. */
export interface RuntimeHost {
  /** Schedule a timer; returns a Disposer that cancels it. */
  addTimer(delayMs: number, loop: boolean, cb: () => void): Disposer
  /** Subscribe to a game event; returns a Disposer that unsubscribes. */
  onGameEvent(type: string, handler: (payload: unknown) => void): Disposer
}

export interface ZoneRuntimeCallbacks {
  /** offline respawn tick (top up monsters to the target count). */
  onRespawnTick?: () => void
  /** wander tick (randomize local monster movement). */
  onWanderTick?: () => void
  onBattleEnd?: (payload: unknown) => void
  onBossEnter?: (payload: unknown) => void
}

/** Respawn/wander cadences (legacy TowerScene timer delays, ms). */
export const RESPAWN_INTERVAL_MS = 10000
export const WANDER_INTERVAL_MS = 1400

export class ZoneRuntime {
  private lifecycle: SceneLifecycle | null = null
  private active = false

  constructor(private readonly host: RuntimeHost, private readonly callbacks: ZoneRuntimeCallbacks = {}) {}

  get isActive(): boolean {
    return this.active
  }

  /** Number of live registrations held open by the current entry (0 when exited). For leak assertions. */
  get liveRegistrations(): number {
    return this.lifecycle?.size ?? 0
  }

  /** Open the zone: register timers + event listeners into a fresh lifecycle. Idempotent while active. */
  enter(): void {
    if (this.active) return
    this.active = true
    const lc = new SceneLifecycle()
    this.lifecycle = lc
    lc.add(this.host.addTimer(RESPAWN_INTERVAL_MS, true, () => this.callbacks.onRespawnTick?.()))
    lc.add(this.host.addTimer(WANDER_INTERVAL_MS, true, () => this.callbacks.onWanderTick?.()))
    lc.add(this.host.onGameEvent('battle:end', (p) => this.callbacks.onBattleEnd?.(p)))
    lc.add(this.host.onGameEvent('boss:enter', (p) => this.callbacks.onBossEnter?.(p)))
  }

  /** Close the zone: dispose every registration. Idempotent — safe to call when already exited. */
  exit(): void {
    if (!this.active) return
    this.active = false
    this.lifecycle?.dispose()
    this.lifecycle = null
  }
}
