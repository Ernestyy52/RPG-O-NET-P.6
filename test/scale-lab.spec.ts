// Scale S1 greybox: every candidate profile must be soft-lock-free, and the route measurements
// (BFS shortest path × TILE / real town speed) must be produced for the decision table. This test
// PROVES structure; the human-feel pass happens in /dev/scale-lab.
import { describe, it, expect } from 'vitest'
import {
  SCALE_PROFILES, buildGreybox, measureRoutes, validateGreybox, ROUTE_TARGETS,
  HERO_PROFILES, rowCadence, classWidths, WIDTH_BAND_PX, VIEW_PRESETS, resolveViewport,
  heroOnScreenPx, INTERIOR_SPECS, buildInteriorGreybox, validateInteriorGreybox,
} from '~/game/runtime/scaleLab'
import { HERO_SRC_H } from '~/game/systems/heroFrames'

describe('scale lab — Aethergate greybox candidates', () => {
  for (const profile of SCALE_PROFILES) {
    it(`${profile.id} (${profile.label}): spawn reaches plaza, all 12 doors and waystones`, () => {
      const instance = buildGreybox(profile)
      const report = validateGreybox(instance)
      expect(report.entryWalkable).toBe(true)
      expect(report.unreachable, `unreachable in ${profile.id}: ${report.unreachable.map((u) => u.label).join(', ')}`)
        .toEqual([])
      // 12 buildings landed with real footprints (≥2×2 tiles each, none degenerate)
      expect(instance.buildings).toHaveLength(12)
      for (const b of instance.buildings) {
        expect(b.tw, `${b.id} width`).toBeGreaterThanOrEqual(2)
        expect(b.th, `${b.id} height`).toBeGreaterThanOrEqual(2)
      }
    })

    it(`${profile.id}: all measured routes resolve (no -1) and scale with the grid`, () => {
      const routes = measureRoutes(buildGreybox(profile))
      expect(routes).toHaveLength(Object.keys(ROUTE_TARGETS).length)
      for (const r of routes) {
        expect(r.tiles, r.route).toBeGreaterThan(0)
        expect(Number.isFinite(r.sec), r.route).toBe(true)
      }
    })
  }

  it('prints the routeSec decision table (evidence for MAP_SCALE_DECISION)', () => {
    for (const profile of SCALE_PROFILES) {
      const rows = measureRoutes(buildGreybox(profile)).map((r) => ({
        route: r.route, tiles: r.tiles, sec: r.sec,
        target: `${ROUTE_TARGETS[r.route][0]}–${ROUTE_TARGETS[r.route][1]}s`,
        inBand: r.sec >= ROUTE_TARGETS[r.route][0] && r.sec <= ROUTE_TARGETS[r.route][1] ? '✓' : '✗',
      }))
      // evidence table — transcribed into docs/MAP_SCALE_DECISION.md
      console.log(`\n[scale-lab] ${profile.id} ${profile.label} (${profile.cols * 32}×${profile.rows * 32}px @130px/s)`)
      console.table(rows)
    }
  })

  it('bigger profiles take longer on the same route (sanity of the measurement itself)', () => {
    const [m0, m1, m2] = SCALE_PROFILES.map((p) => measureRoutes(buildGreybox(p)))
    const sec = (rs: typeof m0, route: string) => rs.find((r) => r.route === route)!.sec
    expect(sec(m1, 'south-gate→plaza')).toBeGreaterThan(sec(m0, 'south-gate→plaza'))
    expect(sec(m2, 'south-gate→plaza')).toBeGreaterThan(sec(m1, 'south-gate→plaza'))
  })
})

describe('scale lab S3 — interior greyboxes + lane anchor', () => {
  for (const spec of INTERIOR_SPECS) {
    it(`${spec.id} interior: door reaches every anchor, door is 2 tiles wide`, () => {
      const inst = buildInteriorGreybox(spec)
      const report = validateInteriorGreybox(inst)
      expect(report.entryWalkable).toBe(true)
      expect(report.unreachable.map((u) => u.label)).toEqual([])
      const doorX = Math.floor(spec.cols / 2)
      expect(inst.collision[spec.rows - 1]![doorX]).toBe(false)
      expect(inst.collision[spec.rows - 1]![doorX + 1]).toBe(false)
    })
  }

  it('lane anchor lands in the building gap at every town profile (never punches a footprint)', () => {
    for (const profile of SCALE_PROFILES) {
      const inst = buildGreybox(profile)
      const lane = inst.points['lane']!
      for (const b of inst.buildings) {
        const insideX = lane.x >= b.tx && lane.x < b.tx + b.tw
        const insideY = lane.y >= b.ty && lane.y < b.ty + b.th
        expect(insideX && insideY, `${profile.id}: lane (${lane.x},${lane.y}) inside ${b.id}`).toBe(false)
      }
    }
  })
})

