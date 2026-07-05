<template>
  <div ref="containerRef" class="game-canvas mx-auto" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import { createGame } from '~/game/createGame'
import { usePlayerStore } from '~/stores/player'

const containerRef = ref<HTMLElement | null>(null)
const player = usePlayerStore()
let game: Phaser.Game | null = null

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return
  game = createGame(containerRef.value, player.currentFloor)
})

onBeforeUnmount(() => {
  game?.destroy(true)
})
</script>

<style scoped>
.game-canvas {
  width: 480px;
  height: 352px;
  image-rendering: pixelated;
}
</style>
