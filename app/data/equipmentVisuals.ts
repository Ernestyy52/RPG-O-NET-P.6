// Equipment paper-doll registry. Every equipped item resolves to deterministic visual layers.
import { ALL_EQUIPMENT, rarityColor, type EquipmentItem } from './equipment'

export type VisualSlot = 'weapon' | 'armor' | 'trinket'
export type PaperdollLayerSlot = VisualSlot | 'head' | 'offhand'
export type Facing = 'down' | 'left' | 'right' | 'up'
export type EquipmentVisualMode = 'animated-weapon' | 'outfit' | 'charm'
export type OutfitFamily = 'robe' | 'leather' | 'chain' | 'plate' | 'dragon'
export type WeaponFamily = 'sword' | 'greatsword' | 'dagger' | 'rapier' | 'axe' | 'mace' | 'spear' | 'bow' | 'crossbow' | 'staff' | 'wand' | 'scythe'
export type ShieldFamily = 'round' | 'kite' | 'arcane'

export interface DirectionalAnchor {
  x: number
  y: number
  front: boolean
  flipX: boolean
  angle: number
}

export interface EquipmentVisual {
  itemId: string
  slot: VisualSlot
  mode: EquipmentVisualMode
  iconPath: string
  animationPath?: string
  headAnimationPath?: string
  offhandAnimationPath?: string
  auraColor: string
  anchors: Record<Facing, DirectionalAnchor>
  outfitFamily?: OutfitFamily
  weaponFamily?: WeaponFamily
  shieldFamily?: ShieldFamily
}

// Compatibility contract: new directional sheets never need horizontal mirroring.
export const WEAPON_ANCHORS: Record<Facing, DirectionalAnchor> = {
  down: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  left: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  right: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  up: { x: 0, y: -20, front: false, flipX: false, angle: 0 },
}

export const OUTFIT_ANCHORS: Record<Facing, DirectionalAnchor> = {
  down: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  left: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  right: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
  up: { x: 0, y: -20, front: true, flipX: false, angle: 0 },
}

export const TRINKET_ANCHORS: Record<Facing, DirectionalAnchor> = {
  down: { x: -15, y: -23, front: true, flipX: false, angle: 0 },
  left: { x: 12, y: -23, front: true, flipX: false, angle: -8 },
  right: { x: -12, y: -23, front: true, flipX: true, angle: 8 },
  up: { x: 15, y: -22, front: false, flipX: false, angle: 0 },
}

const OUTFIT_BY_TYPE: Record<string, OutfitFamily> = {
  robe: 'robe', mage_robe: 'robe', cloak: 'robe',
  leather: 'leather', hide: 'leather',
  chain: 'chain', scale: 'chain',
  plate: 'plate', fullplate: 'plate',
  dragon: 'dragon',
}

const WEAPON_BY_TYPE: Record<string, WeaponFamily> = {
  sword: 'sword', longsword: 'sword', greatsword: 'greatsword',
  dagger: 'dagger', kris: 'dagger', rapier: 'rapier',
  axe: 'axe', battleaxe: 'axe', mace: 'mace', warhammer: 'mace',
  spear: 'spear', halberd: 'spear', bow: 'bow', longbow: 'bow', crossbow: 'crossbow',
  staff: 'staff', wand: 'wand', scythe: 'scythe',
}

const SHIELD_BY_WEAPON: Partial<Record<string, ShieldFamily>> = {
  dagger: 'round', kris: 'round', rapier: 'round',
  sword: 'kite', longsword: 'kite', axe: 'kite', mace: 'kite',
  wand: 'arcane',
}

export const OUTFIT_FRAME_WIDTH = 64
export const OUTFIT_FRAME_HEIGHT = 96
export const OUTFIT_FRAME_COLUMNS = 3
export const OUTFIT_FRAME_ROWS = 4
const FACING_ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 }

export function outfitFramePhase(heroFrameName: string | number | undefined): 0 | 1 | 2 {
  const match = String(heroFrameName ?? '').match(/_([012])$/)
  return match ? Number(match[1]) as 0 | 1 | 2 : 0
}

export function outfitFrameIndex(facing: Facing, heroFrameName?: string | number): number {
  return FACING_ROW[facing] * OUTFIT_FRAME_COLUMNS + outfitFramePhase(heroFrameName)
}

export function outfitFamilyForType(type: string): OutfitFamily {
  return OUTFIT_BY_TYPE[type] ?? 'leather'
}

export function weaponFamilyForType(type: string): WeaponFamily {
  return WEAPON_BY_TYPE[type] ?? 'sword'
}

export function shieldFamilyForWeaponType(type: string): ShieldFamily | undefined {
  return SHIELD_BY_WEAPON[type]
}

export function accessoryAnimationPath(kind: 'head' | 'shield' | 'weapon', family: string): string {
  return `paperdoll/accessories/${kind}-${family}-sheet.png`
}

export function visualForItem(item: EquipmentItem): EquipmentVisual {
  const auraColor = rarityColor(item.rarity)
  if (item.slot === 'weapon') {
    const weaponFamily = weaponFamilyForType(item.type)
    const shieldFamily = shieldFamilyForWeaponType(item.type)
    return {
      itemId: item.id,
      slot: item.slot,
      mode: 'animated-weapon',
      iconPath: `item-icons/${item.icon}.png`,
      animationPath: accessoryAnimationPath('weapon', weaponFamily),
      offhandAnimationPath: shieldFamily ? accessoryAnimationPath('shield', shieldFamily) : undefined,
      auraColor,
      anchors: WEAPON_ANCHORS,
      weaponFamily,
      shieldFamily,
    }
  }
  if (item.slot === 'armor') {
    const outfitFamily = outfitFamilyForType(item.type)
    return {
      itemId: item.id,
      slot: item.slot,
      mode: 'outfit',
      iconPath: `paperdoll/outfit-${outfitFamily}.png`,
      animationPath: `paperdoll/animated/outfit-${outfitFamily}-sheet.png`,
      headAnimationPath: accessoryAnimationPath('head', outfitFamily),
      auraColor,
      anchors: OUTFIT_ANCHORS,
      outfitFamily,
    }
  }
  return { itemId: item.id, slot: item.slot, mode: 'charm', iconPath: `item-icons/${item.icon}.png`, auraColor, anchors: TRINKET_ANCHORS }
}

const VISUAL_BY_ID = new Map(ALL_EQUIPMENT.map((item) => [item.id, visualForItem(item)]))
export function getEquipmentVisual(itemId: string): EquipmentVisual | undefined { return VISUAL_BY_ID.get(itemId) }

export function validateEquipmentVisuals(): string[] {
  const problems: string[] = []
  const facings: Facing[] = ['down', 'left', 'right', 'up']
  for (const item of ALL_EQUIPMENT) {
    const visual = getEquipmentVisual(item.id)
    if (!visual) { problems.push(`${item.id}: no visual mapping`); continue }
    if (!visual.iconPath) problems.push(`${item.id}: ${visual.mode} without iconPath`)
    if (!visual.anchors) problems.push(`${item.id}: ${visual.mode} without anchors`)
    else for (const facing of facings) if (!visual.anchors[facing]) problems.push(`${item.id}: missing anchor ${facing}`)
    if (item.slot === 'weapon' && (!visual.weaponFamily || !visual.animationPath)) problems.push(`${item.id}: animated weapon incomplete`)
    if (item.slot === 'armor' && (!visual.outfitFamily || !visual.headAnimationPath)) problems.push(`${item.id}: outfit/head family incomplete`)
  }
  return problems
}
