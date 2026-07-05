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
}

// สูตร scaling: ความยากเพิ่มขึ้นแบบ exponential เล็กน้อยตามชั้น เพื่อให้ 100 ชั้นมีความท้าทายต่อเนื่อง
export function getFloorConfig(floor: number): FloorConfig {
  const isBossFloor = floor % 10 === 0
  const monsterLevel = Math.max(1, Math.round(floor * 1.2))
  const baseHp = 20 + floor * 8
  const baseAtk = 3 + Math.floor(floor * 1.5)

  return {
    floor,
    isBossFloor,
    monsterCount: isBossFloor ? 1 : 2 + Math.floor(floor / 20),
    monsterLevel,
    monsterHp: isBossFloor ? Math.round(baseHp * 4) : baseHp,
    monsterAtk: isBossFloor ? Math.round(baseAtk * 2) : baseAtk,
    expReward: Math.round((isBossFloor ? 8 : 1.5) * (10 + floor * 3)),
    goldReward: Math.round((isBossFloor ? 6 : 1.2) * (8 + floor * 2)),
  }
}

export function getQuestionDifficulty(floor: number): number {
  // ป.6 O-NET: ไล่ระดับความยากคำถาม 1-5 ตามช่วงชั้น
  return Math.min(5, Math.ceil(floor / 20))
}
