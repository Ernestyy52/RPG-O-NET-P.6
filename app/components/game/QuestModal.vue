<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Quests — Floor {{ player.currentFloor }}</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body space-y-3 p-4">
        <div class="glass-panel p-3">
          <div class="mb-1 flex items-center justify-between">
            <h3 class="gold-text text-sm font-bold">{{ isMilestone ? 'World Boss Gate' : 'Boss Room Gate' }}</h3>
            <span class="quest-state" :class="allDone ? 'quest-state-done' : ''">{{ allDone ? 'READY' : 'IN PROGRESS' }}</span>
          </div>
          <p class="mb-3 text-xs opacity-70">
            {{ allDone ? 'All requirements met — the boss room is open. Enter the door at the top of the floor.' : 'Complete every requirement below to unlock the boss room on this floor.' }}
          </p>
          <ul class="space-y-2 text-xs">
            <li v-for="q in objectives" :key="q.label" class="quest-row">
              <span class="quest-check" :class="{ 'quest-check-done': q.done }">{{ q.done ? '✓' : '•' }}</span>
              <span class="flex-1">{{ q.label }}</span>
              <span class="quest-progress" :class="{ 'text-emerald-300': q.done }">{{ q.progress }}</span>
            </li>
          </ul>
        </div>

        <div class="glass-panel p-3">
          <h3 class="gold-text mb-1 text-sm font-bold">Boss Reward</h3>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>⭐ {{ bossReward.expReward }} EXP</span>
            <span class="gold-text">🪙 {{ bossReward.goldReward }} Gold</span>
            <span class="text-cyan-200">💎 {{ isMilestone ? 3 : 1 }} Gems</span>
            <span>🚪 Advance to Floor {{ player.currentFloor + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getBossRequirement } from '~/data/bossRequirements'
import { getBossStats } from '~/data/floors'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
const requirement = computed(() => getBossRequirement(player.currentFloor))
const bossReward = computed(() => getBossStats(player.currentFloor))
const isMilestone = computed(() => player.currentFloor % 10 === 0)

const objectives = computed(() => {
  const req = requirement.value
  const rows = [
    {
      label: `Reach Level ${req.level}`,
      done: player.level >= req.level,
      progress: `${Math.min(player.level, req.level)}/${req.level}`,
    },
    {
      label: `Answer ${req.correctAnswers} questions correctly (total)`,
      done: player.correctAnswers >= req.correctAnswers,
      progress: `${Math.min(player.correctAnswers, req.correctAnswers)}/${req.correctAnswers}`,
    },
  ]
  if (req.keyItem) {
    const have = player.inventory[req.keyItem.id] ?? 0
    rows.push({
      label: `Collect ${req.keyItem.name} from monsters in this world`,
      done: have >= req.keyItem.qty,
      progress: `${Math.min(have, req.keyItem.qty)}/${req.keyItem.qty}`,
    })
  }
  return rows
})
const allDone = computed(() => objectives.value.every((o) => o.done))
</script>

<style scoped>
.quest-state {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(205, 178, 122, 0.5);
  color: #cdb27a;
}
.quest-state-done {
  color: #6ee7a0;
  border-color: rgba(110, 231, 160, 0.55);
  box-shadow: 0 0 8px rgba(110, 231, 160, 0.3);
}
.quest-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.45);
  background: rgba(0, 0, 0, 0.3);
}
.quest-check {
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
.quest-check-done {
  color: #0c1f12;
  background: #6ee7a0;
  border-color: #b7f5cf;
  font-weight: 800;
}
.quest-progress { font-weight: 700; color: #cdb27a; }
</style>
