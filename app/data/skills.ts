// ================================================================================================
// สกิลแยกตามอาชีพ — แต่ละคลาสมีต้นไม้สกิลของตัวเอง 3 สาย (attack/defense/knowledge) สายละ 4 ระดับ
// รวม 4 คลาส × 12 = 48 สกิล แต่ละสกิลมีไอคอนเฉพาะ (glyph ใน public/skill-icons/, สร้างด้วย
// scripts/sprite-crop/build-skill-icons.cjs) โมดัลกรองตามคลาสผู้เล่นและแสดงทีละสาย
// id = `${classId}_${branch}_${rank}` — ระดับ n เรียนได้เมื่อเรียนระดับ n-1 ของสาย+คลาสเดียวกันแล้ว
// ================================================================================================
import type { HeroClassId } from './classes'

export type SkillBranch = 'attack' | 'defense' | 'knowledge'

export interface SkillNode {
  id: string
  classId: HeroClassId
  branch: SkillBranch
  rank: 1 | 2 | 3 | 4
  name: string
  description: string
  cost: number
  icon: string   // glyph id → skill-icons/<icon>.png
  stats: { atk?: number; def?: number; hp?: number; mag?: number; speed?: number; knowledge?: number }
}

type Row = [name: string, desc: string, icon: string, stats: SkillNode['stats']]
// ต่อคลาส: { attack:[r1..r4], defense:[r1..r4], knowledge:[r1..r4] } — cost = rank
const TREES: Record<HeroClassId, Record<SkillBranch, Row[]>> = {
  warrior: {
    attack: [
      ['Power Strike', '+4 ATK', 'sword', { atk: 4 }],
      ['Cleave', '+4 ATK, +1 SPD', 'cleave', { atk: 4, speed: 1 }],
      ['Berserk Edge', '+7 ATK', 'swords', { atk: 7 }],
      ['Warlord', '+10 ATK, +12 HP', 'greatsword', { atk: 10, hp: 12 }],
    ],
    defense: [
      ['Tough Skin', '+14 HP', 'armor', { hp: 14 }],
      ['Guard Stance', '+4 DEF', 'shield', { def: 4 }],
      ['Iron Will', '+20 HP, +2 DEF', 'helm', { hp: 20, def: 2 }],
      ['Last Stand', '+30 HP, +5 DEF', 'tower_shield', { hp: 30, def: 5 }],
    ],
    knowledge: [
      ['Battle Notes', '+2 KNOW', 'book', { knowledge: 2 }],
      ['Field Tactics', '+2 KNOW, +1 SPD', 'scroll', { knowledge: 2, speed: 1 }],
      ['War Study', '+4 KNOW', 'quill', { knowledge: 4 }],
      ['Grand Strategy', '+6 KNOW, +4 ATK', 'brain', { knowledge: 6, atk: 4 }],
    ],
  },
  mage: {
    attack: [
      ['Spark', '+5 MAG', 'wand', { mag: 5 }],
      ['Frostbite', '+5 MAG, +1 SPD', 'ice', { mag: 5, speed: 1 }],
      ['Fireball', '+9 MAG', 'fire', { mag: 9 }],
      ['Arcane Storm', '+13 MAG, +4 KNOW', 'orb', { mag: 13, knowledge: 4 }],
    ],
    defense: [
      ['Mana Shell', '+10 HP', 'ward', { hp: 10 }],
      ['Barrier', '+3 DEF', 'shield', { def: 3 }],
      ['Reflect Ward', '+16 HP, +2 DEF', 'ward', { hp: 16, def: 2 }],
      ['Aegis of Magic', '+24 HP, +4 DEF, +3 MAG', 'orb', { hp: 24, def: 4, mag: 3 }],
    ],
    knowledge: [
      ['Spell Notes', '+3 KNOW', 'book', { knowledge: 3 }],
      ['Rune Reading', '+3 KNOW, +2 MAG', 'scroll', { knowledge: 3, mag: 2 }],
      ['Deep Lore', '+5 KNOW', 'quill', { knowledge: 5 }],
      ['Archmage Insight', '+8 KNOW, +5 MAG', 'brain', { knowledge: 8, mag: 5 }],
    ],
  },
  archer: {
    attack: [
      ['Aimed Shot', '+4 ATK, +1 SPD', 'arrow', { atk: 4, speed: 1 }],
      ['Double Nock', '+3 ATK, +3 SPD', 'bow', { atk: 3, speed: 3 }],
      ['Piercing Arrow', '+7 ATK, +2 SPD', 'arrow', { atk: 7, speed: 2 }],
      ['Rain of Arrows', '+9 ATK, +5 SPD', 'bow', { atk: 9, speed: 5 }],
    ],
    defense: [
      ['Nimble', '+2 SPD, +8 HP', 'boots', { speed: 2, hp: 8 }],
      ['Roll Away', '+3 DEF', 'wings', { def: 3 }],
      ['Evasion', '+4 SPD, +2 DEF', 'boots', { speed: 4, def: 2 }],
      ['Wind Dance', '+16 HP, +6 SPD, +3 DEF', 'wings', { hp: 16, speed: 6, def: 3 }],
    ],
    knowledge: [
      ['Keen Eye', '+2 KNOW, +1 SPD', 'book', { knowledge: 2, speed: 1 }],
      ['Steady Focus', '+3 KNOW', 'scroll', { knowledge: 3 }],
      ['Hunter Sense', '+5 KNOW, +1 SPD', 'quill', { knowledge: 5, speed: 1 }],
      ['Perfect Focus', '+7 KNOW, +3 ATK', 'brain', { knowledge: 7, atk: 3 }],
    ],
  },
  guardian: {
    attack: [
      ['Shield Bash', '+3 ATK, +2 DEF', 'sword', { atk: 3, def: 2 }],
      ['Counter', '+4 ATK', 'swords', { atk: 4 }],
      ['Retribution', '+6 ATK, +2 DEF', 'cleave', { atk: 6, def: 2 }],
      ['Avenger', '+9 ATK, +20 HP', 'greatsword', { atk: 9, hp: 20 }],
    ],
    defense: [
      ['Bulwark', '+18 HP', 'armor', { hp: 18 }],
      ['Fortify', '+5 DEF', 'shield', { def: 5 }],
      ['Bastion', '+26 HP, +3 DEF', 'helm', { hp: 26, def: 3 }],
      ['Unbreakable', '+40 HP, +7 DEF', 'tower_shield', { hp: 40, def: 7 }],
    ],
    knowledge: [
      ['Calm Mind', '+2 KNOW, +6 HP', 'book', { knowledge: 2, hp: 6 }],
      ['Discipline', '+3 KNOW', 'scroll', { knowledge: 3 }],
      ['Stoic Study', '+4 KNOW, +1 DEF', 'quill', { knowledge: 4, def: 1 }],
      ['Sage Guardian', '+6 KNOW, +14 HP', 'brain', { knowledge: 6, hp: 14 }],
    ],
  },
}

const BRANCHES: SkillBranch[] = ['attack', 'defense', 'knowledge']

export const SKILL_TREE: SkillNode[] = (Object.keys(TREES) as HeroClassId[]).flatMap((classId) =>
  BRANCHES.flatMap((branch) =>
    TREES[classId][branch].map((row, i) => ({
      id: `${classId}_${branch}_${i + 1}`,
      classId,
      branch,
      rank: (i + 1) as 1 | 2 | 3 | 4,
      name: row[0],
      description: row[1],
      icon: row[2],
      cost: i + 1,
      stats: row[3],
    })),
  ),
)

export function skillsForClass(classId: HeroClassId): SkillNode[] {
  return SKILL_TREE.filter((s) => s.classId === classId)
}

/** เรียนได้เมื่อ: ยังไม่เรียน + แต้มพอ + (ระดับ 1 หรือเรียนระดับก่อนหน้าของสาย+คลาสเดียวกันแล้ว) */
export function canLearnSkill(skill: SkillNode, learned: string[], skillPoints: number): boolean {
  if (learned.includes(skill.id) || skillPoints < skill.cost) return false
  if (skill.rank === 1) return true
  return learned.includes(`${skill.classId}_${skill.branch}_${skill.rank - 1}`)
}
