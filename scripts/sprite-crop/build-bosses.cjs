// ================================================================================================
// Boss spritesheet builder — stitches craftpix animated monster frames (individual PNGs per frame)
// into horizontal strip spritesheets that Phaser can load with load.spritesheet().
//
// Source: D:\Asset\craftpix-561178-free-rpg-monster-sprites-pixel-art\PNG\<creature>\<State><n>.png
//   Each frame is a fixed-size canvas (dragon 256x256, others 128x128) — we DO NOT trim, so the
//   creature stays registered to the same pivot every frame (no animation jitter).
// Output: public/mob-sprites/boss_<name>_<state>.png  (frameWidth = frame size, N frames wide)
//
// Only real source frames are used; nothing is invented. Frame counts are read from disk.
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_ROOT = 'D:/Asset/craftpix-561178-free-rpg-monster-sprites-pixel-art/PNG';
const OUT_ROOT = path.join(__dirname, '../../public/mob-sprites');

// creature -> { size, states: { animKey: framePrefix } }  (frames auto-discovered as <prefix>1.png..<prefix>N.png)
const BOSSES = {
  dragon:       { size: 256, states: { idle: 'Idle', walk: 'Walk' } },
  small_dragon: { size: 128, states: { idle: 'Idle', walk: 'Walk' } },
  demon:        { size: 0,   states: { idle: 'Idle', walk: 'Walk' } }, // size auto-detected below
  medusa:       { size: 0,   states: { idle: 'Idle', walk: 'Walk' } },
};

async function detectSize(dir) {
  const first = fs.readdirSync(dir).find((f) => /Idle1\.png$/i.test(f));
  if (!first) return null;
  const meta = await sharp(path.join(dir, first)).metadata();
  return meta.width; // craftpix frames are square
}

function framesFor(dir, prefix) {
  const out = [];
  for (let i = 1; i <= 24; i++) {
    const p = path.join(dir, `${prefix}${i}.png`);
    if (fs.existsSync(p)) out.push(p); else break;
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const manifest = {};
  for (const [creature, cfg] of Object.entries(BOSSES)) {
    const dir = path.join(SRC_ROOT, creature);
    if (!fs.existsSync(dir)) { console.warn(`skip ${creature}: no dir`); continue; }
    const size = cfg.size || (await detectSize(dir));
    if (!size) { console.warn(`skip ${creature}: no size`); continue; }
    manifest[creature] = { frameSize: size, states: {} };
    for (const [animKey, prefix] of Object.entries(cfg.states)) {
      const frames = framesFor(dir, prefix);
      if (frames.length === 0) { console.warn(`  ${creature}.${animKey}: no frames`); continue; }
      const composites = [];
      for (let i = 0; i < frames.length; i++) {
        composites.push({ input: await sharp(frames[i]).ensureAlpha().toBuffer(), left: i * size, top: 0 });
      }
      const dest = path.join(OUT_ROOT, `boss_${creature}_${animKey}.png`);
      await sharp({ create: { width: size * frames.length, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(composites).png().toFile(dest);
      manifest[creature].states[animKey] = frames.length;
      console.log(`  ${path.basename(dest)}  ${size}x${size} x${frames.length}`);
    }
  }
  fs.writeFileSync(path.join(OUT_ROOT, '_boss_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('boss manifest:', JSON.stringify(manifest));
}
main().catch((e) => { console.error(e); process.exit(1); });
