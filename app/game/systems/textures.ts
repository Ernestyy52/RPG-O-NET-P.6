import Phaser from 'phaser'
import type { Biome } from '../../data/biomes'

const TILE = 32

// พาเลตต์สีกลาง ใช้วาดตัวละคร/มอนสเตอร์แบบพิกเซลอาร์ตด้วยโค้ดล้วน (ไม่มีไฟล์ภาพภายนอก)
const ART = {
  outline: 0x2a1e1c,
  metalLight: 0xf0ead8,
  metalShadow: 0x4a5a6a,
  goldLight: 0xffe08a,
}

function buildGrass(scene: Phaser.Scene, biome: Biome) {
  const g = scene.add.graphics()
  g.fillStyle(biome.grass.base, 1).fillRect(0, 0, TILE, TILE)
  g.fillStyle(biome.grass.dark, 0.5)
  g.fillRect(0, TILE - 4, TILE, 4)
  g.fillRect(TILE - 4, 0, 4, TILE)
  // ใบหญ้าสุ่มจุดเล็กๆ ให้ดูมีพื้นผิว
  g.fillStyle(biome.grass.light, 0.6)
  for (let i = 0; i < 5; i++) {
    const x = 3 + ((i * 7) % (TILE - 6))
    const y = 3 + ((i * 11) % (TILE - 6))
    g.fillRect(x, y, 2, 2)
  }
  g.generateTexture(`${biome.id}_grass`, TILE, TILE)
  g.destroy()
}

function buildTree(scene: Phaser.Scene, biome: Biome) {
  const g = scene.add.graphics()
  const cx = TILE / 2
  // ลำต้น
  g.fillStyle(biome.tree.trunk, 1).fillRect(cx - 3, TILE - 10, 6, 10)
  // พุ่มใบ 3 ชั้น (เข้ม-กลาง-สว่าง) ให้ดูมีมิติ
  g.fillStyle(biome.tree.leafDark, 1).fillCircle(cx, TILE - 16, 13)
  g.fillStyle(biome.tree.leaf, 1).fillCircle(cx - 2, TILE - 19, 11)
  g.fillStyle(biome.tree.leafLight, 1).fillCircle(cx - 4, TILE - 23, 6)
  g.lineStyle(1, ART.outline, 0.4).strokeCircle(cx, TILE - 16, 13)
  g.generateTexture(`${biome.id}_tree`, TILE, TILE)
  g.destroy()
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

function buildHero(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 24
  const h = 26
  // ตัว (เสื้อผ้าสีน้ำเงิน)
  g.fillStyle(0x2f5fb0, 1).fillRoundedRect(4, 10, w - 8, h - 12, 3)
  g.fillStyle(0x4a7fd6, 0.9).fillRect(5, 11, 6, 3)
  // หัว
  g.fillStyle(0xf0c896, 1).fillCircle(w / 2, 8, 7)
  // ผม
  g.fillStyle(0x3a2a1c, 1).fillRect(w / 2 - 7, 1, 14, 6)
  g.lineStyle(1, ART.outline, 0.5).strokeRoundedRect(4, 10, w - 8, h - 12, 3)
  g.generateTexture('player', w, h)
  g.destroy()
}

function buildMonster(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 24
  const h = 22
  g.fillStyle(0x7a2a26, 1).fillCircle(w / 2, h / 2, 10)
  g.fillStyle(0xc0443b, 1).fillCircle(w / 2 - 2, h / 2 - 2, 8)
  g.fillStyle(0xffffff, 1).fillCircle(w / 2 - 4, h / 2 - 3, 2)
  g.fillStyle(0xffffff, 1).fillCircle(w / 2 + 3, h / 2 - 3, 2)
  g.fillStyle(0x1a1210, 1).fillCircle(w / 2 - 4, h / 2 - 3, 1)
  g.fillStyle(0x1a1210, 1).fillCircle(w / 2 + 3, h / 2 - 3, 1)
  g.lineStyle(1, ART.outline, 0.5).strokeCircle(w / 2, h / 2, 10)
  g.generateTexture('monster', w, h)
  g.destroy()
}

function buildBoss(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 30
  const h = 28
  g.fillStyle(0x4a1e5c, 1).fillCircle(w / 2, h / 2, 13)
  g.fillStyle(0x8e55c7, 1).fillCircle(w / 2 - 2, h / 2 - 2, 10)
  g.fillStyle(0x7fd6ff, 1).fillCircle(w / 2 - 5, h / 2 - 4, 3)
  g.fillStyle(0x7fd6ff, 1).fillCircle(w / 2 + 4, h / 2 - 4, 3)
  g.lineStyle(2, ART.goldLight, 0.7).strokeCircle(w / 2, h / 2, 13)
  g.generateTexture('boss', w, h)
  g.destroy()
}

function buildBuilding(scene: Phaser.Scene) {
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

export function buildBiomeTextures(scene: Phaser.Scene, biome: Biome) {
  if (scene.textures.exists(`${biome.id}_grass`)) return
  buildGrass(scene, biome)
  buildTree(scene, biome)
  buildWall(scene, biome)
}

export function buildSharedTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('player')) return
  buildStairs(scene)
  buildShadow(scene)
  buildHero(scene)
  buildMonster(scene)
  buildBoss(scene)
  buildBuilding(scene)
}
