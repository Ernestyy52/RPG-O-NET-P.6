<template>
  <div v-if="open" class="modal-backdrop">
    <div class="pixel-window anime-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Adventure Log</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body p-4">
        <p v-if="!entries.length" class="text-sm opacity-60">
          Nothing recorded yet — victories, level-ups, and floor progress will appear here.
        </p>
        <ul v-else class="space-y-1.5">
          <li v-for="(entry, i) in entries" :key="i" class="log-row" :class="{ 'log-row-latest': i === 0 }">
            <span class="log-diamond">❖</span>
            <span class="flex-1 text-xs leading-relaxed">{{ entry }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
// ล่าสุดขึ้นก่อน
const entries = computed(() => [...player.adventureLog].reverse())
</script>

<style scoped>
.log-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 9px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.35);
  background: rgba(0, 0, 0, 0.28);
  color: #e2d3ab;
}
.log-row-latest {
  border-color: #b98b3e;
  color: #f0e2bd;
  box-shadow: inset 0 0 0 1px rgba(255, 216, 132, 0.12);
}
.log-diamond {
  color: #b58a3a;
  font-size: 9px;
  line-height: 1.7;
  flex-shrink: 0;
}
</style>
