<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div class="pixel-window w-full max-w-sm">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Shop</h2>
        <button class="text-[#eadfc8] hover:text-white" @click="$emit('close')">✕</button>
      </div>
      <div class="p-4">
        <p class="mb-3 text-sm">Gold: {{ player.gold }}</p>
        <ul class="space-y-2">
          <li v-for="item in items" :key="item.id" class="glass-panel flex items-center justify-between px-3 py-2">
            <span>
              {{ item.name }}
              <span class="text-xs opacity-70">
                ({{ item.effect.atkBonus ? `+${item.effect.atkBonus} ATK` : `+${item.effect.hpBonus} HP` }})
              </span>
            </span>
            <button
              class="btn-secondary text-xs disabled:opacity-40"
              :disabled="player.inventory.includes(item.id) || player.gold < item.cost"
              @click="player.buyItem(item.id)"
            >
              {{ player.inventory.includes(item.id) ? 'Owned' : `${item.cost}g` }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore, SHOP_ITEMS } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const items = SHOP_ITEMS
</script>
