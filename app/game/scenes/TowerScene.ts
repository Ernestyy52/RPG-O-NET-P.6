import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { getBossRequirement, describeMissingRequirements } from '../../data/bossRequirements'
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
  heroKey,
  heroIdleFrame,
  heroAnim,
  heroSheetSize,
  HERO_DISPLAY_H,
  applyStandardHeroBody,
} from '../systems/textures'
import { applyAtmosphere, createIdleBreath, addPlaque, addGearAura } from '../systems/atmosphere'
import { preloadBgm, playBgm, bgmKeyForBiome } from '../systems/bgm'
import { assetPath } from '../systems/textures'
import { joinDungeon, leaveRoom, requestBattle, sendBattleResult, sendSeed, mySessionId, type NetMonsterSchema } from '../systems/net'
import { RemotePlayers } from '../systems/remotePlayers'
import {
  TILE, MAP_W, MAP_H, SPAWN_BOUNDS,
  rollMonsterSpawns as rollSpawns,
  canStartEncounter, isNetMonsterFightable,
  NEW_ZONE_RUNTIME_ENABLED, type DungeonLayoutId,
} from '../runtime'
import { FIELD_SPEED, centeredCameraBounds } from '../scaleContract'
import {
  FLOOR_VARIETY_ENABLED, floorObstacles, floorModifier, chestSpots, chestReward, floorDecorSpots,
  BIOME_BUSHES,
} from '../../data/floorFeatures'
import { WORLD1_BUSHES } from '../../data/world1/decor'
import { MinimapTicker, borderRects, tileRect, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import type { MinimapLayout } from '../systems/eventBus'
import { PlayerLocomotion } from '../systems/playerLocomotion'
import { playerAuraDepth, playerRenderDepth, playerShadowDepth } from '../runtime/renderDepth'
import { regionForFloor, type AdventureRegionId } from '../../data/adventureRegions'
import { getAdventureZone } from '../../data/adventureZones'
import { monsterEcology } from '../../data/monsterEcology'
import { getWorld1FieldZone, type World1FieldDefinition, type World1FieldExit } from '../../data/world1/fieldZones'

/** World-1 floors that host a dungeon interior, and which layout each opens (Phase 14). */
const WORLD1_DUNGEON_FLOORS: Record<number, DungeonLayoutId> = { 5: 'world01-mini', 10: 'world01-main' }

function titleCase(slug: string): string {
  return slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export class TowerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private locomotion!: PlayerLocomotion
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private bossDoor?: Phaser.Physics.Arcade.Sprite
  private floor = 2
  private mode: 'adventure' | 'ranked-tower' = 'adventure'
  private regionId?: AdventureRegionId
  private zoneId?: string
  private entryFromZoneId?: string
  private fieldZone?: World1FieldDefinition
  private inBattle = false
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private classId: HeroClassId = 'warrior'
  private theme!: MonsterTheme
  private bossUnlocked = false
  private lastNotice = 0
  private lastDoorInteract = 0
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private hintPlaque?: ReturnType<typeof addPlaque>
  private netPlayers = new RemotePlayers(this)
  private online = false
  private pendingBattle = false
  private targetMonsters = 25
  private monsterSpeedMult = 1
  private gearAura?: Phaser.GameObjects.Image | null
  private weaponOverlay!: WeaponOverlay
  private minimapTicker = new MinimapTicker()
  private minimapLayout!: MinimapLayout

  constructor() {
    super('TowerScene')
  }

  init(data: { floor?: number; classId?: HeroClassId; mode?: 'adventure' | 'ranked-tower'; regionId?: AdventureRegionId; zoneId?: string; entryFromZoneId?: string }) {
    this.floor = data.floor ?? 2
    this.mode = data.mode ?? 'adventure'
    this.regionId = data.regionId
    this.zoneId = data.zoneId
    this.classId = data.classId ?? this.classId
    this.entryFromZoneId = data.entryFromZoneId
    this.inBattle = false
  }

  preload() {
    preloadSharedAssets(this)
    preloadFloorMonsters(this, this.floor)
    preloadBgm(this, bgmKeyForBiome(biomeForFloor(this.floor).id), assetPath)
    if (FLOOR_VARIETY_ENABLED) {
      // ไบโอมพุ่มไม้ตกแต่ง (non-blocking) + หีบสมบัติของ floor modifier
      for (const bush of WORLD1_BUSHES) {
        if (!this.textures.exists(bush.key)) this.load.image(bush.key, assetPath(bush.sprite))
      }
      if (!this.textures.exists('floor_chest')) this.load.image('floor_chest', assetPath('interior-props/guild_chest.png'))
    }
  }

  create() {
    const config = getFloorConfig(this.floor)
    this.fieldZone = this.mode === 'adventure' ? getWorld1FieldZone(this.zoneId) : undefined
    const biome = biomeForFloor(this.floor)
    this.theme = themeForFloor(this.floor)
    const player = usePlayerStore()

    buildBiomeTextures(this, biome)
    buildSharedTextures(this)
    this.cameras.main.setBackgroundColor(biome.bg)
    this.cameras.main.fadeIn(280)

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, biomeFloorKey(biome.id, x, y)).setDepth(0)
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

    // Flip FLOOR_VARIETY: ทุกชั้นมี layout ของตัวเอง (seeded ตามเลขชั้น — deterministic) แทนห้องซ้ำเดิม
    // กติกาความปลอดภัย: สิ่งกีดขวางเป็น cell เดี่ยวห่างกัน ≥2 + เว้นเขตหวงห้าม ⇒ เดินอ้อมได้เสมอ ไม่มี soft-lock
    const treeSpots: [number, number][] = this.fieldZone
      ? this.fieldZone.obstacles.map((spot) => [spot.x, spot.y])
      : FLOOR_VARIETY_ENABLED
        ? floorObstacles(this.floor, { w: MAP_W, h: MAP_H }).map((s) => [s.x, s.y] as [number, number])
        : [[4, 6], [10, 5], [6, 9], [3, 12], [18, 7], [20, 12], [15, 14], [8, 14], [21, 15], [13, 10]]
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
    const startTile = this.fieldZone?.entryBySource[this.entryFromZoneId ?? ''] ?? this.fieldZone?.playerStart
    const startX = (startTile?.x ?? 2) * TILE + (startTile ? TILE / 2 : 0)
    const startY = (startTile?.y ?? (MAP_H - 2)) * TILE + (startTile ? TILE / 2 : 0)
    this.playerShadow = this.add.image(startX, startY + 12, 'shadow_blob').setDepth(playerShadowDepth(startY))
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)
    // ออร่าตามเครื่องแต่งกาย (paper-doll) — เห็นชัดว่าใส่ของหายาก
    this.gearAura = addGearAura(this, player.gearAuraColor, player.gearRarity)
    this.gearAura?.setDepth(playerAuraDepth(startY))
    this.weaponOverlay = new WeaponOverlay(this)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    // S4: ชั้น 768×576 เล็กกว่าจอ desktop 800×600 → กล้องกึ่งกลาง (scale contract)
    const camB = centeredCameraBounds(MAP_W * TILE, MAP_H * TILE, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(camB.x, camB.y, camB.width, camB.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    // ---- boss door (top center) — เดินชนแล้วเปิดกล่องแสดงเงื่อนไข (ไม่มีบอสในห้องนี้แล้ว) ----
    const doorX = (MAP_W / 2) * TILE
    const doorY = TILE * 1.6
    if (!this.fieldZone) {
    this.bossDoor = this.physics.add.staticSprite(doorX, doorY, 'boss_door_locked')
    this.bossDoor.setOrigin(0.5, 0.7).setDepth(doorY)
    addPlaque(this, doorX, doorY + 12, 'Boss Room', { fontSize: '10px', depth: doorY + 1 })
    // โซนทริกเกอร์หน้าประตู — เดินเข้าใกล้ = เปิดกล่องเงื่อนไขห้องบอส
    const doorZone = this.physics.add.staticSprite(doorX, doorY + TILE * 0.7, undefined) as Phaser.Physics.Arcade.Sprite
    doorZone.setVisible(false)
    doorZone.body.setSize(TILE * 2, TILE)
    this.physics.add.overlap(this.player, doorZone, () => this.tryBossGate())
    }

    // ---- floor modifier (FLOOR_VARIETY): ปรับความหนาแน่น/ความเร็วมอนสเตอร์ + หมอก + หีบสมบัติ ----
    const modifier = !this.fieldZone && FLOOR_VARIETY_ENABLED ? floorModifier(this.floor) : null
    if (modifier) this.monsterSpeedMult = modifier.monsterSpeedMult
    if (modifier?.fog) {
      // หมอกแบบภาพนิ่ง (ปลอดภัยกับ reduced-motion) — ชั้นบางๆ สองชั้นให้มีมิติ
      this.add.rectangle(0, 0, MAP_W * TILE, MAP_H * TILE, 0xc8d4e0, 0.16).setOrigin(0).setDepth(640)
      this.add.rectangle(0, 0, MAP_W * TILE, MAP_H * TILE, biome.bg, 0.22).setOrigin(0).setDepth(641)
    }
    // ---- minimap layout (Phase 2): กำแพงขอบ + ต้นไม้ + ประตูบอส — publish ก่อน แล้วเติม marker
    // ระหว่าง create ต่อได้ (chest/dungeon entry) ผ่าน object เดียวกันแล้ว publish ซ้ำ
    this.minimapLayout = {
      worldW: MAP_W * TILE,
      worldH: MAP_H * TILE,
      blocks: [
        ...borderRects(MAP_W, MAP_H, TILE),
        ...treeSpots.map(([tx, ty]) => tileRect(tx, ty, TILE)),
      ],
      markers: this.fieldZone ? [] : [{ kind: 'boss', x: doorX, y: doorY }],
    }

    if (modifier && modifier.chests > 0) {
      const spots = chestSpots(this.floor, floorObstacles(this.floor, { w: MAP_W, h: MAP_H }), { w: MAP_W, h: MAP_H })
      for (const [i, spot] of spots.entries()) {
        const cx = spot.x * TILE + TILE / 2
        const cy = spot.y * TILE + TILE / 2
        const chest = this.physics.add.staticSprite(cx, cy, 'floor_chest')
        chest.setScale(1.1).setDepth(cy)
        this.minimapLayout.markers.push({ kind: 'chest', x: cx, y: cy })
        const glow = this.add.image(cx, cy - 4, 'atmo_dot').setTint(0xffd977)
          .setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.4).setDepth(cy - 1)
        this.physics.add.overlap(this.player, chest, () => {
          if (!chest.active) return
          chest.setActive(false)
          // เก็บหีบแล้ว — เอา marker ออกจาก minimap ทันที (ไม่ทิ้งเป้าหมายผี)
          this.minimapLayout.markers = this.minimapLayout.markers.filter((m) => !(m.kind === 'chest' && m.x === cx && m.y === cy))
          publishMinimapLayout(this.minimapLayout)
          const reward = chestReward(this.floor, i)
          const player = usePlayerStore()
          // รางวัลเล็ก (≈ ทองมอนหนึ่งตัว) — จ่ายครั้งเดียวต่อหีบต่อการเข้าชั้น แล้วหีบหายไป
          player.gainRewards(0, reward.gold, 0)
          if (reward.potion) player.addItem('potion_s', 1)
          player.addLog(`Found a treasure chest on Floor ${this.floor} (+${reward.gold}g${reward.potion ? ', Potion S' : ''}).`)
          gameEvents.emit('notice', { text: `💰 หีบสมบัติ! +${reward.gold} gold${reward.potion ? ' + Potion S' : ''}` })
          this.tweens.add({ targets: [chest, glow], alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 320, onComplete: () => { chest.destroy(); glow.destroy() } })
        })
      }
    }
    if (FLOOR_VARIETY_ENABLED && !this.fieldZone) {
      // พุ่มไม้ตกแต่งตามไบโอม (ไม่มี physics — เดินทับ/อ้อมหลังได้, depth ตาม y)
      for (const decor of floorDecorSpots(this.floor, biome.id, floorObstacles(this.floor, { w: MAP_W, h: MAP_H }), { w: MAP_W, h: MAP_H })) {
        if (!this.textures.exists(decor.key)) continue
        const dx = decor.x * TILE + TILE / 2
        const dy = decor.y * TILE + TILE / 2
        this.add.image(dx, dy, decor.key).setScale(0.8).setDepth(dy).setAlpha(0.95)
      }
    }

    // ---- 25+ themed monsters ----
    // ออนไลน์: มอนสเตอร์มาจาก server (ทุกคนในชั้นเห็นตำแหน่งเดียวกัน) / ออฟไลน์: สุ่ม local
    this.monsters = this.physics.add.group()
    this.targetMonsters = this.fieldZone ? this.fieldZone.monsterCount : modifier
      ? Math.max(6, Math.round(config.monsterCount * modifier.monsterCountMult))
      : config.monsterCount
    this.physics.add.collider(this.monsters, walls)
    this.physics.add.collider(this.monsters, this.monsters)
    this.setupMultiplayer(config)

    // มอนสเตอร์เกิดใหม่ทุก 10 วิ (offline เท่านั้น — online ให้ server คุมจำนวน)
    // เติมกลับจนเท่าจำนวนตั้งต้น เพื่อให้ผู้เล่นฟาร์มต่อได้ไม่มีวันหมดชั้น
    this.time.addEvent({
      delay: 10000, loop: true, callback: () => {
        if (this.online || this.inBattle) return
        const alive = this.monsters.getChildren().filter((c) => {
          const m = c as Phaser.Physics.Arcade.Sprite
          return m.active && !m.getData('isBoss')
        }).length
        if (alive < this.targetMonsters) {
          const spot = this.rollMonsterSpawns(1)[0]
          // spawnMonsterSprite เฟดอินให้อยู่แล้ว (alpha 0→1) — ใช้เป็นสัญญาณตัวใหม่
          this.spawnMonsterSprite(spot.slug, spot.x, spot.y, 0)
        }
      },
    })

    // สุ่มเปลี่ยนทิศเดินทุก ~1.4 วิ: 40% เดินช้าๆ / 60% หยุด (เฉพาะ local — ตัว net ขยับตาม server)
    this.time.addEvent({
      delay: 1400, loop: true, callback: () => {
        if (this.inBattle) return
        for (const child of this.monsters.getChildren()) {
          const m = child as Phaser.Physics.Arcade.Sprite
          if (!m.active || m.getData('isBoss') || m.getData('net')) continue
          if (Math.random() < 0.4) {
            const angle = Math.random() * Math.PI * 2
            const spd = (22 + Math.random() * 18) * this.monsterSpeedMult
            m.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
            m.setFlipX(Math.cos(angle) < -0.2)
          } else {
            m.setVelocity(0, 0)
          }
        }
      },
    })

    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))

    // ---- boss requirement (แค่สลับหน้าตาประตู; ตัวบอสอยู่ในห้องแยก BossScene) ----
    if (!this.fieldZone) {
      const requirement = getBossRequirement(this.floor)
      this.bossUnlocked = describeMissingRequirements(requirement, player).length === 0
      if (this.bossUnlocked) this.bossDoor?.setTexture('boss_door_open')
    }

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.locomotion = new PlayerLocomotion(this, this.player, FIELD_SPEED, walls)
    if (this.fieldZone) this.createFieldFeatures()

    // ---- World-1 dungeon entry (Phase 14) — additive, gated: only appears when the zone runtime is
    // enabled AND this is a World-1 dungeon floor. Flag off ⇒ live path byte-identical. ----
    const dungeonLayoutId = WORLD1_DUNGEON_FLOORS[this.floor]
    if (!this.fieldZone && this.mode === 'adventure' && NEW_ZONE_RUNTIME_ENABLED && dungeonLayoutId) {
      const dx = (MAP_W / 2) * TILE
      const dy = (MAP_H - 4) * TILE
      const entry = this.physics.add.staticSprite(dx, dy, 'boss_door_open')
      entry.setOrigin(0.5, 0.7).setDepth(dy).setTint(0x9a7bd0)
      addPlaque(this, dx, dy + 12, `${regionForFloor(this.floor).dungeon} · Dungeon`, { fontSize: '10px', depth: dy + 1, color: '#cdb27a' })
      this.minimapLayout.markers.push({ kind: 'dungeon', x: dx, y: dy })
      let lastDungeonEnter = 0
      this.physics.add.overlap(this.player, entry, () => {
        if (this.inBattle || this.time.now - lastDungeonEnter < 1500) return
        lastDungeonEnter = this.time.now
        this.scene.start('DungeonScene', { layoutId: dungeonLayoutId, floor: this.floor, classId: this.classId })
      })
    }

    const region = regionForFloor(this.floor)
    const zone = this.zoneId ? getAdventureZone(this.zoneId) : undefined
    const sceneTitle = this.mode === 'ranked-tower'
      ? `ENDLESS SPIRE · RANKED FLOOR ${this.floor}`
      : `${region.icon} ${zone?.nameTh ?? region.nameTh} · ${zone?.name ?? region.field} · Rank ${this.floor}`
    addPlaque(this, 8, 8, sceneTitle, {
      fontSize: '13px', depth: 100, fixed: true, origin: [0, 0],
    })
    if (modifier && modifier.id !== 'none') {
      // ป้ายบอก modifier ของชั้น — ให้ผู้เล่นรู้ว่าชั้นนี้ "ต่าง" ยังไงตั้งแต่ก้าวแรก
      addPlaque(this, 8, 62, `✦ ${modifier.nameTh}`, {
        fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#9fd8ff',
      })
    }
    const objective = this.fieldZone
      ? this.fieldZone.objective
      : this.mode === 'ranked-tower'
      ? (this.bossUnlocked ? 'Rank Guardian is ready · enter the gate.' : 'Rank trial · defeat targets to unlock the Guardian.')
      : (this.bossUnlocked ? `${region.guardian} is ready · enter the guardian gate.` : `Hunt monsters and complete quests to reach ${region.guardian}.`)
    this.hintPlaque = addPlaque(this, 8, 36, objective, {
      fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
    })

    // ---- atmosphere (weather / vignette / lightning) + BGM ----
    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, bgmKeyForBiome(biome.id))

    publishMinimapLayout(this.minimapLayout)

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    // เงื่อนไขครบ + กด "เข้าห้องบอส" ในกล่อง → โหลดห้องบอสเดี่ยว
    const enterBoss = () => this.scene.start('BossScene', { floor: this.floor, classId: this.classId, mode: this.mode, regionId: this.regionId, zoneId: this.zoneId })
    gameEvents.on('boss:enter', enterBoss)
    this.events.once('shutdown', () => {
      gameEvents.off('battle:end', this.handleBattleEnd, this)
      gameEvents.off('boss:enter', enterBoss)
      leaveRoom()
      this.netPlayers.destroy()
      this.weaponOverlay.destroy()
      clearMinimap()
    })
  }

  /** เดินชนประตูห้องบอส → เปิดกล่องแสดงเงื่อนไข (ฝั่ง Vue) — throttle กันเปิดรัว */
  private createFieldFeatures() {
    const field = this.fieldZone
    if (!field) return
    this.add.rectangle(0, 0, MAP_W * TILE, MAP_H * TILE, field.tint, 0.07).setOrigin(0).setDepth(0.2)
    for (const landmark of field.landmarks) {
      const x = landmark.at.x * TILE + TILE / 2
      const y = landmark.at.y * TILE + TILE / 2
      const glow = this.add.circle(x, y, TILE * 0.9, landmark.tint, 0.12).setDepth(y - 2)
      this.add.circle(x, y, TILE * 0.34, landmark.tint, 0.72).setDepth(y - 1)
      addPlaque(this, x, y + 28, landmark.name + ' - ' + landmark.nameTh, { fontSize: '9px', depth: y + 1, color: '#f4dfaa' })
      if (!useSettingsStore().reducedMotion) this.tweens.add({ targets: glow, alpha: 0.28, scale: 1.12, duration: 1400, yoyo: true, repeat: -1 })
      this.minimapLayout.markers.push({ kind: 'service', x, y })
    }
    const armedAt = this.time.now + 900
    for (const exit of field.exits) {
      const x = exit.at.x * TILE + TILE / 2
      const y = exit.at.y * TILE + TILE / 2
      const tint = exit.mode === 'dungeon' ? 0xb18cff : exit.mode === 'town' ? 0x8fd0ff : 0x9be7a5
      const glow = this.add.image(x, y, 'atmo_dot').setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setScale(4).setAlpha(0.5).setDepth(y - 1)
      if (!useSettingsStore().reducedMotion) this.tweens.add({ targets: glow, alpha: 0.9, scale: 4.8, duration: 1000, yoyo: true, repeat: -1 })
      const trigger = this.physics.add.staticSprite(x, y, 'atmo_dot').setAlpha(0.001).setScale(3)
      addPlaque(this, x, y - 24, exit.label + ' - ' + exit.labelTh, { fontSize: '9px', depth: y + 1, color: '#dff5df' })
      this.minimapLayout.markers.push({ kind: exit.mode === 'dungeon' ? 'dungeon' : exit.mode === 'town' ? 'exit' : 'portal', x, y })
      this.physics.add.overlap(this.player, trigger, () => {
        if (this.time.now < armedAt) return
        this.travelFieldExit(exit)
      })
    }
  }

  private travelFieldExit(exit: World1FieldExit) {
    if (!this.fieldZone || this.inBattle || this.time.now - this.lastDoorInteract < 1200) return
    const store = usePlayerStore()
    if (exit.requiredQuestStep !== undefined && store.mainQuest.step < exit.requiredQuestStep) {
      this.lastDoorInteract = this.time.now
      gameEvents.emit('notice', { text: 'The route is sealed. Current quest: ' + (store.mainQuestStep?.title ?? 'Prepare for the journey') })
      return
    }
    this.lastDoorInteract = this.time.now
    const target = getAdventureZone(exit.targetZoneId)
    gameEvents.emit('audio:sfx', { key: 'portal' })
    gameEvents.emit('world:travel-request', {
      mode: exit.mode, floor: target.rank, regionId: target.regionId, zoneId: target.id,
      fromZoneId: this.fieldZone.id, layoutId: exit.layoutId, returnZoneId: this.fieldZone.id,
    })
  }

  private tryBossGate() {
    const now = this.time.now
    if (now - this.lastDoorInteract < 1500) return
    this.lastDoorInteract = now
    gameEvents.emit('boss:gate', { floor: this.floor })
  }

  /**
   * สุ่มมอนสเตอร์แบบ local (โหมดออฟไลน์ หรือใช้เป็น seed ให้ server ตอนเป็นคนแรกที่เข้าห้อง)
   * แบ่งพื้นที่เดินเป็นตาราง cell ~เท่าจำนวนมอนสเตอร์ แล้วสุ่มตำแหน่ง (มี jitter) ใน cell ของตัวเอง
   * แทนการสุ่มอิสระทั้งพื้นที่ ซึ่งมักจับกลุ่มกันโดยบังเอิญ — ช่วงพิกัด min/max เท่าเดิมทุกประการ
   * (ไม่กระทบ bounds clamp ฝั่ง server/index.js)
   */
  private rollMonsterSpawns(count: number) {
    // อัลกอริทึมวางมอนสเตอร์แบบแบ่ง cell อยู่ใน zone runtime (SpawnSystem) — RND ของ Phaser ทำหน้าที่ Rng port
    return rollSpawns(count, { bounds: this.fieldZone?.spawnBounds ?? SPAWN_BOUNDS, slugs: this.fieldZone?.monsterIds ?? this.theme.monsters, rng: Phaser.Math.RND })
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
    if (index === 0) {
      m.setData('elite', true).setTint(0xc48bff).setScale(mScale * 1.25)
      const badge = addPlaque(this, x, y - 34, 'ELITE', { fontSize: '9px', depth: 100000, color: '#e3c9ff' })
      m.setData('variantLabel', badge)
    } else if (index === 1) {
      m.setData('rare', true).setTint(0xffd15c).setScale(mScale * 1.2)
      const badge = addPlaque(this, x, y - 34, 'RARE', { fontSize: '9px', depth: 100000, color: '#ffe8a3' })
      m.setData('variantLabel', badge)
      gameEvents.emit('audio:sfx', { key: 'elite_spawn' })
    }
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
      // ออฟไลน์: สุ่มมอนสเตอร์ local — จำนวนตาม floor modifier (calm/swarm) ของชั้นนี้
      for (const [i, s] of this.rollMonsterSpawns(this.targetMonsters).entries()) {
        this.spawnMonsterSprite(s.slug, s.x, s.y, i)
      }
      return
    }
    this.online = true
    this.netPlayers.bind(room)
    // เสนอ seed — server รับเฉพาะตอนห้องยังว่าง (คนแรกเท่านั้น) จึงส่งได้ปลอดภัยทุกคน
    sendSeed(this.rollMonsterSpawns(this.targetMonsters))

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

  /** ปลดล็อกประตูห้องบอส (สลับ texture + ป้าย) — ตัวบอสอยู่ใน BossScene แยกต่างหาก */
  private openBossDoor() {
    if (this.bossUnlocked) return
    this.bossUnlocked = true
    if (!this.bossDoor) return
    this.bossDoor.setTexture('boss_door_open')
    if (this.hintPlaque) {
      this.hintPlaque.label.destroy()
      this.hintPlaque.bg.destroy()
      this.hintPlaque = addPlaque(this, 8, 36, 'Boss door is OPEN. Walk into it at the top.', {
        fontSize: '10px', depth: 100, fixed: true, origin: [0, 0], color: '#cdb27a',
      })
    }
  }

  update(time: number, delta: number) {
    if (this.inBattle) { this.locomotion.stopImmediate(); return }
    const move = this.locomotion.update(this.cursors, this.facing, delta)
    this.facing = move.facing
    const moving = move.moving
    this.player.setVelocity(move.vx, move.vy)
    const anim = heroAnim(this.classId, this.gender, moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(playerRenderDepth(this.player.y))
    this.playerShadow.setPosition(this.player.x, this.player.y + 12).setDepth(playerShadowDepth(this.player.y))
    this.gearAura?.setPosition(this.player.x, this.player.y + 4).setDepth(playerAuraDepth(this.player.y))
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment)
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
      const variantLabel = m.getData('variantLabel') as ReturnType<typeof addPlaque> | undefined
      if (variantLabel) {
        variantLabel.label.setPosition(m.x, m.y - 34)
        variantLabel.bg.setPosition(m.x, m.y - 34)
      }
      if (!m.getData('isBoss')) m.setDepth(m.y)
    }

    this.minimapTicker.tick(this.time.now, {
      player: { x: this.player.x, y: this.player.y },
      monsters: this.monsters.getChildren()
        .filter((c) => (c as Phaser.Physics.Arcade.Sprite).active)
        .map((c) => ({ x: (c as Phaser.Physics.Arcade.Sprite).x, y: (c as Phaser.Physics.Arcade.Sprite).y })),
    })
  }

  private onEncounterMonster(monster: Phaser.Physics.Arcade.Sprite) {
    // เงื่อนไขเริ่มการต่อสู้/ล็อกมอนสเตอร์ net อยู่ใน zone runtime (InteractionSystem) — pure + testable
    if (!canStartEncounter({ inBattle: this.inBattle, pendingBattle: this.pendingBattle, monsterActive: monster.active })) return

    // instanced battle (ออนไลน์): ขอสิทธิ์จาก server ก่อน — มอนสเตอร์ที่เพื่อนจองอยู่สู้ไม่ได้
    if (monster.getData('net')) {
      if (!isNetMonsterFightable(monster.getData('lockedBy') as string | undefined, mySessionId())) return
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
        this.startEncounter(monster)
      })
      return
    }

    this.startEncounter(monster)
  }

  private startEncounter(monster: Phaser.Physics.Arcade.Sprite) {
    this.inBattle = true
    monster.setData('inFight', true)
    ;(monster.body as Phaser.Physics.Arcade.Body).enable = false

    const config = getFloorConfig(this.floor)
    const slug = (monster.getData('slug') as string) ?? this.theme.monsters[0]
    const isElite = !!monster.getData('elite')
    const isRare = !!monster.getData('rare')
    const ecology = monsterEcology(slug)
    const ecologyHpMult = ecology.element === 'earth' ? 1.08 : ecology.element === 'water' ? 1.04 : 1
    const ecologyAtkMult = ecology.element === 'fire' ? 1.1 : ecology.element === 'shadow' ? 1.12 : 1
    const ecologySpeedBonus = ecology.element === 'wind' ? 2 : 0

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

    gameEvents.emit('battle:start', {
      floor: this.floor, isBoss: false,
      name: isRare ? `Rare ${titleCase(slug)}` : isElite ? `Elite ${titleCase(slug)}` : titleCase(slug), sprite: `mob-sprites/mca/${slug}.png`,
      monsterId: slug, elite: isElite, rare: isRare,
      hp: Math.round(config.monsterHp * ecologyHpMult * (isRare ? 1.9 : isElite ? 1.55 : 1)),
      atk: Math.round(config.monsterAtk * ecologyAtkMult * (isRare ? 1.42 : isElite ? 1.28 : 1)), speed: config.monsterLevel + ecologySpeedBonus + (isRare ? 2 : isElite ? 1 : 0),
      expReward: Math.round(config.expReward * (isRare ? 2.6 : isElite ? 1.8 : 1)),
      goldReward: Math.round(config.goldReward * (isRare ? 2.8 : isElite ? 1.8 : 1)),
      worldMode: this.mode,
      element: ecology.element, weakness: ecology.weakness, passive: ecology.passive, habitat: ecology.habitat, intents: ecology.intents, signatureDrop: ecology.signatureDrop,
    })
    this.activeMonster = monster
  }

  private activeMonster?: Phaser.Physics.Arcade.Sprite

  private handleBattleEnd = (payload: { outcome: import('../systems/eventBus').BattleOutcome; won: boolean; isBoss?: boolean }) => {
    this.inBattle = false
    const monster = this.activeMonster
    this.activeMonster = undefined

    // แจ้งผลให้ server (มอนสเตอร์ net): ชนะ = ตายทั้งห้อง / แพ้-หนี = ปลดล็อกให้เพื่อนสู้ต่อ
    if (monster?.getData('net')) {
      sendBattleResult(monster.getData('netId') as string, payload.won && !payload.isBoss)
    }

    // P0.3: หนีสำเร็จ = ถอยออกมาเดินต่อในชั้นเดิม — มอนสเตอร์ยังอยู่ (ไม่ใช่ KO ไม่ restart)
    if (payload.outcome === 'escaped') {
      if (monster?.active) {
        // เว้นช่วงกันชนซ้ำทันที แล้วค่อยเปิด body ให้สู้ใหม่ได้
        this.time.delayedCall(1200, () => {
          if (monster.active) (monster.body as Phaser.Physics.Arcade.Body).enable = true
        })
      }
      return
    }

    if (payload.outcome === 'defeat') {
      // แพ้ = หมดสติ ฟื้นชั้นเดิม (มอนสเตอร์รีเซ็ต)
      this.scene.restart({ floor: this.floor, classId: this.classId, mode: this.mode, regionId: this.regionId, zoneId: this.zoneId })
      return
    }

    // ชนะมอนสเตอร์ทั่วไป → เก็บซาก แล้วเช็คปลดล็อกประตูห้องบอส (บอสอยู่ห้องแยก)
    if (monster) {
      const variantLabel = monster.getData('variantLabel') as ReturnType<typeof addPlaque> | undefined
      variantLabel?.label.destroy()
      variantLabel?.bg.destroy()
      monster.setActive(false)
      this.tweens.add({ targets: monster, alpha: 0, scaleX: 0, scaleY: 0, duration: 220, onComplete: () => monster.destroy() })
    }
    if (!this.fieldZone && !this.bossUnlocked) {
      const player = usePlayerStore()
      const missing = describeMissingRequirements(getBossRequirement(this.floor), player)
      if (missing.length === 0) {
        this.openBossDoor()
        gameEvents.emit('notice', { text: 'Boss door unlocked! Head to the door at the top.' })
      } else if (this.time.now - this.lastNotice > 4000) {
        this.lastNotice = this.time.now
        gameEvents.emit('notice', { text: `Boss locked — need: ${missing.join(', ')}` })
      }
    }
  }
}
