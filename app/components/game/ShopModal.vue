<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div class="w-full max-w-sm rounded-xl bg-slate-900 p-6 text-white border border-slate-700">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">Shop</h2>
        <button class="text-slate-400 hover:text-white" @click="$emit('close')">✕</button>
      </div>
      <p class="mb-3 text-sm text-slate-300">Gold: {{ player.gold }}</p>
      <ul class="space-y-2">
        <li v-for="item in items" :key="item.id" class="flex items-center justify-between rounded border border-slate-700 px-3 py-2">
          <span>
            {{ item.name }}
            <span class="text-xs text-slate-400">
              ({{ item.effect.atkBonus ? `+${item.effect.atkBonus} ATK` : `+${item.effect.hpBonus} HP` }})
            </span>
          </span>
          <button
            class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold hover:bg-emerald-500 disabled:opacity-40"
            :disabled="player.inventory.includes(item.id) || player.gold < item.cost"
            @click="player.buyItem(item.id)"
          >
            {{ player.inventory.includes(item.id) ? 'Owned' : `${item.cost}g` }}
          </button>
        </li>
      </ul>
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
