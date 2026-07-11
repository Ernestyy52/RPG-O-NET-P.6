<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Town Services</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body grid gap-3 p-4 sm:grid-cols-3">
        <button class="btn-primary" @click="player.hospital()">Hospital</button>
        <button class="btn-primary" @click="$emit('shop')">Shop</button>
        <button class="btn-primary" @click="$emit('guild')">Guild</button>
        <p class="sm:col-span-3 text-sm opacity-80">A full town appears every 10 floors. Services remain available here for faster testing.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void; (e: 'shop'): void; (e: 'guild'): void }>()
const player = usePlayerStore()
</script>
