<template>
  <!-- Dev-only combat harness (Phase 3 Batch D playtest) — หน้า /dev/* ถูกตัดจาก production
       โดย pages:extend hook ใน nuxt.config.ts เสมอ ใช้ playtest แถบสกิล loadout/combo/modal
       แบบ deterministic โดยไม่ต้องเดินหามอนสเตอร์ใน Phaser scene -->
  <div class="min-h-screen bg-[#0d0a06] p-4 text-white">
    <h1 class="gold-text mb-3 text-lg font-bold">DEV — Battle Harness</h1>

    <div class="glass-panel mb-3 flex flex-wrap items-center gap-2 p-3 text-xs">
      <span class="opacity-70">Class:</span>
      <button
        v-for="c in classes" :key="c.id" data-testid="pick-class"
        class="btn-secondary px-2 py-1" :class="player.classId === c.id ? 'ring-2 ring-amber-400' : ''"
        @click="seedProfile(c.id)"
      >{{ c.name }}</button>
      <span class="mx-2 opacity-40">|</span>
      <button class="btn-secondary px-2 py-1" data-testid="set-lv15" @click="setLevel(15)">Set Lv15</button>
      <button class="btn-secondary px-2 py-1" data-testid="heal-full" @click="healFull">Full Heal</button>
    </div>

    <div class="glass-panel mb-3 flex flex-wrap items-center gap-2 p-3 text-xs">
      <button class="btn-primary px-3 py-1" data-testid="start-battle" @click="startBattle(false)">Start Battle (F1)</button>
      <button class="btn-primary px-3 py-1" data-testid="start-boss" @click="startBattle(true)">Start Boss (F10)</button>
      <button class="btn-secondary px-3 py-1" data-testid="open-skills" @click="skillsOpen = true">Open Skills Modal</button>
      <span class="opacity-70">Lv {{ player.level }} · {{ player.heroClass.name }} · HP {{ player.hp }}/{{ player.maxHp }} · MP {{ player.mp }}/{{ player.maxMp }}</span>
      <span data-testid="last-outcome" class="gold-text font-bold">{{ lastOutcome }}</span>
    </div>

    <div class="glass-panel p-3 text-xs opacity-80">
      <p>Loadout: {{ player.skillLoadout.skills.join(', ') }} + ★{{ player.skillLoadout.ultimate }}</p>
      <p>Passives: {{ player.skillLoadout.passives.join(', ') }} · Job: {{ player.jobId || '—' }}</p>
    </div>

    <GameRealtimeBattle />
    <GameSkillTreeModal :open="skillsOpen" @close="skillsOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { HERO_CLASSES, type HeroClassId } from '~/data/classes'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore } from '~/stores/player'

const player = usePlayerStore()
const classes = HERO_CLASSES
const skillsOpen = ref(false)
const lastOutcome = ref('')

function seedProfile(classId: HeroClassId) {
  player.login('DevTester')
  player.createCharacter({ name: `Dev ${classId}`, gender: 'male', classId, face: 'calm', hair: 'short', color: 'amber' })
}

function setLevel(level: number) {
  player.level = level
  player.hp = player.maxHp
  player.mp = player.maxMp
}

function healFull() {
  player.hp = player.maxHp
  player.mp = player.maxMp
}

function startBattle(boss: boolean) {
  if (!player.characterCreated) seedProfile('warrior')
  lastOutcome.value = ''
  player.currentFloor = boss ? 10 : 1
  gameEvents.emit('battle:start', { floor: boss ? 10 : 1, isBoss: boss })
}

const onEnd = (p: { outcome: string }) => { lastOutcome.value = `outcome:${p.outcome}` }
onMounted(() => { gameEvents.on('battle:end', onEnd) })
onUnmounted(() => { gameEvents.off('battle:end', onEnd) })
</script>
