// ================================================================================================
// Hero atlas — รวมสไปรต์ผู้เล่นทุกคลาส×เพศ (8 ตัว) ลง texture atlas เดียว เพื่อประสิทธิภาพ
// เมื่อมีผู้เล่นหลายตัวในฉาก (multiplayer): 1 texture = 1 draw batch + ลด memory ~3 เท่า
//
// Input:  public/character-sprites/<key>.png (4 แถวทิศ × 2 คอลัมน์ [idle, move]) + _sheet_manifest.json
// Output: public/character-sprites/hero-atlas.png + hero-atlas.json (Phaser JSON-hash)
//
// อัพเกรดอนิเมชันเดินจาก 2 → 4 สเต็ป โดยไม่มโนเฟรมใหม่:
//   เฟรม 0 = idle, 1 = moveA (ของจริง), 2 = moveB ที่ bake จากของจริง:
//   - ทิศ down/up: mirror แนวนอนของ moveA = ก้าวขาสลับข้าง (สมมาตรถูกต้องตามหลักสไปรต์เดิน)
//   - ทิศ left/right: moveA ยกขึ้น 2px = จังหวะยกตัวช่วงก้าว (walk-cycle bob)
//   วงจรเดิน: [1, 0, 2, 0] → step-stand-step-stand แบบ RPG คลาสสิก
// ทุกเฟรมย่อเหลือสูง 96px (kernel nearest, คงความคมพิกเซล) — แสดงจริง 48px เผื่อ zoom 2x
// ================================================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../public/character-sprites');
const MANIFEST = path.join(SRC_DIR, '_sheet_manifest.json');
const OUT_H = 96;
const PAD = 1;
const DIRS = ['down', 'left', 'right', 'up'];

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const keys = Object.keys(manifest);
  const chars = [];

  for (const key of keys) {
    const { fw, fh } = manifest[key];
    const file = path.join(SRC_DIR, `${key}.png`);
    const cw = Math.round((fw * OUT_H) / fh);
    const cells = {}; // `${dir}_${i}` -> buffer (cw x OUT_H)

    for (let r = 0; r < DIRS.length; r++) {
      const dir = DIRS[r];
      const extractResize = (col) =>
        sharp(file)
          .extract({ left: col * fw, top: r * fh, width: fw, height: fh })
          .resize({ height: OUT_H, width: cw, kernel: 'nearest' })
          .png()
          .toBuffer();
      const idle = await extractResize(0);
      const moveA = await extractResize(1);
      let moveB;
      if (dir === 'down' || dir === 'up') {
        moveB = await sharp(moveA).flop().png().toBuffer();
      } else {
        // ยกขึ้น 2px: ตัด 2px บนทิ้ง แล้วเติมโปร่งใสด้านล่าง (ขนาดเซลล์คงเดิม)
        moveB = await sharp(moveA)
          .extract({ left: 0, top: 2, width: cw, height: OUT_H - 2 })
          .extend({ bottom: 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      }
      cells[`${dir}_0`] = idle;
      cells[`${dir}_1`] = moveA;
      cells[`${dir}_2`] = moveB;
    }
    chars.push({ key, cw, cells });
  }

  // จัดวาง: 1 ตัวละคร = 1 แถว (12 เซลล์: 4 ทิศ × 3 เฟรม), แถวสูง OUT_H+PAD*2
  const cellH = OUT_H + PAD * 2;
  const maxCellW = Math.max(...chars.map((c) => c.cw)) + PAD * 2;
  const atlasW = maxCellW * 12;
  const atlasH = cellH * chars.length;
  const composites = [];
  const frames = {};

  chars.forEach((char, row) => {
    let col = 0;
    for (const dir of DIRS) {
      for (let i = 0; i < 3; i++) {
        const x = col * maxCellW + PAD + Math.round((maxCellW - PAD * 2 - char.cw) / 2);
        const y = row * cellH + PAD;
        composites.push({ input: char.cells[`${dir}_${i}`], left: x, top: y });
        frames[`${char.key}_${dir}_${i}`] = {
          frame: { x, y, w: char.cw, h: OUT_H },
          rotated: false,
          trimmed: false,
          sourceSize: { w: char.cw, h: OUT_H },
          spriteSourceSize: { x: 0, y: 0, w: char.cw, h: OUT_H },
        };
        col++;
      }
    }
  });

  await sharp({ create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png()
    .toFile(path.join(SRC_DIR, 'hero-atlas.png'));

  fs.writeFileSync(
    path.join(SRC_DIR, 'hero-atlas.json'),
    JSON.stringify({ frames, meta: { image: 'hero-atlas.png', size: { w: atlasW, h: atlasH }, scale: 1 } }, null, 1),
  );

  const sizes = Object.fromEntries(chars.map((c) => [c.key, { fw: c.cw, fh: OUT_H }]));
  fs.writeFileSync(path.join(SRC_DIR, '_atlas_manifest.json'), JSON.stringify(sizes, null, 2));
  console.log(`atlas: ${atlasW}x${atlasH}, ${Object.keys(frames).length} frames`);
  console.log('CLASS_SHEETS =', JSON.stringify(sizes));
}
main().catch((e) => { console.error(e); process.exit(1); });
