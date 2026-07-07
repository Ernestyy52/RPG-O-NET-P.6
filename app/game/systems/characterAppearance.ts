// เน‚เธกเน€เธ”เธฅเธเนเธญเธกเธนเธฅเธซเธเนเธฒเธ•เธฒเธเธฑเธงเธฅเธฐเธเธฃ เนเธเน็เนเธเธเธฑเธเนเธเธเธเธฒเธฃเน€เธฅเนเธเธเธฃเธดเธเธเธเธฃเธฃเธก/เธชเธ•เนเธฒเธ•/เธ­เธดเธเน€เธงเธเธ•เธญเธฃเธตเนเธ”เน — เธเธฑเธ”เธฃเธนเธ›เธ—เธฃเธเน (visual) เธเธฒเธเธเธฃเธฐเธเธฃเธฃเธ (equipment.ts)
import type { HeroClassId } from '../../data/classes'
import type { GenderId } from '../../stores/player'
import type { EquipmentSlot } from '../../data/equipment'

export type CharacterLayerName = 'body' | 'pants' | 'shoes' | 'outfit' | 'hair' | 'accessory' | 'weapon'

export interface CharacterAppearance {
  bodyType: GenderId
  classId: HeroClassId
  skinColor: number
  hairStyle: string
  hairColor: number
  outfitId: string | null
  pantsId: string | null
  shoesId: string | null
  weaponId: string | null
  accessoryId: string | null
}

export function defaultAppearance(): CharacterAppearance {
  return {
    bodyType: 'male',
    classId: 'warrior',
    skinColor: 0xe8b98a,
    hairStyle: 'short',
    hairColor: 0x5a3a24,
    outfitId: null,
    pantsId: null,
    shoesId: null,
    weaponId: null,
    accessoryId: null,
  }
}

/** เธชเธฃเนเธฒเธ CharacterAppearance เธเธฒเธเธชเธ–เธฒเธเธฐเธเธญเธเธ Pinia player store (เน€เธฅเนเธเธเธฑเธเธเธเธฒเธฃเน€เธฅเนเธเธ classId/equipment เธเนเธฒเธเธฃเธฐเธ”เธฑเธเธ•เธฑเธง) */
export function appearanceFromStore(store: {
  gender: GenderId
  classId: HeroClassId
  appearance: { hair: string; color: string }
  equipment: Partial<Record<EquipmentSlot, string>>
}): CharacterAppearance {
  return {
    bodyType: store.gender,
    classId: store.classId,
    skinColor: 0xe8b98a,
    hairStyle: store.appearance.hair,
    hairColor: hairColorToHex(store.appearance.color),
    outfitId: store.equipment.armor ?? null,
    pantsId: null,
    shoesId: null,
    weaponId: store.equipment.weapon ?? null,
    accessoryId: store.equipment.trinket ?? null,
  }
}

function hairColorToHex(color: string): number {
  const table: Record<string, number> = {
    amber: 0x8a5a24,
    black: 0x2a2118,
    brown: 0x5a3a24,
    blonde: 0xd9c060,
    silver: 0xc8ccd4,
  }
  return table[color] ?? 0x5a3a24
}
