import mitt from 'mitt'

type Events = {
  'battle:start': { floor: number }
  'battle:end': { won: boolean }
  'floor:advance': { floor: number }
}

export const gameEvents = mitt<Events>()
