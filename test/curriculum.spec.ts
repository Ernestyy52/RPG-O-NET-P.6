import { describe, it, expect } from 'vitest'
import { CURRICULUM_QUESTIONS, toCurriculumQuestion, authorQuestion } from '~/data/curriculum/adapter'
import {
  validateQuestion, analyzeAnswerPositions, findDuplicatePrompts,
  selectableInProduction, validationReport,
} from '~/data/curriculum/validation'
import { buildReviewQueue, promoteToReviewed } from '~/data/curriculum/reviewQueue'
import { getSubskill } from '~/data/curriculum/taxonomy'
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import type { Question } from '~/data/questions'

const goodRaw: Question = {
  id: 'test-good', category: 'vocabulary', cefr: 'A1', difficulty: 2,
  prompt: 'Choose the word that means big.', choices: ['Small', 'Large', 'Thin', 'Fast'], answerIndex: 1,
}

describe('curriculum — adapter preserves existing content', () => {
  it('adapts all 69 questions and grandfathers them as reviewed', () => {
    expect(CURRICULUM_QUESTIONS.length).toBe(69)
    for (const q of CURRICULUM_QUESTIONS) {
      expect(q.status).toBe('reviewed')
      expect(q.provenance.source).toBe('legacy-questions.json')
      expect(getSubskill(q.subskillId)).toBeDefined()
    }
  })

  it('does not mutate the original question content', () => {
    const c = toCurriculumQuestion(goodRaw)
    expect(c.prompt).toBe(goodRaw.prompt)
    expect(c.choices).toEqual(goodRaw.choices)
    expect(c.answerIndex).toBe(goodRaw.answerIndex)
  })

  it('new authored questions start as draft', () => {
    const c = authorQuestion(goodRaw)
    expect(c.status).toBe('draft')
    expect(c.provenance.source).toBe('authored')
  })
})

describe('curriculum — the existing content bank is valid & production-ready', () => {
  it('every existing question passes structural validation with no errors', () => {
    const report = validationReport(CURRICULUM_QUESTIONS)
    if (report.errors.length) console.error('content errors:', report.errors)
    expect(report.errors).toEqual([])
  })

  it('all 69 are selectable in production (reviewed + valid)', () => {
    expect(selectableInProduction(CURRICULUM_QUESTIONS).length).toBe(69)
  })

  it('has no duplicate prompts', () => {
    expect(findDuplicatePrompts(CURRICULUM_QUESTIONS)).toEqual([])
  })

  it('answer key is not biased toward a single position', () => {
    const report = analyzeAnswerPositions(CURRICULUM_QUESTIONS)
    expect(report.total).toBe(69)
    expect(report.balanced).toBe(true)
  })
})

describe('curriculum — validation rejects malformed content', () => {
  const mk = (over: Partial<CurriculumQuestion>): CurriculumQuestion =>
    ({ ...toCurriculumQuestion(goodRaw), ...over })

  it('flags empty prompt, duplicate choices, and out-of-range answer', () => {
    expect(validateQuestion(mk({ prompt: '   ' })).some((i) => i.code === 'empty-prompt')).toBe(true)
    expect(validateQuestion(mk({ choices: ['A', 'A', 'B', 'C'] })).some((i) => i.code === 'duplicate-choices')).toBe(true)
    expect(validateQuestion(mk({ answerIndex: 9 })).some((i) => i.code === 'answer-out-of-range')).toBe(true)
  })

  it('rejects an unknown subskill tag', () => {
    expect(validateQuestion(mk({ subskillId: 'nope.not-real' })).some((i) => i.code === 'unknown-subskill')).toBe(true)
  })
})

describe('curriculum — production selectability rule (only reviewed content)', () => {
  it('excludes draft and retired items even when structurally valid', () => {
    const draft = authorQuestion(goodRaw)            // draft
    const reviewed = toCurriculumQuestion(goodRaw)   // reviewed
    const retired: CurriculumQuestion = { ...reviewed, id: 'r', status: 'retired' }
    const pool = [draft, reviewed, retired]
    const selectable = selectableInProduction(pool)
    expect(selectable.map((q) => q.status)).toEqual(['reviewed'])
  })

  it('excludes a reviewed item that has structural errors', () => {
    const badReviewed = { ...toCurriculumQuestion(goodRaw), id: 'bad', answerIndex: 99 }
    expect(selectableInProduction([badReviewed])).toEqual([])
  })
})

describe('curriculum — review queue & promotion', () => {
  it('queues drafts and error items, not clean reviewed items', () => {
    const draft = authorQuestion(goodRaw)
    const reviewed = toCurriculumQuestion(goodRaw)
    const queue = buildReviewQueue([draft, reviewed])
    expect(queue.length).toBe(1)
    expect(queue[0].reason).toBe('draft')
  })

  it('promotes a valid draft but refuses one with errors', () => {
    const okDraft = authorQuestion(goodRaw)
    const promoted = promoteToReviewed(okDraft)
    expect(promoted.ok).toBe(true)
    expect(promoted.question.status).toBe('reviewed')

    const badDraft = authorQuestion({ ...goodRaw, answerIndex: 42 })
    const refused = promoteToReviewed(badDraft)
    expect(refused.ok).toBe(false)
    expect(refused.question.status).toBe('draft')
  })
})
