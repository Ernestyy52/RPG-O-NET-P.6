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

// Positions are ART-space coords in the Aethergate town image (1536×1024). Only Kael renders
// outside while TOWN_INTERIORS_ENABLED is true (he guards the portal); the rest stand in front of
// their building for the legacy flag-off town. Values kept building-adjacent after the map rebuild.
export const TOWN_NPCS: TownNpc[] = [
  // Citizen1_Idle.png (384×128, 12 cols × 4 rows @ 32×32) — full-body idle
  { id: 'guildmaster', name: 'Mara', title: 'Guildmaster', sprite: 'npc-sprites/guildmaster.png', frameW: 32, frameH: 32, at: [185, 322] },
  // Mage1.png (448×208, content on a 48px pitch @ 48×52) — full-body robed mage (taller frame for the hat)
  { id: 'portal_guardian', name: 'Kael', title: 'Portal Guardian', sprite: 'npc-sprites/portal_guardian.png', frameW: 48, frameH: 52, at: [688, 330] },
  // Citizen2_Idle.png (384×128, 12 cols × 4 rows @ 32×32)
  { id: 'blacksmith', name: 'Borin', title: 'Blacksmith', sprite: 'npc-sprites/blacksmith.png', frameW: 32, frameH: 32, at: [360, 500] },
  // Fighter2_Idle.png (384×128, 12 cols × 4 rows @ 32×32)
  { id: 'forest_ranger', name: 'Wren', title: 'Forest Ranger', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [1118, 650] },
  // Mage2_without_shadow.png (448×208, 48px pitch @ 48×52 — same sheet family as Kael) — white-robed
  // healer for the hospital interior; stands outside the hospital when TOWN_INTERIORS is off.
  { id: 'healer', name: 'Sena', title: 'Healer', sprite: 'npc-sprites/healer.png', frameW: 48, frameH: 52, at: [1268, 352] },
  // Guild 1F service desks. Reusing verified sheets keeps every NPC animated and subpath-safe.
  { id: 'hunt_warden', name: 'Rook', title: 'Hunt Warden', sprite: 'npc-sprites/blacksmith.png', frameW: 32, frameH: 32, at: [210, 322] },
  { id: 'rift_officer', name: 'Lyra', title: 'Rift Officer', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [230, 322] },
  { id: 'forge_apprentice', name: 'Toma', title: 'Forge Apprentice', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [380, 500] },
  // Guild Academy 2F tutors — one physical mentor per knowledge/ domain.
  { id: 'tutor_grammar', name: 'Elara', title: 'Grammar Sage', sprite: 'npc-sprites/healer.png', frameW: 48, frameH: 52, at: [0, 0] },
  { id: 'tutor_reading', name: 'Nox', title: 'Reading Keeper', sprite: 'npc-sprites/portal_guardian.png', frameW: 48, frameH: 52, at: [0, 0] },
  { id: 'tutor_strategy', name: 'Orion', title: 'Exam Cartographer', sprite: 'npc-sprites/guildmaster.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'tutor_conversation', name: 'Celine', title: 'Dialogue Mentor', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'tutor_vocabulary', name: 'Vireo', title: 'Word Keeper', sprite: 'npc-sprites/blacksmith.png', frameW: 32, frameH: 32, at: [0, 0] },
  // Civic interior keepers. These provide presence and own future town services.
  { id: 'librarian', name: 'Mira', title: 'Librarian', sprite: 'npc-sprites/healer.png', frameW: 48, frameH: 52, at: [0, 0] },
  { id: 'registrar', name: 'Alden', title: 'Town Registrar', sprite: 'npc-sprites/guildmaster.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'oracle', name: 'Selene', title: 'Crystal Oracle', sprite: 'npc-sprites/portal_guardian.png', frameW: 48, frameH: 52, at: [0, 0] },
  { id: 'festival_host', name: 'Pip', title: 'Festival Host', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'tailor', name: 'Vela', title: 'Royal Tailor', sprite: 'npc-sprites/healer.png', frameW: 48, frameH: 52, at: [0, 0] },
  { id: 'innkeeper', name: 'Bram', title: 'Innkeeper', sprite: 'npc-sprites/blacksmith.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'stablemaster', name: 'Nell', title: 'Stablemaster', sprite: 'npc-sprites/forest_ranger.png', frameW: 32, frameH: 32, at: [0, 0] },
  { id: 'banker', name: 'Oren', title: 'Vault Keeper', sprite: 'npc-sprites/guildmaster.png', frameW: 32, frameH: 32, at: [0, 0] },
]

const NPC_BY_ID = new Map(TOWN_NPCS.map((n) => [n.id, n]))
export function getTownNpc(id: string): TownNpc | undefined { return NPC_BY_ID.get(id) }
