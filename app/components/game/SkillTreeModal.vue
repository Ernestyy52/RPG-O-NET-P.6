<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-3xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">Guild Skill Tree</h2>
        <button class="text-[#eadfc8] hover:text-white" @click="$emit('close')">x</button>
      </div>
      <div class="grid gap-3 p-4 md:grid-cols-3">
        <div v-for="branch in branches" :key="branch" class="space-y-2">
          <h3 class="font-bold capitalize">{{ branch }}</h3>
          <div v-for="skill in skillsFor(branch)" :key="skill.id" class="glass-panel p-3">
            <div class="font-bold">{{ skill.rank }}. {{ skill.name }}</div>
            <p class="text-xs opacity-75">{{ skill.description }}</p>
            <button class="btn-secondary mt-2 w-full text-xs" :disabled="!canLearn(skill.id)" @click="player.learnSkill(skill.id)">
              {{ player.learnedSkills.includes(skill.id) ? 'Learned' : `Learn (${skill.cost})` }}
            </button>
          </div>
        </div>
        <p class="md:col-span-3 text-sm">Skill points: {{ player.skillPoints }}. Branches are Attack, Defense, and Knowledge.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SKILL_TREE, type SkillBranch } from '~/data/skills'
import { usePlayerStore } from '~/stores/player'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const branches: SkillBranch[] = ['attack', 'defense', 'knowledge']
const skillsFor = (branch: SkillBranch) => SKILL_TREE.filter((skill) => skill.branch === branch)
function canLearn(id: string) {
  const skill = SKILL_TREE.find((node) => node.id === id)
  if (!skill || player.learnedSkills.includes(id) || player.skillPoints < skill.cost) return false
  return skill.rank === 1 || player.learnedSkills.includes(`${skill.branch}_${skill.rank - 1}`)
}
</script>
