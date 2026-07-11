// ================================================================================================
// Town structure pixel-art — วาดอาคาร/พร็อพเมืองทั้งหมดด้วย canvas ให้ใกล้ภาพ mockup ที่สุด
// (ไม่มี asset จริงที่ตรงสไตล์ จึง "อบ" texture ตอนรันไทม์: หลังคาแป้นเกล็ดไล่เฉด, ผนังหินก่อ,
//  หน้าต่างไฟอุ่นพร้อม glow, ธงประดับ, กันสาดลายทาง, ซุ้มประตูหิน + วงวนพอร์ทัล)
// 1 art pixel = 2 canvas px (P) — คมแบบ pixel art แต่มีรายละเอียดพอในสเกล TILE 32px
// ================================================================================================
import Phaser from 'phaser'

const P = 2

interface RoofPal { light: string; base: string; dark: string; seam: string }
interface WallPal { light: string; base: string; dark: string; mortar: string }

const OUTLINE = '#140e08'
const ROOF_RED: RoofPal = { light: '#c9573f', base: '#a23c2c', dark: '#7c2b1f', seam: '#5a1d14' }
const ROOF_PURPLE: RoofPal = { light: '#7e5ba0', base: '#644781', dark: '#4c3564', seam: '#372449' }
const ROOF_SLATE: RoofPal = { light: '#5f5679', base: '#4a4260', dark: '#38314a', seam: '#272138' }
const ROOF_BLUE: RoofPal = { light: '#4c6787', base: '#3a4f6b', dark: '#2c3c53', seam: '#1f2b3d' }
const WALL_STONE: WallPal = { light: '#6f665a', base: '#5e564a', dark: '#4b443a', mortar: '#38322a' }
const WALL_DARKSTONE: WallPal = { light: '#5c5450', base: '#4c4542', dark: '#3c3634', mortar: '#2a2624' }
const WALL_CREAM: WallPal = { light: '#e9dfc8', base: '#d9cdb0', dark: '#bfb193', mortar: '#a89a7e' }
const WOOD_DARK = '#3a2a1b'
const WOOD_MID = '#4c3826'
const WOOD_LIGHT = '#5f4832'

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) >>> 0
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x * P), Math.round(y * P), Math.round(w * P), Math.round(h * P))
}

/** ผนังหินก่อแบบอิฐสลับแถว เฉดสุ่มตายตัว (deterministic) */
function stoneWall(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, pal: WallPal) {
  px(ctx, x0, y0, w, h, pal.mortar)
  const bw = 7
  const bh = 4
  for (let ry = 0; ry * bh < h; ry++) {
    const off = (ry % 2) * Math.floor(bw / 2)
    for (let rx = -1; rx * bw < w + bw; rx++) {
      const bx = x0 + rx * bw + off
      const by = y0 + ry * bh
      const cx0 = Math.max(bx, x0)
      const cx1 = Math.min(bx + bw - 1, x0 + w)
      const cy1 = Math.min(by + bh - 1, y0 + h)
      if (cx1 <= cx0 || cy1 <= by) continue
      const n = hash(rx + x0, ry + y0)
      const c = n % 7 === 0 ? pal.light : n % 5 === 1 ? pal.dark : pal.base
      px(ctx, cx0, by, cx1 - cx0, cy1 - by, c)
      if (n % 3 === 0) px(ctx, cx0, by, cx1 - cx0, 1, pal.light) // ขอบบนรับแสง
    }
  }
}

