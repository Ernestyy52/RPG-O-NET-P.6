<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Status</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body grid gap-3 p-4 sm:grid-cols-[220px_1fr]">
        <div class="glass-panel p-3 text-center">
          <div class="status-portrait mx-auto" :style="{ borderColor: player.gearAuraColor, boxShadow: `0 0 0 1px #050302, 0 0 14px ${player.gearAuraColor}55, inset 0 0 12px rgba(0,0,0,0.6)` }">
            <img :src="avatar" class="h-full w-full object-contain pixelated" alt="hero" @error="onImageError">
            <img v-for="g in gearBadges" :key="g.slot" :src="assetPath(itemIconPath(g.id))" class="gear-badge pixelated" :class="`gear-${g.slot}`" :style="{ borderColor: g.color }" :alt="g.slot" @error="onImageError">
          </div>
          <div class="gold-text mt-2 font-bold">{{ player.displayName }}</div>
          <div class="text-xs uppercase tracking-wide opacity-75">Lv. {{ player.level }} · {{ player.heroClass.name }}</div>

          <!-- Paper-doll preview: ตัวละครจริงจาก hero-atlas + อาวุธที่ถือ หมุนดู 4 ทิศ -->
          <div v-if="heroFrame" class="mt-3">
            <div class="preview-stage mx-auto" :style="{ width: heroFrame.w + 'px', height: heroFrame.h + 'px' }">
              <div class="preview-hero pixelated" :style="heroFrameStyle" />
              <img v-if="weaponPreview" :src="weaponPreview.src" class="preview-weapon pixelated"
                :style="weaponPreview.style" alt="weapon" @error="onImageError">
            </div>
            <div class="mt-1 flex justify-center gap-1">
              <button v-for="d in dirs" :key="d"
                class="rounded border border-[#8a6a2f] px-1.5 py-0.5 text-[10px] uppercase"
                :class="previewDir === d ? 'bg-[#8a6a2f] text-black font-bold' : 'opacity-60'"
                @click="previewDir = d">{{ d }}</button>
            </div>
          </div>
          <div class="mt-3 space-y-1 text-left">
            <GameStatBar variant="hp" label="HP" :value="player.hp" :max="player.maxHp" />
            <GameStatBar variant="mp" label="MP" :value="player.mp" :max="player.maxMp" />
            <GameStatBar variant="exp" label="EXP" :value="player.exp" :max="player.expNeeded" />
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
            <div v-for="stat in statRows" :key="stat.label" class="status-stat">
              <span class="opacity-70">{{ stat.label }}</span>
              <span class="font-bold text-[#f2c14e]">{{ stat.value }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <!-- RO-feel: กดแต้ม stat เองทุกเลเวล (data/statAllocation.ts) — โบนัสบวกทับ growth ของคลาส -->
          <div v-if="STAT_ALLOC_ENABLED" class="glass-panel p-3">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="gold-text text-sm font-bold">Attributes</h3>
              <span class="text-xs">Points: <span class="font-bold text-[#f2c14e]" data-testid="stat-points">{{ player.statPointsLeft }}</span></span>
            </div>
            <div class="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              <div v-for="def in allocDefs" :key="def.key" class="flex items-center justify-between gap-2 rounded border border-[#8a6a2f]/50 bg-black/30 px-2 py-1" :title="def.desc">
                <span class="w-9 font-bold tracking-wide">{{ def.label }}</span>
                <span class="flex-1 text-right font-bold text-[#f2c14e]" :data-testid="`alloc-count-${def.key}`">{{ player.statAlloc[def.key] ?? 0 }}</span>
                <button
                  class="btn-secondary px-2 py-0.5 text-xs disabled:opacity-40" :data-testid="`alloc-${def.key}`"
                  :disabled="player.statPointsLeft < player.nextStatCost(def.key)"
                  :aria-label="`Add ${def.label}`"
                  @click="player.allocateStat(def.key)"
                >+{{ player.nextStatCost(def.key) > 1 ? ` (${player.nextStatCost(def.key)}pt)` : '' }}</button>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <p class="text-[10px] opacity-60">+{{ STAT_POINTS_PER_LEVEL }} แต้มทุกเลเวล · แพงขึ้นทุกๆ 10 แต้มในค่าเดียวกัน</p>
              <button class="btn-secondary px-2 py-0.5 text-[10px]" data-testid="stat-reset" @click="player.resetStatAllocation()">Reset (free)</button>
            </div>
          </div>

          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Equipment</h3>
            <div class="space-y-1 text-xs">
              <div v-for="slot in slots" :key="slot.id" class="flex items-center justify-between gap-2">
                <span class="uppercase tracking-wide opacity-70">{{ slot.label }}</span>
                <span :class="slot.item ? 'font-bold' : 'opacity-50'">{{ slot.item?.name ?? '— empty —' }}</span>
              </div>
            </div>
          </div>

          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Inventory</h3>
            <p v-if="!bagItems.length" class="text-xs opacity-60">Your bag is empty. Visit the Item Shop in town.</p>
            <div v-for="entry in bagItems" :key="entry.id" class="flex items-center justify-between gap-2 py-1 text-xs">
              <div class="flex items-center gap-2">
                <img :src="assetPath(itemIconPath(entry.id))" class="h-8 w-8 object-contain pixelated" :alt="entry.name" @error="onImageError">
                <span :style="{ color: entry.color }">{{ entry.name }} <span class="opacity-60">x{{ entry.qty }}</span></span>
              </div>
              <button v-if="entry.usable" class="btn-secondary px-2 py-1 text-xs" @click="player.useConsumable(entry.id)">Use</button>
              <button v-else-if="entry.equip" class="btn-secondary px-2 py-1 text-xs" @click="player.equipItem(entry.equip)">Equip</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getItemById, getMaterial, itemIconPath, rarityColor, rarityOf } from '~/data/equipment'
import { ALLOC_DEFS, STAT_ALLOC_ENABLED, STAT_POINTS_PER_LEVEL } from '~/data/statAllocation'

const allocDefs = ALLOC_DEFS
import { getEquipmentVisual, type Facing } from '~/data/equipmentVisuals'
import heroAtlas from '../../../public/character-sprites/hero-atlas.json'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean; avatar: string }>()
defineEmits<{ (e: 'close'): void }>()

