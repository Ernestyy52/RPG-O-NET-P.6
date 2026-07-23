<template>
  <div v-if="active" class="modal-backdrop">
    <div class="pixel-window anime-window w-full max-w-3xl">
      <div class="pixel-titlebar gap-3">
        <div>
          <h2 class="gold-text text-lg font-bold">Floor {{ floor }} {{ isBossFight ? 'Boss' : 'Battle' }}</h2>
          <p class="text-xs opacity-75">{{ cefr }} / {{ world.description }} / Turn: {{ turn }}</p>
        </div>
        <span class="text-sm">HP {{ player.hp }}/{{ player.maxHp }} <span class="mx-1 opacity-40">|</span> <span class="text-[#9db8ff]">MP {{ player.mp }}/{{ player.maxMp }}</span> <span class="mx-1 opacity-40">|</span> <span class="text-amber-300" title="Insight — ได้จากการตอบถูก ใช้กับ Counter">✦ {{ insight }}</span></span>
      </div>

      <div class="pixel-window-body grid gap-4 p-4 md:grid-cols-[220px_1fr]">
        <div class="glass-panel p-3">
          <div class="mb-3 flex items-end justify-between" :class="{ 'battle-shake': playerHit }">
            <img :src="assetPath(playerIcon)" class="h-24 object-contain pixelated" alt="hero">
            <div class="text-right text-xs">
              <div>{{ player.heroClass.name }}</div>
              <div>SPD {{ player.speed }} / KNO {{ player.knowledge }}</div>
            </div>
          </div>
          <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${playerHpPct}%` }" /></div>
          <div v-if="combo >= 2" class="combo-badge gold-text mt-2 text-center text-sm font-bold">COMBO x{{ combo }} (+{{ Math.round(comboBonus * 100) }}% DMG)</div>
          <div class="mt-4 flex items-end justify-between" :class="{ 'battle-shake': monsterHit }">
            <div>
              <div class="font-bold">{{ monster.name }}</div>
              <div class="text-xs opacity-75">HP {{ monster.hp }}/{{ monster.maxHp }} / SPD {{ monster.speed }}</div>
            </div>
            <img :src="monster.sprite" class="h-20 object-contain pixelated" :class="{ 'battle-flash': monsterHit }" alt="monster">
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-red-500 transition-all duration-300" :style="{ width: `${monsterHpPct}%` }" /></div>
          <!-- Intent chip: มอนสเตอร์ประกาศท่าถัดไป — จังหวะตัดสินใจใช้ Counter/Support/Item -->
          <div
            v-if="intentSpec" class="mt-2 rounded bg-black/40 px-2 py-1 text-center text-xs"
            :class="intentSpec.id === 'heavy' ? 'text-red-300 font-bold' : intentSpec.id === 'snarl' ? 'text-emerald-300' : 'text-amber-200'"
            role="status"
          >
            ท่าถัดไป: {{ intentSpec.icon }} {{ intentSpec.labelTh }}
          </div>
        </div>

        <div>
          <p class="mb-3 min-h-12 font-medium">{{ log }}</p>
          <p class="mb-3 text-sm opacity-80">{{ question.prompt }}</p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              v-for="(choice, i) in question.choices" :key="i"
              class="btn-secondary text-left disabled:opacity-50"
              :class="feedback.visible && i === question.answerIndex ? 'ring-2 ring-emerald-400'
                : feedback.visible && i === feedback.chosen && !feedback.correct ? 'ring-2 ring-red-400' : ''"
              :disabled="locked || turn !== 'Hero'" @click="answer(i)"
            >
              {{ choice }}
            </button>
          </div>

          <!-- Learning feedback: ทุกคำตอบคือโอกาสเรียนรู้ — เฉลย + เหตุผล (กติกาข้อ 2: explanation/distractor
               reasoning ติดมากับทุกข้อ) ตอบผิด = หยุดรอไม่จำกัดเวลา (readable timing, กติกาข้อ 8) -->
          <div v-if="feedback.visible" class="glass-panel mt-3 p-3 text-sm" role="status" aria-live="polite">
            <p class="font-bold" :class="feedback.correct ? 'text-emerald-300' : 'text-red-300'">
              {{ feedback.correct ? '✓ ถูกต้อง!' : '✗ ยังไม่ถูก' }}
              <span class="ml-1 font-normal opacity-90">เฉลย: {{ question.choices[question.answerIndex] }}</span>
            </p>
            <p v-if="question.explanation" class="mt-1 opacity-90">{{ question.explanation }}</p>
            <p v-if="whyWrong" class="mt-1 text-amber-200/90">ข้อที่เลือก: {{ whyWrong }}</p>
            <button v-if="!feedback.correct" class="btn-primary mt-2 text-xs" @click="continueAfterWrong">เข้าใจแล้ว — สู้ต่อ ▶</button>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || player.mp < SUPPORT_MP" @click="support">Support <span class="opacity-70">{{ SUPPORT_MP }}MP</span></button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || !hasPotion" :title="enc.noPotion ? 'Dry Run modifier: potions disabled' : ''" @click="usePotion">{{ enc.noPotion ? 'Item Sealed' : 'Item' }}</button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || player.mp < COUNTER_MP || insight < 1" @click="counter">Counter <span class="opacity-70">{{ COUNTER_MP }}MP ✦1</span></button>
            <button class="btn-secondary text-xs" :disabled="locked || isBossFight" @click="escape">Escape</button>
          </div>
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
import { selectMonsterQuestion } from '~/data/monsterKnowledge'
import { getWorldState, isWorld1Floor } from '~/data/world'
import { rollLoot } from '~/data/loot'
import {
  COMBAT_DOMAIN_ENABLED, REALTIME_COMBAT_ENABLED, COUNTER_MP, SUPPORT_MP, RewardLedger,
  buildRewardRequest, comboBonus as domainComboBonus, escapeChance, gemsForEncounter,
  heroDamage as domainHeroDamage, heroWinsInitiative, monsterDamage,
  resolveHeroSkill, resolveMonsterAttack, setupEncounter, supportHeal,
  MONSTER_INTENTS_ENABLED, MONSTER_INTENTS, rollIntent, type MonsterIntentId,
} from '~/data/combat'
import { MASTERY_BATTLE_SELECTION_ENABLED, drawBattleQuestion } from '~/data/learning/battleSelector'
import { CURRICULUM_QUESTIONS } from '~/data/curriculum/adapter'
import { usePlayerStore } from '~/stores/player'
import { useLearningStore } from '~/stores/learning'

const runtimeConfig = useRuntimeConfig()

const player = usePlayerStore()
const learning = useLearningStore()
const active = ref(false)
const floor = ref(1)
const locked = ref(false)
const turn = ref<'Hero' | 'Monster'>('Hero')
const log = ref('Choose the correct answer to attack.')
const config = computed(() => getFloorConfig(floor.value))
const cefr = computed(() => cefrForFloor(floor.value))
const world = computed(() => getWorldState())
const question = reactive<Question>({ id: '', category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1, prompt: '', choices: [], answerIndex: 0 })
const monster = reactive({ name: 'Slime', hp: 30, maxHp: 30, atk: 4, speed: 4, sprite: assetPath('mob-sprites/mca/slime.png') })
const enc = reactive<{ isBoss: boolean; expReward: number; goldReward: number; monsterId?: string; elite: boolean; rare: boolean; noPotion: boolean }>({ isBoss: false, expReward: 0, goldReward: 0, elite: false, rare: false, noPotion: false })
const isBossFight = computed(() => enc.isBoss)
// คอมโบ: ตอบถูกติดกันดาเมจแรงขึ้น +15%/สแตค (สูงสุด +60%) ตอบผิด = รีเซ็ต — สูตรอยู่ใน combat domain
const combo = ref(0)
const comboBonus = computed(() => domainComboBonus(combo.value))
// Learning feedback หลังตอบ: โชว์เฉลย+คำอธิบายเสมอ; ตอบผิดหยุดรอปุ่ม "สู้ต่อ" (ไม่มีแรงกดดันเวลา)
const feedback = reactive<{ visible: boolean; correct: boolean; chosen: number }>({ visible: false, correct: false, chosen: -1 })
// Insight (P0.5): ทรัพยากรความรู้ฝั่ง turn-based — ตอบถูก +1 (cap 5), Counter ต้องจ่าย 1
// ปิดทางใช้ Counter รัวๆ ฆ่าศัตรูโดยไม่ตอบคำถามเลย
const insight = ref(0)
// Flip MONSTER_INTENTS: มอนสเตอร์ประกาศท่าถัดไปล่วงหน้า — Counter/Support มีจังหวะให้ตัดสินใจจริง
const intent = ref<MonsterIntentId>('attack')
const intentSpec = computed(() => (MONSTER_INTENTS_ENABLED && active.value ? MONSTER_INTENTS[intent.value] : null))
function nextIntent() {
  if (MONSTER_INTENTS_ENABLED) intent.value = rollIntent(Math.random, enc.isBoss)
}
const whyWrong = computed(() =>
  feedback.visible && !feedback.correct && feedback.chosen >= 0
    ? question.distractorReasoning?.[String(feedback.chosen)]
    : undefined)
// idempotency guard: ป้องกันจ่ายรางวัลซ้ำถ้า winBattle ยิงมากกว่าหนึ่งครั้งต่อการต่อสู้ (กติกาข้อ 3)
const rewardLedger = new RewardLedger()
const encounterId = ref('')
let battleSeq = 0
const monsterHit = ref(false)
const playerHit = ref(false)
// Icon ฝั่งผู้เล่นใช้ตัวเดียวกับ sprite ในแมพ (Occupation.png)
const playerIcon = computed(() => `character-icons/${player.classId}_${player.gender}.png`)
function pulse(flag: typeof monsterHit) {
  flag.value = false
  requestAnimationFrame(() => { flag.value = true; setTimeout(() => { flag.value = false }, 450) })
}
const playerHpPct = computed(() => Math.max(0, Math.round((player.hp / player.maxHp) * 100)))
const monsterHpPct = computed(() => Math.max(0, Math.round((monster.hp / monster.maxHp) * 100)))
const hasPotion = computed(() => !enc.noPotion && ((player.inventory.potion_s ?? 0) > 0 || (player.inventory.potion_m ?? 0) > 0))

function assetPath(path?: string) {
  if (!path) return ''
  const cleanPath = path.replace(/^\/+/, '')
  const base = runtimeConfig.app.baseURL.endsWith('/') ? runtimeConfig.app.baseURL : `${runtimeConfig.app.baseURL}/`
  return `${base}${cleanPath}`
}
function loadQuestion() {
  const monsterPick = selectMonsterQuestion({
    monsterId: enc.monsterId,
    isBoss: enc.isBoss,
    floor: floor.value,
    difficulty: getQuestionDifficulty(floor.value),
    seenIds: player.monsterQuestionHistory[enc.monsterId || 'unknown-monster'] ?? [],
  })
  const masteryPick = MASTERY_BATTLE_SELECTION_ENABLED
    ? drawBattleQuestion(CURRICULUM_QUESTIONS, floor.value, getQuestionDifficulty(floor.value), learning.mastery)
    : null
  const picked = monsterPick?.question ?? masteryPick ?? getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1, floor.value)[0]
  if (!picked) return
  if (monsterPick) player.recordMonsterQuestion(enc.monsterId, picked.id, monsterPick.exhaustedCycle)
  Object.assign(question, { explanation: undefined, distractorReasoning: undefined, subskillId: undefined, patternId: undefined }, picked)
}

function setupMonster(payload: import('~/game/systems/eventBus').EncounterInfo) {
  // สูตรตั้งค่ามอนสเตอร์/รางวัล/ลำดับการโจมตี อยู่ใน combat domain (ADR 0002)
  const setup = setupEncounter(payload, config.value, world.value.combatModifier)
  enc.isBoss = setup.isBoss
  enc.expReward = setup.expReward
  enc.goldReward = setup.goldReward
  enc.monsterId = payload.monsterId
  enc.elite = !!payload.elite
  enc.rare = !!payload.rare
  enc.noPotion = !!payload.riftModifiers?.includes('no-potion')
  monster.name = setup.name
  monster.maxHp = setup.maxHp
  monster.hp = setup.maxHp
  monster.atk = setup.atk
  monster.speed = setup.speed
  monster.sprite = assetPath(payload.sprite ?? 'mob-sprites/mca/slime.png')
  turn.value = heroWinsInitiative(player.speed, monster.speed, world.value.combatModifier.playerSpeed) ? 'Hero' : 'Monster'
}

const onBattleStart = (payload: import('~/game/systems/eventBus').EncounterInfo) => {
  // Per-zone gate (PHASE_14_PLAN §3): World-1 floors run on the real-time path when
  // REALTIME_COMBAT_ENABLED — RealtimeBattle owns those encounters. Floors 11+ (and every floor while
  // the flag is off) stay turn-based here. Flag off ⇒ this guard is inert and BattleModal owns all.
  if (REALTIME_COMBAT_ENABLED && isWorld1Floor(payload.floor)) return
  floor.value = payload.floor
  active.value = true
  locked.value = false
  combo.value = 0
  insight.value = 0
  feedback.visible = false
  feedback.chosen = -1
  encounterId.value = `f${payload.floor}:${Date.now()}:${battleSeq++}`
  setupMonster(payload)
  nextIntent()
  loadQuestion()
  log.value = turn.value === 'Hero' ? 'Your speed wins initiative. Answer correctly to attack.' : 'The monster is faster.'
  if (turn.value === 'Monster') setTimeout(monsterAttack, 700)
}
const onBattleAbort = () => { active.value = false; locked.value = false; feedback.visible = false }
gameEvents.on('battle:start', onBattleStart)
gameEvents.on('battle:abort', onBattleAbort)
// P0.9: ปลด listener เมื่อ component ถูกถอด
onUnmounted(() => {
  gameEvents.off('battle:start', onBattleStart)
  gameEvents.off('battle:abort', onBattleAbort)
})

function finish(outcome: BattleOutcome) {
  active.value = false
  gameEvents.emit('battle:end', { outcome, won: outcome === 'victory', isBoss: enc.isBoss, monsterId: enc.monsterId, elite: enc.elite, rare: enc.rare, expReward: enc.expReward })
}

// ดาเมจฮีโร่มาจาก combat domain (single source). flag COMBAT_DOMAIN_ENABLED สลับไปใช้ engine resolver
// ซึ่งจัดการหัก HP มอนสเตอร์ให้ด้วย; path เดิม (flag off) เรียกสูตร domain ตรงๆ แล้วหัก HP เอง
function heroDamage(multiplier = 1) {
  return domainHeroDamage(player.atk, player.knowledge, multiplier, world.value.combatModifier.knowledge)
}

function heroHit(skill: 'attack' | 'counter'): number {
  if (COMBAT_DOMAIN_ENABLED) {
    const res = resolveHeroSkill(skill, {
      atk: player.atk, knowledge: player.knowledge, combo: combo.value,
      monsterHp: monster.hp, world: world.value.combatModifier,
    })
    monster.hp = res.targetHpAfter
    return res.raw
  }
  const damage = heroDamage(skill === 'attack' ? 1 + comboBonus.value : 0.65)
  monster.hp = Math.max(0, monster.hp - damage)
  return damage
}

function answer(index: number) {
  locked.value = true
  feedback.visible = true
  feedback.correct = index === question.answerIndex
  feedback.chosen = index
  // ทุกคำตอบในไฟต์คือ learning event — ป้อนเข้า mastery (ไม่เคยอ่านกลับมา scale พลังต่อสู้)
  learning.recordBattleAnswer(question.subskillId, feedback.correct)
  if (feedback.correct) {
    player.recordCorrectAnswer()
    combo.value++
    insight.value = Math.min(5, insight.value + 1) // ตอบถูก = ได้ Insight (ใช้จ่ายกับ Counter)
    const damage = heroHit('attack')
    pulse(monsterHit)
    gameEvents.emit('audio:sfx', { key: 'attack' })
    log.value = combo.value >= 2
      ? `Correct! Combo x${combo.value} — you attack for ${damage} damage.`
      : `Correct. You attack for ${damage} damage.`
    if (monster.hp <= 0) return winBattle()
    // เว้นจังหวะให้อ่านคำอธิบายสั้นๆ ก่อนมอนสเตอร์ตอบโต้ (ตอบถูก = อ่านเสริมความเข้าใจ)
    setTimeout(monsterAttack, 1800)
  } else {
    combo.value = 0
    log.value = 'Wrong answer. Combo lost — read the explanation, then continue.'
    // ตอบผิด: เกมหยุดรอจนกดปุ่ม "สู้ต่อ" — เวลาอ่านไม่จำกัด นี่คือจังหวะเรียนรู้ที่สำคัญที่สุด
  }
}

function continueAfterWrong() {
  if (!active.value) return
  monsterAttack()
}

// ค่าร่าย MP ของสกิลต่อสู้ (SUPPORT_MP/COUNTER_MP) นิยามใน combat domain — ตอบถูกฟื้น MP +2/ข้อ (recordCorrectAnswer)
function support() {
  if (!player.spendMp(SUPPORT_MP)) return
  locked.value = true
  const heal = supportHeal(player.knowledge)
  player.heal(heal)
  log.value = `Support skill restores ${heal} HP and steadies your next answer. (-${SUPPORT_MP} MP)`
  setTimeout(monsterAttack, 700)
}

function usePotion() {
  if (enc.noPotion) { log.value = 'Dry Run: potions are sealed inside this Rift.'; return }
  locked.value = true
  const item = (player.inventory.potion_m ?? 0) > 0 ? 'potion_m' : 'potion_s'
  player.useConsumable(item)
  log.value = 'You use a potion.'
  setTimeout(monsterAttack, 700)
}

function counter() {
  // P0.5: ดาเมจต้องมีความรู้หนุน — Counter ใช้ Insight 1 หน่วย (ได้จากการตอบถูกเท่านั้น)
  if (insight.value < 1 || !player.spendMp(COUNTER_MP)) return
  insight.value -= 1
  locked.value = true
  const damage = heroHit('counter')
  log.value = `Counter stance deals ${damage} damage and reduces the next hit. (-${COUNTER_MP} MP, -1 ✦)`
  if (monster.hp <= 0) return winBattle()
  setTimeout(() => monsterAttack(0.45), 700)
}

function escape() {
  // P0.3/P0.4 — หนีสำเร็จ = 'escaped' (ออกจากไฟต์ กลับไปเดินต่อ ไม่ใช่ KO);
  // หนีพลาด = ไฟต์ดำเนินต่อ + มอนสเตอร์ได้จังหวะตีฟรีหนึ่งครั้ง (เดิม logic กลับด้านทั้งคู่)
  if (locked.value) return
  if (Math.random() < escapeChance(player.speed)) {
    player.addLog(`Fled from ${monster.name} on Floor ${floor.value}.`)
    finish('escaped')
  } else {
    locked.value = true
    log.value = 'Escape failed! The monster gets a free hit.'
    setTimeout(monsterAttack, 700)
  }
}

function monsterAttack(multiplier = 1) {
  if (!active.value) return
  feedback.visible = false
  feedback.chosen = -1
  const spec = MONSTER_INTENTS_ENABLED ? MONSTER_INTENTS[intent.value] : null
  // snarl: ขู่แต่ไม่โจมตี — เทิร์นฟรีของผู้เล่น (ตามที่ประกาศไว้ล่วงหน้า)
  if (spec && spec.multiplier === 0) {
    nextIntent()
    turn.value = 'Hero'
    locked.value = false
    loadQuestion()
    log.value = `${monster.name} snarls menacingly... but holds back. Free turn!`
    return
  }
  const intentMult = spec?.multiplier ?? 1
  // raw damage มาจาก domain (engine resolver เมื่อ flag on / monsterDamage ตรงๆ เมื่อ off); การหัก def อยู่ใน player.takeDamage
  const damage = COMBAT_DOMAIN_ENABLED
    ? resolveMonsterAttack({ monsterAtk: monster.atk, multiplier: multiplier * intentMult, heroHp: player.hp, heroDef: player.def }).raw
    : monsterDamage(monster.atk, multiplier * intentMult)
  player.takeDamage(damage)
  pulse(playerHit)
  gameEvents.emit('audio:sfx', { key: 'hit' })
  if (player.hp <= 0) {
    player.addLog(`Knocked out by ${monster.name} on Floor ${floor.value}.`)
    return finish('defeat')
  }
  const wasHeavy = spec?.id === 'heavy'
  nextIntent()
  turn.value = 'Hero'
  locked.value = false
  loadQuestion()
  log.value = wasHeavy
    ? `HEAVY BLOW! ${monster.name} smashes for ${damage}. Choose the next answer.`
    : `Monster hits for ${damage}. Choose the next answer.`
}

function winBattle() {
  // บอสดรอปเพชร: บอสธรรมดา 1 เม็ด / world boss (ทุก 10 ชั้น) 3 เม็ด — สูตรใน combat domain
  const gems = gemsForEncounter(enc.isBoss, config.value.isMilestone)
  const ownedItemIds = [...Object.entries(player.inventory).filter(([, qty]) => qty > 0).map(([id]) => id), ...Object.values(player.equipment).filter((id): id is string => !!id)]
  const drops = rollLoot(floor.value, enc.isBoss, {
    monsterId: enc.monsterId, elite: enc.elite, rare: enc.rare,
    setPityCount: enc.monsterId ? player.setDropPity[enc.monsterId] ?? 0 : 0,
    ownedItemIds,
  })
  const pityDrop = drops.find((drop) => drop.guaranteed)
  const reward = buildRewardRequest({
    encounterId: encounterId.value,
    exp: enc.expReward,
    gold: enc.goldReward,
    gems,
    loot: drops.map((d) => ({ itemId: d.itemId, name: d.name, qty: d.qty })),
  })
  // จ่ายรางวัลครั้งเดียวต่อ encounter — winBattle ที่ยิงซ้ำจะไม่จ่ายซ้ำ (validated + idempotent, กติกาข้อ 3)
  if (rewardLedger.claim(reward)) {
    player.gainCombatRewards(reward.exp, reward.gold, reward.gems)
    player.recordDefeat()
    for (const drop of reward.loot) player.addItem(drop.itemId, drop.qty)
  }
  gameEvents.emit('audio:sfx', { key: 'victory' })
  if (reward.loot.some((drop) => drop.itemId.startsWith('set_')) || enc.rare) {
    setTimeout(() => gameEvents.emit('audio:sfx', { key: 'rare_drop' }), 220)
  }
  if (pityDrop) player.addLog(`Pity guarantee activated: ${pityDrop.name}.`)
  const dropText = reward.loot.length ? ` Dropped: ${reward.loot.map((d) => `${d.name} x${d.qty}`).join(', ')}.` : ''
  const gemText = reward.gems ? ` +${reward.gems} Gems.` : ''
  log.value = `Victory. +${reward.exp} EXP, +${reward.gold} gold.${gemText}${dropText}`
  player.addLog(`Defeated ${monster.name} on Floor ${floor.value} (+${reward.exp} EXP, +${reward.gold}g${reward.gems ? `, +${reward.gems} Gems` : ''})`)
  setTimeout(() => finish('victory'), 1100)
}
</script>

<style scoped>
@keyframes battle-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.battle-shake { animation: battle-shake 0.4s ease-in-out; }
@keyframes battle-flash {
  0%, 100% { filter: none; }
  30% { filter: brightness(2.4) saturate(0.4); }
}
.battle-flash { animation: battle-flash 0.45s ease-out; }
@keyframes combo-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.combo-badge { animation: combo-pop 0.3s ease-out; }
.pixelated { image-rendering: pixelated; }
</style>



