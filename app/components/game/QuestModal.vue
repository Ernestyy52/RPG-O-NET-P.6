<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Quests — Floor {{ player.currentFloor }}</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body space-y-3 p-4">
        <!-- World-1 main quest (Inc 4) -->
        <div class="glass-panel p-3">
          <div class="mb-1 flex items-center justify-between">
            <h3 class="gold-text text-sm font-bold">Main Quest — The Verdant Slimes</h3>
            <span class="quest-state" :class="mainQuestDone ? 'quest-state-done' : ''">{{ mainQuestDone ? 'COMPLETE' : `STEP ${player.mainQuest.step + 1}/${mainSteps.length}` }}</span>
          </div>
          <template v-if="mainStep">
            <p class="text-sm font-bold text-[#f2c14e]">{{ mainStep.title }} <span class="text-[11px] font-normal opacity-70">{{ mainStep.titleTh }}</span></p>
            <p v-if="giverName" class="text-[11px] text-[#cdb27a]">Given by {{ giverName }}</p>
            <p class="mb-2 text-xs opacity-80">{{ mainStep.summary }}</p>
            <div v-if="mainProgress.target > 1" class="mb-2">
              <div class="h-2 overflow-hidden rounded bg-black/40"><div class="h-full bg-amber-500 transition-all" :style="{ width: `${Math.round((mainProgress.current / mainProgress.target) * 100)}%` }" /></div>
              <div class="mt-0.5 text-[10px] opacity-70">{{ mainProgress.current }}/{{ mainProgress.target }}</div>
            </div>
          </template>
          <p v-else class="text-xs text-emerald-300">You have freed the forest from the Myco Colossus. The Verdant Slimes rest at last.</p>
          <details class="mt-1">
            <summary class="cursor-pointer text-[11px] text-[#cdb27a]">Quest log</summary>
            <ul class="mt-1 space-y-1 text-[11px]">
              <li v-for="s in mainSteps" :key="s.id" class="flex items-center gap-2" :class="{ 'opacity-50': !s.done && !s.active }">
                <span class="quest-check" :class="{ 'quest-check-done': s.done }">{{ s.done ? '✓' : s.active ? '➤' : '•' }}</span>
                <span :class="{ 'font-bold text-[#f2c14e]': s.active }">{{ s.title }}</span>
              </li>
            </ul>
          </details>
        </div>

        <!-- Side quests (Inc 4) -->
        <div v-if="sideQuests.length" class="glass-panel p-3">
          <h3 class="gold-text mb-2 text-sm font-bold">Side Quests</h3>
          <div class="space-y-2">
            <div v-for="s in sideQuests" :key="s.quest.id" class="flex items-center gap-3" :class="{ 'opacity-55': s.claimed }">
              <div class="flex-1">
                <div class="text-xs font-bold">{{ s.quest.title }} <span class="text-[10px] font-normal uppercase tracking-wide text-[#cdb27a]">{{ s.quest.kind }}</span></div>
                <div class="mt-0.5 h-1.5 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500 transition-all" :style="{ width: `${Math.round((s.progress / s.target) * 100)}%` }" /></div>
                <div class="mt-0.5 text-[10px] opacity-70">{{ Math.min(s.progress, s.target) }}/{{ s.target }} · <span class="gold-text">{{ s.quest.reward.gold }}g</span> · {{ s.quest.reward.exp }} EXP<span v-if="s.quest.reward.gems" class="text-cyan-200"> · {{ s.quest.reward.gems }}💎</span></div>
              </div>
              <button class="btn-primary btn-sm" :disabled="!s.done || s.claimed" @click="player.claimSideQuest(s.quest.id)">
                {{ s.claimed ? 'Claimed' : s.done ? 'Claim' : 'Active' }}
              </button>
            </div>
          </div>
        </div>

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
import { WORLD1_MAIN_QUEST } from '~/data/world1/quests'
import { getTownNpc } from '~/data/world1/npcs'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()

// World-1 main quest tracker (Inc 4)
const mainStep = computed(() => player.mainQuestStep)
const mainProgress = computed(() => player.mainQuestProgress)
const mainQuestDone = computed(() => player.mainQuest.step >= WORLD1_MAIN_QUEST.length)
const mainSteps = computed(() => WORLD1_MAIN_QUEST.map((s, i) => ({
  id: s.id, title: s.title, titleTh: s.titleTh,
  done: player.mainQuest.step > i,
  active: player.mainQuest.step === i,
})))
const sideQuests = computed(() => player.sideQuests)
const giverName = computed(() => {
  const g = player.mainQuestStep?.giver
  const npc = g ? getTownNpc(g) : undefined
  return npc ? `${npc.name}, the ${npc.title}` : ''
})
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
