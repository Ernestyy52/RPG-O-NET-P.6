<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Blacksmith · Crafting</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body p-4">
        <p class="mb-2 text-sm">Gold: <span class="gold-text font-bold">{{ player.gold }}</span> · Craft Epic &amp; Legendary gear from monster materials.</p>

        <!-- คลังวัสดุ -->
        <div class="glass-panel mb-3 p-2">
          <div class="mb-1 text-xs font-bold text-[#cdb27a]">Your materials</div>
          <div v-if="!ownedMaterials.length" class="text-xs opacity-60">No materials yet — defeat monsters to gather them.</div>
          <div class="flex flex-wrap gap-2">
            <div v-for="m in ownedMaterials" :key="m.id" class="flex items-center gap-1 rounded border px-2 py-1 text-xs" :style="{ borderColor: rarityColor(m.rarity) + '77' }">
              <img :src="assetPath(itemIconPath(m.id))" class="h-5 w-5 pixelated" :alt="m.name" @error="onImageError">
              <span :style="{ color: rarityColor(m.rarity) }">{{ m.name }}</span>
              <span class="opacity-70">×{{ m.qty }}</span>
            </div>
          </div>
        </div>

        <!-- สูตรคราฟ -->
        <p v-if="!recipes.length" class="glass-panel p-3 text-center text-xs opacity-70">
          No recipes unlocked yet. Reach Floor 21+ to craft Epic gear, Floor 41+ for Legendary. Keep gathering materials!
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <div v-for="r in recipes" :key="r.id" class="glass-panel p-2" :style="{ borderColor: rarityColor(r.item.rarity) + '88' }">
            <div class="flex items-start gap-2">
              <img :src="assetPath(itemIconPath(r.item.id))" class="item-icon h-11 w-11 shrink-0 pixelated" :alt="r.item.name" :style="{ boxShadow: `inset 0 0 0 2px ${rarityColor(r.item.rarity)}66` }" @error="onImageError">
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold" :style="{ color: rarityColor(r.item.rarity) }">{{ r.item.name }}</div>
                <div class="text-[11px] opacity-80">{{ statText(r.item) }}</div>
                <div class="mt-1 flex flex-wrap gap-x-2 text-[10px]">
                  <span v-for="mat in r.materials" :key="mat.id" :class="hasMat(mat) ? 'text-emerald-300' : 'text-red-300'">
                    {{ matName(mat.id) }} {{ owned(mat.id) }}/{{ mat.qty }}
                  </span>
                  <span :class="player.gold >= r.gold ? 'gold-text' : 'text-red-300'">· {{ r.gold }}g</span>
                </div>
              </div>
            </div>
            <button class="btn-primary mt-2 w-full py-1 text-xs" :disabled="!canCraft(r)" @click="craft(r)">
              {{ isEquipped(r.item.id) ? 'Crafted ✓' : 'Craft' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { recipesForFloor, getEquipmentById, getMaterial, itemIconPath, rarityColor, type Recipe, type EquipmentItem } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()

function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }

const ownedMaterials = computed(() =>
  Object.entries(player.inventory)
    .filter(([id, qty]) => qty > 0 && getMaterial(id))
    .map(([id, qty]) => ({ ...getMaterial(id)!, qty })),
)

// จัดสูตรให้ของที่ทำได้ (วัสดุ+เงินพอ) ขึ้นก่อน แล้วตามด้วยเทียร์
const recipes = computed(() => {
  const list = recipesForFloor(player.currentFloor)
    .map((r) => ({ ...r, item: getEquipmentById(r.outputId)! }))
    .filter((r) => r.item)
  return list.sort((a, b) => Number(canCraft(b)) - Number(canCraft(a)) || a.item.tier - b.item.tier)
})

function owned(id: string) { return player.inventory[id] ?? 0 }
function hasMat(mat: { id: string; qty: number }) { return owned(mat.id) >= mat.qty }
function matName(id: string) { return getMaterial(id)?.name ?? id }
function isEquipped(id: string) { return Object.values(player.equipment).includes(id) }
function canCraft(r: Recipe & { item: EquipmentItem }) {
  return player.gold >= r.gold && r.materials.every(hasMat) && !isEquipped(r.item.id)
}
function craft(r: Recipe & { item: EquipmentItem }) { player.craftItem(r.item.id) }
function statText(item: EquipmentItem) {
  return Object.entries(item.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' / ')
}
</script>

<style scoped>
.item-icon {
  border-radius: 6px;
  background: radial-gradient(circle at 50% 40%, rgba(120, 96, 60, 0.35), rgba(20, 16, 12, 0.6));
  padding: 2px;
}
.pixelated { image-rendering: pixelated; }
</style>
