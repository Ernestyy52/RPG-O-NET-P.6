// สกัดจาก Portal.png (Main Character Asset) -> ประตูดันเจี้ยน + รูปผู้เฝ้าประตูสำหรับกล่องสนทนา
//   public/npc/portal_gate.png       ซุ้มประตูหิน + ผู้เฝ้าประตู (โครงสร้างประตูดันเจี้ยนในเมือง)
//   public/npc/portal_guardian.png   ครึ่งตัวผู้เฝ้าประตู (portrait ในกล่องสนทนา)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const SRC = 'D:/Asset/Main Character Asset/Character Asset/Portal.png';
const OUT = path.join(__dirname, '../../public/npc');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // ประตู: ซุ้มหินทั้งภาพซ้าย ย่อให้พอเหมาะ (คมชัดด้วย nearest)
  await sharp(SRC).extract({ left: 30, top: 40, width: 335, height: 730 })
    .resize({ width: 190, kernel: 'nearest' })
    .png().toFile(path.join(OUT, 'portal_gate.png'));
  // portrait: ครึ่งตัวบน (หัว+อก+กุญแจ) ทำเป็นสี่เหลี่ยมจัตุรัส
  await sharp(SRC).extract({ left: 120, top: 150, width: 170, height: 230 })
    .resize({ width: 200, height: 200, fit: 'cover', position: 'top', kernel: 'nearest' })
    .png().toFile(path.join(OUT, 'portal_guardian.png'));
  console.log('portal_gate.png + portal_guardian.png');
})().catch((e) => { console.error(e); process.exit(1); });
