import mitt from 'mitt'

type Events = {
  'battle:start': { floor: number }
  'battle:end': { won: boolean }
  'floor:advance': { floor: number }
  'town:hospital': void
  'town:item-shop': void
  'town:equipment-shop': void
  'town:guild': void
  'town:enter-dungeon': { floor: number }
  'notice': { text: string }
}

export const gameEvents = mitt<Events>()
