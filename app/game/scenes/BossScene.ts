import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import type { AdventureRegionId } from '../../data/adventureRegions'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig, isTownFloor, getBossStats } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { themeForFloor, type MonsterTheme } from '../../data/monsterThemes'
import { usePlayerStore } from '../../stores/player'
import { WeaponOverlay } from '../systems/paperdoll'
import {
  preloadSharedAssets,
  preloadFloorMonsters,
  buildBiomeTextures,
  buildSharedTextures,
  monsterTextureKey,
  biomeFloorKey,
  bossVisualForFloor,
  ensureWorldBossAnim,
  heroKey,
  heroIdleFrame,
  heroAnim,
  heroSheetSize,
  HERO_DISPLAY_H,
  applyStandardHeroBody,
  assetPath,
} from '../systems/textures'
import { applyAtmosphere, createIdleBreath, addPlaque, addPortalGlow, addGearAura, addTorchFlicker } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { useSettingsStore } from '../../stores/settings'
import { WORLD1_BUSHES, WORLD1_DUNGEON_PROPS, DUNGEON_FIRE } from '../../data/world1/decor'
import { BIOME_BUSHES } from '../../data/floorFeatures'
import { MinimapTicker, borderRects, tileRect, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import { PlayerLocomotion } from '../systems/playerLocomotion'
import { playerAuraDepth, playerRenderDepth, playerShadowDepth } from '../runtime/renderDepth'
import { FIELD_SPEED, centeredCameraBounds } from '../scaleContract'

const TILE = 32
// ห้องบอสเล็กและปิดล้อม (ลานประลอง) — บอสตัวเดียวอยู่กลาง ผู้เล่นเข้าจากล่าง
const MAP_W = 17
const MAP_H = 13

function titleCase(slug: string): string {
  return slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * ห้องบอสเดี่ยว — แยกจากห้องมอนสเตอร์ (TowerScene) โดยสิ้นเชิง
 * เข้ามาเจอบอสตัวเดียว ปราบแล้วมี portal โผล่ให้ขึ้นชั้นต่อไป (แพ้ = กลับห้องมอนสเตอร์ชั้นเดิม)
 */
export class BossScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private locomotion!: PlayerLocomotion
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private boss?: Phaser.Physics.Arcade.Sprite
  private portal?: Phaser.Physics.Arcade.Sprite
  private floor = 2
  private mode: 'adventure' | 'ranked-tower' = 'adventure'
  private regionId?: AdventureRegionId
  private zoneId?: string
  private classId: HeroClassId = 'warrior'
  private theme!: MonsterTheme
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private inBattle = false
  private bossDown = false
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private gearAura?: Phaser.GameObjects.Image | null
  private weaponOverlay!: WeaponOverlay
  // Phase 14 Inc 3 — boss 3-phase telegraph rendering (driven by RealtimeBattle's boss:* events)
  private arenaRing?: Phaser.GameObjects.Graphics
  private arenaCx = 0
  private arenaCy = 0
  private telegraphFx?: Phaser.GameObjects.Graphics
  private phaseBanner?: Phaser.GameObjects.Text
  private minimapTicker = new MinimapTicker()

  constructor() {
    super('BossScene')
  }

  init(data: { floor?: number; classId?: HeroClassId; mode?: 'adventure' | 'ranked-tower'; regionId?: AdventureRegionId; zoneId?: string }) {
    this.floor = data.floor ?? 2
    this.mode = data.mode ?? 'adventure'
    this.regionId = data.regionId
    this.zoneId = data.zoneId
    this.classId = data.classId ?? this.classId
    this.inBattle = false
    this.bossDown = false
    this.boss = undefined
    this.portal = undefined
    this.ascending = false
  }

  preload() {
    preloadSharedAssets(this)
    preloadFloorMonsters(this, this.floor)
    preloadBgm(this, 'boss', assetPath)
    // พร็อพลานประลอง: กองไฟคู่ + ไห/ถัง + พุ่มไม้ตามไบโอม (พอดีพองาม ไม่รก)
    for (const p of [...WORLD1_BUSHES, ...WORLD1_DUNGEON_PROPS]) {
      if (!this.textures.exists(p.key)) this.load.image(p.key, assetPath(p.sprite))
    }
    if (!this.textures.exists(DUNGEON_FIRE.key)) {
      this.load.spritesheet(DUNGEON_FIRE.key, assetPath(DUNGEON_FIRE.sprite), { frameWidth: DUNGEON_FIRE.frameW, frameHeight: DUNGEON_FIRE.frameH })
    }
  }

  create() {
    const config = getFloorConfig(this.floor)
    const biome = biomeForFloor(this.floor)
    this.theme = themeForFloor(this.floor)
    const store = usePlayerStore()

    buildBiomeTextures(this, biome)
    buildSharedTextures(this)
    this.cameras.main.setBackgroundColor(biome.bg)
    this.cameras.main.fadeIn(320)

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, biomeFloorKey(biome.id, x, y)).setDepth(0)
      }
    }
    // เวทีบอส: วงแหวนหินกลางลาน + กดโทนกลางให้ดูเป็นสังเวียน
    const arenaCx = (MAP_W / 2) * TILE, arenaCy = TILE * 4.4
    this.arenaCx = arenaCx
    this.arenaCy = arenaCy
    const ring = this.add.graphics().setDepth(0.5)
    this.arenaRing = ring
    this.drawArenaRing(0xffd977)

    // กำแพงล้อมรอบ (ห้องปิด ไม่มีทางออกจนกว่าจะปราบบอส)
    const walls = this.physics.add.staticGroup()
    for (let x = 0; x < MAP_W; x++) {
      walls.create(x * TILE + TILE / 2, TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create(x * TILE + TILE / 2, (MAP_H - 1) * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }
    for (let y = 0; y < MAP_H; y++) {
      walls.create(TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create((MAP_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }
    // เสาประดับมุมลานประลอง
    for (const [tx, ty] of [[3, 3], [MAP_W - 4, 3], [3, MAP_H - 4], [MAP_W - 4, MAP_H - 4]] as [number, number][]) {
      const tree = walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `${biome.id}_tree`)
      tree.setDepth(ty * TILE)
      tree.body.setSize(TILE * 0.5, TILE * 0.3).setOffset(TILE * 0.25, TILE * 0.6)
    }

    // ---- ตกแต่งลานประลองตามไบโอม: กองไฟคู่ขนาบสังเวียน + ไห/ถังข้างกำแพง + พุ่มไม้ประจำไบโอม ----
    const reducedFx = useSettingsStore().reducedMotion
    if (this.textures.exists(DUNGEON_FIRE.key) && !this.anims.exists('w1_brazier')) {
      this.anims.create({
        key: 'w1_brazier',
        frames: DUNGEON_FIRE.frames.map((f) => ({ key: DUNGEON_FIRE.key, frame: f })),
        frameRate: 8,
        repeat: -1,
      })
    }
    if (this.textures.exists(DUNGEON_FIRE.key)) {
      for (const fx of [arenaCx - TILE * 4.2, arenaCx + TILE * 4.2]) {
        const flame = this.add.sprite(fx, arenaCy, DUNGEON_FIRE.key, DUNGEON_FIRE.frames[0])
          .setOrigin(0.5, 0.72).setScale((TILE * 1.15) / DUNGEON_FIRE.frameH).setDepth(arenaCy)
        if (!reducedFx && this.anims.exists('w1_brazier')) flame.play('w1_brazier')
        addTorchFlicker(this, fx, arenaCy - TILE * 0.6, arenaCy + 1)
      }
    }
    // ไห/ถังชิดกำแพงซ้าย-ขวา (decor เฉย ๆ ไม่ชน — อยู่นอกวงสังเวียน)
    const sideProps: { key: string; x: number; y: number }[] = [
      { key: 'w1prop_vase', x: TILE * 1.9, y: TILE * 5 },
      { key: 'w1prop_barrel', x: TILE * 1.9, y: TILE * 7.5 },
      { key: 'w1prop_vase', x: (MAP_W - 2) * TILE + TILE * 0.1, y: TILE * 5 },
      { key: 'w1prop_crate', x: (MAP_W - 2) * TILE + TILE * 0.1, y: TILE * 7.5 },
    ]
    for (const p of sideProps) {
      if (this.textures.exists(p.key)) this.add.image(p.x, p.y, p.key).setOrigin(0.5, 0.85).setDepth(p.y)
    }
    // พุ่มไม้สีประจำไบโอมแต่งมุมล่าง (ไม่บังทางเดินเข้า)
    const bushKeys = BIOME_BUSHES[biome.id] ?? BIOME_BUSHES.forest
    for (const [i, [bx2, by2]] of ([[2.5, MAP_H - 2.4], [MAP_W - 3.5, MAP_H - 2.4]] as [number, number][]).entries()) {
      const key = bushKeys[i % bushKeys.length]
      if (this.textures.exists(key)) {
        this.add.image(bx2 * TILE, by2 * TILE, key).setScale(0.85).setDepth(by2 * TILE).setAlpha(0.95)
      }
    }

    // ---- player (เข้าจากล่างกลาง) ----
    this.gender = store.gender
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = (MAP_W / 2) * TILE
    const startY = (MAP_H - 2) * TILE
    this.playerShadow = this.add.image(startX, startY + 12, 'shadow_blob').setDepth(playerShadowDepth(startY))
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'up'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)
    this.gearAura = addGearAura(this, store.gearAuraColor, store.gearRarity)
    this.gearAura?.setDepth(playerAuraDepth(startY))
    this.weaponOverlay = new WeaponOverlay(this)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    // S4: ลานเล็กกว่าจอ → กล้องกึ่งกลาง (scale contract)
    const camB = centeredCameraBounds(MAP_W * TILE, MAP_H * TILE, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // ---- boss (กลางห้อง) ----
    const bx = (MAP_W / 2) * TILE
    const by = TILE * 4.4
    let boss: Phaser.Physics.Arcade.Sprite
    if (config.isMilestone) {
      const v = bossVisualForFloor(this.floor)
      ensureWorldBossAnim(this, this.floor)
      boss = this.physics.add.sprite(bx, by, v.textureKey)
      boss.setScale(v.scale).play(v.animKey)
    } else {
      boss = this.physics.add.sprite(bx, by, monsterTextureKey(this.theme.boss))
      boss.setScale(this.theme.bossScale / boss.height)
    }
    this.add.image(bx, by + 16, 'shadow_blob').setScale(boss.scaleX * 4).setDepth(by - 1).setAlpha(0.5)
    boss.body.setSize(boss.width * 0.5, boss.height * 0.4).setOffset(boss.width * 0.25, boss.height * 0.4)
    boss.setDepth(by + 200)
    this.tweens.add({ targets: boss, y: by - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.boss = boss
    this.physics.add.overlap(this.player, boss, () => this.engageBoss())

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.locomotion = new PlayerLocomotion(this, this.player, FIELD_SPEED, walls)

    const label = config.isMilestone ? this.theme.worldBossName : `${titleCase(this.theme.boss)} · Boss`
    addPlaque(this, 8, 8, `Boss Arena · Floor ${this.floor}`, { fontSize: '13px', depth: 100, fixed: true, origin: [0, 0] })
    addPlaque(this, bx, by + 22, label, { fontSize: '11px', depth: by + 1, color: '#ffd0c0' })

    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, 'boss')

    // ---- minimap: ลานปิดสี่เหลี่ยม + เสามุม + ตำแหน่งบอส ----
    publishMinimapLayout({
      worldW: MAP_W * TILE,
      worldH: MAP_H * TILE,
      blocks: [
        ...borderRects(MAP_W, MAP_H, TILE),
        ...([[3, 3], [MAP_W - 4, 3], [3, MAP_H - 4], [MAP_W - 4, MAP_H - 4]] as [number, number][])
          .map(([tx, ty]) => tileRect(tx, ty, TILE)),
      ],
      markers: [{ kind: 'boss', x: bx, y: by }],
    })

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    gameEvents.on('boss:phase-change', this.handlePhaseChange, this)
    gameEvents.on('boss:telegraph', this.handleTelegraph, this)
    this.events.once('shutdown', () => {
      gameEvents.off('battle:end', this.handleBattleEnd, this)
      gameEvents.off('boss:phase-change', this.handlePhaseChange, this)
      gameEvents.off('boss:telegraph', this.handleTelegraph, this)
      clearMinimap()
    })
  }

  /** Arena ring — one of the three readable phase channels (recoloured on each phase change). */
  private drawArenaRing(tint: number) {
    const g = this.arenaRing
    if (!g) return
    g.clear()
    g.fillStyle(0x000000, 0.14).fillCircle(this.arenaCx, this.arenaCy, TILE * 3.3)
    g.lineStyle(3, 0x1a120a, 0.5).strokeCircle(this.arenaCx, this.arenaCy, TILE * 3.2)
    g.lineStyle(1.5, tint, 0.45).strokeCircle(this.arenaCx, this.arenaCy, TILE * 3.0)
  }

  // ---- boss telegraph channels (color + banner text + attack-pattern shape) --------------------

  private handlePhaseChange = (p: { phase: 1 | 2 | 3; tint: number; name: string; nameTh: string }) => {
    const reduced = useSettingsStore().reducedMotion
    this.drawArenaRing(p.tint)
    if (this.boss?.active) this.boss.setTint(p.tint)
    // channel 2: readable phase banner (always shown; the non-motion tell)
    this.phaseBanner?.destroy()
    this.phaseBanner = this.add.text(this.arenaCx, this.arenaCy - TILE * 4, `Phase ${p.phase} — ${p.name}`, {
      fontFamily: 'monospace', fontSize: '15px', color: `#${p.tint.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100000)
    if (!reduced) {
      this.cameras.main.shake(180, 0.006)
      this.tweens.add({ targets: this.phaseBanner, y: this.phaseBanner.y - 10, alpha: { from: 1, to: 0.85 }, duration: 400, yoyo: true, repeat: 1 })
    }
  }

  private handleTelegraph = (t: { phase: 1 | 2 | 3; pattern: 'single' | 'double' | 'aoe-slam'; telegraphMs: number; tint: number }) => {
    const reduced = useSettingsStore().reducedMotion
    if (!this.boss?.active) return
    // channel 1/3: wind-up on the boss sprite (flash/scale) — static tint under reduced motion
    if (reduced) {
      this.boss.setTint(t.tint)
    } else {
      const baseScale = this.boss.scaleX
      this.tweens.add({ targets: this.boss, scaleX: baseScale * 1.12, scaleY: baseScale * 1.12, duration: t.telegraphMs * 0.6, yoyo: true, ease: 'Sine.easeInOut' })
      this.boss.setTint(t.tint)
      this.time.delayedCall(t.telegraphMs, () => this.boss?.active && this.boss.clearTint())
    }
    // aoe-slam: a danger circle strokes/fills the arena floor for the full wind-up before impact
    if (t.pattern === 'aoe-slam') {
      this.telegraphFx?.destroy()
      const fx = this.add.graphics().setDepth(0.6)
      fx.fillStyle(t.tint, 0.18).fillCircle(this.arenaCx, this.arenaCy, TILE * 2.6)
      fx.lineStyle(2, t.tint, 0.8).strokeCircle(this.arenaCx, this.arenaCy, TILE * 2.6)
      this.telegraphFx = fx
      if (reduced) this.time.delayedCall(t.telegraphMs, () => fx.destroy())
      else this.tweens.add({ targets: fx, alpha: { from: 0.35, to: 1 }, duration: t.telegraphMs, onComplete: () => fx.destroy() })
    }
  }

  private engageBoss() {
    if (this.inBattle || this.bossDown || !this.boss?.active) return
    this.inBattle = true
    ;(this.boss.body as Phaser.Physics.Arcade.Body).enable = false
    const config = getFloorConfig(this.floor)
    const stats = getBossStats(this.floor)
    const portrait = config.isMilestone ? bossVisualForFloor(this.floor).portrait : `mob-sprites/mca/${this.theme.boss}.png`
    gameEvents.emit('battle:start', {
      floor: this.floor, isBoss: true, monsterId: this.theme.boss, elite: true,
      name: config.isMilestone ? this.theme.worldBossName : `${titleCase(this.theme.boss)} (Boss)`,
      sprite: portrait, hp: stats.hp, atk: stats.atk, speed: config.monsterLevel + 4,
      expReward: stats.expReward, goldReward: stats.goldReward, worldMode: this.mode,
    })
  }

  private handleBattleEnd = (payload: { outcome: import('../systems/eventBus').BattleOutcome; won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    // ห้องบอสหนีไม่ได้ (ปุ่ม Flee ถูกปิด) — ผลลัพธ์มีแค่ victory/defeat
    if (!payload.won) {
      if (this.mode === 'ranked-tower') gameEvents.emit('tower:ranked-clear', { floor: this.floor, won: false })
      // แพ้บอส → กลับห้องมอนสเตอร์ชั้นเดิม (ฟาร์มต่อ/เตรียมตัวใหม่)
      this.cameras.main.fade(260, 0, 0, 0)
      this.time.delayedCall(280, () => {
        if (this.mode === 'adventure' && this.zoneId === 'myco-sanctum') {
          gameEvents.emit('world:travel-request', { mode: 'adventure', floor: 8, regionId: 'verdant-frontier', zoneId: 'deepgrove', fromZoneId: 'myco-sanctum' })
        } else this.scene.start('TowerScene', { floor: this.floor, classId: this.classId, mode: this.mode, regionId: this.regionId, zoneId: this.zoneId })
      })
      return
    }
    // ชนะบอส → บอสสลาย + เปิด portal ขึ้นชั้นต่อไป
    this.bossDown = true
    const boss = this.boss
    if (boss) {
      boss.setActive(false)
      this.tweens.add({ targets: boss, alpha: 0, scaleX: boss.scaleX * 1.4, scaleY: boss.scaleY * 1.4, duration: 500, onComplete: () => boss.destroy() })
    }
    this.time.delayedCall(400, () => this.spawnExitPortal())
    gameEvents.emit('notice', { text: this.mode === 'ranked-tower' ? 'Rank Guardian defeated! Enter the portal for the next trial.' : 'Region guardian defeated! Enter the portal to continue your adventure.' })
  }

  /** portal ทางออก โผล่กลางห้องหลังปราบบอส — เดินเข้าไป = ขึ้นชั้นถัดไป */
  private spawnExitPortal() {
    const px = (MAP_W / 2) * TILE
    const py = TILE * 4.2
    addPortalGlow(this, px, py, py - 1, 0x9ad6ff)
    const portal = this.physics.add.staticSprite(px, py, 'atmo_dot')
    portal.setTint(0x8fd0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(6).setAlpha(0.9).setDepth(py)
    portal.body.setCircle(TILE * 0.7)
    portal.body.position.set(px - TILE * 0.7, py - TILE * 0.7)
    this.tweens.add({ targets: portal, scale: { from: 5.4, to: 6.6 }, angle: 360, duration: 3000, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: portal, alpha: { from: 0.7, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.portal = portal
    addPlaque(this, px, py + 26, 'Ascend ▲', { fontSize: '11px', depth: py + 1, color: '#bcd2ff' })
    this.physics.add.overlap(this.player, portal, () => this.ascend())
  }

  private ascending = false
  private ascend() {
    if (this.ascending) return
    this.ascending = true
    const nextFloor = this.floor + 1
    if (this.mode === 'adventure' && this.zoneId === 'myco-sanctum') {
      this.cameras.main.fade(320, 0, 0, 0)
      this.time.delayedCall(340, () => {
        gameEvents.emit('world:region-complete', { regionId: 'verdant-frontier' })
        gameEvents.emit('world:travel-request', {
          mode: 'town', floor: 1, regionId: 'verdant-frontier', zoneId: 'aethergate', fromZoneId: 'myco-sanctum',
        })
      })
      return
    }
    if (this.mode === 'ranked-tower') gameEvents.emit('tower:ranked-clear', { floor: this.floor, won: true })
    else gameEvents.emit('floor:advance', { floor: nextFloor })
    this.cameras.main.fade(320, 0, 0, 0)
    this.time.delayedCall(340, () => {
      if (this.mode === 'ranked-tower') this.scene.start('TowerScene', { floor: Math.min(100, nextFloor), classId: this.classId, mode: this.mode })
      else if (isTownFloor(nextFloor)) this.scene.start('TownScene', { floor: nextFloor, classId: this.classId })
      else this.scene.start('TowerScene', { floor: nextFloor, classId: this.classId, mode: this.mode, regionId: this.regionId })
    })
  }

  update(_time: number, delta: number) {
    if (this.inBattle) { this.locomotion.stopImmediate(); return }
    const move = this.locomotion.update(this.cursors, this.facing, delta)
    this.player.setVelocity(move.vx, move.vy)
    this.facing = move.facing
    const moving = move.moving
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(playerRenderDepth(this.player.y))
    this.playerShadow.setPosition(this.player.x, this.player.y + 12).setDepth(playerShadowDepth(this.player.y))
    this.gearAura?.setPosition(this.player.x, this.player.y + 4).setDepth(playerAuraDepth(this.player.y))
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment)
    this.idleBreath.setMoving(moving)
    if (this.boss?.active) this.boss.setDepth(this.boss.y + 200)

    this.minimapTicker.tick(this.time.now, {
      player: { x: this.player.x, y: this.player.y },
      monsters: this.boss?.active ? [{ x: this.boss.x, y: this.boss.y }] : [],
    })
  }
}
