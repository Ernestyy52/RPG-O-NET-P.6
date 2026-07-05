<template>
  <div class="hud-bar mb-2">
    <div>
      <span class="gold-text font-bold">{{ player.name }}</span>
      Lv.{{ player.level }} | HP {{ player.hp }}/{{ player.maxHp }} | ATK {{ player.atk }}
    </div>
    <div>
      EXP {{ player.exp }}/{{ player.expNeeded }} | Gold {{ player.gold }} | Floor {{ player.currentFloor }}
    </div>
    <button class="btn-primary text-sm" @click="$emit('open-shop')">
      Shop
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '~/stores/player'

const player = usePlayerStore()
defineEmits<{ (e: 'open-shop'): void }>()
</script>
