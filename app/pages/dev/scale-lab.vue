<template>
  <!-- S1+S2 scale-lab (dev-only — หน้า /dev/* ถูกตัดจาก production โดย pages:extend ใน nuxt.config.ts)
       S1: เดิน greybox Aethergate ที่ M0/M1/M2 ด้วย viewport/กล้อง/สปีดจริง เพื่อยืนยันตาราง routeSec
       S2: สลับ hero profile P0 48 / P1 44 / P2 40 บนสไปรต์จริง + view preset (V1 hero48 จอกว้าง,
       MZ zoom มือถือ, MA portrait-adaptive) + cadence walk 8 ทิศ — ฟิสิกส์/สปีดเท่าเดิมทุก profile -->
  <div class="flex min-h-screen flex-col gap-2 bg-[#0d0a06] p-2 text-white">
    <div class="glass-panel flex flex-wrap items-center gap-2 p-2 text-xs">
      <h1 class="gold-text mr-2 text-sm font-bold">DEV — Scale Lab (S1 greybox + S2 hero/camera)</h1>
      <span class="opacity-70">Map:</span>
      <button
        v-for="p in profiles" :key="p.id" :data-testid="`profile-${p.id}`"
        class="btn-secondary px-2 py-1" :class="currentProfile === p.id ? 'ring-2 ring-amber-400' : ''"
        @click="setProfile(p.id)"
      >{{ p.id }} {{ p.label }}</button>
      <span class="mx-1 opacity-40">|</span>
      <span class="opacity-70">Hero:</span>
      <button
        v-for="h in heroProfiles" :key="h.id" :data-testid="`hero-${h.id}`"
        class="btn-secondary px-2 py-1" :class="currentHero === h.id ? 'ring-2 ring-emerald-400' : ''"
        @click="setHero(h.id)"
      >{{ h.id }} {{ h.label }}</button>
      <span class="mx-1 opacity-40">|</span>
      <span class="opacity-70">View:</span>
      <button
        v-for="v in viewPresets" :key="v.id" :data-testid="`view-${v.id}`"
        class="btn-secondary px-2 py-1" :class="currentView === v.id ? 'ring-2 ring-sky-400' : ''"
        @click="setView(v.id)"
      >{{ v.id }} {{ v.label }}</button>
      <span class="mx-1 opacity-40">|</span>
      <span class="opacity-70">Interior:</span>
      <button
        v-for="s in interiors" :key="s.id" :data-testid="`profile-${s.id}`"
        class="btn-secondary px-2 py-1" :class="currentProfile === s.id ? 'ring-2 ring-amber-400' : ''"
        @click="setProfile(s.id)"
      >{{ s.id }}</button>
      <button
        class="btn-secondary px-2 py-1" data-testid="night-toggle"
        :class="night ? 'ring-2 ring-indigo-400' : ''" @click="toggleNight()"
      >{{ night ? '🌙 night' : '☀ day' }}</button>
      <span class="opacity-70">Class:</span>
      <button
        v-for="c in classOptions" :key="c" :data-testid="`class-${c}`"
        class="btn-secondary px-2 py-1" :class="currentClass === c ? 'ring-2 ring-rose-300' : ''"
        @click="setClass(c)"
      >{{ c.replace('_', ' ') }}</button>
    </div>

    <div class="glass-panel flex flex-wrap items-center gap-2 p-2 text-xs">
      <button class="btn-primary px-2 py-1" data-testid="run-all" @click="runRoutes(allRoutes)">Run all routes</button>
      <button class="btn-secondary px-2 py-1" data-testid="run-key" @click="runRoutes(keyRoutes)">Run key routes</button>
      <button class="btn-secondary px-2 py-1" data-testid="run-cadence" @click="runCadence()">Cadence walk 8 ทิศ</button>
      <span class="opacity-60">เดินเอง: ลูกศร/WASD (สปีดเมืองจริง 130 ทุก profile)</span>
    </div>

    <div class="glass-panel flex flex-wrap items-center gap-3 p-2 text-xs">
      <span data-testid="lab-status" class="gold-text font-bold">{{ status }}</span>
      <span class="opacity-70">pos <span data-testid="player-pos">{{ pos }}</span></span>
      <span class="opacity-70">hero <span data-testid="hero-profile">{{ currentHero }}</span>·<span data-testid="hero-tex">{{ heroTex }}</span></span>
      <span class="opacity-70">view <span data-testid="view-preset">{{ currentView }}</span> {{ viewInfo }}</span>
      <span class="opacity-90">on-screen hero <span data-testid="hero-onscreen">{{ heroOnScreen }}</span>px</span>
      <span v-if="elapsed" class="opacity-90">⏱ <span data-testid="route-elapsed">{{ elapsed }}</span>s</span>
    </div>

    <div ref="canvasHost" class="min-h-[300px] w-full flex-1" data-testid="lab-canvas-host" />

    <div v-if="rows.length" class="glass-panel overflow-x-auto p-2 text-xs">
      <table class="w-full min-w-[560px] text-left" data-testid="route-results">
        <thead>
          <tr class="opacity-70">
            <th class="pr-2">route</th><th class="pr-2">target (s)</th><th class="pr-2">analytic (s)</th>
            <th class="pr-2">measured (s)</th><th class="pr-2">Δ</th><th>in band</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows" :key="r.route" data-testid="route-row"
            :data-route="r.route" :data-measured="r.measuredSec" :data-analytic="r.analyticSec"
            :data-inband="r.inBand ? '1' : '0'"
          >
            <td class="pr-2">{{ r.route }}</td>
            <td class="pr-2">{{ r.targetMin }}–{{ r.targetMax }}</td>
            <td class="pr-2">{{ r.analyticSec }}</td>
            <td class="pr-2 font-bold">{{ r.measuredSec }}</td>
            <td class="pr-2">{{ (r.measuredSec - r.analyticSec).toFixed(1) }}</td>
            <td>{{ r.inBand ? '✓' : '✗' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-1 opacity-70" data-testid="inband-summary">
        {{ currentProfile }}: in-band {{ rows.filter((r) => r.inBand).length }}/{{ rows.length }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import Phaser from 'phaser'
import { ROUTE_TARGETS, SCALE_PROFILES, INTERIOR_SPECS, HERO_PROFILES, VIEW_PRESETS, resolveViewport } from '~/game/runtime/scaleLab'
import { setAssetBase } from '~/game/systems/assetBase'
import { ScaleLabScene, type ScaleLabRouteResult } from '~/game/dev/ScaleLabScene'

const profiles = SCALE_PROFILES
const interiors = INTERIOR_SPECS
const heroProfiles = HERO_PROFILES
const viewPresets = VIEW_PRESETS
const classOptions = ['warrior_male', 'warrior_female', 'guardian_male']
const allRoutes = Object.keys(ROUTE_TARGETS)
const keyRoutes = ['south-gate→plaza', 'door:inn→door:hospital']

const canvasHost = ref<HTMLElement | null>(null)
const status = ref('booting')
const pos = ref('—')
const elapsed = ref('')
const currentProfile = ref('M1')
const currentHero = ref('P0')
const currentView = ref('V0')
const currentClass = ref('warrior_male')
const night = ref(false)
const heroTex = ref('…')
const heroOnScreen = ref('—')
const viewInfo = ref('')
const results = reactive<Record<string, ScaleLabRouteResult[]>>({})
const rows = computed(() => results[currentProfile.value] ?? [])

let game: Phaser.Game | null = null
let internalW = 640
const scene = () => game?.scene.getScene('ScaleLabScene') as ScaleLabScene | undefined

function sceneData(overrides: Record<string, unknown> = {}) {
  return {
    profileId: currentProfile.value, heroProfileId: currentHero.value,
    zoom: zoomOf(currentView.value), night: night.value, classId: currentClass.value,
    ...overrides,
  }
}

function setProfile(id: string) {
  currentProfile.value = id
  status.value = `switching:${id}`
  scene()?.scene.restart(sceneData({ profileId: id }))
}

function setHero(id: string) {
  currentHero.value = id
  status.value = `switching-hero:${id}`
  scene()?.scene.restart(sceneData({ heroProfileId: id }))
}

function toggleNight() {
  night.value = !night.value
  status.value = `switching-night:${night.value ? 'on' : 'off'}`
  scene()?.scene.restart(sceneData())
}

function setClass(id: string) {
  currentClass.value = id
  status.value = `switching-class:${id}`
  scene()?.scene.restart(sceneData({ classId: id }))
}

function zoomOf(viewId: string): number {
  return viewPresets.find((v) => v.id === viewId)?.zoom ?? 1
}

/** เปลี่ยน internal viewport ต้องสร้าง Phaser.Game ใหม่ (Scale config ตรึงตอน boot) —
 *  ฟิสิกส์/สปีดไม่เปลี่ยน มีแต่ขนาดหน้าต่างมองโลก + camera zoom (view-only) */
function setView(id: string) {
  const preset = viewPresets.find((v) => v.id === id)
  if (!preset || !canvasHost.value) return
  currentView.value = id
  status.value = `switching-view:${id}`
  destroyGame()
  const rect = canvasHost.value.getBoundingClientRect()
  const { w, h } = resolveViewport(preset, Math.round(rect.width), Math.round(rect.height))
  createLabGame(w, h, preset.zoom)
}

// dev handle สำหรับ playtest matrix (S3) — teleport ไป anchor + อ่าน fps โดยไม่ต้องเดินจริง
declare global { interface Window { __scaleLab?: { teleport: (id: string) => boolean; fps: () => number } } }
function exposeDevHandle() {
  window.__scaleLab = {
    teleport: (id: string) => scene()?.teleport(id) ?? false,
    fps: () => Math.round(game?.loop.actualFps ?? -1),
  }
}

function runRoutes(routes: string[]) {
  results[currentProfile.value] = []
  status.value = `running:${currentProfile.value}`
  scene()?.runRoutes(routes)
}

function runCadence() {
  status.value = `cadence-starting:${currentHero.value}`
  scene()?.runCadence()
}

/** ขนาดฮีโร่จริงบนจอ (CSS px) วัดจาก DOM — เกณฑ์มือถือ ≥28px ตรวจกับค่านี้ */
function updateOnScreen(heroDisplayH: number, zoom: number) {
  const canvas = canvasHost.value?.querySelector('canvas')
  if (!canvas) { heroOnScreen.value = '—'; return }
  const cssScale = canvas.getBoundingClientRect().width / internalW
  heroOnScreen.value = (heroDisplayH * zoom * cssScale).toFixed(1)
}

let lastReady: { heroDisplayH: number; zoom: number } = { heroDisplayH: 48, zoom: 1 }
const onReady = (p: { profile: string; heroProfile: string; heroTex: boolean; heroDisplayH: number; zoom: number; night: boolean; classId: string }) => {
  currentProfile.value = p.profile
  currentHero.value = p.heroProfile
  currentClass.value = p.classId
  night.value = p.night
  heroTex.value = p.heroTex ? 'ok' : 'missing'
  lastReady = { heroDisplayH: p.heroDisplayH, zoom: p.zoom }
  status.value = `ready:${p.profile}`
  exposeDevHandle()
  // FIT จัดขนาด canvas หลัง boot — วัดซ้ำสั้นๆ ให้ค่า on-screen นิ่ง
  setTimeout(() => updateOnScreen(lastReady.heroDisplayH, lastReady.zoom), 120)
  setTimeout(() => updateOnScreen(lastReady.heroDisplayH, lastReady.zoom), 600)
}
const onRoute = (r: ScaleLabRouteResult) => {
  const list = (results[r.profile] ??= [])
  const i = list.findIndex((x) => x.route === r.route)
  if (i >= 0) list.splice(i, 1, r)
  else list.push(r)
}
const onQueueDone = (p: { profile: string }) => { status.value = `queue-done:${p.profile}`; elapsed.value = '' }
const onCadence = (c: { dir: string }) => { status.value = `cadence:${c.dir}` }
const onCadenceDone = (p: { profile: string }) => { status.value = `cadence-done:${p.profile}` }
const onTick = (t: { x: number; y: number; route: string; elapsedSec: number }) => {
  pos.value = `${Math.round(t.x)},${Math.round(t.y)}`
  if (t.route) {
    status.value = `walking:${t.route}`
    elapsed.value = t.elapsedSec.toFixed(1)
  }
}
const onResize = () => updateOnScreen(lastReady.heroDisplayH, lastReady.zoom)

function createLabGame(w: number, h: number, zoom: number) {
  internalW = w
  viewInfo.value = `${w}×${h}${zoom !== 1 ? ` z${zoom}` : ''}`
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: w,
    height: h,
    parent: canvasHost.value!,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: w, height: h },
    render: { preserveDrawingBuffer: true },
  })
  game.events.on('scalelab:ready', onReady)
  game.events.on('scalelab:route', onRoute)
  game.events.on('scalelab:queue-done', onQueueDone)
  game.events.on('scalelab:cadence', onCadence)
  game.events.on('scalelab:cadence-done', onCadenceDone)
  game.events.on('scalelab:tick', onTick)
  game.scene.add('ScaleLabScene', ScaleLabScene, true, sceneData({ zoom }))
}

function destroyGame() {
  if (!game) return
  game.events.off('scalelab:ready', onReady)
  game.events.off('scalelab:route', onRoute)
  game.events.off('scalelab:queue-done', onQueueDone)
  game.events.off('scalelab:cadence', onCadence)
  game.events.off('scalelab:cadence-done', onCadenceDone)
  game.events.off('scalelab:tick', onTick)
  game.destroy(true)
  game = null
}

onMounted(() => {
  // asset path ต้องผ่าน base URL เสมอ (GitHub Pages subpath) — เหมือน GameCanvas จริง
  setAssetBase(useRuntimeConfig().app.baseURL)
  window.addEventListener('resize', onResize)
  createLabGame(640, 480, 1)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  destroyGame()
})
</script>
