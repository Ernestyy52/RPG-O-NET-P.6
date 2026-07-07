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

function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('atmo_rain')) {
    const g = scene.add.graphics()
    g.fillStyle(0xbcd2ff, 1).fillRect(0, 0, 2, 12)
    g.generateTexture('atmo_rain', 2, 12); g.destroy()
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

  // ---- rain overlay ----
  if (rainy) {
    scene.add.particles(0, 0, 'atmo_rain', {
      x: { min: -40, max: VW + 40 }, y: -14, quantity: stormy ? 4 : 2, frequency: 18, lifespan: 720,
      speedY: { min: 520, max: 680 }, speedX: stormy ? { min: -180, max: -110 } : { min: -70, max: -30 },
      scaleY: { min: 0.8, max: 1.5 }, alpha: { start: 0.45, end: 0.15 },
    }).setScrollFactor(0).setDepth(DEPTH_WEATHER + 1)
  }

  // ---- storm lightning (occasional flash) ----
  if (stormy) {
    const strike = () => {
      scene.cameras.main.flash(160, 200, 220, 255, false)
      scene.time.delayedCall(90, () => scene.cameras.main.flash(110, 180, 200, 255, false))
      scene.time.delayedCall(Phaser.Math.Between(4200, 9000), strike)
    }
    scene.time.delayedCall(Phaser.Math.Between(1500, 4000), strike)
  }
}

/** เนเธเธฅเธงเนเธเธ‡เนเธเธซเธเธฒเธข: เธ•เธดเธ”เธเธฃเธฐเธเธฒเธข glow เนเธเธ additive + flicker alpha/scale เนเธซเนเนเธเธฅเธงเธเธเธฐเธเธฃเธดเธเธ‡เนเธซเธง */
export function addTorchFlicker(scene: Phaser.Scene, x: number, y: number, depth: number) {
  ensureTextures(scene)
  const glow = scene.add.image(x, y, 'atmo_dot').setTint(0xff9a3c).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(3.2).setDepth(depth).setAlpha(0.7)
  scene.tweens.add({ targets: glow, alpha: { from: 0.45, to: 0.85 }, scale: { from: 2.8, to: 3.6 },
    duration: 90, yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(20, 120), ease: 'Sine.easeInOut' })
  return glow
}
