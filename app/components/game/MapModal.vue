<template>
  <div v-if="open" class="modal-backdrop atlas-backdrop">
    <div class="pixel-window anime-window atlas-window w-full max-w-4xl">
      <div class="pixel-titlebar atlas-titlebar">
        <div>
          <p class="atlas-kicker">ADVENTURE ATLAS</p>
          <h2 class="gold-text text-xl font-bold">Spiral Realms</h2>
        </div>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>

      <div class="pixel-window-body atlas-body p-4">
        <section class="atlas-hero" :style="{ '--region-accent': currentRegion.accent }">
          <div class="atlas-hero-icon">{{ currentRegion.icon }}</div>
          <div class="min-w-0 flex-1">
            <p class="atlas-kicker">CURRENT ADVENTURE · REGION {{ currentRegion.index }}</p>
            <span v-if="player.world1Completed && currentRegion.id === 'verdant-frontier'" class="zone-state">WORLD 1 CLEAR</span>
            <h3 class="text-lg font-bold">{{ currentRegion.name }} <span class="opacity-65">· {{ currentRegion.nameTh }}</span></h3>
            <p class="mt-1 text-xs opacity-80">{{ currentRegion.description }}</p>
            <div class="atlas-route mt-3">
              <span>🏰 {{ currentRegion.town }}</span><i>›</i><span>🗺️ {{ currentRegion.field }}</span><i>›</i><span>🗝️ {{ currentRegion.dungeon }}</span><i>›</i><span>👑 {{ currentRegion.guardian }}</span>
            </div>
          </div>
          <div class="atlas-rank">
            <span>Adventure Rank</span>
            <strong>{{ player.adventureRank }}</strong>
          </div>
        </section>

        <section class="zone-deck mt-4">
          <div class="mb-2 flex items-end justify-between gap-3">
            <div><p class="atlas-kicker">REGION ROUTE</p><h3 class="font-bold">เลือกจุดหมายและเป้าหมายการล่า</h3></div>
            <span class="text-[10px] opacity-60">เมือง → 3 สนามล่า → ดันเจียน → บอส</span>
          </div>
          <div class="zone-grid">
            <button v-for="zone in regionZones" :key="zone.id" class="zone-card"
              :class="[zone.kind, { active: zone.id === player.currentZoneId, locked: !isZoneUnlocked(zone) }]"
              :disabled="!isZoneUnlocked(zone)" @click="travelZone(zone)">
              <span class="zone-kind">{{ zoneIcon(zone.kind) }}</span>
              <span class="min-w-0 flex-1 text-left"><b>{{ zone.name }}</b><small>{{ zone.nameTh }} · Rank {{ zone.rank }}</small><em>{{ zone.landmark }}</em></span>
              <span v-if="zone.id === player.currentZoneId" class="zone-state">HERE</span>
              <span v-else-if="isZoneUnlocked(zone)" class="zone-state">GO ›</span>
              <span v-else class="zone-state">🔒</span>
            </button>
          </div>
          <div v-if="selectedZone" class="zone-detail">
            <div><strong>{{ selectedZone.name }}</strong><span>{{ selectedZone.description }}</span></div>
            <div v-if="selectedZone.monsterIds.length" class="zone-monsters"><span v-for="monster in selectedZone.monsterIds" :key="monster">{{ monsterLabel(monster) }}</span></div>
          </div>
        </section>

        <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <section>
            <div class="mb-2 flex items-end justify-between">
              <div><p class="atlas-kicker">WORLD ROUTE</p><h3 class="font-bold">เลือกภูมิภาคเพื่อออกสำรวจ</h3></div>
              <span class="text-[10px] opacity-55">เมือง → สนามล่า → ดันเจียน → บอส</span>
            </div>
            <div class="region-grid">
              <button
                v-for="region in ADVENTURE_REGIONS" :key="region.id"
                class="region-card" :class="{ current: region.id === currentRegion.id, locked: !isUnlocked(region) }"
                :disabled="!isUnlocked(region)" :style="{ '--region-accent': region.accent }"
                @click="travelRegion(region)"
              >
                <span class="region-icon">{{ isUnlocked(region) ? region.icon : '🔒' }}</span>
                <span class="min-w-0 text-left">
                  <b>{{ region.name }}</b>
                  <small>{{ region.nameTh }} · Rank {{ region.floorFrom }}–{{ region.floorTo }}</small>
                </span>
                <span v-if="region.id === currentRegion.id" class="region-here">HERE</span>
                <span v-else-if="isUnlocked(region)" class="region-go">GO ›</span>
              </button>
            </div>
          </section>

          <aside class="spire-card">
            <div class="spire-sigil">♜</div>
            <p class="atlas-kicker">RANKED CHALLENGE</p>
            <h3 class="gold-text text-lg font-bold">{{ RANKED_TOWER.name }}</h3>
            <p class="text-xs opacity-75">{{ RANKED_TOWER.description }}</p>
            <div class="spire-stats">
              <div><span>Rating</span><b>{{ player.rankedTowerRating }}</b></div>
              <div><span>Best Floor</span><b>{{ player.rankedTowerBest || '—' }}</b></div>
              <div><span>Runs</span><b>{{ player.rankedTowerRuns }}</b></div>
            </div>
            <p class="my-3 text-[10px] text-amber-200/80">{{ RANKED_TOWER.season }} · การไต่แรงค์ไม่กีดขวางเนื้อเรื่อง</p>
            <button class="btn-primary w-full" @click="enterRankedTower">เข้าสู่ Ranked Spire</button>
            <button class="btn-secondary mt-2 w-full" @click="returnToTown">กลับเมือง {{ currentRegion.town }}</button>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ADVENTURE_REGIONS, RANKED_TOWER, regionForFloor, regionUnlocked,
  type AdventureRegion,
} from '~/data/adventureRegions'
import { getAdventureRegion } from '~/data/adventureRegions'
import { zonesForRegion, zoneUnlocked, type AdventureZone, type AdventureZoneKind } from '~/data/adventureZones'
import type { WorldTravelPayload } from '~/game/systems/eventBus'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'travel', payload: WorldTravelPayload): void }>()
const player = usePlayerStore()
const currentRegion = computed(() => getAdventureRegion(player.adventureRegionId) ?? regionForFloor(player.currentFloor))
const regionZones = computed(() => zonesForRegion(currentRegion.value.id))
const hoveredZoneId = ref('')
const selectedZone = computed(() => regionZones.value.find((zone) => zone.id === hoveredZoneId.value) ?? regionZones.value.find((zone) => zone.id === player.currentZoneId) ?? regionZones.value[0])

