import Phaser from 'phaser'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { buildBiomeTextures, buildSharedTextures } from '../systems/textures'

const TILE = 32
const MAP_W = 15
const MAP_H = 11

export class TowerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private floor = 1
  private inBattle = false

  constructor() {
    super('TowerScene')
  }

  init(data: { floor?: number }) {
    this.floor = data.floor ?? 1
    this.inBattle = false
  }

  preload() {
    const biome = biomeForFloor(this.floor)
    buildBiomeTextures(this, biome)
    buildSharedTextures(this)
  }

  create() {
    const config = getFloorConfig(this.floor)
    const biome = biomeForFloor(this.floor)
    const isTownFloor = this.floor % 10 === 1

    this.cameras.main.setBackgroundColor(biome.bg)

    // พื้นหญ้าตามไบโอมของช่วงชั้นนั้น
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_grass`).setDepth(0)
      }
    }

    // กำแพงขอบแมพ
    const walls = this.physics.add.staticGroup()
    for (let x = 0; x < MAP_W; x++) {
      walls.create(x * TILE + TILE / 2, TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create(x * TILE + TILE / 2, (MAP_H - 1) * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }
    for (let y = 0; y < MAP_H; y++) {
      walls.create(TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
      walls.create((MAP_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, `${biome.id}_wall`).setDepth(1)
    }

    // ต้นไม้กระจายในแมพเป็นสิ่งกีดขวาง (เว้นชั้นเมือง ใช้อาคารแทน)
    if (isTownFloor) {
      this.add.image(TILE * 11, TILE * 4, 'town_building').setDepth(2).setOrigin(0.5, 0.75)
    } else {
      const treeSpots = [
        [4, 4], [10, 3], [6, 7], [12, 8], [3, 8],
      ]
      for (const [tx, ty] of treeSpots) {
        const tree = walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `${biome.id}_tree`)
        tree.setDepth(ty * TILE)
        tree.body.setSize(TILE * 0.5, TILE * 0.3).setOffset(TILE * 0.25, TILE * 0.6)
      }
    }

    // บันไดขึ้นชั้นถัดไป
    const stairs = this.physics.add.staticSprite((MAP_W - 2) * TILE, TILE * 2, 'tile-stairs')
    stairs.setDepth(1)

    this.add.image(TILE * 2, TILE * (MAP_H - 2) + 6, 'shadow_blob').setDepth((MAP_H - 2) * TILE - 1)
    this.player = this.physics.add.sprite(TILE * 2, TILE * (MAP_H - 2), 'player')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, walls)

    this.monsters = this.physics.add.group()
    for (let i = 0; i < config.monsterCount; i++) {
      const mx = Phaser.Math.Between(4, MAP_W - 4) * TILE
      const my = Phaser.Math.Between(3, MAP_H - 3) * TILE
      const monster = this.monsters.create(mx, my, config.isBossFloor ? 'boss' : 'monster')
      monster.setDepth(my)
      monster.setData('config', config)
    }

    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))
    this.physics.add.overlap(this.player, stairs, () => this.onReachStairs())

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.add.text(8, 8, `${biome.name} - Floor ${this.floor}${config.isBossFloor ? ' - BOSS' : ''}`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#f7e7c5',
      backgroundColor: '#1b1411cc',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(100)

    gameEvents.on('battle:end', this.handleBattleEnd, this)
    this.events.once('shutdown', () => gameEvents.off('battle:end', this.handleBattleEnd, this))
  }

  update() {
    if (this.inBattle) {
      this.player.setVelocity(0)
      return
    }
    const speed = 120
    this.player.setVelocity(0)
    if (this.cursors.left?.isDown) this.player.setVelocityX(-speed)
    else if (this.cursors.right?.isDown) this.player.setVelocityX(speed)
    if (this.cursors.up?.isDown) this.player.setVelocityY(-speed)
    else if (this.cursors.down?.isDown) this.player.setVelocityY(speed)
    this.player.setDepth(this.player.y)
  }

  private onEncounterMonster(monster: Phaser.Physics.Arcade.Sprite) {
    if (this.inBattle) return
    this.inBattle = true
    monster.destroy()
    gameEvents.emit('battle:start', { floor: this.floor })
  }

  private handleBattleEnd = (payload: { won: boolean }) => {
    this.inBattle = false
    if (!payload.won) {
      // แพ้ = หมดสติ ฟื้นที่ชั้นเดิม ไม่เสียเซฟ
      this.scene.restart({ floor: this.floor })
    }
  }

  private onReachStairs() {
    if (this.inBattle) return
    if (this.monsters.countActive(true) > 0) return
    gameEvents.emit('floor:advance', { floor: this.floor + 1 })
    this.scene.restart({ floor: this.floor + 1 })
  }
}
