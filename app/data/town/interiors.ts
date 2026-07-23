import type { StudyCategory } from '../study'
import type { NpcServiceId } from './services'

export const TOWN_INTERIORS_ENABLED = true

export type InteriorId =
  | 'guild' | 'guild-academy' | 'item-shop' | 'equipment-shop' | 'hospital'
  | 'library' | 'town-hall' | 'crystal-shrine' | 'festival-hall'
  | 'tailor' | 'inn' | 'stable' | 'bank' | 'gatehouse'

export type TownInteriorEvent =
  | 'town:guild' | 'town:item-shop' | 'town:equipment-shop' | 'town:hospital'
  | 'town:library' | 'town:town-hall' | 'town:crystal-shrine' | 'town:festival-hall'
  | 'town:tailor' | 'town:inn' | 'town:stable' | 'town:bank' | 'town:gatehouse'
  | 'interior:guild-academy'

/** Kept as an alias for older imports. */
export type TownServiceEvent = TownInteriorEvent

export interface InteriorProp {
  key: string
  sprite?: string
  at: [number, number]
  solid?: boolean
  scale?: number
}

export type InteriorRect = [number, number, number, number]

export interface InteriorArtSpec {
  sprite: string
  width: number
  height: number
  spawn: [number, number]
  exit: [number, number]
  collision: InteriorRect[]
  occluders: InteriorRect[]
  lights: { at: [number, number]; color: number }[]
}

export interface InteriorNpcSpec {
  id: string
  at: [number, number]
  dialogueTh: string[]
  service?: NpcServiceId
  academyCategory?: StudyCategory
}

export interface InteriorTransition {
  at: [number, number]
  target: InteriorId
  spawnAt: [number, number]
  labelTh: string
  size?: [number, number]
}

export interface InteriorSpec {
  id: InteriorId
  event: TownInteriorEvent
  nameEn: string
  nameTh: string
  tiles: { w: number; h: number }
  floorTint: number
  art: InteriorArtSpec
  npc: InteriorNpcSpec
  npcs?: InteriorNpcSpec[]
  transitions?: InteriorTransition[]
  /** Academy 2F exits to Guild 1F; every other room exits to the town door. */
  exitTarget?: { building: InteriorId; spawnAt: [number, number] }
  props: InteriorProp[]
}

const civicCollision: InteriorRect[] = [
  [0, 0, 512, 42], [0, 0, 18, 512], [494, 0, 18, 512],
  [0, 486, 218, 26], [294, 486, 218, 26],
  [34, 94, 92, 164], [386, 94, 92, 164],
  [42, 348, 104, 70], [366, 348, 104, 70],
]

function civicArt(sprite: string, tint = 0xffbd68): InteriorArtSpec {
  return {
    sprite: `interior-maps/${sprite}.webp`, width: 512, height: 512,
    spawn: [256, 450], exit: [256, 497], collision: civicCollision, occluders: [],
    lights: [{ at: [96, 382], color: tint }, { at: [416, 382], color: tint }],
  }
}

function civic(
  id: InteriorId,
  event: TownInteriorEvent,
  sprite: string,
  nameEn: string,
  nameTh: string,
  npc: InteriorNpcSpec,
  tint: number,
): InteriorSpec {
  return { id, event, nameEn, nameTh, tiles: { w: 16, h: 16 }, floorTint: tint, art: civicArt(sprite, tint), npc, props: [] }
}

