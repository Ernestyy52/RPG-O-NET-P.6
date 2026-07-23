<template>
  <div v-if="open" class="modal-backdrop">
    <div class="pixel-window anime-window w-full max-w-2xl">
      <div class="pixel-titlebar status-titlebar">
        <div>
          <p class="ornate-kicker text-[9px]">Adventurer Profile</p>
          <h2 class="gold-text text-lg font-bold">Status Grimoire</h2>
        </div>
        <span class="status-class-seal">{{ player.heroClass.name }}</span>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body grid gap-3 p-4 sm:grid-cols-[220px_1fr]">
        <div class="glass-panel status-hero-panel p-3 text-center">
          <div class="status-portrait mx-auto" :style="{ borderColor: player.gearAuraColor, boxShadow: `0 0 0 1px #050302, 0 0 14px ${player.gearAuraColor}55, inset 0 0 12px rgba(0,0,0,0.6)` }">
            <img :src="avatar" class="h-full w-full object-contain pixelated" alt="hero" @error="onImageError">
            <img v-for="g in gearBadges" :key="g.slot" :src="assetPath(itemIconPath(g.id))" class="gear-badge pixelated" :class="`gear-${g.slot}`" :style="{ borderColor: g.color }" :alt="g.slot" @error="onImageError">
          </div>
          <div class="gold-text mt-2 font-bold">{{ player.displayName }}</div>
          <div class="text-xs uppercase tracking-wide opacity-75">Lv. {{ player.level }} · {{ player.heroClass.name }}</div>

          <!-- Full paper-doll: body + outfit + weapon + trinket, all bound to equipped item ids. -->
          <div class="mt-3">
            <GameGearPaperdoll class="mx-auto" :direction="previewDir" />
            <div class="direction-picker mt-2" aria-label="Paper-doll direction">
              <button v-for="direction in dirs" :key="direction" :aria-pressed="previewDir === direction"
                :class="{ active: previewDir === direction }" @click="previewDir = direction">{{ direction }}</button>
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
          <div v-if="STAT_ALLOC_ENABLED" class="glass-panel status-section p-3">
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

          <div class="glass-panel status-section progression-panel p-3">
            <div class="mb-2 flex items-center justify-between"><h3 class="gold-text text-sm font-bold">Adventurer Growth</h3><span class="text-[9px] uppercase tracking-widest opacity-60">Persistent progression</span></div>
            <div class="growth-grid">
              <div><span>JOB LEVEL</span><b>{{ player.jobLevel }}</b><div class="growth-track"><i :style="{ width: `${Math.round(player.jobExp / player.jobExpNeeded * 100)}%` }" /></div><small>{{ player.jobExp }}/{{ player.jobExpNeeded }} Job EXP</small></div>
              <div><span>WEAPON MASTERY</span><b>{{ masteryName }} Lv.{{ player.currentWeaponMastery.level }}</b><small>เพิ่มพลังตามอาวุธที่ใช้งานจริง</small></div>
              <div><span>MONSTER CODEX</span><b>{{ player.codexDiscovered }}</b><small>สายพันธุ์ที่ค้นพบ</small></div>
              <div><span>REGION REPUTATION</span><b>{{ player.regionReputation[player.adventureRegionId] ?? 0 }}</b><small>{{ player.currentRegion.name }}</small></div>
            </div>
            <div class="current-route mt-2"><span>📍 {{ player.currentZone.name }}</span><small>{{ player.currentZone.nameTh }} · Adventure Rank {{ player.currentFloor }}</small></div>
          </div>

          <div class="glass-panel status-section p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Equipment</h3>
            <div class="space-y-1 text-xs">
              <div v-for="slot in slots" :key="slot.id" class="equipment-row flex items-center justify-between gap-2">
                <span class="uppercase tracking-wide opacity-70">{{ slot.label }}</span>
                <span :class="slot.item ? 'font-bold' : 'opacity-50'">{{ slot.item?.name ?? '— empty —' }}</span>
              </div>
            </div>
          </div>

          <div class="glass-panel status-section p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="gold-text text-sm font-bold">Equipment Sets</h3>
              <span class="text-[10px] uppercase tracking-widest opacity-60">Monster farming</span>
            </div>
            <div v-for="entry in setTargets" :key="entry.set.id" class="set-card mb-2 p-2 text-xs last:mb-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-[#f1d17c]">{{ entry.set.name }}</span>
                <span :class="entry.owned === 3 ? 'text-emerald-300' : 'opacity-75'">{{ entry.owned }}/3</span>
              </div>
              <div class="mt-1 flex gap-1">
                <span v-for="slot in setSlots" :key="slot" class="set-pip" :class="{ owned: entry.ownedSlots.includes(slot) }">{{ slot.charAt(0).toUpperCase() }}</span>
              </div>
              <p class="mt-1 opacity-70">Hunt {{ entry.set.sourceName }} · Floors {{ entry.set.minFloor }}–{{ Math.min(100, entry.set.minFloor + 9) }}</p>
              <div class="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#c7b6de]">
                <span>Set Memory</span><span>{{ entry.pity }}/{{ entry.pityTarget }}</span>
              </div>
              <div class="pity-track mt-1"><div class="pity-fill" :style="{ width: Math.min(100, entry.pity / entry.pityTarget * 100) + '%' }" /></div>
              <p class="mt-1 text-[10px] text-[#a89bbd]">Guaranteed within {{ Math.max(0, entry.pityTarget - entry.pity) }} target kills</p>
              <p class="mt-1 text-[10px]" :class="entry.equipped >= 2 ? 'text-emerald-300' : 'opacity-55'">2 pieces: {{ statText(entry.set.bonuses.two) }}</p>
              <p class="text-[10px]" :class="entry.equipped >= 3 ? 'text-emerald-300' : 'opacity-55'">3 pieces: {{ statText(entry.set.bonuses.three) }}</p>
            </div>
          </div>

          <div class="glass-panel status-section p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Inventory</h3>
            <p v-if="!bagItems.length" class="text-xs opacity-60">Your bag is empty. Visit the Item Shop in town.</p>
            <div v-for="entry in bagItems" :key="entry.id" class="inventory-row flex items-center justify-between gap-2 py-1 text-xs">
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
import { getItemById, getMaterial, itemIconPath, rarityColor, rarityOf, type EquipmentSlot, type StatBlock } from '~/data/equipment'
import { EQUIPMENT_SETS } from '~/data/equipmentSets'
import { setPityThreshold } from '~/data/loot'
import { ALLOC_DEFS, STAT_ALLOC_ENABLED, STAT_POINTS_PER_LEVEL } from '~/data/statAllocation'

