// ================================================================================================
// Themed dungeon monsters — copies a curated set from D:\Asset\Main Character Asset\Monster
// (96 transparent 800×800 creature sprites, coherent with the player art) into the game.
// Each is trimmed to content, downscaled (nearest, crisp) and padded to a square 128×128 icon.
// Output: public/mob-sprites/mca/<slug>.png   (slug = filename, spaces → _)
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'D:/Asset/Main Character Asset/Monster';
const OUT = path.join(__dirname, '../../public/mob-sprites/mca');

// curated union of all theme rosters + world bosses
const NAMES = [
  // forest / woodland
  'slime', 'big slime', 'nature slime', 'mushroom monster', 'frog monster', 'dryad', 'treant', 'plant behemoth', 'plant sprite',
  // desert
  'scorpion', 'sand worm', 'cactus monster', 'snake', 'basilisk', 'cockatrice', 'viper', 'mummy', 'gorgon', 'minotaur', 'minos',
  // snow
  'frost sprite', 'snow worm', 'fluffy bear', 'ice robot', 'cumulus', 'tengu', 'harpy',
  // volcano
  'fire slime', 'fire wisp', 'salamander', 'fire robot', 'red imp', 'thunder slime', 'gargoyle',
  // cave / undead
  'bat', 'black imp', 'clay golem', 'shadow', 'wraith', 'spider', 'banshee', 'cyclops', 'golem', 'living boulder', 'troll',
  // bosses / big
  'dragon', 'kraken', 'griffin', 'reaper', 'abyssal beast',
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  for (const name of NAMES) {
    const src = path.join(SRC, `${name}.png`);
    if (!fs.existsSync(src)) { console.warn(`missing: ${name}`); continue; }
    const slug = name.replace(/\s+/g, '_');
    const dest = path.join(OUT, `${slug}.png`);
    await sharp(src)
      .ensureAlpha()
      .trim({ threshold: 8 })
      .resize({ width: 120, height: 120, fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(dest);
    ok++;
  }
  console.log(`copied ${ok}/${NAMES.length} monsters -> ${path.relative(path.join(__dirname, '../..'), OUT)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
