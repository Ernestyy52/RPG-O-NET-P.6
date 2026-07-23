import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ACADEMY_KNOWLEDGE_YEARS, ACADEMY_PATTERN_COUNT, ACADEMY_TUTORS, academyLessons } from '~/data/academy'
import { AETHERGATE_DOOR_POINTS, pointInDoorRect, townDoorTriggerRect } from '~/data/town/doors'
import { allInteriorNpcs, getInterior, INTERIOR_TOWN_DOORS, TOWN_INTERIORS } from '~/data/town/interiors'
import { usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

describe('physical NPC service contract', () => {
  it('keeps town door hitboxes close to the visible threshold', () => {
    const rect = townDoorTriggerRect([240, 300], 1.5)
    expect(rect[2] - rect[0]).toBe(60)
    expect(rect[3] - rect[1]).toBe(36)
    expect(pointInDoorRect(360, 450, rect)).toBe(true)
    expect(pointInDoorRect(300, 390, rect)).toBe(false)
  })

  it('spawns outside the same trigger after leaving every exterior room', () => {
    for (const spec of TOWN_INTERIORS.filter((room) => room.id !== 'guild-academy')) {
      const returnAt = INTERIOR_TOWN_DOORS[spec.id]!
      expect(returnAt, spec.id).toBeDefined()
      const visibleDoor = AETHERGATE_DOOR_POINTS[spec.id as keyof typeof AETHERGATE_DOOR_POINTS]
      expect(pointInDoorRect(returnAt[0], returnAt[1], townDoorTriggerRect(visibleDoor)), spec.id).toBe(false)
    }
  })

  it('assigns an explicit service to every physical NPC', () => {
    for (const room of TOWN_INTERIORS) {
      for (const npc of allInteriorNpcs(room)) expect(npc.service, `${room.id}/${npc.id}`).toBeTruthy()
    }
  })
})

describe('Guild Academy 2F', () => {
  it('covers all five O-NET domains with one tutor and real lessons per room', () => {
    expect(ACADEMY_TUTORS.map((tutor) => tutor.category).sort()).toEqual(['conversation', 'grammar', 'reading', 'strategy', 'vocabulary'])
    for (const tutor of ACADEMY_TUTORS) expect(academyLessons(tutor.category).length, tutor.category).toBeGreaterThan(0)
    expect(allInteriorNpcs(getInterior('guild-academy')!)).toHaveLength(5)
    expect(ACADEMY_KNOWLEDGE_YEARS).toContain('2558–2568')
    expect(ACADEMY_PATTERN_COUNT).toBe(456)
  })

  it('records a lesson reward once and remains save-safe', () => {
    const player = usePlayerStore()
    const beforeGold = player.gold
    expect(player.completeAcademyLesson('g_wh')).toBe(true)
    expect(player.completeAcademyLesson('g_wh')).toBe(false)
    expect(player.academyLessonsCompleted).toEqual(['g_wh'])
    expect(player.gold).toBe(beforeGold + 6)
  })
})

