// ================================================================================================
// ScaleLabScene — S1 greybox feel-pass + S2 hero/camera profiles + S3 scenario matrix (dev-only;
// imported solely by /dev/scale-lab which is cut from production by the pages:extend hook).
// Renders Aethergate town greybox OR an interior greybox (shop/guild) with Phaser Graphics for the
// world (never the mockup PNG — MAP_BUILD non-negotiable) plus the REAL hero atlas sprite, at the
// game's true camera/speed, so scale decisions are judged on real art and real motion.
//
// Modes: manual walk (arrows/WASD; diagonal normalized ×√2/2 — matches the game after S4),
// auto-route timing (S1), 8-direction cadence walk (S2), teleport + night + class switch (S3).
//
// Invariant: hero/view profiles change DISPLAY ONLY. Foot box stays 18×12 world px and speed
// stays TOWN_SPEED everywhere — a visual experiment must not change physics.
// ================================================================================================
import Phaser from 'phaser'
import {
  buildGreybox, buildInteriorGreybox, SCALE_PROFILES, INTERIOR_SPECS, HERO_PROFILES,
  TILE_PX, TOWN_SPEED, ROUTE_TARGETS, measureRoutes, shortestPath,
  type GreyboxInstance, type HeroProfile,
} from '../runtime/scaleLab'
import { HERO_SRC_H, CLASS_SHEETS } from '../systems/heroFrames'
import { preloadSharedAssets, buildHeroAnimations, heroKey, heroIdleFrame, heroAnim } from '../systems/textures'
import type { GridXY } from '../runtime/zoneValidate'

export interface ScaleLabRouteResult {
  profile: string
  route: string
  measuredSec: number
  analyticSec: number
  targetMin: number
  targetMax: number
  inBand: boolean
}

// Foot collision box — SAME for every hero profile (18×12 world px, the game's standard body)
const FOOT_HALF_W = 9
const FOOT_H = 12

type Dir = 'down' | 'left' | 'right' | 'up'
const CADENCE_DIRS = [
  { id: 'E', dx: 1, dy: 0 }, { id: 'W', dx: -1, dy: 0 },
  { id: 'N', dx: 0, dy: -1 }, { id: 'S', dx: 0, dy: 1 },
  { id: 'NE', dx: 1, dy: -1 }, { id: 'NW', dx: -1, dy: -1 },
  { id: 'SE', dx: 1, dy: 1 }, { id: 'SW', dx: -1, dy: 1 },
] as const
const CADENCE_LEG_SEC = 0.8

export interface ScaleLabInit {
  profileId?: string // M0/M1/M2 town or shop/guild interior
  heroProfileId?: string
  zoom?: number
  night?: boolean
  classId?: string // key of CLASS_SHEETS, e.g. warrior_male / warrior_female / guardian_male
}

export class ScaleLabScene extends Phaser.Scene {
  private mapId = 'M1'
  private heroProfile!: HeroProfile
  private zoomVal = 1
  private night = false
  private heroClass = 'warrior_male'
  private box!: GreyboxInstance
  private isTown = true
  private player!: Phaser.GameObjects.Container
  private heroSprite?: Phaser.GameObjects.Sprite
  private facing: Dir = 'down'
  private moving = false
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private analytic = new Map<string, number>()
  private queue: string[] = []
  private path: GridXY[] = []
  private route = ''
  private startMs = 0
  private lastTickMs = 0
  private cadenceQueue: { id: string; dx: number; dy: number }[] = []
  private cadenceDir: { id: string; dx: number; dy: number } | null = null
  private cadencePhase: 'out' | 'back' = 'out'
  private cadenceElapsed = 0
  private metaText?: Phaser.GameObjects.Text
  private lastMetaMs = 0

  constructor() { super('ScaleLabScene') }

  init(data: ScaleLabInit) {
    this.mapId = [...SCALE_PROFILES, ...INTERIOR_SPECS].find((p) => p.id === data.profileId)?.id ?? 'M1'
    this.heroProfile = HERO_PROFILES.find((p) => p.id === data.heroProfileId) ?? HERO_PROFILES[0]!
    this.zoomVal = data.zoom ?? 1
    this.night = data.night ?? false
    this.heroClass = CLASS_SHEETS[data.classId ?? ''] ? data.classId! : 'warrior_male'
  }

