export type AdventureRegionId =
  | 'verdant-frontier'
  | 'sunstone-steppe'
  | 'moonmist-marsh'
  | 'ember-ridge'
  | 'frostveil-highlands'
  | 'stormglass-coast'
  | 'ancient-canopy'
  | 'duskfall-wastes'
  | 'celestial-ruins'
  | 'echo-citadel'

export interface AdventureRegion {
  id: AdventureRegionId
  index: number
  name: string
  nameTh: string
  town: string
  field: string
  dungeon: string
  guardian: string
  description: string
  floorFrom: number
  floorTo: number
  accent: string
  icon: string
}

/**
 * The existing 100 deterministic floor configurations are presented as ten connected MMORPG regions.
 * `floor` remains the backwards-compatible progression rank; it is no longer described as a tower floor.
 */
export const ADVENTURE_REGIONS: AdventureRegion[] = [
  { id: 'verdant-frontier', index: 1, name: 'Verdant Frontier', nameTh: 'พรมแดนพฤกษา', town: 'Aethergate', field: 'Whisperleaf Fields', dungeon: 'Rootcellar Hollow', guardian: 'Myco Colossus', description: 'ทุ่งหญ้า ป่าริมเมือง และถ้ำรากไม้ เหมาะสำหรับนักผจญภัยหน้าใหม่', floorFrom: 1, floorTo: 10, accent: '#78d58b', icon: '🌿' },
  { id: 'sunstone-steppe', index: 2, name: 'Sunstone Steppe', nameTh: 'ทุ่งศิลาตะวัน', town: 'Solmere', field: 'Goldenwind Prairie', dungeon: 'Sunken Caravan', guardian: 'Gilded Behemoth', description: 'ที่ราบกว้าง เส้นทางคาราวาน และซากวิหารกลางทะเลทราย', floorFrom: 11, floorTo: 20, accent: '#e9bd62', icon: '☀️' },
  { id: 'moonmist-marsh', index: 3, name: 'Moonmist Marsh', nameTh: 'บึงหมอกจันทรา', town: 'Lunawick', field: 'Firefly Fen', dungeon: 'Drowned Archive', guardian: 'Mire Oracle', description: 'บึงเรืองแสงที่เต็มไปด้วยปริศนา พิษ และทางลับใต้ผิวน้ำ', floorFrom: 21, floorTo: 30, accent: '#8ed3c7', icon: '🌙' },
  { id: 'ember-ridge', index: 4, name: 'Ember Ridge', nameTh: 'สันเขาอัคคี', town: 'Cinderhold', field: 'Ashen Pass', dungeon: 'Molten Foundry', guardian: 'Inferno Drake', description: 'เหมืองร้อนระอุและโรงตีเหล็กโบราณที่มอนสเตอร์ธาตุไฟยึดครอง', floorFrom: 31, floorTo: 40, accent: '#ef7d56', icon: '🔥' },
  { id: 'frostveil-highlands', index: 5, name: 'Frostveil Highlands', nameTh: 'ที่สูงม่านน้ำแข็ง', town: 'Snowbell', field: 'Crystal Tundra', dungeon: 'Glacial Vault', guardian: 'Whitefang Sovereign', description: 'ที่ราบหิมะ ลมหนาว และสุสานผลึกเหนือแนวเมฆ', floorFrom: 41, floorTo: 50, accent: '#9edcff', icon: '❄️' },
  { id: 'stormglass-coast', index: 6, name: 'Stormglass Coast', nameTh: 'ชายฝั่งแก้วพายุ', town: 'Port Zephyr', field: 'Thundering Strand', dungeon: 'Leviathan Trench', guardian: 'Tempest Kraken', description: 'เมืองท่า เกาะกลางพายุ และถ้ำทะเลที่เปลี่ยนตามกระแสน้ำ', floorFrom: 51, floorTo: 60, accent: '#73b8ee', icon: '⚡' },
  { id: 'ancient-canopy', index: 7, name: 'Ancient Canopy', nameTh: 'พงไพรบรรพกาล', town: 'Elderbloom', field: 'Titanroot Wilds', dungeon: 'Serpent Temple', guardian: 'Emerald Wyrm', description: 'ป่าดึกดำบรรพ์หลายชั้น เต็มไปด้วยซากอารยธรรมและสัตว์ยักษ์', floorFrom: 61, floorTo: 70, accent: '#62be70', icon: '🦎' },
  { id: 'duskfall-wastes', index: 8, name: 'Duskfall Wastes', nameTh: 'แดนสนธยาร้าง', town: 'Lastlight', field: 'Twilight Expanse', dungeon: 'Hollow Necropolis', guardian: 'Grave Regent', description: 'ทะเลทรายสีม่วงและมหานครผู้วายชนม์ใต้ดวงอาทิตย์ที่ไม่ตกดิน', floorFrom: 71, floorTo: 80, accent: '#a886d7', icon: '💀' },
  { id: 'celestial-ruins', index: 9, name: 'Celestial Ruins', nameTh: 'ซากนครดารา', town: 'Astralis', field: 'Starlit Causeway', dungeon: 'Clockwork Observatory', guardian: 'Astral Chimera', description: 'เกาะลอยฟ้า กลไกโบราณ และเส้นทางดาวที่เปิดเฉพาะบางเวลา', floorFrom: 81, floorTo: 90, accent: '#90a8ff', icon: '⭐' },
  { id: 'echo-citadel', index: 10, name: 'Echo Citadel', nameTh: 'ป้อมปราการเสียงสะท้อน', town: 'Resonance', field: 'Hall of Memories', dungeon: 'Spiral Heart', guardian: 'The First Echo', description: 'บทสรุปของการเดินทาง ซึ่งความทรงจำทุกภูมิภาคกลับมาทดสอบผู้กล้า', floorFrom: 91, floorTo: 100, accent: '#e9a8ff', icon: '🌀' },
]

export function regionForFloor(floor: number): AdventureRegion {
  const safe = Math.max(1, Math.min(100, Math.floor(floor || 1)))
  return ADVENTURE_REGIONS.find((region) => safe >= region.floorFrom && safe <= region.floorTo) ?? ADVENTURE_REGIONS[0]!
}

export function getAdventureRegion(id: string | undefined): AdventureRegion {
  return ADVENTURE_REGIONS.find((region) => region.id === id) ?? ADVENTURE_REGIONS[0]!
}

export function regionUnlocked(region: AdventureRegion, progressionRank: number): boolean {
  return region.index === 1 || progressionRank >= region.floorFrom
}

export function explorationZoneForRegion(region: AdventureRegion, progressionRank: number): number {
  return Math.max(region.floorFrom, Math.min(region.floorTo, progressionRank))
}

export const RANKED_TOWER = {
  name: 'Endless Spire',
  nameTh: 'หอคอยไร้สิ้นสุด',
  description: 'โหมดท้าทายจัดอันดับ ศัตรูแข็งแกร่งขึ้นทุกชั้นและไม่ขวางเนื้อเรื่องหลัก',
  season: 'Season of the First Echo',
  ratingBase: 1000,
} as const
