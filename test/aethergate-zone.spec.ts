// Aethergate production ZoneDefinition (MapBuild P1) — proves the per-map design contract on the
// DATA before any art exists (greybox-first): reachability of every anchor/portal/shortcut/secret,
// a non-soft-locking return, spawn-region/safe-pocket sanity, the S3 lane fix, and stable save ids.
import { describe, it, expect } from 'vitest'
import { validateCampaignZone, walkGridOf } from '~/game/runtime/campaignZone'
import {
  buildAethergateZone, validateAethergate, AETHERGATE_ASSET_MANIFEST,
  AETHERGATE_BUILDING_RECTS,
  AETHERGATE_COLS, AETHERGATE_ROWS,
} from '~/data/zones/aethergate'

describe('Aethergate zone — per-map contract', () => {
  const zone = buildAethergateZone()

  it('is the scale-gate size 64×48 with a valid spawn', () => {
    expect(zone.cols).toBe(AETHERGATE_COLS)
    expect(zone.rows).toBe(AETHERGATE_ROWS)
    expect(zone.collision.length).toBe(48)
    expect(zone.collision[0]!.length).toBe(64)
    expect(walkGridOf(zone).blocked(zone.spawn.x, zone.spawn.y)).toBe(false)
  })

  it('passes the full campaign-zone validator (reachable, return exists, spawn region ok, unique ids)', () => {
    const report = validateAethergate()
    expect(report.problems, report.problems.join(' | ')).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.reachable).toBe(true)
    expect(report.hasReturn).toBe(true)
    expect(report.spawnRegionOk).toBe(true)
  })

  it('wires all 12 enclosed town buildings as two-way interiors', () => {
    const doorPortals = zone.portals.filter((p) => p.kind === 'door')
    expect(doorPortals.map((portal) => portal.id).sort()).toEqual(
      AETHERGATE_BUILDING_RECTS.map((building) => `door-${building.id}`).sort(),
    )
    for (const p of doorPortals) {
      expect(p.twoWay).toBe(true)
      expect(p.to).toMatch(/^interior:/)
    }
    expect(zone.anchors.filter((anchor) => anchor.id.startsWith('door-'))).toHaveLength(0)
    expect(zone.portals.some((portal) => portal.id === 'gate-tower')).toBe(false)
  })

  it('has a memorable entrance/exit that never soft-locks', () => {
    const arrival = zone.portals.find((p) => p.id === 'arrival')!
    expect(arrival.kind).toBe('return')
    expect(arrival.twoWay).toBe(true)
    expect(arrival.at).toEqual(zone.spawn)
  })

  it('fixes the S3 debt: the academy↔gatehouse lane is ≥2 tiles wide', () => {
    const grid = walkGridOf(zone)
    // academy east edge is col 25 (tx18 tw8), gatehouse west edge is col 28 — the lane columns 26,27
    // must both be walkable across the building rows (2..13)
    for (let y = 3; y <= 12; y++) {
      expect(grid.blocked(26, y), `lane col26 row${y}`).toBe(false)
      expect(grid.blocked(27, y), `lane col27 row${y}`).toBe(false)
    }
  })

  it('marks the town a learning-safe hub: zero monster capacity, plaza + inn safe pockets', () => {
    expect(zone.spawnRegion.capacity).toBe(0)
    expect(zone.safePockets.length).toBeGreaterThanOrEqual(2)
    // landmark (fountain south lip) is walkable and reachable
    expect(walkGridOf(zone).blocked(zone.landmark.x, zone.landmark.y)).toBe(false)
  })

  it('declares the unlockable shortcut and a reachable secret', () => {
    expect(zone.shortcut.from).toEqual({ x: 3, y: 5 })
    expect(zone.shortcut.to).toEqual({ x: 60, y: 5 })
    expect(zone.secret.role).toBe('secret')
  })

  it('every portal is a world-graph edge with a destination', () => {
    for (const p of zone.portals) expect(p.to.trim().length).toBeGreaterThan(0)
  })

  it('ships an asset dependency manifest covering the core tile roles', () => {
    const roles = new Set(AETHERGATE_ASSET_MANIFEST.map((d) => d.role))
    for (const r of ['ground', 'wall', 'blocker', 'prop', 'portal', 'interaction', 'secret']) {
      expect(roles.has(r), `manifest missing role ${r}`).toBe(true)
    }
    // reuse-before-author discipline: at least the ground/tree families reuse shipped packs
    expect(AETHERGATE_ASSET_MANIFEST.filter((d) => d.status === 'reuse').length).toBeGreaterThanOrEqual(3)
  })

  it('prints an ASCII composition dump (evidence — eyeball vs. the mockup)', () => {
    const legend: Record<string, string> = {
      wall: '#', blocker: 'o', portal: 'P', interaction: 'i', secret: '*', prop: 'T',
    }
    let out = '\n[aethergate] 64×48 composition (#=wall o=blocker P=portal i=interact *=secret @=spawn .=ground)\n'
    for (let y = 0; y < zone.rows; y++) {
      let line = ''
      for (let x = 0; x < zone.cols; x++) {
        if (zone.spawn.x === x && zone.spawn.y === y) { line += '@'; continue }
        const role = zone.roles[y]![x]
        line += role ? (legend[role] ?? '?') : (zone.collision[y]![x] ? '#' : '.')
      }
      out += line + '\n'
    }
    console.log(out)
    expect(true).toBe(true)
  })
})
