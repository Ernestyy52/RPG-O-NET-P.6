// ขนาดเฟรม source ของผู้เล่นทุกคลาส×เพศใน hero-atlas (public/character-sprites/hero-atlas.png,
// สร้างด้วย scripts/sprite-crop/build-hero-atlas.cjs) — แยกจาก textures.ts เป็นโมดูล pure
// เพื่อให้ scale lab / unit test คำนวณ scale, pixel cadence และ width band ได้โดยไม่ลาก Phaser เข้ามา
// (textures.ts import จากที่นี่ — ค่าชุดเดียว ห้าม duplicate)
export const HERO_SRC_H = 96

export const CLASS_SHEETS: Record<string, { fw: number; fh: number }> = {
  warrior_male: { fw: 46, fh: 96 }, warrior_female: { fw: 43, fh: 96 },
  archer_male: { fw: 46, fh: 96 }, archer_female: { fw: 44, fh: 96 },
  mage_male: { fw: 47, fh: 96 }, mage_female: { fw: 48, fh: 96 },
  guardian_male: { fw: 53, fh: 96 }, guardian_female: { fw: 50, fh: 96 },
}
