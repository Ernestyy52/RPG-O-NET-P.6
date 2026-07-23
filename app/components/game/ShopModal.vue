<template>
  <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" :aria-labelledby="shopTitleId">
    <div class="pixel-window anime-window shop-window w-full max-w-3xl">
      <div class="pixel-titlebar">
        <div>
          <p class="text-[9px] font-bold uppercase tracking-[.2em] text-[#9f906f]">Aethergate Market · Tier {{ tier }}</p>
          <h2 :id="shopTitleId" class="gold-text font-display text-lg font-bold">{{ title }}</h2>
        </div>
        <div class="flex items-center gap-3">
          <div class="shop-purse"><img :src="assetPath('item-icons/trk_ring.png')" alt=""><span>{{ player.gold }}</span><small>G</small></div>
          <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="pixel-window-body p-3 sm:p-4">
        <div v-if="props.kindFilter === 'equipment'" class="shop-tabs" role="tablist" aria-label="Equipment categories">
          <button v-for="tabDef in equipmentTabs" :key="tabDef.id" role="tab" :aria-selected="activeSlot === tabDef.id" :class="{ active: activeSlot === tabDef.id }" @click="activeSlot = tabDef.id">
            <img :src="assetPath(tabDef.icon)" alt=""><span>{{ tabDef.label }}</span><small>{{ countFor(tabDef.id) }}</small>
          </button>
        </div>

        <div v-if="props.kindFilter === 'equipment' && activeSlot === 'recommended'" class="recommend-banner">
          <img :src="assetPath('skill-icons/helm.png')" alt="">
          <div><strong>Curated for {{ player.heroClass.name }}</strong><p>ของที่เข้ากับค่าสถานะหลักของอาชีพ ลดเวลาหาของ แต่ยังเลือกของทุกชนิดได้จากแท็บอื่น</p></div>
        </div>
        <p v-if="purchaseNotice" class="purchase-notice" role="status">{{ purchaseNotice }}</p>

        <div class="shop-grid">
          <article v-for="item in items" :key="item.id" class="shop-card" :class="{ equipped: isEquipped(item), affordable: player.gold >= item.cost }" :style="{ '--rarity': rarityColor(item.rarity) }">
            <div class="item-frame"><img :src="assetPath(itemIconPath(item.id))" class="pixelated" :alt="item.name" @error="onImageError"></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div><h3 :style="{ color: rarityColor(item.rarity) }">{{ item.name }}</h3><p>{{ item.kind === 'equipment' ? `${item.slot} · T${item.tier}` : consumableText(item) }}</p></div>
                <span v-if="isRecommended(item)" class="recommend-chip">CLASS PICK</span>
              </div>
              <div class="stat-line">{{ statText(item) }}</div>
              <div class="mt-2 flex items-center justify-between gap-2">
                <span v-if="isEquipped(item)" class="equipped-chip">EQUIPPED</span>
                <span v-else-if="player.gold < item.cost" class="need-gold">Need {{ item.cost - player.gold }}g</span>
                <span v-else class="ready-label">Ready to equip</span>
                <button class="buy-button" :disabled="player.gold < item.cost || isEquipped(item)" :aria-label="`Buy ${item.name} for ${item.cost} gold`" @click="buy(item)">
                  {{ isEquipped(item) ? 'Worn' : `${item.cost}g` }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <p v-if="!items.length" class="p-6 text-center text-sm text-[#9f947e]">No items in this category for the current floor.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { equipmentTierForFloor, shopInventoryForFloor, itemIconPath, rarityColor, type ConsumableItem, type InventoryItem } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

type EquipmentTab = 'recommended' | 'weapon' | 'armor' | 'trinket'
const props = withDefaults(defineProps<{ open: boolean; kindFilter?: 'all' | 'equipment' | 'consumable' }>(), { kindFilter: 'all' })
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()
const activeSlot = ref<EquipmentTab>('recommended')
const purchaseNotice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const equipmentTabs: { id: EquipmentTab; label: string; icon: string }[] = [
  { id: 'recommended', label: 'Recommended', icon: 'skill-icons/helm.png' },
  { id: 'weapon', label: 'Weapons', icon: 'skill-icons/sword.png' },
  { id: 'armor', label: 'Outfits', icon: 'item-icons/armor_t1.png' },
  { id: 'trinket', label: 'Trinkets', icon: 'item-icons/trinket_t1.png' },
]
const preferredTypes = computed(() => ({
  warrior: ['sword', 'longsword', 'greatsword', 'plate', 'chain', 'cloak', 'ring'],
  mage: ['staff', 'wand', 'scythe', 'robe', 'mage_robe', 'cloak', 'orb'],
  archer: ['bow', 'longbow', 'crossbow', 'dagger', 'leather', 'hide', 'charm'],
  guardian: ['mace', 'warhammer', 'spear', 'plate', 'chain', 'scale', 'amulet'],
}[player.classId]))
const allItems = computed(() => {
  const all = shopInventoryForFloor(player.currentFloor)
  return props.kindFilter === 'all' ? all : all.filter((item) => item.kind === props.kindFilter)
})
const items = computed(() => {
  if (props.kindFilter !== 'equipment') return allItems.value
  const equipment = allItems.value.filter((item) => item.kind === 'equipment')
  const filtered = activeSlot.value === 'recommended'
    ? equipment.filter((item) => preferredTypes.value.includes(item.type))
    : equipment.filter((item) => item.slot === activeSlot.value)
  return [...filtered].sort((a, b) => Number(player.gold < a.cost) - Number(player.gold < b.cost) || a.cost - b.cost || a.name.localeCompare(b.name))
})
const tier = computed(() => equipmentTierForFloor(player.currentFloor))
const title = computed(() => props.kindFilter === 'equipment' ? 'Equipment Atelier' : props.kindFilter === 'consumable' ? 'Item Apothecary' : 'Market')
const shopTitleId = computed(() => `shop-title-${props.kindFilter}`)
watch(() => props.open, (open) => { if (open) { activeSlot.value = 'recommended'; purchaseNotice.value = '' } })

function countFor(tab: EquipmentTab) {
  const equipment = allItems.value.filter((item) => item.kind === 'equipment')
  return tab === 'recommended' ? equipment.filter((item) => preferredTypes.value.includes(item.type)).length : equipment.filter((item) => item.slot === tab).length
}
function isEquipped(item: InventoryItem) { return item.kind === 'equipment' && player.equipment[item.slot] === item.id }
function isRecommended(item: InventoryItem) { return item.kind === 'equipment' && preferredTypes.value.includes(item.type) }
function buy(item: InventoryItem) {
  if (!player.buyItem(item.id)) return
  purchaseNotice.value = item.kind === 'equipment' ? `${item.name} equipped — your appearance and stats changed.` : `${item.name} added to your bag.`
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { purchaseNotice.value = '' }, 2600)
}
function statText(item: InventoryItem) { return item.kind === 'consumable' ? 'Single-use support item' : Object.entries(item.stats).map(([key, value]) => `+${value} ${key.toUpperCase()}`).join(' · ') }
function consumableText(item: ConsumableItem) { const effect = item.effect; if (effect.revive) return 'Revives on defeat'; if (effect.heal && effect.mp) return `Heal ${effect.heal} · MP ${effect.mp}`; if (effect.heal) return `Heal ${effect.heal} HP`; if (effect.mp) return `Restore ${effect.mp} MP`; return effect.focus ? 'Focus support' : 'Damage shield' }
function assetPath(path: string) { const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`; return `${base}${path.replace(/^\/+/, '')}` }
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }
</script>

<style scoped>
.shop-window { max-height: 92vh; }.shop-purse { display: flex; align-items: center; gap: 4px; padding: 5px 9px; border: 1px solid #6e5833; border-radius: 999px; background: #090b10; }.shop-purse img { width: 17px; height: 17px; object-fit: contain; }.shop-purse span { color: #f0c765; font-size: 15px; font-weight: 900; }.shop-purse small { color: #8e826d; font-size: 8px; font-weight: 900; }
.shop-tabs { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 10px; padding: 4px; border: 1px solid #55472e; border-radius: 8px; background: rgba(3,5,10,.62); }.shop-tabs button { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 38px; border: 1px solid transparent; border-radius: 5px; color: #918772; font-size: 10px; font-weight: 800; }.shop-tabs button.active { border-color: #ad8844; background: #2b2013; color: #efd38a; }.shop-tabs img { width: 21px; height: 21px; object-fit: contain; }.shop-tabs small { display: grid; place-items: center; min-width: 16px; height: 16px; border-radius: 8px; background: #11141c; color: #ad9e7c; font-size: 8px; }
.recommend-banner { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; padding: 8px 10px; border: 1px solid rgba(98,153,193,.48); border-radius: 7px; background: linear-gradient(90deg, rgba(38,82,112,.24), rgba(11,14,21,.72)); }.recommend-banner img { width: 30px; height: 30px; object-fit: contain; }.recommend-banner strong { color: #b9dafa; font-size: 11px; }.recommend-banner p { color: #8d9baa; font-size: 9px; }.purchase-notice { margin-bottom: 9px; padding: 7px 9px; border: 1px solid rgba(79,194,132,.5); border-radius: 6px; background: rgba(31,104,71,.24); color: #a8f0c8; font-size: 10px; }
.shop-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; }.shop-card { --rarity: #c9c2ad; display: flex; gap: 9px; min-height: 92px; padding: 9px; border: 1px solid color-mix(in srgb,var(--rarity) 40%,#403727); border-radius: 7px; background: linear-gradient(180deg,rgba(29,31,42,.94),rgba(9,10,15,.98)); }.shop-card.affordable { box-shadow: inset 2px 0 color-mix(in srgb,var(--rarity) 60%,transparent); }.shop-card.equipped { background: linear-gradient(180deg,rgba(27,60,48,.6),rgba(7,18,14,.95)); }.item-frame { display: grid; place-items: center; flex: 0 0 48px; height: 48px; border: 1px solid color-mix(in srgb,var(--rarity) 65%,#3d3324); border-radius: 7px; background: radial-gradient(circle,rgba(130,110,73,.25),#090a0e 68%); }.item-frame img { width: 42px; height: 42px; object-fit: contain; }.shop-card h3 { font-size: 11px; font-weight: 900; line-height: 1.25; }.shop-card p { color: #8f8779; font-size: 9px; text-transform: uppercase; }.stat-line { margin-top: 5px; color: #c9bea5; font-size: 9px; }.recommend-chip,.equipped-chip { flex: 0 0 auto; padding: 2px 4px; border: 1px solid #4f7592; border-radius: 4px; background: rgba(38,76,105,.35); color: #aacee9; font-size: 7px; font-weight: 900; }.equipped-chip { border-color: #4b9d74; color: #8ee3b3; }.need-gold { color: #d28475; font-size: 9px; }.ready-label { color: #78c99a; font-size: 9px; }.buy-button { min-width: 54px; padding: 5px 8px; border: 1px solid #d4aa51; border-radius: 5px; background: linear-gradient(180deg,#d9a847,#87511e); color: #170e05; font-size: 9px; font-weight: 900; box-shadow: 0 2px #2c1907; }.buy-button:disabled { border-color: #4e493f; background: #17191e; color: #6e695f; box-shadow: none; }
@media (max-width:640px) { .shop-tabs { grid-template-columns: repeat(2,1fr); }.shop-grid { grid-template-columns: 1fr; }.shop-tabs button { min-height: 34px; }.shop-card { min-height: 84px; } }
</style>
