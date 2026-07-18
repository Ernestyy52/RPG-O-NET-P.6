<template>
  <div ref="containerRef" class="game-canvas mx-auto" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import { createGame } from '~/game/createGame'
import { setAssetBase } from '~/game/systems/textures'
import { setNetUrl } from '~/game/systems/net'
import { usePlayerStore } from '~/stores/player'

const containerRef = ref<HTMLElement | null>(null)
const player = usePlayerStore()
const config = useRuntimeConfig()
let game: Phaser.Game | null = null

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return
  setAssetBase(config.app.baseURL)
  // multiplayer: ใช้ URL จาก env (production) หรือ localhost ตอน dev — ว่าง/ต่อไม่ติด = เล่นออฟไลน์ปกติ
  setNetUrl(config.public.colyseusUrl || (import.meta.dev ? 'ws://localhost:2567' : ''))
  game = createGame(containerRef.value, player.currentFloor, player.classId)
  // dev-only debug handle เธชเธณเธซเธฃเธฑเธ preview/verification (jump floor, inspect scenes) — ไม่ทำงานตอน production build
  if (import.meta.dev) (window as unknown as { __game?: Phaser.Game }).__game = game
})

onBeforeUnmount(() => {
  game?.destroy(true)
})
</script>

<style scoped>
/* สัดส่วน container ต้องตรงกับ internal viewport ที่ createGame เลือก (scale contract S4):
   desktop 800×600 (4:3, ปล่อยโตถึง 1000px ให้ hero บนจอ ~57–60px ตามที่ S3 ให้คะแนน),
   มือถือแนวตั้ง ≤560px = 480×640 (3:4 — hero บนจอ ~39px ≥ เกณฑ์ 28px) — breakpoint
   เดียวกับ MOBILE_BREAKPOINT_PX เสมอ */
.game-canvas {
  width: 100%;
  max-width: 1000px;
  aspect-ratio: 4 / 3;
  image-rendering: pixelated;
}

@media (max-width: 560px) {
  .game-canvas {
    aspect-ratio: 3 / 4;
    max-width: 520px;
  }
}

.game-canvas :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
}
</style>
