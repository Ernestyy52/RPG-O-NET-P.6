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
          <button
            v-for="(choice, i) in breakQuestion.choices" :key="i" data-testid="break-choice"
            class="btn-secondary text-left text-sm disabled:opacity-60"
            :class="breakFeedback && i === breakQuestion.answerIndex ? 'ring-2 ring-emerald-400'
              : breakFeedback && i === breakFeedback.chosen && !breakFeedback.correct ? 'ring-2 ring-red-400' : ''"
            :disabled="!!breakFeedback" @click="answerBreak(i)"
          >{{ choice }}</button>
        </div>
        <!-- เฉลย+คำอธิบายหลังตอบ — มอนสเตอร์ยังหยุดนิ่งจนกด "สู้ต่อ" (อ่านได้ไม่จำกัดเวลา) -->
        <div v-if="breakFeedback" class="glass-panel mt-3 p-3 text-sm" role="status" aria-live="polite">
          <p class="font-bold" :class="breakFeedback.correct ? 'text-emerald-300' : 'text-red-300'">
            {{ breakFeedback.correct ? '✓ ถูกต้อง!' : '✗ ยังไม่ถูก' }}
            <span class="ml-1 font-normal opacity-90">เฉลย: {{ breakQuestion.choices[breakQuestion.answerIndex] }}</span>
          </p>
          <p v-if="breakQuestion.explanation" class="mt-1 opacity-90">{{ breakQuestion.explanation }}</p>
          <p v-if="!breakFeedback.correct && breakQuestion.distractorReasoning?.[String(breakFeedback.chosen)]" class="mt-1 text-amber-200/90">
            ข้อที่เลือก: {{ breakQuestion.distractorReasoning[String(breakFeedback.chosen)] }}
          </p>
          <button class="btn-primary mt-2 text-xs" data-testid="break-continue" @click="closeBreak">เข้าใจแล้ว — สู้ต่อ ▶</button>
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
            <div class="mb-1 flex justify-between text-xs">
              <span>{{ player.heroClass.name }}
                <!-- Insight: ทรัพยากรความรู้ — ตอบถูกได้ 1 ใช้โจมตี 1 (สะสมได้ 5) -->
                <span class="ml-1 text-amber-300" title="Insight — ได้จากการตอบถูก ใช้เป็นพลังโจมตี">✦{{ insight }}<template v-if="loadoutActive">/{{ insightCap }}</template></span>
              </span>
              <span v-if="combo >= 2" class="gold-text font-bold">COMBO x{{ combo }} (+{{ Math.round(comboBonus * 100) }}%)</span>
            </div>
            <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500 transition-all duration-150" :style="{ width: `${heroHpPct}%` }" /></div>
            <div class="mt-1 h-1.5 overflow-hidden rounded bg-black/40"><div class="h-full bg-[#5b7cff] transition-all duration-150" :style="{ width: `${mpPct}%` }" /></div>
          </div>
          <div class="flex-1">
            <div class="mb-1 flex justify-between text-xs" :class="{ 'battle-shake': monsterHit }"><span class="font-bold">{{ monster.name }}</span><span>{{ Math.max(0, Math.round(monsterHp)) }}/{{ monster.maxHp }}</span></div>
            <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full transition-all duration-150" :style="{ width: `${monsterHpPct}%`, background: isBoss ? phaseCss : '#ef4444' }" /></div>
          </div>
        </div>

        <!-- status telegraph (loadout mode): รูปทรง/ฝั่งต่างกัน ไม่พึ่งสีอย่างเดียว (color-blind cue) -->
        <div v-if="loadoutActive && (enemyStatuses.length || selfStatuses.length)" class="flex flex-wrap gap-1 text-[10px]">
          <span v-for="s in enemyStatuses" :key="`e-${s.id}`" class="status-badge status-enemy" :title="`${statusName(s.id)} on the enemy`">▼ {{ statusName(s.id) }} {{ Math.ceil(s.remainingMs / 1000) }}s</span>
          <span v-for="s in selfStatuses" :key="`s-${s.id}`" class="status-badge status-self" :title="`${statusName(s.id)} on you`">✚ {{ statusName(s.id) }} {{ Math.ceil(s.remainingMs / 1000) }}s</span>
        </div>

        <p class="min-h-5 text-sm font-medium" data-testid="battle-log">{{ log }}</p>

        <!-- question: answering correct auto-attacks + builds combo/MP; wrong resets combo -->
        <p class="text-sm opacity-80">{{ question.prompt }}</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            v-for="(choice, i) in question.choices" :key="i" data-testid="answer-choice"
            class="btn-secondary text-left text-sm disabled:opacity-50"
            :class="answerFeedback && i === question.answerIndex ? 'ring-2 ring-emerald-400'
              : answerFeedback && i === answerFeedback.chosen && !answerFeedback.correct ? 'ring-2 ring-red-400' : ''"
            :disabled="answerLock || breakOpen" @click="answer(i)"
          >
            {{ choice }}
          </button>
        </div>
        <!-- เฉลยสั้นๆ หลังตอบผิด (ไฟต์เดินต่อ — การเรียนรู้เชิงลึกอยู่ใน Knowledge Break ที่หยุดเกม) -->
        <p v-if="answerFeedback && !answerFeedback.correct" class="text-xs text-amber-200/90" role="status" aria-live="polite">
          เฉลย: <span class="font-bold">{{ question.choices[question.answerIndex] }}</span>
          <span v-if="question.explanation"> — {{ question.explanation }}</span>
        </p>

        <!-- skills: cooldowns come from the real-time engine (per-action, never per-frame) -->
        <template v-if="loadoutActive">
          <!-- Loadout 5+1 (Master Plan Phase 4): ปุ่มจาก SkillDef ล้วนๆ — ปุ่มเรืองแสง = คอมโบพร้อมจุด
               (สถานะที่สกิลนี้ consume ติดอยู่บนศัตรู); ปุ่มขวาสุดคือ ultimate (ต้องมี ✦ ครบ) -->
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              v-for="id in loadoutIds" :key="id" data-testid="skill-btn" :data-skill-id="id"
              class="btn-primary relative overflow-hidden px-1 py-1 text-[11px] leading-tight"
              :class="{ 'combo-ready': comboReady[id], 'ult-btn': id === ultimateId }"
              :disabled="!canUseLoadout(id)" :title="skillTooltip(id)" @click="useLoadoutSkill(id)"
            >
              <span class="block truncate">{{ id === ultimateId ? '★ ' : '' }}{{ skillDef(id)?.name ?? id }}</span>
              <span class="block text-[9px] opacity-85">
                <span v-if="skillDef(id)?.insightCost" class="text-amber-300">✦{{ skillDef(id)!.insightCost }}</span>
                <span v-if="skillDef(id)?.mpCost" class="text-[#9db8ff]"> {{ skillDef(id)!.mpCost }}mp</span>
                <span v-if="!skillDef(id)?.insightCost && !skillDef(id)?.mpCost">free</span>
              </span>
              <span v-if="(lcd[id] ?? 0) > 0" class="cd-veil" :style="{ height: `${loadoutCdPct(id)}%` }" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn-primary text-xs" :disabled="!hasPotion" @click="usePotion">Item</button>
            <button class="btn-secondary text-xs" :disabled="isBoss" @click="escape">Flee</button>
          </div>
        </template>
        <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('attack')" @click="useSkill('attack')">{{ slots?.attack.name ?? 'Attack' }}<span v-if="(slots?.attack.mpCost ?? 0) > 0" class="opacity-70"> {{ slots?.attack.mpCost }}</span><span v-if="cd.attack > 0" class="cd-veil" :style="{ height: `${cdPct('attack')}%` }" /></button>
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('counter')" @click="useSkill('counter')">{{ slots?.counter.name ?? 'Counter' }} <span class="opacity-70">{{ slots?.counter.mpCost ?? COUNTER_MP }}</span><span v-if="cd.counter > 0" class="cd-veil" :style="{ height: `${cdPct('counter')}%` }" /></button>
          <button class="btn-primary relative overflow-hidden text-xs" :disabled="!canUse('support')" @click="useSkill('support')">{{ slots?.support.name ?? 'Support' }} <span class="opacity-70">{{ slots?.support.mpCost ?? SUPPORT_MP }}</span><span v-if="cd.support > 0" class="cd-veil" :style="{ height: `${cdPct('support')}%` }" /></button>
          <button class="btn-primary text-xs" :disabled="!hasPotion" @click="usePotion">Item</button>
          <button class="btn-secondary text-xs" :disabled="isBoss" @click="escape">Flee</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { gameEvents, type BattleOutcome } from '~/game/systems/eventBus'
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
  CLASS_KITS_ENABLED, kitSlotMapping, realtimeKitOverride, type KitSlotMapping,
} from '~/data/combat'
import { SKILL_LOADOUT_ENABLED, getSkillDef } from '~/data/combat/skillDefs'
import { LoadoutCombat, validateLoadout } from '~/data/combat/loadoutEngine'
import { defaultSkillLoadout } from '~/data/combat/builds'
import { STATUS_EFFECTS, type ActiveStatus, type StatusId } from '~/data/combat/statusEffects'
import type { CombatEvent } from '~/data/combat/types'
import { KNOWLEDGE_BREAK_ENABLED, KnowledgeBreakController } from '~/data/learning/knowledgeBreak'
import { MASTERY_BATTLE_SELECTION_ENABLED, drawBattleQuestion } from '~/data/learning/battleSelector'
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
const insight = ref(0)
// P0.6: คำตอบถูกระหว่างคูลดาวน์จะ "คิว" ไว้ — ฟันทันทีที่พร้อม ไม่มีคำตอบถูกสูญเปล่า
let strikeQueued = false
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
let breakRng: (() => number) | null = null
let breakOpenedAt = 0
// เฉลยหลังตอบใน Knowledge Break — ค้างไว้ (มอนสเตอร์ยังหยุด) จนผู้เล่นกดสู้ต่อ
const breakFeedback = ref<{ correct: boolean; chosen: number } | null>(null)
// เฉลยสั้นหลังตอบผิดในคำถามหลัก (non-blocking — ไฟต์เดินต่อ)
const answerFeedback = ref<{ correct: boolean; chosen: number } | null>(null)

