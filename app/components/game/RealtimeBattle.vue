<template>
  <!-- Bottom-docked action-lite HUD: the Phaser scene (live monster/boss sprite + telegraphs) stays
       visible ABOVE this panel, unlike the full-screen turn-based BattleModal. Dormant until
       REALTIME_COMBAT_ENABLED — the battle:start handler early-returns while the flag is false, so the
       live path is byte-identical and this component never mounts any combat. -->
  <!-- Knowledge Break: a centered interrupt that pauses the fight for one reviewed question. Shown
       only while a break is open (KNOWLEDGE_BREAK_ENABLED gates whether one ever opens). -->
  <div v-if="active && breakOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar"><h2 class="gold-text text-base font-bold">📖 Knowledge Break</h2><span class="text-xs opacity-75">{{ breakQuestion.cefr }}</span></div>
      <div class="pixel-window-body p-4">
        <p class="mb-3 text-sm">The monster's assault pauses — answer to empower your hero. (A wrong answer only costs your combo, never HP.)</p>
        <p class="mb-3 font-medium">{{ breakQuestion.prompt }}</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button v-for="(choice, i) in breakQuestion.choices" :key="i" class="btn-secondary text-left text-sm" @click="answerBreak(i)">{{ choice }}</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="active" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 sm:p-3">
    <div class="pointer-events-auto pixel-window w-full max-w-3xl">
      <div class="pixel-titlebar gap-3">
        <div>
          <h2 class="gold-text text-base font-bold">
            Floor {{ floor }} {{ isBoss ? 'Boss' : 'Battle' }}
            <span v-if="isBoss && phaseName" class="ml-2 rounded px-2 py-0.5 text-xs" :style="{ background: phaseCss, color: '#1a1208' }">
              Phase {{ phaseId }} · {{ phaseName }}
            </span>
          </h2>
          <p class="text-xs opacity-75">{{ cefr }} · {{ world.description }} · real-time</p>
        </div>
        <span class="text-xs">
          HP {{ Math.max(0, Math.round(heroHp)) }}/{{ maxHp }}
          <span class="mx-1 opacity-40">|</span>
          <span class="text-[#9db8ff]">MP {{ Math.round(mp) }}/{{ maxMp }}</span>
        </span>
      </div>

      <div class="pixel-window-body grid gap-3 p-3">
        <!-- combatants -->
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <div class="mb-1 flex justify-between text-xs"><span>{{ player.heroClass.name }}</span><span v-if="combo >= 2" class="gold-text font-bold">COMBO x{{ combo }} (+{{ Math.round(comboBonus * 100) }}%)</span></div>
            <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500 transition-all duration-150" :style="{ width: `${heroHpPct}%` }" /></div>
            <div class="mt-1 h-1.5 overflow-hidden rounded bg-black/40"><div class="h-full bg-[#5b7cff] transition-all duration-150" :style="{ width: `${mpPct}%` }" /></div>
          </div>
          <div class="flex-1">
            <div class="mb-1 flex justify-between text-xs" :class="{ 'battle-shake': monsterHit }"><span class="font-bold">{{ monster.name }}</span><span>{{ Math.max(0, Math.round(monsterHp)) }}/{{ monster.maxHp }}</span></div>
            <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full transition-all duration-150" :style="{ width: `${monsterHpPct}%`, background: isBoss ? phaseCss : '#ef4444' }" /></div>
          </div>
        </div>

        <p class="min-h-5 text-sm font-medium">{{ log }}</p>

        <!-- question: answering correct auto-attacks + builds combo/MP; wrong resets combo -->
        <p class="text-sm opacity-80">{{ question.prompt }}</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button v-for="(choice, i) in question.choices" :key="i" class="btn-secondary text-left text-sm disabled:opacity-50" :disabled="answerLock || breakOpen" @click="answer(i)">
            {{ choice }}
          </button>
        </div>

        <!-- skills: cooldowns come from the real-time engine (per-action, never per-frame) -->
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('attack')" @click="useSkill('attack')">Attack<span v-if="cd.attack > 0" class="cd-veil" :style="{ height: `${cdPct('attack')}%` }" /></button>
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('counter')" @click="useSkill('counter')">Counter <span class="opacity-70">{{ COUNTER_MP }}</span><span v-if="cd.counter > 0" class="cd-veil" :style="{ height: `${cdPct('counter')}%` }" /></button>
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('support')" @click="useSkill('support')">Support <span class="opacity-70">{{ SUPPORT_MP }}</span><span v-if="cd.support > 0" class="cd-veil" :style="{ height: `${cdPct('support')}%` }" /></button>
          <button class="btn-primary text-xs" :disabled="!hasPotion" @click="usePotion">Item</button>
          <button class="btn-secondary text-xs" :disabled="isBoss" @click="escape">Flee</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { gameEvents } from '~/game/systems/eventBus'
