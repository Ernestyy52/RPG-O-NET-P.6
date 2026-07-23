// ================================================================================================
// Curriculum question schema (Phase 05)
//
// Extends the raw `Question` with the metadata O-NET learning needs: review status, provenance,
// taxonomy tag, and optional pedagogy (explanation, per-distractor reasoning, misconceptions).
//
// HARD RULE (enforced in validation.ts): only `reviewed` content is selectable in production.
// New/generated questions default to `draft` and must be promoted by a human review pass.
// ================================================================================================
import type { Question } from '~/data/questions'

export type ReviewStatus = 'draft' | 'reviewed' | 'retired'

export interface Provenance {
  /** where the item came from — preserved for auditability. */
  source: 'legacy-questions.json' | 'knowledge-pattern' | 'authored'
  /** knowledge/ pattern id when generated from a pattern (never a real exam item). */
  patternId?: string
  note?: string
}

export interface CurriculumQuestion extends Question {
  status: ReviewStatus
  provenance: Provenance
  /** taxonomy subskill id (see taxonomy.ts). */
  subskillId: string
  /** age-appropriate explanation of the correct answer. */
  explanation?: string
  /** why each wrong choice is wrong, keyed by choice index (string keys — JSON object keys). */
  distractorReasoning?: Record<string, string>
  /** misconception tags this item probes. */
  misconceptions?: string[]
}

export const REVIEW_STATUSES: ReviewStatus[] = ['draft', 'reviewed', 'retired']

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === 'string' && (REVIEW_STATUSES as string[]).includes(value)
}