// Class kits (Phase 14 flip #5): when enabled, each of the 3 slots is driven by the hero's kit ability
// (cooldown/MP/damage/mitigation/sustain). Realtime combat only ever runs on World-1, so the kit applies
// throughout. Flag off ⇒ `slots` is null and the generic Attack/Counter/Support loop is byte-identical.
const slots = ref<KitSlotMapping | null>(null)
let usingKit = false

const rewardLedger = new RewardLedger()
let combat: RealtimeCombat | null = null
// Loadout engine (Master Plan Phase 4, หลัง SKILL_LOADOUT_ENABLED) — เมื่อ active จะแทน RealtimeCombat
// ทั้งไฟต์; state ที่ template อ่าน (hp/mp/combo/insight/timer) มี shape ร่วมกัน
let lcombat: LoadoutCombat | null = null
const engine = () => (lcombat ?? combat)
const loadoutActive = ref(false)
const loadoutIds = ref<string[]>([]) // 5 actives + ultimate (ท้ายสุด) สำหรับแถบปุ่ม
const ultimateId = ref('')
const insightCap = ref(5) // อ่านจาก engine ตอนเริ่มไฟต์ (passive insight-cap ปรับได้)
const lcd = reactive<Record<string, number>>({})
const comboReady = reactive<Record<string, boolean>>({})
const enemyStatuses = ref<ActiveStatus[]>([])
const selfStatuses = ref<ActiveStatus[]>([])
let loadoutCdMult = 1 // passive cooldown-mult — สำหรับเปอร์เซ็นต์ veil เท่านั้น (engine เป็น authority)
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
  // Flip: เลือกข้อโดยถ่วงน้ำหนักไปทาง subskill ที่ยังอ่อน/ถึงรอบทบทวน (weak-recur) — flag off = bag เดิม
  const q = MASTERY_BATTLE_SELECTION_ENABLED
    ? drawBattleQuestion(CURRICULUM_QUESTIONS, floor.value, getQuestionDifficulty(floor.value), learning.mastery)
    : null
  const picked = q ?? getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1, floor.value)[0]
  // เคลียร์ field เสริมก่อน assign กัน explanation/distractorReasoning ข้อเก่าค้างเมื่อข้อใหม่ไม่มี
  Object.assign(question, { explanation: undefined, distractorReasoning: undefined, subskillId: undefined, patternId: undefined }, picked)
}

