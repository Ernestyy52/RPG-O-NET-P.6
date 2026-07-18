// ================================================================================================
// EquipmentVisual registry (Master Plan Phase 3) — mapping "ไอเทมที่สวมใส่ → สิ่งที่เห็นบนตัวละคร"
// ทุก equippable item ต้องมี visual mapping หรือ hidden พร้อมเหตุผล (กติกา Phase 3 Batch C)
//
// ความจริงด้าน asset วันนี้: hero-atlas มีเฉพาะ body รวมชุดต่อ class×gender (idle/walk 4 ทิศ)
// ยังไม่มี overlay layer ที่ align ต่อ slot (ดู gap ใน docs/ASSET_MANIFEST.md) ดังนั้น:
//  - weapon  → 'held-icon' : วาดไอคอนอาวุธประจำประเภท (wpn_*.png) ในมือจริงตามทิศ — เปลี่ยนจริงเมื่อสลับ
//  - armor   → 'aura'      : ออร่าสีตามความหายาก + badge ใน StatusModal (overlay art ยังไม่มี — hidden reason)
//  - trinket → 'aura'      : เช่นเดียวกัน
// ================================================================================================
import { ALL_EQUIPMENT, rarityColor, type EquipmentItem } from './equipment'

export type VisualSlot = 'weapon' | 'armor' | 'trinket'
export type Facing = 'down' | 'left' | 'right' | 'up'

/** ตำแหน่ง/เลเยอร์ของ held item ต่อทิศ — หน่วยพิกเซลจากจุดกึ่งกลางตัวละคร (display 2x ของ 16px art) */
export interface DirectionalAnchor {
  x: number
  y: number
  /** true = วาดทับตัวละคร (ถือด้านหน้า), false = อยู่หลังตัว (เดินขึ้น) */
  front: boolean
  flipX: boolean
  angle: number
}

export interface EquipmentVisual {
  itemId: string
  slot: VisualSlot
  mode: 'held-icon' | 'aura' | 'hidden'
  /** path ใต้ public/ สำหรับ held-icon (ผ่าน assetPath ตอนโหลด) */
  iconPath?: string
  auraColor?: string
  anchors?: Record<Facing, DirectionalAnchor>
  hiddenReason?: string
}

/** anchor มือถืออาวุธ — จูนกับ hero-atlas เฟรม ~46-53×96 แสดงผล scale เดิมของ scene */
export const WEAPON_ANCHORS: Record<Facing, DirectionalAnchor> = {
  down: { x: 9, y: 7, front: true, flipX: false, angle: 12 },
  left: { x: -11, y: 5, front: true, flipX: true, angle: -8 },
  right: { x: 11, y: 5, front: true, flipX: false, angle: 8 },
  up: { x: -9, y: 1, front: false, flipX: true, angle: -12 },
}

const ARMOR_HIDDEN_REASON =
  'ยังไม่มี overlay art ที่ align กับ hero-atlas ต่อ slot (ASSET_MANIFEST gap) — แสดงผ่านออร่าความหายาก + badge'

export function visualForItem(item: EquipmentItem): EquipmentVisual {
  if (item.slot === 'weapon') {
    return {
      itemId: item.id,
      slot: 'weapon',
      mode: 'held-icon',
      iconPath: `item-icons/${item.icon}.png`,
      anchors: WEAPON_ANCHORS,
      auraColor: rarityColor(item.rarity),
    }
  }
  return {
    itemId: item.id,
    slot: item.slot,
    mode: 'aura',
    auraColor: rarityColor(item.rarity),
    hiddenReason: ARMOR_HIDDEN_REASON,
  }
}

const VISUAL_BY_ID = new Map(ALL_EQUIPMENT.map((it) => [it.id, visualForItem(it)]))
export function getEquipmentVisual(itemId: string): EquipmentVisual | undefined {
  return VISUAL_BY_ID.get(itemId)
}

/** Validator (ใช้ใน test + dev): ทุก equippable ต้อง mapped ครบตามกติกา — คืน list ของปัญหา */
export function validateEquipmentVisuals(): string[] {
  const problems: string[] = []
  const facings: Facing[] = ['down', 'left', 'right', 'up']
  for (const item of ALL_EQUIPMENT) {
    const v = getEquipmentVisual(item.id)
    if (!v) { problems.push(`${item.id}: no visual mapping`); continue }
    if (v.mode === 'held-icon') {
      if (!v.iconPath) problems.push(`${item.id}: held-icon without iconPath`)
      if (!v.anchors) problems.push(`${item.id}: held-icon without anchors`)
      else for (const f of facings) if (!v.anchors[f]) problems.push(`${item.id}: missing anchor ${f}`)
    } else if (v.mode === 'hidden' || v.mode === 'aura') {
      if (v.mode === 'hidden' && !v.hiddenReason) problems.push(`${item.id}: hidden without reason`)
      if (v.mode === 'aura' && !v.auraColor) problems.push(`${item.id}: aura without color`)
    }
  }
  return problems
}
