// ================================================================================================
// InteractionSystem — encounter gating (Phase 08)
//
// Pure predicates extracted from TowerScene.onEncounterMonster: whether an overlap may start a battle,
// and whether a networked monster is free to fight (instanced battle lock). Keeping these as pure
// functions means the encounter rules are testable and shared by the legacy scene and the future
// runtime without duplicating the conditions.
// ================================================================================================

export interface EncounterState {
  inBattle: boolean
  pendingBattle: boolean
  monsterActive: boolean
}

/** A battle may start only when idle, not already awaiting a grant, and the monster is still alive. */
export function canStartEncounter(state: EncounterState): boolean {
  return !state.inBattle && !state.pendingBattle && state.monsterActive
}

/**
 * A networked monster is fightable when it is unlocked, or already locked by me. Someone else's lock
 * blocks the encounter (server stays authoritative over who fights which instance).
 */
export function isNetMonsterFightable(lockedBy: string | undefined, mySession: string): boolean {
  const lock = lockedBy ?? ''
  return lock === '' || lock === mySession
}
