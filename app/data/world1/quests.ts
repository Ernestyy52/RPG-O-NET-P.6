// ================================================================================================
// World 1 — main quest chain (Phase 14 Inc 4)
//
// The narrative spine of the Verdant Slimes world (floors 1–10, boss Myco Colossus). A linear,
// DATA-DRIVEN chain: town → forest field → floor-5 mini dungeon → deeper field → floor-10 main dungeon
// → boss. Every step is completable OFFLINE and its trigger is DETERMINISTIC — no step gates on an
// RNG-only drop (Phase-14 gate: "no soft lock / no RNG-gated quest steps"). The progression is a pure
// reducer so the whole chain is unit-testable without Phaser/store; the player store just feeds events.
//
// Environmental English: each step's `summary` is short, readable Grade-6 English (signs/NPC dialogue),
// with a Thai title for scaffolding. Question CONTENT still flows only through knowledge/ → questions.json
// (constitution rule 2); these summaries are narrative UI copy, not assessed items.
// ================================================================================================

export type World1DungeonId = 'world01-mini' | 'world01-main'

/** All triggers are deterministic + offline. There is deliberately no `random-drop`/RNG kind. */
export type QuestTrigger =
  | { kind: 'talk-npc'; npcId: string }
  | { kind: 'reach-floor'; floor: number }
  | { kind: 'reach-zone'; zoneId: string }
  | { kind: 'defeat-monsters'; count: number }
  | { kind: 'answer-correct'; count: number }
  | { kind: 'find-secret'; secretId: string }
  | { kind: 'enter-dungeon'; layoutId: World1DungeonId }
  | { kind: 'clear-dungeon'; layoutId: World1DungeonId }
  | { kind: 'defeat-boss'; bossId: string }

export interface QuestReward { exp: number; gold: number; gems: number }

export interface QuestStep {
  id: string
  title: string
  titleTh: string
  /** short narrative + instruction, readable Grade-6 English (environmental English). */
  summary: string
  /** npc id that gives/advances this step (for NPC wiring + dialogue). */
  giver: string
  trigger: QuestTrigger
  reward: QuestReward
}

/** The 12-step World-1 main quest. Ordered; index is the step number. */
export const WORLD1_MAIN_QUEST: QuestStep[] = [
  {
    id: 'w1_call_to_adventure', title: 'The Guildmaster\'s Call', titleTh: 'เสียงเรียกจากหัวหน้ากิลด์',
    summary: 'The guildmaster needs a brave student. Talk to her at the Guild Hall to begin.',
    giver: 'guildmaster', trigger: { kind: 'talk-npc', npcId: 'guildmaster' },
    reward: { exp: 20, gold: 15, gems: 0 },
  },
  {
    id: 'w1_into_the_forest', title: 'Into the Verdant Forest', titleTh: 'สู่ป่าเวอร์แดนต์',
    summary: 'Slimes have woken beyond Aethergate. Travel to Whisperleaf Fields and investigate.',
    giver: 'guildmaster', trigger: { kind: 'reach-zone', zoneId: 'whisperleaf-meadow' },
    reward: { exp: 30, gold: 20, gems: 0 },
  },
  {
    id: 'w1_thin_the_swarm', title: 'Thin the Swarm', titleTh: 'ลดจำนวนสไลม์',
    summary: 'The slimes are many. Defeat 3 of them to make the path safe.',
    giver: 'forest_ranger', trigger: { kind: 'defeat-monsters', count: 3 },
    reward: { exp: 45, gold: 30, gems: 0 },
  },
  {
    id: 'w1_words_of_power', title: 'Words of Power', titleTh: 'พลังของคำศัพท์',
    summary: 'Knowledge is your weapon. Answer 5 questions correctly to sharpen your mind.',
    giver: 'forest_ranger', trigger: { kind: 'answer-correct', count: 5 },
    reward: { exp: 55, gold: 35, gems: 0 },
  },
  {
    id: 'w1_grotto_path', title: 'The Grotto Path', titleTh: 'เส้นทางสู่ถ้ำ',
    summary: 'The ranger marks a route through the forest. Reach Rootcellar Trail, where a cave waits.',
    giver: 'forest_ranger', trigger: { kind: 'reach-zone', zoneId: 'mosswood-trail' },
    reward: { exp: 60, gold: 40, gems: 1 },
  },
  {
    id: 'w1_enter_grotto', title: 'The Slime Grotto', titleTh: 'ถ้ำสไลม์',
    summary: 'A cave opens beneath Rootcellar Trail. Enter the grotto and explore its chamber.',
    giver: 'portal_guardian', trigger: { kind: 'enter-dungeon', layoutId: 'world01-mini' },
    reward: { exp: 70, gold: 45, gems: 0 },
  },
  {
    id: 'w1_clear_grotto', title: 'Grotto Guardian', titleTh: 'ผู้พิทักษ์ถ้ำ',
    summary: 'A sub-boss guards the grotto. Clear the chamber to prove your strength.',
    giver: 'portal_guardian', trigger: { kind: 'clear-dungeon', layoutId: 'world01-mini' },
    reward: { exp: 90, gold: 60, gems: 1 },
  },
  {
    id: 'w1_guardians_warning', title: 'The Guardian\'s Warning', titleTh: 'คำเตือนของผู้พิทักษ์',
    summary: 'The portal guardian has news about the Colossus. Speak with him.',
    giver: 'portal_guardian', trigger: { kind: 'talk-npc', npcId: 'portal_guardian' },
    reward: { exp: 80, gold: 50, gems: 0 },
  },
  {
    id: 'w1_deeper_still', title: 'Deeper Still', titleTh: 'ลึกลงไปอีก',
    summary: 'The forest grows darker. Follow the trail into the Deepgrove hunting grounds.',
    giver: 'portal_guardian', trigger: { kind: 'reach-zone', zoneId: 'deepgrove' },
    reward: { exp: 100, gold: 65, gems: 0 },
  },
  {
    id: 'w1_approach', title: 'The Colossus Approach', titleTh: 'ทางสู่โคลอสซัส',
    summary: 'The great dungeon lies at the heart of Verdant Frontier. Enter the Colossus Approach.',
    giver: 'portal_guardian', trigger: { kind: 'enter-dungeon', layoutId: 'world01-main' },
    reward: { exp: 110, gold: 70, gems: 1 },
  },
  {
    id: 'w1_break_the_line', title: 'Break the Line', titleTh: 'ฝ่าแนวป้องกัน',
    summary: 'Elites guard the approach. Clear the dungeon and reach the boss gate.',
    giver: 'portal_guardian', trigger: { kind: 'clear-dungeon', layoutId: 'world01-main' },
    reward: { exp: 140, gold: 90, gems: 1 },
  },
  {
    id: 'w1_myco_colossus', title: 'The Myco Colossus', titleTh: 'ไมโค โคลอสซัส',
    summary: 'The world boss awaits. Defeat the Myco Colossus to free the forest.',
    giver: 'portal_guardian', trigger: { kind: 'defeat-boss', bossId: 'myco_colossus' },
    reward: { exp: 220, gold: 150, gems: 3 },
  },
]

