<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">{{ tabTitle }}</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="flex shrink-0 gap-1 border-b border-[#6e5124]/60 px-3 pt-2">
        <button v-for="t in tabs" :key="t.id" class="sys-tab" :class="{ 'sys-tab-active': tab === t.id }" @click="tab = t.id">
          {{ t.icon }} {{ t.label }}
        </button>
      </div>
      <div class="pixel-window-body p-4 text-sm">
        <div v-if="tab === 'settings'" class="space-y-3">
          <label class="flex items-center justify-between gap-3">Sound <input v-model="settings.sound" type="checkbox" class="title-toggle"></label>
          <label class="flex items-center justify-between gap-3">Reduce animation <input v-model="settings.reducedMotion" type="checkbox" class="title-toggle"></label>
          <label>Language
            <select v-model="settings.language" class="field mt-1 py-1 text-xs">
              <option value="en">English</option>
              <option value="th">Thai</option>
            </select>
          </label>
        </div>

        <div v-else-if="tab === 'leaderboard'">
          <p v-if="loadingBoard" class="opacity-70">Loading leaderboard…</p>
          <p v-else-if="!board.length" class="opacity-70">
            No leaderboard data yet. Scores sync to Google Sheets when the backend URL is configured.
          </p>
          <ol v-else class="space-y-1">
            <li v-for="(row, i) in board" :key="i" class="glass-panel flex items-center justify-between px-3 py-1.5 text-xs">
              <span><span class="gold-text mr-2 font-bold">#{{ i + 1 }}</span>{{ row.name }}</span>
              <span>Lv.{{ row.level }} · Floor {{ row.floor }}</span>
            </li>
          </ol>
        </div>

        <div v-else-if="tab === 'guide'" class="space-y-2 leading-relaxed">
          <p><span class="gold-text font-bold">Explore</span> — Walk with the arrow keys. Touch a monster to start a battle.</p>
          <p><span class="gold-text font-bold">Battle</span> — Answer the English question correctly to attack. Combos raise your damage. Support and Counter skills cost MP; each correct answer restores 2 MP.</p>
          <p><span class="gold-text font-bold">Boss</span> — Meet the quest requirements (see Quests) to open the boss room. Beat the boss to advance a floor. Bosses drop Gems.</p>
          <p><span class="gold-text font-bold">Town</span> — Every 10th+1 floor is a town: heal at the Hospital, buy items and gear, learn skills at the Guild Hall.</p>
        </div>

        <div v-else class="space-y-2 leading-relaxed">
          <p class="gold-text font-bold">News / Update</p>
          <p>The Floating Realms now feature the full ornate interface — MP and Gems systems, quest tracking, a tower map, and an adventure log. Storm-lit nights ahead. Good luck, hero!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useSheetsSync } from '~/composables/useSheetsSync'

type SystemTab = 'settings' | 'leaderboard' | 'guide' | 'news'

const props = defineProps<{ open: boolean; initialTab?: SystemTab }>()
defineEmits<{ (e: 'close'): void }>()

const settings = useSettingsStore()
const { getLeaderboard } = useSheetsSync()
const tab = ref<SystemTab>(props.initialTab ?? 'settings')
const board = ref<{ name: string; level: number; floor: number }[]>([])
const loadingBoard = ref(false)

const tabs = [
  { id: 'settings' as const, icon: '⚙', label: 'Settings' },
  { id: 'leaderboard' as const, icon: '🏆', label: 'Ranking' },
  { id: 'guide' as const, icon: '📖', label: 'Guide' },
  { id: 'news' as const, icon: '✉', label: 'News' },
]
const tabTitle = computed(() => tabs.find((t) => t.id === tab.value)?.label ?? 'System')

watch(() => props.open, (open) => {
  if (open && props.initialTab) tab.value = props.initialTab
})
watch(tab, async (t) => {
  if (t !== 'leaderboard' || board.value.length) return
  loadingBoard.value = true
  try {
    const rows = await getLeaderboard()
    board.value = Array.isArray(rows) ? rows.slice(0, 10) : []
  } finally {
    loadingBoard.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.sys-tab {
  padding: 5px 12px;
  border-radius: 6px 6px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 12px;
  color: #cdb27a;
  transition: all 100ms;
}
.sys-tab:hover { color: #f0e2bd; }
.sys-tab-active {
  color: #f2c14e;
  font-weight: 700;
  border-color: #6e5124;
  background: linear-gradient(180deg, rgba(44, 33, 19, 0.9), rgba(22, 16, 7, 0.9));
}
</style>
