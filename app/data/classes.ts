export type HeroClassId = 'warrior' | 'mage' | 'archer' | 'guardian'

export interface HeroClass {
  id: HeroClassId
  name: string
  role: string
  sprite: string
  base: { hp: number; atk: number; def: number; mag: number; speed: number; knowledge: number }
  growth: { hp: number; atk: number; def: number; mag: number; speed: number; knowledge: number }
}

export const HERO_CLASSES: HeroClass[] = [
  { id: 'warrior', name: 'Warrior', role: 'Balanced frontliner', sprite: '/player-sprites/warrior_battle.png', base: { hp: 72, atk: 10, def: 6, mag: 1, speed: 6, knowledge: 2 }, growth: { hp: 12, atk: 3, def: 2, mag: 0, speed: 1, knowledge: 1 } },
  { id: 'mage', name: 'Mage', role: 'High support power', sprite: '/player-sprites/mage_battle.png', base: { hp: 54, atk: 6, def: 3, mag: 11, speed: 7, knowledge: 5 }, growth: { hp: 8, atk: 1, def: 1, mag: 4, speed: 1, knowledge: 2 } },
  { id: 'archer', name: 'Archer', role: 'Fast answer striker', sprite: '/player-sprites/archer_battle.png', base: { hp: 60, atk: 9, def: 4, mag: 2, speed: 11, knowledge: 3 }, growth: { hp: 9, atk: 3, def: 1, mag: 1, speed: 3, knowledge: 1 } },
  { id: 'guardian', name: 'Guardian', role: 'Slow defensive tank', sprite: '/player-sprites/guardian_battle.png', base: { hp: 86, atk: 7, def: 10, mag: 1, speed: 4, knowledge: 2 }, growth: { hp: 15, atk: 2, def: 4, mag: 0, speed: 1, knowledge: 1 } },
]

export function getHeroClass(id: HeroClassId): HeroClass {
  return HERO_CLASSES.find((heroClass) => heroClass.id === id) ?? HERO_CLASSES[0]
}
