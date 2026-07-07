// ================================================================================================
// World Bosses จาก D:\Asset\Main Character Asset\Character Asset\Boss (ชีต 4x4: idle/attack/hurt/death)
// - ลบพื้นหลังขาวด้วย flood-fill จากขอบภาพ (ลบเฉพาะขาวที่ต่อเนื่องกับขอบ ไม่กินไฮไลต์ขาวในตัวสไปรต์)
// - ตัดแถวบน (idle 4 เฟรม) -> strip public/mob-sprites/world-boss/world<NN>_idle.png (เฟรม 160px)
// - เฟรมแรก -> portrait public/mob-sprites/world-boss/world<NN>.png (128px, trim)
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'D:/Asset/Main Character Asset/Character Asset/Boss';
const OUT = path.join(__dirname, '../../public/mob-sprites/world-boss');
const GRID = 4;
const FRAME_OUT = 160;
const WHITE = 235; // ค่าต่ำสุดที่ถือว่า "ขาว" (พื้นหลัง)

// world index (1-10) -> ชื่อไฟล์ต้นทาง (เลือกจาก boss-contact-sheet ให้แมตช์ธีมโลก)
const PICKS = {
  1: 'ChatGPT Image 5 ก.ค. 2569 11_09_24 (5).png',  // fungal treant -> Verdant Slimes
  2: 'ChatGPT Image 5 ก.ค. 2569 11_09_24 (6).png',  // golden sand serpent -> Scorching Dunes
  3: 'ChatGPT Image 5 ก.ค. 2569 11_15_55 (3).png',  // frost giant -> Frozen Wastes
  4: 'ChatGPT Image 5 ก.ค. 2569 11_09_08 (3).png',  // magma golem -> Molten Fiends
  5: 'ChatGPT Image 5 ก.ค. 2569 11_09_17 (3).png',  // amethyst crystal golem -> Crystal Depths
  6: 'ChatGPT Image 5 ก.ค. 2569 11_19_29 (2).png',  // moss forest golem -> Ancient Grove
  7: 'ChatGPT Image 5 ก.ค. 2569 11_09_12 (9).png',  // golden pharaoh -> Cursed Sands
  8: 'ChatGPT Image 5 ก.ค. 2569 11_15_55 (2).png',  // ice lich king -> Frostpeak Fortress
  9: 'ChatGPT Image 5 ก.ค. 2569 11_09_18 (5).png',  // black winged demon -> Infernal Depths
  10: 'ChatGPT Image 5 ก.ค. 2569 11_09_17 (2).png', // kraken/cthulhu -> Sunken Abyss
};

/** ลบพื้นขาวเฉพาะส่วนที่ต่อเนื่องกับขอบภาพ (BFS) — คืน buffer RGBA */
function removeEdgeWhite(data, w, h) {
  const isWhite = (i) => data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE;
  const visited = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, 0, x, h - 1); }
  for (let y = 0; y < h; y++) { stack.push(0, y, w - 1, y); }
  const seeds = [];
  for (let i = 0; i < stack.length; i += 2) seeds.push([stack[i], stack[i + 1]]);
  const queue = [];
  for (const [x, y] of seeds) {
    const k = y * w + x;
    if (!visited[k] && isWhite(k * 4)) { visited[k] = 1; queue.push(k); }
  }
  while (queue.length) {
    const k = queue.pop();
    const x = k % w, y = (k / w) | 0;
    data[k * 4 + 3] = 0; // โปร่งใส
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nk = ny * w + nx;
      if (visited[nk]) continue;
      if (isWhite(nk * 4)) { visited[nk] = 1; queue.push(nk); }
    }
  }
  return data;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [world, file] of Object.entries(PICKS)) {
    const src = path.join(SRC, file);
    if (!fs.existsSync(src)) { console.warn(`world ${world}: missing ${file}`); continue; }
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    removeEdgeWhite(data, info.width, info.height);
    const clean = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
    const cw = Math.floor(info.width / GRID), ch = Math.floor(info.height / GRID);

    // idle = แถวบนสุด 4 เฟรม
    const frames = [];
    for (let c = 0; c < GRID; c++) {
      const buf = await clean.clone()
        .extract({ left: c * cw, top: 0, width: cw, height: ch })
        .resize(FRAME_OUT, FRAME_OUT, { kernel: 'nearest' })
        .png().toBuffer();
      frames.push({ input: buf, left: c * FRAME_OUT, top: 0 });
    }
    const id = `world${String(world).padStart(2, '0')}`;
    await sharp({ create: { width: FRAME_OUT * GRID, height: FRAME_OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(frames).png().toFile(path.join(OUT, `${id}_idle.png`));

    // portrait = เฟรมแรก trim + 128px
    const f0 = await clean.clone().extract({ left: 0, top: 0, width: cw, height: ch }).png().toBuffer();
    await sharp(f0).trim({ threshold: 10 })
      .resize({ width: 120, height: 120, fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(path.join(OUT, `${id}.png`));
    console.log(`${id}  <-  ${file}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