function pulseMonster() {
  monsterHit.value = false
  requestAnimationFrame(() => { monsterHit.value = true; setTimeout(() => { monsterHit.value = false }, 300) })
}

function syncFromEngine() {
  const eng = engine()
  if (!eng) return
  heroHp.value = eng.state.heroHp
  monsterHp.value = eng.state.monsterHp
  mp.value = eng.state.mp
  combo.value = eng.state.combo
  insight.value = eng.state.insight
  if (lcombat) {
    for (const id of loadoutIds.value) {
      lcd[id] = lcombat.state.cooldowns[id] ?? 0
      // Telegraph = "สกิลนี้จะคอมโบถ้าออกตอนนี้" (สถานะติด + ไม่ติด cd) — จงใจไม่เช็ค insight/MP:
      // auto-strike ใช้ insight หมดทันที ถ้าเช็คด้วย ปุ่มจะไม่มีวันเรือง; เรือง+disabled = สอนว่า
      // "ตอบถูกอีกข้อแล้วคอมโบระเบิด"
      comboReady[id] = !lcombat.state.over && (lcombat.state.cooldowns[id] ?? 0) <= 0
        && lcombat.readyCombos(id).length > 0
    }
    enemyStatuses.value = [...lcombat.state.enemyStatuses]
    selfStatuses.value = [...lcombat.state.selfStatuses]
  } else if (combat) {
    cd.attack = combat.state.cooldowns.attack
    cd.support = combat.state.cooldowns.support
    cd.counter = combat.state.cooldowns.counter
  }
}

