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
  { id: 'vocab.phonics-sounds', domain: 'vocabulary', name: 'Phonics & sound discrimination', prerequisites: [], misconceptions: ['judging sound from spelling (book/moon both "oo")'] },
  { id: 'vocab.in-context', domain: 'vocabulary', name: 'Vocabulary in context (cloze)', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['picking a dictionary meaning over the passage-supported one', 'near-form word confusion (threat/treat)'] },
  { id: 'vocab.culture-holidays', domain: 'vocabulary', name: 'Festivals, holidays & culture', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['fixed-date answer for a variable-date event'] },

  // Grammar
  { id: 'grammar.present-simple', domain: 'grammar', name: 'Present simple & subject-verb agreement', prerequisites: [], misconceptions: ['dropping -s on 3rd person singular'] },
  { id: 'grammar.articles-prepositions', domain: 'grammar', name: 'Articles & prepositions', prerequisites: ['grammar.present-simple'], misconceptions: ['in/on/at for time & place'] },
  { id: 'grammar.questions-negatives', domain: 'grammar', name: 'Questions & negatives (do/does, wh-)', prerequisites: ['grammar.present-simple'], misconceptions: ['double negation; wrong auxiliary', 'how many/how much confusion'] },
  { id: 'grammar.tense-past', domain: 'grammar', name: 'Past simple & past continuous', prerequisites: ['grammar.present-simple'], misconceptions: ['irregular verbs regularized (goed)', 'tense not matching a stated time marker'] },
  { id: 'grammar.comparatives', domain: 'grammar', name: 'Comparatives & superlatives', prerequisites: ['vocab.adjectives'], misconceptions: ['comparison direction reversed', 'more + short adjective (more tall)'] },
  { id: 'grammar.modals', domain: 'grammar', name: 'Modal verbs (can/should/must)', prerequisites: ['grammar.present-simple'], misconceptions: ['modal + to-infinitive (can to run)', 'must/mustn\'t polarity'] },
  { id: 'grammar.conditionals', domain: 'grammar', name: 'Conditionals', prerequisites: ['grammar.tense-past'], misconceptions: ['will in the if-clause', 'mixed conditional forms'] },
  { id: 'grammar.perfect-tenses', domain: 'grammar', name: 'Perfect tenses', prerequisites: ['grammar.tense-past'], misconceptions: ['since/for confusion', 'past simple with already/yet'] },
  { id: 'grammar.clauses-passive', domain: 'grammar', name: 'Advanced structures (relative clauses, passive, inversion)', prerequisites: ['grammar.tense-past'], misconceptions: ['who/which/whose confusion', 'active form where passive is needed'] },
  { id: 'grammar.punctuation-intonation', domain: 'grammar', name: 'Punctuation & intonation', prerequisites: [], misconceptions: ['question mark on indirect questions', 'rising/falling intonation of wh- vs yes-no questions'] },

  // Reading
  { id: 'reading.main-idea', domain: 'reading', name: 'Main idea & gist', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['picking a detail as the main idea'] },
  { id: 'reading.detail', domain: 'reading', name: 'Locating specific detail', prerequisites: [], misconceptions: ['matching a keyword without meaning', 'missing a NOT in the question'] },
  { id: 'reading.inference', domain: 'reading', name: 'Simple inference', prerequisites: ['reading.main-idea', 'reading.detail'], misconceptions: ['over-literal reading', 'over-generalizing a specific stated fact'] },
  { id: 'reading.signs-notices', domain: 'reading', name: 'Signs, notices & public information', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['confusing near-identical signs', 'missing a condition (age, day, time) in a notice'] },
  { id: 'reading.data-interpretation', domain: 'reading', name: 'Data, tables & word problems', prerequisites: ['reading.detail'], misconceptions: ['comparison direction reversed', 'ignoring one constraint in a word problem'] },

  // Conversation / functional language
  { id: 'convo.greetings-politeness', domain: 'conversation', name: 'Greetings & polite expressions', prerequisites: [], misconceptions: ['formal/informal register mismatch'] },
  { id: 'convo.requests-responses', domain: 'conversation', name: 'Requests, offers & responses', prerequisites: ['convo.greetings-politeness'], misconceptions: ['answering a different function than asked', 'echoing the prompt instead of responding'] },
  { id: 'convo.directions', domain: 'conversation', name: 'Asking for & giving directions', prerequisites: ['vocab.everyday-nouns'], misconceptions: ['left/right & preposition confusion'] },
  { id: 'convo.reverse-question', domain: 'conversation', name: 'Reverse completion (find the question)', prerequisites: ['convo.requests-responses'], misconceptions: ['choosing a question that elicits a related but different answer'] },
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
