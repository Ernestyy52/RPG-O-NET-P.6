<template>
  <div class="dnd-bg min-h-screen">
    <section v-if="!player.isAuthenticated" class="title-screen" :class="{ 'reduce-title-motion': settings.reducedMotion }">
      <img :src="titleImage" class="title-art" alt="SPIRAL'S ECHO title art" @error="onImageError">
      <div class="title-vignette" />
      <div class="aurora-sweep" />
      <div class="star-field star-field-a" />
      <div class="star-field star-field-b" />
      <div class="crystal-glow crystal-glow-left" />
      <div class="crystal-glow crystal-glow-right" />

      <div class="title-menu pixel-window">
        <div class="px-5 pb-2 pt-5 text-center">
          <p class="text-xs uppercase tracking-[0.28em] text-cyan-100/80">{{ GAME_NAME_EN }}</p>
          <h1 class="gold-text mt-1 text-2xl font-bold sm:text-3xl">{{ GAME_TITLE_EN }}</h1>
          <p class="mt-1 text-base font-bold text-[#f5c66b]">{{ GAME_TITLE_TH }}</p>
          <p class="mt-1 text-sm text-[#f7e7c5]/80">O-NET English RPG Adventure</p>
        </div>
        <form class="pixel-window-body space-y-3 p-4 pt-2" @submit.prevent="submitLogin">
          <input v-model="loginName" class="field" type="text" autocomplete="username" placeholder="Username">
          <input v-model="loginPassword" class="field" type="password" autocomplete="current-password" placeholder="Password">
          <button class="btn-primary w-full" type="submit">Login</button>
          <button class="btn-secondary w-full" type="button" @click="submitRegister">Register</button>
          <button class="btn-secondary w-full text-xs" type="button" :disabled="!player.characterCreated" @click="continueGame">Continue</button>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn-secondary text-xs" type="button" @click="playGuest">Guest</button>
            <button class="btn-secondary text-xs" type="button" @click="toggleTitlePanel('how')">How to Play</button>
            <button class="btn-secondary text-xs" type="button" @click="toggleTitlePanel('settings')">Settings</button>
            <button class="btn-secondary text-xs" type="button" @click="toggleTitlePanel('news')">News</button>
          </div>
          <button class="btn-secondary w-full text-xs" type="button" @click="toggleTitlePanel('credits')">Credits</button>

          <div v-if="activeTitlePanel" class="title-info glass-panel p-3 text-xs leading-relaxed text-[#f7e7c5]/85">
            <div v-if="activeTitlePanel === 'how'">
              <h3 class="mb-1 font-bold text-[#f5c66b]">How to Play</h3>
              <p>Answer English questions to attack, clear monsters, defeat bosses, then build your character with classes, gear, and skills.</p>
            </div>
            <div v-else-if="activeTitlePanel === 'settings'" class="space-y-3">
              <h3 class="font-bold text-[#f5c66b]">Settings</h3>
              <label class="flex items-center justify-between gap-3">Sound <input v-model="settings.sound" type="checkbox" class="title-toggle"></label>
              <label class="flex items-center justify-between gap-3">Reduce animation <input v-model="settings.reducedMotion" type="checkbox" class="title-toggle"></label>
              <label>Language
                <select v-model="settings.language" class="field mt-1 py-1 text-xs">
                  <option value="en">English</option>
                  <option value="th">Thai</option>
                </select>
              </label>
              <button class="btn-secondary w-full text-xs" type="button" @click="resetGameData">Reset this game data</button>
            </div>
            <div v-else-if="activeTitlePanel === 'news'">
              <h3 class="mb-1 font-bold text-[#f5c66b]">News / Update</h3>
              <p>SPIRAL'S ECHO: THE FLOATING REALMS now has a new animated title screen, character creation, class sprites, and GitHub Pages support.</p>
            </div>
            <div v-else>
              <h3 class="mb-1 font-bold text-[#f5c66b]">Credits</h3>
              <p>Title artwork provided by the user. Game concept, UI, and code by the project team. Character and environment assets are organized from the local asset index.</p>
            </div>
          </div>
        </form>
      </div>
    </section>

    <div v-else class="mx-auto max-w-4xl p-4">
      <header v-if="!player.characterCreated" class="mb-3 text-center">
        <p class="ornate-kicker text-[10px]">{{ GAME_TAGLINE }}</p>
        <h1 class="ornate-title text-xl font-bold leading-snug sm:text-2xl">{{ GAME_TITLE_EN }}</h1>
        <p class="text-sm text-[#ecca74]">❖ {{ GAME_TITLE_TH }} ❖</p>
      </header>

      <section v-if="!player.characterCreated" class="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div class="pixel-window overflow-hidden">
          <div class="pixel-titlebar">
            <h2 class="gold-text text-lg font-bold">Character Preview</h2>
            <span class="text-xs">{{ draft.gender }}</span>
          </div>
          <div class="pixel-window-body p-4">
            <div class="preview-stage mx-auto flex items-center justify-center">
              <img :src="assetPath(classIcon(draft.classId, draft.gender))" class="max-h-full pixelated object-contain" alt="character preview" @error="onImageError">
            </div>
            <div class="mt-3 text-center">
              <div class="font-bold">{{ draft.name || 'Unnamed Hero' }}</div>
              <div class="text-sm opacity-75">{{ selectedClass.name }} - {{ selectedClass.role }}</div>
            </div>
          </div>
        </div>

        <form class="pixel-window overflow-hidden" @submit.prevent="finishCharacter">
          <div class="pixel-titlebar">
            <h2 class="gold-text text-lg font-bold">Create Character</h2>
            <button class="btn-secondary px-3 py-1 text-xs" type="button" @click="player.logout()">Logout</button>
          </div>
          <div class="pixel-window-body space-y-4 p-4">
            <input v-model="draft.name" class="field" type="text" maxlength="18" placeholder="Character name">
            <div>
              <div class="mb-2 text-sm font-bold">Gender</div>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" class="btn-secondary" :class="active(draft.gender === 'male')" @click="draft.gender = 'male'">Male</button>
                <button type="button" class="btn-secondary" :class="active(draft.gender === 'female')" @click="draft.gender = 'female'">Female</button>
              </div>
            </div>
            <div>
              <div class="mb-2 text-sm font-bold">Face</div>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="face in faces" :key="face.id" type="button" class="btn-secondary text-xs" :class="active(draft.face === face.id)" @click="draft.face = face.id">{{ face.label }}</button>
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="text-sm font-bold">Hair
                <select v-model="draft.hair" class="field mt-2"><option value="short">Short</option><option value="curly">Curly</option><option value="long">Long</option></select>
              </label>
              <label class="text-sm font-bold">Color
                <select v-model="draft.color" class="field mt-2"><option value="amber">Amber</option><option value="teal">Teal</option><option value="crimson">Crimson</option></select>
              </label>
            </div>
            <div>
              <div class="mb-2 text-sm font-bold">Class</div>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button v-for="heroClass in classes" :key="heroClass.id" type="button" class="btn-secondary text-xs" :class="active(draft.classId === heroClass.id)" @click="draft.classId = heroClass.id">
                  <img :src="assetPath(classIcon(heroClass.id, draft.gender))" class="mx-auto mb-1 h-12 object-contain pixelated" alt="">
                  {{ heroClass.name }}
                </button>
              </div>
            </div>
            <button class="btn-primary w-full" type="submit">Enter Game</button>
          </div>
        </form>
      </section>

      <section v-else>
        <GameHud
          :avatar="assetPath(classIcon(player.classId, player.gender))"
          @recreate="player.resetCharacter()"
          @reset-save="resetGameData"
          @open-system="openSystem"
        />
        <div class="pixel-window overflow-hidden"><ClientOnly><GameCanvas /></ClientOnly></div>
        <p v-if="notice" class="glass-panel gold-text mt-2 p-2 text-center text-xs">{{ notice }}</p>

        <!-- แถบเมนูล่าง (Status/Inventory/Quests/Skills/Map/Log + Town) + แผง Gold/Gems/Floor ตามภาพ mockup -->
        <div class="mt-3 flex flex-wrap items-stretch gap-2">
          <button class="nav-btn" @click="statusOpen = true"><span class="nav-ico">👤</span>Status</button>
          <button class="nav-btn" @click="statusOpen = true"><span class="nav-ico">🎒</span>Inventory</button>
          <button class="nav-btn" @click="questsOpen = true">
            <span class="nav-ico">📜</span>Quests
            <span v-if="questReady" class="nav-btn-badge">!</span>
          </button>
          <button class="nav-btn" @click="skillsOpen = true">
            <span class="nav-ico">✨</span>Skills
            <span v-if="player.skillPoints" class="nav-btn-badge">{{ player.skillPoints }}</span>
          </button>
          <button class="nav-btn" @click="mapOpen = true"><span class="nav-ico">🗺</span>Map</button>
          <button class="nav-btn" @click="logOpen = true"><span class="nav-ico">📖</span>Log</button>
          <button class="nav-btn" @click="townOpen = true"><span class="nav-ico">🏰</span>Town</button>
          <div class="flex-1" />
          <div class="currency-panel">
            <span class="currency-ico">🪙</span>
            <div class="text-left leading-tight">
              <div class="currency-label">Gold</div>
              <div class="currency-value">{{ player.gold }}</div>
            </div>
          </div>
          <div class="currency-panel">
            <span class="currency-ico">💎</span>
            <div class="text-left leading-tight">
              <div class="currency-label">Gems</div>
              <div class="currency-value">{{ player.gems }}</div>
            </div>
          </div>
          <div class="currency-panel">
            <span class="currency-ico">🪜</span>
            <div class="text-left leading-tight">
              <div class="currency-label">Floor</div>
              <div class="currency-value">{{ player.currentFloor }}F</div>
            </div>
          </div>
        </div>

        <GameBattleModal />
        <GameStatusModal :open="statusOpen" :avatar="assetPath(classIcon(player.classId, player.gender))" @close="statusOpen = false" />
        <GameQuestModal :open="questsOpen" @close="questsOpen = false" />
        <GameMapModal :open="mapOpen" @close="mapOpen = false" />
        <GameLogModal :open="logOpen" @close="logOpen = false" />
        <GameSystemModal :open="systemOpen" :initial-tab="systemTab" @close="systemOpen = false" />
        <GameShopModal :open="itemShopOpen" kind-filter="consumable" @close="itemShopOpen = false" />
        <GameShopModal :open="equipShopOpen" kind-filter="equipment" @close="equipShopOpen = false" />
        <GameSkillTreeModal :open="skillsOpen" @close="skillsOpen = false" />
        <GameTownModal :open="townOpen" @close="townOpen = false" @shop="townOpen = false; itemShopOpen = true" @guild="townOpen = false; skillsOpen = true" />
        <GamePortalModal :open="portalOpen" :floor="portalFloor" @close="portalOpen = false" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { GAME_NAME_EN, GAME_TAGLINE, GAME_TITLE_EN, GAME_TITLE_TH } from '~/data/branding'
