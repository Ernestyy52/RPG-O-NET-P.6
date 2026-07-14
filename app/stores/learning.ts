import { defineStore } from 'pinia'
import type { SubskillMastery } from '~/data/learning/mastery'
import type { SessionSummary } from '~/data/learning/summary'
import {
  ADAPTIVE_EXPEDITIONS_ENABLED, generateExpedition, evaluateExpedition,
  type Expedition, type ExpeditionProgress, type ObjectiveReward,
} from '~/data/learning/expedition'
import { CURRICULUM_QUESTIONS } from '~/data/curriculum/adapter'
import { getSubskill, type OnetDomain } from '~/data/curriculum/taxonomy'

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
    // ---- Adaptive expedition (flip #7). All fields empty-default ⇒ inert while the flag is off. ----
    expeditionDate: '' as string,
    expedition: null as Expedition | null,
    /** correct-count per subskill snapshot at generation, so progress is a real DAILY delta. */
    expeditionBaseline: {} as Record<string, number>,
    expeditionBaselineTotals: { answered: 0, correct: 0 },
    /** objective ids already claimed today (idempotent — reward granted once). */
    claimedObjectives: [] as string[],
    lastExpeditionDate: '' as string,
  }),
  getters: {
    totalAnswered: (state) => Object.values(state.mastery).reduce((s, m) => s + m.attempts, 0),
    totalCorrect: (state) => Object.values(state.mastery).reduce((s, m) => s + m.correct, 0),
    /**
     * Live progress for today's expedition, derived as the DAILY delta of mastery vs the snapshot taken
     * when the expedition was generated. Precise for drill/variety/accuracy; review-due and capstone use
     * transparent proxies (all-correct-so-far / all-base-objectives-done) pending Inc-4 loop plumbing.
     */
    expeditionProgress(state): ExpeditionProgress {
      const correctBySubskill: Record<string, number> = {}
      const domains = new Set<OnetDomain>()
      for (const [sub, m] of Object.entries(state.mastery)) {
        const delta = m.correct - (state.expeditionBaseline[sub] ?? 0)
        if (delta > 0) {
          correctBySubskill[sub] = delta
          const d = getSubskill(sub)?.domain
          if (d) domains.add(d)
        }
      }
      const answered = this.totalAnswered - state.expeditionBaselineTotals.answered
      const correct = this.totalCorrect - state.expeditionBaselineTotals.correct
      return {
        correctBySubskill,
        dueCleared: correct, // proxy: correct answers cleared today (Inc-4 will use the real due queue)
        domainsPracticed: [...domains],
        accuracy: answered > 0 ? correct / answered : 0,
        capstoneCleared: false, // finalized in expeditionResult once the base objectives are complete
      }
    },
    /** Per-objective completion for today's expedition (capstone completes when every other objective does). */
    expeditionResult(state) {
      if (!state.expedition) return null
      const base = evaluateExpedition(state.expedition, this.expeditionProgress)
      const nonCapstone = base.objectives.filter((o) => !o.id.startsWith('capstone'))
      const capstoneDone = nonCapstone.length > 0 && nonCapstone.every((o) => o.complete)
      return evaluateExpedition(state.expedition, { ...this.expeditionProgress, capstoneCleared: capstoneDone })
    },
  },
  actions: {
    /** Persist the result of one Knowledge-Break session (mastery map + summary). Replaces the map
     *  wholesale with the post-session copy produced by summarizeSession (pure, already merged). */
    applySessionResult(masteryAfter: Record<string, SubskillMastery>, summary: SessionSummary) {
      this.mastery = masteryAfter
      this.lastSummary = summary
      this.sessionsCompleted += 1
    },
    /** Generate (once per day) today's adaptive expedition and snapshot the progress baseline. Flag-gated. */
    ensureExpedition(date: string) {
      if (!ADAPTIVE_EXPEDITIONS_ENABLED) return
      if (this.expeditionDate === date && this.expedition) return
      this.expedition = generateExpedition(CURRICULUM_QUESTIONS, {
        date, minutes: 10, mode: 'adventure',
        masteryBySubskill: this.mastery,
        lastSessionDate: this.lastExpeditionDate || undefined,
      })
      this.expeditionDate = date
      this.lastExpeditionDate = date
      this.expeditionBaseline = Object.fromEntries(Object.entries(this.mastery).map(([k, m]) => [k, m.correct]))
      this.expeditionBaselineTotals = { answered: this.totalAnswered, correct: this.totalCorrect }
      this.claimedObjectives = []
    },
    /** Claim a completed objective exactly once; returns its reward for the caller to grant, or null. */
    claimExpeditionObjective(id: string): ObjectiveReward | null {
      if (!ADAPTIVE_EXPEDITIONS_ENABLED || !this.expedition) return null
      if (this.claimedObjectives.includes(id)) return null
      const result = this.expeditionResult
      if (!result?.objectives.find((o) => o.id === id && o.complete)) return null
      const objective = this.expedition.objectives.find((o) => o.id === id)
      if (!objective) return null
      this.claimedObjectives.push(id)
      return objective.reward
    },
  },
  persist: true,
})
