export type QuestionCategory =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'conversation'

export interface Question {
  id: string
  category: QuestionCategory
  difficulty: 1 | 2 | 3 | 4 | 5
  prompt: string
  choices: string[]
  answerIndex: number
}

// เนื้อหาอ้างอิงแนวข้อสอบ O-NET ภาษาอังกฤษ ป.6 (คำศัพท์/แกรมมาร์พื้นฐาน/บทสนทนา/การอ่านจับใจความสั้นๆ)
export const QUESTIONS: Question[] = [
  { id: 'v001', category: 'vocabulary', difficulty: 1, prompt: 'Choose the word that means "โรงเรียน"', choices: ['Hospital', 'School', 'Market', 'Airport'], answerIndex: 1 },
  { id: 'v002', category: 'vocabulary', difficulty: 1, prompt: 'What is the opposite of "big"?', choices: ['Small', 'Tall', 'Long', 'Fast'], answerIndex: 0 },
  { id: 'v003', category: 'vocabulary', difficulty: 2, prompt: 'A person who teaches students is a ______.', choices: ['doctor', 'teacher', 'farmer', 'driver'], answerIndex: 1 },
  { id: 'g001', category: 'grammar', difficulty: 1, prompt: 'She ______ to school every day.', choices: ['go', 'goes', 'going', 'gone'], answerIndex: 1 },
  { id: 'g002', category: 'grammar', difficulty: 2, prompt: 'There ______ two cats under the table.', choices: ['is', 'are', 'am', 'be'], answerIndex: 1 },
  { id: 'g003', category: 'grammar', difficulty: 3, prompt: 'I ______ my homework already.', choices: ['finish', 'finished', 'have finished', 'finishing'], answerIndex: 2 },
  { id: 'c001', category: 'conversation', difficulty: 1, prompt: 'A: "How are you?" B: "______"', choices: ['I am ten.', 'I am fine, thank you.', 'It is Monday.', 'Yes, I do.'], answerIndex: 1 },
  { id: 'c002', category: 'conversation', difficulty: 2, prompt: 'A: "What time is it?" B: "______"', choices: ['It is red.', 'It is three o\'clock.', 'It is my book.', 'It is far.'], answerIndex: 1 },
  { id: 'r001', category: 'reading', difficulty: 2, prompt: 'Read: "Tom has a small dog. The dog is brown and likes to run." What color is the dog?', choices: ['Black', 'White', 'Brown', 'Grey'], answerIndex: 2 },
  { id: 'r002', category: 'reading', difficulty: 3, prompt: 'Read: "Mali wakes up at 6 a.m. She eats breakfast and goes to school by bus." How does Mali go to school?', choices: ['By car', 'By bus', 'By bike', 'On foot'], answerIndex: 1 },
]

export function getQuestionsForDifficulty(difficulty: number, count = 1): Question[] {
  const pool = QUESTIONS.filter((q) => Math.abs(q.difficulty - difficulty) <= 1)
  const source = pool.length ? pool : QUESTIONS
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