import { HERO_CLASSES, type HeroClassId } from '~/data/classes'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore, type GenderId } from '~/stores/player'
import { useSettingsStore } from '~/stores/settings'
import { getBossRequirement, describeMissingRequirements } from '~/data/bossRequirements'
import { useSheetsSync } from '~/composables/useSheetsSync'

useHead({ title: `${GAME_TITLE_EN} · ${GAME_TITLE_TH}` })

const statusOpen = ref(false)
const questsOpen = ref(false)
const mapOpen = ref(false)
const logOpen = ref(false)
const systemOpen = ref(false)
const systemTab = ref<'settings' | 'leaderboard' | 'guide' | 'news'>('settings')
const itemShopOpen = ref(false)
const equipShopOpen = ref(false)
const skillsOpen = ref(false)
const townOpen = ref(false)
const portalOpen = ref(false)
const portalFloor = ref(2)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const loginName = ref('')
const loginPassword = ref('')
const activeTitlePanel = ref<'how' | 'settings' | 'news' | 'credits' | ''>('')
const settings = useSettingsStore()
const player = usePlayerStore()
const config = useRuntimeConfig()
const classes = HERO_CLASSES
const faces = [{ id: 'calm', label: 'Calm' }, { id: 'brave', label: 'Brave' }, { id: 'sharp', label: 'Sharp' }]
const draft = reactive({ name: player.name || '', gender: player.gender as GenderId, classId: player.classId as HeroClassId, face: player.appearance.face || 'calm', hair: player.appearance.hair || 'short', color: player.appearance.color || 'amber' })
const { savePlayer } = useSheetsSync()
const titleImage = computed(() => assetPath('branding/spirals-echo-title.png'))
const selectedClass = computed(() => classes.find((heroClass) => heroClass.id === draft.classId) ?? classes[0])
// เควสปลดล็อกบอสชั้นปัจจุบันครบเงื่อนไขแล้ว → โชว์ badge "!" บนปุ่ม Quests
const questReady = computed(() =>
  describeMissingRequirements(getBossRequirement(player.currentFloor), player).length === 0)

