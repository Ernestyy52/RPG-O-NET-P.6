<template>
  <div class="dnd-bg min-h-screen p-4">
    <h1 class="gold-text mb-4 text-center text-2xl font-bold">O-NET English RPG Tower</h1>
    <div class="mx-auto max-w-5xl">
      <section v-if="!player.isAuthenticated" class="mx-auto max-w-md pixel-window overflow-hidden">
        <div class="pixel-titlebar">
          <h2 class="gold-text text-lg font-bold">Member Login</h2>
          <span class="text-xs opacity-75">Start Adventure</span>
        </div>
        <form class="space-y-3 p-4" @submit.prevent="submitLogin">
          <input v-model="loginName" class="field" type="text" autocomplete="username" placeholder="Username">
          <input v-model="loginPassword" class="field" type="password" autocomplete="current-password" placeholder="Password">
          <div class="grid grid-cols-2 gap-2">
            <button class="btn-primary" type="submit">Login</button>
            <button class="btn-secondary" type="submit">Register</button>
          </div>
        </form>
      </section>

      <section v-else-if="!player.characterCreated" class="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div class="pixel-window overflow-hidden">
          <div class="pixel-titlebar">
            <h2 class="gold-text text-lg font-bold">Character Preview</h2>
            <span class="text-xs">{{ draft.gender }}</span>
          </div>
          <div class="p-4">
            <div class="preview-stage mx-auto">
              <img :src="basePreview" class="preview-base" alt="character base">
              <img src="/character-assets/occupation.png" class="preview-occupation" alt="occupation sheet">
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
                <select v-model="draft.hair" class="field mt-2">
                  <option value="short">Short</option>
                  <option value="curly">Curly</option>
                  <option value="long">Long</option>
                </select>
              </label>
              <label class="text-sm font-bold">Color
                <select v-model="draft.color" class="field mt-2">
                  <option value="amber">Amber</option>
                  <option value="teal">Teal</option>
                  <option value="crimson">Crimson</option>
                </select>
              </label>
            </div>

            <div>
              <div class="mb-2 text-sm font-bold">Class</div>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button v-for="heroClass in classes" :key="heroClass.id" type="button" class="btn-secondary text-xs" :class="active(draft.classId === heroClass.id)" @click="draft.classId = heroClass.id">
                  <img :src="heroClass.sprite" class="mx-auto mb-1 h-12 object-contain pixelated" alt="">
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
              <img :src="player.heroClass.sprite" class="h-16 object-contain pixelated" alt="hero">
            </div>
          </div>
          <div class="glass-panel p-3">
            <div class="mb-2 text-sm opacity-75">Character Asset Progression</div>
            <p class="text-xs opacity-75">Base: {{ player.gender }} / Outfit: {{ player.heroClass.name }} / Equipped: {{ equippedText }}</p>
            <button class="btn-secondary mt-3 text-xs" @click="player.resetCharacter()">Recreate Character</button>
          </div>
        </div>

        <GameHud @open-shop="shopOpen = true" @open-skills="skillsOpen = true" @open-town="townOpen = true" />
        <div class="pixel-window overflow-hidden">
          <ClientOnly>
            <GameCanvas />
          </ClientOnly>
        </div>
        <GameBattleModal />
        <GameShopModal :open="shopOpen" @close="shopOpen = false" />
        <GameSkillTreeModal :open="skillsOpen" @close="skillsOpen = false" />
        <GameTownModal :open="townOpen" @close="townOpen = false" @shop="townOpen = false; shopOpen = true" @guild="townOpen = false; skillsOpen = true" />
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

const shopOpen = ref(false)
const skillsOpen = ref(false)
const townOpen = ref(false)
const loginName = ref('')
const loginPassword = ref('')
const player = usePlayerStore()
const classes = HERO_CLASSES
const faces = [
  { id: 'calm', label: 'Calm' },
  { id: 'brave', label: 'Brave' },
  { id: 'sharp', label: 'Sharp' },
]
const draft = reactive({
  name: player.name || '',
  gender: player.gender as GenderId,
  classId: player.classId as HeroClassId,
  face: player.appearance.face || 'calm',
  hair: player.appearance.hair || 'short',
  color: player.appearance.color || 'amber',
})
const { savePlayer } = useSheetsSync()
const selectedClass = computed(() => classes.find((heroClass) => heroClass.id === draft.classId) ?? classes[0])
const basePreview = computed(() => draft.gender === 'female' ? '/character-assets/base_female.png' : '/character-assets/base_male.png')
const equippedText = computed(() => Object.values(player.equipment).map((id) => id ? getItemById(id)?.name : '').filter(Boolean).join(' / ') || 'starter gear')

function active(value: boolean) {
  return value ? 'ring-2 ring-amber-300 brightness-110' : ''
}

function submitLogin() {
  player.login(loginName.value)
}

function finishCharacter() {
  player.createCharacter({ ...draft })
  savePlayer({ ...player.$state })
}

gameEvents.on('floor:advance', () => {
  player.advanceFloor()
  savePlayer({ ...player.$state })
})
</script>
