// ================================================================================================
// Content validation pipeline (Phase 05)
//
// Pure, deterministic checks that (a) reject malformed questions, (b) analyze answer-position balance
// and duplicates, and (c) enforce the hard rule that ONLY reviewed content is selectable in
// production. No question reaches players unless it is `reviewed` AND passes structural validation.
// ================================================================================================
import { getSubskill } from './taxonomy'
import { isReviewStatus, type CurriculumQuestion } from './schema'

export type IssueSeverity = 'error' | 'warning'

export interface ValidationIssue {
  questionId: string
  severity: IssueSeverity
  code: string
  message: string
}

function normalizePrompt(p: string): string {
  return p.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Structural validation of a single question. Returns [] when the question is well-formed. */
export function validateQuestion(q: CurriculumQuestion): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const err = (code: string, message: string) => issues.push({ questionId: q.id, severity: 'error', code, message })
  const warn = (code: string, message: string) => issues.push({ questionId: q.id, severity: 'warning', code, message })

  if (!q.id || !q.id.trim()) err('empty-id', 'question has no id')
  if (!q.prompt || !q.prompt.trim()) err('empty-prompt', 'prompt is empty')
  if (!Array.isArray(q.choices) || q.choices.length < 2) err('too-few-choices', 'needs at least 2 choices')
  else {
    if (q.choices.some((c) => !c || !String(c).trim())) err('empty-choice', 'a choice is empty')
    const norm = q.choices.map((c) => String(c).trim().toLowerCase())
    if (new Set(norm).size !== norm.length) err('duplicate-choices', 'choices contain duplicates')
    if (q.choices.length !== 4) warn('non-standard-choice-count', `O-NET items usually have 4 choices (got ${q.choices.length})`)
  }
  if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || (Array.isArray(q.choices) && q.answerIndex >= q.choices.length)) {
    err('answer-out-of-range', 'answerIndex is out of range')
  }
  if (!isReviewStatus(q.status)) err('bad-status', 'status must be draft | reviewed | retired')
  if (!q.provenance || !q.provenance.source) err('missing-provenance', 'provenance.source is required')
  if (!q.subskillId || !getSubskill(q.subskillId)) err('unknown-subskill', `subskillId "${q.subskillId}" is not in the taxonomy`)
  if (q.status === 'reviewed' && !q.explanation) warn('reviewed-without-explanation', 'reviewed items should include an explanation')

  return issues
}

export interface AnswerPositionReport {
  counts: number[]        // count of correct answers at each choice index
  total: number
  maxShare: number        // largest single-position share (0..1)
  balanced: boolean       // true when no position dominates beyond the threshold
}

/**
 * Answer-position analysis — detects a biased answer key (e.g., "always B"). `maxSlots` sets the
 * index space (default 4). `threshold` is the allowed max share before flagging imbalance.
 */
export function analyzeAnswerPositions(questions: CurriculumQuestion[], maxSlots = 4, threshold = 0.4): AnswerPositionReport {
  const counts = new Array(maxSlots).fill(0)
  for (const q of questions) {
    if (q.answerIndex >= 0 && q.answerIndex < maxSlots) counts[q.answerIndex]++
  }
  const total = questions.length
  const maxShare = total ? Math.max(...counts) / total : 0
  return { counts, total, maxShare, balanced: total === 0 ? true : maxShare <= threshold }
}

export interface DuplicateGroup { prompt: string; ids: string[] }

/** Groups questions that share a normalized prompt (potential duplicates). */
export function findDuplicatePrompts(questions: CurriculumQuestion[]): DuplicateGroup[] {
  const byPrompt = new Map<string, string[]>()
  for (const q of questions) {
    const key = normalizePrompt(q.prompt)
    const arr = byPrompt.get(key) ?? []
    arr.push(q.id)
    byPrompt.set(key, arr)
  }
  return [...byPrompt.entries()].filter(([, ids]) => ids.length > 1).map(([prompt, ids]) => ({ prompt, ids }))
}

/** The hard rule: only `reviewed` AND structurally-valid questions may be served to players. */
export function selectableInProduction(questions: CurriculumQuestion[]): CurriculumQuestion[] {
  return questions.filter((q) => q.status === 'reviewed' && validateQuestion(q).filter((i) => i.severity === 'error').length === 0)
}

export interface ValidationReport {
  total: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  selectableCount: number
  answerPositions: AnswerPositionReport
  duplicates: DuplicateGroup[]
  ok: boolean // no errors and answer key is balanced
}

export function validationReport(questions: CurriculumQuestion[]): ValidationReport {
  const all = questions.flatMap(validateQuestion)
  const errors = all.filter((i) => i.severity === 'error')
  const warnings = all.filter((i) => i.severity === 'warning')
  const answerPositions = analyzeAnswerPositions(questions)
  const duplicates = findDuplicatePrompts(questions)
  return {
    total: questions.length,
    errors,
    warnings,
    selectableCount: selectableInProduction(questions).length,
    answerPositions,
    duplicates,
    ok: errors.length === 0 && answerPositions.balanced && duplicates.length === 0,
  }
}
