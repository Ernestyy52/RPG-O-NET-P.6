import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { biomeForFloor } from '../../data/biomes'
import { getWorldState } from '../../data/world'
import { gameEvents } from '../systems/eventBus'
import { applyAtmosphere, addTorchFlicker } from '../systems/atmosphere'
import { preloadBgm, playBgm } from '../systems/bgm'
import { assetPath } from '../systems/textures'
import {
  preloadSharedAssets,
  preloadTownAssets,
  buildBiomeTextures,
  buildSharedTextures,
  buildTownTextures,
  heroKey,
  heroAnim,
  heroSheetSize,
} from '../systems/textures'
import { usePlayerStore } from '../../stores/player'

const TILE = 32
const MAP_W = 26
const MAP_H = 19

interface BuildingSpot {
  key: string
  x: number
  y: number
  originY: number
  label: string
  event: 'town:hospital' | 'town:item-shop' | 'town:equipment-shop' | 'town:guild'
  scale?: number
}

export class TownScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private gender = 'male'
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private floor = 1
  private classId: HeroClassId = 'warrior'
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private lastInteract = 0

  constructor() {
    super('TownScene')
  }

  init(data: { floor?: number; classId?: HeroClassId }) {
    this.floor = data.floor ?? 1
    this.classId = data.classId ?? 'warrior'
  }

  preload() {
    preloadSharedAssets(this)
    preloadTownAssets(this)
    preloadBgm(this, 'town', assetPath)
  }

  create() {
    const biome = biomeForFloor(this.floor)
    buildBiomeTextures(this, biome)
    buildSharedTextures(this)
    buildTownTextures(this)

    this.cameras.main.setBackgroundColor(biome.bg)

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

    // ต้นไม้ประดับมุมเมือง
    const treeSpots: [number, number][] = [[3, 3], [MAP_W - 4, 3], [3, MAP_H - 4], [MAP_W - 4, MAP_H - 4], [MAP_W / 2, 3]]
    for (const [tx, ty] of treeSpots) {
      const tree = walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `${biome.id}_tree`)
      tree.setDepth(ty * TILE)
      tree.body.setSize(TILE * 0.5, TILE * 0.3).setOffset(TILE * 0.25, TILE * 0.6)
    }

    // คบเพลิง/อัญมณีตกแต่งข้างทางเดินหลัก
    const decorSpots: [number, number, string][] = [
      [6, MAP_H - 3, 'decor_torch'], [MAP_W - 7, MAP_H - 3, 'decor_torch'],
      [MAP_W / 2 - 4, MAP_H / 2, 'decor_gem_cyan'], [MAP_W / 2 + 4, MAP_H / 2, 'decor_gem_orange'],
    ]
    for (const [dx, dy, key] of decorSpots) {
      const px = dx * TILE
      const py = dy * TILE
      const img = this.add.image(px, py, key).setScale(0.34).setDepth(py)
      if (key === 'decor_torch') {
        addTorchFlicker(this, px, py - 6, py + 1)
      } else {
        // อัญมณีเรืองแสง: เต้นเบาๆ
        this.tweens.add({ targets: img, scale: { from: 0.3, to: 0.4 }, alpha: { from: 0.75, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
    }

    const buildings: BuildingSpot[] = [
      { key: 'town_hospital', x: 6, y: 5, originY: 0.75, label: 'Hospital', event: 'town:hospital' },
      { key: 'town_guild_hall', x: MAP_W - 7, y: 5, originY: 0.8, label: 'Guild Hall', event: 'town:guild', scale: 0.9 },
      { key: 'town_item_shop', x: 6, y: MAP_H - 7, originY: 0.85, label: 'Item Shop', event: 'town:item-shop' },
      { key: 'town_equipment_shop', x: MAP_W - 7, y: MAP_H - 7, originY: 0.75, label: 'Equipment Shop', event: 'town:equipment-shop' },
    ]

    const interactZones = this.physics.add.staticGroup()
    for (const b of buildings) {
      const px = b.x * TILE
      const py = b.y * TILE
      const sprite = this.add.image(px, py, b.key).setOrigin(0.5, b.originY).setDepth(py)
      if (b.scale) sprite.setScale(b.scale)
      this.add.text(px, py + 14, b.label, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#f7e7c5',
        backgroundColor: '#1b1411cc',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 0).setDepth(py + 1)

      const zone = interactZones.create(px, py + TILE * 0.6, undefined) as Phaser.Physics.Arcade.Sprite
      zone.setVisible(false)
      zone.body.setSize(TILE * 1.4, TILE)
      zone.setData('event', b.event)
    }

    // ประตูดันเจี้ยน = ผู้เฝ้าประตู (Portal.png) — ลอยเรืองแสงกลางเมือง
    const gateX = MAP_W / 2 * TILE
    const gateY = (MAP_H - 5) * TILE
    const gate = this.physics.add.staticSprite(gateX, gateY, 'portal_gate')
    gate.setOrigin(0.5, 0.86).setScale(0.62).setDepth(gateY)
    gate.body.setSize(gate.width * 0.5, gate.height * 0.3).setOffset(gate.width * 0.25, gate.height * 0.5)
    gate.refreshBody()
    this.tweens.add({ targets: gate, alpha: { from: 0.9, to: 1 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.add.text(gateX, gateY + 8, 'Dungeon Portal', {
      fontSize: '11px', fontFamily: 'monospace', color: '#bcd2ff', backgroundColor: '#100c1acc', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 0).setDepth(gateY + 1)

    this.gender = usePlayerStore().gender
    const size = heroSheetSize(this.classId, this.gender)
    const scale = 48 / size.fh
    this.add.image(4 * TILE, (MAP_H - 3) * TILE + 8, 'shadow_blob').setDepth((MAP_H - 3) * TILE - 1)
    this.player = this.physics.add.sprite(4 * TILE, (MAP_H - 3) * TILE, heroKey(this.classId, this.gender))
    this.player.setOrigin(0.5, 0.92).setScale(scale)
    this.player.setCollideWorldBounds(true)
    this.player.play(heroAnim(this.classId, this.gender, 'idle', 'down'))
    this.player.body.setSize(size.fw * 0.5, size.fh * 0.22).setOffset(size.fw * 0.25, size.fh * 0.72)
    this.physics.add.collider(this.player, walls)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.physics.add.overlap(this.player, interactZones, (_p, z) => {
      const event = (z as Phaser.Physics.Arcade.Sprite).getData('event')
      this.tryInteract(event)
    })
    this.physics.add.overlap(this.player, gate, () => this.tryInteract('portal'))

    // ผู้เฝ้าประตูอนุญาต -> เข้าดันเจี้ยนจริง (สั่งจากกล่องสนทนาฝั่ง UI)
    const enterDungeon = () => this.scene.start('TowerScene', { floor: this.floor + 1, classId: this.classId })
    gameEvents.on('town:enter-dungeon', enterDungeon)
    this.events.once('shutdown', () => gameEvents.off('town:enter-dungeon', enterDungeon))

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.add.text(8, 8, `${biome.name} - Town (Floor ${this.floor})`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#f7e7c5',
      backgroundColor: '#1b1411cc',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(100)

    this.add.text(8, 30, 'Walk into a building to use it. Approach the glowing Portal to enter the dungeon.', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#f7e7c5',
      backgroundColor: '#1b1411aa',
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100)

    applyAtmosphere(this, biome, getWorldState())
    playBgm(this, 'town')
  }

  update() {
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