export const TOWN_INTERIORS: InteriorSpec[] = [
  {
    id: 'guild', event: 'town:guild', nameEn: 'Adventurers Guild · 1F', nameTh: 'กิลด์นักผจญภัย · ชั้น 1',
    tiles: { w: 16, h: 15 }, floorTint: 0xffedc8,
    art: {
      sprite: 'interior-maps/guild.png', width: 494, height: 470, spawn: [247, 430], exit: [247, 462],
      collision: [
        [0, 0, 494, 56], [0, 0, 18, 470], [476, 0, 18, 470], [0, 448, 218, 22], [278, 448, 216, 22],
        [26, 125, 164, 54], [210, 145, 115, 48], [338, 166, 134, 42], [353, 252, 92, 38],
        [25, 365, 155, 54], [225, 344, 100, 48], [355, 365, 115, 52],
      ],
      occluders: [[20, 52, 176, 130], [202, 70, 132, 132], [330, 92, 150, 202], [18, 248, 180, 178], [205, 292, 134, 112], [338, 286, 146, 140]],
      lights: [{ at: [182, 87], color: 0xffbd68 }, { at: [352, 87], color: 0xffbd68 }, { at: [49, 449], color: 0xffa84e }, { at: [444, 449], color: 0xffa84e }],
    },
    npc: { id: 'guildmaster', at: [7.8, 4.5], service: 'guild-quests', dialogueTh: ['ยินดีต้อนรับสู่กิลด์ งานและรางวัลต้องรับกับข้าที่นี่', 'ชั้นสองคือสถาบัน O-NET จงเตรียมความรู้ก่อนออกล่า'] },
    npcs: [
      { id: 'hunt_warden', at: [4.1, 9.8], service: 'regional-hunts', dialogueTh: ['เลือกสัญญาล่าที่โต๊ะนี้ แล้วกลับมารับรางวัลกับข้า', 'เป้าหมายหายากให้ชื่อเสียงและโอกาสได้ชุดประจำมอนสเตอร์'] },
      { id: 'rift_officer', at: [11.8, 9.8], service: 'daily-activities', dialogueTh: ['Elite Hunt, Rare Spawn และ Daily Rift รับได้ที่ข้า', 'ภารกิจสั้นเปลี่ยนทุกวัน เล่นพอดีแล้วค่อยออกผจญภัย'] },
    ],
    transitions: [{ at: [420, 322], target: 'guild-academy', spawnAt: [627, 1080], labelTh: 'ขึ้นสู่ Guild Academy 2F', size: [48, 34] }],
    props: [
      { key: 'questboard', sprite: 'guildhall-props/questboard.png', at: [2.4, 2.1], solid: true },
      { key: 'bookshelf', sprite: 'guildhall-props/bookshelf.png', at: [5, 1.9], solid: true },
      { key: 'staircase', sprite: 'guildhall-props/staircase.png', at: [12, 2.2], solid: true },
    ],
  },
  {
    id: 'guild-academy', event: 'interior:guild-academy', nameEn: 'Guild Academy · 2F', nameTh: 'สถาบันเตรียมสอบกิลด์ · ชั้น 2',
    tiles: { w: 39.2, h: 39.2 }, floorTint: 0xd7b36a,
    art: {
      sprite: 'interior-maps/guild-academy-2f.webp', width: 1254, height: 1254, spawn: [627, 1080], exit: [627, 1184],
      collision: [
        [0, 0, 1254, 24], [0, 0, 22, 1254], [1232, 0, 22, 1254], [0, 1218, 540, 36], [714, 1218, 540, 36],
        [64, 175, 325, 70], [84, 268, 300, 210], [492, 225, 270, 165], [870, 174, 315, 78], [902, 280, 270, 198],
        [74, 620, 325, 92], [82, 744, 315, 210], [866, 624, 326, 92], [878, 748, 304, 212],
        [22, 1000, 500, 28], [732, 1000, 500, 28],
      ],
      occluders: [],
      lights: [{ at: [450, 370], color: 0xffb85c }, { at: [804, 370], color: 0xffb85c }, { at: [510, 955], color: 0xffcf75 }, { at: [744, 955], color: 0xffcf75 }],
    },
    npc: { id: 'tutor_grammar', at: [6.6, 5.0], service: 'academy', academyCategory: 'grammar', dialogueTh: ['ห้องไวยากรณ์รูนสอน Wh-questions, tense และ modal verbs ที่ออกสอบบ่อย', 'เลือกบทที่ยังไม่มั่นใจ แล้วเรียนให้จบกับข้า'] },
    npcs: [
      { id: 'tutor_reading', at: [19.6, 5.0], service: 'academy', academyCategory: 'reading', dialogueTh: ['อ่านคำถามก่อน แล้วค่อยสแกนหาใจความและหลักฐานในเรื่อง', 'ห้องนี้ฝึก main idea, detail, inference และ NOT mentioned'] },
      { id: 'tutor_strategy', at: [32.5, 5.0], service: 'academy', academyCategory: 'strategy', dialogueTh: ['แผนที่ ตาราง กราฟ และโจทย์หลายเงื่อนไขต้องแก้ทีละขั้น', 'ข้าจะสอนวิธีตัดตัวลวงจากแพตเทิร์นข้อสอบ 11 ปี'] },
      { id: 'tutor_conversation', at: [6.7, 18.8], service: 'academy', academyCategory: 'conversation', dialogueTh: ['คำตอบที่ถูกต้องต้องตรงทั้งความหมาย อารมณ์ และมารยาท', 'มาฝึกบทสนทนาและ reverse question กับข้า'] },
      { id: 'tutor_vocabulary', at: [32.4, 18.8], service: 'academy', academyCategory: 'vocabulary', dialogueTh: ['คลังคำนี้ครอบคลุมป้าย สภาพอากาศ โรงเรียน อาหาร และสิ่งแวดล้อม', 'จำคำศัพท์ผ่านบริบท ไม่ใช่ท่องคำแปลเพียงอย่างเดียว'] },
    ],
    exitTarget: { building: 'guild', spawnAt: [360, 320] },
    props: [],
  },
  {
    id: 'item-shop', event: 'town:item-shop', nameEn: 'General Goods', nameTh: 'ร้านขายของทั่วไป',
    tiles: { w: 16, h: 15 }, floorTint: 0xd8f0d0,
    art: {
      sprite: 'interior-maps/item-shop.png', width: 490, height: 479, spawn: [245, 438], exit: [245, 470],
      collision: [[0, 0, 490, 50], [0, 0, 18, 479], [472, 0, 18, 479], [0, 456, 214, 23], [276, 456, 214, 23], [18, 115, 335, 65], [360, 116, 112, 66], [60, 225, 282, 68], [360, 160, 112, 260], [50, 292, 48, 70], [75, 375, 220, 55], [305, 323, 82, 54]],
      occluders: [[14, 38, 458, 148], [50, 151, 300, 147], [350, 132, 128, 296], [44, 284, 264, 158], [288, 266, 110, 120]],
      lights: [{ at: [33, 445], color: 0xffb45c }, { at: [456, 445], color: 0xffb45c }, { at: [327, 290], color: 0x8fffd2 }],
    },
    npc: { id: 'forest_ranger', at: [6.1, 6.8], service: 'item-shop', dialogueTh: ['เสบียงซื้อได้เมื่อมาคุยกับข้าที่ร้านเท่านั้น', 'ก่อนเข้าป่าลึก ตรวจยาและมานาให้พร้อม'] },
    props: [{ key: 'shop_stall', sprite: 'interior-props/shop_stall.png', at: [7, 4.4], solid: true }, { key: 'shelf_jars', sprite: 'interior-props/shelf-jars.png', at: [3, 2.1], solid: true }],
  },
  {
    id: 'equipment-shop', event: 'town:equipment-shop', nameEn: 'Blacksmith & Armory', nameTh: 'โรงตีเหล็กและคลังอาวุธ',
    tiles: { w: 16, h: 16 }, floorTint: 0xe8d0c0,
    art: {
      sprite: 'interior-maps/equipment-shop.png', width: 494, height: 504, spawn: [247, 463], exit: [247, 495],
      collision: [[0, 0, 494, 52], [0, 0, 18, 504], [476, 0, 18, 504], [0, 481, 218, 23], [278, 481, 216, 23], [18, 120, 90, 105], [120, 150, 150, 72], [282, 140, 195, 78], [18, 255, 100, 86], [143, 242, 125, 55], [292, 242, 170, 70], [20, 370, 120, 62], [155, 355, 185, 68], [390, 345, 80, 93]],
      occluders: [[14, 38, 464, 188], [14, 184, 112, 168], [125, 174, 154, 128], [280, 176, 190, 142], [14, 320, 158, 132], [130, 296, 238, 134], [356, 286, 126, 174]],
      lights: [{ at: [194, 116], color: 0xff6a32 }, { at: [336, 125], color: 0xffb05a }, { at: [47, 474], color: 0xffa04a }, { at: [447, 474], color: 0xffa04a }],
    },
    npc: { id: 'blacksmith', at: [7.7, 10.6], service: 'equipment-shop', dialogueTh: ['อาวุธและเกราะต้องเลือกให้เข้ากับสายอาชีพ', 'ของตีขึ้นรูปซื้อกับข้า ส่วนงานคราฟต์ให้คุยกับโทมา'] },
    npcs: [{ id: 'forge_apprentice', at: [4.2, 10.6], service: 'craft', dialogueTh: ['นำวัตถุดิบมาคราฟต์กับข้าได้ตรงโต๊ะนี้', 'สูตรที่ดียังต้องอาศัยของดรอปเฉพาะมอนสเตอร์'] }],
    props: [{ key: 'shop_stall', sprite: 'interior-props/shop_stall.png', at: [7, 4.4], solid: true }, { key: 'wardrobe', sprite: 'interior-props/wardrobe.png', at: [2.2, 2.4], solid: true }],
  },
  {
    id: 'hospital', event: 'town:hospital', nameEn: 'Brightleaf Hospital', nameTh: 'โรงพยาบาลไบรท์ลีฟ',
    tiles: { w: 16, h: 15 }, floorTint: 0xdce8f4,
    art: {
      sprite: 'interior-maps/hospital.png', width: 495, height: 479, spawn: [248, 438], exit: [248, 470],
      collision: [[0, 0, 495, 50], [0, 0, 18, 479], [477, 0, 18, 479], [0, 456, 216, 23], [280, 456, 215, 23], [24, 116, 120, 58], [172, 107, 130, 58], [316, 122, 160, 54], [25, 260, 80, 55], [135, 263, 170, 56], [313, 345, 165, 76], [36, 350, 105, 55], [384, 358, 70, 48]],
      occluders: [[18, 38, 460, 142], [16, 166, 96, 164], [120, 202, 198, 136], [300, 186, 182, 244], [26, 310, 120, 104], [365, 322, 104, 96]],
      lights: [{ at: [210, 88], color: 0x8fffe7 }, { at: [392, 98], color: 0xd8fff0 }, { at: [405, 350], color: 0x78cfff }],
    },
    npc: { id: 'healer', at: [7.2, 8.6], service: 'hospital', dialogueTh: ['พักก่อน เดี๋ยวข้าฟื้น HP และ MP ให้', 'การพักให้พอช่วยให้จำคำศัพท์ได้ดีขึ้น'] },
    props: [{ key: 'interior_bed', at: [2.4, 3], solid: true }, { key: 'shelf_jars', sprite: 'interior-props/shelf-jars.png', at: [5, 2.1], solid: true }],
  },
  civic('library', 'town:library', 'library', 'Aethergate Public Library', 'หอสมุดเอเธอร์เกต', { id: 'librarian', at: [8, 5], service: 'lore', dialogueTh: ['หนังสือชั้นสองของกิลด์จัดตามแพตเทิร์น O-NET 11 ปี', 'ถ้าอยากเรียนจริง ให้ไปพบอาจารย์ประจำห้องที่ Guild Academy 2F'] }, 0xffb85c),
  civic('town-hall', 'town:town-hall', 'town-hall', 'Town Hall & Chronicle', 'ศาลากลางและหอจดหมายเหตุ', { id: 'registrar', at: [8, 5], service: 'lore', dialogueTh: ['ที่นี่บันทึกตำนานและความสำเร็จของนักผจญภัย', 'World 1 จะถูกประทับตราเมื่อกำจัด Myco Colossus สำเร็จ'] }, 0xffca72),
  civic('crystal-shrine', 'town:crystal-shrine', 'crystal-shrine', 'Mooncrystal Shrine', 'วิหารจันทรผลึก', { id: 'oracle', at: [8, 5], service: 'lore', dialogueTh: ['ผลึกสะท้อนจุดอ่อนของธาตุ จงอ่านเจตนามอนสเตอร์ก่อนโจมตี', 'ความรู้ที่ถูกต้องคือเกราะป้องกันที่แข็งแกร่งที่สุด'] }, 0x9d72ff),
  civic('festival-hall', 'town:festival-hall', 'festival-hall', 'Festival Hall', 'หอเทศกาล', { id: 'festival_host', at: [8, 5], service: 'lore', dialogueTh: ['ที่นี่จะมีเทศกาลและกิจกรรมหมุนเวียนใน World ต่อไป', 'วันนี้ขึ้นเวทีพักใจ แล้วค่อยกลับไปล่าอย่างมีเป้าหมาย'] }, 0xff8f6c),
  civic('tailor', 'town:tailor', 'tailor', 'Tailor & Wardrobe', 'ร้านตัดเสื้อและตู้เครื่องแต่งกาย', { id: 'tailor', at: [8, 5], service: 'wardrobe', dialogueTh: ['เครื่องแต่งกาย paper-doll จะเปลี่ยนตามของที่เจ้าสวม', 'ชุด Set ครบชิ้นให้ทั้งรูปลักษณ์และโบนัสการต่อสู้'] }, 0xd181c7),
  civic('inn', 'town:inn', 'inn', 'Hearthsong Inn', 'โรงเตี๊ยมเฮิร์ธซอง', { id: 'innkeeper', at: [8, 5], service: 'inn', dialogueTh: ['นั่งพักให้เต็มแรงได้ที่นี่โดยไม่เสียเงิน', 'คุยกับผู้คนบ้าง โลกจะไม่น่าเบื่อเมื่อไม่ได้มีแต่การล่า'] }, 0xffa858),
  civic('stable', 'town:stable', 'stable', 'Companion Lodge', 'บ้านพักคู่หูและคอกสัตว์', { id: 'stablemaster', at: [8, 5], service: 'lore', dialogueTh: ['พื้นที่นี้เตรียมไว้สำหรับระบบคู่หูใน World ถัดไป', 'สัตว์คู่หูที่ดีช่วยสำรวจ แต่ไม่ควรทำการบ้านแทนเจ้า'] }, 0xd4a45c),
  civic('bank', 'town:bank', 'bank', 'Aether Vault', 'ธนาคารและคลังเก็บของ', { id: 'banker', at: [8, 5], service: 'storage', dialogueTh: ['คลังกลางกำลังจัดทำระบบเก็บของข้ามตัวละคร', 'ตอนนี้สัมภาระของเจ้ายังปลอดภัยในกระเป๋าส่วนตัว'] }, 0x6f9cff),
  civic('gatehouse', 'town:gatehouse', 'gatehouse', 'Tower Gatehouse', 'หอประตูสู่การผจญภัย', { id: 'portal_guardian', at: [8, 5], service: 'portal', dialogueTh: ['ประตูนี้พาไปสำรวจ World หรือเข้าหอคอยจัดอันดับ', 'คุยกับข้าเมื่อพร้อม—ประตูจะไม่เปิดเองจากเมนู'] }, 0x8f74ff),
]

