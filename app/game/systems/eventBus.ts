import mitt from 'mitt'
import type { SfxKey } from './bgm'
import type { DailyRiftModifier } from '../../data/activities'
import type { AdventureRegionId } from '../../data/adventureRegions'
import type { NpcInteractionPayload } from '../../data/town/services'

export interface EncounterInfo {
  floor: number
  isBoss?: boolean
  name?: string
  sprite?: string          // relative path (ไม่มี / นำหน้า) — modal จะเติม baseURL เอง
  hp?: number
  atk?: number
  speed?: number
  expReward?: number
  goldReward?: number
  monsterId?: string
  elite?: boolean
  rare?: boolean
  riftModifiers?: DailyRiftModifier[]
  worldMode?: 'adventure' | 'ranked-tower'
  element?: string
  weakness?: string
  passive?: string
  habitat?: string
  intents?: string[]
  signatureDrop?: string
}

/** P0.3 — ผลการต่อสู้ที่ชัดเจน: หนีสำเร็จไม่ใช่ความพ่ายแพ้ และหนีพลาดไม่ใช่ชัยชนะ */
export type BattleOutcome = 'victory' | 'defeat' | 'escaped' | 'escape-failed'

// ---- Minimap contract (Phase 2 architecture) ---------------------------------------------------
// ทุกพิกัดเป็น "world px" ของฉากนั้น — ฉากไหนๆ (tile grid, กล่องชนจากภาพ mockup) ก็ publish ได้
// เปลี่ยนแมพครั้งใหญ่ = เปลี่ยนข้อมูลที่ publish, ตัว minimap ไม่ต้องแก้
export type MinimapMarkerKind = 'door' | 'exit' | 'portal' | 'dungeon' | 'boss' | 'chest' | 'npc' | 'service'
export interface MinimapLayout {
  worldW: number
  worldH: number
  /** สิ่งกีดขวาง/กำแพง เป็นสี่เหลี่ยม world-px */
  blocks: { x: number; y: number; w: number; h: number }[]
  markers: { kind: MinimapMarkerKind; x: number; y: number }[]
}
export interface MinimapTick {
  player: { x: number; y: number }
  monsters?: { x: number; y: number }[]
  /** เพื่อนร่วมห้อง (net) */
  others?: { x: number; y: number }[]
}

export type WorldTravelPayload = {
  mode: 'adventure' | 'town' | 'dungeon' | 'boss' | 'ranked-tower'
  floor: number
  regionId?: AdventureRegionId
  zoneId?: string
  fromZoneId?: string
  layoutId?: 'world01-mini' | 'world01-main'
  returnZoneId?: string
}

type Events = {
  'battle:start': EncounterInfo
  // `won` คงไว้เพื่อ compatibility (= outcome === 'victory') — ผู้บริโภคใหม่ให้อ่าน outcome
  'battle:end': { outcome: BattleOutcome; won: boolean; isBoss?: boolean; monsterId?: string; elite?: boolean; rare?: boolean; expReward?: number }
  'battle:abort': { reason: 'rift-expired' }
  'npc:interact': NpcInteractionPayload
  'floor:advance': { floor: number }
  'world:travel': WorldTravelPayload
  /** Phaser scenes request travel; Vue/store validates and persists it before rendering the next zone. */
  'world:travel-request': WorldTravelPayload
  'world:region-complete': { regionId: AdventureRegionId }
  'tower:ranked-clear': { floor: number; won: boolean }
  'town:hospital': void
  'town:item-shop': void
  'town:equipment-shop': void
  'town:guild': void
  'town:portal': { floor: number }
  'town:enter-dungeon': { floor: number }
  // Phase 14 Inc 4: World-1 dungeon lifecycle → bridged to the main-quest reducer in index.vue
  'dungeon:enter': { layoutId: 'world01-mini' | 'world01-main' }
  'dungeon:clear': { layoutId: 'world01-mini' | 'world01-main' }
  'daily:rift-enter': { floor: number; date: string; seed: number; layoutId: 'world01-mini' | 'world01-main' }
  'daily:rift-clear': { date: string }
  'secret:found': { id: string }
  'boss:gate': { floor: number }        // เดินชนประตูห้องบอส → เปิดกล่องแสดงเงื่อนไข
  'boss:enter': void                     // เงื่อนไขครบ + กดเข้า → โหลดห้องบอสเดี่ยว
  'notice': { text: string }
  'audio:sfx': { key: SfxKey; rate?: number }
  // Phase 14 Inc 3: real-time boss 3-phase telegraph — RealtimeBattle (combat source of truth)
  // emits these; BossScene renders them on the live boss sprite/arena (one of 3 readable channels).
  'boss:phase-change': { phase: 1 | 2 | 3; tint: number; name: string; nameTh: string }
  'boss:telegraph': { phase: 1 | 2 | 3; pattern: 'single' | 'double' | 'aoe-slam'; telegraphMs: number; tint: number }
  // Minimap: ฉาก publish layout ตอน create, tick ตำแหน่งแบบ throttle, clear ตอน shutdown
  'minimap:layout': MinimapLayout
  'minimap:tick': MinimapTick
  'minimap:clear': void
}

export const gameEvents = mitt<Events>()