// ---- Pure progression reducer -----------------------------------------------------------------

/** Serializable main-quest progress. `step` = active step index; `progress` = count toward a count trigger. */
export interface MainQuestState {
  step: number
  progress: number
}

export const INITIAL_MAIN_QUEST_STATE: MainQuestState = { step: 0, progress: 0 }

/** Player-driven events the reducer consumes. Deterministic; mirror real World-1 actions. */
export type QuestEvent =
  | { type: 'talk-npc'; npcId: string }
  | { type: 'reach-floor'; floor: number }
  | { type: 'reach-zone'; zoneId: string }
  | { type: 'defeat-monster' }
  | { type: 'answer-correct' }
  | { type: 'find-secret'; secretId: string }
  | { type: 'enter-dungeon'; layoutId: World1DungeonId }
  | { type: 'clear-dungeon'; layoutId: World1DungeonId }
  | { type: 'defeat-boss'; bossId: string }

/** True when the chain is fully complete. */
export function isMainQuestComplete(state: MainQuestState, chain: QuestStep[] = WORLD1_MAIN_QUEST): boolean {
  return state.step >= chain.length
}

/** The active step, or undefined when the chain is finished. */
export function activeStep(state: MainQuestState, chain: QuestStep[] = WORLD1_MAIN_QUEST): QuestStep | undefined {
  return chain[state.step]
}

/** Progress fraction toward the active step (count triggers show partial; boolean triggers are 0→1). */
export function stepProgress(state: MainQuestState, chain: QuestStep[] = WORLD1_MAIN_QUEST): { current: number; target: number } {
  const step = chain[state.step]
  if (!step) return { current: 1, target: 1 }
  const t = step.trigger
  const target = t.kind === 'defeat-monsters' || t.kind === 'answer-correct' ? t.count : 1
  return { current: Math.min(state.progress, target), target }
}

/** Does this event satisfy (or progress) the trigger? Returns the new count-progress, or -1 if unrelated. */
function applyToTrigger(trigger: QuestTrigger, progress: number, event: QuestEvent): number {
  switch (trigger.kind) {
    case 'talk-npc': return event.type === 'talk-npc' && event.npcId === trigger.npcId ? 1 : -1
    case 'reach-floor': return event.type === 'reach-floor' && event.floor >= trigger.floor ? 1 : -1
    case 'reach-zone': return event.type === 'reach-zone' && event.zoneId === trigger.zoneId ? 1 : -1
    case 'defeat-monsters': return event.type === 'defeat-monster' ? progress + 1 : -1
    case 'answer-correct': return event.type === 'answer-correct' ? progress + 1 : -1
    case 'find-secret': return event.type === 'find-secret' && event.secretId === trigger.secretId ? 1 : -1
    case 'enter-dungeon': return event.type === 'enter-dungeon' && event.layoutId === trigger.layoutId ? 1 : -1
    case 'clear-dungeon': return event.type === 'clear-dungeon' && event.layoutId === trigger.layoutId ? 1 : -1
    case 'defeat-boss': return event.type === 'defeat-boss' && event.bossId === trigger.bossId ? 1 : -1
  }
}

/**
 * Advance the main quest by one event. Pure. When the event completes the active step, returns the
 * completed step so the caller can grant its reward EXACTLY once (advancing is the idempotency — a step
 * completes a single time). Unrelated events are a no-op. Never regresses; safe to replay.
 */
export function advanceMainQuest(
  state: MainQuestState,
  event: QuestEvent,
  chain: QuestStep[] = WORLD1_MAIN_QUEST,
): { state: MainQuestState; completed?: QuestStep } {
  const step = chain[state.step]
  if (!step) return { state } // chain finished

  const next = applyToTrigger(step.trigger, state.progress, event)
  if (next < 0) return { state } // event doesn't touch the active step

  const t = step.trigger
  const target = t.kind === 'defeat-monsters' || t.kind === 'answer-correct' ? t.count : 1
  if (next >= target) {
    return { state: { step: state.step + 1, progress: 0 }, completed: step }
  }
  return { state: { step: state.step, progress: next } }
}
