import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig, isTownFloor, getBossStats } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { getBossRequirement, describeMissingRequirements } from '../../data/bossRequirements'
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
} from '../systems/textures'
import { applyAtmosphere, createIdleBreath, addPlaque } from '../systems/atmosphere'
import { preloadBgm, playBgm, bgmKeyForBiome } from '../systems/bgm'
import { assetPath } from '../systems/textures'
import { joinDungeon, leaveRoom, requestBattle, sendBattleResult, sendSeed, mySessionId, type NetMonsterSchema } from '../systems/net'
import { RemotePlayers } from '../systems/remotePlayers'

const TILE = 32
const MAP_W = 24
const MAP_H = 18

function titleCase(slug: string): string {
  return slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export class TowerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private boss?: Phaser.Physics.Arcade.Sprite
  private bossDoor!: Phaser.Physics.Arcade.Sprite
  private floor = 2
  private inBattle = false
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private classId: HeroClassId = 'warrior'
  private theme!: MonsterTheme
  private bossUnlocked = false
  private bossSpawned = false
  private lastNotice = 0
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private hintPlaque?: ReturnType<typeof addPlaque>
  private netPlayers = new RemotePlayers(this)
  private online = false
  private pendingBattle = false

  constructor() {
    super('TowerScene')
  }

  init(data: { floor?: number; classId?: HeroClassId }) {
    this.floor = data.floor ?? 2
    this.classId = data.classId ?? this.classId
    this.inBattle = false
    this.bossSpawned = false
    this.boss = undefined
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
    const player = usePlayerStore()

    buildBiomeTextures(this, biome)
    buildSharedTextures(this)
    this.cameras.main.setBackgroundColor(biome.bg)
    this.cameras.main.fadeIn(280)

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_grass`).setDepth(0)
      }
    }

    const walls = this.physics.add.staticGroup()
    for (let x = 0; x < MAP_W; x++) {
      walls.create(x * TILE + TILE / 2, TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create(x * TILE + TILE / 2, (MAP_H - 1) * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }
    for (let y = 0; y < MAP_H; y++) {
      walls.create(TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create((MAP_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }

    const treeSpots: [number, number][] = [
      [4, 6], [10, 5], [6, 9], [3, 12], [18, 7], [20, 12], [15, 14], [8, 14], [21, 15], [13, 10],
    ]
    for (const [tx, ty] of treeSpots) {
      const tree = walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `${biome.id}_tree`)
      tree.setDepth(ty * TILE)
      tree.body.setSize(TILE * 0.5, TILE * 0.3).setOffset(TILE * 0.25, TILE * 0.6)
      this.tweens.add({ targets: tree, angle: { from: -1.5, to: 1.5 }, duration: 2600 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }

    // ---- player ----
    this.gender = player.gender
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = TILE * 2
    const startY = TILE * (MAP_H - 2)
    this.add.image(startX, startY + 12, 'shadow_blob').setDepth(startY - 1)
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // ---- boss door (top center) ----
    const doorX = (MAP_W / 2) * TILE
    const doorY = TILE * 1.6
    this.bossDoor = this.physics.add.staticSprite(doorX, doorY, 'boss_door_locked')
    this.bossDoor.setOrigin(0.5, 0.7).setDepth(doorY)
    addPlaque(this, doorX, doorY + 12, 'Boss Room', { fontSize: '10px', depth: doorY + 1 })

    // ---- 25+ themed monsters ----
    // ออนไลน์: มอนสเตอร์มาจาก server (ทุกคนในชั้นเห็นตำแหน่งเดียวกัน) / ออฟไลน์: สุ่ม local
    this.monsters = this.physics.add.group()
    this.physics.add.collider(this.monsters, walls)
    this.physics.add.collider(this.monsters, this.monsters)
    this.setupMultiplayer(config)

    // สุ่มเปลี่ยนทิศเดินทุก ~1.4 วิ: 40% เดินช้าๆ / 60% หยุด (เฉพาะ local — ตัว net ขยับตาม server)
    this.time.addEvent({
      delay: 1400, loop: true, callback: () => {
        if (this.inBattle) return
        for (const child of this.monsters.getChildren()) {
          const m = child as Phaser.Physics.Arcade.Sprite
          if (!m.active || m.getData('isBoss') || m.getData('net')) continue
          if (Math.random() < 0.4) {
            const angle = Math.random() * Math.PI * 2
            const spd = 22 + Math.random() * 18
            m.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
            m.setFlipX(Math.cos(angle) < -0.2)
          } else {
            m.setVelocity(0, 0)
          }
        }
      },
    })

    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))

    // ---- boss requirement ----
    const requirement = getBossRequirement(this.floor)
    this.bossUnlocked = describeMissingRequirements(requirement, player).length === 0
    if (this.bossUnlocked) this.openBossRoom()

    this.cursors = this.input.keyboard!.createCursorKeys()

    addPlaque(this, 8, 8, `${this.theme.nameTh}  ·  Floor ${this.floor}${config.isMilestone ? '  · WORLD BOSS' : ''}`, {
      fontSize: '13px', depth: 100, fixed: true, origin: [0, 0],
    })
    this.hintPlaque = addPlaque(this, 8, 36, this.bossUnlocked ? 'Boss room is OPEN. Enter the door at the top.' : 'Defeat monsters to meet the boss requirement.', {
      fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
    })

    // ---- atmosphere (weather / vignette / lightning) + BGM ----
    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, bgmKeyForBiome(biome.id))

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    this.events.once('shutdown', () => {
      gameEvents.off('battle:end', this.handleBattleEnd, this)
      leaveRoom()
      this.netPlayers.destroy()
    })
  }

  /** สุ่มมอนสเตอร์แบบ local (โหมดออฟไลน์ หรือใช้เป็น seed ให้ server ตอนเป็นคนแรกที่เข้าห้อง) */
  private rollMonsterSpawns(count: number) {
    const rng = Phaser.Math.RND
    return Array.from({ length: count }, (_, i) => ({
      id: `m${i}`,
      slug: this.theme.monsters[rng.between(0, this.theme.monsters.length - 1)],
      x: Phaser.Math.Between(3, MAP_W - 3) * TILE,
      y: Phaser.Math.Between(5, MAP_H - 3) * TILE,
    }))
  }

  private spawnMonsterSprite(slug: string, x: number, y: number, index: number) {
    const m = this.monsters.create(x, y, monsterTextureKey(slug)) as Phaser.Physics.Arcade.Sprite
    m.setData('slug', slug)
    const mScale = 46 / m.height
    m.setScale(mScale).setDepth(y)
    m.body.setSize(m.width * 0.42, m.height * 0.4).setOffset(m.width * 0.29, m.height * 0.4)
    m.setCollideWorldBounds(true)
    m.setAlpha(0)
    this.tweens.add({ targets: m, alpha: 1, duration: 250, delay: index * 12 })
    // หายใจ (scale pulse) แทน y-tween เพื่อไม่ตีกับ physics ตอนเดิน
    this.tweens.add({ targets: m, scaleY: mScale * 1.05, duration: 850 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    return m
  }

  /**
   * เข้าห้องดันเจี้ยนของชั้นนี้: ผู้เล่นคนอื่นโผล่ในฉาก + มอนสเตอร์ sync จาก server
   * (คนแรกที่เข้า seed รายการมอนสเตอร์ให้ server เป็นเจ้าของต่อ) — ต่อไม่ติดก็สุ่ม local ตามเดิม
   */
  private async setupMultiplayer(config: ReturnType<typeof getFloorConfig>) {
    const store = usePlayerStore()
    const room = await joinDungeon({
      name: store.displayName,
      classId: this.classId,
      gender: this.gender,
      x: this.player.x,
      y: this.player.y,
      floor: this.floor,
    })
    if (!this.scene.isActive()) { leaveRoom(); return }
    if (!room) {
      // ออฟไลน์: สุ่มมอนสเตอร์ local เหมือนเดิมทุกประการ
      for (const [i, s] of this.rollMonsterSpawns(config.monsterCount).entries()) {
        this.spawnMonsterSprite(s.slug, s.x, s.y, i)
      }
      return
    }
    this.online = true
    this.netPlayers.bind(room)
    // เสนอ seed — server รับเฉพาะตอนห้องยังว่าง (คนแรกเท่านั้น) จึงส่งได้ปลอดภัยทุกคน
    sendSeed(this.rollMonsterSpawns(config.monsterCount))

    let spawnIndex = 0
    room.state.monsters.onAdd((mon: NetMonsterSchema, id: string) => {
      if (!mon.alive) return
      const m = this.spawnMonsterSprite(mon.slug, mon.x, mon.y, spawnIndex++)
      m.setData('net', true)
      m.setData('netId', id)
      m.setData('tx', mon.x)
      m.setData('ty', mon.y)
      // ป้าย ⚔ เมื่อมีคนอื่นกำลังสู้ตัวนี้ (instanced battle lock)
      const lockMark = this.add.text(mon.x, mon.y - 30, '⚔', { fontSize: '11px' }).setOrigin(0.5, 1).setVisible(false)
      m.setData('lockMark', lockMark)
      mon.onChange(() => {
        if (!mon.alive) {
          // ตายจากผลศึกของใครก็ตาม — ทุก client เก็บซากพร้อมกัน
          lockMark.destroy()
          if (m.active) {
            m.setActive(false)
            this.tweens.add({ targets: m, alpha: 0, scaleX: 0, scaleY: 0, duration: 220, onComplete: () => m.destroy() })
          }
          return
        }
        m.setData('tx', mon.x)
        m.setData('ty', mon.y)
        m.setData('lockedBy', mon.lockedBy)
        lockMark.setVisible(mon.lockedBy !== '' && mon.lockedBy !== mySessionId())
      })
    })
  }

  private openBossRoom() {
    if (this.bossSpawned) return
    this.bossSpawned = true
    this.bossUnlocked = true
    this.bossDoor.setTexture('boss_door_open')

    const config = getFloorConfig(this.floor)
    const bx = (MAP_W / 2) * TILE
    const by = TILE * 3.4
    let boss: Phaser.Physics.Arcade.Sprite
    if (config.isMilestone) {
      // World Boss = MCA Boss sheet (idle 4 เฟรม)
      const v = bossVisualForFloor(this.floor)
      ensureWorldBossAnim(this, this.floor)
      boss = this.monsters.create(bx, by, v.textureKey) as Phaser.Physics.Arcade.Sprite
      boss.setScale(v.scale).play(v.animKey)
    } else {
      // per-floor boss = themed MCA creature, scaled up
      boss = this.monsters.create(bx, by, monsterTextureKey(this.theme.boss)) as Phaser.Physics.Arcade.Sprite
      boss.setScale(this.theme.bossScale / boss.height)
    }
    this.add.image(bx, by + 16, 'shadow_blob').setScale(boss.scaleX * 4).setDepth(by - 1).setAlpha(0.5)
    boss.setData('isBoss', true)
    boss.body.setSize(boss.width * 0.5, boss.height * 0.4).setOffset(boss.width * 0.25, boss.height * 0.4)
    boss.setDepth(by + 200)
    this.tweens.add({ targets: boss, y: by - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.boss = boss

    // ป้าย hint เป็น plaque (text+bg) — วาดใหม่ทั้งป้ายให้กรอบพอดีข้อความใหม่
    if (this.hintPlaque) {
      this.hintPlaque.label.destroy()
      this.hintPlaque.bg.destroy()
      this.hintPlaque = addPlaque(this, 8, 36, 'Boss room is OPEN. Enter the door at the top.', {
        fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
      })
    }
  }

  update(time: number) {
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
    this.idleBreath.setMoving(moving)
    this.netPlayers.update(time, this.player, this.facing, moving)

    // มอนสเตอร์: net = interpolate ไปตำแหน่ง server / local = เดินด้วย physics — depth ตาม y เสมอ
    for (const child of this.monsters.getChildren()) {
      const m = child as Phaser.Physics.Arcade.Sprite
      if (!m.active) continue
      if (m.getData('net')) {
        m.x += ((m.getData('tx') as number) - m.x) * 0.2
        m.y += ((m.getData('ty') as number) - m.y) * 0.2
        const mark = m.getData('lockMark') as Phaser.GameObjects.Text | undefined
        mark?.setPosition(m.x, m.y - 30).setDepth(m.y + 0.1)
      }
      if (!m.getData('isBoss')) m.setDepth(m.y)
    }
  }

  private onEncounterMonster(monster: Phaser.Physics.Arcade.Sprite) {
    if (this.inBattle || this.pendingBattle || !monster.active) return
    const isBoss = monster.getData('isBoss') as boolean | undefined
    if (isBoss && !this.bossUnlocked) return

    // instanced battle (ออนไลน์): ขอสิทธิ์จาก server ก่อน — มอนสเตอร์ที่เพื่อนจองอยู่สู้ไม่ได้
    if (!isBoss && monster.getData('net')) {
      const lockedBy = (monster.getData('lockedBy') as string) || ''
      if (lockedBy && lockedBy !== mySessionId()) return
      this.pendingBattle = true
      requestBattle(monster.getData('netId') as string).then((granted) => {
        this.pendingBattle = false
        if (!this.scene.isActive() || this.inBattle || !monster.active) return
        if (!granted) {
          if (this.time.now - this.lastNotice > 2500) {
            this.lastNotice = this.time.now
            gameEvents.emit('notice', { text: 'A friend is already fighting that monster!' })
          }
          return
        }
        this.startEncounter(monster, false)
      })
      return
    }

    this.startEncounter(monster, !!isBoss)
  }

  private startEncounter(monster: Phaser.Physics.Arcade.Sprite, isBoss: boolean) {
    this.inBattle = true
    monster.setData('inFight', true)
    ;(monster.body as Phaser.Physics.Arcade.Body).enable = false

    const config = getFloorConfig(this.floor)
    const slug = (monster.getData('slug') as string) ?? this.theme.boss

    // hit-flash feedback (Phaser 4: setTintFill ถูกลบ ใช้ setTint + TintModes.FILL แทน)
    monster.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)
    this.tweens.add({
      targets: monster, scaleX: monster.scaleX * 1.15, scaleY: monster.scaleY * 1.15, duration: 120, yoyo: true,
      onComplete: () => { monster.clearTint(); monster.setTintMode(Phaser.TintModes.NORMAL) },
    })

    // หยุดมอนสเตอร์ทุกตัวตอนเข้าสู้ (ตัวที่เดินอยู่จะได้ไม่ไหลต่อ)
    for (const child of this.monsters.getChildren()) {
      (child as Phaser.Physics.Arcade.Sprite).setVelocity(0, 0)
    }

    if (isBoss) {
      const stats = getBossStats(this.floor)
      const portrait = config.isMilestone
        ? bossVisualForFloor(this.floor).portrait
        : `mob-sprites/mca/${this.theme.boss}.png`
      gameEvents.emit('battle:start', {
        floor: this.floor, isBoss: true,
        name: config.isMilestone ? this.theme.worldBossName : `${titleCase(this.theme.boss)} (Boss)`,
        sprite: portrait, hp: stats.hp, atk: stats.atk, speed: config.monsterLevel + 4,
        expReward: stats.expReward, goldReward: stats.goldReward,
      })
    } else {
      gameEvents.emit('battle:start', {
        floor: this.floor, isBoss: false,
        name: titleCase(slug), sprite: `mob-sprites/mca/${slug}.png`,
        hp: config.monsterHp, atk: config.monsterAtk, speed: config.monsterLevel,
        expReward: config.expReward, goldReward: config.goldReward,
      })
    }
    this.activeMonster = monster
  }

  private activeMonster?: Phaser.Physics.Arcade.Sprite

  private handleBattleEnd = (payload: { won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    const monster = this.activeMonster
    this.activeMonster = undefined

    // แจ้งผลให้ server (มอนสเตอร์ net): ชนะ = ตายทั้งห้อง / แพ้-หนี = ปลดล็อกให้เพื่อนสู้ต่อ
    if (monster?.getData('net')) {
      sendBattleResult(monster.getData('netId') as string, payload.won && !payload.isBoss)
    }

    if (!payload.won) {
      // แพ้ = หมดสติ ฟื้นชั้นเดิม (มอนสเตอร์รีเซ็ต)
      this.scene.restart({ floor: this.floor, classId: this.classId })
      return
    }

    if (payload.isBoss) {
      // ปราบบอส → ขึ้นชั้นถัดไป (หรือหมู่บ้านถ้าครบ 10 ชั้น)
      const nextFloor = this.floor + 1
      gameEvents.emit('floor:advance', { floor: nextFloor })
      this.cameras.main.fade(260, 0, 0, 0)
      this.time.delayedCall(280, () => {
        if (isTownFloor(nextFloor)) this.scene.start('TownScene', { floor: nextFloor, classId: this.classId })
        else this.scene.start('TowerScene', { floor: nextFloor, classId: this.classId })
      })
      return
    }

    // ชนะมอนสเตอร์ทั่วไป → เก็บซาก แล้วเช็คปลดล็อกห้องบอส
    if (monster) {
      monster.setActive(false)
      this.tweens.add({ targets: monster, alpha: 0, scaleX: 0, scaleY: 0, duration: 220, onComplete: () => monster.destroy() })
    }
    if (!this.bossUnlocked) {
      const player = usePlayerStore()
      const missing = describeMissingRequirements(getBossRequirement(this.floor), player)
      if (missing.length === 0) {
        this.openBossRoom()
        gameEvents.emit('notice', { text: 'Boss room unlocked! Head to the door at the top.' })
      } else if (this.time.now - this.lastNotice > 4000) {
        this.lastNotice = this.time.now
        gameEvents.emit('notice', { text: `Boss locked — need: ${missing.join(', ')}` })
      }
    }
  }
}
