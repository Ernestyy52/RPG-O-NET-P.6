<template>
  <div class="dnd-bg min-h-screen p-4">
    <h1 class="gold-text mb-4 text-center text-2xl font-bold">O-NET English Tower</h1>
    <div class="mx-auto max-w-2xl">
      <GameHud @open-shop="shopOpen = true" />
      <div class="pixel-window overflow-hidden">
        <ClientOnly>
          <GameCanvas />
        </ClientOnly>
      </div>
      <GameBattleModal />
      <GameShopModal :open="shopOpen" @close="shopOpen = false" />
      <p class="mt-3 text-center text-xs opacity-70">ใช้ลูกศรเดินหน้า ชนมอนสเตอร์เพื่อตอบคำถามภาษาอังกฤษ O-NET ป.6 เดินไปที่บันไดเมื่อเคลียร์ชั้นแล้ว</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore } from '~/stores/player'
import { useSheetsSync } from '~/composables/useSheetsSync'

const shopOpen = ref(false)
const player = usePlayerStore()
const { savePlayer } = useSheetsSync()

gameEvents.on('floor:advance', () => {
  player.advanceFloor()
  savePlayer({ ...player.$state })
})
</script>
