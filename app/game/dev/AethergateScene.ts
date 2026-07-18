// ================================================================================================
// AethergateScene — DEV-ONLY preview that renders the committed Aethergate CampaignZone data as a
// walkable town (imported solely by /dev/aethergate, stripped from production by pages:extend).
//
// Purpose: prove the data→playable pipeline end-to-end in a real browser at the scale contract,
// BEFORE production tile art exists. Ground uses the shipped tiny-town CC0 tileset (real tiles, not
// the mockup PNG — MAP_BUILD non-negotiable #1); buildings/blockers are honest greybox blocks with
// labels (final art is the AETHERGATE_ASSET_MANIFEST work). Hero, collision, camera and movement all
// come from the scale contract, so walking here is how the shipped town will feel.
// ================================================================================================
import Phaser from 'phaser'
import { buildAethergateZone, AETHERGATE_BUILDING_RECTS } from '../../data/zones/aethergate'
import { walkGridOf, type CampaignZone } from '../runtime/campaignZone'
import { resolveMovement, type Facing } from '../runtime/movement'
import {
  TILE_SIZE, HERO_VISUAL_H, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, PLAYER_FEET_OFFSET,
  TOWN_SPEED, centeredCameraBounds,
} from '../scaleContract'
import { HERO_SRC_H } from '../systems/heroFrames'
import { preloadSharedAssets, buildHeroAnimations, heroKey, heroIdleFrame, heroAnim } from '../systems/textures'

const HALF_W = PLAYER_BODY_WIDTH / 2
const FOOT_H = PLAYER_BODY_HEIGHT

// building block palette (greybox — distinct so the 12 landmarks read apart)
const BUILDING_FILL = 0x5a4630
const BUILDING_LINE = 0x8a6a3a
const FOUNTAIN_FILL = 0x2f6f9e
const STAGE_FILL = 0x7a5a2a

export class AethergateScene extends Phaser.Scene {
  private zone!: CampaignZone
  private player!: Phaser.GameObjects.Sprite
  private facing: Facing = 'up'
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private grid!: ReturnType<typeof walkGridOf>
  private tourPath: { x: number; y: number }[] = []

  constructor() { super('AethergateScene') }

  preload() { preloadSharedAssets(this) }

