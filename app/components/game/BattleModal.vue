<template>
  <div v-if="active" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
    <div class="pixel-window w-full max-w-3xl overflow-hidden">
      <div class="pixel-titlebar gap-3">
        <div>
          <h2 class="gold-text text-lg font-bold">Floor {{ floor }} {{ config.isBossFloor ? 'Boss' : 'Battle' }}</h2>
          <p class="text-xs opacity-75">{{ cefr }} / {{ world.description }} / Turn: {{ turn }}</p>
        </div>
        <span class="text-sm">HP {{ player.hp }}/{{ player.maxHp }}</span>
      </div>

      <div class="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
        <div class="glass-panel p-3">
          <div class="mb-3 flex items-end justify-between">
            <img :src="assetPath(player.heroClass.sprite)" class="h-24 object-contain pixelated" alt="hero">
            <div class="text-right text-xs">
              <div>{{ player.heroClass.name }}</div>
              <div>SPD {{ player.speed }} / KNO {{ player.knowledge }}</div>
            </div>
          </div>
          <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500" :style="{ width: `${playerHpPct}%` }" /></div>
          <div class="mt-4 flex items-end justify-between">
            <div>
              <div class="font-bold">{{ monster.name }}</div>
              <div class="text-xs opacity-75">HP {{ monster.hp }}/{{ monster.maxHp }} / SPD {{ monster.speed }}</div>
            </div>
            <img :src="monster.sprite" class="h-20 object-contain pixelated" alt="monster">
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-red-500" :style="{ width: `${monsterHpPct}%` }" /></div>
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
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero'" @click="support">Support</button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero' || !hasPotion" @click="usePotion">Item</button>
            <button class="btn-primary text-xs" :disabled="locked || turn !== 'Hero'" @click="counter">Counter</button>
            <button class="btn-secondary text-xs" :disabled="locked || config.isBossFloor" @click="escape">Escape</button>
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
const monster = reactive({ name: 'Slime', hp: 30, maxHp: 30, atk: 4, speed: 4, sprite: '/mob-sprites/slime-idle.png' })
const playerHpPct = computed(() => Math.max(0, Math.round((player.hp / player.maxHp) * 100)))
const monsterHpPct = computed(() => Math.max(0, Math.round((monster.hp / monster.maxHp) * 100)))
const hasPotion = computed(() => (player.inventory.potion_s ?? 0) > 0 || (player.inventory.potion_m ?? 0) > 0)

function assetPath(path: string) {
  const cleanPath = path.replace(/^\/+/, '')
  const base = runtimeConfig.app.baseURL.endsWith('/') ? runtimeConfig.app.baseURL : `${runtimeConfig.app.baseURL}/`
  return `${base}${cleanPath}`
}
function loadQuestion() {
  const [q] = getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1, floor.value)
  Object.assign(question, q)
}

function setupMonster() {
  const cfg = config.value
  monster.name = cfg.isBossFloor ? 'Floor Boss' : 'Dungeon Monster'
  monster.maxHp = Math.round(cfg.monsterHp)
  monster.hp = monster.maxHp
  monster.atk = Math.round(cfg.monsterAtk * world.value.combatModifier.monsterAtk)
  monster.speed = cfg.monsterLevel + (cfg.isBossFloor ? 4 : 0)
  monster.sprite = cfg.isBossFloor ? '/mob-sprites/dragon-idle.png' : '/mob-sprites/slime-idle.png'
  turn.value = player.speed * world.value.combatModifier.playerSpeed >= monster.speed ? 'Hero' : 'Monster'
}

gameEvents.on('battle:start', (payload) => {
  floor.value = payload.floor
  active.value = true
  locked.value = false
  setupMonster()
  loadQuestion()
  log.value = turn.value === 'Hero' ? 'Your speed wins initiative. Answer correctly to attack.' : 'The monster is faster.'
  if (turn.value === 'Monster') setTimeout(monsterAttack, 700)
})

function finish(won: boolean) {
  active.value = false
  gameEvents.emit('battle:end', { won })
}

function heroDamage(multiplier = 1) {
  return Math.max(3, Math.round((player.atk + player.knowledge * 0.6) * multiplier * world.value.combatModifier.knowledge))
}

function answer(index: number) {
  locked.value = true
  if (index === question.answerIndex) {
    player.recordCorrectAnswer()
    const damage = heroDamage(1)
    monster.hp = Math.max(0, monster.hp - damage)
    log.value = `Correct. You attack for ${damage} damage.`
    if (monster.hp <= 0) return winBattle()
  } else {
    log.value = 'Wrong answer. The monster counters.'
  }
  setTimeout(monsterAttack, 800)
}

function support() {
  locked.value = true
  const heal = Math.round(14 + player.knowledge * 2)
  player.heal(heal)
  log.value = `Support skill restores ${heal} HP and steadies your next answer.`
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
  locked.value = true
  const damage = heroDamage(0.65)
  monster.hp = Math.max(0, monster.hp - damage)
  log.value = `Counter stance deals ${damage} damage and reduces the next hit.`
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
  if (player.hp <= 0) return finish(false)
  turn.value = 'Hero'
  locked.value = false
  loadQuestion()
  log.value = `Monster hits. Choose the next answer.`
}

function winBattle() {
  player.gainRewards(config.value.expReward, config.value.goldReward)
  const drops = rollLoot(floor.value, config.value.isBossFloor)
  for (const drop of drops) player.addItem(drop.itemId, drop.qty)
  const dropText = drops.length ? ` Dropped: ${drops.map((d) => `${d.name} x${d.qty}`).join(', ')}.` : ''
  log.value = `Victory. +${config.value.expReward} EXP, +${config.value.goldReward} gold.${dropText}`
  setTimeout(() => finish(true), 1100)
}
</script>



