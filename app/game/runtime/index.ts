// ================================================================================================
// Zone runtime barrel (Phase 08)
//
// Public surface of the modular Phaser zone runtime — pure systems (movement, spawn, encounter guard,
// zone layout) plus the SceneLifecycle teardown backbone and the ZoneRuntime orchestrator.
//
// FEATURE FLAG: NEW_ZONE_RUNTIME_ENABLED gates whether a rendered scene is driven by ZoneRuntime.
// It is false and dormant — the legacy TowerScene stays the active renderer and rollback path (Phase
// 08 gate: "TowerScene legacy remains; no full world rebuild yet"). The pure systems below are already
// consumed by TowerScene as the single source of truth for movement/spawn/encounter rules.
// ================================================================================================

/**
 * Phase 14 Inc 3b: ENABLED. Its only functional reader is the TowerScene dungeon-entry door, which is
 * itself gated to World-1 dungeon floors (5, 10) via WORLD1_DUNGEON_FLOORS — so this flip adds the
 * dungeon entrances on floors 5/10 and changes nothing on any other floor. Rollback = set back to false
 * (doors vanish, DungeonScene unreachable). Kept as the independent revert lever per the flag-flip plan.
 */
export const NEW_ZONE_RUNTIME_ENABLED = true

export * from './lifecycle'
export * from './movement'
export * from './zone'
export * from './spawn'
export * from './encounter'
export * from './zoneRuntime'
export * from './dungeonLayouts'
