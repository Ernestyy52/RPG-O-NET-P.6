import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getAdventureZone } from '../../data/adventureZones'
import { getFloorConfig } from '../../data/floors'
import { getWorldState } from '../../data/world'
import { usePlayerStore } from '../../stores/player'
import { WeaponOverlay } from '../systems/paperdoll'
import { useSettingsStore } from '../../stores/settings'
import {
  preloadSharedAssets,
  preloadFloorMonsters,
  buildSharedTextures,
  monsterTextureKey,
  heroKey,
  heroIdleFrame,
  heroAnim,
  heroSheetSize,
  HERO_DISPLAY_H,
  applyStandardHeroBody,
  assetPath,
} from '../systems/textures'
import { createIdleBreath, addPlaque } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { WORLD1_BUSHES, WORLD1_DUNGEON_PROPS, DUNGEON_FIRE, pickDecorTiles } from '../../data/world1/decor'
import { seedFromString } from '../../data/learning/rng'
import {
  TILE,
  rollMonsterSpawns,
  canStartEncounter,
  getDungeonLayout,
  type DungeonLayoutId,
  type DungeonLayoutConfig,
} from '../runtime'
import { FIELD_SPEED, centeredCameraBounds } from '../scaleContract'
import { MinimapTicker, rectsFromWallGrid, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import { PlayerLocomotion } from '../systems/playerLocomotion'
import { playerAuraDepth, playerRenderDepth, playerShadowDepth } from '../runtime/renderDepth'
import { DAILY_RIFT_MODIFIER_LABELS, dailyActivityPlan, dailyRiftLayout, type DailyRiftModifier } from '../../data/activities'

const DUNGEON_TILES = 'dungeon_tiles'
const DUNGEON_WALLS = 'dungeon_walls'
// tiny-dungeon / walls_floor sheets are 16px source; the world grid is TILE(32)px, so every raw
// frame must display at integer 2× (scale-contract: source 16 → integer 2×). Without this the floor,
// walls and props render — and collide — at half a tile (scale-integration non-negotiable).
const TILE_DISPLAY_SCALE = TILE / 16

function titleCase(slug: string): string {
  return slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * Standalone World-1 dungeon interior (Phase 14, Increment 2). Purely additive — TowerScene routes here
 * only behind the NEW_ZONE_RUNTIME_ENABLED flag, and floors 11+ never reach it. Offline-deterministic:
 * no multiplayer/net imports (co-op lands in Phase 15). Layout comes from the tested `dungeonLayouts`
 * data; tiles are zone-scoped (loaded here, released on shutdown).
 */
export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private locomotion!: PlayerLocomotion
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private weaponOverlay!: WeaponOverlay
  private classId: HeroClassId = 'warrior'
  private floor = 5
  private layoutId: DungeonLayoutId = 'world01-mini'
  private zoneId = 'rootcellar-hollow'
  private returnZoneId = 'mosswood-trail'
  private layout!: DungeonLayoutConfig
  private inBattle = false
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private enteredAt = 0
  private exitArmed = false
  // P0.8: objective ของดันเจี้ยน — ต้องล้ม elite ครบก่อน exit/boss gate จึงเปิด
  private elitesRemaining = 0
  private lastObjectiveNotice = 0
  private foundSecrets = new Set<string>()
  private activeMonster?: Phaser.Physics.Arcade.Sprite
  private minimapTicker = new MinimapTicker()
  private dailyDate = ''
  private dailySeed = 0
  private dailyRareAssigned = false
  private dailyModifiers: DailyRiftModifier[] = []
  private dailyDeadline = 0
  private dailyTimerText?: Phaser.GameObjects.Text
  private dailyExpired = false

  constructor() {
    super('DungeonScene')
  }

  init(data: { layoutId?: DungeonLayoutId; floor?: number; classId?: HeroClassId; zoneId?: string; returnZoneId?: string; daily?: { date: string; seed: number } }) {
    this.layoutId = data.layoutId ?? 'world01-mini'
    this.floor = data.floor ?? 5
    this.classId = data.classId ?? this.classId
    this.inBattle = false
    this.zoneId = data.zoneId ?? (this.layoutId === 'world01-main' ? 'myco-sanctum' : 'rootcellar-hollow')
    this.returnZoneId = data.returnZoneId ?? (this.layoutId === 'world01-main' ? 'deepgrove' : 'mosswood-trail')
    this.exitArmed = false
    this.dailyDate = data.daily?.date ?? ''
    this.dailySeed = data.daily?.seed ?? 0
    this.dailyRareAssigned = false
    this.dailyModifiers = []
    this.dailyDeadline = 0
    this.dailyTimerText = undefined
    this.dailyExpired = false
  }

  preload() {
    preloadSharedAssets(this)
    preloadFloorMonsters(this, this.floor)
    if (!this.textures.exists(DUNGEON_TILES)) {
      this.load.spritesheet(DUNGEON_TILES, assetPath('tiny-dungeon/tilemap_packed.png'), { frameWidth: 16, frameHeight: 16 })
    }
    if (!this.textures.exists(DUNGEON_WALLS)) {
      this.load.spritesheet(DUNGEON_WALLS, assetPath('dungeon-assets/walls_floor.png'), { frameWidth: 16, frameHeight: 16 })
    }
    // Inc 4: verdant foliage + dungeon props decor (Craftpix, curated into public/world1-props/)
    for (const b of [...WORLD1_BUSHES, ...WORLD1_DUNGEON_PROPS]) {
      if (!this.textures.exists(b.key)) this.load.image(b.key, assetPath(b.sprite))
    }
    if (!this.textures.exists(DUNGEON_FIRE.key)) {
      this.load.spritesheet(DUNGEON_FIRE.key, assetPath(DUNGEON_FIRE.sprite), { frameWidth: DUNGEON_FIRE.frameW, frameHeight: DUNGEON_FIRE.frameH })
    }
    preloadBgm(this, 'dungeon', assetPath)
  }

  create() {
    const authoredLayout = getDungeonLayout(this.layoutId)
    const dailyPlan = this.dailyDate ? dailyActivityPlan(this.dailyDate, this.floor) : undefined
    this.dailyModifiers = dailyPlan?.modifiers ?? []
    this.layout = dailyPlan ? dailyRiftLayout(dailyPlan, authoredLayout) : authoredLayout
    this.enteredAt = this.time.now
    const store = usePlayerStore()
    this.gender = store.gender

    buildSharedTextures(this)
    const worldW = this.layout.cols * TILE
    const worldH = this.layout.rows * TILE
    this.cameras.main.setBackgroundColor(0x0d0b14)
    this.cameras.main.fadeIn(280)

    // ---- floor tiles ----
    for (let y = 0; y < this.layout.rows; y++) {
      for (let x = 0; x < this.layout.cols; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, DUNGEON_TILES, this.layout.floorGrid[y]![x]!).setScale(TILE_DISPLAY_SCALE).setDepth(0)
      }
    }

    // ---- walls (Y-sorted, collidable) ----
    const walls = this.physics.add.staticGroup()
    for (let y = 0; y < this.layout.rows; y++) {
      for (let x = 0; x < this.layout.cols; x++) {
        const frame = this.layout.wallGrid[y]![x]!
        if (frame === null) continue
        const w = walls.create(x * TILE + TILE / 2, y * TILE + TILE / 2, DUNGEON_WALLS, frame) as Phaser.Physics.Arcade.Sprite
        // display 16px source at integer 2× and refresh the static body so collision fills the whole tile
        w.setScale(TILE_DISPLAY_SCALE).refreshBody()
        // wall tops sort by their tile row so the hero can walk behind upper walls (layered composition)
        w.setDepth(y * TILE)
      }
    }

    // ---- blocking props ----
    for (const p of this.layout.props) {
      const img = walls.create(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, DUNGEON_TILES, p.frame) as Phaser.Physics.Arcade.Sprite
      img.setScale(TILE_DISPLAY_SCALE).refreshBody()
      img.setDepth(p.y * TILE)
      if (!p.blocking) (img.body as Phaser.Physics.Arcade.StaticBody).enable = false
    }

    // ---- torch glow + animated brazier flame (Inc 4: dungeon atmosphere) ----
    const reducedMotion = useSettingsStore().reducedMotion
    if (this.textures.exists(DUNGEON_FIRE.key) && !this.anims.exists('w1_brazier')) {
      this.anims.create({
        key: 'w1_brazier',
        frames: DUNGEON_FIRE.frames.map((f) => ({ key: DUNGEON_FIRE.key, frame: f })),
        frameRate: 8,
        repeat: -1,
      })
    }
    for (const t of this.layout.torches) {
      const cx = t.x * TILE + TILE / 2
      const cy = t.y * TILE + TILE / 2
      const glow = this.add.circle(cx, cy, TILE * 1.4, 0xffb347, 0.16)
      glow.setBlendMode(Phaser.BlendModes.ADD).setDepth(1)
      if (this.textures.exists(DUNGEON_FIRE.key)) {
        // a11y: reduced motion ⇒ a STATIC flame frame (no looping animation)
        const flame = this.add.sprite(cx, cy, DUNGEON_FIRE.key, DUNGEON_FIRE.frames[0]).setOrigin(0.5, 0.72).setScale((TILE * 1.1) / DUNGEON_FIRE.frameH).setDepth(cy)
        if (!reducedMotion && this.anims.exists('w1_brazier')) flame.play('w1_brazier')
      }
    }

    // ---- player ----
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = this.layout.entry.x * TILE + TILE / 2
    const startY = this.layout.entry.y * TILE + TILE / 2
    this.playerShadow = this.add.image(startX, startY + 12, 'shadow_blob').setDepth(playerShadowDepth(startY))
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)
    this.weaponOverlay = new WeaponOverlay(this)

    this.physics.world.setBounds(0, 0, worldW, worldH)
    // S4: ดันเจี้ยนเล็กกว่าจอ → กล้องกึ่งกลาง (scale contract)
    const camB = centeredCameraBounds(worldW, worldH, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // ---- monsters (offline, from the layout spawn regions) ----
    this.monsters = this.physics.add.group()
    this.physics.add.collider(this.monsters, walls)
    this.physics.add.collider(this.monsters, this.monsters)
    for (const region of this.layout.spawns) {
      const slots = rollMonsterSpawns(region.count, { bounds: region.bounds, slugs: [region.slug], rng: Phaser.Math.RND })
      for (const [i, s] of slots.entries()) {
        const monster = this.spawnMonsterSprite(s.slug, s.x, s.y, i)
        if (this.dailyDate && !this.dailyRareAssigned) {
          this.dailyRareAssigned = true
          monster.setData('rare', true)
          monster.setScale(monster.scale * 1.22).setTint(0xffd15c)
          const badge = addPlaque(this, monster.x, monster.y - 34, 'RARE', { fontSize: '9px', depth: 100000, color: '#ffe8a3' })
          monster.setData('variantLabel', badge)
          gameEvents.emit('audio:sfx', { key: 'elite_spawn' })
        }
      }
    }
    // ---- elites: tint + scale + nameplate (the required non-color second threat tell) ----
    this.elitesRemaining = this.layout.elites.length // P0.8: objective ของดันเจี้ยนนี้
    for (const e of this.layout.elites) {
      const m = this.spawnMonsterSprite(e.slug, e.at.x * TILE + TILE / 2, e.at.y * TILE + TILE / 2, 0)
      m.setData('elite', true)
      m.setScale(m.scale * 1.35).setTint(0xc48bff)
      addPlaque(this, m.x, m.y - 34, 'ELITE', { fontSize: '9px', depth: 100000, color: '#e3c9ff' })
    }
    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))

    // ---- Inc 4: dress the dungeon — foliage + props on walkable floor (non-blocking, depth-sorted,
    // deterministic; NOT added to wallGrid, so the proven reachability is untouched) ----
    const decorReserved = [this.layout.entry, this.layout.exit, ...this.layout.secrets.map((s) => s.at), ...this.layout.elites.map((e) => e.at)]
    if (this.layout.bossGate) decorReserved.push(this.layout.bossGate)
    const placeDecor = (px: number, py: number, d: { key: string; h: number }) => {
      if (!this.textures.exists(d.key)) return
      this.add.image(px, py + 4, d.key).setOrigin(0.5, 0.9).setScale(30 / d.h).setDepth(py - 1)
    }
    const bushTiles = pickDecorTiles(this.layout.wallGrid, decorReserved, 7, seedFromString(`bush:${this.layoutId}`))
    for (const d of bushTiles) placeDecor(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2, WORLD1_BUSHES[d.bush]!)
    // props go on DIFFERENT tiles (bush tiles reserved so they never stack)
    const propTiles = pickDecorTiles(this.layout.wallGrid, [...decorReserved, ...bushTiles], 4, seedFromString(`prop:${this.layoutId}`))
    for (const d of propTiles) placeDecor(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2, WORLD1_DUNGEON_PROPS[d.bush % WORLD1_DUNGEON_PROPS.length]!)

    // ---- exit stairs (returns to the owning tower floor) ----
    const exitX = this.layout.exit.x * TILE + TILE / 2
    const exitY = this.layout.exit.y * TILE + TILE / 2
    const exitZone = this.physics.add.staticImage(exitX, exitY - TILE, 'boss_door_open').setDepth(exitY)
    addPlaque(this, exitX, exitY - TILE - 16, 'Exit', { fontSize: '9px', depth: exitY + 1 })
    this.physics.add.overlap(this.player, exitZone, () => this.tryExit())

    // ---- boss gate (world01-main only) ----
    if (this.layout.bossGate) {
      const gx = this.layout.bossGate.x * TILE + TILE / 2
      const gy = this.layout.bossGate.y * TILE + TILE / 2
      const gate = this.physics.add.staticImage(gx, gy, 'boss_door_locked').setOrigin(0.5, 0.7).setDepth(gy)
      addPlaque(this, gx, gy + 14, 'Boss Gate', { fontSize: '10px', depth: gy + 1 })
      this.physics.add.overlap(this.player, gate, () => this.tryBossGate())
    }

    // ---- hidden secrets (Inc 4): a faint glow marks each; overlapping it once reveals the reward ----
    this.foundSecrets = new Set<string>()
    for (const s of this.layout.secrets) {
      const sx = s.at.x * TILE + TILE / 2
      const sy = s.at.y * TILE + TILE / 2
      const marker = this.add.circle(sx, sy, TILE * 0.34, 0xffe08a, 0.45).setDepth(sy)
      if (!reducedMotion) this.tweens.add({ targets: marker, alpha: 0.14, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) // a11y: static glow under reduced motion
      const zone = this.add.zone(sx, sy, TILE * 1.2, TILE * 1.2)
      this.physics.add.existing(zone, true)
      this.physics.add.overlap(this.player, zone, () => {
        if (this.foundSecrets.has(s.id)) return
        this.foundSecrets.add(s.id)
        marker.setFillStyle(0x6ee7a0, 0.7)
        this.tweens.add({ targets: marker, scale: 1.6, alpha: 0, duration: 500 })
        gameEvents.emit('secret:found', { id: s.id })
      })
    }

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.locomotion = new PlayerLocomotion(this, this.player, FIELD_SPEED, walls)

    const displayTitle = dailyPlan ? `DAILY RIFT · ${dailyPlan.layoutVariantName}` : `${this.layout.nameTh}  ·  ${this.layout.name}`
    addPlaque(this, 8, 8, displayTitle, {
      fontSize: '13px', depth: 100, fixed: true, origin: [0, 0],
    })
    addPlaque(this, 8, 36, this.elitesRemaining > 0
      ? `Defeat ${this.elitesRemaining} Elite guardian${this.elitesRemaining > 1 ? 's' : ''} to unlock the Exit.`
      : 'Explore the dungeon. Reach the Exit or Boss Gate.', {
      fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
    })

    // simple dungeon vignette (mood, not weather)
    const cam = this.cameras.main
    this.add.rectangle(0, 0, cam.width, cam.height, 0x07060c, 0.26).setOrigin(0).setScrollFactor(0).setDepth(90)
    if (this.dailyModifiers.includes('shadowed')) {
      this.add.rectangle(0, 0, cam.width, cam.height, 0x02030a, 0.42).setOrigin(0).setScrollFactor(0).setDepth(94)
    }
    if (dailyPlan) {
      const modifierNames = dailyPlan.modifiers.map((modifier) => DAILY_RIFT_MODIFIER_LABELS[modifier].name).join(' · ')
      addPlaque(this, 8, 64, modifierNames, { fontSize: '10px', depth: 100000, fixed: true, origin: [0, 0], color: '#d9c5ff' })
      if (dailyPlan.timeLimitSec) {
        this.dailyDeadline = this.time.now + dailyPlan.timeLimitSec * 1000
        this.dailyTimerText = this.add.text(8, 90, '', {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffe29a', backgroundColor: '#130e1fcc', padding: { x: 7, y: 4 },
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(100000)
      }
    }

    playBgm(this, 'dungeon')

    gameEvents.on('battle:end', this.handleBattleEnd)
    const enterBoss = () => this.scene.start('BossScene', { floor: this.floor, classId: this.classId, mode: 'adventure', regionId: 'verdant-frontier', zoneId: 'myco-sanctum' })
    gameEvents.on('boss:enter', enterBoss)
    this.events.once('shutdown', () => {
      gameEvents.off('battle:end', this.handleBattleEnd)
      gameEvents.off('boss:enter', enterBoss)
      // zone-scoped unload — release the dungeon sheets so long sessions don't leak textures
      if (this.textures.exists(DUNGEON_TILES)) this.textures.remove(DUNGEON_TILES)
      if (this.textures.exists(DUNGEON_WALLS)) this.textures.remove(DUNGEON_WALLS)
    })

    // world-state is read once for parity with other scenes (future ambience hooks)
    void getWorldState()

    // Inc 4: main-quest signal — the hero has entered this dungeon (bridged to the quest reducer)
    if (!this.dailyDate) gameEvents.emit('dungeon:enter', { layoutId: this.layoutId })

    // ---- minimap: กำแพงจาก wallGrid (merged rects) + prop ที่ block + exit/boss gate ----
    // ความลับ (secrets) จงใจไม่ขึ้น minimap — ให้ค้นเจอด้วยตาในฉากเอง
    publishMinimapLayout({
      worldW,
      worldH,
      blocks: [
        ...rectsFromWallGrid(this.layout.wallGrid, TILE),
        ...this.layout.props.filter((p) => p.blocking).map((p) => ({ x: p.x * TILE, y: p.y * TILE, w: TILE, h: TILE })),
      ],
      markers: [
        { kind: 'exit', x: exitX, y: exitY },
        ...(this.layout.bossGate
          ? [{ kind: 'boss' as const, x: this.layout.bossGate.x * TILE + TILE / 2, y: this.layout.bossGate.y * TILE + TILE / 2 }]
          : []),
      ],
    })
    this.events.once('shutdown', () => clearMinimap())
  }

  private spawnMonsterSprite(slug: string, x: number, y: number, index: number): Phaser.Physics.Arcade.Sprite {
    const m = this.monsters.create(x, y, monsterTextureKey(slug)) as Phaser.Physics.Arcade.Sprite
    m.setData('slug', slug)
    const mScale = 46 / m.height
    m.setScale(mScale).setDepth(y)
    ;(m.body as Phaser.Physics.Arcade.Body).setSize(m.width * 0.42, m.height * 0.4).setOffset(m.width * 0.29, m.height * 0.4)
    m.setCollideWorldBounds(true)
    m.setAlpha(0)
    this.tweens.add({ targets: m, alpha: 1, duration: 250, delay: index * 12 })
    this.tweens.add({ targets: m, scaleY: mScale * 1.05, duration: 850 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    return m
  }

  /** P0.8: ดันเจี้ยน "เคลียร์" ได้เมื่อล้มผู้พิทักษ์ elite ครบเท่านั้น — เดินทะลุเฉยๆ ไม่นับ */
  private objectiveComplete(): boolean {
    return this.elitesRemaining <= 0
  }

  private notifyObjective() {
    if (this.time.now - this.lastObjectiveNotice < 2500) return
    this.lastObjectiveNotice = this.time.now
    gameEvents.emit('notice', { text: `⚔ ล้มผู้พิทักษ์ Elite อีก ${this.elitesRemaining} ตัวเพื่อปลดล็อกทางออก!` })
  }

  private returnToAdventure() {
    let target = getAdventureZone(this.returnZoneId)
    if (target.kind !== 'field' && target.kind !== 'town') target = getAdventureZone('aethergate')
    gameEvents.emit('world:travel-request', {
      mode: target.kind === 'town' ? 'town' : 'adventure',
      floor: target.rank,
      regionId: target.regionId,
      zoneId: target.id,
      fromZoneId: this.zoneId,
    })
  }

  private tryExit() {
    if (!this.exitArmed || this.inBattle) return
    if (!this.objectiveComplete()) return this.notifyObjective()
    if (this.dailyDate) {
      gameEvents.emit('daily:rift-clear', { date: this.dailyDate })
      gameEvents.emit('notice', { text: 'Daily Echo Rift cleared — reward ready on the Hunts board!' })
      this.returnToAdventure()
      return
    }
    // objective ครบ + ถึงทางออก = เคลียร์ดันเจี้ยนจริง → main-quest "clear" signal
    gameEvents.emit('dungeon:clear', { layoutId: this.layoutId })
    this.returnToAdventure()
  }

  private tryBossGate() {
    if (this.inBattle) return
    if (!this.objectiveComplete()) return this.notifyObjective()
    // reaching the boss gate clears the approach dungeon → main-quest "clear" signal
    gameEvents.emit('dungeon:clear', { layoutId: this.layoutId })
    gameEvents.emit('boss:gate', { floor: this.floor })
  }

  override update(_time: number, delta: number) {
    if (this.dailyDeadline && !this.dailyExpired) {
      const remaining = Math.max(0, Math.ceil((this.dailyDeadline - this.time.now) / 1000))
      const minutes = Math.floor(remaining / 60)
      const seconds = String(remaining % 60).padStart(2, '0')
      this.dailyTimerText?.setText(`CHRONO ${minutes}:${seconds}`)
      if (remaining <= 0) {
        this.dailyExpired = true
        gameEvents.emit('notice', { text: 'Chrono Seal closed the Rift — regroup and try again.' })
        gameEvents.emit('battle:abort', { reason: 'rift-expired' })
        this.returnToAdventure()
        return
      }
    }
    if (this.inBattle) { this.locomotion.stopImmediate(); return }
    const move = this.locomotion.update(this.cursors, this.facing, delta)
    this.facing = move.facing
    const moving = move.moving
    this.player.setVelocity(move.vx, move.vy)
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(playerRenderDepth(this.player.y))
    this.playerShadow.setPosition(this.player.x, this.player.y + 12).setDepth(playerShadowDepth(this.player.y))
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment)
    this.idleBreath.setMoving(moving)

    // arm the exit only after the hero has stepped off the entry tile (no instant re-exit on spawn)
    if (!this.exitArmed) {
      const dx = this.player.x - (this.layout.entry.x * TILE + TILE / 2)
      const dy = this.player.y - (this.layout.entry.y * TILE + TILE / 2)
      if (Math.hypot(dx, dy) > TILE * 1.5) this.exitArmed = true
    }

    for (const child of this.monsters.getChildren()) {
      const m = child as Phaser.Physics.Arcade.Sprite
      if (m.active) m.setDepth(m.y)
    }

    this.minimapTicker.tick(this.time.now, {
      player: { x: this.player.x, y: this.player.y },
      monsters: this.monsters.getChildren()
        .filter((c) => (c as Phaser.Physics.Arcade.Sprite).active)
        .map((c) => ({ x: (c as Phaser.Physics.Arcade.Sprite).x, y: (c as Phaser.Physics.Arcade.Sprite).y })),
    })
  }

  private onEncounterMonster(monster: Phaser.Physics.Arcade.Sprite) {
    if (!canStartEncounter({ inBattle: this.inBattle, pendingBattle: false, monsterActive: monster.active })) return
    this.startEncounter(monster)
  }

  private startEncounter(monster: Phaser.Physics.Arcade.Sprite) {
    this.inBattle = true
    ;(monster.body as Phaser.Physics.Arcade.Body).enable = false
    const config = getFloorConfig(this.floor)
    const slug = (monster.getData('slug') as string) ?? this.layout.spawns[0]?.slug ?? 'slime'
    const isElite = !!monster.getData('elite')
    const isRare = !!monster.getData('rare')
    for (const child of this.monsters.getChildren()) (child as Phaser.Physics.Arcade.Sprite).setVelocity(0, 0)
    gameEvents.emit('battle:start', {
      floor: this.floor,
      isBoss: false,
      name: isRare ? `Rare ${titleCase(slug)}` : isElite ? `Elite ${titleCase(slug)}` : titleCase(slug),
      monsterId: slug, elite: isElite, rare: isRare,
      riftModifiers: this.dailyModifiers,
      sprite: `mob-sprites/mca/${slug}.png`,
      hp: Math.round(config.monsterHp * (isRare ? 1.9 : isElite ? 1.6 : 1)),
      atk: Math.round(config.monsterAtk * (isRare ? 1.42 : isElite ? 1.3 : 1)),
      speed: config.monsterLevel + (isRare ? 2 : isElite ? 1 : 0) + (this.dailyModifiers.includes('swift') ? 4 : 0),
      expReward: Math.round(config.expReward * (isRare ? 2.6 : isElite ? 2 : 1)),
      goldReward: Math.round(config.goldReward * (isRare ? 2.8 : isElite ? 2 : 1)),
    })
    this.activeMonster = monster
  }

  private handleBattleEnd = (payload: { outcome: import('../systems/eventBus').BattleOutcome; won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    const monster = this.activeMonster
    this.activeMonster = undefined
    // P0.3: หนีสำเร็จ = ถอยมาเดินต่อ — มอนสเตอร์ตัวเดิมยังอยู่ (เปิด body คืนหลังช่วงกันชน)
    if (payload.outcome === 'escaped') {
      if (monster?.active) {
        this.time.delayedCall(1200, () => {
          if (monster.active) (monster.body as Phaser.Physics.Arcade.Body).enable = true
        })
      }
      return
    }
    if (payload.outcome === 'defeat') {
      this.scene.restart({ layoutId: this.layoutId, floor: this.floor, classId: this.classId, zoneId: this.zoneId, returnZoneId: this.returnZoneId, daily: this.dailyDate ? { date: this.dailyDate, seed: this.dailySeed } : undefined })
      return
    }
    if (monster) {
      // P0.8: นับ elite ที่ล้มได้ — ครบเมื่อไรทางออก/ประตูบอสจึงเปิด
      if (monster.getData('elite')) {
        this.elitesRemaining = Math.max(0, this.elitesRemaining - 1)
        gameEvents.emit('notice', {
          text: this.elitesRemaining > 0
            ? `⚔ Elite ล้มแล้ว! เหลืออีก ${this.elitesRemaining} ตัว`
            : '✅ ผู้พิทักษ์หมดแล้ว — ทางออกปลดล็อก!',
        })
      }
      const variantLabel = monster.getData('variantLabel') as ReturnType<typeof addPlaque> | undefined
      variantLabel?.label.destroy()
      variantLabel?.bg.destroy()
      monster.setActive(false)
      this.tweens.add({ targets: monster, alpha: 0, scaleX: 0, scaleY: 0, duration: 220, onComplete: () => monster.destroy() })
    }
  }
}
