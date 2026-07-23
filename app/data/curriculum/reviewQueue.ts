// ================================================================================================
// Teacher review queue (Phase 05)
//
// A pure data structure listing questions that need human review before they can be served. Draft
// items (and any item with validation errors) go here. No UI yet — Phase 16 (teacher mode) consumes
// this. Promotion to `reviewed` is an explicit human action; nothing here auto-approves content.
// ================================================================================================
import type { CurriculumQuestion } from './schema'
import { validateQuestion, type ValidationIssue } from './validation'

export interface ReviewItem {
  question: CurriculumQuestion
  reason: 'draft' | 'has-errors' | 'draft-and-errors'
  issues: ValidationIssue[]
}

/** Everything that is NOT yet safely selectable: drafts and/or items with validation errors. */
export function buildReviewQueue(questions: CurriculumQuestion[]): ReviewItem[] {
  const queue: ReviewItem[] = []
  for (const q of questions) {
    const issues = validateQuestion(q)
    const hasErrors = issues.some((i) => i.severity === 'error')
    const isDraft = q.status === 'draft'
    if (!isDraft && !hasErrors) continue
    queue.push({
      question: q,
      reason: isDraft && hasErrors ? 'draft-and-errors' : isDraft ? 'draft' : 'has-errors',
      issues,
    })
  }
  return queue
}

/** Promote a validated draft to `reviewed`. Refuses to promote an item with validation errors. */
export function promoteToReviewed(q: CurriculumQuestion): { ok: boolean; question: CurriculumQuestion; issues: ValidationIssue[] } {
  const issues = validateQuestion(q).filter((i) => i.severity === 'error')
  if (issues.length > 0) return { ok: false, question: q, issues }
  return { ok: true, question: { ...q, status: 'reviewed' }, issues: [] }
}
