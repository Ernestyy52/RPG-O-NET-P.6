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
  'town:enter-dungeon': { floor: number }
  'notice': { text: string }
}

export const gameEvents = mitt<Events>()