import { getFloorConfig, getQuestionDifficulty } from '~/data/floors'
import { cefrForFloor, getQuestionsForDifficulty, type Question } from '~/data/questions'
import { getWorldState, isWorld1Floor } from '~/data/world'
import { rollLoot } from '~/data/loot'
import { getItemById } from '~/data/equipment'
import {
  REALTIME_COMBAT_ENABLED, RealtimeCombat, type RealtimeSkillId,
  COUNTER_MP, SUPPORT_MP, RewardLedger, buildRewardRequest, comboBonus as domainComboBonus,
  escapeChance, gemsForEncounter, setupEncounter, supportHeal, REALTIME_SKILL_TIMINGS,
  MYCO_COLOSSUS_PHASES, initBossPhaseState, advanceBossPhase, bossPhaseSpec, type BossPhaseState,
} from '~/data/combat'
import { KNOWLEDGE_BREAK_ENABLED, KnowledgeBreakController } from '~/data/learning/knowledgeBreak'
import { CURRICULUM_QUESTIONS } from '~/data/curriculum/adapter'
import { mulberry32, seedFromString } from '~/data/learning/rng'
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { usePlayerStore } from '~/stores/player'
import { useLearningStore } from '~/stores/learning'

const runtimeConfig = useRuntimeConfig()
const player = usePlayerStore()
const learning = useLearningStore()

const active = ref(false)
const floor = ref(1)
const isBoss = ref(false)
const log = ref('')
const answerLock = ref(false)
const monsterHit = ref(false)

const world = computed(() => getWorldState())
const config = computed(() => getFloorConfig(floor.value))
const cefr = computed(() => cefrForFloor(floor.value))
const question = reactive<Question>({ id: '', category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1, prompt: '', choices: [], answerIndex: 0 })
const monster = reactive({ name: 'Slime', maxHp: 30, isMilestone: false })

// engine-driven reactive mirrors (the RealtimeCombat instance owns authoritative combat state)
const heroHp = ref(0)
const monsterHp = ref(0)
const mp = ref(0)
const combo = ref(0)
const cd = reactive<Record<RealtimeSkillId, number>>({ attack: 0, support: 0, counter: 0 })

// boss 3-phase readable channels (color here + banner; scene renders sprite tint/telegraph)
const phaseId = ref<1 | 2 | 3>(1)
const phaseName = ref('')
const phaseTint = ref(MYCO_COLOSSUS_PHASES.phases[0].tint)

const maxHp = computed(() => player.maxHp)
const maxMp = computed(() => player.maxMp)
const comboBonus = computed(() => domainComboBonus(combo.value))
const heroHpPct = computed(() => clampPct(heroHp.value, maxHp.value))
const mpPct = computed(() => clampPct(mp.value, maxMp.value))
const monsterHpPct = computed(() => clampPct(monsterHp.value, monster.maxHp))
const hasPotion = computed(() => (player.inventory.potion_s ?? 0) > 0 || (player.inventory.potion_m ?? 0) > 0)
const phaseCss = computed(() => `#${phaseTint.value.toString(16).padStart(6, '0')}`)

// ---- Knowledge Break (Phase 10 → flip #4): occasionally interrupts the fight with one reviewed
// question that pauses the monster assault, feeds mastery, and empowers the hero. All gated by
// KNOWLEDGE_BREAK_ENABLED — dormant flag ⇒ no controller is created and the realtime path is unchanged.
const breakOpen = ref(false)
const breakQuestion = reactive<CurriculumQuestion>({ id: '', category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1, prompt: '', choices: [], answerIndex: 0, status: 'reviewed', provenance: { source: 'legacy-questions.json' }, subskillId: '' })
let breakCtl: KnowledgeBreakController | null = null
let masteryBefore: Record<string, import('~/data/learning/mastery').SubskillMastery> = {}
let breakRng: (() => number) | null = null
let breakOpenedAt = 0

const rewardLedger = new RewardLedger()
let combat: RealtimeCombat | null = null
let bossState: BossPhaseState | null = null
let encounterId = ''
let encExp = 0
let encGold = 0
let battleSeq = 0
let raf = 0
let lastTs = 0
let telegraphFired = false
let prevMonsterTimer = 0

