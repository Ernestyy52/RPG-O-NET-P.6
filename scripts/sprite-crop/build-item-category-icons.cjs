// ไอคอนไอเทมตามหมวด (อาวุธ/เกราะ/เครื่องประดับ) — ออกแบบเอง โทนโลหะ/หนัง วางบนแผ่นมืด
// ทำให้ไอเทม 500+ ชิ้นมีหน้าตาต่างกันตามหมวด แล้วแต้มสีความหายากในฝั่ง UI (ประหยัด memory)
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const OUT = path.join(__dirname, '../../public/item-icons')
fs.mkdirSync(OUT, { recursive: true })
const S = 48
const STEEL = '#d7dce6', STEELD = '#8a94a4', WOOD = '#7a5330', WOODD = '#4a3320', GOLD = '#f2c14e', GOLDD = '#b0781f', ST = '#241a10', LEATH = '#9a6b3a', CLOTH = '#c9a0e0', RED = '#c8463a', BLUE = '#5a9aff', GREEN = '#5fd36a', BONE = '#e8dfc9'

const ICONS = {
  // ---- weapons ----
  wpn_sword: `<path d="M24 5 L28 9 L18 33 L14 33 L14 29 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.3"/><rect x="10" y="32" width="11" height="4" rx="1" fill="${GOLD}" stroke="${ST}"/><rect x="14.5" y="35" width="3" height="8" rx="1" fill="${GOLDD}"/>`,
  wpn_greatsword: `<path d="M24 3 L30 10 L20 36 L14 36 L14 30 Z" fill="${BONE}" stroke="${ST}" stroke-width="1.4"/><rect x="8" y="35" width="17" height="4" rx="1" fill="${GOLD}" stroke="${ST}"/><rect x="15" y="38" width="4" height="7" fill="${GOLDD}"/>`,
  wpn_dagger: `<path d="M24 8 L28 12 L19 30 L16 30 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.2"/><rect x="13" y="29" width="9" height="3" rx="1" fill="${GOLD}"/><rect x="16" y="31" width="3" height="7" fill="${WOODD}"/>`,
  wpn_rapier: `<path d="M24 5 L26 7 L21 34 L19 34 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1"/><circle cx="20" cy="33" r="4" fill="none" stroke="${GOLD}" stroke-width="1.6"/><rect x="18.5" y="36" width="3" height="7" fill="${GOLDD}"/>`,
  wpn_axe: `<path d="M28 8 C40 10 40 26 26 26 C30 20 30 14 26 10 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.3"/><rect x="20" y="8" width="4" height="34" rx="1.5" fill="${WOOD}" stroke="${ST}" stroke-width="0.8"/>`,
  wpn_mace: `<rect x="21" y="20" width="4" height="22" rx="1.5" fill="${WOOD}"/><circle cx="23" cy="14" r="9" fill="${STEELD}" stroke="${ST}" stroke-width="1.3"/><g fill="${STEEL}"><rect x="21" y="3" width="4" height="4"/><rect x="21" y="21" width="4" height="3"/><rect x="12" y="12" width="4" height="4"/><rect x="30" y="12" width="4" height="4"/></g>`,
  wpn_spear: `<path d="M24 3 L28 12 L24 16 L20 12 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.2"/><rect x="22" y="14" width="4" height="30" rx="1.5" fill="${WOOD}"/>`,
  wpn_bow: `<path d="M14 7 C34 15 34 33 14 41" fill="none" stroke="${WOOD}" stroke-width="3.5"/><line x1="14" y1="7" x2="14" y2="41" stroke="${BONE}" stroke-width="1.5"/><path d="M15 24 L36 24 M33 21 L37 24 L33 27" stroke="${STEEL}" stroke-width="2" fill="none"/>`,
  wpn_crossbow: `<rect x="22" y="8" width="4" height="30" rx="1" fill="${WOOD}"/><path d="M8 16 C16 14 32 14 40 16" fill="none" stroke="${STEELD}" stroke-width="3"/><line x1="8" y1="16" x2="40" y2="16" stroke="${BONE}" stroke-width="1"/><path d="M24 10 L20 16 L28 16 Z" fill="${STEEL}"/>`,
  wpn_staff: `<rect x="22" y="10" width="4" height="34" rx="2" fill="${WOODD}"/><circle cx="24" cy="11" r="7" fill="${CLOTH}" stroke="${ST}" stroke-width="1.2"/><circle cx="21" cy="8" r="2.2" fill="#fff" opacity="0.8"/>`,
  wpn_wand: `<rect x="20" y="18" width="4" height="24" rx="2" transform="rotate(18 22 30)" fill="${GOLDD}"/><path d="M30 6 l2.2 5.5 5.5 2.2 -5.5 2.2 -2.2 5.5 -2.2 -5.5 -5.5 -2.2 5.5 -2.2 z" fill="${CLOTH}" stroke="${ST}" stroke-width="0.8"/>`,
  wpn_scythe: `<path d="M12 10 C34 8 40 24 24 30 C30 22 26 16 14 16 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.3"/><rect x="24" y="12" width="4" height="32" rx="1.5" fill="${WOODD}"/>`,
  // ---- armor ----
  arm_robe: `<path d="M16 8 L24 6 L32 8 L34 42 L14 42 Z" fill="${CLOTH}" stroke="${ST}" stroke-width="1.4"/><path d="M24 6 v36" stroke="#a06bd0" stroke-width="1.5"/><path d="M16 8 L24 14 L32 8" fill="none" stroke="${GOLD}" stroke-width="1.5"/>`,
  arm_leather: `<path d="M14 10 L24 6 L34 10 L32 22 C32 34 28 40 24 42 C20 40 16 34 16 22 Z" fill="${LEATH}" stroke="${ST}" stroke-width="1.4"/><path d="M24 6 v36 M18 16 h12" stroke="${WOODD}" stroke-width="1.3"/>`,
  arm_chain: `<path d="M14 10 L24 6 L34 10 L32 22 C32 34 28 40 24 42 C20 40 16 34 16 22 Z" fill="${STEELD}" stroke="${ST}" stroke-width="1.4"/><g fill="${STEEL}" opacity="0.8"><circle cx="20" cy="16" r="1.5"/><circle cx="24" cy="18" r="1.5"/><circle cx="28" cy="16" r="1.5"/><circle cx="22" cy="24" r="1.5"/><circle cx="26" cy="24" r="1.5"/></g>`,
  arm_plate: `<path d="M14 10 L24 6 L34 10 L32 22 C32 34 28 40 24 42 C20 40 16 34 16 22 Z" fill="${STEEL}" stroke="${ST}" stroke-width="1.5"/><path d="M24 6 v36" stroke="${STEELD}" stroke-width="1.5"/><path d="M14 10 L24 16 L34 10" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`,
  arm_dragon: `<path d="M14 10 L24 6 L34 10 L32 22 C32 34 28 40 24 42 C20 40 16 34 16 22 Z" fill="${RED}" stroke="${ST}" stroke-width="1.5"/><path d="M18 14 l4 3 -4 3 M30 14 l-4 3 4 3" stroke="${GOLD}" stroke-width="1.6" fill="none"/><path d="M24 6 v36" stroke="#7a1f16" stroke-width="1.5"/>`,
  arm_cloak: `<path d="M24 6 C16 8 12 20 12 42 L20 42 L22 22 L26 22 L28 42 L36 42 C36 20 32 8 24 6 Z" fill="${GREEN}" stroke="${ST}" stroke-width="1.4"/><circle cx="24" cy="9" r="3" fill="${GOLD}" stroke="${ST}"/>`,
  arm_scale: `<path d="M14 10 L24 6 L34 10 L32 22 C32 34 28 40 24 42 C20 40 16 34 16 22 Z" fill="${STEELD}" stroke="${ST}" stroke-width="1.4"/><g fill="${STEEL}"><path d="M18 14 a3 3 0 0 1 6 0 M24 14 a3 3 0 0 1 6 0 M20 20 a3 3 0 0 1 6 0"/></g>`,
  // ---- trinkets ----
  trk_ring: `<circle cx="24" cy="27" r="11" fill="none" stroke="${GOLD}" stroke-width="4"/><path d="M24 14 l4 5 -4 4 -4 -4 z" fill="${BLUE}" stroke="${ST}" stroke-width="0.8"/>`,
  trk_amulet: `<line x1="14" y1="10" x2="24" y2="26" stroke="${GOLD}" stroke-width="2"/><line x1="34" y1="10" x2="24" y2="26" stroke="${GOLD}" stroke-width="2"/><path d="M24 22 l7 8 -7 8 -7 -8 z" fill="${RED}" stroke="${GOLDD}" stroke-width="1.4"/>`,
  trk_charm: `<path d="M24 40 C10 30 12 14 22 16 C24 17 24 19 24 20 C24 19 24 17 26 16 C36 14 38 30 24 40 Z" fill="${RED}" stroke="${ST}" stroke-width="1.2"/><circle cx="20" cy="22" r="2" fill="#fff" opacity="0.6"/>`,
  trk_tome: `<path d="M10 12 C16 9 22 9 24 12 C26 9 32 9 38 12 L38 36 C32 33 26 33 24 36 C22 33 16 33 10 36 Z" fill="${CLOTH}" stroke="${ST}" stroke-width="1.4"/><line x1="24" y1="12" x2="24" y2="36" stroke="${GOLDD}" stroke-width="1.4"/><path d="M28 18 l3 4 -3 4 -3 -4 z" fill="${GOLD}"/>`,
  trk_orb: `<circle cx="24" cy="24" r="12" fill="${BLUE}" stroke="${ST}" stroke-width="1.4"/><circle cx="20" cy="20" r="3.5" fill="#fff" opacity="0.7"/><circle cx="24" cy="24" r="12" fill="none" stroke="${GOLD}" stroke-width="1"/>`,
  trk_badge: `<circle cx="24" cy="22" r="11" fill="${GOLD}" stroke="${ST}" stroke-width="1.4"/><path d="M24 15 l2 5 5 0 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 0 z" fill="${GOLDD}"/><path d="M20 32 l-2 10 6 -4 6 4 -2 -10" fill="${RED}" stroke="${ST}" stroke-width="0.8"/>`,
}

async function main() {
  for (const [name, body] of Object.entries(ICONS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 48 48">${body}</svg>`
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`))
  }
  console.log('item category icons:', Object.keys(ICONS).length)
}
main().catch((e) => { console.error(e); process.exit(1) })
