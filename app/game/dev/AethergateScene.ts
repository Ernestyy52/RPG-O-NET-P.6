// ================================================================================================
// AethergateScene — DEV preview that renders the committed Aethergate CampaignZone data as a
// walkable, production-dressed town (imported solely by /dev/aethergate, stripped from production by
// pages:extend).
//
// P1 art pass (MAP_BUILD_STATE item 5a / AETHERGATE_ASSET_PLAN §4): the greybox blocks are replaced
// by the game's own production art pipeline — no per-map PNG, no mockup contact sheet
// (MAP_BUILD non-negotiable #1):
//   • ground/paths/plaza = procedural biome tiles baked from the tiny-town CC0 sheet
//     (buildBiomeTextures + biomeFloorKey) — the SAME renderer the shipped Tower/Town floors use.
//   • the 12 landmarks are drawn as structured buildings via Phaser Graphics (roof + plaster wall +
//     door + windows + sign), which is this project's established town-building technique
//     (CLAUDE.md: "อาคารเมืองยังเป็น Phaser Graphics วาดสด"), coloured per district so they read apart.
//   • fountain / festival stage / waystones / arrival gate / tower portal / notice board / market
//     stalls / trees are real props, all y-sorted by their base so the hero passes in front/behind.
// Hero, collision, camera and movement come from the scale contract, so walking here is how the
// shipped town will feel. Data + reachability are still proven by validateCampaignZone before draw.
// ================================================================================================
import Phaser from 'phaser'
import { buildAethergateZone, AETHERGATE_BUILDING_RECTS, type BuildingRect } from '../../data/zones/aethergate'
import { walkGridOf, type CampaignZone } from '../runtime/campaignZone'
import { resolveMovement, type Facing } from '../runtime/movement'
import {
  TILE_SIZE, HERO_VISUAL_H, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT,
  TOWN_SPEED, centeredCameraBounds,
} from '../scaleContract'
import { HERO_SRC_H } from '../systems/heroFrames'
import {
  preloadSharedAssets, buildHeroAnimations, heroKey, heroIdleFrame, heroAnim,
  buildBiomeTextures, biomeFloorKey, tinyTownFrame,
} from '../systems/textures'
import { BIOMES } from '../../data/biomes'

const HALF_W = PLAYER_BODY_WIDTH / 2
const FOOT_H = PLAYER_BODY_HEIGHT
const TREE_FRAME = 28 // tiny-town tree (source frame, kept natural tone)

/** Region 1 = Verdant → the shipped 'forest' biome palette (bright home-town green). */
const R1 = BIOMES[0]! // forest

