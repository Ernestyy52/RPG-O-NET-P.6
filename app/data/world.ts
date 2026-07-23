export type WeatherId = 'clear' | 'rain' | 'wind' | 'storm'

/**
 * World 1 = floors 1–10 (forest biome, "Verdant Slimes", boss Myco Colossus on floor 10). Single
 * source of truth for the Phase-14 per-zone gate: real-time combat, Knowledge Break, and dungeon
 * routing apply ONLY here; floors 11+ stay on the legacy TowerScene + BattleModal path in BOTH flag
 * states (PHASE_14_PLAN §3). Pure + unit-tested so the gate boundary can't silently drift.
 */
export function isWorld1Floor(floor: number): boolean {
  return Number.isFinite(floor) && floor >= 1 && floor <= 10
}

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