  create() {
    this.zone = buildAethergateZone()
    this.grid = walkGridOf(this.zone)
    const { cols, rows } = this.zone
    const W = cols * TILE_SIZE
    const H = rows * TILE_SIZE

    // ground: tiny-town grass frame tiled once (16px source shown at integer 2×)
    if (this.textures.exists('tiny_town')) {
      this.add.tileSprite(0, 0, W, H, 'tiny_town', 0).setOrigin(0, 0).setTileScale(2, 2).setDepth(-10)
    } else {
      this.add.rectangle(0, 0, W, H, 0x2b6a34).setOrigin(0, 0).setDepth(-10)
    }

    // plaza flagstone hint + safe pockets (lighter ground)
    const g = this.add.graphics().setDepth(-9)
    for (const sp of this.zone.safePockets) {
      g.fillStyle(0xffffff, 0.06)
      g.fillRect(sp.minX * TILE_SIZE, sp.minY * TILE_SIZE, (sp.maxX - sp.minX + 1) * TILE_SIZE, (sp.maxY - sp.minY + 1) * TILE_SIZE)
    }

    // buildings + blockers from the collision/role grid, drawn as labelled greybox blocks
    const blocks = this.add.graphics().setDepth(1)
    // border ring
    blocks.fillStyle(0x2c3140, 1)
    for (let x = 0; x < cols; x++) { blocks.fillRect(x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE); blocks.fillRect(x * TILE_SIZE, (rows - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE) }
    for (let y = 0; y < rows; y++) { blocks.fillRect(0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE); blocks.fillRect((cols - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE) }
    // south gate opening (reopen the 3 portal tiles the border drew over)
    blocks.fillStyle(0x18211a, 1)
    blocks.fillRect((this.zone.spawn.x - 1) * TILE_SIZE, (rows - 1) * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE)

    // 12 buildings drawn directly from the frozen rects (one labelled block each)
    blocks.fillStyle(BUILDING_FILL, 1).lineStyle(2, BUILDING_LINE, 1)
    for (const b of AETHERGATE_BUILDING_RECTS) {
      blocks.fillRect(b.tx * TILE_SIZE, b.ty * TILE_SIZE, b.tw * TILE_SIZE, b.th * TILE_SIZE)
      blocks.strokeRect(b.tx * TILE_SIZE, b.ty * TILE_SIZE, b.tw * TILE_SIZE, b.th * TILE_SIZE)
    }
    for (const b of AETHERGATE_BUILDING_RECTS) {
      const short = b.name.split(' ')[0] === 'General' ? 'Shop' : b.name.split(/[ &]/)[0]
      this.add.text(b.tx * TILE_SIZE + (b.tw * TILE_SIZE) / 2, b.ty * TILE_SIZE + (b.th * TILE_SIZE) / 2, short, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffe9b3', align: 'center',
        wordWrap: { width: Math.max(b.tw * TILE_SIZE - 6, 40) },
      }).setOrigin(0.5).setDepth(3)
    }
    // blockers (fountain/stage) coloured apart, from the role grid (2 clean rects)
    for (const r of this.rectsFromRole(['blocker'], 0, cols, rows)) {
      const isFountain = r.w <= 5
      blocks.fillStyle(isFountain ? FOUNTAIN_FILL : STAGE_FILL, 1)
      blocks.fillRect(r.x * TILE_SIZE, r.y * TILE_SIZE, r.w * TILE_SIZE, r.h * TILE_SIZE)
    }

    // markers for portals / interactions / secret / landmark / shortcut
    const mark = (x: number, y: number, color: number, shape: 'circle' | 'square' | 'diamond' | 'star') => {
      const cx = x * TILE_SIZE + TILE_SIZE / 2
      const cy = y * TILE_SIZE + TILE_SIZE / 2
      if (shape === 'circle') this.add.circle(cx, cy, 7, color, 0.95).setDepth(6)
      else if (shape === 'diamond') this.add.rectangle(cx, cy, 12, 12, color, 0.95).setAngle(45).setDepth(6)
      else if (shape === 'star') this.add.star(cx, cy, 5, 5, 11, color, 0.95).setDepth(6)
      else this.add.rectangle(cx, cy, 12, 12, color, 0.95).setDepth(6)
    }
    for (const p of this.zone.portals) mark(p.at.x, p.at.y, p.kind === 'return' ? 0x7ad97a : 0x66d9e8, 'circle')
    for (const a of this.zone.anchors) mark(a.at.x, a.at.y, 0xffa94d, 'square')
    mark(this.zone.landmark.x, this.zone.landmark.y, 0xffd166, 'star')
    mark(this.zone.secret.x, this.zone.secret.y, 0xda77f2, 'diamond')

    // hero at spawn — scale contract (48px display, 18×12 foot body), real atlas art
    if (this.textures.exists(heroKey('warrior', 'male'))) buildHeroAnimations(this)
    const sx = this.zone.spawn.x * TILE_SIZE + TILE_SIZE / 2
    const sy = this.zone.spawn.y * TILE_SIZE + TILE_SIZE / 2
    this.add.ellipse(sx, sy, 20, 8, 0x000000, 0.35).setDepth(9)
    this.player = this.add.sprite(sx, sy, heroKey('warrior', 'male'), heroIdleFrame('warrior', 'male'))
      .setOrigin(0.5, 0.92).setScale(HERO_VISUAL_H / HERO_SRC_H).setDepth(10)
    if (this.player.texture.key !== '__MISSING') this.player.play(heroAnim('warrior', 'male', 'idle', 'down'))

    const camB = centeredCameraBounds(W, H, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true)
    this.cameras.main.roundPixels = true

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as typeof this.wasd

    this.game.events.emit('aethergate:ready', {
      cols, rows, worldW: W, worldH: H,
      buildings: AETHERGATE_BUILDING_RECTS.length, portals: this.zone.portals.length, anchors: this.zone.anchors.length,
      heroTex: this.player.texture.key !== '__MISSING',
    })
  }

  /** Auto-walk the BFS path between two named anchors (playtest tour). */
  tourTo(anchorId: string) {
    const target = this.zone.portals.find((p) => p.id === anchorId)?.at
      ?? this.zone.anchors.find((a) => a.id === anchorId)?.at
      ?? (anchorId === 'landmark' ? this.zone.landmark : undefined)
      ?? (anchorId === 'secret' ? this.zone.secret.at : undefined)
    if (!target) return false
    const path = this.bfsPath(this.zone.spawn, target)
    if (!path) return false
    this.tourPath = path.slice(1)
    return true
  }

  private bfsPath(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] | null {
    const key = (x: number, y: number) => `${x},${y}`
    const prev = new Map<string, { x: number; y: number } | null>()
    const q: { x: number; y: number }[] = [from]
    prev.set(key(from.x, from.y), null)
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    while (q.length) {
      const c = q.shift()!
      if (c.x === to.x && c.y === to.y) {
        const path: { x: number; y: number }[] = []
        let cur: { x: number; y: number } | null = c
        while (cur) { path.unshift(cur); cur = prev.get(key(cur.x, cur.y)) ?? null }
        return path
      }
      for (const [dx, dy] of dirs) {
        const nx = c.x + dx
        const ny = c.y + dy
        if (this.grid.blocked(nx, ny) || prev.has(key(nx, ny))) continue
        prev.set(key(nx, ny), c)
        q.push({ x: nx, y: ny })
      }
    }
    return null
  }

  update(_t: number, deltaMs: number) {
    const dt = deltaMs / 1000
    if (this.tourPath.length) {
      let budget = TOWN_SPEED * dt
      while (budget > 0 && this.tourPath.length) {
        const tgt = { x: this.tourPath[0]!.x * TILE_SIZE + TILE_SIZE / 2, y: this.tourPath[0]!.y * TILE_SIZE + TILE_SIZE / 2 }
        const dx = tgt.x - this.player.x
        const dy = tgt.y - this.player.y
        const dist = Math.abs(dx) + Math.abs(dy)
        this.playWalk(Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up')
        if (dist <= budget) { this.player.setPosition(tgt.x, tgt.y); budget -= dist; this.tourPath.shift() }
        else { this.player.setPosition(this.player.x + Math.sign(dx) * Math.min(budget, Math.abs(dx)), this.player.y + Math.sign(dy) * Math.min(budget, Math.abs(dy))); budget = 0 }
      }
      if (!this.tourPath.length) { this.playIdle(); this.game.events.emit('aethergate:tour-done', { x: this.player.x, y: this.player.y }) }
      return
    }
    if (!this.cursors || !this.wasd) return
    const input = {
      left: this.cursors.left.isDown || this.wasd.A.isDown,
      right: this.cursors.right.isDown || this.wasd.D.isDown,
      up: this.cursors.up.isDown || this.wasd.W.isDown,
      down: this.cursors.down.isDown || this.wasd.S.isDown,
    }
    const move = resolveMovement(input, this.facing, TOWN_SPEED)
    if (move.moving) {
      const nx = this.player.x + move.vx * dt
      const ny = this.player.y + move.vy * dt
      if (!this.footBlocked(nx, this.player.y)) this.player.x = nx
      if (!this.footBlocked(this.player.x, ny)) this.player.y = ny
      this.facing = move.facing
      this.playWalk(move.facing)
    } else {
      this.playIdle()
    }
  }

  private playWalk(dir: Facing) {
    if (this.player.texture.key === '__MISSING') return
    const k = heroAnim('warrior', 'male', 'walk', dir)
    if (this.player.anims.currentAnim?.key !== k) this.player.play(k)
  }
  private playIdle() {
    if (this.player.texture.key === '__MISSING') return
    const k = heroAnim('warrior', 'male', 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== k) this.player.play(k)
  }

  private footBlocked(x: number, y: number): boolean {
    const corners: [number, number][] = [
      [x - HALF_W, y - FOOT_H], [x + HALF_W - 1, y - FOOT_H], [x - HALF_W, y - 1], [x + HALF_W - 1, y - 1],
    ]
    return corners.some(([px, py]) => this.grid.blocked(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE)))
  }

  /** Merge same-role tiles into non-overlapping rects (row-run greedy) for clean block draws. */
  private rectsFromRole(want: string[], minCol: number, cols: number, rows: number): { x: number; y: number; w: number; h: number }[] {
    const claimed = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
    const out: { x: number; y: number; w: number; h: number }[] = []
    const roleOf = (x: number, y: number) => this.zone.roles[y]?.[x] ?? null
    for (let y = 1; y < rows - 1; y++) {
      for (let x = minCol; x < cols - 1; x++) {
        if (claimed[y]![x] || !want.includes(roleOf(x, y) ?? '')) continue
        let w = 1
        while (x + w < cols - 1 && want.includes(roleOf(x + w, y) ?? '') && !claimed[y]![x + w]) w++
        let h = 1
        grow: while (y + h < rows - 1) {
          for (let k = 0; k < w; k++) { if (!want.includes(roleOf(x + k, y + h) ?? '') || claimed[y + h]![x + k]) break grow }
          h++
        }
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) claimed[yy]![xx] = true
        out.push({ x, y, w, h })
      }
    }
    return out
  }
}
