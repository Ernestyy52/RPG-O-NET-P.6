// ================================================================================================
// Aethergate Town — production ZoneDefinition data (MapBuild P1, Region 1 map 1)
//
// Tile layout traced from docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png
// at the scale-gate size M1 = 64×48 tiles (2048×1536 px @ TILE 32). These are the SAME building
// positions the S1 greybox proved reachable + route-timed; here they are frozen as production tile
// rects (no dependency on the dev scale-lab module), with the S3 debts fixed:
//   • academy↔gatehouse lane widened to ≥2 tiles (was 1)
//   • central fountain kept as a blocker; the memorable landmark tile sits walkable at its south lip
//
// This module carries DATA + an asset dependency manifest only — no PNG art. validateCampaignZone
// (runtime/campaignZone.ts) proves the whole per-map contract on this data before any tile is drawn.
// ================================================================================================
import {
  validateCampaignZone, blankGrids, type CampaignZone, type CampaignAnchor, type CampaignPortal,
} from '../../game/runtime/campaignZone'
import { TILE_SIZE } from '../../game/scaleContract'
import type { GridRect } from '../../game/runtime/zoneValidate'

export const AETHERGATE_COLS = 64
export const AETHERGATE_ROWS = 48

export interface BuildingRect { id: string; name: string; tx: number; ty: number; tw: number; th: number; door: { x: number; y: number } }

/** Building footprints in tile space (traced @64×48). academy tw trimmed 9→8 = the S3 lane fix.
 *  Exported so a renderer can draw each of the 12 landmarks as one labelled block. */
export const AETHERGATE_BUILDING_RECTS: BuildingRect[] = [
  { id: 'guild', name: "Adventurers' Guild", tx: 4, ty: 6, tw: 11, th: 9, door: { x: 10, y: 16 } },
  { id: 'academy', name: 'Academy & Library', tx: 18, ty: 2, tw: 8, th: 12, door: { x: 22, y: 15 } },
  { id: 'gatehouse', name: 'Tower Gatehouse', tx: 28, ty: 1, tw: 8, th: 11, door: { x: 32, y: 13 } },
  { id: 'town-hall', name: 'Town Hall & Chronicle', tx: 38, ty: 2, tw: 8, th: 11, door: { x: 43, y: 14 } },
  { id: 'hospital', name: 'Brightleaf Hospital', tx: 50, ty: 7, tw: 10, th: 9, door: { x: 54, y: 16 } },
  { id: 'job-hall', name: 'Job Hall', tx: 4, ty: 20, tw: 9, th: 8, door: { x: 8, y: 29 } },
  { id: 'forge', name: 'Forge & Craft Workshop', tx: 14, ty: 15, tw: 8, th: 8, door: { x: 18, y: 24 } },
  { id: 'item-shop', name: 'General Goods Shop', tx: 45, ty: 18, tw: 9, th: 10, door: { x: 49, y: 30 } },
  { id: 'bank', name: 'Bank & Storage', tx: 49, ty: 26, tw: 10, th: 9, door: { x: 54, y: 36 } },
  { id: 'inn', name: 'Hearthsong Inn', tx: 2, ty: 31, tw: 11, th: 8, door: { x: 8, y: 40 } },
  { id: 'lodge', name: 'Companion Lodge', tx: 14, ty: 30, tw: 10, th: 10, door: { x: 19, y: 41 } },
  { id: 'tailor', name: 'Tailor & Wardrobe', tx: 39, ty: 31, tw: 9, th: 9, door: { x: 44, y: 41 } },
]

/** Non-building blockers (walk around, not through). */
const BLOCKERS: { id: string; tx: number; ty: number; tw: number; th: number }[] = [
  { id: 'fountain', tx: 30, ty: 21, tw: 5, th: 6 },
  { id: 'stage', tx: 34, ty: 15, tw: 8, th: 5 },
]

const SPAWN = { x: 32, y: 45 } // south arrival gate — memorable entrance
const LANDMARK = { x: 32, y: 28 } // fountain south lip — walkable, right at the central landmark
const WAYSTONE_W = { x: 3, y: 5 }
const WAYSTONE_E = { x: 60, y: 5 }
const SECRET = { x: 6, y: 45 } // hidden garden, SW corner behind the inn

