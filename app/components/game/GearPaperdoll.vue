<template>
  <div class="paperdoll-stage" :class="{ 'paperdoll-compact': compact }" :style="stageStyle" data-testid="gear-paperdoll">
    <div class="paperdoll-sigil" />
    <div v-if="offhandPath" class="paperdoll-layer pixelated" :style="animatedStyle(offhandPath, 'offhand')" role="img" :aria-label="`${weaponName} shield, ${direction} view`" />
    <div v-if="heroFrame" class="paperdoll-hero pixelated" :style="heroStyle" role="img" :aria-label="`${player.displayName}, ${direction} view`" />
    <div v-if="armorPath" class="paperdoll-layer pixelated" :style="animatedStyle(armorPath, 'armor')" role="img" :aria-label="`${armorName} outfit, ${direction} view`" />
    <div v-if="headPath" class="paperdoll-layer pixelated" :style="animatedStyle(headPath, 'head')" role="img" :aria-label="`${armorName} headgear, ${direction} view`" />
    <div v-if="weaponPath" class="paperdoll-layer pixelated" :style="animatedStyle(weaponPath, 'weapon')" role="img" :aria-label="`${weaponName}, ${direction} view`" />
    <img
      v-if="trinketVisual" :src="assetPath(trinketVisual.iconPath)" class="paperdoll-trinket pixelated"
      :style="trinketStyle" :alt="trinketName" @error="hideBroken"
    >
    <span v-if="armorVisual" class="paperdoll-material" :style="{ borderColor: armorVisual.auraColor, color: armorVisual.auraColor }">
      {{ armorVisual.outfitFamily }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getItemById } from '~/data/equipment'
import { getEquipmentVisual, type Facing } from '~/data/equipmentVisuals'
import heroAtlas from '../../../public/character-sprites/hero-atlas.json'
import { usePlayerStore } from '~/stores/player'

const props = withDefaults(defineProps<{ direction?: Facing; compact?: boolean }>(), { direction: 'down', compact: false })
const player = usePlayerStore()
const config = useRuntimeConfig()
type AtlasFrame = { frame: { x: number; y: number; w: number; h: number } }
type AnimatedLayer = 'armor' | 'head' | 'weapon' | 'offhand'
const atlasFrames = (heroAtlas as unknown as { frames: Record<string, AtlasFrame> }).frames

const heroFrame = computed(() => atlasFrames[`${player.classId}_${player.gender}_${props.direction}_0`]?.frame ?? null)
const heroStyle = computed(() => heroFrame.value ? {
  width: `${heroFrame.value.w}px`, height: `${heroFrame.value.h}px`,
  backgroundImage: `url(${assetPath('character-sprites/hero-atlas.png')})`,
  backgroundPosition: `-${heroFrame.value.x}px -${heroFrame.value.y}px`,
} : {})
const armorVisual = computed(() => player.equipment.armor ? getEquipmentVisual(player.equipment.armor) : undefined)
const weaponVisual = computed(() => player.equipment.weapon ? getEquipmentVisual(player.equipment.weapon) : undefined)
const trinketVisual = computed(() => player.equipment.trinket ? getEquipmentVisual(player.equipment.trinket) : undefined)
const armorPath = computed(() => armorVisual.value?.animationPath)
const headPath = computed(() => armorVisual.value?.headAnimationPath)
const weaponPath = computed(() => weaponVisual.value?.animationPath)
const offhandPath = computed(() => weaponVisual.value?.offhandAnimationPath)
const armorName = computed(() => getItemById(player.equipment.armor ?? '')?.name ?? 'Armor')
const weaponName = computed(() => getItemById(player.equipment.weapon ?? '')?.name ?? 'Weapon')
const trinketName = computed(() => getItemById(player.equipment.trinket ?? '')?.name ?? 'Trinket')
const stageStyle = computed(() => ({ '--gear-aura': player.gearAuraColor }))
const previewFrame = ref<0 | 1 | 2>(0)
const previewSequence: Array<0 | 1 | 2> = [0, 1, 0, 2]
let previewStep = 0
let previewTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  previewTimer = setInterval(() => {
    previewStep = (previewStep + 1) % previewSequence.length
    previewFrame.value = previewSequence[previewStep]!
  }, 180)
})
onUnmounted(() => { if (previewTimer) clearInterval(previewTimer) })

