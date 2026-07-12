<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-3xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">{{ player.heroClass.name }} Skills</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body p-4">
        <p class="mb-3 text-sm">Skill points: <span class="gold-text font-bold">{{ player.skillPoints }}</span> · Learn top to bottom in each path.</p>
        <div class="grid gap-3 md:grid-cols-3">
          <div v-for="branch in branches" :key="branch.id" class="space-y-2">
            <h3 class="text-center text-sm font-bold uppercase tracking-wide" :style="{ color: branch.color }">{{ branch.label }}</h3>
            <div v-for="skill in skillsFor(branch.id)" :key="skill.id"
                 class="skill-card" :class="{ learned: player.learnedSkills.includes(skill.id), locked: !player.learnedSkills.includes(skill.id) && !canLearn(skill) }">
              <div class="skill-ico" :style="{ borderColor: branch.color }">
                <img :src="assetPath(`skill-icons/${skill.icon}.png`)" class="h-8 w-8" :alt="skill.name" @error="onImageError">
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[13px] font-bold">{{ skill.name }}</div>
                <div class="text-[11px] opacity-75">{{ skill.description }}</div>
              </div>
              <button v-if="!player.learnedSkills.includes(skill.id)" class="btn-secondary shrink-0 px-2 py-1 text-[11px]" :disabled="!canLearn(skill)" @click="player.learnSkill(skill.id)">
                {{ skill.cost }}★
              </button>
              <span v-else class="shrink-0 text-emerald-400" title="Learned">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { skillsForClass, canLearnSkill, type SkillBranch, type SkillNode } from '~/data/skills'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()

const branches: { id: SkillBranch; label: string; color: string }[] = [
  { id: 'attack', label: 'Attack', color: '#ff8a5c' },
  { id: 'defense', label: 'Defense', color: '#7fb0ff' },
  { id: 'knowledge', label: 'Knowledge', color: '#c78bff' },
]

const mySkills = computed(() => skillsForClass(player.classId))
const skillsFor = (branch: SkillBranch) => mySkills.value.filter((s) => s.branch === branch)
function canLearn(skill: SkillNode) { return canLearnSkill(skill, player.learnedSkills, player.skillPoints) }
function assetPath(path: string) {
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\/+/, '')}`
}
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }
</script>

<style scoped>
.skill-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(138, 106, 47, 0.5);
  background: rgba(0, 0, 0, 0.3);
}
.skill-card.learned { border-color: #6ee7a0; box-shadow: inset 0 0 0 1px rgba(110, 231, 160, 0.25); }
.skill-card.locked { opacity: 0.55; }
.skill-ico {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1.5px solid;
  background: #0d0a06;
}
.skill-ico img { image-rendering: auto; }
</style>
