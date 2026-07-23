<template>
  <!-- Minimap HUD — ข้อมูลทั้งหมดมาจาก scene ผ่าน eventBus (minimap:layout/tick/clear)
       z-30: ใต้ battle HUD (z-40) และ modal (z-50); ปุ่มพับเก็บได้ (mobile จอเล็ก)
       absolute ภายในกรอบ canvas (index.vue) — ลอยบนมุมขวาบนของเกมเสมอ ไม่ทับ HUD ข้างบน -->
  <div v-if="hasLayout" class="pointer-events-none absolute right-2 top-2 z-30 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
    <button
      class="pointer-events-auto rounded border border-[#8a6a2f] bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f2d98a]"
      :aria-label="visible ? 'Hide minimap' : 'Show minimap'"
      data-testid="minimap-toggle"
      @click="visible = !visible"
    >{{ visible ? 'Map ▾' : 'Map ▸' }}</button>
    <canvas
      v-show="visible" ref="canvasEl" data-testid="minimap-canvas"
      class="rounded border border-[#8a6a2f] bg-black/55"
      :style="{ width: cssW + 'px', height: cssH + 'px' }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gameEvents, type MinimapLayout, type MinimapTick, type MinimapMarkerKind } from '~/game/systems/eventBus'
import { minimapScale } from '~/game/systems/minimap'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const hasLayout = ref(false)
const visible = ref(true)
const cssW = ref(150)
const cssH = ref(112)

let layout: MinimapLayout | null = null
let lastTick: MinimapTick | null = null

// สี+รูปทรงต่อชนิด marker (รูปทรงต่างกัน — ไม่พึ่งสีอย่างเดียว, color-blind cue)
const MARKER_STYLE: Record<MinimapMarkerKind, { color: string; shape: 'square' | 'circle' | 'triangle' | 'diamond' }> = {
  door: { color: '#f2c14e', shape: 'square' },
  service: { color: '#f2c14e', shape: 'square' },
  exit: { color: '#6ee7a0', shape: 'triangle' },
  portal: { color: '#c78bff', shape: 'circle' },
  dungeon: { color: '#c78bff', shape: 'square' },
  boss: { color: '#ef6a6a', shape: 'diamond' },
  chest: { color: '#ffd977', shape: 'circle' },
  npc: { color: '#8fd0ff', shape: 'circle' },
}

function fitCanvas() {
  // มือถือย่อลง — ไม่บังพื้นที่เดิน/ปุ่ม HUD
  const compact = window.innerWidth < 640
  cssW.value = compact ? 112 : 150
  cssH.value = compact ? 84 : 112
  const c = canvasEl.value
  if (!c) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = Math.round(cssW.value * dpr)
  c.height = Math.round(cssH.value * dpr)
  draw()
}

function drawMarker(ctx: CanvasRenderingContext2D, kind: MinimapMarkerKind, x: number, y: number, r: number) {
  const { color, shape } = MARKER_STYLE[kind]
  ctx.fillStyle = color
  ctx.beginPath()
  if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2)
  else if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2)
  else if (shape === 'triangle') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath() }
  else { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath() }
  ctx.fill()
}

function draw() {
  const c = canvasEl.value
  if (!c || !layout) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW.value, cssH.value)

  const s = minimapScale(layout.worldW, layout.worldH, cssW.value - 6, cssH.value - 6)
  const ox = (cssW.value - layout.worldW * s) / 2
  const oy = (cssH.value - layout.worldH * s) / 2

  // พื้นที่โลก
  ctx.fillStyle = 'rgba(20, 16, 10, 0.55)'
  ctx.fillRect(ox, oy, layout.worldW * s, layout.worldH * s)
  // กำแพง/สิ่งกีดขวาง
  ctx.fillStyle = 'rgba(201, 162, 90, 0.5)'
  for (const b of layout.blocks) {
    ctx.fillRect(ox + b.x * s, oy + b.y * s, Math.max(1, b.w * s), Math.max(1, b.h * s))
  }
  // markers (ตำแหน่งนิ่ง)
  for (const m of layout.markers) drawMarker(ctx, m.kind, ox + m.x * s, oy + m.y * s, 3)
  // entities สด
  if (lastTick) {
    ctx.fillStyle = '#ef6a6a'
    for (const mon of lastTick.monsters ?? []) {
      ctx.beginPath()
      ctx.arc(ox + mon.x * s, oy + mon.y * s, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#8fd0ff'
    for (const o of lastTick.others ?? []) {
      ctx.beginPath()
      ctx.arc(ox + o.x * s, oy + o.y * s, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    // ผู้เล่น: จุดขาวขอบดำ เด่นสุดเสมอ
    const px = ox + lastTick.player.x * s
    const py = oy + lastTick.player.y * s
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(px, py, 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

// fitCanvas (ไม่ใช่ draw ตรงๆ): canvas เพิ่ง mount จาก v-if — ต้องตั้ง backing-store size ก่อนวาดครั้งแรก
const onLayout = (l: MinimapLayout) => { layout = l; lastTick = null; hasLayout.value = true; requestAnimationFrame(fitCanvas) }
const onTick = (t: MinimapTick) => { lastTick = t; draw() }
const onClear = () => { layout = null; lastTick = null; hasLayout.value = false }
const onKey = (e: KeyboardEvent) => {
  if (e.key.toLowerCase() !== 'm' || e.repeat) return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  visible.value = !visible.value
}

onMounted(() => {
  gameEvents.on('minimap:layout', onLayout)
  gameEvents.on('minimap:tick', onTick)
  gameEvents.on('minimap:clear', onClear)
  window.addEventListener('resize', fitCanvas)
  window.addEventListener('keydown', onKey)
  fitCanvas()
})
onUnmounted(() => {
  gameEvents.off('minimap:layout', onLayout)
  gameEvents.off('minimap:tick', onTick)
  gameEvents.off('minimap:clear', onClear)
  window.removeEventListener('resize', fitCanvas)
  window.removeEventListener('keydown', onKey)
})
</script>