const onBattleStart = (payload: import('~/game/systems/eventBus').EncounterInfo) => {
  // Per-zone gate (PHASE_14_PLAN §3): only World-1 floors run real-time; everything else is handled by
  // the turn-based BattleModal. Flag off ⇒ this never fires and BattleModal owns every encounter.
  if (!REALTIME_COMBAT_ENABLED || !isWorld1Floor(payload.floor)) return
  strikeQueued = false

  floor.value = payload.floor
  isBoss.value = !!payload.isBoss
  monster.isMilestone = config.value.isMilestone
  const setup = setupEncounter(payload, config.value, world.value.combatModifier)
  monster.name = setup.name
  monster.maxHp = setup.maxHp
  encExp = setup.expReward
  encGold = setup.goldReward

  encounterId = `rt-f${payload.floor}:${Date.now()}:${battleSeq++}`
  const heroSnapshot = { atk: player.atk, knowledge: player.knowledge, def: player.def, hp: player.hp, maxHp: player.maxHp, maxMp: player.maxMp }
  loadoutActive.value = SKILL_LOADOUT_ENABLED
  if (SKILL_LOADOUT_ENABLED) {
    // Loadout engine (Master Plan Phase 4): แทน RealtimeCombat ทั้งไฟต์ — สกิล/คอมโบ/passive มาจาก data
    // loadout ในเซฟอาจใช้ไม่ได้แล้ว (เช่น ข้อมูล job เปลี่ยน) — ถอยกลับ preset ของคลาส ไม่พังไฟต์
    let { skills, ultimate, passives } = player.skillLoadout
    if (validateLoadout(skills, ultimate, passives, player.classId, player.jobId || undefined).length > 0) {
      ;({ skills, ultimate, passives } = defaultSkillLoadout(player.classId))
    }
    usingKit = false
    slots.value = null
    combat = null
    lcombat = new LoadoutCombat({
      hero: heroSnapshot,
      monster: { atk: setup.atk, hp: setup.maxHp },
      reward: { encounterId, exp: setup.expReward, gold: setup.goldReward, gems: 0 },
      skills: [...skills], ultimate, passives: [...passives],
      world: world.value.combatModifier,
      monsterAttackIntervalMs: isBoss.value ? MYCO_COLOSSUS_PHASES.phases[0].attackIntervalMs : undefined,
    })
    // start from the player's CURRENT persistent MP (not a free refill on encounter entry)
    lcombat.state.mp = Math.min(player.mp, player.maxMp)
    loadoutIds.value = [...skills, ultimate]
    ultimateId.value = ultimate
    for (const key of Object.keys(lcd)) delete lcd[key]
    for (const key of Object.keys(comboReady)) delete comboReady[key]
    for (const id of loadoutIds.value) { lcd[id] = 0; comboReady[id] = false }
    loadoutCdMult = passives.reduce((m, pid) => {
      const p = getSkillDef(pid)?.passive
      return p?.hook === 'cooldown-mult' ? m * p.value : m
    }, 1)
    insightCap.value = lcombat.insightCap()
  } else {
    usingKit = CLASS_KITS_ENABLED && isWorld1Floor(payload.floor)
    slots.value = usingKit ? kitSlotMapping(player.classId) : null
    lcombat = null
    combat = new RealtimeCombat({
      hero: heroSnapshot,
      monster: { atk: setup.atk, hp: setup.maxHp },
      reward: { encounterId, exp: setup.expReward, gold: setup.goldReward, gems: 0 },
      world: world.value.combatModifier,
      monsterAttackIntervalMs: isBoss.value ? MYCO_COLOSSUS_PHASES.phases[0].attackIntervalMs : undefined,
      kit: usingKit ? realtimeKitOverride(player.classId) : undefined,
    })
    // start from the player's CURRENT persistent MP (not a free refill on encounter entry)
    combat.state.mp = Math.min(player.mp, player.maxMp)
  }

  bossState = isBoss.value ? initBossPhaseState(MYCO_COLOSSUS_PHASES, 1) : null
  if (bossState) applyPhaseSpec(bossState.phase, true)
  telegraphFired = false
  prevMonsterTimer = engine()!.state.monsterAttackTimer

  // Knowledge Break: fresh controller — mastery อ่านสด ณ เวลาใช้เสมอ (P0.7: ไม่มี snapshot เก่า)
  breakOpen.value = false
  breakFeedback.value = null
  answerFeedback.value = null
  if (KNOWLEDGE_BREAK_ENABLED) {
    breakCtl = new KnowledgeBreakController()
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
}
gameEvents.on('battle:start', onBattleStart)

// P0.9: ปลด listener + RAF + break ที่ค้างเมื่อ component ถูกถอด — ไม่มี handler ผีหลัง unmount
onUnmounted(() => {
  gameEvents.off('battle:start', onBattleStart)
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  breakCtl?.cancel(Date.now())
  breakCtl = null
  combat = null
  lcombat = null
})

function frame(ts: number) {
  if (!active.value || !engine()) return
  const dt = lastTs ? Math.min(100, ts - lastTs) : 16
  lastTs = ts
  step(dt)
  if (active.value) raf = requestAnimationFrame(frame)
}

function step(dt: number) {
  const eng = engine()
  if (!eng) return
  // a Knowledge Break freezes the monster assault while the question is open (a wrong answer can
  // never be lethal by itself) — skip the combat tick entirely until it resolves.
  if (breakOpen.value) { syncFromEngine(); return }
  if (breakCtl && !eng.state.over) maybeOpenBreak()
  if (breakOpen.value) { syncFromEngine(); return }
  const events = eng.tick(dt)
  for (const ev of events) {
    if (ev.type === 'monster-attack') { pulseMonster(); log.value = `The enemy hits for ${ev.damage}.` }
    else if (ev.type === 'hero-defeated') { syncFromEngine(); return endBattle(false) }
  }
  // P0.6: การโจมตีที่คิวไว้จากคำตอบถูก — ยิงทันทีที่คูลดาวน์/เงื่อนไขพร้อม
  if (strikeQueued && !eng.state.over) {
    if (lcombat) {
      if (autoStrikeLoadout()) strikeQueued = false
    } else if (combat && combat.canAttack('attack')) {
      strikeQueued = false
      applyOutcome(combat.requestAttack('attack'))
    }
    if (!engine()) return // killing blow จบไฟต์ไปแล้ว
  }
  if (isBoss.value && bossState && engine()) driveBossPhase()
  syncFromEngine()
  if (eng.state.over) endBattle(eng.state.won)
}

/** Boss: derive phase from HP fraction (resume-safe) and fire a telegraph before each incoming hit. */
function driveBossPhase() {
  const eng = engine()
  if (!eng || !bossState) return
  const frac = eng.state.monsterHp / Math.max(1, monster.maxHp)
  const res = advanceBossPhase(bossState, MYCO_COLOSSUS_PHASES, frac)
  if (res.events.length) {
    bossState = res.state
    applyPhaseSpec(res.state.phase, false)
  }
  const spec = bossPhaseSpec(MYCO_COLOSSUS_PHASES, bossState.phase)
  const timer = eng.state.monsterAttackTimer
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
  const eng = engine()
  if (!eng || answerLock.value) return
  answerLock.value = true
  const correct = index === question.answerIndex
  answerFeedback.value = { correct, chosen: index }
  // ทุกคำตอบในไฟต์คือ learning event — ป้อนเข้า mastery (ไม่เคยอ่านกลับมา scale พลังต่อสู้)
  learning.recordBattleAnswer(question.subskillId, correct)
  if (correct) {
    player.recordCorrectAnswer()
    eng.registerAnswer(true) // +Insight เสมอ — ไม่มีคำตอบถูกสูญเปล่า (P0.6)
    // อ่านค่า combo ก่อนออกท่า — killing blow จะ null engine (นี่คือ crash เดิม, P0.4)
    const comboNow = eng.state.combo
    if (lcombat) {
      // autoStrike เขียน log เอง (พร้อม prefix "Correct!") — ตั้งเฉพาะกรณีคิว ไม่งั้นข้อความตอบถูกถูกทับ
      if (!autoStrikeLoadout('Correct! ✦ — ')) {
        strikeQueued = true // ทุกสกิลติดคูลดาวน์/ของไม่พอ → คิวไว้ ฟันใน step()
        log.value = comboNow >= 2 ? `Correct! +1 Insight ✦ · Combo x${comboNow} — strike queued.` : 'Correct! +1 Insight ✦ — strike queued.'
      }
    } else {
      log.value = comboNow >= 2 ? `Correct! Combo x${comboNow}.` : 'Correct — you strike.'
      if (combat!.canAttack('attack')) applyOutcome(combat!.requestAttack('attack'))
      else strikeQueued = true // ติดคูลดาวน์ → คิวไว้ ฟันทันทีที่พร้อมใน step()
    }
  } else {
    eng.registerAnswer(false)
    log.value = 'Wrong — combo lost. Check the answer below.'
  }
  syncFromEngine()
  // ตอบผิดค้างเฉลยไว้นานกว่าให้พออ่านหนึ่งบรรทัด (ไฟต์เรียลไทม์ยังเดินต่อ — ราคาของการตอบผิด)
  const readMs = correct ? 450 : 2600
  setTimeout(() => { if (!active.value) return; answerFeedback.value = null; loadQuestion(); answerLock.value = false }, readMs)
}

function canUse(skill: RealtimeSkillId) { return !!combat && !combat.state.over && !breakOpen.value && combat.canAttack(skill) }
function cdPct(skill: RealtimeSkillId) {
  const full = combat ? combat.skillCooldownMs(skill) : REALTIME_SKILL_TIMINGS[skill].cooldownMs
  return Math.round((cd[skill] / full) * 100)
}

// ---- Loadout bar (Master Plan Phase 4) ----
const skillDef = (id: string) => getSkillDef(id)
const statusName = (id: StatusId) => STATUS_EFFECTS[id].name
function canUseLoadout(id: string) { return !!lcombat && !lcombat.state.over && !breakOpen.value && lcombat.canUse(id) }
function loadoutCdPct(id: string) {
  const full = Math.max(1, Math.round((getSkillDef(id)?.cooldownMs ?? 1) * loadoutCdMult))
  return Math.min(100, Math.round(((lcd[id] ?? 0) / full) * 100))
}
function skillTooltip(id: string): string {
  const def = getSkillDef(id)
  if (!def) return id
  const cost = [def.insightCost ? `${def.insightCost} Insight` : '', def.mpCost ? `${def.mpCost} MP` : '']
    .filter(Boolean).join(' + ') || 'Free'
  const combo = def.consumes?.length ? ` · Combo: consumes ${def.consumes.map((s) => STATUS_EFFECTS[s].name).join('/')}` : ''
  return `${def.name} — ${def.description} [${cost} · CD ${(def.cooldownMs / 1000).toFixed(1)}s${combo}]`
}

/** Learning gate ในโหมด loadout: คำตอบถูก = ฟันจริงเสมอ — จุดคอมโบที่พร้อมก่อน ไม่งั้นสกิลดาเมจตัวแรก
 *  ที่ใช้ได้ตามลำดับ loadout (ultimate ไม่ auto — ผู้เล่นเก็บ ✦ เต็มแล้วกดเอง) */
function autoStrikeLoadout(logPrefix = ''): boolean {
  if (!lcombat || lcombat.state.over) return false
  const dealsDamage = (id: string) => !!getSkillDef(id)?.effects.some((e) =>
    e.kind === 'damage' || (e.kind === 'consume' && e.bonus.kind === 'damage'))
  const actives = loadoutIds.value.filter((id) => id !== ultimateId.value)
  const pick = actives.find((id) => lcombat!.canUse(id) && lcombat!.readyCombos(id).length > 0)
    ?? actives.find((id) => lcombat!.canUse(id) && dealsDamage(id))
  if (!pick) return false
  fireLoadoutSkill(pick, logPrefix)
  return true
}

function useLoadoutSkill(id: string) {
  if (!canUseLoadout(id)) return
  fireLoadoutSkill(id)
}

function fireLoadoutSkill(id: string, logPrefix = '') {
  if (!lcombat) return
  const def = getSkillDef(id)
  const outcome = lcombat.requestSkill(id)
  if (!outcome.accepted) return
  if (outcome.comboTriggered?.length) {
    // คอมโบจุดติด — ฉลอง + สอนว่าคู่ไหนทำงาน (data-driven telegraph → payoff)
    log.value = `${logPrefix}COMBO! ${def?.name ?? id} consumes ${outcome.comboTriggered.map((s) => STATUS_EFFECTS[s].name).join(' + ')}!`
  } else if (def) {
    log.value = `${logPrefix}${def.name}!`
  }
  applyOutcome(outcome)
  syncFromEngine()
}

function useSkill(skill: RealtimeSkillId) {
  if (!combat) return
  const outcome = combat.requestAttack(skill)
  if (outcome.accepted && skill === 'support') {
    // with a kit the engine already applied the support ability's effect (heal/rally/guard); only the
    // generic no-kit path heals here, matching the legacy behaviour byte-for-byte.
    if (!usingKit) combat.state.heroHp = Math.min(maxHp.value, combat.state.heroHp + supportHeal(player.knowledge))
    log.value = usingKit && slots.value ? `${slots.value.support.name}!` : 'Support steadies you.'
  }
  applyOutcome(outcome)
  syncFromEngine()
}

function applyOutcome(outcome: { events: CombatEvent[] }) {
  const eng = engine()
  if (!eng) return
  for (const ev of outcome.events) {
    if (ev.type === 'hero-attack' || ev.type === 'hero-counter') {
      pulseMonster()
      breakCtl?.registerHeroAttack() // count landed hero attacks toward the next Knowledge Break
    }
  }
  if (eng.state.over) endBattle(eng.state.won)
}

/** Open a Knowledge Break when the cadence allows and a reviewed question is selectable. */
function maybeOpenBreak() {
  if (!breakCtl || !breakRng) return
  const now = Date.now()
  if (!breakCtl.breakReady(now)) return
  // เลือกข้อจาก mastery "สด" — จุดอ่อนล่าสุด (รวมคำตอบในไฟต์นี้) ถูกนำมาถามจริง
  const opened = breakCtl.open({ now, pool: CURRICULUM_QUESTIONS, mastery: learning.mastery, rng: breakRng })
  if (!opened) return // no-question fallback: combat simply continues
  Object.assign(breakQuestion, opened.question)
  breakOpen.value = true
  breakOpenedAt = now
  log.value = 'Knowledge Break! Answer to empower your hero.'
}

/** Resolve the open break: feeds mastery (for the end-of-fight summary) and applies a NON-lethal
 *  combat effect (empower = combo+MP, combo-lost = combo reset). Never touches HP. */
function answerBreak(index: number) {
  const eng = engine()
  if (!breakCtl || !eng || !breakOpen.value || breakFeedback.value) return
  const res = breakCtl.resolve(index, { now: Date.now(), responseMs: Date.now() - breakOpenedAt })
  if (!res) { breakOpen.value = false; return }
  if (res.effect === 'empower') { player.recordCorrectAnswer(); eng.registerAnswer(true); log.value = 'Correct! Your resolve empowers the next strikes.' }
  else { eng.registerAnswer(false); log.value = 'Not quite — your combo fades, but you stand firm.' }
  // ค้างหน้าต่างไว้โชว์เฉลย+คำอธิบาย — breakOpen ยัง true ⇒ step() ไม่ tick ⇒ มอนสเตอร์หยุดรอจนอ่านจบ
  breakFeedback.value = { correct: res.effect === 'empower', chosen: index }
  syncFromEngine()
}

function closeBreak() {
  breakFeedback.value = null
  breakOpen.value = false
}

function usePotion() {
  const eng = engine()
  if (!eng) return
  const itemId = (player.inventory.potion_m ?? 0) > 0 ? 'potion_m' : 'potion_s'
  const item = getItemById(itemId)
  const heal = item?.kind === 'consumable' ? (item.effect.heal ?? 0) : 0
  if (!player.useConsumable(itemId)) return
  eng.state.heroHp = Math.min(maxHp.value, eng.state.heroHp + heal)
  log.value = 'You use a potion.'
  syncFromEngine()
}

function escape() {
  const eng = engine()
  if (!eng || isBoss.value || breakOpen.value) return
  // P0.3/P0.4 — semantics ที่ถูกต้อง: สำเร็จ = 'escaped' (ถอยออกมาเดินต่อ ไม่ใช่ KO);
  // พลาด = 'escape-failed' → ไฟต์ดำเนินต่อ (เดิมกลับด้าน: หนีสำเร็จโดนปฏิบัติเหมือนแพ้แล้ว restart ชั้น)
  if (Math.random() < escapeChance(player.speed)) {
    player.hp = Math.max(0, Math.round(eng.state.heroHp))
    player.mp = Math.min(player.maxMp, Math.round(eng.state.mp))
    produceLearningSummary()
    player.addLog(`Fled from ${monster.name} on Floor ${floor.value}.`)
    finish('escaped')
  } else {
    log.value = 'Escape failed! The enemy blocks your retreat.'
  }
}

function endBattle(won: boolean) {
  const eng = engine()
  if (!eng) return finish('defeat')
  // engine is authoritative for hero HP/MP during the fight → write results back to the store once
  player.hp = Math.max(0, Math.round(eng.state.heroHp))
  player.mp = Math.min(player.maxMp, Math.round(eng.state.mp))
  produceLearningSummary()
  if (won) grantVictoryRewards()
  else player.addLog(`Knocked out by ${monster.name} on Floor ${floor.value}.`)
  finish(won ? 'victory' : 'defeat')
}

/** Fold this fight's Knowledge-Break answers into mastery + a session summary, persist them, and
 *  surface a short notice (the "learning summary produced" gate item). No-op when no break answered. */
function produceLearningSummary() {
  if (!breakCtl || breakCtl.answeredCount === 0) return
  // P0.7 — AnswerRecord stream เดียว: สรุปจาก mastery "ปัจจุบัน" (ซึ่งรวมคำตอบปกติที่
  // recordBattleAnswer บันทึกไว้ระหว่างไฟต์แล้ว) — snapshot เก่าจะไม่มีวันเขียนทับความคืบหน้าอีก
  const { summary, masteryAfter } = breakCtl.summarize({ ...learning.mastery }, Date.now())
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
    player.gainCombatRewards(reward.exp, reward.gold, reward.gems)
    player.recordDefeat()
    for (const drop of reward.loot) player.addItem(drop.itemId, drop.qty)
  }
  const dropText = reward.loot.length ? ` Dropped: ${reward.loot.map((d) => `${d.name} x${d.qty}`).join(', ')}.` : ''
  player.addLog(`Defeated ${monster.name} on Floor ${floor.value} (+${reward.exp} EXP, +${reward.gold}g${reward.gems ? `, +${reward.gems} Gems` : ''})`)
  log.value = `Victory. +${reward.exp} EXP, +${reward.gold} gold.${dropText}`
}

