import Phaser from 'phaser'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig } from '../../data/floors'

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
    this.generateTextures()
  }

  create() {
    const config = getFloorConfig(this.floor)

    // พื้นหญ้า
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'tile-grass')
      }
    }

    // กำแพงขอบแมพ
    const walls = this.physics.add.staticGroup()
    for (let x = 0; x < MAP_W; x++) {
      walls.create(x * TILE + TILE / 2, TILE / 2, 'tile-wall')
      walls.create(x * TILE + TILE / 2, (MAP_H - 1) * TILE + TILE / 2, 'tile-wall')
    }
    for (let y = 0; y < MAP_H; y++) {
      walls.create(TILE / 2, y * TILE + TILE / 2, 'tile-wall')
      walls.create((MAP_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, 'tile-wall')
    }

    // บันไดขึ้นชั้นถัดไป
    const stairs = this.physics.add.staticSprite((MAP_W - 2) * TILE, TILE * 2, 'tile-stairs')

    this.player = this.physics.add.sprite(TILE * 2, TILE * (MAP_H - 2), 'player')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, walls)

    this.monsters = this.physics.add.group()
    for (let i = 0; i < config.monsterCount; i++) {
      const mx = Phaser.Math.Between(4, MAP_W - 4) * TILE
      const my = Phaser.Math.Between(3, MAP_H - 3) * TILE
      const monster = this.monsters.create(mx, my, config.isBossFloor ? 'boss' : 'monster')
      monster.setData('config', config)
    }

    this.physics.add.overlap(this.player, this.monsters, (_p, m) => this.onEncounterMonster(m as Phaser.Physics.Arcade.Sprite))
    this.physics.add.overlap(this.player, stairs, () => this.onReachStairs())

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.add.text(8, 8, `Floor ${this.floor}${config.isBossFloor ? ' - BOSS' : ''}`, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(10)

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

  private generateTextures() {
    const g = this.add.graphics()

    g.fillStyle(0x4caf50, 1).fillRect(0, 0, TILE, TILE)
    g.lineStyle(1, 0x3d8b40, 1).strokeRect(0, 0, TILE, TILE)
    g.generateTexture('tile-grass', TILE, TILE)
    g.clear()

    g.fillStyle(0x6d4c41, 1).fillRect(0, 0, TILE, TILE)
    g.generateTexture('tile-wall', TILE, TILE)
    g.clear()

    g.fillStyle(0xffd54f, 1).fillRect(0, 0, TILE, TILE)
    g.fillStyle(0xffa000, 1).fillRect(4, 4, TILE - 8, TILE - 8)
    g.generateTexture('tile-stairs', TILE, TILE)
    g.clear()

    g.fillStyle(0x2196f3, 1).fillCircle(TILE / 2, TILE / 2, TILE / 2 - 4)
    g.generateTexture('player', TILE, TILE)
    g.clear()

    g.fillStyle(0xe53935, 1).fillCircle(TILE / 2, TILE / 2, TILE / 2 - 6)
    g.generateTexture('monster', TILE, TILE)
    g.clear()

    g.fillStyle(0x8e24aa, 1).fillCircle(TILE / 2, TILE / 2, TILE / 2 - 2)
    g.generateTexture('boss', TILE, TILE)
    g.destroy()
  }
}
