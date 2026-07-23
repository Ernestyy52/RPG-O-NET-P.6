import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { biomeForFloor } from '../../data/biomes'
import { regionForFloor } from '../../data/adventureRegions'
import { getWorldState } from '../../data/world'
import { gameEvents } from '../systems/eventBus'
import { applyAtmosphere, addTorchFlicker, addPortalGlow, addWindowGlow, addPlaque, createIdleBreath, addGearAura } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { assetPath, preloadSharedAssets, buildSharedTextures, heroKey, heroIdleFrame, heroAnim, heroSheetSize, HERO_DISPLAY_H, applyStandardHeroBody } from '../systems/textures'
import { PlayerLocomotion } from '../systems/playerLocomotion'
import { playerAuraDepth, playerRenderDepth, playerShadowDepth } from '../runtime/renderDepth'
import { TOWN_SPEED, centeredCameraBounds } from '../scaleContract'
import { buildTownStructures } from '../systems/buildingArt'
import { joinTown, leaveRoom } from '../systems/net'
import { RemotePlayers } from '../systems/remotePlayers'
import { usePlayerStore } from '../../stores/player'
import { WeaponOverlay } from '../systems/paperdoll'
import { useSettingsStore } from '../../stores/settings'
import { TOWN_NPCS } from '../../data/world1/npcs'
import { TOWN_INTERIORS_ENABLED, interiorForEvent, INTERIOR_NPC_IDS, type TownInteriorEvent } from '../../data/town/interiors'
import { AETHERGATE_DOOR_POINTS, pointInDoorRect, townDoorTriggerRect } from '../../data/town/doors'
import { MinimapTicker, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import type { MinimapLayout } from '../systems/eventBus'

// ================================================================================================
// เมืองโหมด "ภาพจริง" — Aethergate Town: ใช้ภาพ mockup ต้นฉบับ (public/town-art/aethergate-town.png
// = docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png) เป็นฉากทั้งเมือง
// ผู้เล่นเดินบนภาพ มี collision/interact ล่องหนวางทับตำแหน่งอาคารจริงในภาพ + slice อาคารตัดรันไทม์
// วางทับซ้ำเพื่อให้ y-sort เดินหน้า/หลังตึกได้ + เอฟเฟกต์มีชีวิตซ้อนทับ (วงวนพอร์ทัลหมุน, ไฟโคม/
// หน้าต่างวิบวับ, ฝน/ฟ้าแลบตามสภาพอากาศ)
// พิกัดทั้งหมดอ้างอิง "พิกเซลภาพต้นฉบับ" (1536x1024) แล้วคูณ TOWN_ART_SCALE ตอนสร้างฉาก
// (map-rebuild: docs/map-rebuild/mockup-analysis.md §Aethergate) — แก้จุดชนให้แก้เลขภาพตรงๆ
// ================================================================================================

// สเกลแสดงผลของภาพเมือง: source 1536x1024 → world 2304x1536 (hero 48px ≈ 0.8× ประตูตึก,
// กล้อง 800x600 เห็น ~1/3 เมือง = มุมสูงแบบ RPG town, เดินสำรวจได้). เลือกจาก scale test ใน
// docs/map-rebuild/mockup-analysis.md §Scale — ห้ามเปลี่ยนโดยไม่วัดสัดส่วน hero/ประตู/ถนนใหม่
const TOWN_ART_SCALE = 1.5
const ART_W = 1536
const ART_H = 1024
const WORLD_H = Math.round(ART_H * TOWN_ART_SCALE) // 1536

interface TownZone {
  /** กล่องชน (พิกัดภาพ) x0,y0,x1,y1 */
  box: [number, number, number, number]
  /** จุดยืนหน้าประตูสำหรับ trigger (พิกัดภาพ) — ไม่มี = เป็นแค่สิ่งกีดขวาง เดินชนเฉยๆ */
  door?: readonly [number, number]
  event?: TownInteriorEvent
}

// ตำแหน่งอาคาร/พร็อพ วัดจากภาพ aethergate-town.png ด้วย coordinate-grid overlay (Phase 2)
// กล่องชนครอบเฉพาะ "ตัวกำแพงล่าง" ของอาคาร — เว้นแนวหลังคาให้ผู้เล่นเดินอ้อมหลังตึกได้
// (เลเยอร์ slice ด้านล่างจะบังตัวละครเอง เกิดมิติหน้า-หลังแบบ RPG จริง)
// service→อาคาร: guild=ตึกดาบไขว้(TL) · hospital=ตึกใบไม้เขียว(TR) · equipment=โรงตีเหล็ก(กลางซ้าย)
//               item=ตึกถุงเงิน/กันสาดฟ้า(ขวา) · portal=ปราสาทพอร์ทัลสีน้ำเงิน(กลางบน)
const ZONES: TownZone[] = [
  // --- service buildings (door + event) ---
  { box: [130, 215, 350, 285], door: AETHERGATE_DOOR_POINTS.guild, event: 'town:guild' },
  { box: [670, 175, 858, 275], door: AETHERGATE_DOOR_POINTS.gatehouse, event: 'town:gatehouse' },
  { box: [1250, 220, 1432, 305], door: AETHERGATE_DOOR_POINTS.hospital, event: 'town:hospital' },
  { box: [345, 388, 495, 462], door: AETHERGATE_DOOR_POINTS['equipment-shop'], event: 'town:equipment-shop' },
  { box: [1090, 515, 1315, 612], door: AETHERGATE_DOOR_POINTS['item-shop'], event: 'town:item-shop' },
  // --- decorative buildings & landmarks (collision only) ---
  { box: [445, 178, 650, 262], door: AETHERGATE_DOOR_POINTS.library, event: 'town:library' },
  { box: [895, 188, 1075, 282], door: AETHERGATE_DOOR_POINTS['town-hall'], event: 'town:town-hall' },
  { box: [130, 468, 358, 560], door: AETHERGATE_DOOR_POINTS['crystal-shrine'], event: 'town:crystal-shrine' },
  { box: [808, 380, 975, 460], door: AETHERGATE_DOOR_POINTS['festival-hall'], event: 'town:festival-hall' },
  { box: [955, 515, 1078, 574] },  // Wooden market pavilion
  { box: [500, 515, 562, 582] },   // Notice / adventure board
  { box: [935, 720, 1122, 812], door: AETHERGATE_DOOR_POINTS.tailor, event: 'town:tailor' },
  { box: [45, 700, 292, 790], door: AETHERGATE_DOOR_POINTS.inn, event: 'town:inn' },
  { box: [345, 700, 540, 788], door: AETHERGATE_DOOR_POINTS.stable, event: 'town:stable' },
  { box: [1188, 660, 1410, 770], door: AETHERGATE_DOOR_POINTS.bank, event: 'town:bank' },
  // --- water / centre props (blockers) ---
  { box: [706, 488, 820, 586] },   // central fountain (basin only — เว้นมุมลานให้เดินอ้อมทแยงได้)
  { box: [840, 565, 905, 635] },   // waystone crystal (plaza)
  { box: [615, 882, 700, 1002] },  // arrival gate — west post
  { box: [830, 882, 908, 1002] },  // arrival gate — east post
  { box: [1030, 892, 1130, 985] }, // cherry-blossom garden tree (secret pocket)
  // --- river / stream edges (non-walkable) ---
  { box: [1452, 300, 1536, 1024] },// right-hand river
  { box: [0, 902, 200, 1024] },    // south-west river mouth (bridge at x≈210+ stays open)
]

// เลเยอร์อาคาร: ตัดจากภาพเมืองตอนรันไทม์ วางทับตำแหน่งเดิมเป๊ะ พร้อม depth = แนวตีนอาคาร
// → ผู้เล่น/มอนสเตอร์ y น้อยกว่าตีนตึก = ถูกตึกบัง (เดินอ้อมหลังได้), y มากกว่า = เดินหน้าตึก
// rect = [srcX, srcY, srcW, srcH] จากภาพต้นฉบับ (ตรงกับ docs/map-rebuild/asset-manifest.json)
const SLICES: { key: string; rect: [number, number, number, number] }[] = [
  { key: 'slice_guild', rect: [115, 95, 250, 200] },
  { key: 'slice_academy', rect: [428, 48, 235, 220] },
  { key: 'slice_portal', rect: [648, 6, 228, 275] },
  { key: 'slice_townhall', rect: [885, 40, 195, 248] },
  { key: 'slice_hospital', rect: [1238, 118, 200, 192] },
  { key: 'slice_shrine', rect: [115, 360, 250, 205] },
  { key: 'slice_forge', rect: [332, 326, 168, 140] },
  { key: 'slice_stage', rect: [805, 285, 175, 180] },
  { key: 'slice_itemshop', rect: [1085, 415, 240, 202] },
  { key: 'slice_tailor', rect: [928, 615, 200, 202] },
  { key: 'slice_inn', rect: [35, 588, 262, 205] },
  { key: 'slice_stable', rect: [332, 602, 212, 190] },
  { key: 'slice_bank', rect: [1183, 552, 232, 222] },
]

// ชั้นความลึก: 0 พื้น | 1 ย้อมสีไบโอม | y-sort โลก (ผู้เล่น+slice, สูงสุด ~worldH 1536) | แสงไฟ | ป้าย UI
// worldH ใหม่ = 1536 → hero/slice depth ทะลุ 1000 ได้ จึงยกไฟ/UI ให้อยู่เหนือทุก y-sort เสมอ
const DEPTH_LIGHTS = 4000
const DEPTH_UI = 8000

// โคมไฟถนน/ตะเกียงที่วาดในภาพ — วาง glow วิบวับทับหัวโคม (ตำแหน่ง source px)
const LAMP_SPOTS: [number, number][] = [
  [1090, 300], [472, 300], [770, 655], [648, 770], [880, 770], [1015, 470], [598, 470], [780, 385],
]

// หน้าต่างอาคารในภาพ — วางไฟอุ่นกะพริบให้ตึกดูมีคนอยู่ (source px)
const WINDOW_SPOTS: [number, number][] = [
  [175, 235], [305, 235],                 // Guild
  [500, 205], [590, 205],                 // Academy
  [960, 210], [1010, 150],                // Town Hall
  [1300, 250], [1360, 250],               // Hospital
  [1150, 560], [1265, 560],               // Item Shop
  [100, 720], [230, 720],                 // Inn
  [1000, 760], [1055, 760],               // Tailor
]

// เปลวไฟวิญญาณสีน้ำเงินรอบซุ้มพอร์ทัล (ตำแหน่งเปลวที่วาดในภาพ source px)
const PORTAL_FLAMES: [number, number][] = [
  [700, 150], [825, 150], [715, 245], [810, 245],
]

export class TownScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private locomotion!: PlayerLocomotion
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
  /** edge-triggered doorstep zones (world rect) — ยิงบริการครั้งเดียวตอนก้าวเข้า ต้องออกก่อนยิงใหม่ */
  private serviceTriggers: { rect: [number, number, number, number]; event: string; armed: boolean }[] = []

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
      this.load.image('town_art', assetPath('town-art/aethergate-town.png'))
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

    const S = TOWN_ART_SCALE
    const worldW = Math.round(ART_W * S)
    const u = (v: number) => v * S
    // จุดเกิด (world px) — คำนวณก่อนสร้างโซนประตู เพื่อเช็คว่าผู้เล่นเกิดในกรอบประตูไหนหรือไม่
    // (spawnAt มาจากการเดินออก interior; ไม่มี = ประตูเมืองใต้) → ใช้ init edge-trigger ให้ไม่ยิงทันที
    const spawnX = u(this.spawnAt?.[0] ?? 762)
    const spawnY = u(this.spawnAt?.[1] ?? 940)

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

    // ---- collision (walls) + interact (edge-triggered doorstep rects) จากตาราง ZONES ----
    // ประตูใช้ "กรอบหน้าประตู" เล็ก + edge-trigger (ยิงครั้งเดียวตอนก้าวเข้า ต้องเดินออกก่อนถึงยิงใหม่)
    // → กันบั๊ก "ออกจากอาคารแล้วโดนดูดกลับ" (spawn เดิมอยู่กลางโซน) และกันเผลอเข้าอาคารตอนเดินผ่าน
    const walls = this.physics.add.staticGroup()
    this.serviceTriggers = []
    for (const zone of ZONES) {
      const [x0, y0, x1, y1] = zone.box
      const block = walls.create(u((x0 + x1) / 2), u((y0 + y1) / 2), undefined) as Phaser.Physics.Arcade.Sprite
      block.setVisible(false)
      block.body.setSize(u(x1 - x0), u(y1 - y0))

      if (zone.door && zone.event) {
        const [dx, dy] = zone.door
        // doorstep rect (source px): แคบ + อยู่หน้าประตูเยื้องลงใต้ (ทางที่ผู้เล่นเดินเข้าหา)
        const rect = townDoorTriggerRect([dx, dy], S) as [number, number, number, number]
        const inside = pointInDoorRect(spawnX, spawnY, rect)
        this.serviceTriggers.push({ rect, event: zone.event, armed: !inside })

        // แสงนวลบอกจุดโต้ตอบ โผล่เมื่อเดินเข้าใกล้
        const highlight = this.add.image(u(dx), u(dy), 'atmo_dot')
          .setTint(zone.event === 'town:gatehouse' ? 0xd8b8ff : 0xfff2b0)
          .setBlendMode(Phaser.BlendModes.ADD).setScale(3.6).setAlpha(0).setDepth(DEPTH_LIGHTS)
        this.interactHighlights.push({ x: u(dx), y: u(dy), range: u(120), glow: highlight })
      }
    }

    // ---- เอฟเฟกต์มีชีวิตซ้อนบนภาพ ----
    // วงวนพอร์ทัลหมุน 2 ชั้นสวนทาง ทับวงวนที่วาดในภาพให้ดูไหลวน
    const [vx, vy] = [u(762), u(185)]
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
    // น้ำในน้ำพุกลางเมืองเรืองแสงเต้นช้าๆ
    const wellGlow = this.add.image(u(762), u(530), 'atmo_dot')
      .setTint(0x5a9aff).setBlendMode(Phaser.BlendModes.ADD).setScale(2.6).setAlpha(0.45).setDepth(DEPTH_LIGHTS)
    this.tweens.add({ targets: wellGlow, alpha: { from: 0.3, to: 0.6 }, scale: { from: 2.3, to: 2.9 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // ---- ผู้เล่น ----
    this.gender = usePlayerStore().gender
    const size = heroSheetSize(this.classId, this.gender)
    const scale = HERO_DISPLAY_H / size.fh // ขนาดมาตรฐานเดียวกันทุกฉาก (จำเป็นต่อ netcode ในอนาคต)
    // จุดเกิดเริ่มต้น = ช่องประตูเมืองด้านใต้ (arrival gate) — เดินขึ้นเหนือเข้าสู่ลานกลาง
    // (spawnX/spawnY คำนวณไว้ต้น create() แล้ว เพื่อ init edge-trigger ของประตู)
    this.playerShadow = this.add.image(spawnX, spawnY + 8, 'shadow_blob').setDepth(playerShadowDepth(spawnY))
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
    this.gearAura?.setDepth(playerAuraDepth(spawnY))
    this.weaponOverlay = new WeaponOverlay(this)

    // กันเดินทะลุแนวป่า/แม่น้ำขอบภาพ — inset จากขอบภาพต้นฉบับ [44,46]–[1494,1000] (เผื่อ ring path ขอบเมือง)
    this.physics.world.setBounds(u(44), u(46), u(1450), u(954))
    // S4: โลกเล็กกว่าจอแกนไหน ให้กล้องกึ่งกลางแกนนั้น (แทน clamp ชิดซ้ายบน)
    const camB = centeredCameraBounds(worldW, WORLD_H, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // interact = edge-triggered ใน update() (ดู checkServiceTriggers) — ไม่ใช้ physics overlap อีก
    // เพื่อคุมระยะประตูให้พอดีและกันดูดกลับตอนออกจากอาคาร

    // ผู้เฝ้าประตูอนุญาต -> เข้าดันเจี้ยนจริง (สั่งจากกล่องสนทนาฝั่ง UI)
    // P0.1: แจ้งปลายทางผ่าน floor:advance ให้ store/HUD/quest sync ก่อนสลับ scene
    const enterDungeon = () => {
      if (this.floor === 1) {
        gameEvents.emit('world:travel-request', {
          mode: 'adventure', floor: 1, regionId: 'verdant-frontier', zoneId: 'whisperleaf-meadow', fromZoneId: 'aethergate',
        })
        return
      }
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
    this.locomotion = new PlayerLocomotion(this, this.player, TOWN_SPEED, walls)

    addPlaque(this, 8, 8, `${regionForFloor(this.floor).town} · ${regionForFloor(this.floor).name} · Adventure Rank ${this.floor}`, {
      fontSize: '13px', depth: DEPTH_UI, fixed: true, origin: [0, 0],
    })
    // ป้ายวิธีเล่นจางหายเองหลัง 8 วิ — ไม่บังฉากตอนเดินสำรวจ
    const hint = addPlaque(this, 8, 36, 'ลูกศร / WASD / จอย หรือคลิกพื้นเพื่อเดิน · เดินเข้าประตูเรืองแสงเพื่อใช้บริการ', {
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

  update(time: number, delta: number) {
    const move = this.locomotion.update(this.cursors, this.facing, delta)
    this.player.setVelocity(move.vx, move.vy)
    this.facing = move.facing
    const moving = move.moving
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(playerRenderDepth(this.player.y))
    this.playerShadow.setPosition(this.player.x, this.player.y + 8).setDepth(playerShadowDepth(this.player.y))
    this.gearAura?.setPosition(this.player.x, this.player.y + 4).setDepth(playerAuraDepth(this.player.y))
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment)
    this.idleBreath.setMoving(moving)
    this.netPlayers.update(time, this.player, this.facing, moving)

    // แสงบอกจุดโต้ตอบ: ค่อย ๆ เด่นขึ้นเมื่อผู้เล่นเดินเข้าใกล้
    for (const hi of this.interactHighlights) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hi.x, hi.y)
      const target = dist < hi.range ? 0.55 : 0
      hi.glow.alpha += (target - hi.glow.alpha) * 0.18
    }

    this.checkServiceTriggers()
    this.minimapTicker.tick(this.time.now, { player: { x: this.player.x, y: this.player.y } })
  }

  /** จุดเท้าผู้เล่น (ฐานล่าง sprite) อยู่ในกรอบหรือไม่ — ใช้จุดเดียวกับ collision ฐานเท้า */
  private pointInRect(x: number, y: number, r: [number, number, number, number]): boolean {
    return x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]
  }

  /** edge-trigger ประตูบริการ: ก้าวเข้ากรอบ = ยิงบริการหนึ่งครั้ง ต้องเดินออกก่อนจึงยิงใหม่
   *  → ออกจากอาคารแล้ว spawn อยู่นอกกรอบ ไม่โดนดูดกลับ; เดินผ่านเฉียด ๆ ก็ไม่เผลอเข้า */
  private checkServiceTriggers() {
    const px = this.player.x
    const py = this.player.y
    for (const t of this.serviceTriggers) {
      const inside = this.pointInRect(px, py, t.rect)
      if (inside && t.armed) { t.armed = false; this.tryInteract(t.event) }
      else if (!inside) t.armed = true
    }
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
