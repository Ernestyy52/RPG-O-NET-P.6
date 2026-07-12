// ================================================================================================
// SceneLifecycle (Phase 08)
//
// The teardown backbone of the zone runtime. Every listener, timer, tween, or arbitrary resource a
// system creates registers a Disposer here; `dispose()` runs them all exactly once (reverse order,
// error-isolated). This is what makes the runtime safe to enter/exit repeatedly with no listener or
// timer leak (Phase 08 gate) — a system never has to remember to unwind its own registrations by hand.
//
// Framework-agnostic: no Phaser/Vue import, so it is unit-testable in Node.
// ================================================================================================

/** A zero-arg cleanup function. Registering one hands ownership of the teardown to the lifecycle. */
export type Disposer = () => void

export class SceneLifecycle {
  private disposers: Disposer[] = []
  private disposed = false

  /** Register a teardown function. No-op registration is refused after disposal (returns the input). */
  add(disposer: Disposer): Disposer {
    if (this.disposed) {
      // Registering after teardown would leak — run it immediately instead of stashing it.
      disposer()
      return disposer
    }
    this.disposers.push(disposer)
    return disposer
  }

  /** Register several disposers at once. */
  addAll(disposers: Disposer[]): void {
    for (const d of disposers) this.add(d)
  }

  /** Number of live (not-yet-disposed) registrations — primarily for leak assertions in tests. */
  get size(): number {
    return this.disposers.length
  }

  get isDisposed(): boolean {
    return this.disposed
  }

  /**
   * Run every registered disposer once, most-recent first, then clear. Idempotent: a second call does
   * nothing. Individual disposer errors are swallowed so one bad teardown cannot strand the rest.
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (let i = this.disposers.length - 1; i >= 0; i--) {
      try { this.disposers[i]() } catch { /* one failing teardown must not block the others */ }
    }
    this.disposers = []
  }
}