/** หลังคาจั่วแป้นเกล็ด: สามเหลี่ยมขั้นบันไดจากสันจั่วลงชายคา + แถวรอยต่อทุก 3 แถว */
function gableRoof(ctx: CanvasRenderingContext2D, cx: number, eaveY: number, halfW: number, ridgeH: number, pal: RoofPal) {
  for (let row = 0; row < ridgeH; row++) {
    const t = row / (ridgeH - 1)
    const wHalf = Math.max(1, Math.round((halfW + 2) * t))
    const y = eaveY - ridgeH + row
    for (let gx = cx - wHalf; gx <= cx + wHalf; gx++) {
      const n = hash(gx, y)
      const band = Math.floor(row / 3)
      const col = Math.floor((gx + band * 3) / 5)
      let c = (col + band) % 2 === 0 ? (n % 6 === 0 ? pal.light : pal.base) : (n % 7 === 0 ? pal.base : pal.dark)
      if (row % 3 === 2) c = pal.seam
      if (gx === cx - wHalf || gx === cx + wHalf) c = pal.seam
      px(ctx, gx, y, 1, 1, c)
    }
  }
  // สันจั่ว + เงาชายคา
  px(ctx, cx - 1, eaveY - ridgeH, 3, 1, pal.light)
  px(ctx, cx - halfW - 2, eaveY, halfW * 2 + 5, 1, OUTLINE)
}

/** หน้าต่างไฟอุ่น + กากบาทกรอบ + วงแสงนวลรอบๆ */
function litWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, arched = false) {
  // แสงฟุ้งรอบหน้าต่าง (วาดก่อนตัวหน้าต่างจะได้ไม่ทับ)
  const gcx = (x + w / 2) * P
  const gcy = (y + h / 2) * P
  const grad = ctx.createRadialGradient(gcx, gcy, 1, gcx, gcy, w * P * 2)
  grad.addColorStop(0, 'rgba(255,190,90,0.4)')
  grad.addColorStop(1, 'rgba(255,190,90,0)')
  ctx.fillStyle = grad
  ctx.fillRect(gcx - w * P * 2, gcy - w * P * 2, w * P * 4, w * P * 4)

  px(ctx, x - 1, y - 1, w + 2, h + 2, '#241a10')
  if (arched) {
    px(ctx, x, y - 2, w, 1, '#241a10')
    px(ctx, x + 1, y - 3, w - 2, 1, '#241a10')
    px(ctx, x + 1, y - 2, w - 2, 2, '#f0a848')
  }
  px(ctx, x, y, w, h, '#e8963c')
  px(ctx, x + 1, y + 1, w - 2, h - 2, '#ffca5f')
  if (w > 4 && h > 4) px(ctx, x + 2, y + 2, w - 4, h - 4, '#ffe093')
  px(ctx, x + Math.floor(w / 2), y - (arched ? 2 : 0), 1, h + (arched ? 2 : 0), '#3a2a1c')
  px(ctx, x, y + Math.floor(h / 2), w, 1, '#3a2a1c')
  px(ctx, x - 1, y + h + 1, w + 2, 1, OUTLINE) // ขอบวางหน้าต่าง
}

/** ประตูไม้โค้ง + มือจับทอง */
function archedDoor(ctx: CanvasRenderingContext2D, cx: number, footY: number, w: number, h: number, wide = false) {
  const x = cx - Math.floor(w / 2)
  px(ctx, x - 1, footY - h, w + 2, h, '#241a10')
  px(ctx, x, footY - h - 1, w, 1, '#241a10')
  px(ctx, x + 1, footY - h - 2, w - 2, 1, '#241a10')
  px(ctx, x + 1, footY - h - 1, w - 2, 1, WOOD_MID)
  px(ctx, x, footY - h, w, h, WOOD_MID)
  for (let i = 1; i < w; i += 2) px(ctx, x + i, footY - h, 1, h, WOOD_DARK) // ร่องไม้กระดาน
  px(ctx, x, footY - h + 2, w, 1, WOOD_LIGHT)
  const knobX = wide ? cx + Math.floor(w / 4) : x + w - 2
  px(ctx, knobX, footY - Math.floor(h / 2), 1, 1, '#e9c25f')
  px(ctx, x - 1, footY, w + 2, 1, OUTLINE) // ธรณีประตู
}