  preload() {
    preloadSharedAssets(this) // hero atlas (+ tiny_town) — real art for the S2/S3 judgment
  }

  create() {
    const town = SCALE_PROFILES.find((p) => p.id === this.mapId)
    this.isTown = !!town
    this.box = town ? buildGreybox(town) : buildInteriorGreybox(INTERIOR_SPECS.find((s) => s.id === this.mapId)!)
    this.analytic.clear()
    if (this.isTown) for (const m of measureRoutes(this.box)) this.analytic.set(m.route, m.sec)
    this.queue = []
    this.path = []
    this.route = ''
    this.cadenceQueue = []
    this.cadenceDir = null

    const { cols, rows } = this.box.profile
    const W = cols * TILE_PX
    const H = rows * TILE_PX

    const g = this.add.graphics()
    g.fillStyle(this.isTown ? 0x18211a : 0x241b12, 1).fillRect(0, 0, W, H)
    // faint tile checker so walking tempo/scale reads against the ground
    g.fillStyle(0xffffff, 0.035)
    for (let y = 0; y < rows; y++) {
      for (let x = y % 2; x < cols; x += 2) g.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX)
    }
    // blocked tiles (border ring + blockers); buildings redrawn on top with names
    g.fillStyle(0x2c3140, 1)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (this.box.collision[y]![x]) g.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX)
      }
    }
    g.fillStyle(0x5a4630, 1)
    g.lineStyle(2, 0x8a6a3a, 1)
    for (const b of this.box.buildings) {
      const bx = b.tx * TILE_PX
      const by = b.ty * TILE_PX
      const bw = b.tw * TILE_PX
      const bh = b.th * TILE_PX
      g.fillRect(bx, by, bw, bh)
      g.strokeRect(bx, by, bw, bh)
      if (b.name) {
        this.add.text(bx + bw / 2, by + bh / 2, b.name, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffe9b3', align: 'center',
          wordWrap: { width: Math.max(bw - 6, 48) },
        }).setOrigin(0.5).setDepth(5)
      }
    }

    // anchors: plaza (gold), gates/doors (green/amber), waystones (cyan), cadence (purple)
    const mark = (id: string, t: GridXY) => {
      const cx = t.x * TILE_PX + TILE_PX / 2
      const cy = t.y * TILE_PX + TILE_PX / 2
      if (id === 'plaza' || id === 'center') this.add.circle(cx, cy, 8, 0xffd166, 0.9).setDepth(4)
      else if (id === 'south-gate' || id === 'door') this.add.circle(cx, cy, 7, 0x7ad97a, 0.9).setDepth(4)
      else if (id === 'cadence' || id === 'lane') this.add.circle(cx, cy, 5, 0xda77f2, 0.9).setDepth(4)
      else if (id.startsWith('waystone')) this.add.rectangle(cx, cy, 10, 10, 0x66d9e8, 0.9).setAngle(45).setDepth(4)
      else this.add.rectangle(cx, cy, 8, 8, 0xffa94d, 0.9).setDepth(4)
    }
    for (const [id, t] of Object.entries(this.box.points)) mark(id, t)

    const heroTex = this.textures.exists(heroKey('warrior', 'male'))
    if (heroTex) buildHeroAnimations(this)

    const spawnAnchor = this.isTown ? 'south-gate' : 'door'
    const spawn = this.tileCenter(this.box.points[spawnAnchor]!)
    const [cls, gender] = this.splitClass(this.heroClass)
    this.player = this.buildActor(spawn.x, spawn.y, cls, gender, 'YOU', true)

    // NPC/remote-player stand-ins at the plaza — widest + narrowest frames per S2/S3 requirement
    if (heroTex && this.isTown) {
      const plaza = this.tileCenter(this.box.points['plaza']!)
      this.buildActor(plaza.x - 56, plaza.y - 16, 'guardian', 'male', 'widest 53px', false)
      this.buildActor(plaza.x + 56, plaza.y - 16, 'warrior', 'female', 'narrowest 43px', false)
      this.buildActor(plaza.x, plaza.y + 28, 'mage', 'female', 'mage 48px', false)
    } else if (heroTex && !this.isTown) {
      const cf = this.tileCenter(this.box.points['counter-front']!)
      this.buildActor(cf.x, cf.y - TILE_PX, 'mage', 'female', 'clerk', false)
    }

    // S3 night: dusk tint over the whole world + warm lamp glow at doors (shape cue, not color only)
    if (this.night) {
      for (const [id, t] of Object.entries(this.box.points)) {
        if (!id.startsWith('door') && id !== 'south-gate') continue
        const c = this.tileCenter(t)
        this.add.circle(c.x, c.y - 10, 14, 0xffc766, 0.30).setDepth(48)
        this.add.circle(c.x, c.y - 10, 5, 0xffe0a3, 0.85).setDepth(49)
      }
      this.add.rectangle(W / 2, H / 2, W, H, 0x0a1030, 0.42).setDepth(50)
    }

    // metadata overlay — every S3 screenshot self-documents (prompt requirement)
    this.metaText = this.add.text(4, 4, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9fe8ff', backgroundColor: '#000000aa', padding: { x: 3, y: 2 },
    }).setScrollFactor(0).setDepth(1000)

    this.cameras.main.setBounds(0, 0, W, H)
    this.cameras.main.startFollow(this.player, true)
    this.cameras.main.roundPixels = true
    this.cameras.main.setZoom(this.zoomVal)

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as typeof this.wasd

    this.game.events.emit('scalelab:ready', {
      profile: this.mapId, heroProfile: this.heroProfile.id, heroTex,
      heroDisplayH: this.heroProfile.displayH, zoom: this.zoomVal,
      night: this.night, classId: this.heroClass, cols, rows, worldW: W, worldH: H,
    })
  }

  private splitClass(key: string): [string, string] {
    const i = key.lastIndexOf('_')
    return [key.slice(0, i), key.slice(i + 1)]
  }

  /** Hero-scaled actor (shadow + real atlas sprite + nameplate) anchored at the foot point.
   *  Display scale comes from the hero profile; collision/speed never change with it. */
  private buildActor(x: number, y: number, classId: string, gender: string, name: string, isPlayer: boolean): Phaser.GameObjects.Container {
    const dispH = this.heroProfile.displayH
    const children: Phaser.GameObjects.GameObject[] = [
      this.add.ellipse(0, 0, 20, 8, 0x000000, 0.35),
    ]
    if (this.textures.exists(heroKey(classId, gender))) {
      const sprite = this.add.sprite(0, 0, heroKey(classId, gender), heroIdleFrame(classId, gender))
      sprite.setOrigin(0.5, 0.92).setScale(dispH / HERO_SRC_H)
      if (isPlayer) this.heroSprite = sprite
      else sprite.play(heroAnim(classId, gender, 'idle', 'down'))
      children.push(sprite)
    } else {
      // atlas missing (load failure) — rectangle fallback so the lab still works; page shows heroTex:missing
      children.push(this.add.rectangle(0, -dispH / 2, 24, dispH, 0xffd166).setStrokeStyle(1, 0x7a5a1e))
    }
    children.push(this.add.text(0, -dispH - 8, name, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', backgroundColor: '#00000066', padding: { x: 2, y: 1 },
    }).setOrigin(0.5, 1))
    return this.add.container(x, y, children).setDepth(10)
  }

  private setHeroAnim(state: 'idle' | 'walk', dir: Dir) {
    if (!this.heroSprite) return
    if (state === 'walk') { this.facing = dir; this.moving = true } else { this.moving = false }
    const [cls, gender] = this.splitClass(this.heroClass)
    const key = heroAnim(cls, gender, state, dir)
    if (this.heroSprite.anims.currentAnim?.key !== key) this.heroSprite.play(key)
  }

  /** S3: jump the hero (and camera) to a named anchor — scenario framing for the matrix. */
  teleport(anchorId: string): boolean {
    const t = this.box.points[anchorId]
    if (!t) return false
    const c = this.tileCenter(t)
    this.player.setPosition(c.x, c.y)
    this.cameras.main.centerOn(c.x, c.y)
    this.setHeroAnim('idle', 'down')
    return true
  }

  /** Queue routes (ids from ROUTE_TARGETS) to auto-walk + time. Called from the dev page. */
  runRoutes(routes: string[]) {
    if (!this.isTown) return
    this.queue = routes.filter((r) => r in ROUTE_TARGETS)
    this.nextRoute()
  }

  /** S2: out-and-back walk in all 8 directions at the cadence anchor (motion inspection). */
  runCadence() {
    const anchor = this.box.points['cadence'] ?? this.box.points['center']
    if (!anchor) return
    const c = this.tileCenter(anchor)
    this.player.setPosition(c.x, c.y)
    this.cameras.main.centerOn(c.x, c.y)
    this.cadenceQueue = [...CADENCE_DIRS]
    this.cadenceDir = null
    this.nextCadenceDir()
  }

  private nextCadenceDir() {
    const dir = this.cadenceQueue.shift()
    if (!dir) {
      this.cadenceDir = null
      this.setHeroAnim('idle', this.facing)
      this.game.events.emit('scalelab:cadence-done', { profile: this.mapId, heroProfile: this.heroProfile.id })
      return
    }
    this.cadenceDir = dir
    this.cadencePhase = 'out'
    this.cadenceElapsed = 0
    this.game.events.emit('scalelab:cadence', { dir: dir.id, heroProfile: this.heroProfile.id })
  }

  private nextRoute() {
    const route = this.queue.shift()
    if (!route) {
      this.route = ''
      this.path = []
      this.setHeroAnim('idle', this.facing)
      this.game.events.emit('scalelab:queue-done', { profile: this.mapId })
      return
    }
    const [fromId, toId] = route.split('→')
    const from = this.box.points[fromId!]
    const to = this.box.points[toId!]
    const tiles = from && to ? shortestPath(this.box.grid, from, to) : null
    if (!tiles) {
      const [mn, mx] = ROUTE_TARGETS[route]!
      this.game.events.emit('scalelab:route', {
        profile: this.mapId, route, measuredSec: -1,
        analyticSec: this.analytic.get(route) ?? -1, targetMin: mn, targetMax: mx, inBand: false,
      } satisfies ScaleLabRouteResult)
      this.nextRoute()
      return
    }
    const start = this.tileCenter(from!)
    this.player.setPosition(start.x, start.y)
    this.cameras.main.centerOn(start.x, start.y)
    this.path = tiles.slice(1)
    this.route = route
    this.startMs = performance.now()
    if (!this.path.length) this.finishRoute()
  }

  private finishRoute() {
    const measured = Number(((performance.now() - this.startMs) / 1000).toFixed(1))
    const route = this.route
    const [mn, mx] = ROUTE_TARGETS[route]!
    this.route = ''
    this.path = []
    this.setHeroAnim('idle', this.facing)
    this.game.events.emit('scalelab:route', {
      profile: this.mapId, route, measuredSec: measured,
      analyticSec: this.analytic.get(route) ?? -1, targetMin: mn, targetMax: mx,
      inBand: measured >= mn && measured <= mx,
    } satisfies ScaleLabRouteResult)
    this.time.delayedCall(250, () => this.nextRoute())
  }

  update(_time: number, deltaMs: number) {
    const dt = deltaMs / 1000
    if (this.cadenceDir) {
      // out-and-back at real speed; diagonal normalized ×√2/2 (matches the game after S4)
      const sign = this.cadencePhase === 'out' ? 1 : -1
      const dx = this.cadenceDir.dx * sign
      const dy = this.cadenceDir.dy * sign
      const f = dx !== 0 && dy !== 0 ? Math.SQRT1_2 : 1
      if (dx !== 0) {
        const nx = this.player.x + dx * TOWN_SPEED * f * dt
        if (!this.footBlocked(nx, this.player.y)) this.player.x = nx
      }
      if (dy !== 0) {
        const ny = this.player.y + dy * TOWN_SPEED * f * dt
        if (!this.footBlocked(this.player.x, ny)) this.player.y = ny
      }
      this.setHeroAnim('walk', dx !== 0 ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
      this.cadenceElapsed += dt
      if (this.cadenceElapsed >= CADENCE_LEG_SEC) {
        this.cadenceElapsed = 0
        if (this.cadencePhase === 'out') this.cadencePhase = 'back'
        else this.nextCadenceDir()
      }
    } else if (this.path.length) {
      // consume the whole frame's movement budget across waypoints — total time stays distance/speed
      let budget = TOWN_SPEED * dt
      while (budget > 0 && this.path.length) {
        const target = this.tileCenter(this.path[0]!)
        const dx = target.x - this.player.x
        const dy = target.y - this.player.y
        const dist = Math.abs(dx) + Math.abs(dy) // path steps are single-axis
        if (dx !== 0 || dy !== 0) {
          this.setHeroAnim('walk', Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up')
        }
        if (dist <= budget) {
          this.player.setPosition(target.x, target.y)
          budget -= dist
          this.path.shift()
        } else {
          this.player.setPosition(
            this.player.x + Math.sign(dx) * Math.min(budget, Math.abs(dx)),
            this.player.y + Math.sign(dy) * Math.min(budget, Math.abs(dy)),
          )
          budget = 0
        }
      }
      if (!this.path.length && this.route) this.finishRoute()
    } else if (this.cursors && this.wasd) {
      const left = this.cursors.left.isDown || this.wasd.A.isDown
      const right = this.cursors.right.isDown || this.wasd.D.isDown
      const up = this.cursors.up.isDown || this.wasd.W.isDown
      const down = this.cursors.down.isDown || this.wasd.S.isDown
      const dx = (right ? 1 : 0) - (left ? 1 : 0)
      const dy = (down ? 1 : 0) - (up ? 1 : 0)
      const f = dx !== 0 && dy !== 0 ? Math.SQRT1_2 : 1 // diagonal normalize — เท่าเกมจริง (S4)
      if (dx !== 0) {
        const nx = this.player.x + dx * TOWN_SPEED * f * dt
        if (!this.footBlocked(nx, this.player.y)) this.player.x = nx
      }
      if (dy !== 0) {
        const ny = this.player.y + dy * TOWN_SPEED * f * dt
        if (!this.footBlocked(this.player.x, ny)) this.player.y = ny
      }
      if (dx !== 0 || dy !== 0) {
        this.setHeroAnim('walk', dx !== 0 ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
      } else if (this.moving) {
        this.setHeroAnim('idle', this.facing)
      }
    }

    const now = performance.now()
    if (now - this.lastTickMs >= 150) {
      this.lastTickMs = now
      this.game.events.emit('scalelab:tick', {
        x: this.player.x, y: this.player.y, route: this.route,
        elapsedSec: this.route ? (now - this.startMs) / 1000 : 0,
      })
    }
    if (this.metaText && now - this.lastMetaMs >= 500) {
      this.lastMetaMs = now
      this.metaText.setText(
        `${this.mapId} T${TILE_PX} hero${this.heroProfile.displayH} z${this.zoomVal}`
        + `${this.night ? ' night' : ''} ${this.heroClass}`
        + ` fps${Math.round(this.game.loop.actualFps)} @${Math.round(this.player.x)},${Math.round(this.player.y)}`,
      )
    }
  }

  /** Foot-box collision (18×12 at the feet — same body as the real hero, ALL hero profiles). */
  private footBlocked(x: number, y: number): boolean {
    const corners: [number, number][] = [
      [x - FOOT_HALF_W, y - FOOT_H], [x + FOOT_HALF_W - 1, y - FOOT_H],
      [x - FOOT_HALF_W, y - 1], [x + FOOT_HALF_W - 1, y - 1],
    ]
    return corners.some(([px, py]) => this.box.grid.blocked(Math.floor(px / TILE_PX), Math.floor(py / TILE_PX)))
  }

  private tileCenter(t: GridXY): { x: number; y: number } {
    return { x: t.x * TILE_PX + TILE_PX / 2, y: t.y * TILE_PX + TILE_PX / 2 }
  }
}
