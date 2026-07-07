// คัดลอก BGM จาก D:\Asset\Main Character Asset\Audio\Audio\mp3 -> public/audio/bgm_<key>.mp3
// หมายเหตุ: ชื่อไฟล์ต้นทางเป็น mojibake (encoding เพี้ยนตอนแตก zip) จึง map ตามลำดับ readdir
// (NTFS เรียงคงที่) และยืนยันความถูกต้องด้วยขนาดไฟล์เฉพาะตัวของ town (255KB) / cave (274KB)
//
// ลำดับ readdir ที่ตรวจแล้ว:
//   [0] No8 電子世界1 (โลกดิจิทัล)   — ไม่ใช้
//   [1] No9 氷の神殿1 (วิหารน้ำแข็ง)  -> snow
//   [2] No6 地下街 (เมืองใต้ดิน)      -> town   (~255KB)
//   [3] No7 氷の神殿 (เวอร์ชันยาว)    — ไม่ใช้
//   [4] No1 (เพลงเปิด)               — ไม่ใช้
//   [5] No10 祠の洞窟1 (ถ้ำศาลเจ้า)  -> desert
//   [6] No2 火山地帯1 (แดนภูเขาไฟ)   -> volcano
//   [7] No3 呪いの洞窟1 (ถ้ำต้องสาป) -> cave   (~274KB)
//   [8] No4 神聖な森1 (ป่าศักดิ์สิทธิ์) -> forest
//   [9] No5 神聖な森2                — ไม่ใช้
const fs = require('fs');
const path = require('path');

const SRC = 'D:/Asset/Main Character Asset/Audio/Audio/mp3';
const OUT = path.join(__dirname, '../../public/audio');
const BY_INDEX = { 1: 'snow', 2: 'town', 5: 'desert', 6: 'volcano', 7: 'cave', 8: 'forest' };

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.mp3'));
if (files.length !== 10) { console.error(`expected 10 mp3 files, found ${files.length} — aborting`); process.exit(1); }

// sanity check ด้วยขนาดเฉพาะตัว
const kb = (i) => Math.round(fs.statSync(path.join(SRC, files[i])).size / 1024);
if (Math.abs(kb(2) - 255) > 10 || Math.abs(kb(7) - 274) > 10) {
  console.error(`size sanity check failed: idx2=${kb(2)}KB (expect ~255), idx7=${kb(7)}KB (expect ~274) — aborting`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [idx, key] of Object.entries(BY_INDEX)) {
  const dest = path.join(OUT, `bgm_${key}.mp3`);
  fs.copyFileSync(path.join(SRC, files[idx]), dest);
  console.log(`bgm_${key}.mp3  (${Math.round(fs.statSync(dest).size / 1024)}KB)`);
}
