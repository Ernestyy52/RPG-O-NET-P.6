import { defineStore } from 'pinia'
import type { SubskillMastery } from '~/data/learning/mastery'
import type { SessionSummary } from '~/data/learning/summary'

// ================================================================================================
// Learning store (Phase 14 Inc 3 — flip #4 support)
//
// Per-subskill mastery + the most recent session summary, persisted in its OWN localStorage key
// ("learning") — completely SEPARATE from the sacred `player` save blob (constitution rule 5; the
// player-schema/envelope migration path is untouched by this additive store). This upholds the
// learning ↔ combat firewall (ADR 0003): mastery is written ONLY by the learning loop (Knowledge
// Break → summarizeSession) and is NEVER read to scale combat power. Empty default = a fresh learner;
// an old profile with no learning key simply starts empty.
// ================================================================================================
export const useLearningStore = defineStore('learning', {
  state: () => ({
    mastery: {} as Record<string, SubskillMastery>,
    lastSummary: null as SessionSummary | null,
    sessionsCompleted: 0,
  }),
  getters: {
    totalAnswered: (state) => Object.values(state.mastery).reduce((s, m) => s + m.attempts, 0),
    totalCorrect: (state) => Object.values(state.mastery).reduce((s, m) => s + m.correct, 0),
  },
  actions: {
    /** Persist the result of one Knowledge-Break session (mastery map + summary). Replaces the map
     *  wholesale with the post-session copy produced by summarizeSession (pure, already merged). */
    applySessionResult(masteryAfter: Record<string, SubskillMastery>, summary: SessionSummary) {
      this.mastery = masteryAfter
      this.lastSummary = summary
      this.sessionsCompleted += 1
    },
  },
  persist: true,
})
