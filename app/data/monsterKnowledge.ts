import { QUESTIONS, cefrForFloor, type Question } from './questions'

export type MonsterKnowledgeArchetype = 'slime' | 'beast' | 'spirit' | 'undead' | 'construct' | 'dragon' | 'boss'

export interface MonsterKnowledgeProfile {
  id: MonsterKnowledgeArchetype
  name: string
  icon: string
  subskills: string[]
  patterns: string[]
  battleTip: string
}

export const MONSTER_KNOWLEDGE_PROFILES: Record<MonsterKnowledgeArchetype, MonsterKnowledgeProfile> = {
  slime: { id: 'slime', name: 'Word Mimic', icon: '💧', subskills: ['vocab.everyday-nouns', 'vocab.in-context', 'grammar.present-simple'], patterns: ['vocabulary_in_context', 'picture_vocabulary'], battleTip: 'สไลม์เลียนแบบคำศัพท์—สังเกตบริบทสั้น ๆ ให้ดี' },
  beast: { id: 'beast', name: 'Trail Hunter', icon: '🐾', subskills: ['reading.detail', 'grammar.prepositions', 'conversation.requests-responses'], patterns: ['map_direction', 'spatial_preposition', 'pragmatic_inference'], battleTip: 'สัตว์ป่าโจมตีจากทิศทาง—ข้ออ่านแผนที่และตำแหน่งจะทำลายเกราะได้ดี' },
  spirit: { id: 'spirit', name: 'Echo Speaker', icon: '✨', subskills: ['conversation.reverse-question', 'conversation.requests-responses', 'reading.inference'], patterns: ['reverse_dialogue', 'pragmatic_inference', 'not_mentioned'], battleTip: 'วิญญาณพูดเป็นนัย—มองเจตนาของบทสนทนา ไม่ใช่แปลทีละคำ' },
  undead: { id: 'undead', name: 'Archive Keeper', icon: '📜', subskills: ['reading.detail', 'reading.inference', 'grammar.clauses-passive'], patterns: ['procedural_order', 'not_mentioned', 'reading_inference'], battleTip: 'ผู้เฝ้าหอจดหมายเหตุซ่อนคำตอบในรายละเอียดและลำดับเหตุการณ์' },
  construct: { id: 'construct', name: 'Logic Engine', icon: '⚙️', subskills: ['reading.data-interpretation', 'grammar.comparatives', 'vocab.in-context'], patterns: ['data_chart', 'multi_constraint', 'transitive_comparison'], battleTip: 'จักรกลแพ้การอ่านข้อมูล ตาราง และเงื่อนไขอย่างเป็นระบบ' },
  dragon: { id: 'dragon', name: 'Sky Tyrant', icon: '🐉', subskills: ['reading.inference', 'grammar.comparatives', 'conversation.reverse-question'], patterns: ['cultural_comparison', 'weather_chart', 'reverse_dialogue'], battleTip: 'มังกรทดสอบหลายทักษะพร้อมกัน—รักษาคอมโบไว้เพื่อ Break ปีกของมัน' },
  boss: { id: 'boss', name: 'Knowledge Guardian', icon: '👑', subskills: ['reading.inference', 'reading.data-interpretation', 'conversation.reverse-question'], patterns: ['multi_constraint', 'not_mentioned', 'reverse_dialogue', 'data_chart'], battleTip: 'บอสสลับรูปแบบข้อสอบตามเฟส อย่าตอบจากคำสำคัญเพียงคำเดียว' },
}

export function monsterKnowledgeArchetype(monsterId?: string, isBoss = false): MonsterKnowledgeArchetype {
  if (isBoss) return 'boss'
  const id = (monsterId ?? '').toLowerCase()
  if (/(slime|blob|ooze|pudding|mushroom|spore)/.test(id)) return 'slime'
  if (/(wolf|boar|cat|fox|bear|rat|bat|beast|serpent|crab|spider)/.test(id)) return 'beast'
  if (/(ghost|spirit|wisp|fairy|pixie|shade|echo)/.test(id)) return 'spirit'
  if (/(skeleton|zombie|undead|wraith|lich|grave|mummy)/.test(id)) return 'undead'
  if (/(golem|construct|clock|gear|autom|sentinel|guardian)/.test(id)) return 'construct'
  if (/(dragon|drake|wyrm|wyvern)/.test(id)) return 'dragon'
  return 'beast'
}

export interface MonsterQuestionPick {
  question: Question
  profile: MonsterKnowledgeProfile
  exhaustedCycle: boolean
}

/**
 * Selects a knowledge-backed question for this monster. A monster cannot repeat a question until its
 * complete CEFR affinity pool has been seen. The caller persists `seenIds`, so reloads do not reset it.
 */
export function selectMonsterQuestion(options: {
  monsterId?: string
  isBoss?: boolean
  floor: number
  difficulty: number
  seenIds?: string[]
  rng?: () => number
}): MonsterQuestionPick | null {
  const rng = options.rng ?? Math.random
  const profile = MONSTER_KNOWLEDGE_PROFILES[monsterKnowledgeArchetype(options.monsterId, options.isBoss)]
  const tier = cefrForFloor(options.floor)
  const tierPool = QUESTIONS.filter((q) => q.cefr === tier)
  const source = tierPool.length ? tierPool : QUESTIONS
  const affinity = source.filter((q) => (q.subskillId && profile.subskills.includes(q.subskillId)) || (q.patternId && profile.patterns.includes(q.patternId)))
  const pool = affinity.length >= 4 ? affinity : source
  const seen = new Set(options.seenIds ?? [])
  let candidates = pool.filter((q) => !seen.has(q.id))
  const exhaustedCycle = candidates.length === 0
  if (exhaustedCycle) candidates = pool
  if (!candidates.length) return null
  const ranked = candidates
    .map((question) => ({ question, score: Math.abs(question.difficulty - options.difficulty) + rng() * 0.65 }))
    .sort((a, b) => a.score - b.score)
  return { question: ranked[0]!.question, profile, exhaustedCycle }
}
