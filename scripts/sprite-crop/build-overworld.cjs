// ================================================================================================
// Overworld class sprites — cuts the 8 class×gender characters out of Occupation.png into UNIFORM
// Phaser spritesheets (4 direction rows × 2 columns: [idle, movement]) so the map-walking character
// and the UI character-icon are BOTH derived from the SAME source cells → they look identical.
//
// Source (verified by the Thai-labelled sheet D:\Asset\Main Character Asset\Character Asset\Occupation.png,
//   1402×1122): 16 columns = 8 chars × (Idle, Movement); 4 direction rows (down, left, right, up).
//   Grid boxes reuse the pixel-analysed values from build-all.cjs (already validated on this file).
//
// Output:
//   public/character-sprites/<class>_<gender>.png   uniform sheet, frameW×frameH (in manifest)
//   public/character-icons/<class>_<gender>.png      single down-idle portrait (square, trimmed)
//   public/character-sprites/_sheet_manifest.json    { "<class>_<gender>": { fw, fh } }
// Only real source poses are used (idle + movement). No invented frames.
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { loadRaw, makeIsBg, floodFillCell } = require('./flood-cell.cjs');

const OCC_FILE = 'D:/Asset/Main Character Asset/Character Asset/Occupation.png';
const SHEET_OUT = path.join(__dirname, '../../public/character-sprites');
const ICON_OUT = path.join(__dirname, '../../public/character-icons');
const PAD = 2;
const FOOT = 4;
const DIRS = ['down', 'left', 'right', 'up'];

const OCC_ROW_Y = { down: [140, 318], left: [319, 495], right: [496, 669], up: [670, 861] };
const OCC_ROW_COLS = {
  down: [[19, 85], [98, 164], [193, 249], [271, 333], [369, 433], [449, 512], [541, 598], [622, 685], [720, 782], [800, 864], [895, 951], [972, 1027], [1060, 1136], [1140, 1221], [1233, 1307], [1321, 1390]],
  left: [[23, 80], [103, 161], [194, 249], [273, 335], [372, 429], [452, 511], [543, 599], [623, 687], [713, 781], [793, 863], [883, 952], [962, 1029], [1069, 1129], [1149, 1215], [1244, 1301], [1322, 1385]],
  right: [[23, 79], [103, 160], [193, 249], [272, 333], [372, 428], [452, 511], [541, 597], [623, 682], [712, 780], [792, 863], [883, 951], [962, 1028], [1058, 1128], [1141, 1213], [1232, 1301], [1322, 1385]],
  up: [[17, 85], [97, 166], [190, 252], [270, 332], [367, 435], [448, 513], [537, 599], [618, 683], [718, 783], [798, 865], [889, 953], [968, 1029], [1059, 1136], [1140, 1220], [1232, 1307], [1320, 1390]],
};
const OCC_CHAR_ORDER = ['warrior_male', 'warrior_female', 'archer_male', 'archer_female', 'mage_male', 'mage_female', 'guardian_male', 'guardian_female'];

async function cropCell(file, rawCtx, x0, x1, y0, y1) {
  const { data, w, ch } = rawCtx;
  const isBg = makeIsBg(data, w, ch);
  const cell = floodFillCell(isBg, x0 - 2, y0, x1 + 2, y1);
  if (cell.empty) return null;
  const ex = Math.max(0, cell.minX - PAD);
  const ey = Math.max(0, cell.minY - PAD);
  const ew = Math.min(w, cell.maxX + PAD + 1) - ex;
  const eh = Math.min(rawCtx.h, cell.maxY + PAD + 1) - ey;
  if (ew <= 0 || eh <= 0) return null;
  const buf = await sharp(file).ensureAlpha().extract({ left: ex, top: ey, width: ew, height: eh }).toBuffer();
  return { buf, w: ew, h: eh };
}

async function main() {
  fs.mkdirSync(SHEET_OUT, { recursive: true });
  fs.mkdirSync(ICON_OUT, { recursive: true });
  const raw = await loadRaw(OCC_FILE);
  const rawCtx = { data: raw.data, w: raw.info.width, h: raw.info.height, ch: raw.info.channels };
  const manifest = {};

  for (let i = 0; i < OCC_CHAR_ORDER.length; i++) {
    const name = OCC_CHAR_ORDER[i];
    const idleCol = i * 2, moveCol = i * 2 + 1;
    // grid[row][col] : row = dir index, col 0 = idle, col 1 = move
    const grid = [];
    for (const dir of DIRS) {
      const [y0, y1] = OCC_ROW_Y[dir];
      const idle = await cropCell(OCC_FILE, rawCtx, OCC_ROW_COLS[dir][idleCol][0], OCC_ROW_COLS[dir][idleCol][1], y0, y1);
      const move = await cropCell(OCC_FILE, rawCtx, OCC_ROW_COLS[dir][moveCol][0], OCC_ROW_COLS[dir][moveCol][1], y0, y1);
      grid.push([idle, move || idle]); // ถ้า movement ว่าง ใช้ idle ซ้ำ (ไม่มั่ว)
    }
    // BUGFIX ทิศขวา: แถว "right" ในชีตต้นฉบับหันซ้ายเหมือนแถว left (ตรวจด้วย check-mirror.cjs)
    // จึงสร้างแถวขวาจากการ mirror แถวซ้ายแทน — การันตีหันขวาถูกต้องและ sync เฟรมกับซ้ายเป๊ะ
    const leftRow = grid[DIRS.indexOf('left')];
    const rightFrames = [];
    for (const frame of leftRow) {
      if (!frame) { rightFrames.push(frame); continue; }
      rightFrames.push({ buf: await sharp(frame.buf).flop().toBuffer(), w: frame.w, h: frame.h });
    }
    grid[DIRS.indexOf('right')] = rightFrames;
    const all = grid.flat().filter(Boolean);
    const cellW = Math.max(...all.map((c) => c.w)) + PAD * 2;
    const cellH = Math.max(...all.map((c) => c.h)) + FOOT + PAD;

    const composites = [];
    for (let r = 0; r < DIRS.length; r++) {
      for (let c = 0; c < 2; c++) {
        const frame = grid[r][c];
        if (!frame) continue;
        const left = c * cellW + Math.round((cellW - frame.w) / 2);
        const top = r * cellH + (cellH - FOOT - frame.h);
        composites.push({ input: frame.buf, left, top });
      }
    }
    const sheet = path.join(SHEET_OUT, `${name}.png`);
    await sharp({ create: { width: cellW * 2, height: cellH * 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(composites).png().toFile(sheet);
    manifest[name] = { fw: cellW, fh: cellH };

    // icon = down idle, trimmed to a centred square
    const dIdle = grid[0][0];
    const side = Math.max(dIdle.w, dIdle.h) + 6;
    await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: dIdle.buf, left: Math.round((side - dIdle.w) / 2), top: Math.round((side - dIdle.h) / 2) }])
      .png().toFile(path.join(ICON_OUT, `${name}.png`));

    console.log(`${name}: sheet ${cellW}x${cellH} (x8 frames), icon ${side}x${side}`);
  }
  fs.writeFileSync(path.join(SHEET_OUT, '_sheet_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('manifest:', JSON.stringify(manifest));
}
main().catch((e) => { console.error(e); process.exit(1); });
