<template>
  <div v-if="open" class="modal-backdrop">
    <div class="pixel-window anime-window w-full max-w-md">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">{{ region.guardian }} · Guardian Gate</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body space-y-3 p-4">
        <p class="text-xs opacity-80">
          {{ ready ? 'The gate is open. Only the boss awaits beyond — no escape until it falls.' : 'The gate is sealed. Meet every requirement to enter the boss arena.' }}
        </p>

        <ul class="space-y-2 text-xs">
          <li v-for="q in objectives" :key="q.label" class="gate-row">
            <span class="gate-check" :class="{ 'gate-check-done': q.done }">{{ q.done ? '✓' : '•' }}</span>
            <span class="flex-1">{{ q.label }}</span>
            <span :class="q.done ? 'text-emerald-300' : 'text-[#cdb27a]'">{{ q.progress }}</span>
          </li>
        </ul>

        <div class="glass-panel p-2 text-xs">
          <span class="gold-text font-bold">Reward:</span>
          ⭐ {{ reward.expReward }} EXP · 🪙 {{ reward.goldReward }}g · 💎 {{ isMilestone ? 3 : 1 }} Gems · 🚪 Adventure Rank {{ floor + 1 }}
        </div>

        <button class="btn-primary w-full" :disabled="!ready" @click="enter">
          {{ ready ? 'Enter Boss Arena ▲' : 'Requirements not met' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gameEvents } from '~/game/systems/eventBus'
import { getBossRequirement } from '~/data/bossRequirements'
import { getBossStats } from '~/data/floors'
import { regionForFloor } from '~/data/adventureRegions'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean; floor: number }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
const region = computed(() => regionForFloor(props.floor))
const requirement = computed(() => getBossRequirement(props.floor))
const reward = computed(() => getBossStats(props.floor))
const isMilestone = computed(() => props.floor % 10 === 0)

const objectives = computed(() => {
  const req = requirement.value
  const rows = [
    { label: `Reach Level ${req.level}`, done: player.level >= req.level, progress: `${Math.min(player.level, req.level)}/${req.level}` },
    { label: `Answer ${req.correctAnswers} questions correctly (total)`, done: player.correctAnswers >= req.correctAnswers, progress: `${Math.min(player.correctAnswers, req.correctAnswers)}/${req.correctAnswers}` },
  ]
  if (req.keyItem) {
    const have = player.inventory[req.keyItem.id] ?? 0
    rows.push({ label: `Collect ${req.keyItem.name}`, done: have >= req.keyItem.qty, progress: `${Math.min(have, req.keyItem.qty)}/${req.keyItem.qty}` })
  }
  return rows
})
const ready = computed(() => objectives.value.every((o) => o.done))

function enter() {
  if (!ready.value) return
  gameEvents.emit('boss:enter')
}
</script>

<style scoped>
.gate-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.45);
  background: rgba(0, 0, 0, 0.3);
}
.gate-check {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(205, 178, 122, 0.5);
  font-size: 10px;
  color: #cdb27a;
  flex-shrink: 0;
}
.gate-check-done { color: #0c1f12; background: #6ee7a0; border-color: #b7f5cf; font-weight: 800; }
</style>
