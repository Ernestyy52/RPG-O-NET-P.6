// ================================================================================================
// Town building interiors (S-grade gameplay pass)
//
// Every service building opens into its own walkable interior room; the named NPCs move INSIDE
// (Kael stays at the portal — that is his post) and the player interacts with them to use the
// service + hear a line of dialogue. Rooms are data here (testable: sprite paths exist, positions
// in-bounds, door kept clear) and rendered by InteriorScene from curated Craftpix interior assets
// (public/interior-props/, public/guildhall-props/). The bed has no source asset — InteriorScene
// generates a small pixel-art bed texture ('interior_bed') by design.
//
// Flag-gated (rule 6): TOWN_INTERIORS_ENABLED=false ⇒ building doors emit their service events
// directly, exactly as before, and all NPCs stand outside — the legacy town is byte-identical.
// ================================================================================================

export const TOWN_INTERIORS_ENABLED = true

export type InteriorId = 'guild' | 'item-shop' | 'equipment-shop' | 'hospital'
export type TownServiceEvent = 'town:guild' | 'town:item-shop' | 'town:equipment-shop' | 'town:hospital'

export interface InteriorProp {
  /** texture key; loaded from `sprite` unless the scene generates it (e.g. 'interior_bed'). */
  key: string
  /** relative path under public/ (no leading slash — assetPath() adds baseURL). absent = generated. */
  sprite?: string
  /** tile coords (center) in the room grid. */
  at: [number, number]
  /** solid props get a foot-box collider; decor props are walk-behind only. */
  solid?: boolean
  scale?: number
}

export interface InteriorSpec {
  id: InteriorId
  event: TownServiceEvent
  nameEn: string
  nameTh: string
  /** room size in 32-px tiles (w × h). Door/exit is always bottom-center. */
  tiles: { w: number; h: number }
  /** subtle floor tint so each building has its own mood. */
  floorTint: number
  npc: {
    /** id in TOWN_NPCS (sprite/frame data lives there). */
    id: string
    at: [number, number]
    /** rotating dialogue lines shown on interact (service opens alongside). */
    dialogueTh: string[]
  }
  props: InteriorProp[]
}

