<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" @click.self="$emit('close')">
    <div class="portal-window w-full max-w-lg">
      <div class="flex items-stretch gap-3 p-4">
        <img :src="assetPath('npc/portal_guardian.png')" class="portal-portrait h-28 w-28 shrink-0 object-cover pixelated" alt="Portal Guardian">
        <div class="flex flex-col justify-center">
          <div class="mb-1 text-xs uppercase tracking-widest text-cyan-200/80">ผู้เฝ้าประตู · Portal Guardian</div>
          <p class="portal-speech text-sm leading-relaxed text-[#dfe7ff]">
            ข้ามิใช่ผู้ขวางเจ้า...<br>หากแต่เป็นผู้เฝ้าประตูนี้<br>ผู้ที่ไร้ซึ่งความกล้า จงอย่าก้าวเข้าไป
          </p>
        </div>
      </div>
      <div class="grid gap-2 px-4 pb-4">
        <button class="portal-btn portal-btn-go" @click="enter">
          <span class="mr-2">▶</span>1. เข้าดันเจี้ยน (Floor {{ floor }})
        </button>
        <button class="portal-btn" @click="$emit('close')">
          <span class="mr-2 opacity-0">▶</span>2. ถอยออกไป
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gameEvents } from '~/game/systems/eventBus'

const props = defineProps<{ open: boolean; floor: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const config = useRuntimeConfig()

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function enter() {
  gameEvents.emit('town:enter-dungeon', { floor: props.floor })
  emit('close')
}
</script>

<style scoped>
.portal-window {
  background: linear-gradient(160deg, #16121f 0%, #0d0a16 100%);
  border: 2px solid #5b4d86;
  border-radius: 10px;
  box-shadow: 0 0 0 2px #100c1a, 0 0 34px rgba(120, 150, 255, 0.35), inset 0 0 40px rgba(90, 110, 220, 0.12);
}
.portal-portrait {
  border-radius: 8px;
  border: 1px solid rgba(150, 170, 255, 0.4);
  box-shadow: 0 0 14px rgba(110, 140, 255, 0.5);
  image-rendering: pixelated;
}
.portal-speech { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7); }
.portal-btn {
  border: 1px solid rgba(150, 170, 255, 0.35);
  border-radius: 6px;
  background: rgba(40, 36, 66, 0.7);
  padding: 8px 12px;
  text-align: left;
  color: #e7ecff;
  font-size: 0.9rem;
  transition: background 0.15s, box-shadow 0.15s, transform 0.05s;
}
.portal-btn:hover { background: rgba(70, 64, 116, 0.9); box-shadow: 0 0 12px rgba(120, 150, 255, 0.4); }
.portal-btn:active { transform: translateY(1px); }
.portal-btn-go {
  background: rgba(52, 70, 130, 0.85);
  border-color: rgba(140, 200, 255, 0.6);
  color: #f7e7c5;
  font-weight: 700;
}
.pixelated { image-rendering: pixelated; }
</style>
