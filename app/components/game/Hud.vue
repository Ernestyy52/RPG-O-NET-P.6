<template>
  <div class="ornate-hud mb-3 max-[560px]:mb-2">
    <!-- แถวบน: แผงตัวละคร (ซ้าย) / แถบชื่อเกม (กลาง) / แผงระบบ (ขวา) — จัดวางตามภาพ mockup -->
    <div class="hud-top">
      <section class="glass-panel char-panel">
        <div class="char-head">
          <GameGearPaperdoll compact />
          <div class="char-id">
            <div class="char-name gold-text">{{ player.displayName }}</div>
            <div class="char-sub">Lv. {{ player.level }} · {{ player.heroClass.name }}</div>
          </div>
        </div>
        <div class="char-bars">
          <GameStatBar variant="hp" label="HP" :value="player.hp" :max="player.maxHp" />
          <GameStatBar variant="mp" label="MP" :value="player.mp" :max="player.maxMp" />
          <GameStatBar variant="exp" label="EXP" :value="player.exp" :max="player.expNeeded" />
        </div>
        <div class="char-stats">
          <div class="char-stat"><span class="char-stat-key"><b>V</b> ATK</span><span class="char-stat-val">{{ player.atk }}</span></div>
          <div class="char-stat"><span class="char-stat-key"><b>A</b> DEF</span><span class="char-stat-val">{{ player.def }}</span></div>
          <div class="char-stat"><span class="char-stat-key"><b>S</b> SPD</span><span class="char-stat-val">{{ player.speed }}</span></div>
        </div>
      </section>

      <section class="hud-banner">
        <p class="ornate-kicker banner-kicker">{{ GAME_TAGLINE }}</p>
        <h1 class="ornate-title banner-title">{{ GAME_TITLE_EN }}</h1>
        <div class="banner-rule">
          <span class="ornate-rule" />
          <span class="banner-diamond">❖</span>
          <span class="banner-th">{{ GAME_TITLE_TH }}</span>
          <span class="banner-diamond">❖</span>
          <span class="ornate-rule" />
        </div>
        <div class="banner-strip">
          <span class="strip-item">{{ player.heroClass.name }} Lv. {{ player.level }}</span>
          <span class="strip-sep" />
          <span class="strip-item">HP {{ player.hp }}/{{ player.maxHp }}</span>
          <span class="strip-sep" />
          <span class="strip-item">MP {{ player.mp }}/{{ player.maxMp }}</span>
          <span class="strip-sep" />
          <span class="strip-item">EXP {{ player.exp }}/{{ player.expNeeded }}</span>
          <span class="strip-sep" />
          <span class="strip-item gold-text">Gold {{ player.gold }}</span>
          <span class="strip-sep" />
          <span class="strip-item">Floor {{ player.currentFloor }}</span>
          <span class="strip-sep" />
          <span class="strip-item"><span class="strip-dot" :class="phaseDotClass" />{{ world.phase }}</span>
          <span class="strip-sep" />
          <span class="strip-item">{{ weatherLabel }}</span>
        </div>
      </section>

      <section class="glass-panel sys-panel">
        <div class="sys-icons">
          <button class="icon-btn" title="Settings" aria-label="Settings" @click="$emit('open-system', 'settings')"><img :src="assetUrl('skill-icons/ward.png')" alt=""></button>
          <button class="icon-btn" title="Leaderboard" aria-label="Leaderboard" @click="$emit('open-system', 'leaderboard')"><img :src="assetUrl('skill-icons/swords.png')" alt=""></button>
          <button class="icon-btn" title="How to Play" aria-label="How to Play" @click="$emit('open-system', 'guide')"><img :src="assetUrl('skill-icons/book.png')" alt=""></button>
          <button class="icon-btn" title="News" aria-label="News" @click="$emit('open-system', 'news')"><img :src="assetUrl('skill-icons/scroll.png')" alt=""></button>
        </div>
        <div class="sys-title">Character</div>
        <div class="sys-line">Base: {{ player.gender }} / {{ player.heroClass.name }}</div>
        <div class="sys-line">Equipped: {{ equippedSummary }}</div>
        <div class="sys-actions">
          <button class="btn-secondary btn-sm" @click="$emit('recreate')">Recreate Character</button>
          <button class="btn-secondary btn-sm" @click="$emit('reset-save')">Reset Save</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GAME_TAGLINE, GAME_TITLE_EN, GAME_TITLE_TH } from '~/data/branding'
import { getWorldState } from '~/data/world'
import { getItemById } from '~/data/equipment'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ avatar: string }>()
const config = useRuntimeConfig()
void props
defineEmits<{
  (e: 'recreate'): void
  (e: 'reset-save'): void
  (e: 'open-system', tab: 'settings' | 'leaderboard' | 'guide' | 'news'): void
}>()

const player = usePlayerStore()
const world = computed(() => getWorldState())
const weatherLabel = computed(() => world.value.weather.charAt(0).toUpperCase() + world.value.weather.slice(1))
const phaseDotClass = computed(() => `strip-dot-${world.value.phase.toLowerCase()}`)
const equippedSummary = computed(() => {
  const names = Object.values(player.equipment)
    .filter((id): id is string => !!id)
    .map((id) => getItemById(id)?.name)
    .filter(Boolean)
  return names.length ? names.join(', ') : 'starter gear'
})

