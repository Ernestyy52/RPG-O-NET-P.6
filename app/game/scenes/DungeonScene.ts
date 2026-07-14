import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { usePlayerStore } from '../../stores/player'
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
import { preloadBgm, playBgm, bgmKeyForBiome } from '../systems/bgm'
import { WORLD1_BUSHES, pickDecorTiles } from '../../data/world1/decor'
import { seedFromString } from '../../data/learning/rng'
import {
  TILE,
  resolveMovement,
  rollMonsterSpawns,
  canStartEncounter,
  getDungeonLayout,
  type DungeonLayoutId,
  type DungeonLayoutConfig,
} from '../runtime'

const DUNGEON_TILES = 'dungeon_tiles'
const DUNGEON_WALLS = 'dungeon_walls'

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
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private classId: HeroClassId = 'warrior'
  private floor = 5
  private layoutId: DungeonLayoutId = 'world01-mini'
  private layout!: DungeonLayoutConfig
  private inBattle = false
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private enteredAt = 0
  private exitArmed = false
  private foundSecrets = new Set<string>()
  private activeMonster?: Phaser.Physics.Arcade.Sprite

  constructor() {
    super('DungeonScene')
  }

  init(data: { layoutId?: DungeonLayoutId; floor?: number; classId?: HeroClassId }) {
    this.layoutId = data.layoutId ?? 'world01-mini'
    this.floor = data.floor ?? 5
    this.classId = data.classId ?? this.classId
    this.inBattle = false
    this.exitArmed = false
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
    // Inc 4: verdant foliage decor (Craftpix bushes, curated into public/world1-props/)
    for (const b of WORLD1_BUSHES) {
      if (!this.textures.exists(b.key)) this.load.image(b.key, assetPath(b.sprite))
    }
    preloadBgm(this, bgmKeyForBiome(biomeForFloor(this.floor).id), assetPath)
  }

  create() {
    this.layout = getDungeonLayout(this.layoutId)
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
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, DUNGEON_TILES, this.layout.floorGrid[y][x]).setDepth(0)
      }
    }

    // ---- walls (Y-sorted, collidable) ----
    const walls = this.physics.add.staticGroup()
    for (let y = 0; y < this.layout.rows; y++) {
      for (let x = 0; x < this.layout.cols; x++) {
        const frame = this.layout.wallGrid[y][x]
        if (frame === null) continue
        const w = walls.create(x * TILE + TILE / 2, y * TILE + TILE / 2, DUNGEON_WALLS, frame) as Phaser.Physics.Arcade.Sprite
        // wall tops sort by their tile row so the hero can walk behind upper walls (layered composition)
        w.setDepth(y * TILE)
      }
    }

    // ---- blocking props ----
    for (const p of this.layout.props) {
      const img = walls.create(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, DUNGEON_TILES, p.frame) as Phaser.Physics.Arcade.Sprite
      img.setDepth(p.y * TILE)
      if (!p.blocking) (img.body as Phaser.Physics.Arcade.StaticBody).enable = false
    }

    // ---- torch glow (mood; static, no per-frame redraw) ----
    for (const t of this.layout.torches) {
      const glow = this.add.circle(t.x * TILE + TILE / 2, t.y * TILE + TILE / 2, TILE * 1.4, 0xffb347, 0.16)
      glow.setBlendMode(Phaser.BlendModes.ADD).setDepth(1)
    }

    // ---- player ----
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = this.layout.entry.x * TILE + TILE / 2
    const startY = this.layout.entry.y * TILE + TILE / 2
    this.add.image(startX, startY + 12, 'shadow_blob').setDepth(startY - 1)
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)

    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // ---- monsters (offline, from the layout spawn regions) ----
    this.monsters = this.physics.add.group()
    this.physics.add.collider(this.monsters, walls)
    this.physics.add.collider(this.monsters, this.monsters)
    for (const region of this.layout.spawns) {
      const slots = rollMonsterSpawns(region.count, { bounds: region.bounds, slugs: [region.slug], rng: Phaser.Math.RND })
      for (const [i, s] of slots.entries()) this.spawnMonsterSprite(s.slug, s.x, s.y, i)
    }
    // ---- elites: tint + scale + nameplate (the required non-color second threat tell) ----
    for (const e of this.layout.elites) {
      const m = this.spawnMonsterSprite(e.slug, e.at.x * TILE + TILE / 2, e.at.y * TILE + TILE / 2, 0)
      m.setData('elite', true)
      m.setScale(m.scale * 1.35).setTint(0xc48bff)
      addPlaque(this, m.x, m.y - 34, 'ELITE', { fontSize: '9px', depth: 100000, color: '#e3c9ff' })
    }
    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))

    // ---- Inc 4: scatter verdant foliage on walkable floor (non-blocking, depth-sorted, deterministic) ----
    const decorReserved = [this.layout.entry, this.layout.exit, ...this.layout.secrets.map((s) => s.at), ...this.layout.elites.map((e) => e.at)]
    if (this.layout.bossGate) decorReserved.push(this.layout.bossGate)
    for (const d of pickDecorTiles(this.layout.wallGrid, decorReserved, 7, seedFromString(`decor:${this.layoutId}`))) {
      const bush = WORLD1_BUSHES[d.bush]
      if (!this.textures.exists(bush.key)) continue
      const px = d.x * TILE + TILE / 2
      const py = d.y * TILE + TILE / 2
      this.add.image(px, py + 4, bush.key).setOrigin(0.5, 0.85).setScale(30 / bush.h).setDepth(py - 1)
    }

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
      this.tweens.add({ targets: marker, alpha: 0.14, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
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

    addPlaque(this, 8, 8, `${this.layout.nameTh}  ·  ${this.layout.name}`, {
      fontSize: '13px', depth: 100, fixed: true, origin: [0, 0],
    })
    addPlaque(this, 8, 36, 'Explore the dungeon. Reach the Exit or Boss Gate.', {
      fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
    })

    // simple dungeon vignette (mood, not weather)
    const cam = this.cameras.main
    this.add.rectangle(0, 0, cam.width, cam.height, 0x07060c, 0.26).setOrigin(0).setScrollFactor(0).setDepth(90)

    playBgm(this, bgmKeyForBiome(biomeForFloor(this.floor).id))

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    const enterBoss = () => this.scene.start('BossScene', { floor: this.floor, classId: this.classId })
    gameEvents.on('boss:enter', enterBoss)
    this.events.once('shutdown', () => {
      gameEvents.off('battle:end', this.handleBattleEnd, this)
      gameEvents.off('boss:enter', enterBoss)
      // zone-scoped unload — release the dungeon sheets so long sessions don't leak textures
      if (this.textures.exists(DUNGEON_TILES)) this.textures.remove(DUNGEON_TILES)
      if (this.textures.exists(DUNGEON_WALLS)) this.textures.remove(DUNGEON_WALLS)
    })

    // world-state is read once for parity with other scenes (future ambience hooks)
    void getWorldState()

    // Inc 4: main-quest signal — the hero has entered this dungeon (bridged to the quest reducer)
    gameEvents.emit('dungeon:enter', { layoutId: this.layoutId })
  }

  private spawnMonsterSprite(slug: string, x: number, y: number, index: number): Phaser.Physics.Arcade.Sprite {
    const m = this.monsters.create(x, y, monsterTextureKey(slug)) as Phaser.Physics.Arcade.Sprite
    m.setData('slug', slug)
    const mScale = 46 / m.height
    m.setScale(mScale).setDepth(y)
    m.body.setSize(m.width * 0.42, m.height * 0.4).setOffset(m.width * 0.29, m.height * 0.4)
    m.setCollideWorldBounds(true)
    m.setAlpha(0)
    this.tweens.add({ targets: m, alpha: 1, duration: 250, delay: index * 12 })
    this.tweens.add({ targets: m, scaleY: mScale * 1.05, duration: 850 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    return m
  }

  private tryExit() {
    if (!this.exitArmed || this.inBattle) return
    // reaching the exit means the hero traversed the dungeon → main-quest "clear" signal
    gameEvents.emit('dungeon:clear', { layoutId: this.layoutId })
    this.scene.start('TowerScene', { floor: this.floor, classId: this.classId })
  }

  private tryBossGate() {
    if (this.inBattle) return
    // reaching the boss gate clears the approach dungeon → main-quest "clear" signal
    gameEvents.emit('dungeon:clear', { layoutId: this.layoutId })
    gameEvents.emit('boss:gate', { floor: this.floor })
  }

  update() {
    if (this.inBattle) { this.player.setVelocity(0); return }
    const move = resolveMovement({
      left: !!this.cursors.left?.isDown,
      right: !!this.cursors.right?.isDown,
      up: !!this.cursors.up?.isDown,
      down: !!this.cursors.down?.isDown,
    }, this.facing)
    this.facing = move.facing
    const moving = move.moving
    this.player.setVelocity(move.vx, move.vy)
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(this.player.y)
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
    for (const child of this.monsters.getChildren()) (child as Phaser.Physics.Arcade.Sprite).setVelocity(0, 0)
    gameEvents.emit('battle:start', {
      floor: this.floor,
      isBoss: false,
      name: isElite ? `Elite ${titleCase(slug)}` : titleCase(slug),
      sprite: `mob-sprites/mca/${slug}.png`,
      hp: isElite ? Math.round(config.monsterHp * 1.6) : config.monsterHp,
      atk: isElite ? Math.round(config.monsterAtk * 1.3) : config.monsterAtk,
      speed: config.monsterLevel,
      expReward: isElite ? config.expReward * 2 : config.expReward,
      goldReward: isElite ? config.goldReward * 2 : config.goldReward,
    })
    this.activeMonster = monster
  }

  private handleBattleEnd = (payload: { won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    const monster = this.activeMonster
    this.activeMonster = undefined
    if (!payload.won) {
      this.scene.restart({ layoutId: this.layoutId, floor: this.floor, classId: this.classId })
      return
    }
    if (monster) {
      monster.setActive(false)
      this.tweens.add({ targets: monster, alpha: 0, scaleX: 0, scaleY: 0, duration: 220, onComplete: () => monster.destroy() })
    }
  }
}
