<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Status</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body grid gap-3 p-4 sm:grid-cols-[220px_1fr]">
        <div class="glass-panel p-3 text-center">
          <div class="status-portrait mx-auto">
            <img :src="avatar" class="h-full w-full object-contain pixelated" alt="hero" @error="onImageError">
          </div>
          <div class="gold-text mt-2 font-bold">{{ player.displayName }}</div>
          <div class="text-xs uppercase tracking-wide opacity-75">Lv. {{ player.level }} · {{ player.heroClass.name }}</div>
          <div class="mt-3 space-y-1 text-left">
            <GameStatBar variant="hp" label="HP" :value="player.hp" :max="player.maxHp" />
            <GameStatBar variant="mp" label="MP" :value="player.mp" :max="player.maxMp" />
            <GameStatBar variant="exp" label="EXP" :value="player.exp" :max="player.expNeeded" />
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
            <div v-for="stat in statRows" :key="stat.label" class="status-stat">
              <span class="opacity-70">{{ stat.label }}</span>
              <span class="font-bold text-[#f2c14e]">{{ stat.value }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Equipment</h3>
            <div class="space-y-1 text-xs">
              <div v-for="slot in slots" :key="slot.id" class="flex items-center justify-between gap-2">
                <span class="uppercase tracking-wide opacity-70">{{ slot.label }}</span>
                <span :class="slot.item ? 'font-bold' : 'opacity-50'">{{ slot.item?.name ?? '— empty —' }}</span>
              </div>
            </div>
          </div>

          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Inventory</h3>
            <p v-if="!bagItems.length" class="text-xs opacity-60">Your bag is empty. Visit the Item Shop in town.</p>
            <div v-for="entry in bagItems" :key="entry.id" class="flex items-center justify-between gap-2 py-1 text-xs">
              <div class="flex items-center gap-2">
                <img :src="assetPath(itemIconPath(entry.id))" class="h-8 w-8 object-contain pixelated" :alt="entry.name" @error="onImageError">
                <span :style="{ color: entry.color }">{{ entry.name }} <span class="opacity-60">x{{ entry.qty }}</span></span>
              </div>
              <button v-if="entry.usable" class="btn-secondary px-2 py-1 text-xs" @click="player.useConsumable(entry.id)">Use</button>
              <button v-else-if="entry.equip" class="btn-secondary px-2 py-1 text-xs" @click="player.equipItem(entry.equip)">Equip</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getItemById, getMaterial, itemIconPath, rarityColor, rarityOf } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean; avatar: string }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
const config = useRuntimeConfig()

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }

const statRows = computed(() => [
  { label: 'ATK', value: player.stats.atk },
  { label: 'DEF', value: player.stats.def },
  { label: 'MAG', value: player.stats.mag },
  { label: 'SPD', value: player.stats.speed },
  { label: 'KNOW', value: player.stats.knowledge },
  { label: 'Answers', value: player.correctAnswers },
])

const slots = computed(() => ([
  { id: 'weapon', label: 'Weapon', item: player.equipment.weapon ? getItemById(player.equipment.weapon) : undefined },
  { id: 'armor', label: 'Armor', item: player.equipment.armor ? getItemById(player.equipment.armor) : undefined },
  { id: 'trinket', label: 'Trinket', item: player.equipment.trinket ? getItemById(player.equipment.trinket) : undefined },
]))

const bagItems = computed(() =>
  Object.entries(player.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = getItemById(id)
      const mat = getMaterial(id)
      const isEquip = item?.kind === 'equipment'
      return {
        id, qty,
        name: item?.name ?? mat?.name ?? id,
        usable: item?.kind === 'consumable',
        equip: isEquip && player.equipment[item.slot] !== id ? id : '',
        color: rarityColor(rarityOf(id)),
      }
    }),
)
</script>

<style scoped>
.status-portrait {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  border: 1px solid #a8823f;
  background: radial-gradient(circle at 50% 35%, rgba(255, 216, 121, 0.18), transparent 60%), #0d0a06;
  box-shadow: 0 0 0 1px #050302, inset 0 0 12px rgba(0, 0, 0, 0.6);
  padding: 6px;
}
.status-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 7px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.5);
  background: rgba(0, 0, 0, 0.3);
}
.pixelated { image-rendering: pixelated; }
</style>
