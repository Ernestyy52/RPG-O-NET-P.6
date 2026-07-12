// ================================================================================================
// Living-world atmosphere: weather particles + phase tint/vignette + storm lightning + torch glow.
// Purely visual, camera-locked (scrollFactor 0), high depth — never touches collision/hitboxes/timing.
// Driven by the biome (forest/desert/snow/volcano/cave) and world state (phase + weather).
// ================================================================================================
import Phaser from 'phaser'
import type { Biome } from '../../data/biomes'
import type { WorldState } from '../../data/world'

const VW = 640
const VH = 480
const DEPTH_WEATHER = 9000
const DEPTH_VIGNETTE = 8600
const DEPTH_TINT = 8500

export function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('atmo_rain')) {
    // เม็ดฝนแบบ gradient (หัวเข้ม-หางจาง) ให้ดูเป็นสายน้ำจริงแทนแท่งทึบแบน
    const t = scene.textures.createCanvas('atmo_rain', 3, 16)!
    const ctx = t.getContext()
    const grad = ctx.createLinearGradient(0, 0, 0, 16)
    grad.addColorStop(0, 'rgba(200,218,255,0)')
    grad.addColorStop(0.5, 'rgba(200,218,255,0.55)')
    grad.addColorStop(1, 'rgba(225,238,255,0.95)')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 3, 16); t.refresh()
  }
  if (!scene.textures.exists('atmo_dot')) {
    const t = scene.textures.createCanvas('atmo_dot', 8, 8)!
    const ctx = t.getContext()
    const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4)
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 8, 8); t.refresh()
  }
  if (!scene.textures.exists('atmo_leaf')) {
    const g = scene.add.graphics()
    g.fillStyle(0xffffff, 1).fillEllipse(4, 3, 8, 5)
    g.generateTexture('atmo_leaf', 8, 6); g.destroy()
  }
  if (!scene.textures.exists('atmo_ripple')) {
    // วงแหวนกระเพื่อมบางๆ ใช้แทนรอยฝนกระทบพื้น/น้ำ
    const t = scene.textures.createCanvas('atmo_ripple', 16, 16)!
    const ctx = t.getContext()
    ctx.strokeStyle = 'rgba(212,230,255,0.9)'
    ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(8, 8, 6, 0, Math.PI * 2); ctx.stroke()
    t.refresh()
  }
  if (!scene.textures.exists('atmo_vignette')) {
    const t = scene.textures.createCanvas('atmo_vignette', VW, VH)!
    const ctx = t.getContext()
    const grad = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VH * 0.75)
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, VW, VH); t.refresh()
  }
}

const PHASE_TINT: Record<WorldState['phase'], { color: number; alpha: number }> = {
  Night: { color: 0x0a1024, alpha: 0.34 },
  Dusk: { color: 0x3a1e10, alpha: 0.20 },
  Dawn: { color: 0x2a2450, alpha: 0.14 },
  Day: { color: 0x000000, alpha: 0 },
}

