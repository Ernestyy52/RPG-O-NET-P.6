<template>
  <div v-if="open" class="modal-backdrop">
    <div class="pixel-window anime-window activity-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <div>
          <p class="ornate-kicker text-[9px]">Adventurer's Board</p>
          <h2 class="gold-text text-lg font-bold">Daily Hunts · {{ plan.date }}</h2>
        </div>
        <button class="icon-btn-close" type="button" aria-label="Close activities" @click="$emit('close')">✕</button>
      </div>

      <div class="pixel-window-body p-4">
        <p class="mb-3 text-xs text-[#d8c49a]">ภารกิจสั้น เล่นจบได้ในหนึ่งรอบ รีเซ็ตทุกวัน และไม่มีโทษเมื่อพลาด</p>
        <p v-if="!serviceAccess" class="mb-3 rounded border border-amber-500/40 bg-amber-950/25 p-2 text-[11px] text-amber-100">โหมดติดตามเท่านั้น · เดินไปพบ Lyra ที่ Guild 1F เพื่อรับรางวัลหรือเข้าสู่ Daily Rift</p>
        <div class="grid gap-3 md:grid-cols-3">
          <article v-for="card in cards" :key="card.kind" class="activity-card" :class="`activity-${card.kind}`">
            <div class="activity-emblem"><img :src="assetPath(card.icon)" alt="" class="activity-icon pixelated"></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="activity-type">{{ card.eyebrow }}</p>
                  <h3 class="text-sm font-bold text-[#ffe2a0]">{{ card.title }}</h3>
                </div>
                <span class="quest-state" :class="{ 'quest-state-done': card.complete }">{{ card.claimed ? 'CLAIMED' : card.complete ? 'READY' : 'ACTIVE' }}</span>
              </div>
              <p class="mt-1 min-h-10 text-[11px] leading-relaxed text-[#c9b991]">{{ card.description }}</p>
              <div class="mt-2 h-2 overflow-hidden rounded bg-black/50 ring-1 ring-white/10">
                <div class="h-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-200 transition-all" :style="{ width: `${card.percent}%` }" />
              </div>
              <div class="mt-1 flex justify-between text-[10px]">
                <span>{{ card.progress }}</span>
                <span class="gold-text">{{ rewardText(card.kind) }}</span>
              </div>
              <button
                v-if="card.kind !== 'rift'"
                class="btn-primary mt-3 w-full text-xs"
                type="button"
                :disabled="!serviceAccess || !card.complete || card.claimed"
                @click="claim(card.kind)"
              >{{ card.claimed ? 'รับแล้ว' : card.complete ? 'รับรางวัล' : 'กำลังล่า' }}</button>
              <div v-else class="mt-3 grid grid-cols-2 gap-2">
                <button class="btn-secondary text-xs" type="button" :disabled="!serviceAccess" @click="enterRift">{{ card.complete ? 'เล่นซ้ำ' : 'เข้าสู่ Rift' }}</button>
                <button class="btn-primary text-xs" type="button" :disabled="!serviceAccess || !card.complete || card.claimed" @click="claim('rift')">{{ card.claimed ? 'รับแล้ว' : 'รับรางวัล' }}</button>
              </div>
            </div>
          </article>
        </div>

        <div class="glass-panel mt-3 flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
          <div>
            <p class="font-bold text-[#f2c14e]">Today's Echo Rift: {{ plan.riftName }}</p>
            <p class="mt-0.5 text-[11px] opacity-75">Floor {{ plan.floor }} · {{ plan.layoutVariantName }} · Rare {{ monsterName(plan.rareMonster) }} · Elite {{ monsterName(plan.eliteMonster) }}</p>
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="modifier in plan.modifiers" :key="modifier" class="rounded border border-violet-300/25 bg-violet-950/35 px-2 py-1 text-[10px] text-violet-100" :title="DAILY_RIFT_MODIFIER_LABELS[modifier].description">{{ DAILY_RIFT_MODIFIER_LABELS[modifier].name }}</span>
          </div>
          <span class="rounded border border-amber-400/25 bg-black/25 px-2 py-1 text-[10px] text-[#d8c49a]">Daily seed {{ plan.seed }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DAILY_RIFT_MODIFIER_LABELS, type DailyActivityKind } from '~/data/activities'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean; serviceAccess?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()
const plan = computed(() => player.dailyActivityPlan)

