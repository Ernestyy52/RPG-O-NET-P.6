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

/** Rollback flag: keep false until a rendered scene runs on ZoneRuntime and passes the World 1 gate. */
export const NEW_ZONE_RUNTIME_ENABLED = false

export * from './lifecycle'
export * from './movement'
export * from './zone'
export * from './spawn'
export * from './encounter'
export * from './zoneRuntime'
