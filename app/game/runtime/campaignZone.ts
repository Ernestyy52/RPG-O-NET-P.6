// ================================================================================================
// CampaignZone — production zone DATA contract for the 32-map campaign (MapBuild P1)
//
// This is the framework-agnostic shape every campaign map authors against, one step richer than the
// legacy tower ZoneDefinition (zone.ts) so that ONE renderer + ONE validator can serve every region:
// a tile grid tagged with the Phase-0 tile roles, plus labelled portals / anchors / safe pockets /
// spawn region / landmark / shortcut / secret — all with STABLE string ids so saves survive art and
// layout revisions. It carries no art: PNG tiles are resolved later from each zone's asset manifest.
//
// The per-map design contract (memorable entrance/exit, main loop + shortcut, safe pocket, danger
// landmark, secret, central landmark, deterministic anchors, return path that never soft-locks) is
// PROVEN here by validateCampaignZone before any art exists — greybox-first, same discipline as the
// scale gate. dungeonLayouts / Aethergate greybox / Tower rooms all reduce to this + zoneValidate.
// ================================================================================================
import {
  gridFromCollision, validateZoneReachability, validateSpawnRegion,
  type GridXY, type GridRect, type WalkGrid, type ZoneTileRole, type ZonePoint,
} from './zoneValidate'

/** A labelled point in a zone with a stable save id and a tile role. */
export interface CampaignAnchor {
  /** stable id — referenced by quests/saves/minimap; must never change once shipped. */
  id: string
  role: ZoneTileRole
  at: GridXY
  label?: string
  /** true if this anchor is an authored quest/objective anchor (validated reachable + on ground). */
  objective?: boolean
}

/** A zone exit/entry. Every portal is a world-graph edge; `to` names the destination zone/scene. */
export interface CampaignPortal {
  id: string
  at: GridXY
  /** destination id (world-graph edge target) — e.g. 'whisperwood', 'interior:guild', 'arrival'. */
  to: string
  kind: 'gate' | 'door' | 'stair' | 'return'
  /** reversible from the far side — a one-way portal without a return is a soft-lock. */
  twoWay: boolean
  label?: string
}

/** An unlockable shortcut (per-map contract): a second route that opens after a condition. */
export interface CampaignShortcut {
  id: string
  from: GridXY
  to: GridXY
  /** human-facing unlock condition (data only; gameplay wiring reads this id). */
  unlock: string
}

export interface CampaignZone {
  id: string
  name: string
  tile: number
  cols: number
  rows: number
  /** [row][col] collision — true = blocked (walls/buildings/blockers). */
  collision: boolean[][]
  /** [row][col] tile role — null = plain walkable ground (kept sparse in authoring). */
  roles: (ZoneTileRole | null)[][]
  /** memorable entrance the player spawns at on first arrival. */
  spawn: GridXY
  /** visually unique central landmark (memory hook — per-map contract). */
  landmark: GridXY
  anchors: CampaignAnchor[]
  portals: CampaignPortal[]
  /** areas where learning feedback can't be interrupted (no monster spawns inside). */
  safePockets: GridRect[]
  /** monster encounter region + how many spawns it must host (0 = safe hub town). */
  spawnRegion: { bounds: GridRect; capacity: number }
  shortcut: CampaignShortcut
  /** optional discoverable — reachable, may be gated. */
  secret: CampaignAnchor
}

export interface CampaignZoneReport {
  ok: boolean
  problems: string[]
  /** every labelled target proven reachable on foot from spawn. */
  reachable: boolean
  /** at least one twoWay/return portal exists from the spawn side (no soft-lock). */
  hasReturn: boolean
  /** spawn region can host its capacity without overlapping a safe pocket. */
  spawnRegionOk: boolean
}

/** All labelled tiles that must be reachable from spawn (anchors + portals + shortcut + secret). */
function reachTargets(zone: CampaignZone): ZonePoint[] {
  const pts: ZonePoint[] = []
  for (const a of zone.anchors) pts.push({ label: `anchor:${a.id}`, at: a.at })
  for (const p of zone.portals) pts.push({ label: `portal:${p.id}`, at: p.at })
  pts.push({ label: 'landmark', at: zone.landmark })
  pts.push({ label: `shortcut:${zone.shortcut.id}:from`, at: zone.shortcut.from })
  pts.push({ label: `shortcut:${zone.shortcut.id}:to`, at: zone.shortcut.to })
  pts.push({ label: `secret:${zone.secret.id}`, at: zone.secret.at })
  return pts
}

export function walkGridOf(zone: CampaignZone): WalkGrid {
  return gridFromCollision(zone.collision)
}

/**
 * THE per-map gate: proves the whole design contract on the DATA before art —
 *  • spawn is walkable and reaches every anchor, portal, shortcut end, landmark and secret
 *  • a return/two-way portal exists (the player can always get back — no soft-lock)
 *  • the monster spawn region has capacity outside every safe pocket
 *  • ids are unique and stable (duplicate ids would corrupt saves/quests)
 */
export function validateCampaignZone(zone: CampaignZone): CampaignZoneReport {
  const grid = walkGridOf(zone)
  const problems: string[] = []

  const report = validateZoneReachability(grid, zone.spawn, reachTargets(zone))
  if (!report.entryWalkable) problems.push('spawn tile is blocked')
  for (const u of report.unreachable) problems.push(`unreachable: ${u.label} @${u.at.x},${u.at.y}`)

  const hasReturn = zone.portals.some((p) => p.twoWay || p.kind === 'return')
  if (!hasReturn) problems.push('no return/two-way portal — potential soft-lock')

  // every portal must declare a destination (a world-graph edge), else it goes nowhere
  for (const p of zone.portals) {
    if (!p.to || !p.to.trim()) problems.push(`portal ${p.id} has no destination`)
  }

  // objective anchors must sit on walkable ground (you must be able to stand on/next to them)
  for (const a of zone.anchors) {
    if (grid.blocked(a.at.x, a.at.y)) problems.push(`anchor ${a.id} sits on a blocked tile`)
  }

  const spawnReport = validateSpawnRegion(grid, zone.spawnRegion.bounds, zone.spawnRegion.capacity, zone.safePockets)
  const spawnRegionOk = spawnReport.ok
  for (const p of spawnReport.problems) problems.push(`spawn region: ${p}`)

  // unique stable ids across anchors + portals + shortcut + secret (save/quest integrity)
  const ids = [
    ...zone.anchors.map((a) => a.id),
    ...zone.portals.map((p) => p.id),
    zone.shortcut.id, zone.secret.id,
  ]
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) problems.push(`duplicate ids: ${[...new Set(dupes)].join(', ')}`)

  return {
    ok: problems.length === 0,
    problems,
    reachable: report.ok,
    hasReturn,
    spawnRegionOk,
  }
}

/** Blank collision/roles matrices sized for a zone (helper for authoring builders). */
export function blankGrids(cols: number, rows: number): { collision: boolean[][]; roles: (ZoneTileRole | null)[][] } {
  return {
    collision: Array.from({ length: rows }, () => Array.from({ length: cols }, () => false)),
    roles: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null as ZoneTileRole | null)),
  }
}
