// ================================================================================================
// Knowledge Break (Phase 10)
//
// The bridge between real-time combat (Phase 09) and the learning loop (Phase 06). During a fight a
// "Knowledge Break" occasionally interrupts the action to pose one reviewed question; answering feeds
// the learner's mastery (applyAnswer/summarizeSession) and empowers the hero. This controller is a
// pure, framework-agnostic state machine — the scene drives it and applies the returned combat effect
// to its RealtimeCombat instance.
//
// Phase 10 gate properties, by construction:
//  • Not every hit. A break opens only after `attacksPerBreak` hero attacks AND a `minBreakGapMs`
//    cooldown, and never while one is already open.
//  • One wrong answer ≠ instant death. Resolving a break NEVER touches HP; a wrong answer only costs
//    the empower (combo reset). The scene pauses the monster's assault while a break is open, so a
//    wrong answer cannot be lethal by itself.
//  • Learning state updates. Every answer is recorded and folded into mastery via summarizeSession.
//  • Scene changes don't duplicate/lock events. open()/resolve() are guarded by phase (idempotent — no
//    double-open, no double-resolve) and cancel() safely clears an open break on teardown.
//  • No-question fallback. If no reviewed question is selectable, open() returns null and combat
//    simply continues (no break, no lock).
// ================================================================================================
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { selectQuestion, type LearningMode } from './selector'
import { summarizeSession, type AnswerRecord, type SessionSummary } from './summary'
import type { SubskillMastery } from './mastery'

/** Rollback flag (Phase 10). Dormant — no rendered combat drives Knowledge Break until World 1. */
export const KNOWLEDGE_BREAK_ENABLED = true

export interface KnowledgeBreakConfig {
  /** open a break only after this many hero attacks — so NOT every hit triggers a question. */
  attacksPerBreak: number
  /** minimum ms between the end of one break and the start of the next. */
  minBreakGapMs: number
}

export const DEFAULT_KNOWLEDGE_BREAK_CONFIG: KnowledgeBreakConfig = {
  attacksPerBreak: 3,
  minBreakGapMs: 4000,
}

export type BreakPhase = 'idle' | 'open'

export interface OpenBreak {
  question: CurriculumQuestion
  openedAt: number
}

/** Combat effect the scene applies to RealtimeCombat. Neither value carries HP — never lethal. */
export type BreakEffect = 'empower' | 'combo-lost'

export interface BreakResolution {
  correct: boolean
  question: CurriculumQuestion
  record: AnswerRecord
  effect: BreakEffect
}

export interface OpenOptions {
  now: number
  pool: CurriculumQuestion[]
  mastery: Record<string, SubskillMastery>
  rng: () => number
  mode?: LearningMode
  avoidRecent?: number
}

export class KnowledgeBreakController {
  private phase: BreakPhase = 'idle'
  private current: OpenBreak | null = null
  private attackCounter = 0
  private lastBreakEndAt = -Infinity
  private readonly records: AnswerRecord[] = []
  private readonly recentIds: string[] = []

  constructor(private readonly cfg: KnowledgeBreakConfig = DEFAULT_KNOWLEDGE_BREAK_CONFIG) {}

  get isOpen(): boolean { return this.phase === 'open' }
  get openBreak(): OpenBreak | null { return this.current }
  get answeredCount(): number { return this.records.length }
  /** A copy of the recorded answers (for inspection/tests). */
  get answers(): AnswerRecord[] { return [...this.records] }

  /** Count a hero attack toward the next break. Call once per landed hero attack. */
  registerHeroAttack(): void {
    if (this.phase === 'open') return
    this.attackCounter += 1
  }

  /** Whether the cadence + cooldown allow a break to open right now (before question selection). */
  breakReady(now: number): boolean {
    return this.phase === 'idle'
      && this.attackCounter >= this.cfg.attacksPerBreak
      && (now - this.lastBreakEndAt) >= this.cfg.minBreakGapMs
  }

  /**
   * Try to open a break. Returns the open break, or null when it's not due yet, one is already
   * mid-flight (idempotent — returns the existing open break, never a second one), or no reviewed
   * question is selectable (no-question fallback ⇒ combat continues).
   */
  open(opts: OpenOptions): OpenBreak | null {
    if (this.phase === 'open') return this.current
    if (!this.breakReady(opts.now)) return null
    const question = selectQuestion(opts.pool, opts.mastery, {
      now: opts.now,
      mode: opts.mode ?? 'adventure',
      rng: opts.rng,
      recentIds: this.recentIds,
      avoidRecent: opts.avoidRecent,
    })
    if (!question) return null // fallback: stay in combat, retry after the next attacks
    this.phase = 'open'
    this.current = { question, openedAt: opts.now }
    this.recentIds.push(question.id)
    this.attackCounter = 0
    return this.current
  }

  /**
   * Resolve the open break with the chosen answer index. Records the answer for the learning summary
   * and returns the combat effect. A second call (or a call with no break open) returns null — no
   * duplicate learning record and no duplicate combat effect.
   */
  resolve(choiceIndex: number, opts: { now: number; responseMs?: number }): BreakResolution | null {
    if (this.phase !== 'open' || !this.current) return null
    const q = this.current.question
    const correct = choiceIndex === q.answerIndex
    const record: AnswerRecord = {
      subskillId: q.subskillId,
      correct,
      responseMs: opts.responseMs,
      questionId: q.id,
      misconception: correct ? undefined : q.misconceptions?.[0],
    }
    this.records.push(record)
    this.phase = 'idle'
    this.current = null
    this.lastBreakEndAt = opts.now
    return { correct, question: q, record, effect: correct ? 'empower' : 'combo-lost' }
  }

  /** Close an open break WITHOUT recording an answer — safe to call on scene shutdown (no lock). */
  cancel(now: number): void {
    if (this.phase !== 'open') return
    this.phase = 'idle'
    this.current = null
    this.lastBreakEndAt = now
  }

  /** Fold every recorded answer into a session summary + updated mastery (delegates to Phase 06). */
  summarize(masteryBefore: Record<string, SubskillMastery>, now: number): { summary: SessionSummary; masteryAfter: Record<string, SubskillMastery> } {
    return summarizeSession(masteryBefore, this.records, now)
  }
}
