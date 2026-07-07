// ตรวจว่าแถว left/right ของ sheet หันคนละด้านจริง: ถ้า right เป็น mirror ของ left => ทิศถูกต้อง
// ใช้: node scripts/sprite-crop/check-mirror.cjs <scratchDir>
const sharp = require('sharp');
const path = require('path');
const OUT = process.argv[2];

(async () => {
  for (const d of ['left', 'right']) {
    const src = path.join(OUT, `dir_warrior_male_${d}_idle.png`);
    const meta = await sharp(src).metadata();
    await sharp(src)
      .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.45) })
      .resize({ width: meta.width * 3, kernel: 'nearest' })
      .png().toFile(path.join(OUT, `head_${d}.png`));
  }
  const l = await sharp(path.join(OUT, 'dir_warrior_male_left_idle.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rF = await sharp(path.join(OUT, 'dir_warrior_male_right_idle.png')).flop().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rS = await sharp(path.join(OUT, 'dir_warrior_male_right_idle.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  function diff(a, b) {
    const n = Math.min(a.data.length, b.data.length);
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i += 41) { sum += Math.abs(a.data[i] - b.data[i]); cnt++; }
    return Math.round(sum / cnt);
  }
  console.log('diff(left, mirrored-right) =', diff(l, rF), '(low => right is mirror of left => directions CORRECT)');
  console.log('diff(left, right-as-is)    =', diff(l, rS), '(low => both rows face the SAME way => directions WRONG)');
})().catch((e) => { console.error(e); process.exit(1); });
