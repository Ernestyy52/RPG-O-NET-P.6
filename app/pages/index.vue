<template>
  <div class="dnd-bg min-h-screen">
    <section v-if="showTitleScreen" class="title-screen title-screen-v2" :class="{ 'reduce-title-motion': settings.reducedMotion }" data-testid="title-screen">
      <img :src="titleImage" class="title-art" alt="" aria-hidden="true" @error="onImageError">
      <div class="title-vignette" />
      <div class="aurora-sweep" />
      <div class="star-field star-field-a" />
      <div class="star-field star-field-b" />
      <div class="crystal-glow crystal-glow-left" />
      <div class="crystal-glow crystal-glow-right" />

      <div class="title-stage">
        <header class="title-brand" data-testid="animated-game-logo">
          <div class="title-logo-lockup">
            <div class="title-logo-crest" aria-hidden="true">
              <span class="title-logo-rune" />
              <span class="title-logo-gem">✦</span>
              <i class="title-logo-spark title-logo-spark-a" />
              <i class="title-logo-spark title-logo-spark-b" />
              <i class="title-logo-spark title-logo-spark-c" />
            </div>
            <div class="min-w-0">
              <p class="title-logo-kicker">O-NET ENGLISH RPG ADVENTURE</p>
              <h1 class="title-logo-main">SPIRAL’S ECHO</h1>
              <div class="title-logo-divider" aria-hidden="true"><i /><span>◆</span><i /></div>
              <p class="title-logo-subtitle">THE FLOATING REALMS</p>
              <p class="title-logo-thai">สไปรัลส์ เอคโค่: อาณาจักรลอยฟ้า</p>
            </div>
          </div>
        </header>

        <div class="title-menu anime-window">
          <div class="title-gate-heading">
            <span class="title-gate-emblem" aria-hidden="true">✦</span>
            <div>
              <p>ADVENTURER GATE</p>
              <h2>{{ player.characterCreated ? 'Welcome Back, Hero' : 'Begin Your Legend' }}</h2>
            </div>
          </div>

          <!-- Local Profile: the game is offline-first and saves on this device. -->
          <form class="title-login-form" @submit.prevent="submitLogin">
            <label class="title-field-label" for="title-profile-name">Adventurer name <span>ชื่อผู้เล่น</span></label>
            <div class="title-input-shell">
              <span aria-hidden="true">◇</span>
              <input id="title-profile-name" v-model="loginName" class="field" type="text" autocomplete="nickname" maxlength="20" placeholder="Enter your name">
            </div>

            <button class="title-enter-btn" type="submit">
              <span>{{ player.characterCreated ? 'CONTINUE ADVENTURE' : 'ENTER THE FLOATING REALMS' }}</span>
              <small>{{ player.characterCreated ? 'เดินทางต่อจากจุดเดิม' : 'เริ่มต้นตำนานบทใหม่' }}</small>
            </button>

            <p class="title-local-note"><span aria-hidden="true">◆</span> Local profile · Progress is saved on this device</p>

            <div class="title-utility-grid">
              <button type="button" @click="toggleTitlePanel('how')">How to Play</button>
              <button type="button" @click="toggleTitlePanel('settings')">Settings</button>
              <button type="button" @click="toggleTitlePanel('news')">News</button>
              <button type="button" @click="toggleTitlePanel('credits')">Credits</button>
            </div>
            <button class="title-guest-btn" type="button" @click="playGuest">Continue as Guest</button>

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
                    <option value="en">English</option><option value="th">Thai</option>
                  </select>
                </label>
                <button class="btn-secondary w-full text-xs" type="button" @click="resetGameData">Reset this game data</button>
              </div>
              <div v-else-if="activeTitlePanel === 'news'">
                <h3 class="mb-1 font-bold text-[#f5c66b]">News / Update</h3>
                <p>The Floating Realms now features animated equipment, Daily Echo Rifts, set-drop memory, and a renewed fantasy title screen.</p>
              </div>
              <div v-else>
                <h3 class="mb-1 font-bold text-[#f5c66b]">Credits</h3>
                <p>Original project artwork and generated title background. Game concept, UI, and code by the project team.</p>
              </div>
            </div>
          </form>
        </div>

        <p class="title-screen-footer">A learning adventure across one hundred floors <span>·</span> v0.9</p>
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
              <img :src="assetPath(selectedOccupation.portrait)" class="max-h-full pixelated object-contain" alt="character preview" @error="onImageError">
            </div>
            <div class="mt-3 text-center">
              <div class="font-bold">{{ draft.name || 'Unnamed Hero' }}</div>
              <div class="text-sm opacity-75">{{ selectedClass.name }} · {{ selectedOccupation.titleTh }}</div>
              <p class="mt-2 text-xs text-[#c9d5ef]">{{ selectedOccupation.fantasy }}</p>
              <p class="mt-2 text-[10px] text-[#e8c879]">แนะนำ: {{ selectedOccupation.primaryStats.join(' · ') }}</p>
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
                  <img :src="assetPath(occupationForClass(heroClass.id).portrait)" class="mx-auto mb-1 h-12 object-contain pixelated" alt="">
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
        <div class="fantasy-dock mt-3 flex flex-wrap items-stretch gap-2">
          <div class="nav-group" data-testid="nav-group-character">
            <span class="nav-group-label">Character</span>
            <button class="nav-btn" @click="statusOpen = true">
              <img :src="assetPath('skill-icons/helm.png')" class="nav-ico" alt="">Status
              <span v-if="player.statPointsLeft" class="nav-btn-badge">{{ player.statPointsLeft }}</span>
            </button>
            <button class="nav-btn" @click="statusOpen = true"><img :src="assetPath('item-icons/armor_t1.png')" class="nav-ico" alt="">Inventory</button>
            <button class="nav-btn" @click="skillsOpen = true">
              <img :src="assetPath('skill-icons/wand.png')" class="nav-ico" alt="">Skills
              <span v-if="player.skillPoints" class="nav-btn-badge">{{ player.skillPoints }}</span>
            </button>
          </div>
          <div class="nav-group" data-testid="nav-group-journal">
            <span class="nav-group-label">Journal</span>
            <button class="nav-btn" @click="questsOpen = true">
              <img :src="assetPath('skill-icons/scroll.png')" class="nav-ico" alt="">Quests
              <span v-if="questReady" class="nav-btn-badge">!</span>
            </button>
            <button class="nav-btn" @click="activitiesServiceAccess = false; activitiesOpen = true">
              <img :src="assetPath('skill-icons/swords.png')" class="nav-ico" alt="">Hunts
              <span v-if="activityClaimable" class="nav-btn-badge">!</span>
            </button>
            <button class="nav-btn" @click="mapOpen = true"><img :src="assetPath('skill-icons/orb.png')" class="nav-ico" alt="">Map</button>
            <button class="nav-btn" @click="logOpen = true"><img :src="assetPath('skill-icons/book.png')" class="nav-ico" alt="">Log</button>
          </div>
          <div class="nav-group" data-testid="nav-group-guide">
            <span class="nav-group-label">Explore</span>
            <button class="nav-btn" @click="townOpen = true"><img :src="assetPath('skill-icons/tower_shield.png')" class="nav-ico" alt="">Town Guide</button>
          </div>
          <div class="flex-1" />
          <div class="currency-panel">
            <img :src="assetPath('item-icons/trk_ring.png')" class="currency-ico" alt="">
            <div class="text-left leading-tight">
              <div class="currency-label">Gold</div>
              <div class="currency-value">{{ player.gold }}</div>
            </div>
          </div>
          <div class="currency-panel">
            <img :src="assetPath('item-icons/mat_crystal.png')" class="currency-ico" alt="">
            <div class="text-left leading-tight">
              <div class="currency-label">Gems</div>
              <div class="currency-value">{{ player.gems }}</div>
            </div>
          </div>
          <div class="currency-panel">
            <img :src="assetPath('skill-icons/tower_shield.png')" class="currency-ico" alt="">
            <div class="text-left leading-tight">
              <div class="currency-label">Adventure Rank</div>
              <div class="currency-value">{{ player.adventureRank }}</div>
            </div>
          </div>
        </div>

        <LazyGameBattleModal v-if="combatUiReady" />
        <LazyGameRealtimeBattle v-if="combatUiReady" />
        <LazyGameStatusModal v-if="statusOpen" :open="statusOpen" :avatar="assetPath(classIcon(player.classId, player.gender))" @close="statusOpen = false" />
        <LazyGameQuestModal v-if="questsOpen" :open="questsOpen" @close="questsOpen = false" />
        <LazyGameMapModal v-if="mapOpen" :open="mapOpen" @close="mapOpen = false" @travel="handleWorldTravel" />
        <LazyGameLogModal v-if="logOpen" :open="logOpen" @close="logOpen = false" />
        <LazyGameSystemModal v-if="systemOpen" :open="systemOpen" :initial-tab="systemTab" @close="systemOpen = false" />
        <LazyGameShopModal v-if="itemShopOpen" :open="itemShopOpen" kind-filter="consumable" @close="itemShopOpen = false" />
        <LazyGameShopModal v-if="equipShopOpen" :open="equipShopOpen" kind-filter="equipment" @close="equipShopOpen = false" />
        <LazyGameSkillTreeModal v-if="skillsOpen" :open="skillsOpen" @close="skillsOpen = false" />
        <LazyGameGuildModal v-if="guildOpen" :open="guildOpen" :station="guildStation" @close="guildOpen = false" />
        <LazyGameCraftModal v-if="craftOpen" :open="craftOpen" @close="craftOpen = false" />
        <LazyGameTownModal v-if="townOpen" :open="townOpen" @close="townOpen = false" />
        <LazyGamePortalModal v-if="portalOpen" :open="portalOpen" :floor="portalFloor" @close="portalOpen = false" />
        <LazyGameBossGateModal v-if="bossGateOpen" :open="bossGateOpen" :floor="bossGateFloor" @close="bossGateOpen = false" />
        <LazyGameActivitiesModal v-if="activitiesOpen" :open="activitiesOpen" :service-access="activitiesServiceAccess" @close="activitiesOpen = false; activitiesServiceAccess = false" />
        <LazyGameAcademyModal v-if="academyOpen" :open="academyOpen" :category="academyCategory" :tutor-id="academyTutorId" @close="academyOpen = false" @completed="savePlayer({ ...player.$state })" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { GAME_NAME_EN, GAME_TAGLINE, GAME_TITLE_EN, GAME_TITLE_TH } from '~/data/branding'
