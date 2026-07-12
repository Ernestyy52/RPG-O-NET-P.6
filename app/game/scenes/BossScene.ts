import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig, isTownFloor, getBossStats } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { themeForFloor, type MonsterTheme } from '../../data/monsterThemes'
import { usePlayerStore } from '../../stores/player'
import {
  preloadSharedAssets,
  preloadFloorMonsters,
  buildBiomeTextures,
  buildSharedTextures,
  monsterTextureKey,
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
import { applyAtmosphere, createIdleBreath, addPlaque, addPortalGlow, addGearAura } from '../systems/atmosphere'
import { preloadBgm, playBgm, bgmKeyForBiome } from '../systems/bgm'

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
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private boss?: Phaser.Physics.Arcade.Sprite
  private portal?: Phaser.Physics.Arcade.Sprite
  private floor = 2
  private classId: HeroClassId = 'warrior'
  private theme!: MonsterTheme
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private inBattle = false
  private bossDown = false
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private gearAura?: Phaser.GameObjects.Image | null

  constructor() {
    super('BossScene')
  }

  init(data: { floor?: number; classId?: HeroClassId }) {
    this.floor = data.floor ?? 2
    this.classId = data.classId ?? this.classId
    this.inBattle = false
    this.bossDown = false
    this.boss = undefined
    this.portal = undefined
  }

  preload() {
    preloadSharedAssets(this)
    preloadFloorMonsters(this, this.floor)
    preloadBgm(this, bgmKeyForBiome(biomeForFloor(this.floor).id), assetPath)
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
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_grass`).setDepth(0)
      }
    }

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

    // ---- player (เข้าจากล่างกลาง) ----
    this.gender = store.gender
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = (MAP_W / 2) * TILE
    const startY = (MAP_H - 2) * TILE
    this.add.image(startX, startY + 12, 'shadow_blob').setDepth(startY - 1)
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'up'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)
    this.gearAura = addGearAura(this, store.gearAuraColor, store.gearRarity)
    this.gearAura?.setDepth(startY - 2)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
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

    const label = config.isMilestone ? this.theme.worldBossName : `${titleCase(this.theme.boss)} · Boss`
    addPlaque(this, 8, 8, `Boss Arena · Floor ${this.floor}`, { fontSize: '13px', depth: 100, fixed: true, origin: [0, 0] })
    addPlaque(this, bx, by + 22, label, { fontSize: '11px', depth: by + 1, color: '#ffd0c0' })

    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, bgmKeyForBiome(biome.id))

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    this.events.once('shutdown', () => gameEvents.off('battle:end', this.handleBattleEnd, this))
  }

  private engageBoss() {
    if (this.inBattle || this.bossDown || !this.boss?.active) return
    this.inBattle = true
    ;(this.boss.body as Phaser.Physics.Arcade.Body).enable = false
    const config = getFloorConfig(this.floor)
    const stats = getBossStats(this.floor)
    const portrait = config.isMilestone ? bossVisualForFloor(this.floor).portrait : `mob-sprites/mca/${this.theme.boss}.png`
    gameEvents.emit('battle:start', {
      floor: this.floor, isBoss: true,
      name: config.isMilestone ? this.theme.worldBossName : `${titleCase(this.theme.boss)} (Boss)`,
      sprite: portrait, hp: stats.hp, atk: stats.atk, speed: config.monsterLevel + 4,
      expReward: stats.expReward, goldReward: stats.goldReward,
    })
  }

  private handleBattleEnd = (payload: { won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    if (!payload.won) {
      // แพ้บอส → กลับห้องมอนสเตอร์ชั้นเดิม (ฟาร์มต่อ/เตรียมตัวใหม่)
      this.cameras.main.fade(260, 0, 0, 0)
      this.time.delayedCall(280, () => this.scene.start('TowerScene', { floor: this.floor, classId: this.classId }))
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
    gameEvents.emit('notice', { text: 'Boss defeated! Step into the portal to ascend.' })
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
    gameEvents.emit('floor:advance', { floor: nextFloor })
    this.cameras.main.fade(320, 0, 0, 0)
    this.time.delayedCall(340, () => {
      if (isTownFloor(nextFloor)) this.scene.start('TownScene', { floor: nextFloor, classId: this.classId })
      else this.scene.start('TowerScene', { floor: nextFloor, classId: this.classId })
    })
  }

  update() {
    if (this.inBattle) { this.player.setVelocity(0); return }
    const speed = 120
    this.player.setVelocity(0)
    let moving = false
    if (this.cursors.left?.isDown) { this.player.setVelocityX(-speed); this.facing = 'left'; moving = true }
    else if (this.cursors.right?.isDown) { this.player.setVelocityX(speed); this.facing = 'right'; moving = true }
    if (this.cursors.up?.isDown) { this.player.setVelocityY(-speed); this.facing = 'up'; moving = true }
    else if (this.cursors.down?.isDown) { this.player.setVelocityY(speed); this.facing = 'down'; moving = true }
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(this.player.y)
    this.gearAura?.setPosition(this.player.x, this.player.y + 4)
    this.idleBreath.setMoving(moving)
    if (this.boss?.active) this.boss.setDepth(this.boss.y + 200)
  }
}