function makeCanvas(scene: Phaser.Scene, key: string, wArt: number, hArt: number) {
  const tex = scene.textures.createCanvas(key, wArt * P, hArt * P)!
  return { tex, ctx: tex.getContext() }
}

// ---------------------------------------------------------------- Hospital: ผนังครีม หลังคาแดง กากบาท
function buildHospitalArt(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_hospital')) return
  const W = 58
  const H = 56
  const { tex, ctx } = makeCanvas(scene, 'bld_hospital', W, H)
  const cx = W / 2
  const foot = H - 1
  const wallH = 24
  const wallW = 44
  const wx = cx - wallW / 2

  stoneWall(ctx, wx - 1, foot - 3, wallW + 2, 3, WALL_STONE) // ฐานราก
  px(ctx, wx, foot - wallH, wallW, wallH - 3, WALL_CREAM.base)
  // ปูนปั้นเฉดเงา + คานไม้แนวตั้งสไตล์ทิวดอร์
  for (let i = 0; i < 14; i++) {
    const n = hash(i, 3)
    px(ctx, wx + (n % wallW), foot - wallH + (hash(i, 7) % (wallH - 5)), 2, 1, WALL_CREAM.dark)
  }
  px(ctx, wx, foot - wallH, wallW, 1, WALL_CREAM.light)
  px(ctx, wx, foot - wallH, 1, wallH - 3, WOOD_MID)
  px(ctx, wx + wallW - 1, foot - wallH, 1, wallH - 3, WOOD_MID)

  gableRoof(ctx, cx, foot - wallH, wallW / 2 + 1, 18, ROOF_RED)

  // ป้ายวงกลมกากบาทแดง (สัญลักษณ์สถานพยาบาลทั่วไป)
  px(ctx, cx - 4, foot - wallH - 12, 8, 8, '#efe6d2')
  px(ctx, cx - 3, foot - wallH - 13, 6, 10, '#efe6d2')
  px(ctx, cx - 1, foot - wallH - 11, 2, 6, '#c8362a')
  px(ctx, cx - 3, foot - wallH - 9, 6, 2, '#c8362a')

  litWindow(ctx, wx + 5, foot - wallH + 6, 8, 8)
  litWindow(ctx, wx + wallW - 13, foot - wallH + 6, 8, 8)
  archedDoor(ctx, cx, foot - 3, 8, 12)
  tex.refresh()
}

// ---------------------------------------------------------------- Item Shop: หลังคาม่วง กันสาดลายทาง
function buildItemShopArt(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_item_shop')) return
  const W = 60
  const H = 52
  const { tex, ctx } = makeCanvas(scene, 'bld_item_shop', W, H)
  const cx = W / 2
  const foot = H - 1
  const wallH = 22
  const wallW = 48
  const wx = cx - wallW / 2

  stoneWall(ctx, wx - 1, foot - 3, wallW + 2, 3, WALL_DARKSTONE)
  stoneWall(ctx, wx, foot - wallH, wallW, wallH - 3, WALL_DARKSTONE)
  gableRoof(ctx, cx, foot - wallH, wallW / 2 + 1, 16, ROOF_PURPLE)

  // หน้าต่างร้านบานกว้าง (โชว์สินค้า) + ประตูขวา
  litWindow(ctx, wx + 4, foot - wallH + 6, 16, 9)
  archedDoor(ctx, wx + wallW - 9, foot - 3, 8, 12)

  // กันสาดลายม่วง/ครีมเหนือหน้าต่าง
  const awnY = foot - wallH + 3
  for (let i = 0; i < 22; i++) {
    const c = Math.floor(i / 3) % 2 === 0 ? '#8a63ad' : '#e8ddc8'
    px(ctx, wx + 2 + i, awnY, 1, 2, c)
    px(ctx, wx + 2 + i, awnY + 2, 1, 1, Math.floor(i / 3) % 2 === 0 ? '#644781' : '#c9bda6')
  }
  px(ctx, wx + 2, awnY + 3, 22, 1, OUTLINE)

  // ป้ายแขวนข้างร้าน (ถุงยา/ขวดยา)
  px(ctx, wx - 4, foot - wallH - 2, 1, 8, WOOD_DARK)
  px(ctx, wx - 7, foot - wallH - 2, 4, 1, WOOD_DARK)
  px(ctx, wx - 8, foot - wallH, 6, 7, WOOD_MID)
  px(ctx, wx - 7, foot - wallH + 1, 4, 5, '#2c2118')
  px(ctx, wx - 6, foot - wallH + 2, 2, 3, '#b58a3a')
  tex.refresh()
}