import { HERO_CLASSES, type HeroClassId } from '~/data/classes'
import { occupationForClass } from '~/data/occupations'
import { gameEvents, type WorldTravelPayload } from '~/game/systems/eventBus'
import type { NpcInteractionPayload } from '~/data/town/services'
import type { StudyCategory } from '~/data/study'
import { getAdventureRegion, regionForFloor } from '~/data/adventureRegions'
import { getAdventureZone } from '~/data/adventureZones'
import { WORLD1_HANDOFF_CONTRACT } from '~/data/world1/completion'
import { usePlayerStore, type GenderId } from '~/stores/player'
import { useSettingsStore } from '~/stores/settings'
import { getBossRequirement, describeMissingRequirements } from '~/data/bossRequirements'
import { useSheetsSync } from '~/composables/useSheetsSync'

useHead({ title: `${GAME_TITLE_EN} · ${GAME_TITLE_TH}` })

const statusOpen = ref(false)
const questsOpen = ref(false)
const activitiesOpen = ref(false)
const mapOpen = ref(false)
const activitiesServiceAccess = ref(false)
const logOpen = ref(false)
const systemOpen = ref(false)
const systemTab = ref<'settings' | 'leaderboard' | 'guide' | 'news'>('settings')
const itemShopOpen = ref(false)
const equipShopOpen = ref(false)
const skillsOpen = ref(false)
const guildOpen = ref(false)
const craftOpen = ref(false)
const guildStation = ref<'quests' | 'hunts'>('quests')
const townOpen = ref(false)
const portalOpen = ref(false)
const academyOpen = ref(false)
const academyCategory = ref<StudyCategory>('grammar')
const academyTutorId = ref('tutor_grammar')
const portalFloor = ref(2)
const bossGateOpen = ref(false)
const bossGateFloor = ref(2)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const loginName = ref('')
const activeTitlePanel = ref<'how' | 'settings' | 'news' | 'credits' | ''>('')
const settings = useSettingsStore()
const player = usePlayerStore()
const route = useRoute()
const showTitleScreen = computed(() => !player.isAuthenticated || (import.meta.dev && route.query.preview === 'title'))
// Combat windows stay out of the title/town path and mount before the player can meet an enemy.
// Returning field and ranked saves opt in immediately.
const combatUiReady = ref(player.gameMode === 'ranked-tower' || getAdventureZone(player.currentZoneId).kind !== 'town')
const config = useRuntimeConfig()
const classes = HERO_CLASSES
const faces = [{ id: 'calm', label: 'Calm' }, { id: 'brave', label: 'Brave' }, { id: 'sharp', label: 'Sharp' }]
const draft = reactive({ name: player.name || '', gender: player.gender as GenderId, classId: player.classId as HeroClassId, face: player.appearance.face || 'calm', hair: player.appearance.hair || 'short', color: player.appearance.color || 'amber' })
const { savePlayer } = useSheetsSync()
const titleImage = computed(() => assetPath('branding/title-background-v2.webp'))
const selectedClass = computed(() => classes.find((heroClass) => heroClass.id === draft.classId) ?? classes[0])
const selectedOccupation = computed(() => occupationForClass(draft.classId))
// เควสปลดล็อกบอสชั้นปัจจุบันครบเงื่อนไขแล้ว → โชว์ badge "!" บนปุ่ม Quests
const questReady = computed(() =>
  describeMissingRequirements(getBossRequirement(player.currentFloor), player).length === 0)