/** Roof accent per district — the twelve buildings must be tellable apart from the plaza (spec). */
const DISTRICT_ROOF: Record<string, number> = {
  guild: 0x3f6fb0, academy: 0x4a9a5a, gatehouse: 0x8163c8, 'town-hall': 0xb0483f,
  hospital: 0x3fa389, 'job-hall': 0x4066a0, forge: 0x9a3f2e, 'item-shop': 0xc2902f,
  bank: 0x8f6bc0, inn: 0xcf7a34, lodge: 0x5f8a45, tailor: 0xc86f9a,
}

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

    // production floor textures (grass variants + path + plaza), baked from tiny-town CC0
    buildBiomeTextures(this, R1)

    this.drawGround(cols, rows, W, H)
    this.drawBorderWall(cols, rows)
    this.drawProps()               // fountain, stage, trees, gardens (behind/around buildings)
    for (const b of AETHERGATE_BUILDING_RECTS) this.drawBuilding(b)
    this.drawGates()               // arrival gate, tower portal, whisperwood exit arch, waystones
    this.drawMarket()              // notice board + stalls (O-NET reading interaction)
    this.drawSafePocketHint()

    // hero at spawn — scale contract (48px display, 18×12 foot body), real atlas art, y-sorted
    if (this.textures.exists(heroKey('warrior', 'male'))) buildHeroAnimations(this)
    const sx = this.zone.spawn.x * TILE_SIZE + TILE_SIZE / 2
    const sy = this.zone.spawn.y * TILE_SIZE + TILE_SIZE / 2
    this.playerShadow = this.add.ellipse(sx, sy, 20, 8, 0x000000, 0.32)
    this.player = this.add.sprite(sx, sy, heroKey('warrior', 'male'), heroIdleFrame('warrior', 'male'))
      .setOrigin(0.5, 0.92).setScale(HERO_VISUAL_H / HERO_SRC_H)
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

  private playerShadow!: Phaser.GameObjects.Ellipse

  // ---- terrain ------------------------------------------------------------------------------------

  /** Bake ground = grass variants, with a stone street network + plaza flagstone, into one texture. */
  private drawGround(cols: number, rows: number, W: number, H: number) {
    const path = this.streetTiles(cols, rows)
    const plaza = this.zone.safePockets[0]! // central plaza safe pocket
    const inPlaza = (x: number, y: number) => x >= plaza.minX && x <= plaza.maxX && y >= plaza.minY && y <= plaza.maxY && this.zone.roles[y]?.[x] !== 'wall'

    const groundKey = (x: number, y: number): string => {
      if (inPlaza(x, y)) return this.textures.exists('forest_plaza') ? 'forest_plaza' : biomeFloorKey('forest', x, y)
      if (path.has(`${x},${y}`)) {
        const v = ((x * 7 + y * 13) % 3 + 3) % 3
        const key = `forest_path${v}`
        return this.textures.exists(key) ? key : biomeFloorKey('forest', x, y)
      }
      return biomeFloorKey('forest', x, y)
    }

    if (this.textures.exists(biomeFloorKey('forest', 0, 0))) {
      // per-tile images (the shipped Tower/Town floor pattern) — canvas tile textures upload lazily
      // in the render loop, so a synchronous RenderTexture.draw in create() would miss them.
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, groundKey(x, y)).setOrigin(0, 0).setDepth(-10)
      }
    } else {
      this.add.rectangle(0, 0, W, H, R1.grass.base).setOrigin(0, 0).setDepth(-10)
    }
  }

  /** Cosmetic stone streets: N–S main avenue (spawn→plaza→tower gate), an E–W avenue, door stubs. */
  private streetTiles(cols: number, rows: number): Set<string> {
    const s = new Set<string>()
    const isWall = (x: number, y: number) => this.zone.roles[y]?.[x] === 'wall'
    const put = (x: number, y: number) => { if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1 && !isWall(x, y)) s.add(`${x},${y}`) }
    // main N–S avenue (3 wide) down the spawn column, tower gate → south arrival
    for (let y = 12; y <= 46; y++) for (let x = 31; x <= 33; x++) put(x, y)
    // E–W avenue (3 wide) linking west & east districts through the plaza latitude
    for (let x = 1; x < cols - 1; x++) for (let y = 23; y <= 25; y++) put(x, y)
    // a stub from every building door to the nearest avenue
    for (const b of AETHERGATE_BUILDING_RECTS) {
      const d = b.door
      const [a, z] = d.y <= 24 ? [d.y, 24] : [24, d.y]
      for (let y = a; y <= z; y++) put(d.x, y)
    }
    return s
  }

  private drawBorderWall(cols: number, rows: number) {
    const g = this.add.graphics().setDepth(2)
    const draw = (x: number, y: number) => {
      const px = x * TILE_SIZE, py = y * TILE_SIZE
      g.fillStyle(0x6b6256, 1).fillRect(px, py, TILE_SIZE, TILE_SIZE)
      g.fillStyle(0x847a6a, 1).fillRect(px + 2, py + 2, TILE_SIZE - 4, 6)          // top course highlight
      g.fillStyle(0x554d43, 1).fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 5)      // base shadow
      g.lineStyle(1, 0x3f382f, 0.6).strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1)
    }
    for (let x = 0; x < cols; x++) { draw(x, 0); draw(x, rows - 1) }
    for (let y = 0; y < rows; y++) { draw(0, y); draw(cols - 1, y) }
    // reopen the 3-tile south arrival gate (drawn over by the border loop)
    const gm = this.add.graphics().setDepth(2)
    gm.fillStyle(R1.grass.base, 1)
    gm.fillRect((this.zone.spawn.x - 1) * TILE_SIZE, (rows - 1) * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE)
  }

  // ---- buildings --------------------------------------------------------------------------------

  private drawBuilding(b: BuildingRect) {
    const x0 = b.tx * TILE_SIZE, y0 = b.ty * TILE_SIZE
    const w = b.tw * TILE_SIZE, h = b.th * TILE_SIZE
    const roof = DISTRICT_ROOF[b.id] ?? 0x8a6a3a
    const roofH = Math.round(h * 0.56)
    const g = this.add.graphics().setDepth(y0 + h - 1)

    // ground shadow (one light direction = upper-left, per ART_BIBLE)
    g.fillStyle(0x000000, 0.20).fillRect(x0 + 5, y0 + 8, w, h - 4)
    // plaster wall (lower body)
    g.fillStyle(0xe7d7b4, 1).fillRect(x0, y0 + roofH, w, h - roofH)
    g.fillStyle(0xcdb98f, 1).fillRect(x0, y0 + h - 6, w, 6)                        // wall base shade
    g.fillStyle(0xf3e8cd, 1).fillRect(x0, y0 + roofH, w, 3)                        // under-eave highlight
    // pitched roof (overhangs the wall a touch)
    g.fillStyle(this.shade(roof, 0.82), 1).fillRect(x0 - 3, y0, w + 6, roofH)
    g.fillStyle(roof, 1).fillRect(x0 - 3, y0 + 3, w + 6, roofH - 6)
    g.fillStyle(this.shade(roof, 1.25), 1).fillRect(x0 - 3, y0 + Math.round(roofH * 0.42), w + 6, 3) // ridge line
    g.lineStyle(1, this.shade(roof, 0.6), 0.8).strokeRect(x0 - 3, y0, w + 6, roofH)
    // roof planks
    g.lineStyle(1, this.shade(roof, 0.72), 0.5)
    for (let px = x0 + 4; px < x0 + w; px += 10) { g.beginPath(); g.moveTo(px, y0 + 2); g.lineTo(px, y0 + roofH - 2); g.strokePath() }

    // windows (lit)
    const winY = y0 + roofH + Math.round((h - roofH) * 0.28)
    const winCount = Math.max(1, Math.floor(w / 40))
    for (let i = 0; i < winCount; i++) {
      const wx = x0 + Math.round((w / (winCount + 1)) * (i + 1)) - 6
      g.fillStyle(0x6b5a3a, 1).fillRect(wx - 1, winY - 1, 14, 16)
      g.fillStyle(0xffe9a8, 1).fillRect(wx, winY, 12, 14)
      g.fillStyle(0xbf9a4a, 1).fillRect(wx + 5, winY, 2, 14)
    }
    // door at the real door tile
    const dcx = b.door.x * TILE_SIZE + TILE_SIZE / 2
    const doorW = 20, doorH = 26
    const dx = Phaser.Math.Clamp(dcx - doorW / 2, x0 + 2, x0 + w - doorW - 2)
    const dy = y0 + h - doorH
    g.fillStyle(0x3c2a19, 1).fillRect(dx, dy, doorW, doorH)
    g.fillStyle(0x59402a, 1).fillRect(dx + 2, dy + 2, doorW - 4, doorH - 2)
    g.fillStyle(0xcaa24a, 1).fillCircle(dx + doorW - 6, dy + doorH / 2, 1.6)      // handle
    g.fillStyle(this.shade(roof, 0.9), 1).fillRect(dx - 2, dy - 4, doorW + 4, 4)  // lintel (district tint)

    // hanging sign board beside the door
    g.fillStyle(this.shade(roof, 1.1), 1).fillRect(dx + doorW + 3, dy + 2, 10, 8)
    g.lineStyle(1, 0x3f382f, 0.8).strokeRect(dx + doorW + 3, dy + 2, 10, 8)

    // building name label (dev readability — the shipped scene uses NPC/sign art instead)
    const short = b.name.split(' ')[0] === 'General' ? 'Shop' : b.name.split(/[ &]/)[0]
    this.add.text(x0 + w / 2, y0 + Math.round(roofH * 0.5), short, {
      fontFamily: 'monospace', fontSize: '9px', color: '#fff4d6', align: 'center', stroke: '#2a1c0e', strokeThickness: 2,
      wordWrap: { width: Math.max(w - 6, 40) },
    }).setOrigin(0.5).setDepth(y0 + h - 0.5)
  }

  // ---- props ------------------------------------------------------------------------------------

  private drawProps() {
    // fountain + festival stage read from the role grid (single source with the collision data)
    for (const r of this.rectsFromRole(['blocker'])) {
      const isFountain = r.w <= 5
      if (isFountain) this.drawFountain(r)
      else this.drawStage(r)
    }
    // trees & flowerbeds on grass (never on a wall/door/path) around the plaza & gardens
    const treeSpots: [number, number][] = [
      [3, 44], [7, 44], [5, 42], [10, 45], [2, 26], [4, 28], [58, 44], [61, 45], [59, 41],
      [26, 18], [40, 24], [24, 34], [44, 34], [15, 44], [56, 30], [46, 45], [22, 44],
    ]
    for (const [tx, ty] of treeSpots) {
      if (this.zone.roles[ty]?.[tx] === 'wall') continue
      const cx = tx * TILE_SIZE + TILE_SIZE / 2, cy = ty * TILE_SIZE + TILE_SIZE / 2
      this.add.ellipse(cx, cy + 6, 22, 9, 0x000000, 0.22).setDepth(cy - 2)
      tinyTownFrame(this, cx, cy - 8, TREE_FRAME).setScale(2).setOrigin(0.5, 0.85).setDepth(cy)
    }
    // secret garden bloom cluster (SW corner)
    this.drawFlowerbed(this.zone.secret.x, this.zone.secret.y)
    this.drawFlowerbed(6, 43)
  }

  private drawFountain(r: { x: number; y: number; w: number; h: number }) {
    const px = r.x * TILE_SIZE, py = r.y * TILE_SIZE, w = r.w * TILE_SIZE, h = r.h * TILE_SIZE
    const g = this.add.graphics().setDepth(py + h - 1)
    g.fillStyle(0x000000, 0.18).fillEllipse(px + w / 2 + 4, py + h - 4, w, h * 0.5)
    g.fillStyle(0x8f8578, 1).fillRoundedRect(px, py + 4, w, h - 6, 8)             // stone basin
    g.fillStyle(0xa9a091, 1).fillRoundedRect(px + 3, py + 6, w - 6, h - 12, 6)
    g.fillStyle(0x2f7fb0, 1).fillRoundedRect(px + 7, py + 9, w - 14, h - 18, 5)   // water
    g.fillStyle(0x6fc0e0, 0.8).fillRoundedRect(px + 9, py + 11, w - 22, 5, 3)     // highlight
    g.fillStyle(0xbfe6f4, 1).fillRect(px + w / 2 - 2, py + 2, 4, h * 0.5)         // central jet
    g.fillStyle(0xffffff, 0.7).fillCircle(px + w / 2, py + 4, 3)
  }

  private drawStage(r: { x: number; y: number; w: number; h: number }) {
    const px = r.x * TILE_SIZE, py = r.y * TILE_SIZE, w = r.w * TILE_SIZE, h = r.h * TILE_SIZE
    const g = this.add.graphics().setDepth(py + h - 1)
    g.fillStyle(0x000000, 0.18).fillRect(px + 4, py + 8, w, h - 4)
    g.fillStyle(0x7a5a2a, 1).fillRect(px, py + 6, w, h - 6)                        // wooden platform
    g.fillStyle(0x8f6c33, 1).fillRect(px, py + 6, w, 4)
    g.lineStyle(1, 0x5c3f1c, 0.7)
    for (let x = px + 6; x < px + w; x += 12) { g.beginPath(); g.moveTo(x, py + 6); g.lineTo(x, py + h); g.strokePath() }
    // banner poles with flags at the two front corners
    for (const bx of [px + 4, px + w - 6]) {
      g.fillStyle(0x4a3620, 1).fillRect(bx, py - 10, 3, h + 8)
      g.fillStyle(bx === px + 4 ? 0xd15a4a : 0x4a86c8, 1)
      g.fillTriangle(bx + 3, py - 8, bx + 16, py - 4, bx + 3, py)
    }
  }

  private drawFlowerbed(tx: number, ty: number) {
    if (this.zone.roles[ty]?.[tx] === 'wall') return
    const cx = tx * TILE_SIZE + TILE_SIZE / 2, cy = ty * TILE_SIZE + TILE_SIZE / 2
    const g = this.add.graphics().setDepth(cy)
    g.fillStyle(0x3f6b34, 1).fillEllipse(cx, cy, 26, 16)
    const cols = [0xff6f9a, 0xffd166, 0x8a7bff, 0xff9a4d]
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      g.fillStyle(cols[i % cols.length]!, 1)
      g.fillCircle(cx + Math.cos(a) * 9, cy + Math.sin(a) * 5, 2.2)
    }
  }

  // ---- gates / portals / waystones --------------------------------------------------------------

  private drawGates() {
    // south arrival gate — two stone posts + guardian statues flanking the spawn opening
    const sgx = this.zone.spawn.x * TILE_SIZE + TILE_SIZE / 2
    const sgy = (this.zone.rows - 1) * TILE_SIZE + TILE_SIZE / 2
    for (const off of [-TILE_SIZE * 2, TILE_SIZE * 2]) {
      const g = this.add.graphics().setDepth(sgy)
      g.fillStyle(0x6b6256, 1).fillRect(sgx + off - 8, sgy - 30, 16, 34)
      g.fillStyle(0x847a6a, 1).fillRect(sgx + off - 8, sgy - 30, 16, 5)
      g.fillStyle(0xbfc7cf, 1).fillTriangle(sgx + off - 6, sgy - 30, sgx + off, sgy - 42, sgx + off + 6, sgy - 30) // statue
    }

    // Tower Gate portal (aether swirl) at the gatehouse foot
    const tg = this.zone.portals.find((p) => p.id === 'gate-tower')!.at
    this.drawPortal(tg.x, tg.y, 0x9a7bff)

    // North path to Whisperwood — a walkable arch opening in the tree line (planned exit anchor)
    const wex = this.zone.anchors.find((a) => a.id === 'exit-whisperwood')!.at
    const ax = wex.x * TILE_SIZE + TILE_SIZE / 2, ay = wex.y * TILE_SIZE + TILE_SIZE / 2
    const ga = this.add.graphics().setDepth(ay)
    ga.fillStyle(0x5c3f1c, 1).fillRect(ax - 20, ay - 26, 6, 30)
    ga.fillStyle(0x5c3f1c, 1).fillRect(ax + 14, ay - 26, 6, 30)
    ga.fillStyle(0x3f8a44, 1).fillEllipse(ax, ay - 26, 52, 18)                    // leafy arch
    this.add.text(ax, ay + 10, '→ Whisperwood', { fontFamily: 'monospace', fontSize: '8px', color: '#cfeecb', stroke: '#173318', strokeThickness: 2 }).setOrigin(0.5).setDepth(ay + 0.1)

    // waystones (shortcut endpoints)
    for (const id of ['waystone-w', 'waystone-e']) {
      const a = this.zone.anchors.find((n) => n.id === id)
      if (a) this.drawWaystone(a.at.x, a.at.y)
    }
  }

  private drawPortal(tx: number, ty: number, color: number) {
    const cx = tx * TILE_SIZE + TILE_SIZE / 2, cy = ty * TILE_SIZE + TILE_SIZE / 2
    const g = this.add.graphics().setDepth(cy)
    g.fillStyle(0x4a4258, 1).fillRect(cx - 16, cy - 30, 6, 34)                    // frame posts
    g.fillStyle(0x4a4258, 1).fillRect(cx + 10, cy - 30, 6, 34)
    g.fillStyle(0x5a5270, 1).fillRect(cx - 16, cy - 34, 32, 8)                    // lintel
    g.fillStyle(this.shade(color, 0.7), 1).fillEllipse(cx, cy - 12, 22, 30)       // portal glow
    g.fillStyle(color, 0.9).fillEllipse(cx, cy - 12, 15, 24)
    g.fillStyle(0xffffff, 0.55).fillEllipse(cx, cy - 12, 6, 12)
  }

  private drawWaystone(tx: number, ty: number) {
    const cx = tx * TILE_SIZE + TILE_SIZE / 2, cy = ty * TILE_SIZE + TILE_SIZE / 2
    const g = this.add.graphics().setDepth(cy)
    g.fillStyle(0x000000, 0.2).fillEllipse(cx, cy + 4, 16, 6)
    g.fillStyle(0x3a4a66, 1).fillRect(cx - 5, cy - 16, 10, 20)                    // stone
    g.fillStyle(0x66d9e8, 0.9).fillTriangle(cx - 4, cy - 8, cx, cy - 24, cx + 4, cy - 8) // crystal
    g.fillStyle(0xffffff, 0.6).fillTriangle(cx - 1, cy - 10, cx, cy - 22, cx + 1, cy - 10)
  }

  // ---- market (O-NET reading interaction) -------------------------------------------------------

  private drawMarket() {
    const board = this.zone.anchors.find((a) => a.id === 'board-market')!.at
    const bx = board.x * TILE_SIZE + TILE_SIZE / 2, by = board.y * TILE_SIZE + TILE_SIZE / 2
    const g = this.add.graphics().setDepth(by)
    g.fillStyle(0x000000, 0.18).fillEllipse(bx, by + 6, 22, 8)
    g.fillStyle(0x5c3f1c, 1).fillRect(bx - 3, by - 6, 6, 16)                      // post
    g.fillStyle(0x8a6a3a, 1).fillRect(bx - 16, by - 26, 32, 22)                   // board
    g.fillStyle(0xe9dcc0, 1).fillRect(bx - 13, by - 23, 26, 16)                   // paper
    g.fillStyle(0x9a8a6a, 1)
    for (let i = 0; i < 4; i++) g.fillRect(bx - 11, by - 20 + i * 4, 22, 1.4)     // note lines
    this.add.text(bx, by + 12, 'Notice Board', { fontFamily: 'monospace', fontSize: '8px', color: '#ffe9b3', stroke: '#2a1c0e', strokeThickness: 2 }).setOrigin(0.5).setDepth(by + 0.1)

    // a small rotating market: three awning stalls around the plaza edge
    const stalls: [number, number, number][] = [[27, 33, 0xd15a4a], [37, 33, 0x4a86c8], [30, 34, 0xe0a53a]]
    for (const [tx, ty, awn] of stalls) {
      if (this.zone.roles[ty]?.[tx] === 'wall') continue
      const sx = tx * TILE_SIZE + TILE_SIZE / 2, sy = ty * TILE_SIZE + TILE_SIZE / 2
      const sg = this.add.graphics().setDepth(sy)
      sg.fillStyle(0x000000, 0.16).fillEllipse(sx, sy + 4, 24, 7)
      sg.fillStyle(0x6b4a2c, 1).fillRect(sx - 12, sy - 4, 24, 8)                  // counter
      sg.fillStyle(0x4a3620, 1).fillRect(sx - 12, sy - 18, 2, 14)                 // poles
      sg.fillStyle(0x4a3620, 1).fillRect(sx + 10, sy - 18, 2, 14)
      sg.fillStyle(awn, 1).fillRect(sx - 14, sy - 22, 28, 6)                      // striped awning
      sg.fillStyle(0xf5efe0, 1)
      for (let i = -12; i < 14; i += 8) sg.fillRect(sx + i, sy - 22, 4, 6)
    }
  }

  private drawSafePocketHint() {
    // faint warm glow over the learning-safe pockets (plaza + inn quarter) — shape cue, not colour-only
    const g = this.add.graphics().setDepth(-9)
    for (const sp of this.zone.safePockets) {
      g.fillStyle(0xffe9b3, 0.05)
      g.fillRect(sp.minX * TILE_SIZE, sp.minY * TILE_SIZE, (sp.maxX - sp.minX + 1) * TILE_SIZE, (sp.maxY - sp.minY + 1) * TILE_SIZE)
    }
  }

  private shade(hex: number, f: number): number {
    const r = Math.min(255, Math.round(((hex >> 16) & 255) * f))
    const g = Math.min(255, Math.round(((hex >> 8) & 255) * f))
    const b = Math.min(255, Math.round((hex & 255) * f))
    return (r << 16) | (g << 8) | b
  }

  // ---- playtest tour (unchanged API) ------------------------------------------------------------

  /** Auto-walk the BFS path between spawn and a named anchor (playtest tour). */
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
      this.syncDepth()
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
    this.syncDepth()
  }

  /** y-sort the hero against buildings/props so they walk in front of / behind the town. */
  private syncDepth() {
    this.player.setDepth(this.player.y)
    this.playerShadow.setPosition(this.player.x, this.player.y).setDepth(this.player.y - 1)
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

  /** Merge same-role tiles into non-overlapping rects (row-run greedy) for clean prop draws. */
  private rectsFromRole(want: string[]): { x: number; y: number; w: number; h: number }[] {
    const { cols, rows } = this.zone
    const claimed = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
    const out: { x: number; y: number; w: number; h: number }[] = []
    const roleOf = (x: number, y: number) => this.zone.roles[y]?.[x] ?? null
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
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
