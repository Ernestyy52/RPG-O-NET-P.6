<!-- On-screen movement joystick for touch devices (mobile release blocker per scale-integration prompt).
     Shows only on coarse-pointer screens; drives the shared pure touchInput module which every scene's
     movement read ORs into resolveMovement — so it never changes physics/speed. Anchored bottom-left,
     clear of the centred player, doors and interaction prompts (S3 hard-rejection: UI must not cover them). -->
<template>
  <div
    ref="baseEl"
    class="touch-joystick"
    data-testid="touch-joystick"
    aria-hidden="true"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @pointerleave="onUp"
  >
    <div class="tj-ring" />
    <div class="tj-knob" :style="{ transform: `translate(${knob.x}px, ${knob.y}px)` }" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { setTouchAxis, clearTouchAxis } from '~/game/systems/touchInput'

const RADIUS = 42 // px the knob can travel from centre
const baseEl = ref<HTMLElement | null>(null)
const knob = reactive({ x: 0, y: 0 })
let activeId: number | null = null

function updateFrom(clientX: number, clientY: number) {
  const el = baseEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  let dx = clientX - cx
  let dy = clientY - cy
  const mag = Math.hypot(dx, dy)
  if (mag > RADIUS) { dx = (dx / mag) * RADIUS; dy = (dy / mag) * RADIUS }
  knob.x = dx
  knob.y = dy
  setTouchAxis(dx / RADIUS, dy / RADIUS) // normalized -1..1 per axis
}

function onDown(e: PointerEvent) {
  activeId = e.pointerId
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  updateFrom(e.clientX, e.clientY)
  e.preventDefault()
}
function onMove(e: PointerEvent) {
  if (activeId !== e.pointerId) return
  updateFrom(e.clientX, e.clientY)
  e.preventDefault()
}
function onUp(e: PointerEvent) {
  if (activeId !== null && activeId !== e.pointerId) return
  activeId = null
  knob.x = 0
  knob.y = 0
  clearTouchAxis()
}
</script>

<style scoped>
.touch-joystick {
  position: absolute;
  left: 14px;
  bottom: 14px;
  width: 108px;
  height: 108px;
  border-radius: 9999px;
  display: none; /* keyboard-only by default; revealed on touch screens below */
  align-items: center;
  justify-content: center;
  touch-action: none;
  z-index: 30;
  user-select: none;
  -webkit-user-select: none;
}

/* only present a touch control where there is a coarse pointer and no hover (phones/tablets) */
@media (hover: none) and (pointer: coarse) {
  .touch-joystick { display: flex; }
}

.tj-ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 45%, rgba(255, 233, 179, 0.10), rgba(20, 16, 10, 0.34));
  border: 2px solid rgba(255, 233, 179, 0.45);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.tj-knob {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  background: radial-gradient(circle at 40% 35%, #ffe9b3, #b98a3a);
  border: 2px solid rgba(60, 42, 25, 0.9);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  will-change: transform;
}
</style>
