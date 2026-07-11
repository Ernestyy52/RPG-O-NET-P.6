import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { gameEvents } from '../systems/eventBus'
import { applyAtmosphere, addTorchFlicker, addPortalGlow, addWindowGlow, addPlaque, createIdleBreath } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { assetPath, preloadSharedAssets, buildSharedTextures, heroKey, heroAnim, heroSheetSize } from '../systems/textures'
import { buildTownStructures } from '../systems/buildingArt'
import { usePlayerStore } from '../../stores/player'

// ================================================================================================
// เมืองโหมด "ภาพจริง" — ใช้ภาพ mockup (public/town-art/town-night.png, ตัด UI ออกแล้ว) เป็นฉากทั้งเมือง
// ผู้เล่นเดินบนภาพ มี collision/interact ล่องหนวางทับตำแหน่งอาคารจริงในภาพ + เอฟเฟกต์มีชีวิตซ้อนทับ
// (วงวนพอร์ทัลหมุน, ไฟโคม/หน้าต่างวิบวับ, ฝน/ฟ้าแลบตามสภาพอากาศ)
// พิกัดทั้งหมดอ้างอิง "พิกเซลภาพต้นฉบับ" (1404x712) แล้วคูณ scale ตอนสร้างฉาก — แก้จุดชนให้แก้เลขภาพตรงๆ
// ================================================================================================

const WORLD_H = 608 // สูงเท่าฉากเดิม (19 แถว x 32px) ให้กล้อง/HUD เดิมใช้ได้พอดี
const ART_W = 1404
const ART_H = 712

interface TownZone {
  /** กล่องชน (พิกัดภาพ) x0,y0,x1,y1 */
  box: [number, number, number, number]
  /** จุดยืนหน้าประตูสำหรับ trigger (พิกัดภาพ) — ไม่มี = เป็นแค่สิ่งกีดขวาง เดินชนเฉยๆ */
  door?: [number, number]
  event?: 'town:hospital' | 'town:item-shop' | 'town:equipment-shop' | 'town:guild' | 'portal'
}

// ตำแหน่งอาคาร/พร็อพ วัดจากภาพ town-night.png (ครอปจาก mockup ที่ผู้ใช้ส่งมา)
const ZONES: TownZone[] = [
  { box: [185, 55, 420, 180], door: [300, 192], event: 'town:hospital' },
  { box: [148, 295, 460, 462], door: [300, 478], event: 'town:item-shop' },
  { box: [955, 25, 1275, 192], door: [1105, 205], event: 'town:guild' },
  { box: [1085, 290, 1335, 468], door: [1185, 482], event: 'town:equipment-shop' },
  { box: [652, 5, 822, 175], door: [737, 190], event: 'portal' },
  { box: [805, 395, 955, 470] }, // บอร์ดประกาศ
  { box: [652, 618, 778, 700] }, // บ่อน้ำ
  { box: [700, 518, 750, 560] }, // ป้ายบอกทาง
]

// โคมไฟถนนที่วาดอยู่ในภาพ — วาง glow วิบวับทับหัวโคม
const LAMP_SPOTS: [number, number][] = [
  [470, 205], [985, 188], [88, 377], [520, 332], [1022, 352], [1277, 228], [963, 470], [1190, 612],
]

// หน้าต่างอาคารในภาพ — วางไฟอุ่นกะพริบให้ตึกดูมีคนอยู่
const WINDOW_SPOTS: [number, number][] = [
  [262, 128], [355, 128], // Hospital
  [215, 345], [300, 415], [390, 410], // Item Shop
  [1010, 90], [1105, 95], [1190, 90], [1032, 140], [1180, 140], // Guild Hall
  [1160, 410], [1215, 425], [1300, 408], // Equipment Shop
]

// เปลวไฟวิญญาณสีน้ำเงินรอบซุ้มพอร์ทัล (ตำแหน่งเปลวที่วาดในภาพ)
const PORTAL_FLAMES: [number, number][] = [
  [636, 60], [840, 60], [648, 160], [828, 160],
]