const BY_EVENT = new Map(TOWN_INTERIORS.map((spec) => [spec.event, spec]))
const BY_ID = new Map(TOWN_INTERIORS.map((spec) => [spec.id, spec]))

export function interiorForEvent(event: string): InteriorSpec | undefined {
  return BY_EVENT.get(event as TownInteriorEvent)
}

export function getInterior(id: string): InteriorSpec | undefined {
  return BY_ID.get(id as InteriorId)
}

export function allInteriorNpcs(spec: InteriorSpec): InteriorNpcSpec[] {
  return [spec.npc, ...(spec.npcs ?? [])]
}

export const INTERIOR_NPC_IDS = new Set(TOWN_INTERIORS.flatMap(allInteriorNpcs).map((npc) => npc.id))

/** Return positions are deliberately below the 24px door trigger, preventing instant re-entry. */
export const INTERIOR_TOWN_DOORS: Partial<Record<InteriorId, [number, number]>> = {
  guild: [240, 330], hospital: [1330, 352], 'item-shop': [1185, 660], 'equipment-shop': [418, 512],
  library: [548, 310], 'town-hall': [980, 328], 'crystal-shrine': [240, 600], 'festival-hall': [892, 500],
  tailor: [1025, 850], inn: [165, 834], stable: [440, 834], bank: [1300, 812], gatehouse: [762, 332],
}

