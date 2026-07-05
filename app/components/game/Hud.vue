<template>
  <div class="mb-2 flex items-center justify-between rounded bg-slate-800 px-4 py-2 text-white">
    <div class="text-sm">
      <span class="font-bold">{{ player.name }}</span>
      Lv.{{ player.level }} | HP {{ player.hp }}/{{ player.maxHp }} | ATK {{ player.atk }}
    </div>
    <div class="text-sm">
      EXP {{ player.exp }}/{{ player.expNeeded }} | Gold {{ player.gold }} | Floor {{ player.currentFloor }}
    </div>
    <button class="rounded bg-amber-500 px-3 py-1 text-sm font-semibold hover:bg-amber-400" @click="$emit('open-shop')">
      Shop
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '~/stores/player'

const player = usePlayerStore()
defineEmits<{ (e: 'open-shop'): void }>()
</script>
