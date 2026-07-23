import type { AdventureRegionId } from './adventureRegions'
import { zonesForRegion } from './adventureZones'
import { monsterEcology } from './monsterEcology'
import { signatureDropForMonster } from './loot'

export interface HuntingReward { exp: number; gold: number; gems: number; itemId: string; itemQty: number }
export interface HuntingContract {
  id: string
  date: string
  regionId: AdventureRegionId
  targetMonsterId: string
  targetName: string
  target: number
  progress: number
  claimed: boolean
  difficulty: 'standard' | 'elite' | 'rare'
  reward: HuntingReward
}

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619)
  return value >>> 0
}

export function rollHuntingBoard(date: string, regionId: AdventureRegionId, adventureRank: number): HuntingContract[] {
  const monsters = [...new Set(zonesForRegion(regionId).filter((zone) => zone.kind === 'field' && zone.rank <= adventureRank).flatMap((zone) => zone.monsterIds))]
  const pool = monsters.length ? monsters : zonesForRegion(regionId).flatMap((zone) => zone.monsterIds)
  const difficulties: HuntingContract['difficulty'][] = ['standard', 'elite', 'rare']
  return difficulties.map((difficulty, index) => {
    const targetMonsterId = pool[(hash(`${date}:${regionId}:${difficulty}`) + index) % Math.max(1, pool.length)] ?? 'slime'
    const profile = monsterEcology(targetMonsterId)
    const target = difficulty === 'standard' ? 8 : difficulty === 'elite' ? 3 : 1
    const rewardMult = difficulty === 'standard' ? 1 : difficulty === 'elite' ? 1.8 : 2.8
    return {
      id: `${date}:${regionId}:${difficulty}:${targetMonsterId}`,
      date, regionId, targetMonsterId,
      targetName: targetMonsterId.split('_').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' '),
      target, progress: 0, claimed: false, difficulty,
      reward: {
        exp: Math.round((30 + adventureRank * 7) * rewardMult),
        gold: Math.round((22 + adventureRank * 5) * rewardMult),
        gems: difficulty === 'rare' ? 1 : 0,
        itemId: signatureDropForMonster(targetMonsterId) ?? 'slime_gel',
        itemQty: difficulty === 'standard' ? 1 : difficulty === 'elite' ? 2 : 3,
      },
    }
  })
}

export function huntQualifies(contract: HuntingContract, monsterId: string | undefined, elite = false, rare = false): boolean {
  if (!monsterId || contract.targetMonsterId !== monsterId) return false
  if (contract.difficulty === 'elite') return elite
  if (contract.difficulty === 'rare') return rare
  return true
}