function finish(outcome: BattleOutcome) {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  active.value = false
  strikeQueued = false
  breakCtl?.cancel(Date.now()) // safe teardown: clear any open break without recording an answer
  breakOpen.value = false
  breakFeedback.value = null
  answerFeedback.value = null
  breakCtl = null
  const wasBoss = isBoss.value
  combat = null
  lcombat = null
  loadoutActive.value = false
  enemyStatuses.value = []
  selfStatuses.value = []
  bossState = null
  gameEvents.emit('battle:end', { outcome, won: outcome === 'victory', isBoss: wasBoss })
}
</script>

<style scoped>
@keyframes battle-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.battle-shake { animation: battle-shake 0.3s ease-in-out; }
/* cooldown veil fills from the bottom as the skill recharges (engine-driven, not per-frame damage) */
.cd-veil { position: absolute; inset-inline: 0; bottom: 0; background: rgba(0, 0, 0, 0.55); pointer-events: none; }
/* combo telegraph: skill whose consume-target is on the enemy glows (reduced-motion users still get the ring) */
.combo-ready { box-shadow: 0 0 0 2px #ffd879, 0 0 10px rgba(255, 216, 121, 0.7); animation: combo-pulse 0.9s ease-in-out infinite; }
@keyframes combo-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.25); } }
@media (prefers-reduced-motion: reduce) { .combo-ready { animation: none; } }
.ult-btn { border-color: #c78bff; }
/* status badges: shape prefix (▼ enemy / ✚ self) carries meaning, colour is reinforcement only */
.status-badge { border: 1px solid; border-radius: 4px; padding: 1px 5px; background: rgba(0, 0, 0, 0.35); }
.status-enemy { border-color: #ef8a8a; color: #ffb4b4; }
.status-self { border-color: #7fe0a7; color: #a9f0c8; }
</style>
