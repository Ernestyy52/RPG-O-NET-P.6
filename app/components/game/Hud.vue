<template>
  <div class="hud-bar mb-2 flex-wrap gap-2">
    <div>
      <span class="gold-text font-bold">{{ player.name }}</span>
      {{ player.heroClass.name }} Lv.{{ player.level }} | HP {{ player.hp }}/{{ player.maxHp }} | ATK {{ player.atk }} DEF {{ player.def }} SPD {{ player.speed }}
    </div>
    <div class="text-xs sm:text-sm">
      EXP {{ player.exp }}/{{ player.expNeeded }} | Gold {{ player.gold }} | Floor {{ player.currentFloor }} | {{ world.description }}
    </div>
    <div class="flex gap-2">
      <button class="btn-primary text-xs" @click="$emit('open-town')">Town</button>
      <button class="btn-primary text-xs" @click="$emit('open-shop')">Shop</button>
      <button class="btn-secondary text-xs" @click="$emit('open-skills')">Skills {{ player.skillPoints }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getWorldState } from '~/data/world'
import { usePlayerStore } from '~/stores/player'

const player = usePlayerStore()
const world = computed(() => getWorldState())
defineEmits<{ (e: 'open-shop'): void; (e: 'open-skills'): void; (e: 'open-town'): void }>()
</script>
