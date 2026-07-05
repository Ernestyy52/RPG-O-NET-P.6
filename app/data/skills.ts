export type SkillBranch = 'attack' | 'defense' | 'knowledge'

export interface SkillNode {
  id: string
  branch: SkillBranch
  rank: 1 | 2 | 3
  name: string
  description: string
  cost: number
  stats: { atk?: number; def?: number; hp?: number; speed?: number; knowledge?: number }
}

export const SKILL_TREE: SkillNode[] = [
  { id: 'attack_1', branch: 'attack', rank: 1, name: 'Power Strike', description: '+3 attack', cost: 1, stats: { atk: 3 } },
  { id: 'attack_2', branch: 'attack', rank: 2, name: 'Quick Follow', description: '+2 attack, +1 speed', cost: 2, stats: { atk: 2, speed: 1 } },
  { id: 'attack_3', branch: 'attack', rank: 3, name: 'Boss Breaker', description: '+5 attack', cost: 3, stats: { atk: 5 } },
  { id: 'defense_1', branch: 'defense', rank: 1, name: 'Tough Skin', description: '+12 HP', cost: 1, stats: { hp: 12 } },
  { id: 'defense_2', branch: 'defense', rank: 2, name: 'Guard Stance', description: '+3 defense', cost: 2, stats: { def: 3 } },
  { id: 'defense_3', branch: 'defense', rank: 3, name: 'Last Stand', description: '+24 HP, +2 defense', cost: 3, stats: { hp: 24, def: 2 } },
  { id: 'knowledge_1', branch: 'knowledge', rank: 1, name: 'Vocabulary Notes', description: '+2 knowledge', cost: 1, stats: { knowledge: 2 } },
  { id: 'knowledge_2', branch: 'knowledge', rank: 2, name: 'Reading Rhythm', description: '+2 knowledge, +1 speed', cost: 2, stats: { knowledge: 2, speed: 1 } },
  { id: 'knowledge_3', branch: 'knowledge', rank: 3, name: 'Exam Sense', description: '+4 knowledge', cost: 3, stats: { knowledge: 4 } },
]