function isUnlocked(region: AdventureRegion) { return regionUnlocked(region, player.adventureRank) }
function isZoneUnlocked(zone: AdventureZone) { return zoneUnlocked(zone, player.adventureRank) }
function zoneIcon(kind: AdventureZoneKind) { return ({ town: '🏰', field: '🗺️', dungeon: '🗝️', boss: '👑' } as const)[kind] }
function monsterLabel(id: string) { return id.split('_').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ') }
function travelZone(zone: AdventureZone) {
  hoveredZoneId.value = zone.id
  const mode = zone.kind === 'town' ? 'town' : zone.kind === 'dungeon' ? 'dungeon' : zone.kind === 'boss' ? 'boss' : 'adventure'
  emit('travel', { mode, floor: zone.rank, regionId: zone.regionId, zoneId: zone.id })
}
function travelRegion(region: AdventureRegion) {
  const destination = zonesForRegion(region.id)
    .filter((zone) => zone.kind === 'field' && zoneUnlocked(zone, player.adventureRank))
    .sort((a, b) => b.rank - a.rank)[0]
  if (!destination) return
  emit('travel', { mode: 'adventure', floor: destination.rank, regionId: region.id, zoneId: destination.id })
}
function enterRankedTower() {
  const floor = Math.max(1, Math.min(100, player.rankedTowerBest + 1))
  emit('travel', { mode: 'ranked-tower', floor })
}
function returnToTown() {
  const town = zonesForRegion(currentRegion.value.id).find((zone) => zone.kind === 'town')
  emit('travel', { mode: 'town', floor: currentRegion.value.floorFrom, regionId: currentRegion.value.id, zoneId: town?.id })
}
</script>

<style scoped>
.atlas-backdrop { padding: 12px; background: radial-gradient(circle at 50% 10%, rgba(52, 79, 105, .36), rgba(5, 7, 14, .88)); }
.atlas-window { max-height: min(92vh, 820px); overflow: hidden; box-shadow: 0 24px 80px #000c, 0 0 0 1px #e8c87c44; }
.atlas-titlebar { padding: 12px 16px; background: linear-gradient(90deg, #171d33, #31203b 58%, #171d33); }
.atlas-body { max-height: calc(92vh - 76px); overflow: auto; background: radial-gradient(circle at 12% 2%, #2c385340, transparent 34%), linear-gradient(#121728f2, #090c18f5); }
.atlas-kicker { color: #d7b66c; font-size: 9px; font-weight: 900; letter-spacing: .18em; }
.atlas-hero { --region-accent: #78d58b; display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid color-mix(in srgb, var(--region-accent) 48%, #755f3a); border-radius: 10px; background: linear-gradient(115deg, color-mix(in srgb, var(--region-accent) 15%, #14182a), #111526 62%); box-shadow: inset 0 0 30px #0005; }
.atlas-hero-icon { display: grid; width: 58px; height: 58px; flex: 0 0 auto; place-items: center; border: 1px solid var(--region-accent); border-radius: 50%; background: #080b16aa; font-size: 28px; box-shadow: 0 0 22px color-mix(in srgb, var(--region-accent) 35%, transparent); }
.atlas-route { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: #e5d7b6; font-size: 10px; }
.atlas-route i { color: var(--region-accent); font-style: normal; }
.atlas-rank { display: flex; min-width: 88px; flex-direction: column; align-items: center; border-left: 1px solid #ffffff1c; color: #d9c99f; font-size: 9px; }
.atlas-rank strong { color: var(--region-accent); font-family: Georgia, serif; font-size: 28px; }
.region-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.region-card { --region-accent: #78d58b; display: flex; min-height: 56px; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid #856e454f; border-radius: 7px; background: linear-gradient(110deg, #171c2d, #0d1120); color: #eee4ce; transition: .18s ease; }
.region-card:hover:not(:disabled), .region-card.current { border-color: var(--region-accent); transform: translateY(-1px); box-shadow: 0 5px 16px #0007, inset 3px 0 var(--region-accent); }
.region-card.locked { cursor: not-allowed; filter: grayscale(.8); opacity: .4; }
.region-icon { display: grid; width: 32px; height: 32px; flex: 0 0 auto; place-items: center; border-radius: 6px; background: #ffffff0a; font-size: 18px; }
.region-card b, .region-card small { display: block; }
.region-card b { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.region-card small { margin-top: 2px; color: #aeb4c6; font-size: 9px; }
.region-here, .region-go { margin-left: auto; color: var(--region-accent); font-size: 8px; font-weight: 900; letter-spacing: .08em; }
.zone-deck { padding: 12px; border: 1px solid #7e693f66; border-radius: 10px; background: linear-gradient(160deg, #171c2dba, #0a0d18d9); }
.zone-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
.zone-card { display: flex; min-height: 62px; align-items: center; gap: 8px; padding: 8px; border: 1px solid #65583e80; border-radius: 8px; background: linear-gradient(125deg, #161b2a, #0c101c); color: #eee4ce; transition: .16s ease; }
.zone-card:hover:not(:disabled), .zone-card.active { border-color: #d4b467; transform: translateY(-1px); box-shadow: 0 6px 18px #0008, inset 0 -2px #d4b46755; }
.zone-card.dungeon { background: linear-gradient(125deg, #231c32, #0d101c); }
.zone-card.boss { background: linear-gradient(125deg, #35201e, #11101a); }
.zone-card.locked { cursor: not-allowed; filter: grayscale(.8); opacity: .38; }
.zone-kind { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #ffffff0a; font-size: 16px; }
.zone-card b, .zone-card small, .zone-card em { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zone-card b { font-size: 10px; } .zone-card small { color: #aeb4c6; font-size: 8px; } .zone-card em { margin-top: 3px; color: #cdb77e; font-size: 8px; font-style: normal; }
.zone-state { color: #e2c476; font-size: 8px; font-weight: 900; }
.zone-detail { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 9px; padding: 8px 10px; border-left: 2px solid #d4b467; background: #05081266; font-size: 10px; }
.zone-detail strong, .zone-detail span { display: block; } .zone-detail span { margin-top: 2px; opacity: .72; }
.zone-monsters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; } .zone-monsters span { padding: 2px 6px; border: 1px solid #7e693f66; border-radius: 999px; color: #cfdae8; font-size: 8px; opacity: 1; }
.spire-card { position: relative; overflow: hidden; padding: 16px; border: 1px solid #b68a4f88; border-radius: 10px; background: radial-gradient(circle at 75% 0, #7e5d9b35, transparent 35%), linear-gradient(160deg, #24203a, #111426 64%); box-shadow: inset 0 0 40px #0007; }
.spire-sigil { position: absolute; top: -16px; right: 8px; color: #e9ca8050; font-size: 92px; line-height: 1; }
.spire-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 18px; }
.spire-stats div { padding: 7px 4px; border: 1px solid #ffffff12; border-radius: 6px; background: #05081266; text-align: center; }
.spire-stats span, .spire-stats b { display: block; }
.spire-stats span { color: #aeb4c6; font-size: 8px; }
.spire-stats b { margin-top: 2px; color: #f0ce7a; font-size: 15px; }
@media (max-width: 700px) { .zone-grid { grid-template-columns: 1fr 1fr; } .zone-detail { align-items: flex-start; flex-direction: column; } .zone-monsters { justify-content: flex-start; } .atlas-hero { align-items: flex-start; } .atlas-hero-icon { width: 44px; height: 44px; font-size: 21px; } .atlas-rank { display: none; } .atlas-route { display: none; } .region-grid { grid-template-columns: 1fr; } }
</style>