function openSystem(tab: 'settings' | 'leaderboard' | 'guide' | 'news') {
  systemTab.value = tab
  systemOpen.value = true
}

function assetPath(path: string) {
  const cleanPath = path.replace(/^\/+/, '')
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${cleanPath}`
}
// Character icon ตัดจาก Occupation.png (เพศ+อาชีพ) — แหล่งเดียวกับ sprite ที่เดินในแมพ จึงหน้าตาตรงกัน
function classIcon(id: HeroClassId, gender: GenderId) { return `character-icons/${id}_${gender}.png` }
function active(value: boolean) { return value ? 'ring-2 ring-amber-300 brightness-110' : '' }
function onImageError(event: Event) { (event.target as HTMLImageElement).style.display = 'none' }
function submitLogin() { player.login(loginName.value) }
function submitRegister() { player.login(loginName.value || 'New Player') }
function playGuest() { player.login('Guest') }
function continueGame() { if (player.characterCreated) player.login(player.accountName || loginName.value || 'Player') }
function toggleTitlePanel(panel: 'how' | 'settings' | 'news' | 'credits') { activeTitlePanel.value = activeTitlePanel.value === panel ? '' : panel }
function resetDraft() {
  draft.name = ''
  draft.gender = 'male'
  draft.classId = 'warrior'
  draft.face = 'calm'
  draft.hair = 'short'
  draft.color = 'amber'
}
function resetGameData() {
  if (import.meta.client) localStorage.removeItem('player')
  player.$reset()
  resetDraft()
  activeTitlePanel.value = ''
}
function finishCharacter() { player.createCharacter({ ...draft }); savePlayer({ ...player.$state }) }

gameEvents.on('floor:advance', () => {
  player.advanceFloor()
  player.addLog(`Advanced to Floor ${player.currentFloor}.`)
  savePlayer({ ...player.$state })
})
gameEvents.on('town:hospital', () => { player.hospital(); showNotice('Hospital: HP fully restored.') })
gameEvents.on('town:item-shop', () => { itemShopOpen.value = true })
gameEvents.on('town:equipment-shop', () => { equipShopOpen.value = true })
gameEvents.on('town:guild', () => { skillsOpen.value = true })
gameEvents.on('town:portal', (payload) => { portalFloor.value = payload.floor; portalOpen.value = true })
gameEvents.on('notice', (payload) => showNotice(payload.text))

function showNotice(text: string) {
  notice.value = text
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3200)
}
</script>

