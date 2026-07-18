import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { gameEvents } from '../systems/eventBus'
import { applyAtmosphere, addTorchFlicker, addPortalGlow, addWindowGlow, addPlaque, createIdleBreath, addGearAura } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { assetPath, preloadSharedAssets, buildSharedTextures, heroKey, heroIdleFrame, heroAnim, heroSheetSize, HERO_DISPLAY_H, applyStandardHeroBody } from '../systems/textures'
import { resolveMovement } from '../runtime/movement'
import { TOWN_SPEED, centeredCameraBounds } from '../scaleContract'
import { buildTownStructures } from '../systems/buildingArt'
import { joinTown, leaveRoom } from '../systems/net'
import { RemotePlayers } from '../systems/remotePlayers'
import { usePlayerStore } from '../../stores/player'
import { WeaponOverlay } from '../systems/paperdoll'
import { useSettingsStore } from '../../stores/settings'
import { TOWN_NPCS } from '../../data/world1/npcs'
import { TOWN_INTERIORS_ENABLED, interiorForEvent, INTERIOR_NPC_IDS } from '../../data/town/interiors'
import { MinimapTicker, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import type { MinimapLayout } from '../systems/eventBus'

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
// กล่องชนครอบเฉพาะ "ตัวกำแพงล่าง" ของอาคาร — เว้นแนวหลังคาให้ผู้เล่นเดินอ้อมหลังตึกได้
// (เลเยอร์ slice ด้านล่างจะบังตัวละครเอง เกิดมิติหน้า-หลังแบบ RPG จริง)
const ZONES: TownZone[] = [
  { box: [185, 100, 420, 184], door: [300, 196], event: 'town:hospital' },
  { box: [150, 340, 455, 458], door: [300, 476], event: 'town:item-shop' },
  { box: [960, 100, 1270, 192], door: [1105, 206], event: 'town:guild' },
  { box: [1090, 350, 1330, 460], door: [1185, 478], event: 'town:equipment-shop' },
  { box: [640, 62, 835, 178], door: [737, 192], event: 'portal' },
  { box: [805, 418, 950, 465] }, // บอร์ดประกาศ
  { box: [652, 618, 778, 700] }, // บ่อน้ำ
  { box: [700, 535, 750, 562] }, // ป้ายบอกทาง
]

// เลเยอร์อาคาร: ตัดจากภาพเมืองตอนรันไทม์ วางทับตำแหน่งเดิมเป๊ะ พร้อม depth = แนวตีนอาคาร
// → ผู้เล่น/มอนสเตอร์ y น้อยกว่าตีนตึก = ถูกตึกบัง (เดินอ้อมหลังได้), y มากกว่า = เดินหน้าตึก
const SLICES: { key: string; rect: [number, number, number, number] }[] = [
  { key: 'slice_hospital', rect: [160, 5, 295, 181] },
  { key: 'slice_item_shop', rect: [140, 272, 330, 190] },
  { key: 'slice_guild', rect: [950, 3, 340, 194] },
  { key: 'slice_equip', rect: [1080, 275, 265, 190] },
  { key: 'slice_portal', rect: [618, 0, 238, 183] },
  { key: 'slice_notice', rect: [798, 385, 165, 85] },
  { key: 'slice_well', rect: [645, 608, 140, 100] },
  { key: 'slice_sign', rect: [693, 502, 65, 62] },
]

// ชั้นความลึก: 0 พื้น | 1 ย้อมสีไบโอม | y-sort โลก (ผู้เล่น+slice) | 700 แสงไฟ | 1000 ป้าย UI
const DEPTH_LIGHTS = 700
const DEPTH_UI = 1000

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
  private netPlayers = new RemotePlayers(this)
  private gearAura?: Phaser.GameObjects.Image | null
  private weaponOverlay!: WeaponOverlay
  private minimapTicker = new MinimapTicker()

  constructor() {
    super('TownScene')
  }

  private spawnAt?: [number, number]

  init(data: { floor?: number; classId?: HeroClassId; spawnAt?: [number, number] }) {
    this.floor = data.floor ?? 1
    this.classId = data.classId ?? 'warrior'
    this.spawnAt = data.spawnAt // ART coords — ใช้ตอนเดินออกจาก interior ให้โผล่หน้าอาคารเดิม
  }

  preload() {
    preloadSharedAssets(this)
    if (!this.textures.exists('town_art')) {
      this.load.image('town_art', assetPath('town-art/town-night.png'))
    }
    // Inc 4: named quest-giver NPCs (Craftpix guild-hall sheets, curated into public/npc-sprites/)
    for (const npc of TOWN_NPCS) {
      const key = `npc_${npc.id}`
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, assetPath(npc.sprite), { frameWidth: npc.frameW, frameHeight: npc.frameH })
      }
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

    // เลเยอร์อาคาร (ตัดจากภาพเมืองตำแหน่งเดิมเป๊ะ) — ให้ y-sort กับผู้เล่นได้จริง
    const artSrc = this.textures.get('town_art').getSourceImage() as HTMLImageElement
    for (const slice of SLICES) {
      const [sx, sy, sw, sh] = slice.rect
      if (!this.textures.exists(slice.key)) {
        const tex = this.textures.createCanvas(slice.key, sw, sh)!
        tex.getContext().drawImage(artSrc, sx, sy, sw, sh, 0, 0, sw, sh)
        tex.refresh()
      }
      this.add.image(sx * S, (sy + sh) * S, slice.key).setOrigin(0, 1).setScale(S).setDepth((sy + sh) * S)
    }

    // ---- Inc 4: named quest-giver NPCs standing in town (decorative + flavour nameplates) ----
    const reducedMotion = useSettingsStore().reducedMotion
    for (const npc of TOWN_NPCS) {
      // NPC ที่ย้ายเข้าไปประจำในอาคารแล้ว ไม่ยืนกลางเมืองซ้ำ (Kael ยังเฝ้าพอร์ทัลข้างนอก)
      if (TOWN_INTERIORS_ENABLED && INTERIOR_NPC_IDS.has(npc.id)) continue
      const key = `npc_${npc.id}`
      if (!this.textures.exists(key)) continue // sprite missing ⇒ skip (never crash)
      const nx = u(npc.at[0])
      const ny = u(npc.at[1])
      // scale each NPC to the shared hero display height (mirrors the player) so different frame heights
      // (32px citizens vs the 52px mage) all render at a consistent, correct size — no bad crop/stretch
      const scale = HERO_DISPLAY_H / npc.frameH
      this.add.image(nx, ny + 4, 'shadow_blob').setDepth(ny - 1)
      const spr = this.add.sprite(nx, ny, key, 0).setOrigin(0.5, 0.95).setScale(scale).setDepth(ny)
      if (!reducedMotion) this.tweens.add({ targets: spr, y: ny - 3, duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) // a11y: no idle bob under reduced motion
      addPlaque(this, nx, ny - HERO_DISPLAY_H * 1.05, npc.name, { fontSize: '10px', depth: ny + 1, color: '#f2d98a' })
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
          .setBlendMode(Phaser.BlendModes.ADD).setScale(3.6).setAlpha(0).setDepth(DEPTH_LIGHTS)
        this.interactHighlights.push({ x: u(dx), y: u(dy), range: u(150), glow: highlight })
      }
    }

    // ---- เอฟเฟกต์มีชีวิตซ้อนบนภาพ ----
    // วงวนพอร์ทัลหมุน 2 ชั้นสวนทาง ทับวงวนที่วาดในภาพให้ดูไหลวน
    const [vx, vy] = [u(735), u(92)]
    const vortexBack = this.add.image(vx, vy, 'portal_vortex')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.95).setAlpha(0.35).setTint(0x7a4de0).setDepth(DEPTH_LIGHTS)
    const vortexFront = this.add.image(vx, vy, 'portal_vortex')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.78).setAlpha(0.6).setDepth(DEPTH_LIGHTS + 1)
    this.tweens.add({ targets: vortexFront, angle: 360, duration: 5200, repeat: -1 })
    this.tweens.add({ targets: vortexBack, angle: -360, duration: 8200, repeat: -1 })
    this.tweens.add({ targets: [vortexFront, vortexBack], scale: '*=1.06', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    addPortalGlow(this, vx, vy, DEPTH_LIGHTS)

    for (const [fx, fy] of PORTAL_FLAMES) {
      addTorchFlicker(this, u(fx), u(fy), DEPTH_LIGHTS, 0x5aa8ff, [0x8fd0ff, 0x4a86ff])
    }
    for (const [lx, ly] of LAMP_SPOTS) {
      addTorchFlicker(this, u(lx), u(ly), DEPTH_LIGHTS)
    }
    for (const [wx, wy] of WINDOW_SPOTS) {
      addWindowGlow(this, u(wx), u(wy), DEPTH_LIGHTS)
    }
    // น้ำในบ่อเรืองแสงเต้นช้าๆ
    const wellGlow = this.add.image(u(713), u(660), 'atmo_dot')
      .setTint(0x5a9aff).setBlendMode(Phaser.BlendModes.ADD).setScale(2.6).setAlpha(0.45).setDepth(DEPTH_LIGHTS)
    this.tweens.add({ targets: wellGlow, alpha: { from: 0.3, to: 0.6 }, scale: { from: 2.3, to: 2.9 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // ---- ผู้เล่น ----
    this.gender = usePlayerStore().gender
    const size = heroSheetSize(this.classId, this.gender)
    const scale = HERO_DISPLAY_H / size.fh // ขนาดมาตรฐานเดียวกันทุกฉาก (จำเป็นต่อ netcode ในอนาคต)
    const spawnX = u(this.spawnAt?.[0] ?? 697)
    const spawnY = u(this.spawnAt?.[1] ?? 430)
    this.add.image(spawnX, spawnY + 8, 'shadow_blob').setDepth(spawnY - 1)
    this.player = this.physics.add.sprite(spawnX, spawnY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(scale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    applyStandardHeroBody(this.player, scale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, scale)
    // ออร่าตามเครื่องแต่งกาย (paper-doll)
    const store = usePlayerStore()
    this.gearAura = addGearAura(this, store.gearAuraColor, store.gearRarity)
    this.gearAura?.setDepth(spawnY - 2)
    this.weaponOverlay = new WeaponOverlay(this)

    // กันเดินทะลุแนวรั้ว/พุ่มไม้ขอบภาพ
    this.physics.world.setBounds(u(20), u(30), worldW - u(40), WORLD_H - u(60))
    // S4: โลกเล็กกว่าจอแกนไหน ให้กล้องกึ่งกลางแกนนั้น (แทน clamp ชิดซ้ายบน)
    const camB = centeredCameraBounds(worldW, WORLD_H, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.physics.add.overlap(this.player, interactZones, (_p, z) => {
      const event = (z as Phaser.Physics.Arcade.Sprite).getData('event')
      this.tryInteract(event)
    })

    // ผู้เฝ้าประตูอนุญาต -> เข้าดันเจี้ยนจริง (สั่งจากกล่องสนทนาฝั่ง UI)
    // P0.1: แจ้งปลายทางผ่าน floor:advance ให้ store/HUD/quest sync ก่อนสลับ scene
    const enterDungeon = () => {
      gameEvents.emit('floor:advance', { floor: this.floor + 1 })
      this.scene.start('TowerScene', { floor: this.floor + 1, classId: this.classId })
    }
    gameEvents.on('town:enter-dungeon', enterDungeon)
    this.events.once('shutdown', () => gameEvents.off('town:enter-dungeon', enterDungeon))

    // ---- multiplayer: เข้าห้องเมือง (no-op ถ้าไม่มี server — เล่นออฟไลน์ปกติ) ----
    this.setupMultiplayer()
    this.events.once('shutdown', () => {
      leaveRoom()
      this.netPlayers.destroy()
    })

    this.cursors = this.input.keyboard!.createCursorKeys()

    addPlaque(this, 8, 8, `${biome.name} — Town (Floor ${this.floor})`, {
      fontSize: '13px', depth: DEPTH_UI, fixed: true, origin: [0, 0],
    })
    // ป้ายวิธีเล่นจางหายเองหลัง 8 วิ — ไม่บังฉากตอนเดินสำรวจ
    const hint = addPlaque(this, 8, 36, 'Walk into a building to use it. Approach the glowing Portal to enter the dungeon.', {
      fontSize: '10px', depth: DEPTH_UI, fixed: true, origin: [0, 0], color: '#cdb27a',
    })
    this.tweens.add({
      targets: [hint.label, hint.bg], alpha: 0, delay: 8000, duration: 700,
      onComplete: () => { hint.label.destroy(); hint.bg.destroy() },
    })

    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, 'town')

    // ---- minimap: กล่องชนอาคาร + ประตูบริการ/พอร์ทัล + NPC กลางเมือง (world px หลังคูณ scale S) ----
    const minimapLayout: MinimapLayout = {
      worldW,
      worldH: WORLD_H,
      blocks: ZONES.map((z) => ({
        x: u(z.box[0]), y: u(z.box[1]), w: u(z.box[2] - z.box[0]), h: u(z.box[3] - z.box[1]),
      })),
      markers: [
        ...ZONES.filter((z) => z.door && z.event).map((z) => ({
          kind: (z.event === 'portal' ? 'portal' : 'service') as 'portal' | 'service',
          x: u(z.door![0]), y: u(z.door![1]),
        })),
        ...TOWN_NPCS
          .filter((npc) => !(TOWN_INTERIORS_ENABLED && INTERIOR_NPC_IDS.has(npc.id)))
          .map((npc) => ({ kind: 'npc' as const, x: u(npc.at[0]), y: u(npc.at[1]) })),
      ],
    }
    publishMinimapLayout(minimapLayout)
    this.events.once('shutdown', () => clearMinimap())
  }

  update(time: number) {
    // S4: กติกาเดิน (รวม diagonal normalize) รวมที่ resolveMovement — สปีดเมืองจาก scale contract
    const move = resolveMovement({
      left: !!this.cursors.left?.isDown,
      right: !!this.cursors.right?.isDown,
      up: !!this.cursors.up?.isDown,
      down: !!this.cursors.down?.isDown,
    }, this.facing, TOWN_SPEED)
    this.player.setVelocity(move.vx, move.vy)
    this.facing = move.facing
    const moving = move.moving
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(this.player.y)
    this.gearAura?.setPosition(this.player.x, this.player.y + 4)
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment.weapon)
    this.idleBreath.setMoving(moving)
    this.netPlayers.update(time, this.player, this.facing, moving)

    // แสงบอกจุดโต้ตอบ: ค่อย ๆ เด่นขึ้นเมื่อผู้เล่นเดินเข้าใกล้
    for (const hi of this.interactHighlights) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hi.x, hi.y)
      const target = dist < hi.range ? 0.55 : 0
      hi.glow.alpha += (target - hi.glow.alpha) * 0.18
    }

    this.minimapTicker.tick(this.time.now, { player: { x: this.player.x, y: this.player.y } })
  }

  /** เข้าห้องเมือง multiplayer แล้วให้ RemotePlayers จัดการเพื่อนในฉากทั้งหมด */
  private async setupMultiplayer() {
    const store = usePlayerStore()
    const room = await joinTown({
      name: store.displayName,
      classId: this.classId,
      gender: this.gender,
      x: this.player.x,
      y: this.player.y,
    })
    if (!room || !this.scene.isActive()) return
    this.netPlayers.bind(room)
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
    // Flip TOWN_INTERIORS: ประตูอาคาร = เดินเข้าห้องภายในจริง (NPC + บริการอยู่ในนั้น)
    // flag off ⇒ เปิดบริการตรง ๆ แบบเดิมทุกประการ
    const interior = TOWN_INTERIORS_ENABLED ? interiorForEvent(event) : undefined
    if (interior) {
      this.scene.start('InteriorScene', { building: interior.id, floor: this.floor, classId: this.classId })
      return
    }
    gameEvents.emit(event as 'town:hospital' | 'town:item-shop' | 'town:equipment-shop' | 'town:guild')
  }
}
