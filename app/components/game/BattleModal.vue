<template>
  <div v-if="active" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div class="w-full max-w-md rounded-xl bg-slate-900 p-6 text-white shadow-xl border border-slate-700">
      <h2 class="mb-1 text-lg font-bold">Floor {{ floor }} - Battle!</h2>
      <p class="mb-4 text-sm text-slate-300">HP: {{ player.hp }} / {{ player.maxHp }}</p>

      <p class="mb-4 font-medium">{{ question.prompt }}</p>

      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="(choice, i) in question.choices"
          :key="i"
          class="rounded border border-slate-600 px-3 py-2 text-left hover:bg-slate-700 disabled:opacity-50"
          :disabled="answered"
          @click="answer(i)"
        >
          {{ choice }}
        </button>
      </div>

      <p v-if="answered" class="mt-4 text-sm" :class="lastCorrect ? 'text-green-400' : 'text-red-400'">
        {{ lastCorrect ? 'ถูกต้อง!' : 'ผิด!' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { gameEvents } from '~/game/systems/eventBus'
import { getFloorConfig, getQuestionDifficulty } from '~/data/floors'
import { getQuestionsForDifficulty, type Question } from '~/data/questions'
import { usePlayerStore } from '~/stores/player'

const player = usePlayerStore()
const active = ref(false)
const floor = ref(1)
const answered = ref(false)
const lastCorrect = ref(false)
const question = reactive<Question>({ id: '', category: 'vocabulary', difficulty: 1, prompt: '', choices: [], answerIndex: 0 })

let remainingMonsters = 1

function loadQuestion() {
  const [q] = getQuestionsForDifficulty(getQuestionDifficulty(floor.value), 1)
  Object.assign(question, q)
  answered.value = false
}

gameEvents.on('battle:start', (payload) => {
  floor.value = payload.floor
  const config = getFloorConfig(payload.floor)
  remainingMonsters = 1
  active.value = true
  loadQuestion()
})

function answer(index: number) {
  answered.value = true
  const config = getFloorConfig(floor.value)
  lastCorrect.value = index === question.answerIndex

  if (lastCorrect.value) {
    player.gainRewards(config.expReward, config.goldReward)
  } else {
    player.takeDamage(config.monsterAtk)
  }

  setTimeout(() => {
    active.value = false
    if (player.hp <= 0) {
      player.heal()
      gameEvents.emit('battle:end', { won: false })
    } else {
      gameEvents.emit('battle:end', { won: true })
    }
  }, 900)
}
</script>