/** Building doors that lead to a real interior scene today (honest — no fake doors). */
const WIRED_INTERIORS: Record<string, string> = {
  guild: 'interior:guild',
  hospital: 'interior:hospital',
  'item-shop': 'interior:item-shop',
  forge: 'interior:equipment-shop',
}

/** Build the frozen Aethergate CampaignZone (pure — no Phaser, no art). */
export function buildAethergateZone(): CampaignZone {
  const { collision, roles } = blankGrids(AETHERGATE_COLS, AETHERGATE_ROWS)

  // border ring (wall), with a 3-tile south gate opening under the spawn
  for (let x = 0; x < AETHERGATE_COLS; x++) {
    collision[0]![x] = true; roles[0]![x] = 'wall'
    collision[AETHERGATE_ROWS - 1]![x] = true; roles[AETHERGATE_ROWS - 1]![x] = 'wall'
  }
  for (let y = 0; y < AETHERGATE_ROWS; y++) {
    collision[y]![0] = true; roles[y]![0] = 'wall'
    collision[y]![AETHERGATE_COLS - 1] = true; roles[y]![AETHERGATE_COLS - 1] = 'wall'
  }
  for (let x = SPAWN.x - 1; x <= SPAWN.x + 1; x++) { collision[AETHERGATE_ROWS - 1]![x] = false; roles[AETHERGATE_ROWS - 1]![x] = 'portal' }

  // buildings (wall silhouette)
  for (const b of AETHERGATE_BUILDING_RECTS) {
    for (let y = b.ty; y < Math.min(AETHERGATE_ROWS - 1, b.ty + b.th); y++) {
      for (let x = b.tx; x < Math.min(AETHERGATE_COLS - 1, b.tx + b.tw); x++) {
        collision[y]![x] = true
        roles[y]![x] = 'wall'
      }
    }
  }
  for (const bl of BLOCKERS) {
    for (let y = bl.ty; y < Math.min(AETHERGATE_ROWS - 1, bl.ty + bl.th); y++) {
      for (let x = bl.tx; x < Math.min(AETHERGATE_COLS - 1, bl.tx + bl.tw); x++) {
        collision[y]![x] = true
        roles[y]![x] = 'blocker'
      }
    }
  }

  const anchors: CampaignAnchor[] = []
  const portals: CampaignPortal[] = []

  // every building door: a wired interior becomes a two-way portal; the rest are interaction anchors
  for (const b of AETHERGATE_BUILDING_RECTS) {
    const dest = WIRED_INTERIORS[b.id]
    if (dest) {
      portals.push({ id: `door-${b.id}`, at: b.door, to: dest, kind: 'door', twoWay: true, label: b.name })
      roles[b.door.y]![b.door.x] = 'portal'
    } else {
      anchors.push({ id: `door-${b.id}`, role: 'interaction', at: b.door, label: b.name })
      roles[b.door.y]![b.door.x] = 'interaction'
    }
  }

  // arrival gate (return to overworld/title, always reversible) + Tower gate at the Gatehouse
  portals.push({ id: 'arrival', at: SPAWN, to: 'arrival', kind: 'return', twoWay: true, label: 'South Arrival Gate' })
  portals.push({ id: 'gate-tower', at: { x: 32, y: 12 }, to: 'tower', kind: 'gate', twoWay: true, label: 'Tower Gate' })
  roles[12]![32] = 'portal'

  // future field exit (Whisperwood) declared as an anchor, NOT a live portal — the field is not
  // built yet, so shipping it as a working portal would be a fake exit. Marked reachable + planned.
  anchors.push({ id: 'exit-whisperwood', role: 'portal', at: { x: 60, y: 24 }, label: 'North Path to Whisperwood (planned)' })

  // environmental O-NET interaction: the market notice board (read English signage to answer) +
  // the festival stage announcer — region 1 learning theme is everyday reading
  anchors.push({ id: 'board-market', role: 'interaction', at: { x: 24, y: 30 }, label: 'Market Notice Board', objective: true })
  anchors.push({ id: 'stage-crier', role: 'interaction', at: { x: 38, y: 20 }, label: 'Festival Stage Crier' })
  // the central fountain as a named landmark anchor (memory hook)
  anchors.push({ id: 'fountain', role: 'prop', at: LANDMARK, label: 'Aether Fountain' })
  // waystones (shortcut endpoints)
  anchors.push({ id: 'waystone-w', role: 'interaction', at: WAYSTONE_W, label: 'West Waystone' })
  anchors.push({ id: 'waystone-e', role: 'interaction', at: WAYSTONE_E, label: 'East Waystone' })
  roles[WAYSTONE_W.y]![WAYSTONE_W.x] = 'interaction'
  roles[WAYSTONE_E.y]![WAYSTONE_E.x] = 'interaction'

  const secret: CampaignAnchor = { id: 'secret-garden', role: 'secret', at: SECRET, label: 'Hidden Bloom Garden' }
  roles[SECRET.y]![SECRET.x] = 'secret'

  // force every labelled tile walkable even if rounding landed it on a footprint edge
  const carve = (p: { x: number; y: number }) => { collision[p.y]![p.x] = false }
  for (const b of AETHERGATE_BUILDING_RECTS) carve(b.door)
  for (const a of anchors) carve(a.at)
  for (const p of portals) carve(p.at)
  carve(SPAWN); carve(LANDMARK); carve(WAYSTONE_W); carve(WAYSTONE_E); carve(SECRET)

  const safePockets: GridRect[] = [
    { minX: 28, maxX: 36, minY: 27, maxY: 33 }, // plaza (learning feedback safe)
    { minX: 2, maxX: 12, minY: 31, maxY: 44 }, // inn quarter (rest / safe pocket)
  ]

  return {
    id: 'aethergate',
    name: 'Aethergate Town',
    tile: TILE_SIZE,
    cols: AETHERGATE_COLS,
    rows: AETHERGATE_ROWS,
    collision,
    roles,
    spawn: SPAWN,
    landmark: LANDMARK,
    anchors,
    portals,
    safePockets,
    // safe hub town: no combat encounters (capacity 0) — the whole town is a learning-safe zone
    spawnRegion: { bounds: { minX: 30, maxX: 34, minY: 33, maxY: 37 }, capacity: 0 },
    shortcut: { id: 'waystone-line', from: WAYSTONE_W, to: WAYSTONE_E, unlock: 'attune both waystones' },
    secret,
  }
}

