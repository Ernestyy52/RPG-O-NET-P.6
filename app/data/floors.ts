export const TOTAL_FLOORS = 100

export interface FloorConfig {
  floor: number
  isBossFloor: boolean       // milestone world boss (ทุกๆ 10 ชั้น) — ใช้บอส craftpix + เงื่อนไข key item
  isMilestone: boolean       // = floor % 10 === 0
  monsterCount: number       // มอนสเตอร์เดินในชั้น (อย่างน้อย 25)
  monsterLevel: number
  monsterHp: number
  monsterAtk: number
  expReward: number
  goldReward: number
  isTownFloor: boolean
}

// จำนวนมอนสเตอร์ต่อชั้น: อย่างน้อย 25 ตัว เพิ่มขึ้นเล็กน้อยตามชั้นลึก
export const MIN_MONSTERS_PER_FLOOR = 25

// เธชเธนเธ•เธฃ scaling: เธเธงเธฒเธกเธขเธฒเธเน€เธเธดเนเธกเธเธถเนเธเนเธเธ exponential เน€เธฅเนเธเธเนเธญเธขเธ•เธฒเธกเธเธฑเนเธ เน€เธเธทเนเธญเนเธซเน 100 เธเธฑเนเธเธกเธตเธเธงเธฒเธกเธ—เนเธฒเธ—เธฒเธขเธ•เนเธญเน€เธเธทเนเธญเธ
export function isTownFloor(floor: number): boolean {
  return floor % 10 === 1
}

export function getFloorConfig(floor: number): FloorConfig {
  const isMilestone = floor % 10 === 0
  const townFloor = isTownFloor(floor)
  const monsterLevel = Math.max(1, Math.round(floor * 1.2))
  const baseHp = 20 + floor * 8
  const baseAtk = 3 + Math.floor(floor * 1.5)

  return {
    floor,
    isBossFloor: isMilestone,
    isMilestone,
    isTownFloor: townFloor,
    // ทุกชั้น (ยกเว้นหมู่บ้าน) มีมอนสเตอร์อย่างน้อย 25 ตัว
    monsterCount: townFloor ? 0 : MIN_MONSTERS_PER_FLOOR + Math.floor(floor / 20),
    monsterLevel,
    monsterHp: baseHp,
    monsterAtk: baseAtk,
    expReward: Math.round(1.5 * (10 + floor * 3)),
    goldReward: Math.round(1.2 * (8 + floor * 2)),
  }
}

// สเปกบอสประจำชั้น (ต่างจากมอนสเตอร์ทั่วไป — เลือดหนา/โจมตีแรง)
export function getBossStats(floor: number): { hp: number; atk: number; expReward: number; goldReward: number } {
  const baseHp = 20 + floor * 8
  const baseAtk = 3 + Math.floor(floor * 1.5)
  const milestone = floor % 10 === 0
  const mult = milestone ? 4 : 2.4
  return {
    hp: Math.round(baseHp * mult),
    atk: Math.round(baseAtk * (milestone ? 2 : 1.5)),
    expReward: Math.round((milestone ? 8 : 4) * (10 + floor * 3)),
    goldReward: Math.round((milestone ? 6 : 3) * (8 + floor * 2)),
  }
}

export function getQuestionDifficulty(floor: number): number {
  // เธ.6 O-NET: เนเธฅเนเธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเธขเธฒเธเธเธณเธ–เธฒเธก 1-5 เธ•เธฒเธกเธเนเธงเธเธเธฑเนเธ
  return Math.min(5, Math.ceil(floor / 20))
}