const player = usePlayerStore()
const config = useRuntimeConfig()

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }

const statRows = computed(() => [
  { label: 'ATK', value: player.stats.atk },
  { label: 'DEF', value: player.stats.def },
  { label: 'MAG', value: player.stats.mag },
  { label: 'SPD', value: player.stats.speed },
  { label: 'KNOW', value: player.stats.knowledge },
  { label: 'Answers', value: player.correctAnswers },
])

const slots = computed(() => ([
  { id: 'weapon', label: 'Weapon', item: player.equipment.weapon ? getItemById(player.equipment.weapon) : undefined },
  { id: 'armor', label: 'Armor', item: player.equipment.armor ? getItemById(player.equipment.armor) : undefined },
  { id: 'trinket', label: 'Trinket', item: player.equipment.trinket ? getItemById(player.equipment.trinket) : undefined },
]))

// ป้ายเครื่องแต่งกายรอบพอร์เทรต — เปลี่ยนตามของที่สวมใส่จริง (paper-doll)
const gearBadges = computed(() =>
  (['weapon', 'armor', 'trinket'] as const)
    .map((slot) => {
      const id = player.equipment[slot]
      return id ? { slot, id, color: rarityColor(rarityOf(id)) } : null
    })
    .filter((g): g is { slot: 'weapon' | 'armor' | 'trinket'; id: string; color: string } => !!g),
)

// ---- Paper-doll preview 4 ทิศ (Phase 3 Batch D) ----
const dirs: Facing[] = ['down', 'left', 'right', 'up']
const previewDir = ref<Facing>('down')
type AtlasFrame = { frame: { x: number; y: number; w: number; h: number } }
const atlasFrames = (heroAtlas as unknown as { frames: Record<string, AtlasFrame> }).frames

const heroFrame = computed(() => {
  const f = atlasFrames[`${player.classId}_${player.gender}_${previewDir.value}_0`]
  return f ? f.frame : null
})
const heroFrameStyle = computed(() => heroFrame.value ? {
  width: `${heroFrame.value.w}px`,
  height: `${heroFrame.value.h}px`,
  backgroundImage: `url(${assetPath('character-sprites/hero-atlas.png')})`,
  backgroundPosition: `-${heroFrame.value.x}px -${heroFrame.value.y}px`,
} : {})
const weaponPreview = computed(() => {
  const id = player.equipment.weapon
  if (!id) return null
  const visual = getEquipmentVisual(id)
  const anchor = visual?.anchors?.[previewDir.value]
  if (!visual?.iconPath || !anchor) return null
  return {
    src: assetPath(visual.iconPath),
    style: {
      left: `calc(50% + ${anchor.x}px)`,
      top: `calc(58% + ${anchor.y}px)`,
      zIndex: anchor.front ? 2 : 0,
      transform: `translate(-50%, -50%) rotate(${anchor.angle}deg)${anchor.flipX ? ' scaleX(-1)' : ''}`,
    },
  }
})

const bagItems = computed(() =>
  Object.entries(player.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = getItemById(id)
      const mat = getMaterial(id)
      const isEquip = item?.kind === 'equipment'
      return {
        id, qty,
        name: item?.name ?? mat?.name ?? id,
        usable: item?.kind === 'consumable',
        equip: isEquip && player.equipment[item.slot] !== id ? id : '',
        color: rarityColor(rarityOf(id)),
      }
    }),
)
</script>

<style scoped>
.status-portrait {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  border: 1px solid #a8823f;
  background: radial-gradient(circle at 50% 35%, rgba(255, 216, 121, 0.18), transparent 60%), #0d0a06;
  padding: 6px;
}
.gear-badge {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1.5px solid;
  background: #0d0a06;
  object-fit: contain;
  padding: 1px;
}
.gear-weapon { right: -8px; bottom: 8px; }
.gear-armor { right: -8px; top: 8px; }
.gear-trinket { left: -8px; bottom: 8px; }
.status-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 7px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.5);
  background: rgba(0, 0, 0, 0.3);
}
.pixelated { image-rendering: pixelated; }
.preview-stage { position: relative; }
.preview-hero { position: relative; z-index: 1; background-repeat: no-repeat; }
.preview-weapon { position: absolute; width: 20px; height: 20px; object-fit: contain; }
</style>
