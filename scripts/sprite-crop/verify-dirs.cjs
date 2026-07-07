// ตัดเฟรมแต่ละทิศจาก character-sprites sheet ออกมาเป็นภาพเดี่ยวขยาย 2 เท่า เพื่อตรวจทิศทางด้วยตา
// ใช้: node scripts/sprite-crop/verify-dirs.cjs <outDir> [sheetName...]
const sharp = require('sharp');
const path = require('path');
const SHEET = path.join(__dirname, '../../public/character-sprites');
const manifest = require(path.join(SHEET, '_sheet_manifest.json'));

const outDir = process.argv[2];
const names = process.argv.slice(3).length ? process.argv.slice(3) : ['warrior_male', 'guardian_female'];
if (!outDir) { console.error('usage: node verify-dirs.cjs <outDir> [names...]'); process.exit(1); }

(async () => {
  const dirs = ['down', 'left', 'right', 'up'];
  for (const name of names) {
    const { fw, fh } = manifest[name];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        await sharp(path.join(SHEET, `${name}.png`))
          .extract({ left: c * fw, top: r * fh, width: fw, height: fh })
          .resize({ width: fw * 2, kernel: 'nearest' })
          .png().toFile(path.join(outDir, `dir_${name}_${dirs[r]}_${c === 0 ? 'idle' : 'move'}.png`));
      }
    }
    console.log(`extracted ${name}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
