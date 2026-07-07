// ================================================================================================
// Item & weapon icons — cropped ONE transparent frame at a time from D:\Asset\Main Character Asset
// \Weapon and Wear\Animated Rpg icons ultimate Kit (+ Weapon Asset Pack). No other asset source.
//
// Each pack file "<name>_128x128.png" is a horizontal animated strip of 128×128 frames (already on a
// transparent background). We extract frame 0 (left 128×128), trim the transparent margin, and pad to a
// centred 128×128 icon → public/item-icons/<itemId>.png. Tiers escalate by picking grander packs.
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const KIT = 'D:/Asset/Main Character Asset/Weapon and Wear/Animated Rpg icons ultimate Kit';
const OUT = path.join(__dirname, '../../public/item-icons');

// itemId -> [category folder, preferred pack subfolder]
const MAP = {
  weapon_t1: ['Swords', 'RPGSwords_Set2'],
  weapon_t2: ['Swords', 'LegendaryMetals_Pack'],
  weapon_t3: ['Swords', 'BeastSlayer_Swords'],
  weapon_t4: ['Swords', 'CelestialArsenal_Pack'],
  weapon_t5: ['Swords', 'ElementalTitans_Pack'],
  armor_t1: ['Armor', 'Armor_Antiquity_Reforged'],
  armor_t2: ['Armor', 'Armor_Exotic_Reforged'],
  armor_t3: ['Armor', 'Armor_Arcane_Reforged'],
  armor_t4: ['Armor', 'Armor_Myths_Reforged'],
  armor_t5: ['Armor', 'Armor_Warlord_Reforged'],
  trinket_t1: ['Accessories', 'Accessories_Classic_Reforged'],
  trinket_t2: ['Accessories', 'Accessories_Amulets_Reforged'],
  trinket_t3: ['Accessories', 'Accessories_Artifacts_Reforged'],
  trinket_t4: ['Accessories', 'Accessories_Myths_Reforged'],
  trinket_t5: ['Accessories', 'Accessories_Relics_Reforged'],
  potion_s: ['Consumables/Potions', null],
  potion_m: ['Consumables/Potions', null],
  focus_tea: ['Consumables/Potions', null],
  guard_sigil: ['Shields', 'ShieldWards_Pack'],
};

function animStrips(dir) {
  if (!fs.existsSync(dir)) return [];
  const all = fs.readdirSync(dir).filter((f) => /128x128\.png$/i.test(f));
  const anim = all.filter((f) => !/static/i.test(f)).sort();
  // บางแพ็ค (เช่น Potions) มีเฉพาะไฟล์ _STATIC (เฟรมเดียว โปร่งใสอยู่แล้ว) → ใช้ได้เลย
  return anim.length ? anim : all.sort();
}
function resolveFolder(cat, pack) {
  const base = path.join(KIT, cat);
  if (pack && fs.existsSync(path.join(base, pack))) return path.join(base, pack);
  // fallback: first subfolder that has animated strips
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base)) {
      const p = path.join(base, d);
      if (fs.statSync(p).isDirectory() && animStrips(p).length) return p;
    }
    if (animStrips(base).length) return base;
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // deterministic per-id frame pick so consumables from the same folder differ
  const usedByFolder = {};
  const manifest = {};
  for (const [id, [cat, pack]] of Object.entries(MAP)) {
    const folder = resolveFolder(cat, pack);
    if (!folder) { console.warn(`skip ${id}: no folder for ${cat}/${pack}`); continue; }
    const strips = animStrips(folder);
    if (!strips.length) { console.warn(`skip ${id}: no strips in ${folder}`); continue; }
    const idx = pack ? 0 : (usedByFolder[folder] = (usedByFolder[folder] ?? -1) + 1);
    const src = path.join(folder, strips[Math.min(idx, strips.length - 1)]);
    const dest = path.join(OUT, `${id}.png`);
    const frame0 = await sharp(src).ensureAlpha().extract({ left: 0, top: 0, width: 128, height: 128 }).toBuffer();
    await sharp(frame0)
      .trim({ threshold: 6 })
      .resize({ width: 108, height: 108, fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(dest);
    manifest[id] = path.relative(path.join(KIT), src).replace(/\\/g, '/');
    console.log(`${id}  <-  ${path.basename(folder)}/${strips[Math.min(idx, strips.length - 1)]} [frame0]`);
  }
  fs.writeFileSync(path.join(OUT, '_source_manifest.json'), JSON.stringify(manifest, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