export class TownScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private floor = 1
  private classId: HeroClassId = 'warrior'
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private lastInteract = 0
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private interactHighlights: { x: number; y: number; range: number; glow: Phaser.GameObjects.Image }[] = []

  constructor() {
    super('TownScene')
  }

  init(data: { floor?: number; classId?: HeroClassId }) {
    this.floor = data.floor ?? 1
    this.classId = data.classId ?? 'warrior'
  }

  preload() {
    preloadSharedAssets(this)
    if (!this.textures.exists('town_art')) {
      this.load.image('town_art', assetPath('town-art/town-night.png'))
    }
    preloadBgm(this, 'town', assetPath)
  }

  create() {
    const biome = biomeForFloor(this.floor)
    buildSharedTextures(this)
    buildTownStructures(this) // ยังใช้ portal_vortex สำหรับวงวนหมุนซ้อนบนภาพ

    const S = WORLD_H / ART_H
    const worldW = Math.round(ART_W * S)
    const u = (v: number) => v * S

    this.cameras.main.setBackgroundColor(0x07060b)
    this.add.image(0, 0, 'town_art').setOrigin(0, 0).setScale(S).setDepth(0)

    // เมืองโลกอื่น (ทุก 10 ชั้น): ย้อมโทนสีตามไบโอมให้ต่างกัน โดยโครงเมืองเดียวกัน
    if (biome.id !== 'forest') {
      this.add.rectangle(0, 0, worldW, WORLD_H, biome.bg, 0.24).setOrigin(0).setDepth(1)
    }

    // ---- collision + interact จากตาราง ZONES ----
    const walls = this.physics.add.staticGroup()
    const interactZones = this.physics.add.staticGroup()
    for (const zone of ZONES) {
      const [x0, y0, x1, y1] = zone.box
      const block = walls.create(u((x0 + x1) / 2), u((y0 + y1) / 2), undefined) as Phaser.Physics.Arcade.Sprite
      block.setVisible(false)
      block.body.setSize(u(x1 - x0), u(y1 - y0))

      if (zone.door && zone.event) {
        const [dx, dy] = zone.door
        const trigger = interactZones.create(u(dx), u(dy), undefined) as Phaser.Physics.Arcade.Sprite
        trigger.setVisible(false)
        trigger.body.setSize(u(110), u(46))
        trigger.setData('event', zone.event)

        // แสงนวลบอกจุดโต้ตอบ โผล่เมื่อเดินเข้าใกล้
        const highlight = this.add.image(u(dx), u(dy), 'atmo_dot')
          .setTint(zone.event === 'portal' ? 0xd8b8ff : 0xfff2b0)
          .setBlendMode(Phaser.BlendModes.ADD).setScale(3.6).setAlpha(0).setDepth(50)
        this.interactHighlights.push({ x: u(dx), y: u(dy), range: u(150), glow: highlight })
      }
    }

    // ---- เอฟเฟกต์มีชีวิตซ้อนบนภาพ ----
    // วงวนพอร์ทัลหมุน 2 ชั้นสวนทาง ทับวงวนที่วาดในภาพให้ดูไหลวน
    const [vx, vy] = [u(735), u(92)]
    const vortexBack = this.add.image(vx, vy, 'portal_vortex')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.95).setAlpha(0.35).setTint(0x7a4de0).setDepth(2)
    const vortexFront = this.add.image(vx, vy, 'portal_vortex')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.78).setAlpha(0.6).setDepth(2.1)
    this.tweens.add({ targets: vortexFront, angle: 360, duration: 5200, repeat: -1 })
    this.tweens.add({ targets: vortexBack, angle: -360, duration: 8200, repeat: -1 })
    this.tweens.add({ targets: [vortexFront, vortexBack], scale: '*=1.06', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    addPortalGlow(this, vx, vy, 2.2)

    for (const [fx, fy] of PORTAL_FLAMES) {
      addTorchFlicker(this, u(fx), u(fy), 3, 0x5aa8ff, [0x8fd0ff, 0x4a86ff])
    }
    for (const [lx, ly] of LAMP_SPOTS) {
      addTorchFlicker(this, u(lx), u(ly), 3)
    }
    for (const [wx, wy] of WINDOW_SPOTS) {
      addWindowGlow(this, u(wx), u(wy), 2.5)
    }
    // น้ำในบ่อเรืองแสงเต้นช้าๆ
    const wellGlow = this.add.image(u(713), u(660), 'atmo_dot')
      .setTint(0x5a9aff).setBlendMode(Phaser.BlendModes.ADD).setScale(2.6).setAlpha(0.45).setDepth(2.5)
    this.tweens.add({ targets: wellGlow, alpha: { from: 0.3, to: 0.6 }, scale: { from: 2.3, to: 2.9 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // ---- ผู้เล่น ----
    this.gender = usePlayerStore().gender
    const size = heroSheetSize(this.classId, this.gender)
    const scale = 64 / size.fh // ตัวใหญ่ขึ้นให้สมส่วนกับอาคารในภาพ
    const spawnX = u(697)
    const spawnY = u(430)
    this.add.image(spawnX, spawnY + 8, 'shadow_blob').setDepth(spawnY - 1)
    this.player = this.physics.add.sprite(spawnX, spawnY, heroKey(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(scale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    this.player.body.setSize(size.fw * 0.5, size.fh * 0.22).setOffset(size.fw * 0.25, size.fh * 0.72)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, scale)

    // กันเดินทะลุแนวรั้ว/พุ่มไม้ขอบภาพ
    this.physics.world.setBounds(u(20), u(30), worldW - u(40), WORLD_H - u(60))
    this.cameras.main.setBounds(0, 0, worldW, WORLD_H)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.physics.add.overlap(this.player, interactZones, (_p, z) => {
      const event = (z as Phaser.Physics.Arcade.Sprite).getData('event')
      this.tryInteract(event)
    })

    // ผู้เฝ้าประตูอนุญาต -> เข้าดันเจี้ยนจริง (สั่งจากกล่องสนทนาฝั่ง UI)
    const enterDungeon = () => this.scene.start('TowerScene', { floor: this.floor + 1, classId: this.classId })
    gameEvents.on('town:enter-dungeon', enterDungeon)
    this.events.once('shutdown', () => gameEvents.off('town:enter-dungeon', enterDungeon))

    this.cursors = this.input.keyboard!.createCursorKeys()

    addPlaque(this, 8, 8, `${biome.name} — Town (Floor ${this.floor})`, {
      fontSize: '13px', depth: 100, fixed: true, origin: [0, 0],
    })
    // ป้ายวิธีเล่นจางหายเองหลัง 8 วิ — ไม่บังฉากตอนเดินสำรวจ
    const hint = addPlaque(this, 8, 36, 'Walk into a building to use it. Approach the glowing Portal to enter the dungeon.', {
      fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
    })
    this.tweens.add({
      targets: [hint.label, hint.bg], alpha: 0, delay: 8000, duration: 700,
      onComplete: () => { hint.label.destroy(); hint.bg.destroy() },
    })

    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, 'town')
  }

  update() {
    const speed = 130
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

    // แสงบอกจุดโต้ตอบ: ค่อย ๆ เด่นขึ้นเมื่อผู้เล่นเดินเข้าใกล้
    for (const hi of this.interactHighlights) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hi.x, hi.y)
      const target = dist < hi.range ? 0.55 : 0
      hi.glow.alpha += (target - hi.glow.alpha) * 0.18
    }
  }

  private tryInteract(event: string) {
    const now = this.time.now
    if (now - this.lastInteract < 1200) return
    this.lastInteract = now
    if (event === 'portal') {
      // เปิดกล่องสนทนาผู้เฝ้าประตู (ฝั่ง Vue) — ยังไม่เข้าดันเจี้ยนจนกว่าจะยืนยัน
      gameEvents.emit('town:portal', { floor: this.floor + 1 })
      return
    }
    gameEvents.emit(event as 'town:hospital' | 'town:item-shop' | 'town:equipment-shop' | 'town:guild')
  }
}
