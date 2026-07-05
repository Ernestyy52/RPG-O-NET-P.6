export type WeatherId = 'clear' | 'rain' | 'wind' | 'storm'

export interface WorldState {
  phase: 'Dawn' | 'Day' | 'Dusk' | 'Night'
  weather: WeatherId
  description: string
  combatModifier: { playerSpeed: number; monsterAtk: number; knowledge: number }
}

const WEATHER: Record<WeatherId, WorldState['combatModifier']> = {
  clear: { playerSpeed: 1, monsterAtk: 1, knowledge: 1 },
  rain: { playerSpeed: 0.9, monsterAtk: 0.95, knowledge: 1.1 },
  wind: { playerSpeed: 1.15, monsterAtk: 1, knowledge: 1 },
  storm: { playerSpeed: 0.85, monsterAtk: 1.15, knowledge: 1.15 },
}

export function getWorldState(date = new Date()): WorldState {
  const minutes = date.getHours() * 60 + date.getMinutes()
  const phase = minutes < 360 ? 'Night' : minutes < 720 ? 'Dawn' : minutes < 1080 ? 'Day' : minutes < 1260 ? 'Dusk' : 'Night'
  const weather = (['clear', 'rain', 'wind', 'storm'] as WeatherId[])[Math.floor((date.getTime() / 60000) / 7) % 4]
  const phaseBonus = phase === 'Night' ? { playerSpeed: 0.95, monsterAtk: 1.1, knowledge: 1.1 } : phase === 'Dawn' ? { playerSpeed: 1.05, monsterAtk: 1, knowledge: 1.05 } : { playerSpeed: 1, monsterAtk: 1, knowledge: 1 }
  const weatherBonus = WEATHER[weather]
  return {
    phase,
    weather,
    description: `${phase} / ${weather}`,
    combatModifier: {
      playerSpeed: phaseBonus.playerSpeed * weatherBonus.playerSpeed,
      monsterAtk: phaseBonus.monsterAtk * weatherBonus.monsterAtk,
      knowledge: phaseBonus.knowledge * weatherBonus.knowledge,
    },
  }
}
