<template>
  <!-- DEV-ONLY (หน้า /dev/* ถูกตัดจาก production โดย pages:extend) — พรีวิว Aethergate zone data
       เรนเดอร์เป็นเมืองเดินได้จริง (พื้น tiny-town CC0 + greybox บล็อกอาคาร + ฮีโร่ scale contract)
       เพื่อพิสูจน์ pipeline data→playable ในเบราว์เซอร์ ก่อนมี production art -->
  <div class="flex min-h-screen flex-col gap-2 bg-[#0d0a06] p-2 text-white">
    <div class="glass-panel flex flex-wrap items-center gap-3 p-2 text-xs">
      <h1 class="gold-text mr-2 text-sm font-bold">DEV — Aethergate zone preview (greybox)</h1>
      <span data-testid="aeth-status" class="gold-text font-bold">{{ status }}</span>
      <span class="opacity-70">buildings <span data-testid="aeth-buildings">{{ info.buildings }}</span></span>
      <span class="opacity-70">portals <span data-testid="aeth-portals">{{ info.portals }}</span></span>
      <span class="opacity-70">hero <span data-testid="aeth-herotex">{{ info.heroTex }}</span></span>
      <span class="opacity-60">เดิน: ลูกศร/WASD (130 px/s, diagonal normalized)</span>
    </div>
    <div class="glass-panel flex flex-wrap items-center gap-2 p-2 text-xs">
      <span class="opacity-70">Tour:</span>
      <button v-for="t in tours" :key="t" class="btn-secondary px-2 py-1" :data-testid="`tour-${t}`" @click="tour(t)">→ {{ t }}</button>
    </div>
    <div ref="host" class="min-h-[300px] w-full flex-1" data-testid="aeth-host" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import Phaser from 'phaser'
import { setAssetBase } from '~/game/systems/assetBase'
import { AethergateScene } from '~/game/dev/AethergateScene'
import { DESKTOP_VIEWPORT } from '~/game/scaleContract'

const host = ref<HTMLElement | null>(null)
const status = ref('booting')
const info = reactive({ buildings: 0, portals: 0, heroTex: '…' })
const tours = ['landmark', 'door-guild', 'door-hospital', 'door-item-shop', 'gate-tower', 'secret']

let game: Phaser.Game | null = null
const scene = () => game?.scene.getScene('AethergateScene') as AethergateScene | undefined

function tour(id: string) {
  status.value = `tour:${id}`
  scene()?.tourTo(id)
}

const onReady = (p: { buildings: number; portals: number; heroTex: boolean }) => {
  info.buildings = p.buildings
  info.portals = p.portals
  info.heroTex = p.heroTex ? 'ok' : 'missing'
  status.value = 'ready'
}
const onTourDone = () => { status.value = 'tour-done' }

onMounted(() => {
  setAssetBase(useRuntimeConfig().app.baseURL)
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: DESKTOP_VIEWPORT.width,
    height: DESKTOP_VIEWPORT.height,
    parent: host.value!,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: DESKTOP_VIEWPORT.width, height: DESKTOP_VIEWPORT.height },
    render: { preserveDrawingBuffer: true },
  })
  game.events.on('aethergate:ready', onReady)
  game.events.on('aethergate:tour-done', onTourDone)
  game.scene.add('AethergateScene', AethergateScene, true)
  ;(window as unknown as { __aeth?: { tour: (id: string) => boolean } }).__aeth = {
    tour: (id: string) => scene()?.tourTo(id) ?? false,
  }
})

onUnmounted(() => {
  game?.events.off('aethergate:ready', onReady)
  game?.events.off('aethergate:tour-done', onTourDone)
  game?.destroy(true)
  game = null
})
</script>