/** Live validation used by tests and (later) the scene loader. */
export function validateAethergate() {
  return validateCampaignZone(buildAethergateZone())
}

// ================================================================================================
// Asset dependency manifest — which art each tile role/feature needs before this zone can render
// with production tiles. status: 'reuse' = a shipped CC0/licensed source exists to curate from;
// 'author' = must be drawn/composed new. Consumed by the P1 art pass + registered in ASSET_REGISTRY.
// ================================================================================================
export interface ZoneAssetDep {
  key: string
  role: string
  need: string
  source: string
  status: 'reuse' | 'author'
}

export const AETHERGATE_ASSET_MANIFEST: ZoneAssetDep[] = [
  { key: 'ground-grass', role: 'ground', need: 'grass base ×3 + edge/corner', source: 'tiny-town (CC0, in public/)', status: 'reuse' },
  { key: 'ground-path', role: 'ground', need: 'stone/dirt path + grass↔path transition', source: 'craftpix path-and-road tileset (licensed, D:\\Asset)', status: 'reuse' },
  { key: 'plaza-stone', role: 'ground', need: 'plaza flagstone + fountain ring', source: 'author (from village tileset shapes)', status: 'author' },
  { key: 'wall-building', role: 'wall', need: '12 building silhouettes w/ doors + rooftops (foreground)', source: 'author (curate village/guild-hall packs, per-building palette)', status: 'author' },
  { key: 'blocker-fountain', role: 'blocker', need: 'animated fountain 4f + water', source: 'author', status: 'author' },
  { key: 'blocker-stage', role: 'blocker', need: 'festival stage + banners/flags 2f', source: 'reuse (guild-hall flags) + author stage', status: 'author' },
  { key: 'prop-tree', role: 'prop', need: 'tree ×2 + sakura landmark + bushes/flowerbeds', source: 'tiny-town + craftpix bushes (licensed)', status: 'reuse' },
  { key: 'portal-waystone', role: 'portal', need: 'waystone crystal glow 2f + tower gate portal 4f', source: 'author (aether identity)', status: 'author' },
  { key: 'interaction-board', role: 'interaction', need: 'notice board + market stalls ×6', source: 'author (English signage = O-NET interaction)', status: 'author' },
  { key: 'secret-garden', role: 'secret', need: 'flower arch + hidden bloom patch', source: 'reuse craftpix bushes + author arch', status: 'author' },
]