const cards = computed(() => [
  {
    kind: 'elite' as const, icon: 'skill-icons/swords.png', eyebrow: 'ELITE HUNT', title: 'ล่าผู้พิทักษ์',
    description: 'กำจัดมอนสเตอร์ Elite ในหอคอยหรือดันเจียน ตัวแรกของแต่ละชั้นมีออร่าสีม่วง',
    progress: `${player.eliteHuntProgress}/${plan.value.eliteTarget}`,
    percent: Math.min(100, player.eliteHuntProgress / plan.value.eliteTarget * 100),
    complete: player.eliteHuntProgress >= plan.value.eliteTarget, claimed: player.eliteHuntClaimed,
  },
  {
    kind: 'rare' as const, icon: 'skill-icons/orb.png', eyebrow: 'RARE SPAWN', title: 'ตามหารอยแยกทอง',
    description: 'ตามหา Rare Spawn ที่มีป้ายสีทอง พลังสูงกว่าแต่มีโอกาสดรอปของ Set มากขึ้น',
    progress: `${player.rareSpawnProgress}/${plan.value.rareTarget}`,
    percent: Math.min(100, player.rareSpawnProgress / plan.value.rareTarget * 100),
    complete: player.rareSpawnProgress >= plan.value.rareTarget, claimed: player.rareSpawnClaimed,
  },
  {
    kind: 'rift' as const, icon: 'skill-icons/ward.png', eyebrow: 'DAILY DUNGEON', title: plan.value.riftName,
    description: 'ดันเจียนสุ่มประจำวัน เคลียร์ Elite แล้วหาทางออกเพื่อปลดรางวัลก้อนใหญ่',
    progress: player.dailyRiftCleared ? 'เคลียร์แล้ว' : 'ยังไม่เคลียร์',
    percent: player.dailyRiftCleared ? 100 : 0,
    complete: player.dailyRiftCleared, claimed: player.dailyRiftClaimed,
  },
])

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}

function monsterName(slug: string) {
  return slug.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function rewardText(kind: DailyActivityKind) {
  const reward = plan.value.rewards[kind]
  return `${reward.exp} EXP · ${reward.gold}g${reward.gems ? ` · ${reward.gems} gem` : ''}`
}

function claim(kind: DailyActivityKind) {
  if (!props.serviceAccess) return
  if (player.claimDailyActivity(kind)) gameEvents.emit('audio:sfx', { key: 'rare_drop' })
}

function enterRift() {
  if (!props.serviceAccess) return
  gameEvents.emit('daily:rift-enter', {
    floor: plan.value.floor,
    date: plan.value.date,
    seed: plan.value.seed,
    layoutId: plan.value.baseLayoutId,
  })
  emit('close')
}
</script>

<style scoped>
.activity-window { max-height: min(88vh, 720px); overflow: auto; }
.activity-card {
  position: relative;
  display: flex;
  gap: .7rem;
  min-height: 220px;
  padding: .8rem;
  overflow: hidden;
  border: 1px solid rgb(211 169 76 / 26%);
  border-radius: .45rem;
  background: linear-gradient(145deg, rgb(47 31 45 / 94%), rgb(16 17 28 / 96%));
  box-shadow: inset 0 0 20px rgb(0 0 0 / 35%), 0 5px 18px rgb(0 0 0 / 24%);
}
.activity-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 90% 5%, rgb(255 215 128 / 10%), transparent 38%); }
.activity-rare { border-color: rgb(255 213 90 / 40%); }
.activity-rift { border-color: rgb(118 199 255 / 35%); }
.activity-emblem { display: grid; place-items: center; flex: 0 0 40px; height: 40px; border: 1px solid rgb(246 197 91 / 50%); border-radius: 12px 4px 12px 4px; color: #ffe2a0; background: radial-gradient(circle, rgb(87 61 127 / 72%), rgb(8 8 16 / 86%)); box-shadow: 0 0 14px rgb(132 96 214 / 28%), inset 0 0 10px rgb(255 255 255 / 8%); transform: rotate(-3deg); }
.activity-icon { width: 26px; height: 26px; object-fit: contain; filter: drop-shadow(0 0 4px rgb(255 221 142 / 55%)); transform: rotate(3deg); }
.activity-type { font-size: 9px; letter-spacing: .16em; color: #c9a45e; }
@media (max-width: 767px) { .activity-card { min-height: 0; } }

.activity-card { border-radius: 12px 4px 12px 4px; background: linear-gradient(145deg, rgb(44 34 72 / 96%), rgb(13 15 32 / 98%)); box-shadow: inset 0 0 24px rgb(0 0 0 / 36%), 0 7px 20px rgb(0 0 0 / 28%); }
.activity-card::before { content: ''; position: absolute; z-index: 2; width: 18px; height: 18px; top: 5px; right: 5px; border-top: 1px solid rgb(240 210 136 / 48%); border-right: 1px solid rgb(240 210 136 / 48%); pointer-events: none; }
.activity-elite { box-shadow: inset 3px 0 rgb(164 103 222 / 45%), inset 0 0 24px rgb(0 0 0 / 36%), 0 7px 20px rgb(0 0 0 / 28%); }
.activity-rare { background: linear-gradient(145deg, rgb(66 52 42 / 96%), rgb(20 17 28 / 98%)); box-shadow: inset 3px 0 rgb(246 204 88 / 60%), inset 0 0 24px rgb(0 0 0 / 36%), 0 7px 20px rgb(0 0 0 / 28%); }
.activity-rift { background: linear-gradient(145deg, rgb(30 50 78 / 96%), rgb(15 16 34 / 98%)); box-shadow: inset 3px 0 rgb(94 183 238 / 55%), inset 0 0 24px rgb(0 0 0 / 36%), 0 7px 20px rgb(0 0 0 / 28%); }
.activity-type { font-family: Cinzel, Georgia, serif; font-weight: 800; }

</style>
