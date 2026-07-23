<template>
  <div class="game-canvas-wrap mx-auto">
    <div ref="containerRef" class="game-canvas" />
    <div v-if="!bootReady" class="game-boot-state" role="status" aria-live="polite">
      <span class="game-boot-rune">✦</span><strong>Opening the World Gate…</strong><small>กำลังโหลดแผนที่และระบบต่อสู้</small>
    </div>
    <TouchJoystick v-if="bootReady" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import TouchJoystick from '~/components/game/TouchJoystick.vue'
import { setAssetBase } from '~/game/systems/assetBase'
import { usePlayerStore } from '~/stores/player'
import { useSettingsStore } from '~/stores/settings'
import { gameEvents } from '~/game/systems/eventBus'

const containerRef = ref<HTMLElement | null>(null)
const bootReady = ref(false)
const player = usePlayerStore()
const settings = useSettingsStore()
const config = useRuntimeConfig()
let game: import('phaser').Game | null = null
let stopAudioWatch: (() => void) | undefined

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return
  setAssetBase(config.app.baseURL)
  // Phaser, scene code, networking and audio are deliberately split from the mobile landing bundle.
  const [{ createGame }, { setNetUrl }, { syncAudioSettings }] = await Promise.all([
    import('~/game/createGame'),
    import('~/game/systems/net'),
    import('~/game/systems/bgm'),
  ])
  setNetUrl(config.public.colyseusUrl || (import.meta.dev ? 'ws://localhost:2567' : ''))
  game = createGame(containerRef.value, player.currentFloor, player.classId, player.gameMode, player.adventureRegionId, player.currentZoneId, player.mainQuest.step)
  syncAudioSettings(game, settings)
  bootReady.value = true
  stopAudioWatch = watch(() => [settings.sound, settings.musicVolume, settings.sfxVolume] as const, () => {
    if (game) syncAudioSettings(game, settings)
  })
  const enterDailyRift = (payload: { floor: number; date: string; seed: number; layoutId: 'world01-mini' | 'world01-main' }) => {
    if (!game) return
    for (const key of ['TownScene', 'TowerScene', 'BossScene', 'InteriorScene', 'DungeonScene']) {
      if (game.scene.isActive(key)) game.scene.stop(key)
    }
    game.scene.start('DungeonScene', {
      floor: payload.floor,
      classId: player.classId,
      layoutId: payload.layoutId,
      daily: { date: payload.date, seed: payload.seed },
      zoneId: player.currentZoneId,
      returnZoneId: player.currentZoneId,
    })
  }
  const travelWorld = (payload: import('~/game/systems/eventBus').WorldTravelPayload) => {
    if (!game) return
    for (const key of ['TownScene', 'TowerScene', 'BossScene', 'InteriorScene', 'DungeonScene']) {
      if (game.scene.isActive(key)) game.scene.stop(key)
    }
    if (payload.mode === 'town') {
      game.scene.start('TownScene', { floor: payload.floor, classId: player.classId, zoneId: payload.zoneId })
    } else if (payload.mode === 'dungeon') {
      game.scene.start('DungeonScene', {
        floor: payload.floor, classId: player.classId, zoneId: payload.zoneId, regionId: payload.regionId,
        layoutId: payload.layoutId ?? (payload.zoneId === 'myco-sanctum' ? 'world01-main' : 'world01-mini'),
        returnZoneId: payload.returnZoneId ?? (payload.zoneId === 'myco-sanctum' ? 'deepgrove' : 'mosswood-trail'),
      })
    } else if (payload.mode === 'boss') {
      if (payload.zoneId === 'myco-sanctum' && player.mainQuest.step < 11) {
        game.scene.start('DungeonScene', {
          floor: payload.floor, classId: player.classId, zoneId: payload.zoneId, regionId: payload.regionId,
          layoutId: 'world01-main', returnZoneId: 'deepgrove',
        })
      } else {
        game.scene.start('BossScene', { floor: payload.floor, classId: player.classId, mode: 'adventure', regionId: payload.regionId, zoneId: payload.zoneId })
      }
    } else game.scene.start('TowerScene', { floor: payload.floor, classId: player.classId, mode: payload.mode, regionId: payload.regionId, zoneId: payload.zoneId, entryFromZoneId: payload.fromZoneId })
  }
  gameEvents.on('daily:rift-enter', enterDailyRift)
  gameEvents.on('world:travel', travelWorld)
  game.events.once('destroy', () => { gameEvents.off('daily:rift-enter', enterDailyRift); gameEvents.off('world:travel', travelWorld) })
  if (import.meta.dev) (window as unknown as { __game?: import('phaser').Game }).__game = game
})

onBeforeUnmount(() => {
  stopAudioWatch?.()
  game?.destroy(true)
})
</script>

<style scoped>
/* The wrapper is the positioning and sizing authority for canvas overlays such as touch controls. */
.game-canvas-wrap {
  position: relative;
  width: 100%;
  max-width: 1000px;
}
.game-boot-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  background: radial-gradient(circle at 50% 44%, rgba(64, 93, 102, .72), rgba(8, 11, 20, .96) 58%);
  color: #f3d58d;
  letter-spacing: .04em;
  text-align: center;
}
.game-boot-state small { color: #c7d5e4; font-size: 11px; font-weight: 500; }
.game-boot-rune { font-size: 28px; animation: boot-pulse 1.2s ease-in-out infinite; }
@keyframes boot-pulse { 50% { filter: drop-shadow(0 0 12px #9ee7c1); transform: scale(1.16) rotate(12deg); } }

/* Desktop uses the 800×600 internal view; CSS may enlarge it to the available 1000px cap. */
.game-canvas {
  width: 100%;
  max-width: 1000px;
  aspect-ratio: 4 / 3;
  image-rendering: pixelated;
}

@media (max-width: 560px) {
  .game-canvas-wrap { max-width: 520px; }
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
