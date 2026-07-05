export interface Biome {
  id: string
  name: string
  grass: { base: number; dark: number; light: number }
  tree: { trunk: number; leafDark: number; leaf: number; leafLight: number }
  wallBase: number
  bg: number
}

// ไบโอม 5 แบบ วนทุก 10 ชั้น (เหมือนแนวคิดจากโปรเจกต์ onet-game-2569)
export const BIOMES: Biome[] = [
  {
    id: 'forest',
    name: 'ป่าเขียวขจี',
    grass: { base: 0x5fa25a, dark: 0x4c8a48, light: 0x79bd6e },
    tree: { trunk: 0x6b4a2c, leafDark: 0x2f6b34, leaf: 0x3f8a44, leafLight: 0x5cab5a },
    wallBase: 0x5a4632,
    bg: 0x1c2b1a,
  },
  {
    id: 'desert',
    name: 'ทะเลทรายร้อนระอุ',
    grass: { base: 0xd8bd7a, dark: 0xc1a561, light: 0xe8d59a },
    tree: { trunk: 0x8a5a34, leafDark: 0x6f8a3a, leaf: 0x8aab4a, leafLight: 0xa8c869 },
    wallBase: 0x8a6b42,
    bg: 0x3a2c18,
  },
  {
    id: 'snow',
    name: 'ทุ่งหิมะเยือกแข็ง',
    grass: { base: 0xdbe8ef, dark: 0xbfd3de, light: 0xf3fafd },
    tree: { trunk: 0x5a4a3c, leafDark: 0x3f6a56, leaf: 0x568a72, leafLight: 0x8fc9b0 },
    wallBase: 0x5a6a76,
    bg: 0x18242c,
  },
  {
    id: 'volcano',
    name: 'ดินแดนภูเขาไฟ',
    grass: { base: 0x5a3f3d, dark: 0x462f2d, light: 0x704e4a },
    tree: { trunk: 0x2c1e18, leafDark: 0x5a2a20, leaf: 0x8a3a24, leafLight: 0xd15a2e },
    wallBase: 0x4a2c22,
    bg: 0x2a1210,
  },
  {
    id: 'cave',
    name: 'ถ้ำคริสตัลลึกลับ',
    grass: { base: 0x393454, dark: 0x2c2843, light: 0x4b4570 },
    tree: { trunk: 0x2a2440, leafDark: 0x453a70, leaf: 0x6a5aa0, leafLight: 0x9b8cff },
    wallBase: 0x2e2844,
    bg: 0x120f1e,
  },
]

export function biomeForFloor(floor: number): Biome {
  return BIOMES[Math.floor((floor - 1) / 10) % BIOMES.length]
}