// ---------------------------------------------------------------- Guild Hall: คฤหาสน์หิน ธงน้ำเงิน
function buildGuildHallArt(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_guild_hall')) return
  const W = 66
  const H = 64
  const { tex, ctx } = makeCanvas(scene, 'bld_guild_hall', W, H)
  const cx = W / 2
  const foot = H - 1
  const wallH = 32
  const wallW = 52
  const wx = cx - wallW / 2

  stoneWall(ctx, wx - 1, foot - 3, wallW + 2, 3, WALL_DARKSTONE)
  stoneWall(ctx, wx, foot - wallH, wallW, wallH - 3, WALL_DARKSTONE)
  gableRoof(ctx, cx, foot - wallH, wallW / 2 + 1, 18, ROOF_SLATE)

  // ปล่องไฟ
  px(ctx, cx + 14, foot - wallH - 14, 5, 8, WALL_DARKSTONE.dark)
  px(ctx, cx + 13, foot - wallH - 15, 7, 2, WALL_DARKSTONE.light)

  // หน้าต่างชั้นบนโค้งแบบโกธิก + ชั้นล่าง
  litWindow(ctx, wx + 6, foot - wallH + 5, 6, 8, true)
  litWindow(ctx, wx + wallW - 12, foot - wallH + 5, 6, 8, true)
  litWindow(ctx, wx + 6, foot - 14, 6, 7)
  litWindow(ctx, wx + wallW - 12, foot - 14, 6, 7)

  // ธงน้ำเงินขลิบทอง 2 ผืนขนาบประตู
  for (const bx of [cx - 12, cx + 8]) {
    px(ctx, bx, foot - wallH + 2, 4, 14, '#2c4a8c')
    px(ctx, bx + 1, foot - wallH + 3, 2, 12, '#3a5ea8')
    px(ctx, bx, foot - wallH + 16, 1, 1, '#2c4a8c')
    px(ctx, bx + 3, foot - wallH + 16, 1, 1, '#2c4a8c')
    px(ctx, bx + 1, foot - wallH + 5, 2, 1, '#d9aa4a') // ตราทอง
    px(ctx, bx, foot - wallH + 2, 4, 1, '#d9aa4a')
  }

  archedDoor(ctx, cx, foot - 3, 10, 14, true)
  px(ctx, cx - 6, foot - 17, 12, 1, '#d9aa4a') // ขอบทองเหนือประตู
  tex.refresh()
}

