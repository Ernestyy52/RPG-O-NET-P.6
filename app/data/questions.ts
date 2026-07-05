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

export const QUESTIONS: Question[] = [
  { id: 'v001', category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1, prompt: 'Choose the word that means school.', choices: ['Hospital', 'School', 'Market', 'Airport'], answerIndex: 1 },
  { id: 'v002', category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1, prompt: 'What is the opposite of big?', choices: ['Small', 'Tall', 'Long', 'Fast'], answerIndex: 0 },
  { id: 'c001', category: 'conversation', cefr: 'Pre-A1', difficulty: 1, prompt: 'A: How are you? B: ______', choices: ['I am ten.', 'I am fine, thank you.', 'It is Monday.', 'Yes, I do.'], answerIndex: 1 },
  { id: 'g001', category: 'grammar', cefr: 'A1', difficulty: 1, prompt: 'She ______ to school every day.', choices: ['go', 'goes', 'going', 'gone'], answerIndex: 1 },
  { id: 'v003', category: 'vocabulary', cefr: 'A1', difficulty: 2, prompt: 'A person who teaches students is a ______.', choices: ['doctor', 'teacher', 'farmer', 'driver'], answerIndex: 1 },
  { id: 'g002', category: 'grammar', cefr: 'A1', difficulty: 2, prompt: 'There ______ two cats under the table.', choices: ['is', 'are', 'am', 'be'], answerIndex: 1 },
  { id: 'c002', category: 'conversation', cefr: 'A1', difficulty: 2, prompt: 'A: What time is it? B: ______', choices: ['It is red.', 'It is three o clock.', 'It is my book.', 'It is far.'], answerIndex: 1 },
  { id: 'r001', category: 'reading', cefr: 'A1', difficulty: 2, prompt: 'Tom has a small brown dog. What color is the dog?', choices: ['Black', 'White', 'Brown', 'Grey'], answerIndex: 2 },
  { id: 'g003', category: 'grammar', cefr: 'A2', difficulty: 3, prompt: 'I ______ my homework already.', choices: ['finish', 'finished', 'have finished', 'finishing'], answerIndex: 2 },
  { id: 'r002', category: 'reading', cefr: 'A2', difficulty: 3, prompt: 'Mali wakes up at 6 a.m. She eats breakfast and goes to school by bus. How does Mali go to school?', choices: ['By car', 'By bus', 'By bike', 'On foot'], answerIndex: 1 },
  { id: 'g004', category: 'grammar', cefr: 'A2', difficulty: 4, prompt: 'If it rains tomorrow, we ______ at home.', choices: ['stay', 'stayed', 'will stay', 'staying'], answerIndex: 2 },
  { id: 'r003', category: 'reading', cefr: 'B1', difficulty: 5, prompt: 'Nina saved money for weeks because she wanted to buy a dictionary. Why did Nina save money?', choices: ['To buy food', 'To buy a dictionary', 'To travel', 'To pay a fine'], answerIndex: 1 },
]

let recentQuestionIds: string[] = []

export function cefrForFloor(floor: number): CefrLevel {
  if (floor <= 15) return 'Pre-A1'
  if (floor <= 40) return 'A1'
  if (floor <= 70) return 'A2'
  return 'B1'
}

export function getQuestionsForDifficulty(difficulty: number, count = 1, floor = 1): Question[] {
  const targetCefr = cefrForFloor(floor)
  const pool = QUESTIONS.filter((q) => q.cefr === targetCefr && Math.abs(q.difficulty - difficulty) <= 1)
  const fallback = QUESTIONS.filter((q) => Math.abs(q.difficulty - difficulty) <= 1)
  const source = pool.length ? pool : fallback.length ? fallback : QUESTIONS
  const withoutRecent = source.filter((q) => !recentQuestionIds.includes(q.id))
  const candidates = withoutRecent.length >= count ? withoutRecent : source
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)
  recentQuestionIds = [...selected.map((q) => q.id), ...recentQuestionIds].slice(0, 4)
  return selected
}
