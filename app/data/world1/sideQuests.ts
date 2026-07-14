// ================================================================================================
// World 1 — side quests (Phase 14 Inc 4)
//
// NPC-given, INDEPENDENT quests (not a linear chain): each is accepted, tracked, and claimed on its
// own. Kinds go beyond a bare kill-counter (hunt / fetch / vocab / explore / study) so content varies,
// and every quest is offline-completable with a DETERMINISTIC trigger reused from the main-quest model
// (no RNG-gated step). Progress is a simple per-quest count/flag advanced by the same QuestEvents.
// ================================================================================================
import type { QuestTrigger, QuestReward, QuestEvent } from './quests'

export type SideQuestKind = 'hunt' | 'fetch' | 'vocab' | 'explore' | 'study'

export interface SideQuest {
  id: string
  npc: string
  title: string
  titleTh: string
  summary: string
  kind: SideQuestKind
  trigger: QuestTrigger
  reward: QuestReward
}

/** ≥8 varied World-1 side quests. */
export const WORLD1_SIDE_QUESTS: SideQuest[] = [
  {
    id: 'sq_slime_cull', npc: 'forest_ranger', kind: 'hunt',
    title: 'Slime Cull', titleTh: 'กำจัดสไลม์',
    summary: 'The ranger asks you to defeat 5 slimes to keep the trail clear.',
    trigger: { kind: 'defeat-monsters', count: 5 }, reward: { exp: 50, gold: 35, gems: 0 },
  },
  {
    id: 'sq_word_hunter', npc: 'guildmaster', kind: 'vocab',
    title: 'Word Hunter', titleTh: 'นักล่าคำศัพท์',
    summary: 'Prove your English: answer 8 questions correctly for the guildmaster.',
    trigger: { kind: 'answer-correct', count: 8 }, reward: { exp: 70, gold: 40, gems: 0 },
  },
  {
    id: 'sq_gather_gel', npc: 'blacksmith', kind: 'fetch',
    title: 'Gel for the Forge', titleTh: 'เจลสำหรับเตาหลอม',
    summary: 'The blacksmith needs slime gel. Defeat 3 slimes to gather enough.',
    trigger: { kind: 'defeat-monsters', count: 3 }, reward: { exp: 40, gold: 45, gems: 0 },
  },
  {
    id: 'sq_scout_floor4', npc: 'forest_ranger', kind: 'explore',
    title: 'Scout the Trail', titleTh: 'สำรวจเส้นทาง',
    summary: 'Scout ahead — reach Floor 4 and report what you find.',
    trigger: { kind: 'reach-floor', floor: 4 }, reward: { exp: 45, gold: 30, gems: 0 },
  },
  {
    id: 'sq_grotto_delve', npc: 'portal_guardian', kind: 'explore',
    title: 'Delve the Grotto', titleTh: 'สำรวจถ้ำ',
    summary: 'Step into the floor-5 grotto and see what lurks inside.',
    trigger: { kind: 'enter-dungeon', layoutId: 'world01-mini' }, reward: { exp: 65, gold: 45, gems: 1 },
  },
  {
    id: 'sq_study_hall', npc: 'guildmaster', kind: 'study',
    title: 'Diligent Student', titleTh: 'นักเรียนขยัน',
    summary: 'Keep practicing: answer 12 questions correctly across your adventures.',
    trigger: { kind: 'answer-correct', count: 12 }, reward: { exp: 90, gold: 55, gems: 1 },
  },
  {
    id: 'sq_deep_hunt', npc: 'forest_ranger', kind: 'hunt',
    title: 'Deep Woods Hunt', titleTh: 'ล่าในป่าลึก',
    summary: 'The deeper woods are dangerous. Defeat 10 monsters to thin their numbers.',
    trigger: { kind: 'defeat-monsters', count: 10 }, reward: { exp: 110, gold: 70, gems: 1 },
  },
  {
    id: 'sq_approach_scout', npc: 'portal_guardian', kind: 'explore',
    title: 'The Colossus Approach', titleTh: 'สำรวจทางสู่โคลอสซัส',
    summary: 'Enter the floor-10 approach dungeon to prepare for the boss.',
    trigger: { kind: 'enter-dungeon', layoutId: 'world01-main' }, reward: { exp: 120, gold: 80, gems: 1 },
  },
  {
    id: 'sq_climbers_pride', npc: 'guildmaster', kind: 'explore',
    title: 'Climber\'s Pride', titleTh: 'ความภูมิใจของนักปีน',
    summary: 'Reach Floor 7 to prove your steady climb through the Verdant world.',
    trigger: { kind: 'reach-floor', floor: 7 }, reward: { exp: 85, gold: 50, gems: 0 },
  },
]

/** Advance one side quest's progress by an event. Returns the new (capped) progress; unrelated ⇒ unchanged. */
export function advanceSideQuest(quest: SideQuest, progress: number, event: QuestEvent): number {
  const t = quest.trigger
  switch (t.kind) {
    case 'defeat-monsters': return event.type === 'defeat-monster' ? Math.min(t.count, progress + 1) : progress
    case 'answer-correct': return event.type === 'answer-correct' ? Math.min(t.count, progress + 1) : progress
    case 'reach-floor': return event.type === 'reach-floor' && event.floor >= t.floor ? 1 : progress
    case 'enter-dungeon': return event.type === 'enter-dungeon' && event.layoutId === t.layoutId ? 1 : progress
    case 'clear-dungeon': return event.type === 'clear-dungeon' && event.layoutId === t.layoutId ? 1 : progress
    case 'talk-npc': return event.type === 'talk-npc' && event.npcId === t.npcId ? 1 : progress
    case 'find-secret': return event.type === 'find-secret' && event.secretId === t.secretId ? 1 : progress
    case 'defeat-boss': return event.type === 'defeat-boss' && event.bossId === t.bossId ? 1 : progress
  }
}

/** The count needed to finish a quest (a count trigger's count, else 1 for a flag trigger). */
export function sideQuestTarget(quest: SideQuest): number {
  const t = quest.trigger
  return t.kind === 'defeat-monsters' || t.kind === 'answer-correct' ? t.count : 1
}

/** True when a quest's progress has reached its target. */
export function isSideQuestDone(quest: SideQuest, progress: number): boolean {
  return progress >= sideQuestTarget(quest)
}

const SIDE_QUEST_BY_ID = new Map(WORLD1_SIDE_QUESTS.map((q) => [q.id, q]))
export function getSideQuest(id: string): SideQuest | undefined { return SIDE_QUEST_BY_ID.get(id) }
