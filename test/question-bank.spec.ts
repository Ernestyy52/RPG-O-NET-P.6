// ================================================================================================
// Production question-bank gate — constitution rule 2:
// "Every production question has a correct answer, explanation, distractor reasoning, and
// provenance." This suite locks that in for the WHOLE bank, so a question missing pedagogy
// metadata can never silently ship again.
// ================================================================================================
import { describe, it, expect } from 'vitest'
import { QUESTIONS, cefrForFloor, type CefrLevel } from '~/data/questions'
import { CURRICULUM_QUESTIONS } from '~/data/curriculum/adapter'
import { validationReport } from '~/data/curriculum/validation'
import { getSubskill, SUBSKILLS } from '~/data/curriculum/taxonomy'

describe('question bank — constitution rule 2 (pedagogy metadata on every item)', () => {
  it('every production question has a non-empty explanation', () => {
    for (const q of QUESTIONS) {
      expect(q.explanation?.trim(), `${q.id} missing explanation`).toBeTruthy()
    }
  })

  it('distractor reasoning covers exactly the wrong choices of every item', () => {
    for (const q of QUESTIONS) {
      const wrong = [0, 1, 2, 3].filter((i) => i !== q.answerIndex).map(String).sort()
      const keys = Object.keys(q.distractorReasoning ?? {}).sort()
      expect(keys, `${q.id} distractorReasoning keys`).toEqual(wrong)
      for (const k of keys) expect(q.distractorReasoning![k].trim(), `${q.id}[${k}] empty reason`).toBeTruthy()
    }
  })

  it('every item is explicitly tagged with a real taxonomy subskill', () => {
    for (const q of QUESTIONS) {
      expect(q.subskillId, `${q.id} missing subskillId`).toBeTruthy()
      expect(getSubskill(q.subskillId!), `${q.id} unknown subskill ${q.subskillId}`).toBeDefined()
    }
  })

  it('generated items carry knowledge-pattern provenance (patternId)', () => {
    // Original 69 ids: v001-v020, g001-g020, c001-c015, r001-r014 — everything beyond is generated.
    const legacyMax: Record<string, number> = { v: 20, g: 20, c: 15, r: 14 }
    for (const q of QUESTIONS) {
      const kind = q.id[0]
      const num = Number(q.id.slice(1))
      const isLegacy = num <= (legacyMax[kind] ?? 0)
      if (!isLegacy) expect(q.patternId, `${q.id} generated without patternId`).toBeTruthy()
    }
  })
})

describe('question bank — coverage & balance', () => {
  it('passes the full curriculum validation report (no errors, balanced, no duplicates)', () => {
    const report = validationReport(CURRICULUM_QUESTIONS)
    if (!report.ok) console.error('report:', JSON.stringify({ errors: report.errors, dup: report.duplicates, pos: report.answerPositions }, null, 1))
    expect(report.ok).toBe(true)
    expect(report.selectableCount).toBe(QUESTIONS.length)
  })

  it('every CEFR floor tier has a healthy pool (>= 30 questions)', () => {
    const tiers: CefrLevel[] = ['Pre-A1', 'A1', 'A2', 'B1']
    for (const tier of tiers) {
      const n = QUESTIONS.filter((q) => q.cefr === tier).length
      expect(n, `tier ${tier}`).toBeGreaterThanOrEqual(30)
    }
    // and the floor mapping still reaches each tier
    expect(new Set([1, 20, 50, 80].map(cefrForFloor)).size).toBe(4)
  })

  it('every question category is represented in every tier', () => {
    const tiers: CefrLevel[] = ['Pre-A1', 'A1', 'A2', 'B1']
    for (const tier of tiers) {
      const cats = new Set(QUESTIONS.filter((q) => q.cefr === tier).map((q) => q.category))
      expect(cats.size, `tier ${tier} categories`).toBe(4)
    }
  })

  it('the bank exercises a broad slice of the taxonomy (>= 18 subskills)', () => {
    const used = new Set(QUESTIONS.map((q) => q.subskillId))
    expect(used.size).toBeGreaterThanOrEqual(18)
    for (const id of used) expect(SUBSKILLS.some((s) => s.id === id), `unknown ${id}`).toBe(true)
  })
})
