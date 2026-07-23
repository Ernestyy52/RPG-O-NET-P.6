import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { allInteriorNpcs, getInterior, INTERIOR_TOWN_DOORS, type InteriorId, type InteriorNpcSpec, type InteriorSpec, type InteriorTransition } from '../../data/town/interiors'
import { getTownNpc } from '../../data/world1/npcs'
import { usePlayerStore } from '../../stores/player'
import { WeaponOverlay } from '../systems/paperdoll'
import { useSettingsStore } from '../../stores/settings'
import { addPlaque, addTorchFlicker, createIdleBreath, addGearAura } from '../systems/atmosphere'
import {
  assetPath, preloadSharedAssets, buildSharedTextures,
  heroKey, heroIdleFrame, heroAnim, heroSheetSize, HERO_DISPLAY_H, applyStandardHeroBody,
} from '../systems/textures'
import { preloadBgm, playBgm } from '../systems/bgm'
import { MinimapTicker, publishMinimapLayout, clearMinimap } from '../systems/minimap'
import { FIELD_SPEED, TILE_SIZE, centeredCameraBounds } from '../scaleContract'
import { PlayerLocomotion } from '../systems/playerLocomotion'
import { playerAuraDepth, playerRenderDepth, playerShadowDepth } from '../runtime/renderDepth'

const TILE = TILE_SIZE
const DEPTH_LIGHTS = 2200
const DEPTH_UI = 4200

interface NpcTrigger {
  zone: Phaser.Physics.Arcade.Sprite
  spec: InteriorNpcSpec
  latch: boolean
  dialogueIndex: number
  lastInteract: number
}

interface TransitionTrigger {
  zone: Phaser.Physics.Arcade.Sprite
  transition: InteriorTransition
  armed: boolean
}

