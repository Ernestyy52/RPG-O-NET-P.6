<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Shop - Tier {{ tier }}</h2>
        <button class="text-[#eadfc8] hover:text-white" @click="$emit('close')">x</button>
      </div>
      <div class="grid gap-3 p-4 sm:grid-cols-2">
        <div class="sm:col-span-2 text-sm">Gold: {{ player.gold }} / Equipment scales with floor.</div>
        <div v-for="item in items" :key="item.id" class="glass-panel p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-bold">{{ item.name }}</div>
              <div class="text-xs opacity-75">{{ item.kind === 'equipment' ? `${item.slot} T${item.tier} - ${item.visual}` : consumableText(item) }}</div>
              <div class="mt-1 text-xs">{{ statText(item) }}</div>
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
import { equipmentTierForFloor, shopInventoryForFloor, type ConsumableItem, type InventoryItem } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const items = computed(() => shopInventoryForFloor(player.currentFloor))
const tier = computed(() => equipmentTierForFloor(player.currentFloor))

function statText(item: InventoryItem) {
  if (item.kind === 'consumable') return 'Consumable'
  return Object.entries(item.stats).map(([key, value]) => `+${value} ${key.toUpperCase()}`).join(' / ')
}

function consumableText(item: ConsumableItem) {
  return item.effect.heal ? `Heal ${item.effect.heal}` : item.effect.focus ? 'Focus support' : 'Damage shield'
}
</script>
