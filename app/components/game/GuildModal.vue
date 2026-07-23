<template>
  <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guild-service-title">
    <div class="pixel-window anime-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <div>
          <p class="ornate-kicker text-[9px]">ADVENTURERS GUILD · 1F</p>
          <h2 id="guild-service-title" class="gold-text text-lg font-bold">
            {{ station === 'hunts' ? 'Rook’s Regional Hunt Desk' : 'Mara’s Quest Reception' }}
          </h2>
        </div>
        <button class="icon-btn-close" type="button" aria-label="ปิดบริการกิลด์" @click="$emit('close')">×</button>
      </div>

      <div v-if="station === 'quests'" class="pixel-window-body space-y-3 p-4">
        <div class="service-rule">
          <b>บริการเฉพาะที่เคาน์เตอร์</b>
          <span>รับและส่งงานได้เพราะคุณเดินมาพบ Mara ที่ Guild 1F แล้ว หน้าต่าง Journal ใช้ดูความคืบหน้าเท่านั้น</span>
        </div>

        <template v-if="expeditionActive">
          <div class="flex items-baseline justify-between gap-2">
            <h3 class="gold-text text-sm font-bold">{{ learning.expedition!.title }}</h3>
            <span class="text-[11px] opacity-70">{{ completedCount }}/{{ objectives.length }}</span>
          </div>
          <div v-for="objective in objectives" :key="objective.id" class="quest-card">
            <div class="flex-1">
              <b>{{ objective.description }}</b>
              <small>{{ objective.reward.exp }} EXP · {{ objective.reward.gold }}g<span v-if="objective.reward.gems"> · {{ objective.reward.gems }} Gem</span></small>
            </div>
            <button class="btn-primary btn-sm" :disabled="!objective.complete || objective.claimed" @click="claimObjective(objective.id)">
              {{ objective.claimed ? 'รับแล้ว' : objective.complete ? 'รับรางวัล' : 'กำลังทำ' }}
            </button>
          </div>
        </template>

        <template v-else>
          <div v-for="quest in player.dailyQuests" :key="quest.id" class="quest-card">
            <div class="flex-1">
              <b>{{ quest.label }}</b>
              <div class="quest-meter"><i :style="{ width: `${Math.round(quest.progress / quest.target * 100)}%` }" /></div>
              <small>{{ quest.progress }}/{{ quest.target }} · {{ quest.reward.exp }} EXP · {{ quest.reward.gold }}g</small>
            </div>
            <button class="btn-primary btn-sm" :disabled="quest.claimed || quest.progress < quest.target" @click="player.claimQuest(quest.id)">
              {{ quest.claimed ? 'รับแล้ว' : quest.progress >= quest.target ? 'รับรางวัล' : 'กำลังทำ' }}
            </button>
          </div>
        </template>

        <div class="academy-callout">
          <span>2F</span>
          <div><b>Guild Academy</b><small>เดินไปที่บันไดด้านขวาของห้อง แล้วพบอาจารย์ประจำทั้ง 5 ห้องเพื่อเรียนเนื้อหา O-NET</small></div>
        </div>
      </div>

      <div v-else class="pixel-window-body space-y-3 p-4">
        <div class="hunt-hero">
          <div><p>REGIONAL REQUESTS</p><h3 class="gold-text font-bold">{{ player.currentRegion.name }}</h3><small>เลือกได้ครั้งละหนึ่งสัญญา เปลี่ยนเป้าหมายได้โดยไม่เสียค่าปรับ</small></div>
          <div class="hunt-rep"><span>REPUTATION</span><b>{{ player.regionReputation[player.adventureRegionId] ?? 0 }}</b></div>
        </div>
        <div v-for="contract in player.huntingBoard" :key="contract.id" class="hunt-card" :class="[contract.difficulty, { active: player.activeHuntId === contract.id }]">
          <div class="hunt-rank">{{ contract.difficulty === 'rare' ? '★' : contract.difficulty === 'elite' ? '◆' : '●' }}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2"><b>{{ contract.targetName }}</b><span>{{ contract.difficulty.toUpperCase() }}</span></div>
            <div class="quest-meter"><i :style="{ width: `${Math.round(contract.progress / contract.target * 100)}%` }" /></div>
            <small>{{ contract.progress }}/{{ contract.target }} · {{ contract.reward.exp }} EXP · {{ contract.reward.gold }}g</small>
          </div>
          <button v-if="contract.progress >= contract.target && !contract.claimed" class="btn-primary btn-sm" @click="player.claimHunt(contract.id)">รับรางวัล</button>
          <button v-else class="btn-secondary btn-sm" :disabled="contract.claimed || player.activeHuntId === contract.id" @click="player.acceptHunt(contract.id)">
            {{ contract.claimed ? 'รับแล้ว' : player.activeHuntId === contract.id ? 'กำลังล่า' : 'รับสัญญา' }}
          </button>
        </div>
        <p class="text-[10px] opacity-60">กระดานเปลี่ยนทุกวันตามภูมิภาคและ Adventure Rank · ต้องกลับมาหา Rook เพื่อรับรางวัล</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ADAPTIVE_EXPEDITIONS_ENABLED } from '~/data/learning/expedition'
