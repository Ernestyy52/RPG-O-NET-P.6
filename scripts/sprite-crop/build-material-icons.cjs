// สร้างไอคอนวัสดุคราฟ (mat_gel/scale/bone/crystal/core) เป็น PNG เล็กๆ จาก SVG — ประหยัดพื้นที่
// ใช้ไอคอนร่วมกันหลายวัสดุ (แต้มสีความหายากในฝั่ง UI) จึงมีแค่ 5 รูปพอ
const sharp = require('sharp')
const path = require('path')
const OUT = path.join(__dirname, '../../public/item-icons')
const S = 48

const ICONS = {
  mat_gel: `<circle cx="24" cy="27" r="14" fill="#5fd36a" stroke="#2b6b32" stroke-width="2"/><ellipse cx="19" cy="22" rx="4" ry="3" fill="#c8f5cd" opacity="0.8"/>`,
  mat_scale: `<path d="M24 8 L40 20 L34 40 L14 40 L8 20 Z" fill="#7fa8c9" stroke="#2c4a63" stroke-width="2"/><path d="M24 14 L32 22 L28 34 L20 34 L16 22 Z" fill="#a9c9e0" opacity="0.7"/>`,
  mat_bone: `<rect x="20" y="12" width="8" height="24" rx="4" fill="#e8e0cf" stroke="#8a7c62" stroke-width="2"/><circle cx="18" cy="12" r="6" fill="#e8e0cf" stroke="#8a7c62" stroke-width="2"/><circle cx="30" cy="12" r="6" fill="#e8e0cf" stroke="#8a7c62" stroke-width="2"/><circle cx="18" cy="36" r="6" fill="#e8e0cf" stroke="#8a7c62" stroke-width="2"/><circle cx="30" cy="36" r="6" fill="#e8e0cf" stroke="#8a7c62" stroke-width="2"/>`,
  mat_crystal: `<path d="M24 6 L34 20 L24 42 L14 20 Z" fill="#7db8ff" stroke="#2c4a8c" stroke-width="2"/><path d="M24 6 L24 42 M14 20 L34 20" stroke="#c8e0ff" stroke-width="1.5" opacity="0.8"/>`,
  mat_core: `<circle cx="24" cy="24" r="15" fill="#3a1c14" stroke="#1a0d08" stroke-width="2"/><circle cx="24" cy="24" r="8" fill="#ff7a2a"/><circle cx="24" cy="24" r="4" fill="#ffd977"/>`,
}

async function main() {
  for (const [name, body] of Object.entries(ICONS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 48 48">${body}</svg>`
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`))
    console.log('wrote', name)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
