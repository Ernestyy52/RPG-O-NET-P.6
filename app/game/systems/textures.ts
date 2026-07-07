import Phaser from 'phaser'
import type { Biome } from '../../data/biomes'
import { themeForFloor } from '../../data/monsterThemes'

const TILE = 32
const SRC = 16
const KSCALE = TILE / SRC

const ART = {
  outline: 0x2a1e1c,
  goldLight: 0xffe08a,
}

// แผ่น sprite อาชีพ+เพศ ตัดจาก Occupation.png (scripts/sprite-crop/build-overworld.cjs) — frame size ต่อไฟล์
// ต้องตรงกับ public/character-sprites/_sheet_manifest.json
const CLASS_SHEETS: Record<string, { fw: number; fh: number }> = {
  warrior_male: { fw: 78, fh: 162 }, warrior_female: { fw: 71, fh: 160 },
  archer_male: { fw: 77, fh: 161 }, archer_female: { fw: 74, fh: 161 },
  mage_male: { fw: 79, fh: 162 }, mage_female: { fw: 78, fh: 157 },
  guardian_male: { fw: 90, fh: 162 }, guardian_female: { fw: 84, fh: 162 },
}
// เธฅเธณเธ”เธฑเธ frame เนเธ sheet (2 col x 4 row, row-major): down[0,1] left[2,3] right[4,5] up[6,7] — col0=idle, col1=move
const DIR_ROW: Record<'down' | 'left' | 'right' | 'up', number> = { down: 0, left: 1, right: 2, up: 3 }

export function heroKey(classId: string, gender: string): string {
  const key = CLASS_SHEETS[`${classId}_${gender}`] ? `${classId}_${gender}` : 'warrior_male'
  return `char_${key}`
}
export function heroSheetSize(classId: string, gender: string): { fw: number; fh: number } {
  return CLASS_SHEETS[`${classId}_${gender}`] ?? CLASS_SHEETS.warrior_male
}
export function heroAnim(classId: string, gender: string, state: 'idle' | 'walk', dir: 'down' | 'left' | 'right' | 'up'): string {
  const key = CLASS_SHEETS[`${classId}_${gender}`] ? `${classId}_${gender}` : 'warrior_male'
  return `char_${key}_${state}_${dir}`
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
export function assetPath(path: string): string {
  return `${assetBase}${path}`.replace(/\/{2,}/g, '/')
}

// World Boss จาก Main Character Asset\Character Asset\Boss (ชีต 4x4 -> idle strip 4 เฟรม x 160px
// ด้วย scripts/sprite-crop/build-mca-bosses.cjs) — โลกละตัว (world = ceil(floor/10), 10 โลก)
const WORLD_BOSS_FRAME = 160
const WORLD_BOSS_DISPLAY = 200

export function worldIdForFloor(floor: number): string {
  const world = Math.min(10, Math.max(1, Math.ceil(floor / 10)))
  return `world${String(world).padStart(2, '0')}`
}

export interface BossVisual { textureKey: string; animKey: string; scale: number; portrait: string }
export function bossVisualForFloor(floor: number): BossVisual {
  const id = worldIdForFloor(floor)
  return {
    textureKey: `boss_${id}`,
    animKey: `boss_${id}_idle`,
    scale: WORLD_BOSS_DISPLAY / WORLD_BOSS_FRAME,
    portrait: `mob-sprites/world-boss/${id}.png`,
  }
}

/** สร้างอนิเมชัน idle ของ world boss (เรียกใน create หลัง texture โหลดแล้ว) */
export function ensureWorldBossAnim(scene: Phaser.Scene, floor: number): void {
  const { textureKey, animKey } = bossVisualForFloor(floor)
  if (scene.anims.exists(animKey)) return
  scene.anims.create({
    key: animKey,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
    frameRate: 5,
    repeat: -1,
  })
}

export function preloadSharedAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('tiny_town')) return
  scene.load.spritesheet('tiny_town', assetPath('tiny-town/tilemap_packed.png'), { frameWidth: SRC, frameHeight: SRC })

  // Character sprites เธ•เธฑเธ”เธกเธฒเธเธฒเธ Occupation.png (Main Character Asset) — คีย์ตามอาชีพ+เพศ
  // แผ่นละ 4 ทิศ (down/left/right/up) x 2 คอลัมน์ (idle, movement) → เดินในแมพให้ตรงกับ Character Icon
  for (const [key, sheet] of Object.entries(CLASS_SHEETS)) {
    scene.load.spritesheet(`char_${key}`, assetPath(`character-sprites/${key}.png`), { frameWidth: sheet.fw, frameHeight: sheet.fh })
  }
}

export function preloadTownAssets(scene: Phaser.Scene) {
  if (scene.textures.exists('town_guild_hall')) return
  scene.load.image('town_guild_hall', assetPath('exterior-props/guild_hall_exterior.png'))
  scene.load.image('town_item_shop', assetPath('interior-props/shop_stall.png'))
  scene.load.image('decor_torch', assetPath('quest-icons/torch.png'))
  scene.load.image('decor_gem_cyan', assetPath('quest-icons/gem-cyan.png'))
  scene.load.image('decor_gem_orange', assetPath('quest-icons/gem-orange.png'))
  // ประตูดันเจี้ยน = ผู้เฝ้าประตู (Portal.png, Main Character Asset)
  scene.load.image('portal_gate', assetPath('npc/portal_gate.png'))
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
  if (scene.anims.exists('char_warrior_male_idle_down')) return
  const dirs = ['down', 'left', 'right', 'up'] as const
  for (const key of Object.keys(CLASS_SHEETS)) {
    const tex = `char_${key}`
    for (const dir of dirs) {
      const idle = DIR_ROW[dir] * 2 // col0 = idle
      scene.anims.create({
        key: `${tex}_idle_${dir}`,
        frames: [{ key: tex, frame: idle }],
        frameRate: 1,
        repeat: -1,
      })
      scene.anims.create({
        key: `${tex}_walk_${dir}`,
        frames: scene.anims.generateFrameNumbers(tex, { frames: [idle, idle + 1] }), // idle,move → เดิน 2 เฟรม
        frameRate: 6,
        repeat: -1,
      })
    }
  }
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
}

export function buildTownTextures(scene: Phaser.Scene) {
  buildHospital(scene)
  buildEquipmentShop(scene)
}

// ---- Themed dungeon monsters (Main Character Asset, static sprites + idle bob) ----
export function monsterTextureKey(slug: string): string {
  return `mob_mca_${slug}`
}

/** โหลดสไปรต์มอนสเตอร์ + บอสประจำ theme + world boss ของชั้นนั้น (เรียกใน scene.preload) */
export function preloadFloorMonsters(scene: Phaser.Scene, floor: number) {
  const theme = themeForFloor(floor)
  const slugs = new Set<string>([...theme.monsters, theme.boss])
  for (const slug of slugs) {
    const key = monsterTextureKey(slug)
    if (scene.textures.exists(key)) continue
    scene.load.image(key, assetPath(`mob-sprites/mca/${slug}.png`))
  }
  const worldId = worldIdForFloor(floor)
  if (!scene.textures.exists(`boss_${worldId}`)) {
    scene.load.spritesheet(`boss_${worldId}`, assetPath(`mob-sprites/world-boss/${worldId}_idle.png`), { frameWidth: 160, frameHeight: 160 })
  }
}
