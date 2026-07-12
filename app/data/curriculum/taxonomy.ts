// ================================================================================================
// O-NET Grade-6 English taxonomy (Phase 05)
//
// A small, grounded domain → subskill map used to tag questions, drive mastery/spaced review
// (Phase 06), and power teacher reporting (Phase 16). Domains mirror the four question categories
// already present in the content so the existing 69 questions map cleanly. Subskills carry
// prerequisites and common Grade-6 misconceptions.
//
// This is a starting taxonomy, intentionally conservative. Extend it as reviewed content grows —
// never invent a subskill a question can't be honestly tagged with.
// ================================================================================================
import type { QuestionCategory } from '~/data/questions'

export type OnetDomain = QuestionCategory // 'vocabulary' | 'grammar' | 'reading' | 'conversation'

export interface Subskill {
  id: string
  domain: OnetDomain
  name: string
  /** subskill ids that should be comfortable before this one (spaced-review ordering hint). */
  prerequisites: string[]
  /** typical Grade-6 misconceptions, for distractor design and feedback. */
  misconceptions: string[]
}

export const SUBSKILLS: Subskill[] = [
  // Vocabulary
  { id: 'vocab.everyday-nouns', domain: 'vocabulary', name: 'Everyday nouns (places, things)', prerequisites: [], misconceptions: ['confusing similar places (hospital/clinic)'] },
  { id: 'vocab.verbs-actions', domain: 'vocabulary', name: 'Common action verbs', prerequisites: [], misconceptions: ['mixing look/see/watch'] },
  { id: 'vocab.adjectives', domain: 'vocabulary', name: 'Descriptive adjectives', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['opposite pairs reversed'] },

  // Grammar
  { id: 'grammar.present-simple', domain: 'grammar', name: 'Present simple & subject-verb agreement', prerequisites: [], misconceptions: ['dropping -s on 3rd person singular'] },
  { id: 'grammar.articles-prepositions', domain: 'grammar', name: 'Articles & prepositions', prerequisites: ['grammar.present-simple'], misconceptions: ['in/on/at for time & place'] },
  { id: 'grammar.questions-negatives', domain: 'grammar', name: 'Questions & negatives (do/does)', prerequisites: ['grammar.present-simple'], misconceptions: ['double negation; wrong auxiliary'] },
  { id: 'grammar.tense-past', domain: 'grammar', name: 'Past simple', prerequisites: ['grammar.present-simple'], misconceptions: ['irregular verbs regularized (goed)'] },

  // Reading
  { id: 'reading.main-idea', domain: 'reading', name: 'Main idea & gist', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['picking a detail as the main idea'] },
  { id: 'reading.detail', domain: 'reading', name: 'Locating specific detail', prerequisites: [], misconceptions: ['matching a keyword without meaning'] },
  { id: 'reading.inference', domain: 'reading', name: 'Simple inference', prerequisites: ['reading.main-idea', 'reading.detail'], misconceptions: ['over-literal reading'] },

  // Conversation / functional language
  { id: 'convo.greetings-politeness', domain: 'conversation', name: 'Greetings & polite expressions', prerequisites: [], misconceptions: ['formal/informal register mismatch'] },
  { id: 'convo.requests-responses', domain: 'conversation', name: 'Requests, offers & responses', prerequisites: ['convo.greetings-politeness'], misconceptions: ['answering a different function than asked'] },
  { id: 'convo.directions', domain: 'conversation', name: 'Asking for & giving directions', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['left/right & preposition confusion'] },
]

const BY_ID = new Map(SUBSKILLS.map((s) => [s.id, s]))
const BY_DOMAIN = new Map<OnetDomain, Subskill[]>()
for (const s of SUBSKILLS) {
  const arr = BY_DOMAIN.get(s.domain) ?? []
  arr.push(s)
  BY_DOMAIN.set(s.domain, arr)
}

export function getSubskill(id: string): Subskill | undefined { return BY_ID.get(id) }
export function subskillsForDomain(domain: OnetDomain): Subskill[] { return BY_DOMAIN.get(domain) ?? [] }

/** A safe default subskill for a domain — the first, prerequisite-free entry. */
export function defaultSubskillFor(domain: OnetDomain): Subskill {
  const list = subskillsForDomain(domain)
  return list.find((s) => s.prerequisites.length === 0) ?? list[0]
}