// ---------------------------------------------------------------- Equipment Shop: หลังคาน้ำเงิน ป้ายดาบ
function buildEquipShopArt(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_equipment_shop')) return
  const W = 62
  const H = 54
  const { tex, ctx } = makeCanvas(scene, 'bld_equipment_shop', W, H)
  const cx = W / 2
  const foot = H - 1
  const wallH = 24
  const wallW = 48
  const wx = cx - wallW / 2

  stoneWall(ctx, wx - 1, foot - 3, wallW + 2, 3, WALL_STONE)
  stoneWall(ctx, wx, foot - wallH, wallW, wallH - 3, WALL_STONE)
  gableRoof(ctx, cx, foot - wallH, wallW / 2 + 1, 17, ROOF_BLUE)

  // ป้ายไม้ดาบไขว้บนหน้าจั่ว
  px(ctx, cx - 7, foot - wallH - 13, 14, 10, WOOD_MID)
  px(ctx, cx - 6, foot - wallH - 12, 12, 8, '#2c2420')
  // ดาบไขว้ (เฉียงสองเล่ม + ด้ามทอง)
  for (let i = 0; i < 7; i++) {
    px(ctx, cx - 4 + i, foot - wallH - 11 + i, 1, 1, '#c9d2dc')
    px(ctx, cx + 3 - i, foot - wallH - 11 + i, 1, 1, '#aab6c2')
  }
  px(ctx, cx - 4, foot - wallH - 5, 1, 1, '#d9aa4a')
  px(ctx, cx + 3, foot - wallH - 5, 1, 1, '#d9aa4a')

  litWindow(ctx, wx + 5, foot - wallH + 6, 8, 8)
  litWindow(ctx, wx + wallW - 13, foot - wallH + 6, 8, 8)
  archedDoor(ctx, cx, foot - 3, 9, 13)
  tex.refresh()
}

