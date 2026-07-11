<template>
  <div v-if="active" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
    <div class="pixel-window w-full max-w-3xl">
      <div class="pixel-titlebar gap-3">
        <div>
          <h2 class="gold-text text-lg font-bold">Floor {{ floor }} {{ isBossFight ? 'Boss' : 'Battle' }}</h2>
          <p class="text-xs opacity-75">{{ cefr }} / {{ world.description }} / Turn: {{ turn }}</p>
        </div>
        <span class="text-sm">HP {{ player.hp }}/{{ player.maxHp }} <span class="mx-1 opacity-40">|</span> <span class="text-[#9db8ff]">MP {{ player.mp }}/{{ player.maxMp }}</span></span>
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
        </div>

        <div>
          <p class="mb-3 min-h-12 font-medium">{{ log }}</p>
          <p class="mb-3 text-sm opacity-80">{{ question.prompt }}</p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button v-for="(choice, i) in question.choices" :key="i" class="btn-secondary text-left disabled:opacity-50" :disabled="locked || turn !== 'Hero'" @click="answer(i)">
              {{ choice }}
            </button>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || player.mp < SUPPORT_MP" @click="support">Support <span class="opacity-70">{{ SUPPORT_MP }}MP</span></button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || !hasPotion" @click="usePotion">Item</button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || player.mp < COUNTER_MP" @click="counter">Counter <span class="opacity-70">{{ COUNTER_MP }}MP</span></button>
            <button class="btn-secondary text-xs" :disabled="locked || isBossFight" @click="escape">Escape</button>
          </div>
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
import { getWorldState } from '~/data/world'
import { rollLoot } from '~/data/loot'
import { usePlayerStore } from '~/stores/player'

const runtimeConfig = useRuntimeConfig()

const player = usePlayerStore()
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
const enc = reactive<{ isBoss: boolean; expReward: number; goldReward: number }>({ isBoss: false, expReward: 0, goldReward: 0 })
const isBossFight = computed(() => enc.isBoss)
// คอมโบ: ตอบถูกติดกันดาเมจแรงขึ้น +15%/สแตค (สูงสุด +60%) ตอบผิด = รีเซ็ต
const combo = ref(0)
const comboBonus = computed(() => Math.min(0.6, Math.max(0, combo.value - 1) * 0.15))
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
const hasPotion = computed(() => (player.inventory.potion_s ?? 0) > 0 || (player.inventory.potion_m ?? 0) > 0)

function assetPath(path?: string) {
  if (!path) return ''
  const cleanPath = path.replace(/^\/+/, '')
  const base = runtimeConfig.app.baseURL.endsWith('/') ? runtimeConfig.app.baseURL : `${runtimeConfig.app.baseURL}/`
  return `${base}${cleanPath}`
}
function loadQuestion() {
  const [q] = getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1, floor.value)
  Object.assign(question, q)
}

function setupMonster(payload: import('~/game/systems/eventBus').EncounterInfo) {
  const cfg = config.value
  const boss = !!payload.isBoss
  enc.isBoss = boss
  enc.expReward = payload.expReward ?? cfg.expReward
  enc.goldReward = payload.goldReward ?? cfg.goldReward
  monster.name = payload.name ?? (boss ? 'Floor Boss' : 'Dungeon Monster')
  monster.maxHp = Math.round(payload.hp ?? cfg.monsterHp)
  monster.hp = monster.maxHp
  monster.atk = Math.round((payload.atk ?? cfg.monsterAtk) * world.value.combatModifier.monsterAtk)
  monster.speed = (payload.speed ?? cfg.monsterLevel) + (boss ? 4 : 0)
  monster.sprite = assetPath(payload.sprite ?? 'mob-sprites/mca/slime.png')
  turn.value = player.speed * world.value.combatModifier.playerSpeed >= monster.speed ? 'Hero' : 'Monster'
}

gameEvents.on('battle:start', (payload) => {
  floor.value = payload.floor
  active.value = true
  locked.value = false
  combo.value = 0
  setupMonster(payload)
  loadQuestion()
  log.value = turn.value === 'Hero' ? 'Your speed wins initiative. Answer correctly to attack.' : 'The monster is faster.'
  if (turn.value === 'Monster') setTimeout(monsterAttack, 700)
})

