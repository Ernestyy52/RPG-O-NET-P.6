// สร้าง contact sheet จากเฟรมแรก (idle frame 0) ของไฟล์บอส MCA ทุกไฟล์ที่ไม่ซ้ำ เพื่อเลือกใช้
// ใช้: node scripts/sprite-crop/boss-contact-sheet.cjs <outPng>
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const SRC = 'D:/Asset/Main Character Asset/Character Asset/Boss';

async function main() {
  const out = process.argv[2];
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.png'))
    // ตัดชุด 11_09_42 ที่เป็นไฟล์ซ้ำของชุด 11_09_22-26 (ขนาดไฟล์ตรงกันทุกไฟล์)
    .filter((f) => !f.includes('11_09_42'))
    .sort();
  const CELL = 96;
  const cols = 10;
  const rows = Math.ceil(files.length / cols);
  const composites = [];
  for (let i = 0; i < files.length; i++) {
    // เฟรม idle แรก = ช่องซ้ายบนของกริด 4x4 (1254/4 ≈ 313)
    const buf = await sharp(path.join(SRC, files[i]))
      .extract({ left: 0, top: 0, width: 313, height: 313 })
      .resize(CELL, CELL, { kernel: 'nearest' })
      .toBuffer();
    composites.push({ input: buf, left: (i % cols) * CELL, top: Math.floor(i / cols) * CELL });
  }
  await sharp({ create: { width: cols * CELL, height: rows * CELL, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite(composites).png().toFile(out);
  console.log(files.length, 'files ->', out);
  files.forEach((f, i) => console.log(String(i).padStart(2), f));
}
main().catch((e) => { console.error(e); process.exit(1); });
