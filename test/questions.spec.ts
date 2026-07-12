import { describe, it, expect } from 'vitest'
import { cefrForFloor, getQuestionsForDifficulty, QUESTIONS } from '~/data/questions'

describe('questions — CEFR banding', () => {
  it('maps floor ranges to the expected CEFR level', () => {
    expect(cefrForFloor(1)).toBe('Pre-A1')
    expect(cefrForFloor(15)).toBe('Pre-A1')
    expect(cefrForFloor(16)).toBe('A1')
    expect(cefrForFloor(40)).toBe('A1')
    expect(cefrForFloor(41)).toBe('A2')
    expect(cefrForFloor(70)).toBe('A2')
    expect(cefrForFloor(71)).toBe('B1')
  })
})

describe('questions — content integrity (only well-formed questions ship)', () => {
  it('every question has a prompt, >=2 choices, and an in-range answer index', () => {
    expect(QUESTIONS.length).toBeGreaterThan(0)
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy()
      expect(q.prompt.trim().length).toBeGreaterThan(0)
      expect(q.choices.length).toBeGreaterThanOrEqual(2)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThan(q.choices.length)
      expect(q.difficulty).toBeGreaterThanOrEqual(1)
      expect(q.difficulty).toBeLessThanOrEqual(5)
    }
  })

  it('question ids are unique', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('questions — shuffle-bag selection', () => {
  it('returns the requested count from the floor\'s CEFR pool', () => {
    const floor = 1 // Pre-A1
    const [q] = getQuestionsForDifficulty(1, 1, floor)
    expect(q).toBeDefined()
    expect(q.cefr).toBe('Pre-A1')
  })

  it('does not repeat a question within a bag until the tier pool is exhausted', () => {
    const floor = 5 // Pre-A1 tier
    const draw = () => getQuestionsForDifficulty(3, 1, floor)[0].id
    const n = QUESTIONS.filter((q) => q.cefr === 'Pre-A1').length
    expect(n).toBeGreaterThan(0)

    // Robust to any pre-existing shuffle-bag state (module-level, shared with earlier draws):
    // draw until a repeat is observed — that repeat marks the first item of a fresh bag.
    const window = new Set<string>()
    let firstOfNewBag: string | null = null
    for (let i = 0; i < n * 2 && firstOfNewBag === null; i++) {
      const id = draw()
      if (window.has(id)) firstOfNewBag = id
      else window.add(id)
    }
    expect(firstOfNewBag).not.toBeNull()

    // Now measure exactly one clean bag: the fresh first item + the next (n-1) draws are all unique.
    const bag = new Set<string>([firstOfNewBag!])
    for (let i = 0; i < n - 1; i++) {
      const id = draw()
      expect(bag.has(id)).toBe(false)
      bag.add(id)
    }
    expect(bag.size).toBe(n)
  })
})
