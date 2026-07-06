import Phaser from 'phaser'
import type { HeroClassId } from '../../data/classes'
import { gameEvents } from '../systems/eventBus'
import { getFloorConfig, isTownFloor } from '../../data/floors'
import { biomeForFloor } from '../../data/biomes'
import { getBossRequirement, describeMissingRequirements } from '../../data/bossRequirements'
import { usePlayerStore } from '../../stores/player'
import {
  preloadSharedAssets,
  buildBiomeTextures,
  buildSharedTextures,
  MONSTER_KINDS,
  monsterAnimKey,
} from '../systems/textures'

const TILE = 32
const MAP_W = 24
const MAP_H = 18

export class TowerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private monsters!: Phaser.Physics.Arcade.Group
  private floor = 2
  private inBattle = false
  private facing: 'down' | 'left' | 'right' | 'up' = 'down'
  private classId: HeroClassId = 'warrior'
  private bossUnlocked = true
  private lastNotice = 0

  constructor() {
    super('TowerScene')
  }

  init(data: { floor?: number; classId?: HeroClassId }) {
    this.floor = data.floor ?? 2
    this.classId = data.classId ?? this.classId
    this.inBattle = false
  }

  preload() {
    preloadSharedAssets(this)
  }

  create() {
    const config = getFloorConfig(this.floor)
    const biome = biomeForFloor(this.floor)
    const player = usePlayerStore()

    buildBiomeTextures(this, biome)
    buildSharedTextures(this)

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

    const treeSpots: [number, number][] = [
      [4, 4], [10, 3], [6, 7], [12, 8], [3, 8], [18, 5], [20, 11], [15, 14], [8, 13], [22, 15],
    ]
    for (const [tx, ty] of treeSpots) {
      const tree = walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `${biome.id}_tree`)
      tree.setDepth(ty * TILE)
      tree.body.setSize(TILE * 0.5, TILE * 0.3).setOffset(TILE * 0.25, TILE * 0.6)
    }

    const stairs = this.physics.add.staticSprite((MAP_W - 2) * TILE, TILE * 2, 'tile-stairs')
    stairs.setDepth(1)

    this.add.image(TILE * 2, TILE * (MAP_H - 2) + 14, 'shadow_blob').setDepth((MAP_H - 2) * TILE - 1)
    this.player = this.physics.add.sprite(TILE * 2, TILE * (MAP_H - 2), `hero_idle_${this.classId}`)
    this.player.setCollideWorldBounds(true)
    this.player.play(`hero_idle_${this.classId}_down`)
    this.physics.add.collider(this.player, walls)

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.monsters = this.physics.add.group()

    if (config.isBossFloor) {
      const requirement = getBossRequirement(this.floor)
      this.bossUnlocked = describeMissingRequirements(requirement, player).length === 0
      const bx = MAP_W / 2 * TILE
      const by = TILE * 3
      const boss = this.monsters.create(bx, by, this.bossUnlocked ? 'mob_dragon' : 'boss_door_locked') as Phaser.Physics.Arcade.Sprite
      if (this.bossUnlocked) boss.setScale(0.6)
      boss.setDepth(by)
      boss.setData('config', config)
      boss.setData('isBoss', true)
      boss.setData('requirement', requirement)
      boss.setImmovable(!this.bossUnlocked)
    } else {
      for (let i = 0; i < config.monsterCount; i++) {
        const mx = Phaser.Math.Between(4, MAP_W - 4) * TILE
        const my = Phaser.Math.Between(3, MAP_H - 3) * TILE
        const kind = MONSTER_KINDS[Phaser.Math.Between(0, MONSTER_KINDS.length - 1)]
        const monster = this.monsters.create(mx, my, `anim_${kind}_idle`) as Phaser.Physics.Arcade.Sprite
        monster.play(monsterAnimKey(kind))
        monster.setDepth(my)
        monster.setData('config', config)
      }
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
    let moving = false
    if (this.cursors.left?.isDown) { this.player.setVelocityX(-speed); this.facing = 'left'; moving = true }
    else if (this.cursors.right?.isDown) { this.player.setVelocityX(speed); this.facing = 'right'; moving = true }
    if (this.cursors.up?.isDown) { this.player.setVelocityY(-speed); this.facing = 'up'; moving = true }
    else if (this.cursors.down?.isDown) { this.player.setVelocityY(speed); this.facing = 'down'; moving = true }
    const anim = `hero_${moving ? 'walk' : 'idle'}_${this.classId}_${this.facing}`
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim)
    this.player.setDepth(this.player.y)
  }

  private onEncounterMonster(monster: Phaser.Physics.Arcade.Sprite) {
    if (this.inBattle) return
    const isBoss = monster.getData('isBoss') as boolean | undefined
    if (isBoss && !this.bossUnlocked) {
      const now = this.time.now
      if (now - this.lastNotice > 1500) {
        this.lastNotice = now
        const requirement = monster.getData('requirement')
        const player = usePlayerStore()
        const missing = describeMissingRequirements(requirement, player)
        gameEvents.emit('notice', { text: `Boss door locked. Missing: ${missing.join(', ')}` })
      }
      return
    }
    this.inBattle = true
    monster.destroy()
    gameEvents.emit('battle:start', { floor: this.floor })
  }

  private handleBattleEnd = (payload: { won: boolean }) => {
    this.inBattle = false
    if (!payload.won) {
      // แพ้ = หมดสติ ฟื้นที่ชั้นเดิม ไม่เสียเซฟ
      this.scene.restart({ floor: this.floor, classId: this.classId })
    }
  }

  private onReachStairs() {
    if (this.inBattle) return
    if (this.monsters.countActive(true) > 0) return
    const nextFloor = this.floor + 1
    gameEvents.emit('floor:advance', { floor: nextFloor })
    if (isTownFloor(nextFloor)) {
      this.scene.start('TownScene', { floor: nextFloor, classId: this.classId })
    } else {
      this.scene.restart({ floor: nextFloor, classId: this.classId })
    }
  }
}
