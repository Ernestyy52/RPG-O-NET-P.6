import type { AdventureRegionId } from '~/data/adventureRegions'

export interface World1CompletionItem {
  itemId: string
  qty: number
}

export interface World1CompletionReward {
  exp: number
  gold: number
  gems: number
  items: readonly World1CompletionItem[]
}

/**
 * Stable handoff contract between the finished World 1 slice and future World 2 content.
 * World 2 stays locked until content exists; clearing World 1 only records rank 10 and awards
 * a deterministic starter package that cannot be duplicated by replaying the boss portal.
 */
export const WORLD1_HANDOFF_CONTRACT = {
  regionId: 'verdant-frontier' as AdventureRegionId,
  guardianId: 'myco_colossus',
  completionRank: 10,
  nextRegionRank: 11,
  targetLevel: 10,
  acceptableLevelBand: { min: 8, max: 11 },
  returnZoneId: 'aethergate',
  reward: {
    exp: 550,
    gold: 250,
    gems: 2,
    items: [
      { itemId: 'set_verdant_trinket', qty: 1 },
      { itemId: 'potion_m', qty: 2 },
    ],
  } satisfies World1CompletionReward,
} as const

export function completionRewardForRegion(regionId: AdventureRegionId): World1CompletionReward | undefined {
  return regionId === WORLD1_HANDOFF_CONTRACT.regionId ? WORLD1_HANDOFF_CONTRACT.reward : undefined
}
