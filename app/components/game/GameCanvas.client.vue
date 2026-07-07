<template>
  <div ref="containerRef" class="game-canvas mx-auto" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import { createGame } from '~/game/createGame'
import { setAssetBase } from '~/game/systems/textures'
import { usePlayerStore } from '~/stores/player'

const containerRef = ref<HTMLElement | null>(null)
const player = usePlayerStore()
const config = useRuntimeConfig()
let game: Phaser.Game | null = null

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return
  setAssetBase(config.app.baseURL)
  game = createGame(containerRef.value, player.currentFloor, player.classId)
  // dev-only debug handle เธชเธณเธซเธฃเธฑเธ preview/verification (jump floor, inspect scenes) — ไม่ทำงานตอน production build
  if (import.meta.dev) (window as unknown as { __game?: Phaser.Game }).__game = game
})

onBeforeUnmount(() => {
  game?.destroy(true)
})
</script>

<style scoped>
.game-canvas {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 4 / 3;
  image-rendering: pixelated;
}

.game-canvas :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
}
</style>