function clampPct(v: number, max: number) { return Math.max(0, Math.min(100, Math.round((v / Math.max(1, max)) * 100))) }

function assetSprite(path?: string) {
  if (!path) return ''
  const base = runtimeConfig.app.baseURL.endsWith('/') ? runtimeConfig.app.baseURL : `${runtimeConfig.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}

function loadQuestion() {
  const [q] = getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1, floor.value)
  Object.assign(question, q)
}

function pulseMonster() {
  monsterHit.value = false
  requestAnimationFrame(() => { monsterHit.value = true; setTimeout(() => { monsterHit.value = false }, 300) })
}

function syncFromEngine() {
  if (!combat) return
  heroHp.value = combat.state.heroHp
  monsterHp.value = combat.state.monsterHp
  mp.value = combat.state.mp
  combo.value = combat.state.combo
  cd.attack = combat.state.cooldowns.attack
  cd.support = combat.state.cooldowns.support
  cd.counter = combat.state.cooldowns.counter
}

gameEvents.on('battle:start', (payload) => {
  // Per-zone gate (PHASE_14_PLAN §3): only World-1 floors run real-time; everything else is handled by
  // the turn-based BattleModal. Flag off ⇒ this never fires and BattleModal owns every encounter.
  if (!REALTIME_COMBAT_ENABLED || !isWorld1Floor(payload.floor)) return

  floor.value = payload.floor
  isBoss.value = !!payload.isBoss
  monster.isMilestone = config.value.isMilestone
  const setup = setupEncounter(payload, config.value, world.value.combatModifier)
  monster.name = setup.name
  monster.maxHp = setup.maxHp
  encExp = setup.expReward
  encGold = setup.goldReward

  encounterId = `rt-f${payload.floor}:${Date.now()}:${battleSeq++}`
  combat = new RealtimeCombat({
    hero: { atk: player.atk, knowledge: player.knowledge, def: player.def, hp: player.hp, maxMp: player.maxMp },
    monster: { atk: setup.atk, hp: setup.maxHp },
    reward: { encounterId, exp: setup.expReward, gold: setup.goldReward, gems: 0 },
    world: world.value.combatModifier,
    monsterAttackIntervalMs: isBoss.value ? MYCO_COLOSSUS_PHASES.phases[0].attackIntervalMs : undefined,
  })
  // start from the player's CURRENT persistent MP (not a free refill on encounter entry)
  combat.state.mp = Math.min(player.mp, player.maxMp)

  bossState = isBoss.value ? initBossPhaseState(MYCO_COLOSSUS_PHASES, 1) : null
  if (bossState) applyPhaseSpec(bossState.phase, true)
  telegraphFired = false
  prevMonsterTimer = combat.state.monsterAttackTimer

  // Knowledge Break: fresh controller + a mastery snapshot to diff against at fight end
  breakOpen.value = false
  if (KNOWLEDGE_BREAK_ENABLED) {
    breakCtl = new KnowledgeBreakController()
    masteryBefore = { ...learning.mastery }
    breakRng = mulberry32(seedFromString(encounterId))
  } else {
    breakCtl = null
  }

  syncFromEngine()
  loadQuestion()
  answerLock.value = false
  log.value = isBoss.value ? 'The boss stirs. Answer to strike — and watch its wind-up.' : 'Answer to attack. The enemy hits on its own clock.'
  active.value = true
  lastTs = 0
  raf = requestAnimationFrame(frame)
})

function frame(ts: number) {
  if (!active.value || !combat) return
  const dt = lastTs ? Math.min(100, ts - lastTs) : 16
  lastTs = ts
  step(dt)
  if (active.value) raf = requestAnimationFrame(frame)
}

function step(dt: number) {
  if (!combat) return
  // a Knowledge Break freezes the monster assault while the question is open (a wrong answer can
  // never be lethal by itself) — skip the combat tick entirely until it resolves.
  if (breakOpen.value) { syncFromEngine(); return }
  if (breakCtl && !combat.state.over) maybeOpenBreak()
  if (breakOpen.value) { syncFromEngine(); return }
  const events = combat.tick(dt)
  for (const ev of events) {
    if (ev.type === 'monster-attack') { pulseMonster(); log.value = `The enemy hits for ${ev.damage}.` }
    else if (ev.type === 'hero-defeated') { syncFromEngine(); return endBattle(false) }
  }
  if (isBoss.value && bossState && combat) driveBossPhase()
  syncFromEngine()
  if (combat.state.over) endBattle(combat.state.won)
}

/** Boss: derive phase from HP fraction (resume-safe) and fire a telegraph before each incoming hit. */
function driveBossPhase() {
  if (!combat || !bossState) return
  const frac = combat.state.monsterHp / Math.max(1, monster.maxHp)
  const res = advanceBossPhase(bossState, MYCO_COLOSSUS_PHASES, frac)
  if (res.events.length) {
    bossState = res.state
    applyPhaseSpec(res.state.phase, false)
  }
  const spec = bossPhaseSpec(MYCO_COLOSSUS_PHASES, bossState.phase)
  const timer = combat.state.monsterAttackTimer
  if (timer > prevMonsterTimer) telegraphFired = false // a hit landed → new wind-up cycle begins
  prevMonsterTimer = timer
  if (!telegraphFired && timer <= spec.telegraphMs) {
    telegraphFired = true
    gameEvents.emit('boss:telegraph', { phase: spec.id, pattern: spec.pattern, telegraphMs: spec.telegraphMs, tint: spec.tint })
  }
}

function applyPhaseSpec(id: 1 | 2 | 3, initial: boolean) {
  const spec = bossPhaseSpec(MYCO_COLOSSUS_PHASES, id)
  phaseId.value = id
  phaseName.value = spec.name
  phaseTint.value = spec.tint
  if (!initial) {
    log.value = `Phase ${id} — ${spec.name} (${spec.nameTh})`
    gameEvents.emit('boss:phase-change', { phase: id, tint: spec.tint, name: spec.name, nameTh: spec.nameTh })
  }
}

function answer(index: number) {
  if (!combat || answerLock.value) return
  answerLock.value = true
  if (index === question.answerIndex) {
    player.recordCorrectAnswer()
    combat.registerAnswer(true)
    if (combat.canAttack('attack')) applyOutcome(combat.requestAttack('attack'))
    log.value = combat.state.combo >= 2 ? `Correct! Combo x${combat.state.combo}.` : 'Correct — you strike.'
  } else {
    combat.registerAnswer(false)
    log.value = 'Wrong — combo lost.'
  }
  syncFromEngine()
  setTimeout(() => { if (!active.value) return; loadQuestion(); answerLock.value = false }, 450)
}

function canUse(skill: RealtimeSkillId) { return !!combat && !combat.state.over && !breakOpen.value && combat.canAttack(skill) }
function cdPct(skill: RealtimeSkillId) { return Math.round((cd[skill] / REALTIME_SKILL_TIMINGS[skill].cooldownMs) * 100) }

function useSkill(skill: RealtimeSkillId) {
  if (!combat) return
  const outcome = combat.requestAttack(skill)
  if (outcome.accepted && skill === 'support') {
    combat.state.heroHp = Math.min(maxHp.value, combat.state.heroHp + supportHeal(player.knowledge))
    log.value = 'Support steadies you.'
  }
  applyOutcome(outcome)
  syncFromEngine()
}

function applyOutcome(outcome: ReturnType<RealtimeCombat['requestAttack']>) {
  if (!combat) return
  for (const ev of outcome.events) {
    if (ev.type === 'hero-attack' || ev.type === 'hero-counter') {
      pulseMonster()
      breakCtl?.registerHeroAttack() // count landed hero attacks toward the next Knowledge Break
    }
  }
  if (combat.state.over) endBattle(combat.state.won)
}

/** Open a Knowledge Break when the cadence allows and a reviewed question is selectable. */
function maybeOpenBreak() {
  if (!breakCtl || !breakRng) return
  const now = Date.now()
  if (!breakCtl.breakReady(now)) return
  const opened = breakCtl.open({ now, pool: CURRICULUM_QUESTIONS, mastery: masteryBefore, rng: breakRng })
  if (!opened) return // no-question fallback: combat simply continues
  Object.assign(breakQuestion, opened.question)
  breakOpen.value = true
  breakOpenedAt = now
  log.value = 'Knowledge Break! Answer to empower your hero.'
}

/** Resolve the open break: feeds mastery (for the end-of-fight summary) and applies a NON-lethal
 *  combat effect (empower = combo+MP, combo-lost = combo reset). Never touches HP. */
function answerBreak(index: number) {
  if (!breakCtl || !combat || !breakOpen.value) return
  const res = breakCtl.resolve(index, { now: Date.now(), responseMs: Date.now() - breakOpenedAt })
  breakOpen.value = false
  if (!res) return
  if (res.effect === 'empower') { player.recordCorrectAnswer(); combat.registerAnswer(true); log.value = 'Correct! Your resolve empowers the next strikes.' }
  else { combat.registerAnswer(false); log.value = 'Not quite — your combo fades, but you stand firm.' }
  syncFromEngine()
}

function usePotion() {
  if (!combat) return
  const itemId = (player.inventory.potion_m ?? 0) > 0 ? 'potion_m' : 'potion_s'
  const item = getItemById(itemId)
  const heal = item?.kind === 'consumable' ? (item.effect.heal ?? 0) : 0
  if (!player.useConsumable(itemId)) return
  combat.state.heroHp = Math.min(maxHp.value, combat.state.heroHp + heal)
  log.value = 'You use a potion.'
  syncFromEngine()
}

function escape() {
  if (!combat || isBoss.value || breakOpen.value) return
  // fleeing keeps the damage already taken this fight (engine → store), then ends with no reward
  player.hp = Math.max(0, Math.round(combat.state.heroHp))
  player.mp = Math.min(player.maxMp, Math.round(combat.state.mp))
  produceLearningSummary()
  finish(Math.random() < escapeChance(player.speed) ? false : true)
}

function endBattle(won: boolean) {
  if (!combat) return finish(false)
  // engine is authoritative for hero HP/MP during the fight → write results back to the store once
  player.hp = Math.max(0, Math.round(combat.state.heroHp))
  player.mp = Math.min(player.maxMp, Math.round(combat.state.mp))
  produceLearningSummary()
  if (won) grantVictoryRewards()
  else player.addLog(`Knocked out by ${monster.name} on Floor ${floor.value}.`)
  finish(won)
}

/** Fold this fight's Knowledge-Break answers into mastery + a session summary, persist them, and
 *  surface a short notice (the "learning summary produced" gate item). No-op when no break answered. */
function produceLearningSummary() {
  if (!breakCtl || breakCtl.answeredCount === 0) return
  const { summary, masteryAfter } = breakCtl.summarize(masteryBefore, Date.now())
  learning.applySessionResult(masteryAfter, summary)
  const acc = Math.round(summary.accuracy * 100)
  gameEvents.emit('notice', { text: `Learning summary: ${summary.totalCorrect}/${summary.totalAnswered} correct (${acc}%). ${summary.recommendations[0] ?? ''}`.trim() })
}

/** Mirror of BattleModal.winBattle — same idempotent, validated reward path (constitution rule 3). */
function grantVictoryRewards() {
  const gems = gemsForEncounter(isBoss.value, monster.isMilestone)
  const drops = rollLoot(floor.value, isBoss.value)
  // exp/gold come from the encounter setup (scaled for elites/bosses), matching the fight's monster
  const reward = buildRewardRequest({
    encounterId, exp: encExp, gold: encGold, gems,
    loot: drops.map((d) => ({ itemId: d.itemId, name: d.name, qty: d.qty })),
  })
  if (rewardLedger.claim(reward)) {
    player.gainRewards(reward.exp, reward.gold, reward.gems)
    player.recordDefeat()
    for (const drop of reward.loot) player.addItem(drop.itemId, drop.qty)
  }
  const dropText = reward.loot.length ? ` Dropped: ${reward.loot.map((d) => `${d.name} x${d.qty}`).join(', ')}.` : ''
  player.addLog(`Defeated ${monster.name} on Floor ${floor.value} (+${reward.exp} EXP, +${reward.gold}g${reward.gems ? `, +${reward.gems} Gems` : ''})`)
  log.value = `Victory. +${reward.exp} EXP, +${reward.gold} gold.${dropText}`
}

function finish(won: boolean) {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  active.value = false
  breakCtl?.cancel(Date.now()) // safe teardown: clear any open break without recording an answer
  breakOpen.value = false
  breakCtl = null
  const wasBoss = isBoss.value
  combat = null
  bossState = null
  gameEvents.emit('battle:end', { won, isBoss: wasBoss })
}
</script>

<style scoped>
@keyframes battle-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.battle-shake { animation: battle-shake 0.3s ease-in-out; }
/* cooldown veil fills from the bottom as the skill recharges (engine-driven, not per-frame damage) */
.cd-veil { position: absolute; inset-inline: 0; bottom: 0; background: rgba(0, 0, 0, 0.55); pointer-events: none; }
</style>
