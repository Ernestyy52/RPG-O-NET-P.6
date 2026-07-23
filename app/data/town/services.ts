import type { StudyCategory } from '../study'

/** Services are capabilities owned by a physical NPC, never by the global HUD. */
export type NpcServiceId =
  | 'guild-quests'
  | 'regional-hunts'
  | 'daily-activities'
  | 'item-shop'
  | 'equipment-shop'
  | 'craft'
  | 'hospital'
  | 'academy'
  | 'portal'
  | 'storage'
  | 'wardrobe'
  | 'inn'
  | 'lore'

export interface NpcInteractionPayload {
  npcId: string
  service?: NpcServiceId
  academyCategory?: StudyCategory
}

