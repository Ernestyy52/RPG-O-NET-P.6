import Phaser from 'phaser'
import type { Biome } from '../../data/biomes'

const TILE = 32
const SRC = 16
const KSCALE = TILE / SRC

const ART = {
  outline: 0x2a1e1c,
  goldLight: 0xffe08a,
}

// เฟรมในสไปรท์ชีต tiny-town (12 คอลัมน์ x 11 แถว, 16px ต่อเฟรม)
const GRASS_FRAME = 0
const TREE_FRAME = 28

export function preloadSharedAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('tiny_town')) return
  scene.load.spritesheet('tiny_town', '/tiny-town/tilemap_packed.png', { frameWidth: SRC, frameHeight: SRC })

  scene.load.spritesheet('hero_walk', '/player-sprites/overworld/warrior_walk.png', { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('hero_idle', '/player-sprites/overworld/warrior_idle.png', { frameWidth: 32, frameHeight: 32 })

  scene.load.spritesheet('anim_goblin_idle', '/mob-sprites/orc-idle.png', { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('anim_skeleton_idle', '/mob-sprites/skeleton-idle.png', { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('anim_slime_idle', '/mob-sprites/slime-idle.png', { frameWidth: 64, frameHeight: 64 })
  scene.load.image('mob_dragon', '/mob-sprites/dragon.png')
}

function tileImg(scene: Phaser.Scene, frame: number) {
  const img = scene.make.image({ key: 'tiny_town', frame }, false)
  img.setOrigin(0, 0)
  img.setScale(KSCALE)
  return img
}

function washGfx(scene: Phaser.Scene, w: number, h: number, color: number, alpha: number) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  g.fillStyle(color, alpha).fillRect(0, 0, w, h)
  return g
}

function bakeFrame(scene: Phaser.Scene, key: string, frame: number, wash: { color: number; alpha: number }) {
  const rt = scene.make.renderTexture({ width: TILE, height: TILE }, false)
  const img = tileImg(scene, frame)
  rt.draw(img, 0, 0)
  img.destroy()
  const g = washGfx(scene, TILE, TILE, wash.color, wash.alpha)
  rt.draw(g, 0, 0)
  g.destroy()
  rt.saveTexture(key)
  rt.destroy()
}

function buildGrass(scene: Phaser.Scene, biome: Biome) {
  bakeFrame(scene, `${biome.id}_grass`, GRASS_FRAME, { color: biome.grass.base, alpha: 0.35 })
}

function buildTree(scene: Phaser.Scene, biome: Biome) {
  bakeFrame(scene, `${biome.id}_tree`, TREE_FRAME, { color: biome.tree.leaf, alpha: 0.3 })
}

function buildWall(scene: Phaser.Scene, biome: Biome) {
  const g = scene.add.graphics()
  g.fillStyle(biome.wallBase, 1).fillRect(0, 0, TILE, TILE)
  g.lineStyle(1, ART.outline, 0.5)
  g.strokeRect(0, 0, TILE / 2, TILE / 2)
  g.strokeRect(TILE / 2, 0, TILE / 2, TILE / 2)
  g.strokeRect(0, TILE / 2, TILE / 2, TILE / 2)
  g.strokeRect(TILE / 2, TILE / 2, TILE / 2, TILE / 2)
  g.generateTexture(`${biome.id}_wall`, TILE, TILE)
  g.destroy()
}

function buildStairs(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(ART.goldLight, 1).fillRect(0, 0, TILE, TILE)
  g.fillStyle(0xd99236, 1).fillRect(4, 4, TILE - 8, TILE - 8)
  g.lineStyle(1, ART.outline, 0.6).strokeRect(0, 0, TILE, TILE)
  g.generateTexture('tile-stairs', TILE, TILE)
  g.destroy()
}

function buildShadow(scene: Phaser.Scene) {
  if (scene.textures.exists('shadow_blob')) return
  const w = 24
  const h = 10
  const tex = scene.textures.createCanvas('shadow_blob', w, h)
  const ctx = tex!.getContext()
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  grad.addColorStop(0, 'rgba(0,0,0,0.4)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  tex!.refresh()
}

function buildBuilding(scene: Phaser.Scene) {
  if (scene.textures.exists('town_building')) return
  const w = TILE * 2
  const h = TILE * 2
  const g = scene.add.graphics()
  g.fillStyle(0x8a5a34, 1).fillRect(0, h * 0.4, w, h * 0.6)
  g.fillStyle(0xb0432a, 1).fillTriangle(0, h * 0.4, w / 2, 0, w, h * 0.4)
  g.fillStyle(0x5a3a1e, 1).fillRect(w / 2 - 8, h - 20, 16, 20)
  g.lineStyle(1, ART.outline, 0.5).strokeRect(0, h * 0.4, w, h * 0.6)
  g.generateTexture('town_building', w, h)
  g.destroy()
}

function buildHeroAnimations(scene: Phaser.Scene) {
  if (scene.anims.exists('hero_idle_down')) return
  const dirs = ['down', 'left', 'right', 'up'] as const
  dirs.forEach((dir, row) => {
    scene.anims.create({
      key: `hero_idle_${dir}`,
      frames: scene.anims.generateFrameNumbers('hero_idle', { start: row * 12, end: row * 12 + 11 }),
      frameRate: 6,
      repeat: -1,
    })
    scene.anims.create({
      key: `hero_walk_${dir}`,
      frames: scene.anims.generateFrameNumbers('hero_walk', { start: row * 6, end: row * 6 + 5 }),
      frameRate: 10,
      repeat: -1,
    })
  })
}

function buildMonsterAnimations(scene: Phaser.Scene) {
  if (scene.anims.exists('goblin_idle')) return
  scene.anims.create({
    key: 'goblin_idle',
    frames: scene.anims.generateFrameNumbers('anim_goblin_idle', { start: 0, end: 3 }),
    frameRate: 4,
    repeat: -1,
  })
  scene.anims.create({
    key: 'skeleton_idle',
    frames: scene.anims.generateFrameNumbers('anim_skeleton_idle', { start: 0, end: 3 }),
    frameRate: 4,
    repeat: -1,
  })
  scene.anims.create({
    key: 'slime_idle',
    frames: scene.anims.generateFrameNumbers('anim_slime_idle', { start: 0, end: 5 }),
    frameRate: 6,
    repeat: -1,
  })
}

export function buildBiomeTextures(scene: Phaser.Scene, biome: Biome) {
  if (scene.textures.exists(`${biome.id}_grass`)) return
  buildGrass(scene, biome)
  buildTree(scene, biome)
  buildWall(scene, biome)
}

export function buildSharedTextures(scene: Phaser.Scene) {
  buildStairs(scene)
  buildShadow(scene)
  buildBuilding(scene)
  buildHeroAnimations(scene)
  buildMonsterAnimations(scene)
}

export const MONSTER_KINDS = ['goblin', 'skeleton', 'slime'] as const
export type MonsterKind = (typeof MONSTER_KINDS)[number]

export function monsterAnimKey(kind: MonsterKind): string {
  return `${kind}_idle`
}