/** เธ•เธดเธ”เธเธฃเธฃเธขเธฒเธเธฒเธจ (particle/tint/vignette/lightning) เนเธซเนเธเธฒเธ — เน€เธฃเธตเธขเธเธซเธฅเธฑเธ camera + world setup */
export function applyAtmosphere(scene: Phaser.Scene, biome: Biome, world: WorldState) {
  ensureTextures(scene)

  // ---- phase tint (full-screen, subtle) ----
  const tint = PHASE_TINT[world.phase]
  if (tint.alpha > 0) {
    scene.add.rectangle(VW / 2, VH / 2, VW, VH, tint.color, tint.alpha)
      .setScrollFactor(0).setDepth(DEPTH_TINT)
  }
  // ---- vignette ----
  scene.add.image(VW / 2, VH / 2, 'atmo_vignette').setScrollFactor(0).setDepth(DEPTH_VIGNETTE).setAlpha(0.85)

  const stormy = world.weather === 'storm'
  const rainy = world.weather === 'rain' || stormy
  const windy = world.weather === 'wind'

  // ---- biome ambient ----
  if (biome.id === 'snow') {
    scene.add.particles(0, 0, 'atmo_dot', {
      x: { min: -20, max: VW + 20 }, y: -10, quantity: 1, frequency: 45, lifespan: 5200,
      speedY: { min: 30, max: 70 }, speedX: { min: -25, max: 25 }, accelerationX: { min: -8, max: 8 },
      scale: { min: 0.3, max: 0.9 }, alpha: { start: 0.9, end: 0.5 },
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)
  } else if (biome.id === 'volcano') {
    scene.add.particles(0, 0, 'atmo_dot', {
      x: { min: 0, max: VW }, y: VH + 8, quantity: 1, frequency: 70, lifespan: 2600,
      speedY: { min: -95, max: -45 }, speedX: { min: -18, max: 18 },
      scale: { min: 0.25, max: 0.7 }, alpha: { start: 0.95, end: 0 }, tint: [0xff7a2a, 0xffb347, 0xff4d2a],
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)
  } else if (biome.id === 'cave') {
    scene.add.particles(0, 0, 'atmo_dot', {
      x: { min: 0, max: VW }, y: { min: 0, max: VH }, quantity: 1, frequency: 120, lifespan: 4200,
      speedY: { min: -18, max: -6 }, speedX: { min: -10, max: 10 },
      scale: { min: 0.3, max: 0.8 }, alpha: { start: 0, end: 0 }, tint: [0x9b8cff, 0x6fd0ff, 0xc0a0ff],
      blendMode: 'ADD', emitCallback: undefined,
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)
  } else if (biome.id === 'forest' && (windy || world.weather === 'clear')) {
    scene.add.particles(0, 0, 'atmo_leaf', {
      x: { min: -20, max: VW }, y: { min: -10, max: VH * 0.5 }, quantity: 1, frequency: windy ? 130 : 320,
      lifespan: 6000, speedX: { min: -140, max: -70 }, speedY: { min: 20, max: 55 },
      rotate: { start: 0, end: 360 }, scale: { min: 0.5, max: 1 }, alpha: { start: 0.85, end: 0.4 },
      tint: [0x5cab5a, 0x8ab048, 0x3f8a44],
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)
  } else if (biome.id === 'desert' && windy) {
    scene.add.particles(0, 0, 'atmo_dot', {
      x: { min: VW, max: VW + 20 }, y: { min: 0, max: VH }, quantity: 2, frequency: 60, lifespan: 3200,
      speedX: { min: -320, max: -180 }, speedY: { min: -20, max: 20 },
      scale: { min: 0.4, max: 1.1 }, alpha: { start: 0.5, end: 0 }, tint: [0xe8d59a, 0xd8bd7a],
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)
  }

  // ---- rain overlay: 2 เลเยอร์พารัลแลกซ์ (ไกล/ใกล้) เอียงตามลม + วงกระเพื่อมกระทบพื้น ----
  if (rainy) {
    // เลเยอร์ไกล — เม็ดเล็ก จาง ช้ากว่า
    scene.add.particles(0, 0, 'atmo_rain', {
      x: { min: -40, max: VW + 40 }, y: -14, quantity: stormy ? 2 : 1, frequency: 26, lifespan: 780,
      speedY: { min: 380, max: 480 }, speedX: stormy ? { min: -140, max: -90 } : { min: -50, max: -20 },
      scaleX: { min: 0.5, max: 0.7 }, scaleY: { min: 0.6, max: 1 },
      rotate: stormy ? { min: -16, max: -10 } : { min: -8, max: -4 },
      alpha: { start: 0.22, end: 0.08 },
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER)

    // เลเยอร์ใกล้ — เม็ดใหญ่ ไวกว่า เห็นสายชัดกว่า
    scene.add.particles(0, 0, 'atmo_rain', {
      x: { min: -40, max: VW + 40 }, y: -14, quantity: stormy ? 3 : 2, frequency: 16, lifespan: 640,
      speedY: { min: 560, max: 720 }, speedX: stormy ? { min: -210, max: -130 } : { min: -80, max: -35 },
      scaleX: { min: 0.9, max: 1.3 }, scaleY: { min: 1, max: 1.7 },
      rotate: stormy ? { min: -20, max: -12 } : { min: -9, max: -3 },
      alpha: { start: 0.5, end: 0.15 },
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER + 1)

    // เม็ดฝนกระทบพื้น: วงกระเพื่อมจางๆ ผุดกระจายทั่วจอ
    scene.add.particles(0, 0, 'atmo_ripple', {
      x: { min: 20, max: VW - 20 }, y: { min: VH * 0.35, max: VH - 10 }, quantity: 1,
      frequency: stormy ? 85 : 150, lifespan: 420,
      scale: { start: 0.15, end: 1.1 }, alpha: { start: 0.4, end: 0 },
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER + 2)
  }

  // ---- wet ground: เงาสะท้อนแสงจางๆ วิบวับบนพื้นตอนฝนตก (แนวนอนแบนๆ สีฟ้าหม่น) ----
  if (rainy) {
    scene.add.particles(0, 0, 'atmo_dot', {
      x: { min: 24, max: VW - 24 }, y: { min: VH * 0.3, max: VH - 18 }, quantity: 1,
      frequency: 240, lifespan: 2800,
      scaleX: { min: 2.4, max: 4.4 }, scaleY: { min: 0.3, max: 0.55 },
      alpha: { start: 0.14, end: 0 }, tint: [0x7fa8ff, 0x9dc2ff, 0x6f9dff],
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(DEPTH_TINT - 10)
  }

  // ---- storm lightning (occasional flash + faint thunder shake) ----
  if (stormy) {
    const strike = () => {
      const bright = Phaser.Math.Between(190, 235)
      scene.cameras.main.flash(150, bright, bright + 15, 255, false)
      scene.time.delayedCall(80 + Phaser.Math.Between(0, 40), () =>
        scene.cameras.main.flash(90, bright - 20, bright - 5, 255, false))
      if (Math.random() < 0.5) {
        scene.time.delayedCall(220, () => scene.cameras.main.shake(160, 0.0018))
      }
      scene.time.delayedCall(Phaser.Math.Between(4200, 9000), strike)
    }
    scene.time.delayedCall(Phaser.Math.Between(1500, 4000), strike)
  }
}

/** เนเธเธฅเธงเนเธเธ‡เนเธเธซเธเธฒเธข: เธ•เธดเธ”เธเธฃเธฐเธเธฒเธข glow เนเธเธ additive + flicker alpha/scale เนเธซเนเนเธเธฅเธงเธเธเธฐเธเธฃเธดเธเธ‡เนเธซเธง */
export function addTorchFlicker(
  scene: Phaser.Scene, x: number, y: number, depth: number,
  tint = 0xff9a3c, sparkTint: number[] = [0xffb347, 0xff7a2a],
) {
  ensureTextures(scene)
  const glow = scene.add.image(x, y, 'atmo_dot').setTint(tint).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(3.2).setDepth(depth).setAlpha(0.7)
  scene.tweens.add({ targets: glow, alpha: { from: 0.45, to: 0.85 }, scale: { from: 2.8, to: 3.6 },
    duration: 90, yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(20, 120), ease: 'Sine.easeInOut' })

  // ประกายไฟลอยขึ้นเบาๆ รอบเปลวไฟ (เบามาก ไม่กระทบเฟรมเรต)
  scene.add.particles(0, 0, 'atmo_dot', {
    x: { min: x - 4, max: x + 4 }, y: { min: y - 2, max: y + 2 }, quantity: 1, frequency: 340,
    lifespan: 900, speedY: { min: -30, max: -14 }, speedX: { min: -6, max: 6 },
    scale: { start: 0.35, end: 0 }, alpha: { start: 0.85, end: 0 },
    tint: sparkTint, blendMode: 'ADD',
  }).setDepth(depth + 1)

  return glow
}

/** ป้ายชื่อแบบแผ่นไม้มืดขอบทอง (สไตล์ mockup) ใช้แทน text+backgroundColor เดิมทุกจุด */
export function addPlaque(
  scene: Phaser.Scene, x: number, y: number, text: string,
  opts: { fontSize?: string; color?: string; depth?: number; fixed?: boolean; origin?: [number, number] } = {},
) {
  const label = scene.add.text(x, y, text, {
    fontSize: opts.fontSize ?? '11px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: opts.color ?? '#f0e2bd',
    padding: { x: 9, y: 5 },
  }).setOrigin(...(opts.origin ?? [0.5, 0]))
  const depth = opts.depth ?? 0
  const b = label.getBounds()
  const bg = scene.add.graphics()
  bg.fillStyle(0x0a0805, 0.92).fillRoundedRect(b.x, b.y, b.width, b.height, 5)
  bg.lineStyle(1, 0x000000, 0.95).strokeRoundedRect(b.x - 0.5, b.y - 0.5, b.width + 1, b.height + 1, 5)
  bg.lineStyle(1.4, 0xb98b3e, 0.9).strokeRoundedRect(b.x + 1.5, b.y + 1.5, b.width - 3, b.height - 3, 4)
  bg.setDepth(depth)
  label.setDepth(depth + 0.1)
  if (opts.fixed) { bg.setScrollFactor(0); label.setScrollFactor(0) }
  return { label, bg }
}

/**
 * ออร่ารอบตัวละครตามความหายากของเครื่องแต่งกาย (paper-doll) — แผ่แสงสีที่เท้าตัวละคร
 * คืน image ที่ต้องอัพเดตตำแหน่งตามผู้เล่นใน update() (คืน null ถ้าเป็น common = ไม่มีออร่า)
 */
export function addGearAura(scene: Phaser.Scene, colorHex: string, rarity: string): Phaser.GameObjects.Image | null {
  if (rarity === 'common') return null
  ensureTextures(scene)
  const tint = parseInt(colorHex.replace('#', ''), 16)
  const strong = rarity === 'legendary' || rarity === 'epic'
  const aura = scene.add.image(0, 0, 'atmo_dot').setTint(tint).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(strong ? 2.6 : 2.0).setAlpha(strong ? 0.5 : 0.35)
  scene.tweens.add({
    targets: aura, alpha: { from: aura.alpha * 0.6, to: aura.alpha }, scale: { from: aura.scaleX * 0.85, to: aura.scaleX },
    duration: strong ? 900 : 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  })
  return aura
}

/** เสาไฟถนนสไตล์โคมแก๊ส: เสาเงาดำ + โคมเรืองแสงอุ่น + แอ่งแสงบนพื้น */
export function addStreetLamp(scene: Phaser.Scene, x: number, y: number) {
  ensureTextures(scene)
  if (!scene.textures.exists('atmo_lamp')) {
    const g = scene.add.graphics()
    g.fillStyle(0x14100b, 1).fillRect(5, 12, 3, 28) // เสา
    g.fillStyle(0x241b12, 1).fillRect(5, 12, 1, 28) // ไฮไลต์เสา
    g.fillStyle(0x14100b, 1).fillRect(2, 38, 9, 3) // ฐาน
    g.fillStyle(0x1d1610, 1).fillRoundedRect(2, 2, 9, 11, 2) // กรอบโคม
    g.fillStyle(0xffc964, 1).fillRect(4, 4, 5, 7) // แสงในโคม
    g.fillStyle(0x0d0a07, 1).fillRect(3, 0, 7, 2) // หลังคาโคม
    g.generateTexture('atmo_lamp', 13, 41)
    g.destroy()
  }
  scene.add.image(x, y, 'atmo_lamp').setOrigin(0.5, 1).setDepth(y)
  // แสงโคม (วิบวับช้าๆ) + แอ่งแสงอุ่นตกบนพื้นรอบเสา
  const glow = scene.add.image(x, y - 33, 'atmo_dot').setTint(0xffb54d).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(3.4).setDepth(y + 1).setAlpha(0.7)
  scene.tweens.add({ targets: glow, alpha: { from: 0.55, to: 0.85 }, scale: { from: 3.1, to: 3.7 },
    duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 700) })
  const pool = scene.add.image(x, y + 3, 'atmo_dot').setTint(0xff9d3c).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(4.8, 1.7).setDepth(1).setAlpha(0.2)
  scene.tweens.add({ targets: pool, alpha: { from: 0.14, to: 0.24 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
}

/** แสงไฟอุ่นจากหน้าต่างอาคารยามค่ำ — จุดเรืองแสงเล็กๆ วิบวับเหมือนแสงเทียนข้างใน */
export function addWindowGlow(scene: Phaser.Scene, x: number, y: number, depth: number) {
  ensureTextures(scene)
  const glow = scene.add.image(x, y, 'atmo_dot').setTint(0xffb54d).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(1.5).setDepth(depth).setAlpha(0.5)
  scene.tweens.add({ targets: glow, alpha: { from: 0.35, to: 0.6 }, scale: { from: 1.3, to: 1.7 },
    duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    delay: Phaser.Math.Between(0, 900) })
  return glow
}

/** portal aura: pulsing additive glow + soft drifting sparkles */
export function addPortalGlow(scene: Phaser.Scene, x: number, y: number, depth: number, tint = 0x9ad6ff) {
  ensureTextures(scene)
  const glow = scene.add.image(x, y, 'atmo_dot').setTint(tint).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(5).setDepth(depth).setAlpha(0.5)
  scene.tweens.add({ targets: glow, alpha: { from: 0.32, to: 0.72 }, scale: { from: 4.4, to: 5.6 },
    duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  scene.add.particles(0, 0, 'atmo_dot', {
    x: { min: x - 16, max: x + 16 }, y: { min: y - 4, max: y + 12 }, quantity: 1, frequency: 260,
    lifespan: 1400, speedY: { min: -34, max: -14 }, speedX: { min: -8, max: 8 },
    scale: { start: 0.5, end: 0.05 }, alpha: { start: 0.8, end: 0 },
    tint, blendMode: 'ADD',
  }).setDepth(depth + 1)

  return glow
}

/** subtle idle breathing (scaleY pulse) while standing still; pauses the moment the sprite moves */
export function createIdleBreath(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, baseScaleY: number) {
  let idle = false
  const tween = scene.tweens.add({
    targets: sprite, scaleY: baseScaleY * 1.035, duration: 620, yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut', paused: true,
  })
  return {
    setMoving(moving: boolean) {
      if (moving) {
        if (idle) {
          idle = false
          tween.pause()
          sprite.scaleY = baseScaleY
        }
      } else if (!idle) {
        idle = true
        tween.play()
      }
    },
  }
}