/** Playable, NPC-owned building interiors with safe two-way transitions. */
export class InteriorScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerShadow!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private locomotion!: PlayerLocomotion
  private building: InteriorId = 'guild'
  private floor = 1
  private classId: HeroClassId = 'warrior'
  private gender = 'male'
  private facing: 'down' | 'left' | 'right' | 'up' = 'up'
  private leaving = false
  private spawnAt?: [number, number]
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private gearAura?: Phaser.GameObjects.Image | null
  private weaponOverlay!: WeaponOverlay
  private minimapTicker = new MinimapTicker()
  private npcTriggers: NpcTrigger[] = []
  private transitionTriggers: TransitionTrigger[] = []

  constructor() { super('InteriorScene') }

  init(data: { building?: InteriorId; floor?: number; classId?: HeroClassId; spawnAt?: [number, number] }) {
    this.building = data.building ?? 'guild'
    this.floor = data.floor ?? 1
    this.classId = data.classId ?? 'warrior'
    this.spawnAt = data.spawnAt
    this.leaving = false
    this.facing = 'up'
    this.npcTriggers = []
    this.transitionTriggers = []
  }

  preload() {
    preloadSharedAssets(this)
    const spec = getInterior(this.building)
    if (!spec) return
    const artKey = this.artKey(spec)
    if (!this.textures.exists(artKey)) this.load.image(artKey, assetPath(spec.art.sprite))
    for (const npcSpec of allInteriorNpcs(spec)) {
      const npc = getTownNpc(npcSpec.id)
      if (npc && !this.textures.exists(`npc_${npc.id}`)) {
        this.load.spritesheet(`npc_${npc.id}`, assetPath(npc.sprite), { frameWidth: npc.frameW, frameHeight: npc.frameH })
      }
    }
    preloadBgm(this, 'town', assetPath)
  }

  create() {
    const spec = getInterior(this.building)
    if (!spec) { this.scene.start('TownScene', { floor: this.floor, classId: this.classId }); return }
    buildSharedTextures(this)

    const artKey = this.artKey(spec)
    const { width: worldW, height: worldH } = spec.art
    this.cameras.main.setBackgroundColor(0x09070d)
    this.cameras.main.fadeIn(220)
    this.add.image(0, 0, artKey).setOrigin(0).setDepth(0)
    this.add.rectangle(0, 0, worldW, worldH, spec.floorTint, 0.018).setOrigin(0).setDepth(1)

    const walls = this.physics.add.staticGroup()
    for (const [x, y, w, h] of spec.art.collision) {
      const body = walls.create(x + w / 2, y + h / 2, undefined) as Phaser.Physics.Arcade.Sprite
      body.setVisible(false)
      body.body.setSize(w, h)
    }
    this.buildOccluders(spec, artKey)
    this.buildPracticalLights(spec)

    const [doorX, doorY] = spec.art.exit
    const doorGlow = this.add.image(doorX, doorY - 2, 'atmo_dot').setTint(0xffd48a)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(2.5).setAlpha(0.34).setDepth(DEPTH_LIGHTS)
    if (!useSettingsStore().reducedMotion) {
      this.tweens.add({ targets: doorGlow, alpha: { from: 0.22, to: 0.48 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }
    addPlaque(this, doorX, doorY - 28, spec.exitTarget ? 'ลงสู่ Guild 1F ↓' : 'ออกสู่เมือง ↓', { fontSize: '9px', depth: DEPTH_UI, color: '#f2d18a' })

    const store = usePlayerStore()
    this.gender = store.gender
    const size = heroSheetSize(this.classId, this.gender)
    const playerScale = HERO_DISPLAY_H / size.fh
    const [startX, startY] = this.spawnAt ?? spec.art.spawn
    this.playerShadow = this.add.image(startX, startY + 7, 'shadow_blob').setDepth(playerShadowDepth(startY))
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(playerScale).setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'up'))
    applyStandardHeroBody(this.player, playerScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, playerScale)
    this.gearAura = addGearAura(this, store.gearAuraColor, store.gearRarity)
    this.gearAura?.setDepth(playerAuraDepth(startY))
    this.weaponOverlay = new WeaponOverlay(this)

    this.physics.world.setBounds(0, 0, worldW, worldH)
    const cameraBounds = centeredCameraBounds(worldW, worldH, this.scale.width, this.scale.height)
    this.cameras.main.setBounds(cameraBounds.x, cameraBounds.y, cameraBounds.width, cameraBounds.height)
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14)

    for (const npcSpec of allInteriorNpcs(spec)) this.buildNpc(npcSpec)
    for (const transition of spec.transitions ?? []) this.buildTransition(transition)

    const exitZone = this.physics.add.staticSprite(doorX, doorY, undefined) as Phaser.Physics.Arcade.Sprite
    exitZone.setVisible(false)
    exitZone.body.setSize(54, 16)
    this.physics.add.overlap(this.player, exitZone, () => this.leaveInterior(spec))

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.locomotion = new PlayerLocomotion(this, this.player, FIELD_SPEED, walls)
    addPlaque(this, 8, 8, `${spec.nameTh} · ${spec.nameEn}`, { fontSize: '13px', depth: DEPTH_UI, fixed: true, origin: [0, 0] })
    const hint = addPlaque(this, 8, 36, 'เดินเข้าใกล้ NPC เพื่อคุยและใช้บริการ · ลูกศร / WASD / จอย / คลิกพื้น', { fontSize: '9px', depth: DEPTH_UI, fixed: true, origin: [0, 0], color: '#cdb27a' })
    this.tweens.add({ targets: [hint.label, hint.bg], alpha: 0, delay: 6500, duration: 600, onComplete: () => { hint.label.destroy(); hint.bg.destroy() } })
    playBgm(this, 'town')

    publishMinimapLayout({
      worldW, worldH,
      blocks: spec.art.collision.map(([x, y, w, h]) => ({ x, y, w, h })),
      markers: [
        { kind: 'exit', x: doorX, y: doorY },
        ...allInteriorNpcs(spec).map((npc) => ({ kind: 'npc' as const, x: npc.at[0] * TILE, y: npc.at[1] * TILE })),
        ...(spec.transitions ?? []).map((transition) => ({ kind: 'door' as const, x: transition.at[0], y: transition.at[1] })),
      ],
    })
    this.events.once('shutdown', () => clearMinimap())
  }

  private artKey(spec: InteriorSpec) { return `interior_art_${spec.id}` }

  private buildNpc(npcSpec: InteriorNpcSpec) {
    const npcData = getTownNpc(npcSpec.id)
    if (!npcData || !this.textures.exists(`npc_${npcData.id}`)) return
    const nx = npcSpec.at[0] * TILE
    const ny = npcSpec.at[1] * TILE
    const npcScale = HERO_DISPLAY_H / npcData.frameH
    this.add.image(nx, ny + 4, 'shadow_blob').setDepth(ny - 1)
    const npc = this.add.sprite(nx, ny, `npc_${npcData.id}`, 0).setOrigin(0.5, 0.95).setScale(npcScale).setDepth(ny)
    if (!useSettingsStore().reducedMotion) this.tweens.add({ targets: npc, y: ny - 2, duration: 1550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    addPlaque(this, nx, ny - HERO_DISPLAY_H * 1.03, `${npcData.name} · ${npcData.title}`, { fontSize: '10px', depth: ny + 1, color: '#f7dc96' })
    const zone = this.physics.add.staticSprite(nx, ny + TILE * 0.55, undefined) as Phaser.Physics.Arcade.Sprite
    zone.setVisible(false)
    zone.body.setSize(TILE * 2.4, TILE * 1.55)
    const trigger: NpcTrigger = { zone, spec: npcSpec, latch: false, dialogueIndex: 0, lastInteract: 0 }
    this.npcTriggers.push(trigger)
    this.physics.add.overlap(this.player, zone, () => this.talkToNpc(trigger))
    this.add.image(nx, ny + TILE * 0.5, 'atmo_dot').setTint(0xffedb5)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(1.8).setAlpha(0.16).setDepth(DEPTH_LIGHTS)
  }

  private buildTransition(transition: InteriorTransition) {
    const [x, y] = transition.at
    const zone = this.physics.add.staticSprite(x, y, undefined) as Phaser.Physics.Arcade.Sprite
    zone.setVisible(false)
    const [w, h] = transition.size ?? [48, 30]
    zone.body.setSize(w, h)
    const trigger: TransitionTrigger = { zone, transition, armed: !this.physics.overlap(this.player, zone) }
    this.transitionTriggers.push(trigger)
    addPlaque(this, x, y - 28, transition.labelTh, { fontSize: '9px', depth: DEPTH_UI, color: '#a9d8ff' })
    this.physics.add.overlap(this.player, zone, () => {
      if (!trigger.armed || this.leaving) return
      trigger.armed = false
      this.transitionTo(transition.target, transition.spawnAt)
    })
  }

  private talkToNpc(trigger: NpcTrigger) {
    const now = this.time.now
    if (trigger.latch || now - trigger.lastInteract < 1400) return
    trigger.latch = true
    trigger.lastInteract = now
    this.locomotion?.stopImmediate()
    const lines = trigger.spec.dialogueTh
    const line = lines[trigger.dialogueIndex % lines.length]
    trigger.dialogueIndex++
    gameEvents.emit('notice', { text: `💬 ${line}` })
    gameEvents.emit('npc:interact', {
      npcId: trigger.spec.id,
      service: trigger.spec.service,
      academyCategory: trigger.spec.academyCategory,
    })
  }

  private transitionTo(building: InteriorId, spawnAt: [number, number]) {
    if (this.leaving) return
    this.leaving = true
    this.locomotion?.stopImmediate()
    this.cameras.main.fade(170, 0, 0, 0)
    this.time.delayedCall(190, () => this.scene.start('InteriorScene', { building, floor: this.floor, classId: this.classId, spawnAt }))
  }

  private leaveInterior(spec: InteriorSpec) {
    if (this.leaving) return
    if (spec.exitTarget) { this.transitionTo(spec.exitTarget.building, spec.exitTarget.spawnAt); return }
    const door = INTERIOR_TOWN_DOORS[this.building]
    if (!door) { this.transitionTo('guild', [360, 320]); return }
    this.leaving = true
    this.locomotion?.stopImmediate()
    this.cameras.main.fade(180, 0, 0, 0)
    this.time.delayedCall(200, () => this.scene.start('TownScene', { floor: this.floor, classId: this.classId, spawnAt: door }))
  }

  private buildOccluders(spec: InteriorSpec, artKey: string) {
    const source = this.textures.get(artKey).getSourceImage() as HTMLImageElement
    spec.art.occluders.forEach(([x, y, w, h], index) => {
      const key = `${artKey}_occluder_${index}`
      if (!this.textures.exists(key)) {
        const texture = this.textures.createCanvas(key, w, h)!
        texture.getContext().drawImage(source, x, y, w, h, 0, 0, w, h)
        texture.refresh()
      }
      this.add.image(x, y + h, key).setOrigin(0, 1).setDepth(y + h)
    })
  }

  private buildPracticalLights(spec: InteriorSpec) {
    const reduced = useSettingsStore().reducedMotion
    for (const light of spec.art.lights) {
      if (reduced) {
        this.add.image(light.at[0], light.at[1], 'atmo_dot').setTint(light.color)
          .setBlendMode(Phaser.BlendModes.ADD).setScale(2.6).setAlpha(0.38).setDepth(DEPTH_LIGHTS)
      } else addTorchFlicker(this, light.at[0], light.at[1], DEPTH_LIGHTS, light.color, [light.color])
    }
  }

  update(_time: number, delta: number) {
    if (this.leaving || !this.player || !this.locomotion) return
    const move = this.locomotion.update(this.cursors, this.facing, delta)
    this.player.setVelocity(move.vx, move.vy)
    this.facing = move.facing
    const animation = heroAnim(this.classId, this.gender, move.moving ? 'walk' : 'idle', this.facing)
    if (this.player.anims.currentAnim?.key !== animation) this.player.play(animation)
    this.player.setDepth(playerRenderDepth(this.player.y))
    this.playerShadow.setPosition(this.player.x, this.player.y + 7).setDepth(playerShadowDepth(this.player.y))
    this.gearAura?.setPosition(this.player.x, this.player.y + 4).setDepth(playerAuraDepth(this.player.y))
    this.weaponOverlay.update(this.player, this.facing, usePlayerStore().equipment)
    this.idleBreath.setMoving(move.moving)
    for (const trigger of this.npcTriggers) if (trigger.latch && !this.physics.overlap(this.player, trigger.zone)) trigger.latch = false
    for (const trigger of this.transitionTriggers) if (!trigger.armed && !this.physics.overlap(this.player, trigger.zone)) trigger.armed = true
    this.minimapTicker.tick(this.time.now, { player: { x: this.player.x, y: this.player.y } })
  }
}