// room is 14×10 tiles; rows 0–1 are the wall band (blocked), floor starts at y=2; door at x=7,y=9.
export const TOWN_INTERIORS: InteriorSpec[] = [
  {
    id: 'guild',
    event: 'town:guild',
    nameEn: 'Adventurers Guild',
    nameTh: 'กิลด์นักผจญภัย',
    tiles: { w: 14, h: 10 },
    floorTint: 0xffedc8,
    npc: {
      id: 'guildmaster',
      at: [7, 3.6],
      dialogueTh: [
        'ยินดีต้อนรับสู่กิลด์! ภารกิจประจำวันรออยู่บนบอร์ดนะ',
        'ตอบคำถามให้แม่น แล้วชื่อเสียงของเจ้าจะไปไกล',
        'นักผจญภัยที่เก่งที่สุด คือคนที่ไม่หยุดเรียนรู้',
      ],
    },
    props: [
      { key: 'questboard', sprite: 'guildhall-props/questboard.png', at: [2.4, 2.1], solid: true },
      { key: 'bookshelf', sprite: 'guildhall-props/bookshelf.png', at: [5, 1.9], solid: true },
      { key: 'bookshelf', sprite: 'guildhall-props/bookshelf.png', at: [9, 1.9], solid: true },
      { key: 'staircase', sprite: 'guildhall-props/staircase.png', at: [12, 2.2], solid: true },
      { key: 'guild_banner', sprite: 'interior-props/guild_banner.png', at: [6, 1.2], scale: 1.4 },
      { key: 'guild_banner', sprite: 'interior-props/guild_banner.png', at: [8, 1.2], scale: 1.4 },
      { key: 'guild_plant', sprite: 'interior-props/guild_plant.png', at: [1.6, 8.2], solid: true, scale: 1.6 },
      { key: 'guild_plant', sprite: 'interior-props/guild_plant.png', at: [12.4, 8.2], solid: true, scale: 1.6 },
      { key: 'guild_chest', sprite: 'interior-props/guild_chest.png', at: [12.2, 4.6], solid: true, scale: 1.5 },
    ],
  },
  {
    id: 'item-shop',
    event: 'town:item-shop',
    nameEn: 'Item Shop',
    nameTh: 'ร้านขายของ',
    tiles: { w: 14, h: 10 },
    floorTint: 0xd8f0d0,
    npc: {
      id: 'forest_ranger',
      at: [7, 3.2],
      dialogueTh: [
        'ยาแดงสดใหม่จากป่าเวอร์แดนท์ เพิ่งเก็บมาเมื่อเช้า!',
        'ก่อนลงดันเจี้ยนลึกๆ พกยาไว้เยอะหน่อยนะ',
        'ของดีราคาย่อมเยา มีแค่ที่นี่ที่เดียว',
      ],
    },
    props: [
      { key: 'shop_stall', sprite: 'interior-props/shop_stall.png', at: [7, 4.4], solid: true },
      { key: 'shelf_jars', sprite: 'interior-props/shelf-jars.png', at: [3, 2.1], solid: true },
      { key: 'shelf_jars', sprite: 'interior-props/shelf-jars.png', at: [11, 2.1], solid: true },
      { key: 'shop_crate', sprite: 'interior-props/shop_crate.png', at: [1.9, 5.4], solid: true },
      { key: 'shop_barrel', sprite: 'interior-props/shop_barrel.png', at: [12.1, 5.4], solid: true },
      { key: 'shop_barrel', sprite: 'interior-props/shop_barrel.png', at: [12.1, 7], solid: true },
      { key: 'guild_plant', sprite: 'interior-props/guild_plant.png', at: [1.6, 8.2], solid: true, scale: 1.6 },
    ],
  },
  {
    id: 'equipment-shop',
    event: 'town:equipment-shop',
    nameEn: 'Blacksmith & Armory',
    nameTh: 'โรงตีเหล็ก',
    tiles: { w: 14, h: 10 },
    floorTint: 0xe8d0c0,
    npc: {
      id: 'blacksmith',
      at: [7, 3.2],
      dialogueTh: [
        'เหล็กดีต้องตีตอนร้อน — ความรู้ก็เช่นกัน!',
        'อยากได้ของแกร่ง เอาซิกิลมาฝังที่นี่ได้เลย',
        'ดาบคมช่วยเจ้าได้ครึ่งทาง อีกครึ่งคือสมองของเจ้า',
      ],
    },
    props: [
      { key: 'shop_stall', sprite: 'interior-props/shop_stall.png', at: [7, 4.4], solid: true },
      { key: 'wardrobe', sprite: 'interior-props/wardrobe.png', at: [2.2, 2.4], solid: true },
      { key: 'wardrobe', sprite: 'interior-props/wardrobe.png', at: [11.8, 2.4], solid: true },
      { key: 'shop_crate', sprite: 'interior-props/shop_crate.png', at: [1.9, 6], solid: true },
      { key: 'shop_crate', sprite: 'interior-props/shop_crate.png', at: [1.9, 7.4], solid: true },
      { key: 'shop_barrel', sprite: 'interior-props/shop_barrel.png', at: [12.1, 6.4], solid: true },
      { key: 'guild_banner', sprite: 'interior-props/guild_banner.png', at: [5, 1.2], scale: 1.4 },
      { key: 'guild_banner', sprite: 'interior-props/guild_banner.png', at: [9, 1.2], scale: 1.4 },
    ],
  },
  {
    id: 'hospital',
    event: 'town:hospital',
    nameEn: 'Healing House',
    nameTh: 'โรงพยาบาล',
    tiles: { w: 14, h: 10 },
    floorTint: 0xdce8f4,
    npc: {
      id: 'healer',
      at: [7, 3.2],
      dialogueTh: [
        'มานั่งพักก่อนสิ เดี๋ยวรักษาให้ — ไม่คิดเงินหรอก',
        'พักผ่อนให้พอ สมองจะจำศัพท์ได้ดีขึ้นนะ',
        'บาดแผลหายได้ แต่อย่าลืมดูแลใจตัวเองด้วย',
      ],
    },
    props: [
      { key: 'interior_bed', at: [2.4, 3], solid: true },
      { key: 'interior_bed', at: [2.4, 5.6], solid: true },
      { key: 'interior_bed', at: [11.6, 3], solid: true },
      { key: 'interior_bed', at: [11.6, 5.6], solid: true },
      { key: 'shelf_jars', sprite: 'interior-props/shelf-jars.png', at: [5, 2.1], solid: true },
      { key: 'wardrobe', sprite: 'interior-props/wardrobe.png', at: [9.4, 2.3], solid: true },
      { key: 'guild_plant', sprite: 'interior-props/guild_plant.png', at: [1.6, 8.2], solid: true, scale: 1.6 },
      { key: 'guild_plant', sprite: 'interior-props/guild_plant.png', at: [12.4, 8.2], solid: true, scale: 1.6 },
    ],
  },
]

const BY_EVENT = new Map(TOWN_INTERIORS.map((s) => [s.event, s]))
const BY_ID = new Map(TOWN_INTERIORS.map((s) => [s.id, s]))

export function interiorForEvent(event: string): InteriorSpec | undefined {
  return BY_EVENT.get(event as TownServiceEvent)
}
export function getInterior(id: string): InteriorSpec | undefined {
  return BY_ID.get(id as InteriorId)
}

/** NPC ids that moved indoors — TownScene skips them outside while the flag is on. */
export const INTERIOR_NPC_IDS = new Set(TOWN_INTERIORS.map((s) => s.npc.id))

/** ART-space door coords in town per interior (from TownScene ZONES) — where you re-appear on exit. */
export const INTERIOR_TOWN_DOORS: Record<InteriorId, [number, number]> = {
  'hospital': [300, 230],
  'item-shop': [300, 510],
  'guild': [1105, 240],
  'equipment-shop': [1185, 512],
}
