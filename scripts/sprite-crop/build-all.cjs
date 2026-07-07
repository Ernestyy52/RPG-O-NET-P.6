// ================================================================================================
// Master sprite-crop pipeline: base_male/base_female (Base male.png / Base Female.png)
// + 8 occupation classes (Occupation.png) -> assets/characters/<char>/<state>/<dir>/*.png
// + character_animations.json manifest
//
// เธเธเธชเธณเธเธฑเธ: source เธ—เธฑเนเธ 2 เนเธเธฅเนเธกเธตเน€เธเธเธเธฒเธ "idle" (เธ—เนเธฒเธขเธทเธ) เนเธฅเธฐ "movement/walk" เนเธ—เนเธเธฃเธดเธ
// เนเธกเนเธกเธต attack / hurt / death เธเธฒเธเนเธ• เธ—เธฑเนเธเนเธฅเธก — เธ•เธฒเธก rule 8/9 เธ‚เธญเธ‡เธเธนเนเนเธเน (เธซเนเธฒเธกเน€เธ”เธฒ) เธเธถเธ‡เธ•เนเธญเธ‡เธชเธฃเนเธฒเธ placeholder
// เธ—เธตเนเนเธกเนเนเธเนเธ•เธฑเธงเธซเธเธฑเธเธชเธทเธญเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธชเธณเธซเธฃเธฑเธเธชเธ–เธฒเธเธฐเน€เธซเธฅเนเธฒเธเธตเน เนเธฅเธฐเธ•เนเธญเธ‡เธฃเธฒเธขเธ‡เธฒเธเธ•เธฃเธ‡เนเธ›เธ•เธฒเธกเธเธงเธฒเธกเน€เธ›เนเธ™เธˆเธฃเธดเธ‡
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { loadRaw, makeIsBg, floodFillCell } = require('./flood-cell.cjs');

const OUT_ROOT = path.join(__dirname, '../../assets/characters');
const PAD = 3;
const FOOT_MARGIN = 6;
const STATES = ['idle', 'attack', 'hurt', 'death'];
const DIRS = ['down', 'left', 'right', 'up'];

const BASE_MALE_FILE = 'D:/Asset/Main Character Asset/Character Asset/Base male.png';
const BASE_FEMALE_FILE = 'D:/Asset/Main Character Asset/Character Asset/Base Female.png';
const OCC_FILE = 'D:/Asset/Main Character Asset/Character Asset/Occupation.png';

// Base male/female sheet: 5 cols (walk-cycle frames) x 4 rows (down,left,right,up), no separate idle art —
// column 0 (standing/neutral pose, verified by visual inspection) is used as the "idle" frame.
const BASE_ROWS = ['down', 'left', 'right', 'up'];

// Occupation.png grid, verified by pixel-gap analysis (analyze-row.cjs):
//  - 5 sprite-row bands exist; rows 0-3 = down/left/right/up (verified visually: row0 front, row1 faces
//    left, row2 faces right, row3 back). Row 4 (y 884-1029) has an ambiguous alternate back-view pose
//    (windswept hair / raised weapon) that does not clearly correspond to any of idle/attack/hurt/death —
//    per rule 8 it is NOT used/guessed, and is reported as skipped.
//  - 16 columns = 8 character types x (Idle, Movement); only the Idle column of each pair is used since
//    the requested folder structure has no "walk" state. Movement column is skipped (documented below).
const OCC_ROW_Y = {
  down: [140, 318],
  left: [319, 495],
  right: [496, 669],
  up: [670, 861],
};
const OCC_ROW_COLS = {
  down: [[19, 85], [98, 164], [193, 249], [271, 333], [369, 433], [449, 512], [541, 598], [622, 685], [720, 782], [800, 864], [895, 951], [972, 1027], [1060, 1136], [1140, 1221], [1233, 1307], [1321, 1390]],
  left: [[23, 80], [103, 161], [194, 249], [273, 335], [372, 429], [452, 511], [543, 599], [623, 687], [713, 781], [793, 863], [883, 952], [962, 1029], [1069, 1129], [1149, 1215], [1244, 1301], [1322, 1385]],
  right: [[23, 79], [103, 160], [193, 249], [272, 333], [372, 428], [452, 511], [541, 597], [623, 682], [712, 780], [792, 863], [883, 951], [962, 1028], [1058, 1128], [1141, 1213], [1232, 1301], [1322, 1385]],
  up: [[17, 85], [97, 166], [190, 252], [270, 332], [367, 435], [448, 513], [537, 599], [618, 683], [718, 783], [798, 865], [889, 953], [968, 1029], [1059, 1136], [1140, 1220], [1232, 1307], [1320, 1390]],
};
const OCC_CHAR_ORDER = ['warrior_male', 'warrior_female', 'archer_male', 'archer_female', 'mage_male', 'mage_female', 'guardian_male', 'guardian_female'];

