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
        <!-- P0.10: Local Profile — เกมเล่น offline, เซฟอยู่บนเครื่องนี้; ไม่มี password ปลอมหลอกว่าเป็น authentication -->
        <form class="pixel-window-body space-y-3 p-4 pt-2" @submit.prevent="submitLogin">
          <input v-model="loginName" class="field" type="text" autocomplete="nickname" maxlength="20" placeholder="Profile name / ชื่อผู้เล่น">
          <button class="btn-primary w-full" type="submit">{{ player.characterCreated ? 'Continue Adventure' : 'Start Adventure' }}</button>
          <p class="text-center text-[10px] text-[#f7e7c5]/60">Local profile — progress is saved on this device.<br>โปรไฟล์ท้องถิ่น — บันทึกความคืบหน้าไว้ในเครื่องนี้</p>
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

    <div v-else class="mx-auto max-w-4xl p-4 max-[560px]:pt-2 lg:max-w-5xl">
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
        <!-- มือถือ: canvas กินเต็มกว้างจอ (ลบ padding ข้างด้วย -mx-4) — hero บนจอ 26.8→29.1px;
             minimap ย้ายมา absolute ในกรอบนี้ จะได้ลอยบน canvas เสมอ ไม่ทับ HUD (S0 ปัญหา #1) -->
        <div class="pixel-window relative mx-auto w-full max-w-[1002px] overflow-hidden max-[560px]:-mx-4 max-[560px]:w-auto max-[560px]:rounded-none">
          <ClientOnly><GameCanvas /></ClientOnly>
          <GameMinimap />
        </div>
        <p v-if="notice" class="glass-panel gold-text mt-2 p-2 text-center text-xs">{{ notice }}</p>

        <!-- แถบเมนูล่างจัดหมวด 3 กลุ่มสไตล์ RPG classic (Character / Journal / World) + แผง
             Gold/Gems/Floor — ปุ่ม/handler/badge ครบเท่าเดิมทุกปุ่ม แค่จัดกลุ่มให้หาเจอไว -->
        <div class="mt-3 flex flex-wrap items-stretch gap-2">
          <div class="nav-group" data-testid="nav-group-character">
            <span class="nav-group-label">Character</span>
            <button class="nav-btn" @click="statusOpen = true">
              <span class="nav-ico">👤</span>Status
              <span v-if="player.statPointsLeft" class="nav-btn-badge">{{ player.statPointsLeft }}</span>
            </button>
            <button class="nav-btn" @click="statusOpen = true"><span class="nav-ico">🎒</span>Inventory</button>
            <button class="nav-btn" @click="skillsOpen = true">
              <span class="nav-ico">✨</span>Skills
              <span v-if="player.skillPoints" class="nav-btn-badge">{{ player.skillPoints }}</span>
            </button>
          </div>
          <div class="nav-group" data-testid="nav-group-journal">
            <span class="nav-group-label">Journal</span>
            <button class="nav-btn" @click="questsOpen = true">
              <span class="nav-ico">📜</span>Quests
              <span v-if="questReady" class="nav-btn-badge">!</span>
            </button>
            <button class="nav-btn" @click="mapOpen = true"><span class="nav-ico">🗺</span>Map</button>
            <button class="nav-btn" @click="logOpen = true"><span class="nav-ico">📖</span>Log</button>
          </div>
          <div class="nav-group" data-testid="nav-group-world">
            <span class="nav-group-label">World</span>
            <button class="nav-btn" @click="townOpen = true"><span class="nav-ico">🏰</span>Town</button>
            <button class="nav-btn" @click="guildOpen = true">
              <span class="nav-ico">📚</span>Guild
              <span v-if="questClaimable" class="nav-btn-badge">!</span>
            </button>
            <button class="nav-btn" @click="craftOpen = true"><span class="nav-ico">⚒</span>Craft</button>
          </div>
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
        <GameRealtimeBattle />
        <GameStatusModal :open="statusOpen" :avatar="assetPath(classIcon(player.classId, player.gender))" @close="statusOpen = false" />
        <GameQuestModal :open="questsOpen" @close="questsOpen = false" />
        <GameMapModal :open="mapOpen" @close="mapOpen = false" />
        <GameLogModal :open="logOpen" @close="logOpen = false" />
        <GameSystemModal :open="systemOpen" :initial-tab="systemTab" @close="systemOpen = false" />
        <GameShopModal :open="itemShopOpen" kind-filter="consumable" @close="itemShopOpen = false" />
        <GameShopModal :open="equipShopOpen" kind-filter="equipment" @close="equipShopOpen = false" />
        <GameSkillTreeModal :open="skillsOpen" @close="skillsOpen = false" />
        <GameGuildModal :open="guildOpen" @close="guildOpen = false" />
        <GameCraftModal :open="craftOpen" @close="craftOpen = false" />
        <GameTownModal :open="townOpen" @close="townOpen = false" @shop="townOpen = false; itemShopOpen = true" @guild="townOpen = false; guildOpen = true" />
        <GamePortalModal :open="portalOpen" :floor="portalFloor" @close="portalOpen = false" />
        <GameBossGateModal :open="bossGateOpen" :floor="bossGateFloor" @close="bossGateOpen = false" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
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
const guildOpen = ref(false)
const craftOpen = ref(false)
const townOpen = ref(false)
const portalOpen = ref(false)
const portalFloor = ref(2)
const bossGateOpen = ref(false)
const bossGateFloor = ref(2)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const loginName = ref('')
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
// มีเควสรายวันที่พร้อมกดรับ → badge "!" บนปุ่ม Guild
const questClaimable = computed(() =>
  player.dailyQuests.some((q) => !q.claimed && q.progress >= q.target))

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
// P0.10: Local Profile เท่านั้น — โปรไฟล์เดิมใช้ชื่อเดิมต่อ, โปรไฟล์ใหม่ใช้ชื่อที่กรอก (ไม่มี auth ปลอม)
function submitLogin() { player.login(player.characterCreated ? (player.accountName || loginName.value) : loginName.value) }
function playGuest() { player.login('Guest') }
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

gameEvents.on('floor:advance', (payload) => {
  // P0.1: setFloor(destination) คือ floor authority เดียว — ใช้ปลายทางจาก event ตรงๆ
  // (ห้าม increment สุ่มสี่สุ่มห้า ไม่งั้น scene กับ store แยกทางกันเหมือนบั๊กเดิม)
  player.setFloor(payload.floor)
  player.addLog(`Advanced to Floor ${player.currentFloor}.`)
  player.dispatchQuestEvent({ type: 'reach-floor', floor: player.currentFloor })
  savePlayer({ ...player.$state })
})
gameEvents.on('town:hospital', () => { player.hospital(); showNotice('Hospital: HP fully restored.') })
gameEvents.on('town:item-shop', () => { itemShopOpen.value = true })
gameEvents.on('town:equipment-shop', () => { equipShopOpen.value = true })
gameEvents.on('town:guild', () => { guildOpen.value = true; player.dispatchQuestEvent({ type: 'talk-npc', npcId: 'guildmaster' }); savePlayer({ ...player.$state }) })
gameEvents.on('town:portal', (payload) => { portalFloor.value = payload.floor; portalOpen.value = true; player.dispatchQuestEvent({ type: 'talk-npc', npcId: 'portal_guardian' }); savePlayer({ ...player.$state }) })
gameEvents.on('boss:gate', (payload) => { bossGateFloor.value = payload.floor; bossGateOpen.value = true })
gameEvents.on('boss:enter', () => { bossGateOpen.value = false })
gameEvents.on('notice', (payload) => showNotice(payload.text))

// Inc 4: bridge World-1 combat/dungeon signals into the main-quest reducer (rewards granted once).
// P0.3: นับเฉพาะ outcome === 'victory' — หนีสำเร็จ/หนีพลาดไม่ใช่ชัยชนะ
gameEvents.on('battle:end', ({ outcome, isBoss }) => {
  if (outcome !== 'victory') return
  if (isBoss && player.currentFloor === 10) player.dispatchQuestEvent({ type: 'defeat-boss', bossId: 'myco_colossus' })
  else if (!isBoss) player.dispatchQuestEvent({ type: 'defeat-monster' })
  savePlayer({ ...player.$state })
})
gameEvents.on('dungeon:enter', ({ layoutId }) => { player.dispatchQuestEvent({ type: 'enter-dungeon', layoutId }); savePlayer({ ...player.$state }) })
gameEvents.on('dungeon:clear', ({ layoutId }) => { player.dispatchQuestEvent({ type: 'clear-dungeon', layoutId }); savePlayer({ ...player.$state }) })
gameEvents.on('secret:found', ({ id }) => { if (player.discoverSecret(id)) { showNotice('✨ Secret discovered!'); savePlayer({ ...player.$state }) } })

// Phase 8 (ethical retention): rested check-in — เวลาที่หายไปกลายเป็นโบนัส EXP (ไม่มีการลงโทษ)
// + break reminder อ่อนโยนทุก 60 นาทีของการเล่นต่อเนื่อง (แค่ชวนพัก ไม่บล็อกเกม ไม่มีบทลงโทษ)
const BREAK_REMINDER_MINUTES = 60
let breakReminderTimer: ReturnType<typeof setInterval> | undefined
let lastBreakReminderAt = Date.now()
onMounted(() => {
  const before = player.restedExpPool
  player.checkInRested()
  if (player.restedExpPool > before) showNotice(`💤 Rested! +${player.restedExpPool - before} bonus EXP in your next fights.`)
  breakReminderTimer = setInterval(() => {
    if (!player.characterCreated) { lastBreakReminderAt = Date.now(); return }
    if (Date.now() - lastBreakReminderAt >= BREAK_REMINDER_MINUTES * 60_000) {
      lastBreakReminderAt = Date.now()
      showNotice('🌿 เล่นมา 1 ชั่วโมงแล้ว — พักสายตา ยืดเส้นยืดสาย ดื่มน้ำสักหน่อยนะ')
    }
  }, 60_000)
})
onUnmounted(() => { if (breakReminderTimer) clearInterval(breakReminderTimer) })

function showNotice(text: string) {
  notice.value = text
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3200)
}
</script>