// ================================================================================================
// S2 — hero visual profiles + view presets. Pure math evidence for MAP_SCALE_DECISION §S2:
// pixel cadence of the 96px source at each display height, per-class width readability band,
// and the ≥28px physical on-screen hero hard gate per view preset/device.
// ================================================================================================
describe('scale lab S2 — hero pixel cadence (96px source, nearest neighbor)', () => {
  it('P0 48px (0.5×) has perfectly even row cadence — the crisp control', () => {
    const c = rowCadence(HERO_SRC_H, 48)
    expect(c.even).toBe(true)
    expect(c.gapKinds).toEqual([2])
    expect(c.dropped).toBe(HERO_SRC_H - 48)
  })

  it('P1 44px and P2 40px have UNEVEN cadence (mixed row gaps) → shimmer/distortion risk', () => {
    for (const displayH of [44, 40]) {
      const c = rowCadence(HERO_SRC_H, displayH)
      expect(c.even, `${displayH}px should be uneven`).toBe(false)
      expect(c.gapKinds, `${displayH}px gaps`).toEqual([2, 3])
    }
  })

  it('prints the cadence table (evidence)', () => {
    console.log('\n[scale-lab S2] row cadence of 96px hero source:')
    console.table(HERO_PROFILES.map((p) => {
      const c = rowCadence(HERO_SRC_H, p.displayH)
      return { profile: p.id, displayH: p.displayH, scale: (p.displayH / HERO_SRC_H).toFixed(4), gapKinds: c.gapKinds.join(','), even: c.even ? '✓' : '✗', droppedRows: c.dropped }
    }))
  })
})

describe('scale lab S2 — class width readability band (0.65–0.85 tile = 20.8–27.2px)', () => {
  it('P0 keeps every class/gender inside the band', () => {
    const out = classWidths(HERO_PROFILES[0]!).filter((r) => !r.inBand)
    expect(out.map((r) => r.classKey)).toEqual([])
  })

  it('P1 and P2 push narrow classes below the band (documented hard evidence)', () => {
    const p1Out = classWidths(HERO_PROFILES[1]!).filter((r) => !r.inBand)
    const p2Out = classWidths(HERO_PROFILES[2]!).filter((r) => !r.inBand)
    expect(p1Out.length, 'P1 out-of-band classes').toBeGreaterThanOrEqual(2) // warrior_female 19.7, archer_female 20.2
    expect(p2Out.length, 'P2 out-of-band classes').toBeGreaterThanOrEqual(5)
    console.log('\n[scale-lab S2] width band violations:',
      { band: WIDTH_BAND_PX.map((v) => v.toFixed(1)).join('–') },
      { P1: p1Out.map((r) => `${r.classKey}=${r.displayW}`), P2: p2Out.map((r) => `${r.classKey}=${r.displayW}`) })
  })
})

describe('scale lab S2 — physical on-screen hero size per view preset (hard gate ≥28px mobile)', () => {
  const V0 = VIEW_PRESETS.find((v) => v.id === 'V0')!
  const V1 = VIEW_PRESETS.find((v) => v.id === 'V1')!
  const MZ = VIEW_PRESETS.find((v) => v.id === 'MZ')!
  const MA = VIEW_PRESETS.find((v) => v.id === 'MA')!
  const mobile = { w: 390, h: 844 }

  it('current V0 on mobile: only P0 48px clears 28px; P1/P2 fail the hard gate', () => {
    expect(heroOnScreenPx(48, V0, mobile.w, mobile.h)).toBeGreaterThanOrEqual(28)
    expect(heroOnScreenPx(44, V0, mobile.w, mobile.h)).toBeLessThan(28)
    expect(heroOnScreenPx(40, V0, mobile.w, mobile.h)).toBeLessThan(28)
  })

  it('P3-adaptive mobile presets rescue readability without touching physics', () => {
    expect(heroOnScreenPx(48, MZ, mobile.w, mobile.h)).toBeGreaterThanOrEqual(34) // zoom 1.25 view-only
    expect(heroOnScreenPx(48, MA, mobile.w, mobile.h)).toBeGreaterThanOrEqual(38) // portrait viewport
    const ma = resolveViewport(MA, mobile.w, mobile.h)
    expect(ma.w).toBe(480)
    expect(ma.h).toBeGreaterThan(1000) // portrait internal viewport ≈480×1038 shows the street vertically
  })

  it('V1 (hero 48, 800×600) shows +25% world/axis and stays readable on desktop, but not mobile', () => {
    expect(heroOnScreenPx(48, V1, 1280, 800)).toBeGreaterThanOrEqual(28)
    expect(heroOnScreenPx(48, V1, mobile.w, mobile.h)).toBeLessThan(28)
  })

  it('prints the on-screen size matrix (evidence)', () => {
    const devices = [{ name: 'desktop 1280×800', w: 1280, h: 800 }, { name: 'mobile 390×844', w: 390, h: 844 }]
    for (const d of devices) {
      console.log(`\n[scale-lab S2] on-screen hero px @ ${d.name} (gate ≥28):`)
      console.table(VIEW_PRESETS.map((v) => {
        const row: Record<string, string | number> = { view: `${v.id} ${v.label}` }
        for (const hp of HERO_PROFILES) {
          const px = heroOnScreenPx(hp.displayH, v, d.w, d.h)
          row[hp.id] = `${px}${px >= 28 ? '✓' : '✗'}`
        }
        return row
      }))
    }
  })
})
