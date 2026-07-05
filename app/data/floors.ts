export const TOTAL_FLOORS = 100

export interface FloorConfig {
  floor: number
  isBossFloor: boolean
  monsterCount: number
  monsterLevel: number
  monsterHp: number
  monsterAtk: number
  expReward: number
  goldReward: number
  isTownFloor: boolean
}

// เธชเธนเธ•เธฃ scaling: เธเธงเธฒเธกเธขเธฒเธเน€เธเธดเนเธกเธเธถเนเธเนเธเธ exponential เน€เธฅเนเธเธเนเธญเธขเธ•เธฒเธกเธเธฑเนเธ เน€เธเธทเนเธญเนเธซเน 100 เธเธฑเนเธเธกเธตเธเธงเธฒเธกเธ—เนเธฒเธ—เธฒเธขเธ•เนเธญเน€เธเธทเนเธญเธ
export function getFloorConfig(floor: number): FloorConfig {
  const isBossFloor = floor % 10 === 0
  const isTownFloor = floor > 1 && floor % 10 === 1
  const monsterLevel = Math.max(1, Math.round(floor * 1.2))
  const baseHp = 20 + floor * 8
  const baseAtk = 3 + Math.floor(floor * 1.5)

  return {
    floor,
    isBossFloor,
    isTownFloor,
    monsterCount: isTownFloor ? 0 : isBossFloor ? 1 : 2 + Math.floor(floor / 20),
    monsterLevel,
    monsterHp: isBossFloor ? Math.round(baseHp * 4) : baseHp,
    monsterAtk: isBossFloor ? Math.round(baseAtk * 2) : baseAtk,
    expReward: Math.round((isBossFloor ? 8 : 1.5) * (10 + floor * 3)),
    goldReward: Math.round((isBossFloor ? 6 : 1.2) * (8 + floor * 2)),
  }
}

export function getQuestionDifficulty(floor: number): number {
  // เธ.6 O-NET: เนเธฅเนเธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเธขเธฒเธเธเธณเธ–เธฒเธก 1-5 เธ•เธฒเธกเธเนเธงเธเธเธฑเนเธ
  return Math.min(5, Math.ceil(floor / 20))
}
