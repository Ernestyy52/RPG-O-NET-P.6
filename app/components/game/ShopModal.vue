<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">{{ title }} - Tier {{ tier }}</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body grid gap-3 p-4 sm:grid-cols-2">
        <div class="sm:col-span-2 text-sm">Gold: {{ player.gold }} / Equipment scales with floor.</div>
        <div v-for="item in items" :key="item.id" class="glass-panel p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <img :src="assetPath(itemIconPath(item.id))" class="item-icon h-12 w-12 shrink-0 object-contain pixelated" :alt="item.name" @error="onImageError">
              <div>
                <div class="font-bold">{{ item.name }}</div>
                <div class="text-xs opacity-75">{{ item.kind === 'equipment' ? `${item.slot} T${item.tier} - ${item.visual}` : consumableText(item) }}</div>
                <div class="mt-1 text-xs">{{ statText(item) }}</div>
              </div>
            </div>
            <button class="btn-secondary text-xs" :disabled="player.gold < item.cost" @click="player.buyItem(item.id)">
              {{ item.cost }}g
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { equipmentTierForFloor, shopInventoryForFloor, itemIconPath, type ConsumableItem, type InventoryItem } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

const props = withDefaults(defineProps<{ open: boolean; kindFilter?: 'all' | 'equipment' | 'consumable' }>(), { kindFilter: 'all' })
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()
function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }
const items = computed(() => {
  const all = shopInventoryForFloor(player.currentFloor)
  return props.kindFilter === 'all' ? all : all.filter((item) => item.kind === props.kindFilter)
})
const tier = computed(() => equipmentTierForFloor(player.currentFloor))
const title = computed(() => props.kindFilter === 'equipment' ? 'Equipment Shop' : props.kindFilter === 'consumable' ? 'Item Shop' : 'Shop')

function statText(item: InventoryItem) {
  if (item.kind === 'consumable') return 'Consumable'
  return Object.entries(item.stats).map(([key, value]) => `+${value} ${key.toUpperCase()}`).join(' / ')
}

function consumableText(item: ConsumableItem) {
  return item.effect.heal ? `Heal ${item.effect.heal}` : item.effect.focus ? 'Focus support' : 'Damage shield'
}
</script>

<style scoped>
.item-icon {
  border-radius: 6px;
  background: radial-gradient(circle at 50% 40%, rgba(120, 96, 60, 0.35), rgba(20, 16, 12, 0.6));
  box-shadow: inset 0 0 0 1px rgba(247, 231, 197, 0.25);
  padding: 2px;
}
.pixelated { image-rendering: pixelated; }
</style>