const activityClaimable = computed(() => player.activityClaimable)

function openSystem(tab: 'settings' | 'leaderboard' | 'guide' | 'news') {
  systemTab.value = tab
  systemOpen.value = true
}
function openGuild(station: 'quests' | 'hunts') {
  guildStation.value = station
  guildOpen.value = true
}

function handleNpcInteraction(payload: NpcInteractionPayload) {
  player.dispatchQuestEvent({ type: 'talk-npc', npcId: payload.npcId })
  const accepted = player.acceptSideQuestsFromNpc(payload.npcId)
  let claimed = 0
  for (const entry of player.sideQuests) {
    if (entry.quest.npc === payload.npcId && entry.done && !entry.claimed && player.claimSideQuest(entry.quest.id)) claimed++
  }
  switch (payload.service) {
    case 'guild-quests': openGuild('quests'); break
    case 'regional-hunts': openGuild('hunts'); break
    case 'daily-activities':
      activitiesServiceAccess.value = true
      activitiesOpen.value = true
      break
    case 'item-shop': itemShopOpen.value = true; break
    case 'equipment-shop': equipShopOpen.value = true; break
    case 'craft': craftOpen.value = true; break
    case 'hospital':
      player.hospital()
      showNotice('Sena เธเธทเนเธเธเธน HP เนเธฅเธฐ MP เนเธซเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง')
      break
    case 'inn':
      player.heal()
      player.restoreMp()
      showNotice('เธเธฑเธเธ—เธตเน Hearthsong Inn ยท HP เนเธฅเธฐ MP เน€เธ•เนเธกเนเธฅเนเธง')
      break
    case 'academy':
      academyTutorId.value = payload.npcId
      academyCategory.value = payload.academyCategory ?? 'grammar'
      academyOpen.value = true
      break
    case 'portal':
      gameEvents.emit('audio:sfx', { key: 'portal' })
      portalFloor.value = player.currentFloor + 1
      portalOpen.value = true
      break
    case 'wardrobe': statusOpen.value = true; break
    case 'storage': showNotice('Oren: เธเธฅเธฑเธเธเธฅเธฒเธเธเธฐเน€เธเธดเธ”เนเธ World เธ–เธฑเธ”เนเธ ยท เธเธฃเธฐเน€เธเนเธฒเธชเนเธงเธเธ•เธฑเธงเธขเธฑเธเนเธเนเธเธฒเธเนเธ”เนเธเธเธ•เธด'); break
  }
  if (claimed) showNotice(`เธชเนเธ Side Quest เธเธฑเธ ${payload.npcId} เธชเธณเน€เธฃเนเธ ${claimed} เธเธฒเธ`)
  if (accepted) showNotice(`รับ Side Quest ใหม่จาก ${payload.npcId} ${accepted} งาน · ตรวจได้ใน Journal`)
  savePlayer({ ...player.$state })
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

function handleWorldTravel(payload: WorldTravelPayload) {
  mapOpen.value = false
  const travel = { ...payload, fromZoneId: payload.fromZoneId ?? player.currentZoneId }
  if (travel.mode !== 'town') combatUiReady.value = true
  if (travel.mode === 'ranked-tower') {
    player.enterRankedTower(travel.floor)
    showNotice('Endless Spire: Ranked run started. Campaign progress is safe.')
  } else {
    const region = travel.regionId ? getAdventureRegion(travel.regionId) : regionForFloor(travel.floor)
    if (travel.zoneId) {
      player.enterAdventureZone(travel.zoneId)
      player.dispatchQuestEvent({ type: 'reach-zone', zoneId: travel.zoneId })
    } else player.enterAdventureRegion(region.id, travel.floor)
    const zone = travel.zoneId ? getAdventureZone(travel.zoneId) : undefined
    showNotice(travel.mode === 'town' ? `Returned to ${region.town}.` : `Exploring ${zone?.name ?? region.name}.`)
  }
  savePlayer({ ...player.$state })
  gameEvents.emit('world:travel', travel)
}

function handleRegionComplete({ regionId }: { regionId: import('~/data/adventureRegions').AdventureRegionId }) {
  if (!player.completeAdventureRegion(regionId)) return
  showNotice(regionId === 'verdant-frontier'
    ? `WORLD 1 COMPLETE — Verdant Relic +${WORLD1_HANDOFF_CONTRACT.reward.gold}g secured!`
    : 'Region complete!')
  savePlayer({ ...player.$state })
}

gameEvents.on('world:travel-request', handleWorldTravel)
gameEvents.on('world:region-complete', handleRegionComplete)

gameEvents.on('tower:ranked-clear', ({ floor, won }) => {
  player.recordRankedClear(floor, won)
  savePlayer({ ...player.$state })
})

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
gameEvents.on('npc:interact', handleNpcInteraction)
gameEvents.on('town:equipment-shop', () => { equipShopOpen.value = true })
gameEvents.on('town:portal', (payload) => { gameEvents.emit('audio:sfx', { key: 'portal' }); portalFloor.value = payload.floor; portalOpen.value = true; player.dispatchQuestEvent({ type: 'talk-npc', npcId: 'portal_guardian' }); savePlayer({ ...player.$state }) })
gameEvents.on('boss:gate', (payload) => { bossGateFloor.value = payload.floor; bossGateOpen.value = true })
gameEvents.on('boss:enter', () => { bossGateOpen.value = false })
gameEvents.on('notice', (payload) => showNotice(payload.text))

// Inc 4: bridge World-1 combat/dungeon signals into the main-quest reducer (rewards granted once).
// P0.3: นับเฉพาะ outcome === 'victory' — หนีสำเร็จ/หนีพลาดไม่ใช่ชัยชนะ
gameEvents.on('battle:end', ({ outcome, isBoss, monsterId, elite, rare, expReward }) => {
  if (outcome !== 'victory') return
  player.recordActivityVictory({ elite, rare })
  player.recordMonsterVictory({ monsterId, elite, rare, expReward })
  if (isBoss && player.currentZoneId === 'myco-sanctum') player.dispatchQuestEvent({ type: 'defeat-boss', bossId: 'myco_colossus' })
  else if (!isBoss) player.dispatchQuestEvent({ type: 'defeat-monster' })
  savePlayer({ ...player.$state })
})
gameEvents.on('dungeon:enter', ({ layoutId }) => { player.dispatchQuestEvent({ type: 'enter-dungeon', layoutId }); savePlayer({ ...player.$state }) })
gameEvents.on('dungeon:clear', ({ layoutId }) => { player.dispatchQuestEvent({ type: 'clear-dungeon', layoutId }); savePlayer({ ...player.$state }) })
gameEvents.on('daily:rift-clear', ({ date }) => {
  if (player.completeDailyRift(date)) {
    showNotice('◈ Daily Echo Rift cleared — reward ready!')
    savePlayer({ ...player.$state })
  }
})
gameEvents.on('secret:found', ({ id }) => { if (player.discoverSecret(id)) { showNotice('✨ Secret discovered!'); savePlayer({ ...player.$state }) } })

const handleDailyRiftEnter = () => { combatUiReady.value = true }
gameEvents.on('daily:rift-enter', handleDailyRiftEnter)
// Phase 8 (ethical retention): rested check-in — เวลาที่หายไปกลายเป็นโบนัส EXP (ไม่มีการลงโทษ)
// + break reminder อ่อนโยนทุก 60 นาทีของการเล่นต่อเนื่อง (แค่ชวนพัก ไม่บล็อกเกม ไม่มีบทลงโทษ)
const BREAK_REMINDER_MINUTES = 60
let breakReminderTimer: ReturnType<typeof setInterval> | undefined
let lastBreakReminderAt = Date.now()
onMounted(() => {
  player.refreshDailyActivities()
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
onUnmounted(() => {
  if (breakReminderTimer) clearInterval(breakReminderTimer)
  gameEvents.off('world:travel-request', handleWorldTravel)
  gameEvents.off('npc:interact', handleNpcInteraction)
  gameEvents.off('world:region-complete', handleRegionComplete)
  gameEvents.off('daily:rift-enter', handleDailyRiftEnter)
})

function showNotice(text: string) {
  notice.value = text
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3200)
}
</script>

