import Phaser from 'phaser'
import type { Biome } from '../../data/biomes'

const TILE = 32
const SRC = 16
const KSCALE = TILE / SRC

const ART = {
  outline: 0x2a1e1c,
  goldLight: 0xffe08a,
}

// เน€เธเธฃเธกเนเธเธชเนเธเธฃเธ—เนเธเธตเธ• tiny-town (12 เธเธญเธฅเธฑเธกเธเน x 11 เนเธ–เธง, 16px เธ•เนเธญเน€เธเธฃเธก)
const GRASS_FRAME = 0
const TREE_FRAME = 28

// เน€เธงเนเธเธญเธฒเธ deploy เธญเธขเธนเนเนเธ•เน subpath (เน€เธเนเธ GitHub Pages /RPG-O-NET-P.6/) เธเธถเธเธ•เนเธญเธเน€เธ•เธดเธก base URL
// เนเธซเน path เธเธญเธเนเธเธฅเน asset เนเธ—เธเธเธฒเธฃเนเธเน path เนเธเธ absolute เธ•เธฃเธเน ('/...') เธเธถเนเธเธเธฐเธเธตเนเนเธเธ—เธตเน root เนเธ”เน€เธกเธเน€เธชเธกเธญ
// เธเนเธฒ base เธกเธฒเธเธฒเธ Nuxt app.baseURL เธ—เธตเนเธชเนเธเธ•เนเธญเธกเธฒเธเธฒเธ GameCanvas.client.vue (useRuntimeConfig)
let assetBase = '/'
export function setAssetBase(base: string) {
  assetBase = base.endsWith('/') ? base : `${base}/`
}
function assetPath(path: string): string {
  return `${assetBase}${path}`.replace(/\/{2,}/g, '/')
}