import { useLearningStore } from '~/stores/learning'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean; station: 'quests' | 'hunts' }>()
defineEmits<{ (event: 'close'): void }>()
const player = usePlayerStore()
const learning = useLearningStore()
const expeditionActive = computed(() => ADAPTIVE_EXPEDITIONS_ENABLED && !!learning.expedition && !learning.expedition.fallback)
const objectives = computed(() => {
  const expedition = learning.expedition
  const result = learning.expeditionResult
  if (!expedition || !result) return []
  return expedition.objectives.map((objective) => ({
    ...objective,
    complete: !!result.objectives.find((entry) => entry.id === objective.id)?.complete,
    claimed: learning.claimedObjectives.includes(objective.id),
  }))
})
const completedCount = computed(() => objectives.value.filter((objective) => objective.complete).length)

function claimObjective(id: string) {
  const reward = learning.claimExpeditionObjective(id)
  if (!reward) return
  player.gainRewards(reward.exp, reward.gold, reward.gems)
  player.addLog(`Guild expedition complete (+${reward.exp} EXP, +${reward.gold}g).`)
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  player.ensureDailyQuests()
  player.ensureHuntingBoard()
  learning.ensureExpedition(new Date().toISOString().slice(0, 10))
}, { immediate: true })
</script>

<style scoped>
.service-rule { display: grid; gap: 3px; padding: 10px 12px; border: 1px solid #8a6c35; border-radius: 10px 3px 10px 3px; background: linear-gradient(100deg, #4c3a2355, #10131f); }.service-rule b { color: #f0cd7c; font-size: 11px; }.service-rule span { color: #b8ad94; font-size: 10px; }
.quest-card { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid #66553788; border-radius: 8px; background: #090c15aa; }.quest-card b, .quest-card small { display: block; }.quest-card b { color: #eadbb7; font-size: 12px; }.quest-card small { margin-top: 3px; color: #a99d85; font-size: 10px; }
.quest-meter { height: 5px; margin: 6px 0; overflow: hidden; border-radius: 999px; background: #03050a; }.quest-meter i { display: block; height: 100%; background: linear-gradient(90deg, #789c61, #e1c46d); }
.academy-callout { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #5a78a455; border-radius: 8px; background: #17223c88; }.academy-callout > span { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid #7bb7df; border-radius: 50%; color: #a9dfff; font-weight: 900; }.academy-callout b, .academy-callout small { display: block; }.academy-callout b { color: #c9e6ff; font-size: 11px; }.academy-callout small { color: #a7b4c4; font-size: 9px; }
.hunt-hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #896f3f88; border-radius: 9px; background: radial-gradient(circle at 15% 0, #536a513d, transparent 45%), #0e1420cc; }.hunt-hero p { color: #d2b264; font-size: 8px; font-weight: 900; letter-spacing: .15em; }.hunt-hero small { color: #aca18d; font-size: 10px; }.hunt-rep { min-width: 76px; text-align: center; }.hunt-rep span, .hunt-rep b { display: block; }.hunt-rep span { color: #b9aa83; font-size: 8px; }.hunt-rep b { color: #f0cf78; font-size: 22px; }
.hunt-card { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #5c594f66; border-radius: 8px; background: linear-gradient(100deg, #121825, #090c14); }.hunt-card.active { border-color: #d4b566; box-shadow: inset 3px 0 #d4b566; }.hunt-card.elite { background: linear-gradient(100deg, #21192e, #090c14); }.hunt-card.rare { background: linear-gradient(100deg, #322118, #0b0c13); }.hunt-rank { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #8d7443; border-radius: 50%; color: #edc96e; background: #070a10; }.hunt-card b { color: #eee3c9; font-size: 12px; }.hunt-card span, .hunt-card small { color: #b8ad96; font-size: 9px; }.hunt-card span { padding: 1px 5px; border: 1px solid #6f6044; border-radius: 999px; }
</style>

