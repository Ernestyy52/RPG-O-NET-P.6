// คลังคำถาม O-NET ป.6 — โหลดจาก data/questions.json (root) ซึ่งสร้างจาก knowledge/ เท่านั้น
// (ดูกติกาที่ knowledge/README.md: วิเคราะห์เฉพาะ pattern ห้ามเก็บข้อสอบจริง)
import questionsData from '../../data/questions.json'

export type QuestionCategory = 'vocabulary' | 'grammar' | 'reading' | 'conversation'
export type CefrLevel = 'Pre-A1' | 'A1' | 'A2' | 'B1'

export interface Question {
  id: string
  category: QuestionCategory
  cefr: CefrLevel
  difficulty: 1 | 2 | 3 | 4 | 5
  prompt: string
  choices: string[]
  answerIndex: number
}

export const QUESTIONS: Question[] = questionsData as Question[]

export function cefrForFloor(floor: number): CefrLevel {
  if (floor <= 15) return 'Pre-A1'
  if (floor <= 40) return 'A1'
  if (floor <= 70) return 'A2'
  return 'B1'
}

// "Shuffle bag" ต่อระดับ CEFR: ห้ามซ้ำข้อไหนเลยจนกว่าจะเจอครบทุกข้อในระดับนั้นก่อน ค่อยรีเซ็ต
// (ดีกว่าเดิมที่กันซ้ำแค่ 4 ข้อล่าสุด — ทำให้ผู้เล่นเจอคำถามซ้ำกันน้อยที่สุดเท่าที่คลังข้อมีอยู่)
const usedIdsByTier: Record<CefrLevel, Set<string>> = {
  'Pre-A1': new Set(), A1: new Set(), A2: new Set(), B1: new Set(),
}

export function getQuestionsForDifficulty(difficulty: number, count = 1, floor = 1): Question[] {
  const targetCefr = cefrForFloor(floor)
  const pool = QUESTIONS.filter((q) => q.cefr === targetCefr)
  const source = pool.length ? pool : QUESTIONS
  const used = usedIdsByTier[targetCefr]

  let available = source.filter((q) => !used.has(q.id))
  if (available.length < count) {
    // หมดกระเป๋า (เจอครบทุกข้อในระดับนี้แล้ว) — รีเซ็ตแล้วเริ่มสุ่มรอบใหม่
    used.clear()
    available = source
  }

  // จัดลำดับตามความใกล้เคียงของความยาก แต่ยังสุ่มภายในกลุ่มที่ใกล้เคียงกัน
  const scored = available
    .map((q) => ({ q, score: Math.abs(q.difficulty - difficulty) + Math.random() * 0.5 }))
    .sort((a, b) => a.score - b.score)

  const selected = scored.slice(0, count).map((s) => s.q)
  selected.forEach((q) => used.add(q.id))
  return selected
}