const allocDefs = ALLOC_DEFS
import type { Facing } from '~/data/equipmentVisuals'
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

const masteryName = computed(() => player.currentWeaponMastery.family.replace(/^./, (letter) => letter.toUpperCase()))

const setSlots: EquipmentSlot[] = ['weapon', 'armor', 'trinket']
function statText(stats: StatBlock) {
  return Object.entries(stats).filter(([, value]) => value).map(([key, value]) => `+${value} ${key.toUpperCase()}`).join(' · ')
}
const setTargets = computed(() => {
  const currentIndex = Math.min(EQUIPMENT_SETS.length - 1, Math.floor((player.currentFloor - 1) / 10))
  const ownedIds = new Set(Object.entries(player.inventory).filter(([, qty]) => qty > 0).map(([id]) => id))
  for (const id of Object.values(player.equipment)) if (id) ownedIds.add(id)
  const ownedSetIds = new Set(EQUIPMENT_SETS.filter((set) => Object.values(set.pieces).some((id) => ownedIds.has(id))).map((set) => set.id))
  ownedSetIds.add(EQUIPMENT_SETS[currentIndex]!.id)
  return EQUIPMENT_SETS.filter((set) => ownedSetIds.has(set.id)).map((set) => {
    const ownedSlots = setSlots.filter((slot) => ownedIds.has(set.pieces[slot]))
    const equipped = setSlots.filter((slot) => player.equipment[slot] === set.pieces[slot]).length
    const pity = player.setDropPity[set.sourceMonster] ?? 0
    const pityTarget = setPityThreshold(set.sourceMonster)
    return { set, owned: ownedSlots.length, ownedSlots, equipped, pity, pityTarget }
  })
})

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

