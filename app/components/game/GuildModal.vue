<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Guild Hall</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="flex shrink-0 gap-1 border-b border-[#6e5124]/60 px-3 pt-2">
        <button class="g-tab" :class="{ 'g-tab-active': floor === 1 }" @click="floor = 1">🗒 1F · Daily Quests</button>
        <button class="g-tab" :class="{ 'g-tab-active': floor === 2 }" @click="floor = 2">📚 2F · Study Room</button>
      </div>

      <!-- ชั้น 1: เควสรายวัน / Adaptive Expedition -->
      <div v-if="floor === 1" class="pixel-window-body space-y-2 p-4">
        <!-- Adaptive expedition (flip #7): content-tied daily objectives from the learner's progress -->
        <template v-if="expeditionActive">
          <div class="flex items-baseline justify-between">
            <h3 class="gold-text text-sm font-bold">{{ learning.expedition!.title }}</h3>
            <span class="text-[11px] opacity-70">Today's Expedition · {{ completedCount }}/{{ objectives.length }}</span>
          </div>
          <p class="text-xs opacity-75">Adaptive objectives drawn from your learning progress — practice as you adventure, then claim here.</p>
          <div v-for="o in objectives" :key="o.id" class="glass-panel flex items-center gap-3 p-3">
            <div class="flex-1">
              <div class="text-sm font-bold">{{ o.description }} <span v-if="o.bonus" class="rounded bg-cyan-900/50 px-1 text-[9px] text-cyan-200">BONUS</span></div>
              <div class="mt-1 text-[11px] opacity-80">
                Reward: <span class="gold-text">{{ o.reward.gold }}g</span>
                <span v-if="o.reward.gems"> · <span class="text-cyan-200">{{ o.reward.gems }}💎</span></span>
                · {{ o.reward.exp }} EXP
              </div>
            </div>
            <button class="btn-primary btn-sm" :disabled="!o.complete || o.claimed" @click="claimObjective(o.id)">
              {{ o.claimed ? 'Claimed' : o.complete ? 'Claim' : 'In progress' }}
            </button>
          </div>
        </template>

        <!-- Fallback: legacy daily quests (flag off, or no reviewed content yet) -->
        <template v-else>
          <p class="text-xs opacity-75">Reception desk — complete daily tasks for gold, gems, and EXP. Resets each day.</p>
          <div v-for="q in player.dailyQuests" :key="q.id" class="glass-panel flex items-center gap-3 p-3">
            <div class="flex-1">
              <div class="text-sm font-bold">{{ q.label }}</div>
              <div class="mt-1 h-2 overflow-hidden rounded bg-black/40">
                <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${Math.round((q.progress / q.target) * 100)}%` }" />
              </div>
              <div class="mt-1 text-[11px] opacity-80">
                {{ q.progress }}/{{ q.target }} · Reward:
                <span class="gold-text">{{ q.reward.gold }}g</span>
                <span v-if="q.reward.gems"> · <span class="text-cyan-200">{{ q.reward.gems }}💎</span></span>
                · {{ q.reward.exp }} EXP
              </div>
            </div>
            <button class="btn-primary btn-sm" :disabled="q.claimed || q.progress < q.target" @click="player.claimQuest(q.id)">
              {{ q.claimed ? 'Claimed' : q.progress >= q.target ? 'Claim' : 'In progress' }}
            </button>
          </div>
        </template>
      </div>

      <!-- ชั้น 2: ห้องเรียน (เนื้อหาจาก knowledge/) -->
      <div v-else class="pixel-window-body p-4">
        <p class="mb-2 text-xs opacity-75">Study room — lessons drawn from 11 years of O-NET exam patterns. Read up before you fight!</p>
        <div class="mb-3 flex flex-wrap gap-1">
          <button v-for="c in STUDY_CATEGORIES" :key="c.id" class="cat-chip" :class="{ 'cat-chip-active': cat === c.id }" @click="cat = c.id">{{ c.label }}</button>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <button v-for="l in lessons" :key="l.id" class="glass-panel p-2 text-left transition-all hover:brightness-125" @click="openLesson = l">
            <div class="text-sm font-bold text-[#f2c14e]">{{ l.title }}</div>
            <div class="text-[11px] opacity-80">{{ l.titleTh }} · {{ l.cefr }}</div>
            <div class="mt-1 text-[10px] uppercase tracking-wide text-[#cdb27a]">{{ l.category }}</div>
          </button>
        </div>

        <!-- รายละเอียดบทเรียน -->
        <div v-if="openLesson" class="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-3" @click.self="openLesson = null">
          <div class="pixel-window w-full max-w-lg">
            <div class="pixel-titlebar">
              <div>
                <h3 class="gold-text text-base font-bold">{{ openLesson.title }}</h3>
                <p class="text-xs opacity-75">{{ openLesson.titleTh }} · {{ openLesson.cefr }}</p>
              </div>
              <button class="icon-btn-close" aria-label="Close" @click="openLesson = null">✕</button>
            </div>
            <div class="pixel-window-body space-y-3 p-4 text-sm">
              <p class="rounded bg-black/25 p-2 text-[13px]">{{ openLesson.summary }}</p>
              <div>
                <div class="mb-1 text-xs font-bold text-[#cdb27a]">Key points</div>
                <ul class="list-disc space-y-1 pl-5 text-[13px]">
                  <li v-for="(p, i) in openLesson.points" :key="i">{{ p }}</li>
                </ul>
              </div>
              <div>
                <div class="mb-1 text-xs font-bold text-[#cdb27a]">Examples</div>
                <div v-for="(ex, i) in openLesson.examples" :key="i" class="mb-1 rounded border border-[#6e5124]/50 bg-black/20 p-2">
                  <div class="font-medium text-[#e8d9a8]">{{ ex.en }}</div>
                  <div class="text-[11px] opacity-70">{{ ex.th }}</div>
                </div>
              </div>
              <p class="rounded border border-amber-700/50 bg-amber-900/20 p-2 text-[12px]">💡 {{ openLesson.tip }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { STUDY_LESSONS, STUDY_CATEGORIES, type StudyCategory, type StudyLesson } from '~/data/study'
import { ADAPTIVE_EXPEDITIONS_ENABLED } from '~/data/learning/expedition'
import { usePlayerStore } from '~/stores/player'
import { useLearningStore } from '~/stores/learning'

const props = defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
const learning = useLearningStore()
const floor = ref<1 | 2>(1)
const cat = ref<StudyCategory | 'all'>('all')
const openLesson = ref<StudyLesson | null>(null)

const lessons = computed(() =>
  cat.value === 'all' ? STUDY_LESSONS : STUDY_LESSONS.filter((l) => l.category === cat.value),
)

// Adaptive expedition (flip #7): serve it in 1F when the flag is on and there's real reviewed content;
// otherwise fall back to the legacy daily quests (unchanged). expedition.fallback ⇒ no content yet.
const expeditionActive = computed(() =>
  ADAPTIVE_EXPEDITIONS_ENABLED && !!learning.expedition && !learning.expedition.fallback,
)
const objectives = computed(() => {
  const exp = learning.expedition
  const result = learning.expeditionResult
  if (!exp || !result) return []
  return exp.objectives.map((o) => ({
    ...o,
    complete: !!result.objectives.find((x) => x.id === o.id)?.complete,
    claimed: learning.claimedObjectives.includes(o.id),
  }))
})
const completedCount = computed(() => objectives.value.filter((o) => o.complete).length)
function claimObjective(id: string) {
  const reward = learning.claimExpeditionObjective(id)
  if (!reward) return
  player.gainRewards(reward.exp, reward.gold, reward.gems)
  player.addLog(`Expedition objective complete (+${reward.gold}g${reward.gems ? `, +${reward.gems} gems` : ''}, +${reward.exp} EXP)`)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    player.ensureDailyQuests()
    learning.ensureExpedition(new Date().toISOString().slice(0, 10))
    floor.value = 1
    openLesson.value = null
  }
}, { immediate: true })
</script>

<style scoped>
.g-tab {
  padding: 5px 12px;
  border-radius: 6px 6px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 12px;
  color: #cdb27a;
  transition: all 100ms;
}
.g-tab:hover { color: #f0e2bd; }
.g-tab-active {
  color: #f2c14e;
  font-weight: 700;
  border-color: #6e5124;
  background: linear-gradient(180deg, rgba(44, 33, 19, 0.9), rgba(22, 16, 7, 0.9));
}
.cat-chip {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(138, 106, 47, 0.5);
  background: rgba(0, 0, 0, 0.3);
  font-size: 11px;
  color: #cdb27a;
}
.cat-chip-active { color: #2a1a08; background: #f2c14e; border-color: #ffe09a; font-weight: 700; }
</style>
