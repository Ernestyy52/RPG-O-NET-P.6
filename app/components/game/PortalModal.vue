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
  border-radius: 8px;
  border: 1px solid #8f7ed9;
  background:
    radial-gradient(circle at 50% 0%, rgba(150, 130, 255, 0.1), transparent 55%),
    linear-gradient(180deg, rgba(28, 22, 46, 0.97) 0%, rgba(13, 10, 22, 0.985) 100%);
  box-shadow:
    0 0 0 2px #08060f,
    0 0 0 3px #5b4d86,
    0 0 0 4px #08060f,
    0 14px 34px rgba(0, 0, 0, 0.72),
    0 0 26px rgba(120, 150, 255, 0.22),
    inset 0 0 0 1px rgba(180, 165, 255, 0.2),
    inset 0 0 28px rgba(0, 0, 0, 0.5);
}
.portal-portrait {
  border-radius: 6px;
  border: 1px solid #6a5cb0;
  box-shadow: 0 0 0 1px #08060f, 0 0 14px rgba(110, 140, 255, 0.5);
  image-rendering: pixelated;
}
.portal-speech { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7); }
.portal-btn {
  @apply border font-bold transition-all duration-100;
  border-radius: 6px;
  border-color: #6a5cb0;
  background: linear-gradient(180deg, #2e2650 0%, #18132a 100%);
  box-shadow: 0 0 0 1px #08060f, 0 3px 0 #08060f, inset 0 1px 0 rgba(180, 165, 255, 0.14);
  padding: 8px 12px;
  text-align: left;
  color: #e7ecff;
  font-size: 0.9rem;
}
.portal-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
.portal-btn:active { transform: translateY(2px); box-shadow: 0 0 0 1px #08060f, 0 1px 0 #08060f; }
.portal-btn-go {
  background: linear-gradient(180deg, #8ea4ff 0%, #5468d9 50%, #33429c 100%);
  border-color: #b9c8ff;
  color: #17142b;
  box-shadow: 0 0 0 1px #08060f, 0 3px 0 #171049, 0 0 14px rgba(140, 170, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.pixelated { image-rendering: pixelated; }
</style>