// Paper-doll preview rotates all equipment layers together.
const dirs: Facing[] = ['down', 'left', 'right', 'up']
const previewDir = ref<Facing>('down')

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
.pity-fill { width: calc(var(--pity, 0) * 100%); }
.growth-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.growth-grid > div { padding: 8px; border: 1px solid #705e3d66; border-radius: 7px; background: linear-gradient(135deg, #151a28, #090c14); }
.growth-grid span, .growth-grid b, .growth-grid small { display: block; } .growth-grid span { color: #bbaa81; font-size: 8px; letter-spacing: .08em; } .growth-grid b { margin-top: 2px; color: #f1ce76; font-size: 15px; } .growth-grid small { margin-top: 2px; color: #aab0bd; font-size: 9px; }
.growth-track { height: 4px; margin-top: 5px; overflow: hidden; border-radius: 999px; background: #02040a; } .growth-track i { display: block; height: 100%; background: linear-gradient(90deg, #6a87cc, #d0ad64); }
.current-route { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 9px; border-left: 2px solid #caa759; background: #090b13aa; font-size: 10px; } .current-route small { opacity: .65; }
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
.set-pip { display: inline-grid; place-items: center; width: 20px; height: 20px; border: 1px solid #5f523c; border-radius: 4px; color: #726956; background: #090806; font-size: 9px; font-weight: 900; }
.set-pip.owned { border-color: #caa759; color: #ffe6a0; background: #2b2110; box-shadow: 0 0 8px rgba(202,167,89,.2); }
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
.direction-picker { display: flex; justify-content: center; gap: 3px; }
.direction-picker button { padding: 3px 6px; border: 1px solid #615133; border-radius: 4px; color: #92866f; font-size: 9px; font-weight: 800; text-transform: uppercase; }
.direction-picker button.active { border-color: #d1aa58; background: #2d2112; color: #f1d17c; box-shadow: inset 0 0 8px rgba(209,170,88,.15); }

.status-titlebar { overflow: hidden; }
.status-class-seal {
  margin-left: auto; margin-right: .6rem; padding: .22rem .65rem; border: 1px solid rgb(210 181 111 / 42%);
  border-radius: 999px; color: #ead79e; background: linear-gradient(180deg, rgb(74 57 103 / 72%), rgb(28 24 48 / 88%));
  box-shadow: inset 0 1px rgb(255 255 255 / 9%), 0 0 12px rgb(135 95 210 / 15%);
  font-family: Cinzel, Georgia, serif; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
}
.status-hero-panel {
  position: relative; overflow: hidden; height: max-content; align-self: start;
  background: radial-gradient(circle at 50% 28%, rgb(109 81 179 / 25%), transparent 45%), linear-gradient(180deg, rgb(29 29 57 / 96%), rgb(10 12 26 / 98%)) !important;
}
.status-hero-panel::before {
  content: ''; position: absolute; inset: 7px; pointer-events: none; border: 1px solid rgb(235 205 132 / 8%); border-radius: 8px 3px 8px 3px;
}
.status-section { position: relative; overflow: hidden; }
.status-section::after { content: ''; position: absolute; top: 0; left: 12px; right: 42%; height: 1px; background: linear-gradient(90deg, transparent, rgb(236 207 135 / 38%), transparent); }
.equipment-row, .inventory-row { min-height: 31px; padding: .25rem .45rem; border: 1px solid rgb(150 125 190 / 18%); border-radius: 6px 2px 6px 2px; background: rgb(4 6 16 / 28%); }
.set-card { position: relative; overflow: hidden; border: 1px solid rgb(158 127 201 / 32%); border-radius: 8px 3px 8px 3px; background: linear-gradient(135deg, rgb(39 31 64 / 58%), rgb(5 7 16 / 48%)); box-shadow: inset 3px 0 rgb(209 175 93 / 28%); }
.pity-track { height: 7px; overflow: hidden; border: 1px solid rgb(191 159 223 / 22%); border-radius: 999px; background: rgb(2 3 9 / 72%); box-shadow: inset 0 1px 3px #000; }
.pity-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #5b3e9f, #a978e5 60%, #f4d57e); box-shadow: 0 0 9px rgb(170 111 239 / 45%); transition: width .25s ease; }
@media (max-width: 460px) { .status-class-seal { display: none; } }

</style>
