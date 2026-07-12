// ================================================================================================
// ลบ "กล่องพื้นหลังสีดำ" ที่ติดมากับ character sprite/icon โดยใช้ flood-fill จากขอบภาพเข้าไป
// → ลบเฉพาะดำที่ต่อเนื่องจากขอบ (พื้นหลัง) แต่คงดำที่ถูกล้อมด้วยตัวละคร (ผม/เส้นขอบ) ไว้
// ประมวลผลไฟล์ต้นทางแล้ว re-build atlas ต่อ (เรียก build-hero-atlas.cjs)
// ================================================================================================
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SPRITE_DIR = path.join(__dirname, '../../public/character-sprites')
const ICON_DIR = path.join(__dirname, '../../public/character-icons')
// กล่องพื้นหลังเป็นดำล้วน [0,0,0]; ผมตัวละครเป็นน้ำตาลเข้ม (สว่างกว่า) → ตั้ง threshold ต่ำมากเพื่อไม่กินผม
const DARK = 10

async function dealpha(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isNearBlack = (p) => Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) <= DARK
  const seen = new Uint8Array(w * h)
  const stack = []
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const p = y * w + x
    if (seen[p]) return
    seen[p] = 1
    // ลามเข้าไปในดำที่ยัง "ทึบ" เท่านั้น (กล่องพื้นหลังที่ติดกับช่องโปร่งใส)
    if (data[p * 4 + 3] > 0 && isNearBlack(p)) stack.push(p)
  }
  // seed จากพิกเซลโปร่งใสทั้งหมด (ช่องว่างระหว่างเฟรม/ขอบภาพ) → ลามเข้ากล่องดำที่อยู่ติดกัน
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] < 20) {
      seen[p] = 1
      const x = p % w, y = (p / w) | 0
      pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1)
    }
  }
  let removed = 0
  while (stack.length) {
    const p = stack.pop()
    data[p * 4 + 3] = 0 // ทำโปร่งใส
    removed++
    const x = p % w, y = (p / w) | 0
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1)
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file)
  return removed
}

async function main() {
  const files = [
    ...fs.readdirSync(SPRITE_DIR).filter((f) => f.endsWith('.png') && f !== 'hero-atlas.png').map((f) => path.join(SPRITE_DIR, f)),
    ...fs.readdirSync(ICON_DIR).filter((f) => f.endsWith('.png')).map((f) => path.join(ICON_DIR, f)),
  ]
  for (const f of files) {
    const removed = await dealpha(f)
    console.log(`${path.basename(f)}: removed ${removed} bg px`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