const report = { croppedReal: [], placeholders: [], skipped: [], warnings: [] };

function outPath(character, state, dir, frameIndex) {
  const fname = `${character}_${state}_${dir}_${String(frameIndex).padStart(2, '0')}.png`;
  return path.join(OUT_ROOT, character, state, dir, fname);
}

async function exportCell(file, rawCtx, cellBox, dest, label) {
  const { data, w, h, ch } = rawCtx;
  const isBg = makeIsBg(data, w, ch);
  const cell = floodFillCell(isBg, cellBox.x0, cellBox.y0, cellBox.x1, cellBox.y1);
  if (cell.empty) {
    report.skipped.push({ path: dest, reason: `empty cell for ${label}` });
    return null;
  }
  const bboxW = cell.maxX - cell.minX + 1;
  const bboxH = cell.maxY - cell.minY + 1;
  const extractX = Math.max(cellBox.x0, cell.minX - PAD);
  const extractY = Math.max(cellBox.y0, cell.minY - PAD);
  const extractX1 = Math.min(cellBox.x1, cell.maxX + PAD + 1);
  const extractY1 = Math.min(cellBox.y1, cell.maxY + PAD + 1);
  const extractW = extractX1 - extractX;
  const extractH = extractY1 - extractY;
  if (extractW <= 0 || extractH <= 0) {
    report.skipped.push({ path: dest, reason: `degenerate bbox for ${label}` });
    return null;
  }
  const cropped = await sharp(file).ensureAlpha().extract({ left: extractX, top: extractY, width: extractW, height: extractH }).toBuffer();
  return { cropped, extractW, extractH, label, dest };
}

async function processCharacter(character, file, cellsByDir, canvasPad = { w: 0, h: 0 }) {
  const raw = await loadRaw(file);
  const rawCtx = { data: raw.data, w: raw.info.width, h: raw.info.height, ch: raw.info.channels };

  // pass 1: crop all idle frames for this character to find the max bbox -> uniform canvas size
  const crops = [];
  for (const dir of DIRS) {
    const cellBox = cellsByDir[dir];
    if (!cellBox) continue;
    const dest = outPath(character, 'idle', dir, 0);
    const result = await exportCell(file, rawCtx, cellBox, dest, `${character} idle ${dir}`);
    if (result) crops.push({ dir, ...result });
  }
  if (crops.length === 0) {
    report.warnings.push(`${character}: no idle frames could be cropped at all — skipping entirely`);
    return;
  }
  const canvasW = Math.max(...crops.map((c) => c.extractW)) + canvasPad.w;
  const canvasH = Math.max(...crops.map((c) => c.extractH)) + canvasPad.h;

  for (const c of crops) {
    const left = Math.round((canvasW - c.extractW) / 2);
    const top = canvasH - FOOT_MARGIN - c.extractH;
    fs.mkdirSync(path.dirname(c.dest), { recursive: true });
    await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: c.cropped, left, top: Math.max(0, top) }])
      .png()
      .toFile(c.dest);
    report.croppedReal.push({ path: relOut(c.dest), character, state: 'idle', direction: c.dir, size: `${canvasW}x${canvasH}` });
  }

  // pass 2: placeholders for attack/hurt/death x4 directions, matched to this character's own canvas size
  const PLACEHOLDER_COLOR = { attack: { r: 214, g: 96, b: 42 }, hurt: { r: 176, g: 40, b: 40 }, death: { r: 90, g: 90, b: 96 } };
  for (const state of ['attack', 'hurt', 'death']) {
    for (const dir of DIRS) {
      const dest = outPath(character, state, dir, 0);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await makePlaceholder(dest, canvasW, canvasH, PLACEHOLDER_COLOR[state]);
      report.placeholders.push({ path: relOut(dest), character, state, direction: dir, size: `${canvasW}x${canvasH}`, reason: 'no source art exists for this animation state in the provided asset pack (rule 8: no guessing)' });
    }
  }
}