function assetUrl(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '') }`
}

function onImgError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }
</script>

<style scoped>
.hud-top {
  display: grid;
  grid-template-columns: minmax(210px, 250px) 1fr minmax(190px, 240px);
  gap: 10px;
  align-items: stretch;
}

/* --- แผงตัวละคร ซ้ายบน --- */
.char-panel {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.char-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.char-avatar-frame {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid #a8823f;
  background: radial-gradient(circle at 50% 35%, rgba(255, 216, 121, 0.2), transparent 60%), #0d0a06;
  box-shadow: 0 0 0 1px #050302, inset 0 0 10px rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center;
}
.char-avatar {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.char-avatar-frame { position: relative; }
/* ไอคอนอาวุธที่ถืออยู่ โผล่มุมขวาล่างของกรอบรูป — เปลี่ยนตามอาวุธที่สวม */
.char-weapon {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: #0d0a06;
  box-shadow: 0 0 0 1px #050302;
  object-fit: contain;
}
.char-id { min-width: 0; line-height: 1.3; }
.char-name {
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char-sub {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #cdb27a;
}
.char-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.char-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
.char-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 2px;
  border-radius: 5px;
  border: 1px solid rgba(138, 106, 47, 0.55);
  background: rgba(0, 0, 0, 0.32);
}
.char-stat-key { font-size: 9px; color: #cdb27a; letter-spacing: 0.04em; }
.char-stat-key b { display: inline-grid; place-items: center; width: 14px; height: 14px; margin-right: 2px; border: 1px solid #8a6a2f; border-radius: 50%; color: #f2c14e; font-family: Cinzel, serif; font-size: 7px; }
.char-stat-val { font-size: 13px; font-weight: 800; color: #f2c14e; text-shadow: 0 1px 0 #5c3a10; }

/* --- แถบชื่อเกม กลางบน --- */
.hud-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-align: center;
  min-width: 0;
  padding: 4px 6px;
}
.banner-kicker { font-size: 9px; }
.banner-title {
  font-size: clamp(13px, 2vw, 22px);
  font-weight: 800;
  line-height: 1.15;
  max-width: 100%;
}
.banner-rule {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 440px;
}
.banner-rule .ornate-rule { flex: 1; }
.banner-diamond { color: #b58a3a; font-size: 9px; }
.banner-th { font-size: 12px; color: #ecca74; white-space: nowrap; }

/* แถบสถานะรวมใต้ชื่อเกม (HP/EXP/Gold/Floor/Night/Storm) */
.banner-strip {
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 10px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(138, 106, 47, 0.55);
  background: rgba(5, 3, 2, 0.55);
  box-shadow: inset 0 0 0 1px rgba(255, 216, 132, 0.08);
}
.strip-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #f0e2bd;
  white-space: nowrap;
}
.strip-sep {
  width: 1px;
  height: 12px;
  background: rgba(205, 178, 122, 0.35);
}
.strip-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #f2c14e;
  box-shadow: 0 0 5px currentColor;
}
.strip-dot-day { background: #ffd977; }
.strip-dot-dawn { background: #ff9d6c; }
.strip-dot-dusk { background: #b06bd9; }
.strip-dot-night { background: #6f8cff; }

/* --- แผงระบบ ขวาบน --- */
.sys-panel {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sys-icons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 4px;
}
.sys-icons img { width: 18px; height: 18px; object-fit: contain; }
.sys-title {
  font-size: 12px;
  font-weight: 800;
  color: #f2c14e;
  text-shadow: 0 1px 0 #5c3a10;
  letter-spacing: 0.04em;
}
.sys-line {
  font-size: 10px;
  color: #cdb27a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sys-actions {
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pixelated { image-rendering: pixelated; }

@media (max-width: 860px) {
  .hud-top { grid-template-columns: 1fr 1fr; }
  .hud-banner { grid-column: 1 / -1; order: -1; }
}
/* มือถือแนวตั้ง (MAP_SCALE_DECISION S0 ปัญหา #1): HUD ต้องเหลือแถบบางๆ — จอส่วนใหญ่เป็นของ canvas
   ชื่อเกมเต็มมีบนหน้า title อยู่แล้ว; ATK/DEF/SPD ดูได้ใน Status modal (ปุ่ม Status ยังอยู่);
   ปุ่มทุกปุ่ม (ไอคอนระบบ + Recreate/Reset) ยังมองเห็น-กดได้ — ห้ามมี hidden interaction */
@media (max-width: 560px) {
  .hud-top { grid-template-columns: 1fr; gap: 6px; }
  .hud-banner { display: none; }
  .char-panel { flex-direction: row; align-items: center; gap: 8px; padding: 6px 8px; }
  .char-head { flex-shrink: 0; gap: 8px; }
  .char-avatar-frame { width: 40px; height: 40px; }
  .char-avatar { width: 34px; height: 34px; }
  .char-weapon { width: 18px; height: 18px; }
  .char-bars { flex: 1; min-width: 0; gap: 2px; }
  .char-stats { display: none; }
  .sys-panel { flex-direction: row; align-items: center; gap: 8px; padding: 6px 8px; }
  .sys-icons { margin-bottom: 0; }
  .sys-title, .sys-line { display: none; }
  .sys-actions { margin-top: 0; margin-left: auto; padding-top: 0; }
}
</style>
