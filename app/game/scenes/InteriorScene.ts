import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getInterior, INTERIOR_TOWN_DOORS, type InteriorId } from '../../data/town/interiors'
import { getTownNpc } from '../../data/world1/npcs'
import { usePlayerStore } from '../../stores/player'
import { useSettingsStore } from '../../stores/settings'
import { addPlaque, addWindowGlow, createIdleBreath, addGearAura } from '../systems/atmosphere'
import {
  assetPath, preloadSharedAssets, buildSharedTextures,
  heroKey, heroIdleFrame, heroAnim, heroSheetSize, HERO_DISPLAY_H, applyStandardHeroBody,
} from '../systems/textures'
import { preloadBgm, playBgm } from '../systems/bgm'

const TILE = 32

// ================================================================================================
// InteriorScene — ห้องภายในอาคารเมือง (data-driven จาก app/data/town/interiors.ts)
// ผู้เล่นเดินเข้าประตูอาคารใน TownScene → มาอยู่ในห้องนี้: พื้น/ผนังปูจาก tile จริง (Craftpix),
// พร็อพแน่นพอดี ๆ (ชนได้เฉพาะตัวที่ solid), NPC ประจำร้านยืนรอพร้อมบทพูดหมุนเวียน — เดินชน NPC
// = ได้ยินหนึ่งประโยค + เปิดบริการของอาคารนั้น (ฮีล/ร้านค้า/กิลด์) ผ่าน event เดิมทุกประการ
// ประตูพรมด้านล่าง = กลับออกไปยืนหน้าอาคารเดิมในเมือง
// ================================================================================================
export class InteriorScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private building: InteriorId = 'guild'
  private floor = 1
  private classId: HeroClassId = 'warrior'
  private gender = 'male'
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private lastInteract = 0
  private dialogueIndex = 0
  private leaving = false
  // latch กันสแปม: ยืนแช่บนโซน NPC จะไม่ trigger ซ้ำ — ต้องเดินออกจากโซนก่อนหนึ่งครั้ง
  private npcZone?: Phaser.Physics.Arcade.Sprite
  private npcLatch = false
  private idleBreath!: ReturnType<typeof createIdleBreath>
  private gearAura?: Phaser.GameObjects.Image | null

  constructor() {
    super('InteriorScene')
  }

  init(data: { building?: InteriorId; floor?: number; classId?: HeroClassId }) {
    this.building = data.building ?? 'guild'
    this.floor = data.floor ?? 1
    this.classId = data.classId ?? 'warrior'
    this.leaving = false
  }

  preload() {
    preloadSharedAssets(this)
    const spec = getInterior(this.building)
    if (!spec) return
    // พื้น/ผนัง — tile กลางของ pack (ใช้ร่วมกันทุกอาคาร แล้วย้อมสีตามอาคาร)
    if (!this.textures.exists('int_floor0')) this.load.image('int_floor0', assetPath('interior-props/guild_floor0.png'))
    if (!this.textures.exists('int_floor1')) this.load.image('int_floor1', assetPath('interior-props/guild_floor1.png'))
    if (!this.textures.exists('int_wall')) this.load.image('int_wall', assetPath('interior-props/guild_wall.png'))
    for (const prop of spec.props) {
      if (prop.sprite && !this.textures.exists(prop.key)) this.load.image(prop.key, assetPath(prop.sprite))
    }
    const npc = getTownNpc(spec.npc.id)
    if (npc && !this.textures.exists(`npc_${npc.id}`)) {
      this.load.spritesheet(`npc_${npc.id}`, assetPath(npc.sprite), { frameWidth: npc.frameW, frameHeight: npc.frameH })
    }
    preloadBgm(this, 'town', assetPath)
  }

  create() {
    const spec = getInterior(this.building)
    if (!spec) { this.exitToTown(); return }
    buildSharedTextures(this)
    this.buildBedTexture()

    const W = spec.tiles.w
    const H = spec.tiles.h
    const worldW = W * TILE
    const worldH = H * TILE
    this.cameras.main.setBackgroundColor(0x0a0810)
    this.cameras.main.fadeIn(240)

    // ---- พื้น (checker floor0/floor1 ย้อมโทนตามอาคาร) + แถบผนังสองแถวบน ----
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (y < 2) {
          this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'int_wall').setDepth(0)
        } else {
          this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, (x + y) % 2 ? 'int_floor1' : 'int_floor0')
            .setTint(spec.floorTint).setDepth(0)
        }
      }
    }
    // เงาขอบห้อง (vignette เบา ๆ ให้ห้องดูอุ่น ไม่แบน)
    this.add.rectangle(0, 0, worldW, TILE * 2.4, 0x000000, 0.25).setOrigin(0).setDepth(1)
    this.add.rectangle(0, worldH - TILE, worldW, TILE, 0x000000, 0.18).setOrigin(0).setDepth(1)

    // ---- กำแพงฟิสิกส์: แถบผนังบน + ขอบสามด้าน (ประตูอยู่ล่างกลาง) ----
    const walls = this.physics.add.staticGroup()
    const solid = (cx: number, cy: number, w: number, h: number) => {
      const b = walls.create(cx, cy, undefined) as Phaser.Physics.Arcade.Sprite
      b.setVisible(false)
      b.body.setSize(w, h)
    }
    solid(worldW / 2, TILE, worldW, TILE * 2)                       // ผนังบน
    solid(TILE * 0.25, worldH / 2, TILE * 0.5, worldH)              // ซ้าย
    solid(worldW - TILE * 0.25, worldH / 2, TILE * 0.5, worldH)     // ขวา
    // ผนังล่างเว้นช่องประตูตรงกลาง (กว้าง 2 tile)
    const doorHalf = TILE
    solid((worldW / 2 - doorHalf) / 2, worldH - TILE * 0.25, worldW / 2 - doorHalf, TILE * 0.5)
    solid(worldW - (worldW / 2 - doorHalf) / 2, worldH - TILE * 0.25, worldW / 2 - doorHalf, TILE * 0.5)

    // ---- พร็อพ (จาก data — ตัว solid ได้กล่องชนที่ "ตีน" เพื่อเดินอ้อมหลังได้) ----
    for (const prop of spec.props) {
      if (!this.textures.exists(prop.key)) continue
      const px = prop.at[0] * TILE
      const py = prop.at[1] * TILE
      const img = this.add.image(px, py, prop.key).setScale(prop.scale ?? 1)
      img.setOrigin(0.5, 0.85).setDepth(py)
      if (prop.solid) {
        const w = img.displayWidth * 0.7
        const h = Math.max(10, img.displayHeight * 0.28)
        const b = walls.create(px, py - h / 2, undefined) as Phaser.Physics.Arcade.Sprite
        b.setVisible(false)
        b.body.setSize(w, h)
      }
    }

    // ---- แสงหน้าต่างอุ่น ๆ บนแถบผนัง ----
    for (const wx of [2.5, 7, 11.5]) addWindowGlow(this, wx * TILE, TILE * 1.1, 600)

    // ---- ประตูออก (พรม + แสง) ----
    const doorX = worldW / 2
    const doorY = worldH - TILE * 0.6
    this.add.rectangle(doorX, doorY, TILE * 2, TILE * 0.9, 0x8a5a30, 0.9).setDepth(2)
    this.add.rectangle(doorX, doorY, TILE * 1.7, TILE * 0.6, 0xb4854e, 0.9).setDepth(2.1)
    const doorGlow = this.add.image(doorX, doorY, 'atmo_dot').setTint(0xffe2a8)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(3).setAlpha(0.35).setDepth(600)
    if (!useSettingsStore().reducedMotion) {
      this.tweens.add({ targets: doorGlow, alpha: { from: 0.25, to: 0.5 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }
    addPlaque(this, doorX, doorY - TILE * 0.9, 'ออกสู่เมือง ▼', { fontSize: '9px', depth: 601, color: '#cdb27a' })

    // ---- ผู้เล่น (เกิดหน้าประตู) ----
    const store = usePlayerStore()
    this.gender = store.gender
    const size = heroSheetSize(this.classId, this.gender)
    const pScale = HERO_DISPLAY_H / size.fh
    const startX = doorX
    const startY = worldH - TILE * 1.8
    this.add.image(startX, startY + 8, 'shadow_blob').setDepth(startY - 1)
    this.player = this.physics.add.sprite(startX, startY, heroKey(this.classId, this.gender), heroIdleFrame(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(pScale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'up'))
    applyStandardHeroBody(this.player, pScale)
    this.physics.add.collider(this.player, walls)
    this.idleBreath = createIdleBreath(this, this.player, pScale)
    this.gearAura = addGearAura(this, store.gearAuraColor, store.gearRarity)
    this.gearAura?.setDepth(startY - 2)

    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15)

    // ---- NPC ประจำอาคาร (หลังสร้างผู้เล่น เพื่อผูก overlap ได้เลย) ----
    const npcData = getTownNpc(spec.npc.id)
    if (npcData && this.textures.exists(`npc_${npcData.id}`)) {
      const nx = spec.npc.at[0] * TILE
      const ny = spec.npc.at[1] * TILE
      const scale = HERO_DISPLAY_H / npcData.frameH
      this.add.image(nx, ny + 4, 'shadow_blob').setDepth(ny - 1)
      const spr = this.add.sprite(nx, ny, `npc_${npcData.id}`, 0).setOrigin(0.5, 0.95).setScale(scale).setDepth(ny)
      if (!useSettingsStore().reducedMotion) {
        this.tweens.add({ targets: spr, y: ny - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
      addPlaque(this, nx, ny - HERO_DISPLAY_H * 1.05, `${npcData.name} · ${npcData.title}`, { fontSize: '10px', depth: ny + 1, color: '#f2d98a' })
      // วงโต้ตอบ: เดินเข้าใกล้ = คุย + เปิดบริการ
      const zone = this.physics.add.staticSprite(nx, ny + TILE * 0.4, undefined) as Phaser.Physics.Arcade.Sprite
      zone.setVisible(false)
      zone.body.setSize(TILE * 2.6, TILE * 1.8)
      this.npcZone = zone
      this.physics.add.overlap(this.player, zone, () => this.talkToNpc(spec.npc.dialogueTh, spec.event))
      const hintGlow = this.add.image(nx, ny + TILE * 0.3, 'atmo_dot').setTint(0xfff2b0)
        .setBlendMode(Phaser.BlendModes.ADD).setScale(2.6).setAlpha(0.25).setDepth(600)
      if (!useSettingsStore().reducedMotion) {
        this.tweens.add({ targets: hintGlow, alpha: { from: 0.15, to: 0.4 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
    }

    // เดินออกทางประตูล่าง (ทะลุขอบล่างช่วงกลาง) = กลับเมือง
    const exitZone = this.physics.add.staticSprite(doorX, worldH - TILE * 0.2, undefined) as Phaser.Physics.Arcade.Sprite
    exitZone.setVisible(false)
    exitZone.body.setSize(TILE * 2, TILE * 0.5)
    this.physics.add.overlap(this.player, exitZone, () => this.exitToTown())

    this.cursors = this.input.keyboard!.createCursorKeys()
    addPlaque(this, 8, 8, `${spec.nameTh} · ${spec.nameEn}`, { fontSize: '13px', depth: 1000, fixed: true, origin: [0, 0] })
    playBgm(this, 'town')
  }

  /** เตียงพยาบาลแบบ pixel — วาดสดเพราะ pack ที่มีไม่มีเตียง (ออกแบบเองตามที่ตกลง) */
  private buildBedTexture() {
    if (this.textures.exists('interior_bed')) return
    const g = this.add.graphics()
    g.fillStyle(0x6a4526).fillRect(0, 0, 26, 44)          // โครงไม้
    g.fillStyle(0x8a5f38).fillRect(1, 1, 24, 42)
    g.fillStyle(0xf0ead8).fillRect(3, 3, 20, 38)          // ฟูก
    g.fillStyle(0xffffff).fillRect(4, 5, 18, 9)           // หมอน
    g.fillStyle(0xb03a30).fillRect(3, 17, 20, 22)         // ผ้าห่มแดง
    g.fillStyle(0xd05a4a).fillRect(3, 17, 20, 4)          // ขอบผ้าห่ม
    g.generateTexture('interior_bed', 26, 44)
    g.destroy()
  }

  private talkToNpc(lines: string[], event: string) {
    const now = this.time.now
    if (this.npcLatch || now - this.lastInteract < 1600) return
    this.npcLatch = true
    this.lastInteract = now
    const line = lines[this.dialogueIndex % lines.length]
    this.dialogueIndex++
    gameEvents.emit('notice', { text: `💬 ${line}` })
    gameEvents.emit(event as 'town:hospital' | 'town:item-shop' | 'town:equipment-shop' | 'town:guild')
  }

  private exitToTown() {
    if (this.leaving) return
    this.leaving = true
    const door = INTERIOR_TOWN_DOORS[this.building]
    this.cameras.main.fade(200, 0, 0, 0)
    this.time.delayedCall(220, () => {
      this.scene.start('TownScene', { floor: this.floor, classId: this.classId, spawnAt: door })
    })
  }

  update() {
    if (this.leaving || !this.player) return
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
    // ปลด latch เมื่อผู้เล่นเดินพ้นโซน NPC แล้ว — เข้าใหม่ค่อยคุยรอบถัดไป
    if (this.npcLatch && this.npcZone && !this.physics.overlap(this.player, this.npcZone)) {
      this.npcLatch = false
    }
  }
}
