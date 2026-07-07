// เนเธเธ—เธตเนเธเธฅเธฒเธเธเธฅเธฒเธ: เธเธผเธ item id (เธเธฒเธ app/data/equipment.ts) -> เธเธฑเธเน€เธฅเน€เธขเธญเธฃเนเธชเธไธฃเธดเธ•/asset เธ—เธตเนเนเธเนเนเธชเธ”เธเธ—เธฃเธเน
// เธ–เนเธฒ item id เนเธซเธเนเนเธกเนเธกเธตเธเธฒเธเนเธเธ—เธตเนเธเธตเน เธฃเธฐเธเธเธเธฐเนเธเนเธ placeholder เธเธฒเธ buildCharacterLayerPlaceholders() เนเธ—เธ (textures.ts) เนเธ”เธขเนเธกเนเธเธฃเธฑเธข

export interface EquipmentVisualEntry {
  layer: 'weapon' | 'outfit' | 'pants' | 'shoes' | 'hair' | 'accessory'
  /** เธเธฒเธ—เธเธฒเธเธ—เธฒเธเธเธฃเธดเธ (เธ—เธตเน public/) - เธ–เนเธฒเนเธกเนเธชเธเนเธง เธเธฐ fallback เนเธเธ placeholder เธ—เธตเน generate เนเธงเนเธเธฃเธฒเธเธเธฅเธ” */
  asset?: string
  /** key เธ—เธตเนเนเธเน scene.textures เธชเธณเธซเธฃเธฑเธ placeholder เธ—เธตเนเธเธฒเธเน€เธชเนเธเธชเธตเนเธงเน (เนเธเน placeholder เธชเนเธงเธเธเธฅเธฒเธ) */
  placeholderKey?: string
}

/**
 * Weapon assets เธ—เธตเนเธกเธตเธเธฃเธดเธเธเธฒเธ D:\Asset\Main Character Asset\Weapon and Wear
 * (copy เธกเธฒเนเธงเนเธ—เธตเน public/character-layers/weapon/) — เนเธเนเน€เธเนเธ static icon เธ•เธดเธ”เธเธฑเธเธ•เธฑเธง เธเธณเนเธซเธเนเธ”เนเธงเธขเธ—เธดเธจเธ—เธฒเธ/depth
 * เธชเนเธงเธเธญเธทเนเธเน† (outfit/pants/shoes/hair/accessory) เธขเธฑเธเนเธกเนเธกเธตเธ sprite เนเธซเธเนเธชเธณเธซเธฃเธฑเธ 4 เธ—เธดเธจ x 5 anim state เนเธเนเธฃเธฐเธเธ เธเธถเธเนเธเนเนเธเนเธเน placeholder เธชเธตเธ•เธฑเธเนเธ—เธ
 */
export const EquipmentVisualMap: Record<string, EquipmentVisualEntry> = {
  weapon_t1: { layer: 'weapon', asset: 'character-layers/weapon/bronze_axe.png' },
  weapon_t2: { layer: 'weapon', asset: 'character-layers/weapon/iron_sword.png' },
  weapon_t3: { layer: 'weapon', asset: 'character-layers/weapon/bronze_spear.png' },
  weapon_t4: { layer: 'weapon', asset: 'character-layers/weapon/bronze_staff.png' },
  weapon_t5: { layer: 'weapon', asset: 'character-layers/weapon/bronze_staff.png' },

  armor_t1: { layer: 'outfit', placeholderKey: 'layer_outfit_t1' },
  armor_t2: { layer: 'outfit', placeholderKey: 'layer_outfit_t2' },
  armor_t3: { layer: 'outfit', placeholderKey: 'layer_outfit_t3' },
  armor_t4: { layer: 'outfit', placeholderKey: 'layer_outfit_t4' },
  armor_t5: { layer: 'outfit', placeholderKey: 'layer_outfit_t5' },

  trinket_t1: { layer: 'accessory', placeholderKey: 'layer_accessory_t1' },
  trinket_t2: { layer: 'accessory', placeholderKey: 'layer_accessory_t2' },
  trinket_t3: { layer: 'accessory', placeholderKey: 'layer_accessory_t3' },
  trinket_t4: { layer: 'accessory', placeholderKey: 'layer_accessory_t4' },
  trinket_t5: { layer: 'accessory', placeholderKey: 'layer_accessory_t5' },
}

export function visualForItemId(itemId: string | null | undefined): EquipmentVisualEntry | null {
  if (!itemId) return null
  return EquipmentVisualMap[itemId] ?? null
}