function layerZ(slot: AnimatedLayer): number {
  if (slot === 'head') return 5
  if (slot === 'armor') return 3
  if (slot === 'weapon') return props.direction === 'up' ? 1 : 4
  return props.direction === 'up' || props.direction === 'left' ? 1 : 4
}

function animatedStyle(path: string, slot: AnimatedLayer) {
  const row: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 }
  const aura = slot === 'armor' || slot === 'head' ? armorVisual.value?.auraColor : weaponVisual.value?.auraColor
  return {
    zIndex: layerZ(slot),
    backgroundImage: `url(${assetPath(path)})`,
    backgroundSize: '300% 400%',
    backgroundPosition: `${previewFrame.value * 50}% ${row[props.direction] * (100 / 3)}%`,
    backgroundRepeat: 'no-repeat',
    transform: 'translate(-50%, -50%)',
    filter: `drop-shadow(0 0 3px ${aura ?? '#fff'}88)`,
  }
}

const trinketStyle = computed(() => {
  const anchor = trinketVisual.value?.anchors[props.direction]
  if (!anchor) return {}
  const factor = props.compact ? 0.64 : 1
  return {
    left: `calc(50% + ${anchor.x * factor}px)`,
    top: `calc(72% + ${anchor.y * factor}px)`,
    zIndex: anchor.front ? 6 : 1,
    transform: `translate(-50%, -50%) rotate(${anchor.angle}deg)${anchor.flipX ? ' scaleX(-1)' : ''}`,
    filter: `drop-shadow(0 0 3px ${trinketVisual.value?.auraColor ?? '#fff'}88)`,
  }
})

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function hideBroken(event: Event) { (event.target as HTMLElement).style.visibility = 'hidden' }
</script>

<style scoped>
.paperdoll-stage {
  --gear-aura: #c9c2ad;
  position: relative;
  width: 96px;
  height: 126px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--gear-aura) 75%, #6e5124);
  border-radius: 48px 48px 12px 12px;
  background:
    radial-gradient(circle at 50% 70%, color-mix(in srgb, var(--gear-aura) 24%, transparent), transparent 42%),
    linear-gradient(180deg, rgba(22, 30, 48, .96), rgba(6, 8, 14, .98));
  box-shadow: inset 0 0 28px #000, 0 0 16px color-mix(in srgb, var(--gear-aura) 28%, transparent);
}
.paperdoll-sigil {
  position: absolute; left: 50%; bottom: 8px; width: 58px; height: 18px; transform: translateX(-50%);
  border: 1px solid color-mix(in srgb, var(--gear-aura) 65%, transparent); border-radius: 50%;
  box-shadow: 0 0 10px color-mix(in srgb, var(--gear-aura) 45%, transparent), inset 0 0 8px #000;
}
.paperdoll-hero { position: absolute; z-index: 2; left: 50%; bottom: 12px; transform: translateX(-50%); background-repeat: no-repeat; }
.paperdoll-layer { position: absolute; left: 50%; top: 54%; width: 64px; height: 96px; }
.paperdoll-trinket { position: absolute; width: 15px; height: 15px; object-fit: contain; animation: trinketFloat 1.5s ease-in-out infinite alternate; }
.paperdoll-material {
  position: absolute; z-index: 7; right: 5px; bottom: 5px; padding: 1px 4px; border: 1px solid; border-radius: 4px;
  background: rgba(3, 5, 9, .82); font-size: 8px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
}
.paperdoll-compact { width: 58px; height: 68px; border-radius: 30px 30px 8px 8px; }
.paperdoll-compact .paperdoll-hero { bottom: -15px; transform: translateX(-50%) scale(.62); transform-origin: bottom center; }
.paperdoll-compact .paperdoll-layer { top: 50%; width: 40px; height: 60px; }
.paperdoll-compact .paperdoll-trinket { width: 11px; height: 11px; }
.paperdoll-compact .paperdoll-material, .paperdoll-compact .paperdoll-sigil { display: none; }
@keyframes trinketFloat { to { margin-top: -3px; } }
@media (prefers-reduced-motion: reduce) { .paperdoll-trinket { animation: none; } }
</style>