function finish(won: boolean) {
  active.value = false
  gameEvents.emit('battle:end', { won, isBoss: enc.isBoss })
}

function heroDamage(multiplier = 1) {
  return Math.max(3, Math.round((player.atk + player.knowledge * 0.6) * multiplier * world.value.combatModifier.knowledge))
}

function answer(index: number) {
  locked.value = true
  if (index === question.answerIndex) {
    player.recordCorrectAnswer()
    combo.value++
    const damage = heroDamage(1 + comboBonus.value)
    monster.hp = Math.max(0, monster.hp - damage)
    pulse(monsterHit)
    log.value = combo.value >= 2
      ? `Correct! Combo x${combo.value} — you attack for ${damage} damage.`
      : `Correct. You attack for ${damage} damage.`
    if (monster.hp <= 0) return winBattle()
  } else {
    combo.value = 0
    log.value = 'Wrong answer. Combo lost — the monster counters.'
  }
  setTimeout(monsterAttack, 800)
}

// ค่าร่าย MP ของสกิลต่อสู้ — ตอบคำถามถูกจะฟื้น MP กลับ (+2/ข้อ ผ่าน recordCorrectAnswer)
const SUPPORT_MP = 8
const COUNTER_MP = 6

function support() {
  if (!player.spendMp(SUPPORT_MP)) return
  locked.value = true
  const heal = Math.round(14 + player.knowledge * 2)
  player.heal(heal)
  log.value = `Support skill restores ${heal} HP and steadies your next answer. (-${SUPPORT_MP} MP)`
  setTimeout(monsterAttack, 700)
}

function usePotion() {
  locked.value = true
  const item = (player.inventory.potion_m ?? 0) > 0 ? 'potion_m' : 'potion_s'
  player.useConsumable(item)
  log.value = 'You use a potion.'
  setTimeout(monsterAttack, 700)
}

function counter() {
  if (!player.spendMp(COUNTER_MP)) return
  locked.value = true
  const damage = heroDamage(0.65)
  monster.hp = Math.max(0, monster.hp - damage)
  log.value = `Counter stance deals ${damage} damage and reduces the next hit. (-${COUNTER_MP} MP)`
  if (monster.hp <= 0) return winBattle()
  setTimeout(() => monsterAttack(0.45), 700)
}

function escape() {
  const chance = Math.min(0.85, 0.35 + player.speed / 40)
  finish(Math.random() < chance ? false : true)
}

function monsterAttack(multiplier = 1) {
  const damage = Math.round(monster.atk * multiplier)
  player.takeDamage(damage)
  pulse(playerHit)
  if (player.hp <= 0) {
    player.addLog(`Knocked out by ${monster.name} on Floor ${floor.value}.`)
    return finish(false)
  }
  turn.value = 'Hero'
  locked.value = false
  loadQuestion()
  log.value = `Monster hits for ${damage}. Choose the next answer.`
}

function winBattle() {
  // บอสดรอปเพชร: บอสธรรมดา 1 เม็ด / world boss (ทุก 10 ชั้น) 3 เม็ด
  const gems = enc.isBoss ? (config.value.isMilestone ? 3 : 1) : 0
  player.gainRewards(enc.expReward, enc.goldReward, gems)
  const drops = rollLoot(floor.value, enc.isBoss)
  for (const drop of drops) player.addItem(drop.itemId, drop.qty)
  const dropText = drops.length ? ` Dropped: ${drops.map((d) => `${d.name} x${d.qty}`).join(', ')}.` : ''
  const gemText = gems ? ` +${gems} Gems.` : ''
  log.value = `Victory. +${enc.expReward} EXP, +${enc.goldReward} gold.${gemText}${dropText}`
  player.addLog(`Defeated ${monster.name} on Floor ${floor.value} (+${enc.expReward} EXP, +${enc.goldReward}g${gems ? `, +${gems} Gems` : ''})`)
  setTimeout(() => finish(true), 1100)
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