export function preloadSharedAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('tiny_town')) return
  scene.load.spritesheet('tiny_town', assetPath('tiny-town/tilemap_packed.png'), { frameWidth: SRC, frameHeight: SRC })

  const heroClasses = ['warrior', 'mage', 'archer', 'guardian']
  for (const heroClass of heroClasses) {
    scene.load.spritesheet(`hero_walk_${heroClass}`, assetPath(`player-sprites/overworld/${heroClass}_walk.png`), { frameWidth: 32, frameHeight: 32 })
    scene.load.spritesheet(`hero_idle_${heroClass}`, assetPath(`player-sprites/overworld/${heroClass}_idle.png`), { frameWidth: 32, frameHeight: 32 })
  }

  scene.load.spritesheet('anim_goblin_idle', assetPath('mob-sprites/orc-idle.png'), { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('anim_skeleton_idle', assetPath('mob-sprites/skeleton-idle.png'), { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('anim_slime_idle', assetPath('mob-sprites/slime-idle.png'), { frameWidth: 64, frameHeight: 64 })
  scene.load.image('mob_dragon', assetPath('mob-sprites/dragon.png'))
}

export function preloadTownAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('town_guild_hall')) return
  scene.load.image('town_guild_hall', assetPath('exterior-props/guild_hall_exterior.png'))
  scene.load.image('town_item_shop', assetPath('interior-props/shop_stall.png'))
  scene.load.image('decor_torch', assetPath('quest-icons/torch.png'))
  scene.load.image('decor_gem_cyan', assetPath('quest-icons/gem-cyan.png'))
  scene.load.image('decor_gem_orange', assetPath('quest-icons/gem-orange.png'))
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

function buildHospital(scene: Phaser.Scene) {
  if (scene.textures.exists('town_hospital')) return
  const w = TILE * 3
  const h = TILE * 3
  const g = scene.add.graphics()
  g.fillStyle(0xe8e2d4, 1).fillRect(0, h * 0.35, w, h * 0.65)
  g.fillStyle(0xc0432a, 1).fillTriangle(0, h * 0.35, w / 2, 0, w, h * 0.35)
  // กากบาทสัญลักษณ์โรงพยาบาลทั่วไป (ไม่ใช่เครื่องหมายการค้าใดๆ)
  g.fillStyle(0xd1382a, 1)
  g.fillRect(w / 2 - 5, h * 0.5, 10, 26)
  g.fillRect(w / 2 - 13, h * 0.5 + 8, 26, 10)
  g.fillStyle(0x6a5a3e, 1).fillRect(w / 2 - 9, h - 22, 18, 22)
  g.lineStyle(1, ART.outline, 0.5).strokeRect(0, h * 0.35, w, h * 0.65)
  g.generateTexture('town_hospital', w, h)
  g.destroy()
}

function buildEquipmentShop(scene: Phaser.Scene) {
  if (scene.textures.exists('town_equipment_shop')) return
  const w = TILE * 3
  const h = TILE * 3
  const g = scene.add.graphics()
  g.fillStyle(0x5a6470, 1).fillRect(0, h * 0.35, w, h * 0.65)
  g.fillStyle(0x8a94a0, 1).fillTriangle(0, h * 0.35, w / 2, 0, w, h * 0.35)
  g.fillStyle(0xd9c060, 1)
  g.fillTriangle(w / 2 - 12, h * 0.55, w / 2, h * 0.4, w / 2 + 12, h * 0.55)
  g.fillRect(w / 2 - 2, h * 0.55, 4, 18)
  g.fillStyle(0x3a3226, 1).fillRect(w / 2 - 9, h - 22, 18, 22)
  g.lineStyle(1, ART.outline, 0.5).strokeRect(0, h * 0.35, w, h * 0.65)
  g.generateTexture('town_equipment_shop', w, h)
  g.destroy()
}

function buildDungeonGate(scene: Phaser.Scene) {
  if (scene.textures.exists('dungeon_gate')) return
  const w = TILE * 2
  const h = TILE * 3
  const g = scene.add.graphics()
  g.fillStyle(0x2a2440, 1).fillRoundedRect(0, 0, w, h, 10)
  g.fillStyle(0x120f1e, 1).fillRoundedRect(8, 10, w - 16, h - 14, 8)
  g.fillStyle(0x9b8cff, 0.6).fillEllipse(w / 2, h - 20, w * 0.3, 16)
  g.lineStyle(2, ART.goldLight, 0.7).strokeRoundedRect(0, 0, w, h, 10)
  g.generateTexture('dungeon_gate', w, h)
  g.destroy()
}

function buildBossDoors(scene: Phaser.Scene) {
  if (scene.textures.exists('boss_door_locked')) return
  const w = TILE
  const h = TILE * 1.5
  const gLocked = scene.add.graphics()
  gLocked.fillStyle(0x4a2a22, 1).fillRect(0, 0, w, h)
  gLocked.fillStyle(0x2a1712, 1).fillRect(4, 4, w - 8, h - 8)
  gLocked.fillStyle(ART.goldLight, 1).fillCircle(w / 2, h * 0.55, 5)
  gLocked.lineStyle(1, ART.outline, 0.6).strokeRect(0, 0, w, h)
  gLocked.generateTexture('boss_door_locked', w, h)
  gLocked.destroy()

  const gOpen = scene.add.graphics()
  gOpen.fillStyle(0x6a1e1e, 1).fillRect(0, 0, w, h)
  gOpen.fillStyle(0xd1450f, 0.8).fillRect(4, 4, w - 8, h - 8)
  gOpen.lineStyle(1, ART.goldLight, 0.8).strokeRect(0, 0, w, h)
  gOpen.generateTexture('boss_door_open', w, h)
  gOpen.destroy()
}

function buildHeroAnimations(scene: Phaser.Scene) {
  if (scene.anims.exists('hero_idle_warrior_down')) return
  const dirs = ['down', 'left', 'right', 'up'] as const
  const heroClasses = ['warrior', 'mage', 'archer', 'guardian']
  for (const heroClass of heroClasses) {
    dirs.forEach((dir, row) => {
      scene.anims.create({
        key: `hero_idle_${heroClass}_${dir}`,
        frames: scene.anims.generateFrameNumbers(`hero_idle_${heroClass}`, { start: row * 12, end: row * 12 + 11 }),
        frameRate: 6,
        repeat: -1,
      })
      scene.anims.create({
        key: `hero_walk_${heroClass}_${dir}`,
        frames: scene.anims.generateFrameNumbers(`hero_walk_${heroClass}`, { start: row * 6, end: row * 6 + 5 }),
        frameRate: 10,
        repeat: -1,
      })
    })
  }
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
  buildBossDoors(scene)
  buildHeroAnimations(scene)
  buildMonsterAnimations(scene)
}

export function buildTownTextures(scene: Phaser.Scene) {
  buildHospital(scene)
  buildEquipmentShop(scene)
  buildDungeonGate(scene)
}

export const MONSTER_KINDS = ['goblin', 'skeleton', 'slime'] as const
export type MonsterKind = (typeof MONSTER_KINDS)[number]

export function monsterAnimKey(kind: MonsterKind): string {
  return `${kind}_idle`
}
