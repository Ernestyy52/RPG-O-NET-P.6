// ================================================================================================
// Current-question adapter (Phase 05)
//
// Maps the existing `data/questions.json` items into the curriculum schema WITHOUT changing their
// content. Grandfathering rule (documented in docs/learning/CURRICULUM_AND_VALIDATION.md):
//   - The existing 69 questions are already curated from knowledge/ patterns and live in production,
//     so they are adapted with status `reviewed` (current content is preserved & stays selectable).
//   - Any NEW question created via `authorQuestion` defaults to status `draft` and must be promoted
//     by a human review pass before it is selectable in production.
// Subskill tagging is coarse (domain default) with a few conservative keyword refinements; finer
// tagging is a deliberate later review task, not an invented guess.
// ================================================================================================
import { QUESTIONS, type Question } from '~/data/questions'
import { defaultSubskillFor, type OnetDomain } from './taxonomy'
import type { CurriculumQuestion, Provenance, ReviewStatus } from './schema'

/** Conservative keyword refinements — only applied when unambiguous. */
function inferSubskill(q: Question): string {
  const domain = q.category as OnetDomain
  const p = q.prompt.toLowerCase()
  if (domain === 'conversation' && /(direction|how do i get|where is|turn left|turn right)/.test(p)) return 'convo.directions'
  if (domain === 'grammar' && /(yesterday|last night|ago|did )/.test(p)) return 'grammar.tense-past'
  return defaultSubskillFor(domain).id
}

export function toCurriculumQuestion(
  q: Question,
  status: ReviewStatus = 'reviewed',
  provenance: Provenance = { source: 'legacy-questions.json' },
): CurriculumQuestion {
  // Explicit metadata carried on the JSON item wins over the coarse fallbacks:
  //  - subskillId: reviewed tagging in data/questions.json beats keyword inference
  //  - patternId: marks a question generated from a knowledge/ pattern (provenance)
  const explicitProvenance: Provenance = q.patternId
    ? { source: 'knowledge-pattern', patternId: q.patternId }
    : provenance
  return { ...q, status, provenance: explicitProvenance, subskillId: q.subskillId ?? inferSubskill(q) }
}

/** All existing questions, adapted and grandfathered as reviewed. */
export const CURRICULUM_QUESTIONS: CurriculumQuestion[] = QUESTIONS.map((q) => toCurriculumQuestion(q))

/** Create a NEW question — always starts as `draft` (never auto-reviewed). */
export function authorQuestion(
  q: Question,
  provenance: Provenance = { source: 'authored' },
  extras: Partial<Pick<CurriculumQuestion, 'explanation' | 'distractorReasoning' | 'misconceptions' | 'subskillId'>> = {},
): CurriculumQuestion {
  const base = toCurriculumQuestion(q, 'draft', provenance)
  return { ...base, ...extras }
}
