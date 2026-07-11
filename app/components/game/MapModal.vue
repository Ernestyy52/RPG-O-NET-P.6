<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-lg">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Tower Map</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body space-y-2 p-4">
        <p class="text-xs opacity-70">
          The Floating Realms rise {{ TOTAL_FLOORS }} floors. Each world spans 10 floors — a town at its gate, a world boss at its peak.
        </p>
        <div v-for="w in worlds" :key="w.index" class="map-world" :class="{ 'map-world-current': w.isCurrent, 'map-world-locked': w.locked }">
          <div class="map-world-glyph" :style="{ background: w.color }" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold" :class="w.isCurrent ? 'gold-text' : ''">World {{ w.index }} — {{ w.name }}</span>
              <span v-if="w.isCurrent" class="map-here">YOU ARE HERE</span>
            </div>
            <div class="text-[11px] opacity-70">Floors {{ w.from }}–{{ w.to }} · Town {{ w.from }} · World Boss {{ w.to }}</div>
            <!-- จุดสถานะ 10 ชั้นในโลกนี้: ผ่านแล้ว/ปัจจุบัน/ยังไม่ถึง -->
            <div class="mt-1 flex gap-1">
              <span
                v-for="f in 10" :key="f"
                class="map-floor-dot"
                :class="floorClass(w.from + f - 1)"
                :title="`Floor ${w.from + f - 1}`"
              />
            </div>
          </div>
          <span v-if="w.locked" class="text-lg opacity-40">🔒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BIOMES } from '~/data/biomes'
import { TOTAL_FLOORS } from '~/data/floors'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()

function cssColor(hex: number) { return `#${hex.toString(16).padStart(6, '0')}` }

const worlds = computed(() => {
  const count = Math.ceil(TOTAL_FLOORS / 10)
  return Array.from({ length: count }, (_, i) => {
    const from = i * 10 + 1
    const to = Math.min(TOTAL_FLOORS, from + 9)
    const biome = BIOMES[i % BIOMES.length]
    return {
      index: i + 1,
      name: biome.name,
      color: `linear-gradient(135deg, ${cssColor(biome.grass.light)}, ${cssColor(biome.grass.dark)})`,
      from,
      to,
      isCurrent: player.currentFloor >= from && player.currentFloor <= to,
      locked: player.currentFloor < from,
    }
  })
})

function floorClass(floor: number) {
  if (floor === player.currentFloor) return 'map-floor-current'
  if (floor < player.currentFloor) return 'map-floor-cleared'
  return ''
}
</script>

<style scoped>
.map-world {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(138, 106, 47, 0.45);
  background: rgba(0, 0, 0, 0.3);
}
.map-world-current {
  border-color: #b98b3e;
  box-shadow: 0 0 12px rgba(242, 193, 78, 0.18), inset 0 0 0 1px rgba(255, 216, 132, 0.15);
}
.map-world-locked { opacity: 0.55; }
.map-world-glyph {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.6);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
.map-here {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  border-radius: 999px;
  background: #f2c14e;
  color: #2a1a08;
}
.map-floor-dot {
  width: 14px;
  height: 6px;
  border-radius: 2px;
  background: rgba(205, 178, 122, 0.18);
  border: 1px solid rgba(138, 106, 47, 0.4);
}
.map-floor-cleared { background: rgba(110, 231, 160, 0.55); border-color: rgba(110, 231, 160, 0.6); }
.map-floor-current {
  background: #f2c14e;
  border-color: #ffe09a;
  box-shadow: 0 0 6px rgba(242, 193, 78, 0.8);
}
</style>