async function makePlaceholder(dest, w, h, color) {
  // เธชเธตเนเธฅเธซเธฅเธฑเธเนเธเน€เธ‰เธเธฒเธฐ (เธ”เน€เธฃเธเธเธเธเธฅเธก) เนเธกเนเธกเธตเธ•เธฑเธงเธซเธเธฑเธเธชเธทเธญเนเธ”เนๆ (rule 3) เน€เธเธทเนเธญเนเธซเนเธฃเธนเนเธชเธถเธเนเธ”เนเธเธฑเธ—เธตเธงเนเธฒเน€เธ›เนเธ™ placeholder เธ—เธฑเธเธ—เธต
  const cx = w / 2, cy = h - FOOT_MARGIN - Math.min(h, w) * 0.35;
  const r = Math.min(w, h) * 0.28;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.25}" fill="rgb(${color.r},${color.g},${color.b})" fill-opacity="0.55" stroke="rgb(${color.r},${color.g},${color.b})" stroke-width="2" stroke-opacity="0.85"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(dest);
}

function relOut(p) {
  return path.relative(path.join(__dirname, '../..'), p).split(path.sep).join('/');
}

async function main() {
  // --- base_male / base_female (idle only, real crop from column 0 of each direction row) ---
  for (const [character, file] of [['base_male', BASE_MALE_FILE], ['base_female', BASE_FEMALE_FILE]]) {
    const raw = await loadRaw(file);
    const w = raw.info.width, h = raw.info.height;
    const pitchW = w / 5, pitchH = h / 4;
    const cellsByDir = {};
    BASE_ROWS.forEach((dir, r) => {
      cellsByDir[dir] = { x0: 0, y0: Math.round(r * pitchH), x1: Math.round(pitchW), y1: Math.round((r + 1) * pitchH) };
    });
    await processCharacter(character, file, cellsByDir);
  }

  // --- occupation classes (idle only, real crop from the "Idle" sub-column) ---
  for (let i = 0; i < OCC_CHAR_ORDER.length; i++) {
    const character = OCC_CHAR_ORDER[i];
    const idleColIndex = i * 2;
    const cellsByDir = {};
    for (const dir of DIRS) {
      const [x0, x1] = OCC_ROW_COLS[dir][idleColIndex];
      const [y0, y1] = OCC_ROW_Y[dir];
      cellsByDir[dir] = { x0: x0 - 2, y0, x1: x1 + 2, y1 };
    }
    await processCharacter(character, OCC_FILE, cellsByDir);
  }

  report.skipped.push({ path: 'Occupation.png row 4 (y 884-1029)', reason: 'ambiguous 5th sprite row (alternate back-view pose with windswept hair / raised weapon) — does not clearly map to idle/attack/hurt/death, excluded rather than guessed' });
  report.skipped.push({ path: 'Occupation.png "Movement" columns (odd column indices)', reason: 'walk-cycle art exists but is not part of the requested idle/attack/hurt/death structure — left uncropped, available for a future "walk" state' });

  fs.mkdirSync(OUT_ROOT, { recursive: true });

  const manifest = {};
  for (const entry of [...report.croppedReal, ...report.placeholders]) {
    manifest[entry.character] ??= {};
    manifest[entry.character][entry.state] ??= {};
    manifest[entry.character][entry.state][entry.direction] ??= [];
    manifest[entry.character][entry.state][entry.direction].push(entry.path);
  }
  fs.writeFileSync(path.join(OUT_ROOT, 'character_animations.json'), JSON.stringify(manifest, null, 2));

  fs.writeFileSync(path.join(OUT_ROOT, '_crop_report.json'), JSON.stringify(report, null, 2));
  console.log(`real crops: ${report.croppedReal.length}, placeholders: ${report.placeholders.length}, skipped: ${report.skipped.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
