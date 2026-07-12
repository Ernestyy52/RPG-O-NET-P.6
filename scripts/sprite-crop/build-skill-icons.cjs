// สร้างไอคอนสกิล (glyph) เป็น PNG จาก SVG — ออกแบบเองทั้งหมด โทนทองบนวงกลมมืด
// โมดัลจะใส่กรอบสีตามสาย (attack/defense/knowledge) เพิ่มให้แต่ละสกิลเด่นต่างกัน
const sharp = require('sharp')
const path = require('path')
const OUT = path.join(__dirname, '../../public/skill-icons')
const fs = require('fs')
fs.mkdirSync(OUT, { recursive: true })
const S = 48
const G = '#f2c14e', GD = '#b0781f', L = '#ffe9b0', ST = '#3a2a12', W = '#e6eefc', ICE = '#8fd0ff', FIRE = '#ff8a3a', MAG = '#c78bff'

// แต่ละ glyph: เนื้อหา SVG (สี fill/stroke กำหนดเอง)
const GLYPHS = {
  sword: `<path d="M24 4 L28 8 L18 34 L14 34 L14 30 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><rect x="11" y="33" width="10" height="4" rx="1" fill="${G}" stroke="${ST}" stroke-width="1"/><rect x="14.5" y="36" width="3" height="8" rx="1" fill="${GD}"/>`,
  swords: `<path d="M20 6 L23 9 L13 32 L10 29 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><path d="M28 6 L25 9 L35 32 L38 29 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><rect x="8" y="30" width="9" height="3.5" rx="1" fill="${G}"/><rect x="31" y="30" width="9" height="3.5" rx="1" fill="${G}"/>`,
  cleave: `<path d="M10 40 C10 20 22 8 40 8 C30 12 26 20 26 30 L22 40 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><rect x="8" y="38" width="10" height="4" rx="1" fill="${G}"/>`,
  greatsword: `<path d="M24 3 L30 9 L20 38 L14 38 L14 32 Z" fill="${L}" stroke="${ST}" stroke-width="1.5"/><rect x="9" y="37" width="16" height="4" rx="1" fill="${G}" stroke="${ST}"/><rect x="15" y="40" width="4" height="6" fill="${GD}"/>`,
  dagger: `<path d="M24 8 L27 11 L20 30 L17 30 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><rect x="15" y="29" width="8" height="3" rx="1" fill="${G}"/>`,
  arrow: `<path d="M8 40 L38 10" stroke="${G}" stroke-width="3" stroke-linecap="round"/><path d="M38 10 L30 12 L36 18 Z" fill="${W}" stroke="${ST}" stroke-width="1"/><path d="M8 40 L12 36 M8 40 L12 40 L10 36" stroke="${L}" stroke-width="2" fill="none"/>`,
  bow: `<path d="M14 8 C34 16 34 32 14 40" fill="none" stroke="${G}" stroke-width="3"/><line x1="14" y1="8" x2="14" y2="40" stroke="${L}" stroke-width="1.5"/><path d="M14 24 L36 24" stroke="${W}" stroke-width="2"/><path d="M36 24 L30 21 M36 24 L30 27" stroke="${W}" stroke-width="2"/>`,
  wand: `<rect x="21" y="16" width="4" height="26" rx="2" transform="rotate(20 23 29)" fill="${GD}"/><path d="M30 6 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="${MAG}" stroke="${ST}" stroke-width="0.8"/>`,
  staff: `<rect x="22" y="8" width="4" height="34" rx="2" fill="${GD}"/><circle cx="24" cy="10" r="6" fill="${MAG}" stroke="${ST}" stroke-width="1"/><circle cx="22" cy="8" r="2" fill="${L}" opacity="0.8"/>`,
  orb: `<circle cx="24" cy="24" r="13" fill="${MAG}" stroke="${ST}" stroke-width="1.5"/><circle cx="19" cy="19" r="4" fill="${L}" opacity="0.7"/><circle cx="24" cy="24" r="13" fill="none" stroke="${G}" stroke-width="1"/>`,
  fire: `<path d="M24 6 C30 16 34 20 30 30 C34 26 34 22 34 22 C38 30 34 42 24 42 C14 42 12 32 16 24 C17 28 19 28 20 26 C18 20 22 12 24 6 Z" fill="${FIRE}" stroke="${ST}" stroke-width="1"/><path d="M24 22 C26 26 26 30 24 34 C22 30 22 26 24 22 Z" fill="${L}"/>`,
  ice: `<g stroke="${ICE}" stroke-width="2.5" stroke-linecap="round"><line x1="24" y1="6" x2="24" y2="42"/><line x1="8" y1="15" x2="40" y2="33"/><line x1="40" y1="15" x2="8" y2="33"/></g><g stroke="${W}" stroke-width="1.5"><path d="M24 6 l-3 4 M24 6 l3 4 M24 42 l-3 -4 M24 42 l3 -4"/></g>`,
  lightning: `<path d="M26 4 L14 26 L22 26 L18 44 L34 20 L25 20 Z" fill="${G}" stroke="${ST}" stroke-width="1.2"/>`,
  shield: `<path d="M24 5 L38 10 V24 C38 34 31 40 24 43 C17 40 10 34 10 24 V10 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><path d="M24 5 L38 10 V24 C38 34 31 40 24 43 Z" fill="${ICE}" opacity="0.35"/><path d="M24 12 v22 M15 20 h18" stroke="${G}" stroke-width="2"/>`,
  tower_shield: `<path d="M14 5 H34 V30 C34 38 24 44 24 44 C24 44 14 38 14 30 Z" fill="${L}" stroke="${ST}" stroke-width="1.5"/><path d="M24 9 v28 M17 18 h14" stroke="${GD}" stroke-width="2"/>`,
  armor: `<path d="M14 10 L24 6 L34 10 L32 20 C32 32 28 40 24 42 C20 40 16 32 16 20 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><path d="M24 6 v36" stroke="${GD}" stroke-width="1.5"/><path d="M14 10 L24 16 L34 10" fill="none" stroke="${G}" stroke-width="1.5"/>`,
  helm: `<path d="M12 26 C12 12 36 12 36 26 L36 30 L28 30 L28 26 L26 30 L22 30 L20 26 L20 30 L12 30 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><path d="M24 14 v12" stroke="${G}" stroke-width="1.5"/>`,
  ward: `<circle cx="24" cy="24" r="15" fill="none" stroke="${ICE}" stroke-width="2.5"/><circle cx="24" cy="24" r="15" fill="${ICE}" opacity="0.18"/><path d="M24 11 l3 4 -3 3 -3 -3 z" fill="${W}"/><path d="M24 37 l3 -4 -3 -3 -3 3 z" fill="${W}"/>`,
  boots: `<path d="M16 8 L22 8 L23 30 L34 30 C38 30 38 38 34 38 L16 38 Z" fill="${GD}" stroke="${ST}" stroke-width="1.5"/><path d="M16 34 L34 34" stroke="${L}" stroke-width="1.5"/><path d="M18 12 l4 0 M18 18 l4 0" stroke="${G}" stroke-width="1.5"/>`,
  wings: `<path d="M24 12 C14 8 4 12 6 26 C14 20 18 22 24 26 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><path d="M24 12 C34 8 44 12 42 26 C34 20 30 22 24 26 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><line x1="24" y1="12" x2="24" y2="40" stroke="${G}" stroke-width="2.5"/>`,
  book: `<path d="M10 12 C16 9 22 9 24 12 C26 9 32 9 38 12 L38 36 C32 33 26 33 24 36 C22 33 16 33 10 36 Z" fill="${W}" stroke="${ST}" stroke-width="1.5"/><line x1="24" y1="12" x2="24" y2="36" stroke="${GD}" stroke-width="1.5"/><path d="M13 18 h7 M13 23 h7 M28 18 h7 M28 23 h7" stroke="${G}" stroke-width="1"/>`,
  scroll: `<path d="M12 12 C12 8 18 8 18 12 L18 34 C18 40 30 40 30 34 L30 12 C30 8 36 8 36 12 L36 36 C36 40 30 42 24 42 L18 42 C12 42 12 40 12 36 Z" fill="${L}" stroke="${ST}" stroke-width="1.3"/><path d="M20 18 h10 M20 23 h10 M20 28 h7" stroke="${GD}" stroke-width="1.2"/>`,
  quill: `<path d="M38 8 C24 12 16 22 12 38 C22 32 22 30 26 28 C22 30 20 30 18 32 C24 22 30 16 38 8 Z" fill="${W}" stroke="${ST}" stroke-width="1.2"/><line x1="16" y1="34" x2="12" y2="40" stroke="${GD}" stroke-width="2"/>`,
  brain: `<path d="M20 10 C12 10 10 18 14 22 C10 26 14 34 20 32 C22 38 30 38 30 32 C38 34 40 24 34 22 C40 16 32 8 26 12 C24 8 20 8 20 10 Z" fill="${MAG}" stroke="${ST}" stroke-width="1.3"/><path d="M24 12 v22 M18 20 c4 -2 4 4 0 4 M30 18 c-4 0 -3 6 1 5" fill="none" stroke="${L}" stroke-width="1"/>`,
}

async function main() {
  for (const [name, body] of Object.entries(GLYPHS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 48 48"><circle cx="24" cy="24" r="23" fill="#171009" stroke="${GD}" stroke-width="1.5"/>${body}</svg>`
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`))
  }
  console.log('skill icons:', Object.keys(GLYPHS).length)
}
main().catch((e) => { console.error(e); process.exit(1) })
