// ================================================================================================
// Town NPCs (Phase 14 Inc 4)
//
// The named quest-givers that stand in the town, using the Craftpix guild-hall character sheets
// (curated into public/npc-sprites/). Ids match the `giver`/`npc` fields on the World-1 quests so the
// person you see is the person who sends you. Positions are ART-space coords (same space as TownScene's
// SLICES/ZONES). Each sheet has its OWN frame size (verified from the source art) — the scene slices on
// frameW/frameH and shows frame 0 (a clean facing-down idle) with a gentle bob, scaled to hero height.
// Sprite paths are relative (no leading `/`) — always loaded via assetPath()/app.baseURL.
// ================================================================================================

export interface TownNpc {
  id: string
  name: string
  title: string
  /** relative path under public/ (no leading slash — assetPath() adds the base URL). */
  sprite: string
  frameW: number
  frameH: number
  /** ART-space position in the town (matches TownScene coordinate system). */
  at: [number, number]
}

export const TOWN_NPCS: TownNpc[] = [
  // Guildmaster.png (288×32, 9×1) — dedicated guildmaster sprite
  { id: 'guildmaster', name: 'Mara', title: 'Guildmaster', sprite: 'npc-sprites/guildmaster.png', frameW: 32, frameH: 32, at: [1150, 250] },
  // Mage1.png (448×208, 14×4 @ 32×52) — a robed mage guarding the portal (taller frame for the hat)
  { id: 'portal_guardian', name: 'Kael', title: 'Portal Guardian', sprite: 'npc-sprites/portal_guardian.png', frameW: 32, frameH: 52, at: [737, 250] },
  // Citizen2_Idle.png (384×128, 12×4 @ 32×32)
  { id: 'blacksmith', name: 'Borin', title: 'Blacksmith', sprite: 'npc-sprites/blacksmith.png', frameW: 32, frameH: 32, at: [1255, 505] },
  // Fighter2_Idle.png (384×128, 12×4 @ 32×32)
  { id: 'forest_ranger', name: 'Wren', title: 'Forest Ranger', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [470, 560] },
]

const NPC_BY_ID = new Map(TOWN_NPCS.map((n) => [n.id, n]))
export function getTownNpc(id: string): TownNpc | undefined { return NPC_BY_ID.get(id) }
