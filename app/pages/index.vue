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
          <p class="text-xs uppercase tracking-[0.28em] text-cyan-100/80">SPIRAL'S ECHO</p>
          <h1 class="gold-text mt-1 text-2xl font-bold sm:text-3xl">SPIRAL'S ECHO: THE FLOATING REALMS</h1>
          <p class="mt-1 text-sm text-[#f7e7c5]/80">O-NET English RPG Adventure</p>
        </div>
        <form class="space-y-3 p-4 pt-2" @submit.prevent="submitLogin">
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

    <div v-else class="mx-auto max-w-5xl p-4">
      <header class="mb-4 text-center">
        <p class="text-xs uppercase tracking-[0.32em] text-cyan-100/70">O-NET English RPG Adventure</p>
        <h1 class="gold-text text-2xl font-bold sm:text-3xl">SPIRAL'S ECHO: THE FLOATING REALMS</h1>
      </header>

      <section v-if="!player.characterCreated" class="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div class="pixel-window overflow-hidden">
          <div class="pixel-titlebar">
            <h2 class="gold-text text-lg font-bold">Character Preview</h2>
            <span class="text-xs">{{ draft.gender }}</span>
          </div>
          <div class="p-4">
            <div class="preview-stage mx-auto">
              <img :src="basePreview" class="preview-base" alt="character base" @error="onImageError">
              <img :src="assetPath('character-assets/occupation.png')" class="preview-occupation" alt="occupation sheet" @error="onImageError">
              <div class="face-mark" :class="[`face-${draft.face}`, `tone-${draft.color}`]" />
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
          <div class="space-y-4 p-4">
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
                  <img :src="assetPath(heroClass.sprite)" class="mx-auto mb-1 h-12 object-contain pixelated" alt="">
                  {{ heroClass.name }}
                </button>
              </div>
            </div>
            <button class="btn-primary w-full" type="submit">Enter Game</button>
          </div>
        </form>
      </section>

      <section v-else>
        <div class="mb-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <div class="glass-panel p-3">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div>
                <div class="text-sm opacity-75">Character</div>
                <div class="font-bold">{{ player.displayName }} the {{ player.heroClass.name }}</div>
                <div class="text-xs opacity-75">{{ player.gender }} / {{ player.appearance.face }} face / {{ player.appearance.hair }} hair</div>
              </div>
              <img :src="assetPath(player.heroClass.sprite)" class="h-16 object-contain pixelated" alt="hero">
            </div>
          </div>
          <div class="glass-panel p-3">
            <div class="mb-2 text-sm opacity-75">Character Asset Progression</div>
            <p class="text-xs opacity-75">Base: {{ player.gender }} / Outfit: {{ player.heroClass.name }} / Equipped: {{ equippedText }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button class="btn-secondary text-xs" @click="player.resetCharacter()">Recreate Character</button>
              <button class="btn-secondary text-xs" @click="resetGameData">Reset Save</button>
            </div>
          </div>
        </div>
        <GameHud @open-shop="itemShopOpen = true" @open-skills="skillsOpen = true" @open-town="townOpen = true" />
        <div class="pixel-window overflow-hidden"><ClientOnly><GameCanvas /></ClientOnly></div>
        <p v-if="notice" class="glass-panel gold-text mt-2 p-2 text-center text-xs">{{ notice }}</p>
        <GameBattleModal />
        <GameShopModal :open="itemShopOpen" kind-filter="consumable" @close="itemShopOpen = false" />
        <GameShopModal :open="equipShopOpen" kind-filter="equipment" @close="equipShopOpen = false" />
        <GameSkillTreeModal :open="skillsOpen" @close="skillsOpen = false" />
        <GameTownModal :open="townOpen" @close="townOpen = false" @shop="townOpen = false; itemShopOpen = true" @guild="townOpen = false; skillsOpen = true" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { HERO_CLASSES, type HeroClassId } from '~/data/classes'
import { getItemById } from '~/data/equipment'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore, type GenderId } from '~/stores/player'
import { useSheetsSync } from '~/composables/useSheetsSync'

const itemShopOpen = ref(false)
const equipShopOpen = ref(false)
const skillsOpen = ref(false)
const townOpen = ref(false)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const loginName = ref('')
const loginPassword = ref('')
const activeTitlePanel = ref<'how' | 'settings' | 'news' | 'credits' | ''>('')
const settings = reactive({ sound: true, reducedMotion: false, language: 'en' })
const player = usePlayerStore()
const config = useRuntimeConfig()
const classes = HERO_CLASSES
const faces = [{ id: 'calm', label: 'Calm' }, { id: 'brave', label: 'Brave' }, { id: 'sharp', label: 'Sharp' }]
const draft = reactive({ name: player.name || '', gender: player.gender as GenderId, classId: player.classId as HeroClassId, face: player.appearance.face || 'calm', hair: player.appearance.hair || 'short', color: player.appearance.color || 'amber' })
const { savePlayer } = useSheetsSync()
const titleImage = computed(() => assetPath('branding/spirals-echo-title.png'))
const selectedClass = computed(() => classes.find((heroClass) => heroClass.id === draft.classId) ?? classes[0])
const basePreview = computed(() => assetPath(draft.gender === 'female' ? 'character-assets/base_female.png' : 'character-assets/base_male.png'))
const equippedText = computed(() => Object.values(player.equipment).map((id) => id ? getItemById(id)?.name : '').filter(Boolean).join(' / ') || 'starter gear')

function assetPath(path: string) {
  const cleanPath = path.replace(/^\/+/, '')
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${cleanPath}`
}
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

gameEvents.on('floor:advance', () => { player.advanceFloor(); savePlayer({ ...player.$state }) })
gameEvents.on('town:hospital', () => { player.hospital(); showNotice('Hospital: HP fully restored.') })
gameEvents.on('town:item-shop', () => { itemShopOpen.value = true })
gameEvents.on('town:equipment-shop', () => { equipShopOpen.value = true })
gameEvents.on('town:guild', () => { skillsOpen.value = true })
gameEvents.on('notice', (payload) => showNotice(payload.text))

function showNotice(text: string) {
  notice.value = text
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3200)
}
</script>