// ---------------------------------------------------------------- Portal arch: ซุ้มหินโค้ง + วงวนน้ำเงิน
function buildPortalArch(scene: Phaser.Scene) {
  if (!scene.textures.exists('bld_portal_arch')) {
    const W = 56
    const H = 62
    const { tex, ctx } = makeCanvas(scene, 'bld_portal_arch', W, H)
    const cx = W / 2
    const foot = H - 1
    const pillarW = 9
    const innerHalf = 12 // ครึ่งกว้างช่องประตู
    const archTop = 10

    // ความมืดม่วงลึกในช่องซุ้ม (พื้นหลังให้วงวนลอยเด่น แบบภาพ mockup)
    px(ctx, cx - innerHalf, archTop + 6, innerHalf * 2, foot - 4 - (archTop + 6), '#0c081c')
    const voidGlow = ctx.createRadialGradient(cx * P, (archTop + 26) * P, 2, cx * P, (archTop + 26) * P, innerHalf * P * 1.4)
    voidGlow.addColorStop(0, 'rgba(70,90,220,0.5)')
    voidGlow.addColorStop(1, 'rgba(70,90,220,0)')
    ctx.fillStyle = voidGlow
    ctx.fillRect((cx - innerHalf) * P, (archTop + 6) * P, innerHalf * 2 * P, (foot - 10 - archTop) * P)

    // แท่นบันไดหิน 2 ขั้น
    stoneWall(ctx, cx - innerHalf - pillarW - 2, foot - 2, (innerHalf + pillarW + 2) * 2, 2, WALL_DARKSTONE)
    stoneWall(ctx, cx - innerHalf - pillarW, foot - 4, (innerHalf + pillarW) * 2, 2, WALL_STONE)

    // เสาหินซ้าย/ขวา (โทนสว่างพอตัดกับกลางคืน) + แสงฟ้าสะท้อนขอบใน
    for (const side of [-1, 1]) {
      const x0 = side === -1 ? cx - innerHalf - pillarW : cx + innerHalf
      stoneWall(ctx, x0, archTop + 8, pillarW, foot - 4 - (archTop + 8), WALL_STONE)
      px(ctx, x0 - 1, foot - 4, pillarW + 2, 1, OUTLINE)
      const innerX = side === -1 ? x0 + pillarW - 1 : x0
      for (let y = archTop + 9; y < foot - 5; y += 1) {
        if (hash(y, side) % 3 !== 0) px(ctx, innerX, y, 1, 1, '#5a78b8') // ริมแสงพอร์ทัล
      }
      // หัวเสา + ยอดแหลม
      px(ctx, x0 - 1, archTop + 6, pillarW + 2, 3, WALL_STONE.base)
      px(ctx, x0 - 1, archTop + 6, pillarW + 2, 1, WALL_STONE.light)
      px(ctx, x0 + Math.floor(pillarW / 2) - 1, archTop + 3, 3, 3, WALL_STONE.base)
      px(ctx, x0 + Math.floor(pillarW / 2), archTop + 1, 1, 2, WALL_STONE.light)
    }

    // โค้งซุ้มด้านบน (หินเรียงโค้ง)
    for (let gx = -innerHalf - 2; gx <= innerHalf + 2; gx++) {
      const t = Math.abs(gx) / (innerHalf + 2)
      const rise = Math.round(Math.sqrt(1 - t * t) * 7)
      const y = archTop + 8 - rise
      const n = hash(gx, 99)
      px(ctx, cx + gx, y, 1, 4, n % 4 === 0 ? WALL_STONE.light : WALL_STONE.base)
      px(ctx, cx + gx, y, 1, 1, WALL_STONE.light)
      if (Math.abs(gx) % 3 === 0) px(ctx, cx + gx, y + 1, 1, 3, WALL_STONE.mortar)
    }
    // ตะไคร่เกาะหิน
    for (let i = 0; i < 12; i++) {
      const n = hash(i, 55)
      const side = i % 2 === 0 ? -1 : 1
      const x0 = side === -1 ? cx - innerHalf - pillarW : cx + innerHalf
      px(ctx, x0 + (n % pillarW), archTop + 12 + (hash(i, 31) % (foot - archTop - 18)), 1, 1, '#4a6b3a')
    }
    tex.refresh()
  }

  // วงวนพอร์ทัล (spiral 3 แขน) — หมุนด้วย tween ในซีน
  if (!scene.textures.exists('portal_vortex')) {
    const S = 96
    const tex = scene.textures.createCanvas('portal_vortex', S, S)!
    const ctx = tex.getContext()
    const c = S / 2
    for (let arm = 0; arm < 3; arm++) {
      for (let t = 0; t < 240; t++) {
        const tt = t / 240
        const r = 3 + tt * 42
        const a = arm * (Math.PI * 2 / 3) + tt * 5.4
        const x = c + Math.cos(a) * r
        const y = c + Math.sin(a) * r * 0.92
        const alpha = Math.max(0, 0.9 - tt * 0.75)
        const size = 3 - tt * 1.9
        ctx.fillStyle = `rgba(${140 + Math.round(tt * 90)}, ${180 + Math.round(tt * 60)}, 255, ${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const core = ctx.createRadialGradient(c, c, 1, c, c, 16)
    core.addColorStop(0, 'rgba(235,245,255,0.95)')
    core.addColorStop(1, 'rgba(140,180,255,0)')
    ctx.fillStyle = core
    ctx.fillRect(0, 0, S, S)
    tex.refresh()
  }
}

// ---------------------------------------------------------------- Well: บ่อน้ำหิน น้ำเรืองแสงฟ้า
function buildWellArt(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_well')) return
  const W = 34
  const H = 26
  const { tex, ctx } = makeCanvas(scene, 'bld_well', W, H)
  const cx = W / 2
  const cy = H - 9

  // แสงฟ้าฟุ้งจากน้ำ
  const glow = ctx.createRadialGradient(cx * P, cy * P, 2, cx * P, cy * P, 13 * P)
  glow.addColorStop(0, 'rgba(90,160,255,0.5)')
  glow.addColorStop(1, 'rgba(90,160,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W * P, H * P)

  // ขอบบ่อหินวงรี 2 ชั้น
  for (let a = 0; a < 40; a++) {
    const ang = (a / 40) * Math.PI * 2
    const x = cx + Math.cos(ang) * 12
    const y = cy + Math.sin(ang) * 6
    const n = hash(a, 5)
    px(ctx, Math.round(x) - 1, Math.round(y) - 1, 2, 2, n % 4 === 0 ? WALL_STONE.light : WALL_STONE.base)
    px(ctx, Math.round(x) - 1, Math.round(y) + 1, 2, 1, WALL_DARKSTONE.dark)
  }
  // น้ำในบ่อ
  ctx.fillStyle = '#16307a'
  ctx.beginPath()
  ctx.ellipse(cx * P, cy * P, 9.5 * P, 4.5 * P, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2c56c9'
  ctx.beginPath()
  ctx.ellipse(cx * P, cy * P, 7 * P, 3.2 * P, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(150,200,255,0.85)'
  ctx.beginPath()
  ctx.ellipse((cx - 2) * P, (cy - 1) * P, 2.4 * P, 1 * P, 0, 0, Math.PI * 2)
  ctx.fill()
  tex.refresh()
}

// ---------------------------------------------------------------- Notice board: บอร์ดประกาศไม้
function buildNoticeBoard(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_notice_board')) return
  const W = 34
  const H = 30
  const { tex, ctx } = makeCanvas(scene, 'bld_notice_board', W, H)
  const cx = W / 2
  const foot = H - 1

  px(ctx, cx - 12, foot - 8, 2, 8, WOOD_DARK) // ขาซ้าย
  px(ctx, cx + 10, foot - 8, 2, 8, WOOD_DARK) // ขาขวา
  px(ctx, cx - 14, foot - 22, 28, 15, WOOD_MID) // ตัวบอร์ด
  px(ctx, cx - 13, foot - 21, 26, 13, '#33261a')
  // หลังคาเล็กกันฝน
  px(ctx, cx - 16, foot - 24, 32, 2, WOOD_LIGHT)
  px(ctx, cx - 15, foot - 25, 30, 1, WOOD_DARK)
  px(ctx, cx - 16, foot - 22, 32, 1, OUTLINE)
  // กระดาษประกาศ + ตราแดง
  for (const [dx, dy, w, h] of [[-11, -20, 7, 9], [-2, -19, 6, 8], [5, -20, 7, 10]] as const) {
    px(ctx, cx + dx, foot + dy, w, h, '#e6dcc2')
    px(ctx, cx + dx + 1, foot + dy + 2, w - 2, 1, '#8a7c62')
    px(ctx, cx + dx + 1, foot + dy + 4, w - 2, 1, '#8a7c62')
    px(ctx, cx + dx + 1, foot + dy + 6, w - 3, 1, '#8a7c62')
  }
  px(ctx, cx + 9, foot - 13, 2, 2, '#c8362a')
  tex.refresh()
}

// ---------------------------------------------------------------- Signpost: ป้ายบอกทางสองแฉก
function buildSignpost(scene: Phaser.Scene) {
  if (scene.textures.exists('bld_signpost')) return
  const W = 20
  const H = 26
  const { tex, ctx } = makeCanvas(scene, 'bld_signpost', W, H)
  const cx = W / 2
  const foot = H - 1

  px(ctx, cx - 1, foot - 20, 2, 20, WOOD_DARK)
  px(ctx, cx - 1, foot - 20, 1, 20, WOOD_MID)
  // แผ่นป้ายชี้ซ้าย (บน) และขวา (ล่าง)
  px(ctx, cx - 9, foot - 19, 11, 5, WOOD_MID)
  px(ctx, cx - 10, foot - 18, 1, 3, WOOD_MID)
  px(ctx, cx - 8, foot - 17, 8, 1, '#2c2118')
  px(ctx, cx - 2, foot - 12, 11, 5, WOOD_MID)
  px(ctx, cx + 9, foot - 11, 1, 3, WOOD_MID)
  px(ctx, cx, foot - 10, 8, 1, '#2c2118')
  tex.refresh()
}

/** สร้าง texture สิ่งปลูกสร้างเมืองทั้งหมด (เรียกครั้งเดียวใน TownScene.create) */
export function buildTownStructures(scene: Phaser.Scene) {
  buildHospitalArt(scene)
  buildItemShopArt(scene)
  buildGuildHallArt(scene)
  buildEquipShopArt(scene)
  buildPortalArch(scene)
  buildWellArt(scene)
  buildNoticeBoard(scene)
  buildSignpost(scene)
}
