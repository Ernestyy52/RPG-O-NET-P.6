import { describe, expect, it } from 'vitest'
import {
  monsterKnowledgeArchetype, selectMonsterQuestion,
} from '~/data/monsterKnowledge'

describe('monster knowledge questions', () => {
  it('maps monster families to distinct learning identities', () => {
    expect(monsterKnowledgeArchetype('forest_slime')).toBe('slime')
    expect(monsterKnowledgeArchetype('clockwork_golem')).toBe('construct')
    expect(monsterKnowledgeArchetype('moon_wisp')).toBe('spirit')
    expect(monsterKnowledgeArchetype('anything', true)).toBe('boss')
  })

  it('does not repeat a question for the same monster before its affinity bag is exhausted', () => {
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      const pick = selectMonsterQuestion({
        monsterId: 'forest_slime', floor: 2, difficulty: 1, seenIds: seen, rng: () => 0.25,
      })
      expect(pick).not.toBeNull()
      expect(seen).not.toContain(pick!.question.id)
      seen.push(pick!.question.id)
    }
    expect(new Set(seen).size).toBe(4)
  })

  it('returns only questions carrying knowledge taxonomy provenance', () => {
    const pick = selectMonsterQuestion({ monsterId: 'clockwork_golem', floor: 45, difficulty: 3, rng: () => 0.5 })
    expect(pick).not.toBeNull()
    expect(pick!.question.subskillId || pick!.question.patternId).toBeTruthy()
  })
})
