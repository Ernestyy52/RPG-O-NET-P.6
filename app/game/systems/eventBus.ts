import mitt from 'mitt'

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
}

type Events = {
  'battle:start': EncounterInfo
  'battle:end': { won: boolean; isBoss?: boolean }
  'floor:advance': { floor: number }
  'town:hospital': void
  'town:item-shop': void
  'town:equipment-shop': void
  'town:guild': void
  'town:portal': { floor: number }
  'town:enter-dungeon': { floor: number }
  // Phase 14 Inc 4: World-1 dungeon lifecycle → bridged to the main-quest reducer in index.vue
  'dungeon:enter': { layoutId: 'world01-mini' | 'world01-main' }
  'dungeon:clear': { layoutId: 'world01-mini' | 'world01-main' }
  'boss:gate': { floor: number }        // เดินชนประตูห้องบอส → เปิดกล่องแสดงเงื่อนไข
  'boss:enter': void                     // เงื่อนไขครบ + กดเข้า → โหลดห้องบอสเดี่ยว
  'notice': { text: string }
  // Phase 14 Inc 3: real-time boss 3-phase telegraph — RealtimeBattle (combat source of truth)
  // emits these; BossScene renders them on the live boss sprite/arena (one of 3 readable channels).
  'boss:phase-change': { phase: 1 | 2 | 3; tint: number; name: string; nameTh: string }
  'boss:telegraph': { phase: 1 | 2 | 3; pattern: 'single' | 'double' | 'aoe-slam'; telegraphMs: number; tint: number }
}

export const gameEvents = mitt<Events>()
