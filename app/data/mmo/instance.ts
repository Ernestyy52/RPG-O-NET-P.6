// ================================================================================================
// MMORPG instance lifecycle (Phases 19–24)
//
// A DETERMINISTIC instance/zone lifecycle state machine so server-hosted instances spin up, accept
// players, drain, and close predictably (gate: "deterministic instance lifecycle"). Pure reducer — same
// state + event ⇒ same next state; terminal `closed` never re-opens; no join after draining. Framework-
// agnostic so it's unit-testable without any server runtime.
// ================================================================================================

export type InstancePhase = 'creating' | 'active' | 'draining' | 'closed'

export interface InstanceState {
  id: string
  phase: InstancePhase
  players: string[]
  createdAt: number
  /** epoch ms the instance entered `draining` (for a grace timeout ⇒ close). */
  drainingSince?: number
}

export type InstanceEvent =
  | { type: 'ready' }
  | { type: 'join'; playerId: string }
  | { type: 'leave'; playerId: string }
  | { type: 'drain'; now: number }
  | { type: 'tick'; now: number }

/** Grace period (ms) an empty draining instance waits before closing. */
export const INSTANCE_DRAIN_GRACE_MS = 30_000

export function createInstance(id: string, now: number): InstanceState {
  return { id, phase: 'creating', players: [], createdAt: now }
}

/**
 * Advance the instance by one event. Deterministic + total (unknown/ill-timed events are no-ops). Rules:
 *  • creating → active on `ready`.
 *  • join only in `active` (never while draining/closed) — no player enters an instance being torn down.
 *  • leave removes a player in any non-closed phase; a draining instance that empties will close on tick.
 *  • drain → draining (from active); closed is terminal.
 *  • tick closes a draining instance once it's empty OR the drain grace has elapsed.
 */
export function advanceInstance(state: InstanceState, event: InstanceEvent): InstanceState {
  if (state.phase === 'closed') return state // terminal — never re-opens

  switch (event.type) {
    case 'ready':
      return state.phase === 'creating' ? { ...state, phase: 'active' } : state

    case 'join':
      if (state.phase !== 'active' || state.players.includes(event.playerId)) return state
      return { ...state, players: [...state.players, event.playerId] }

    case 'leave':
      if (!state.players.includes(event.playerId)) return state
      return { ...state, players: state.players.filter((p) => p !== event.playerId) }

    case 'drain':
      return state.phase === 'active' ? { ...state, phase: 'draining', drainingSince: event.now } : state

    case 'tick': {
      if (state.phase !== 'draining') return state
      const graceElapsed = state.drainingSince !== undefined && event.now - state.drainingSince >= INSTANCE_DRAIN_GRACE_MS
      if (state.players.length === 0 || graceElapsed) return { ...state, phase: 'closed', players: [] }
      return state
    }
  }
}

/** True when the instance accepts new players (only `active`). */
export function instanceAcceptsJoins(state: InstanceState): boolean {
  return state.phase === 'active'
}
