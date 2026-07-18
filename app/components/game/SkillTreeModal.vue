<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
    <div class="pixel-window w-full max-w-3xl">
      <div class="pixel-titlebar">
        <h2 class="gold-text text-lg font-bold">{{ player.heroClass.name }} Skills</h2>
        <button class="icon-btn-close" aria-label="Close" @click="$emit('close')">✕</button>
      </div>
      <div class="pixel-window-body max-h-[82vh] overflow-y-auto p-4">
        <!-- Tabs ปรากฏเมื่อระบบ loadout (Master Plan Phase 4) เปิดเท่านั้น — flag off = หน้า tree เดิมล้วน -->
        <div v-if="SKILL_LOADOUT_ENABLED" class="mb-3 flex gap-2">
          <button class="px-3 py-1 text-xs font-bold uppercase tracking-wide" :class="tab === 'loadout' ? 'btn-primary' : 'btn-secondary opacity-70'" @click="tab = 'loadout'">Loadout</button>
          <button class="px-3 py-1 text-xs font-bold uppercase tracking-wide" :class="tab === 'talents' ? 'btn-primary' : 'btn-secondary opacity-70'" @click="tab = 'talents'">Talents</button>
        </div>

        <!-- ============================ LOADOUT TAB ============================ -->
        <div v-if="SKILL_LOADOUT_ENABLED && tab === 'loadout'" class="space-y-3">
          <!-- Advanced Job -->
          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Advanced Job</h3>
            <p v-if="player.level < JOB_UNLOCK_LEVEL" class="text-xs opacity-70">
              ปลดล็อกที่ Lv. {{ JOB_UNLOCK_LEVEL }} (ตอนนี้ Lv. {{ player.level }}) — อาชีพขั้นสูงเพิ่มสกิลใหม่ 4 active + 2 passive เข้า pool
            </p>
            <div v-else class="grid gap-2 sm:grid-cols-2">
              <button
                v-for="job in jobs" :key="job.id" data-testid="job-pick"
                class="job-card text-left" :class="{ 'job-active': player.jobId === job.id }"
                @click="pickJob(job.id)"
              >
                <span class="block text-[13px] font-bold">{{ job.name }} <span v-if="player.jobId === job.id" class="text-emerald-400">✓</span></span>
                <span class="block text-[11px] opacity-75">{{ job.theme }}</span>
              </button>
            </div>
            <p v-if="player.level >= JOB_UNLOCK_LEVEL" class="mt-1 text-[10px] opacity-60">
              เปลี่ยนอาชีพได้เสมอ ไม่มีค่าปรับ — ถ้า loadout เดิมถือสกิลของอาชีพเก่า ระบบจะถอยกลับ preset ให้อัตโนมัติ
            </p>
          </div>

          <!-- Preset builds -->
          <div class="glass-panel p-3">
            <h3 class="gold-text mb-2 text-sm font-bold">Preset Builds</h3>
            <div class="space-y-2">
              <div v-for="b in presets" :key="b.id" class="build-row">
                <div class="min-w-0 flex-1">
                  <div class="text-[13px] font-bold">{{ b.name }}</div>
                  <div class="text-[11px] opacity-75">{{ b.description }}</div>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <span v-for="sid in [...b.skills, b.ultimate]" :key="sid" class="chip" :class="{ 'chip-ult': sid === b.ultimate }" :title="tooltipOf(sid)">{{ nameOf(sid) }}</span>
                    <span v-for="pid in b.passives" :key="pid" class="chip chip-passive" :title="tooltipOf(pid)">{{ nameOf(pid) }}</span>
                  </div>
                </div>
                <button class="shrink-0 px-2 py-1 text-[11px]" data-testid="preset-equip" :class="isEquipped(b) ? 'btn-primary' : 'btn-secondary'" @click="applyPreset(b)">
                  {{ isEquipped(b) ? 'Equipped ✓' : 'Equip' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Custom loadout editor -->
          <div class="glass-panel p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="gold-text text-sm font-bold">Custom Loadout</h3>
              <div class="flex gap-2">
                <button class="btn-secondary px-2 py-1 text-[11px]" data-testid="loadout-respec" title="กลับ preset แรกของคลาส" @click="doRespec">Respec</button>
                <button class="btn-primary px-2 py-1 text-[11px]" data-testid="loadout-apply" :disabled="draftErrors.length > 0 || !draftDirty" @click="applyDraft">
                  {{ draftDirty ? 'Apply' : 'Saved ✓' }}
                </button>
              </div>
            </div>

            <p class="mb-1 text-[11px] opacity-75">Active skills — เลือก {{ LOADOUT_ACTIVE_SLOTS }} ช่อง (ลำดับ = ลำดับ auto-strike เมื่อตอบถูก): <span class="gold-text font-bold">{{ draft.skills.length }}/{{ LOADOUT_ACTIVE_SLOTS }}</span></p>
            <div class="mb-2 flex flex-wrap gap-1">
              <button
                v-for="s in activePool" :key="s.id" data-testid="active-chip" :data-skill-id="s.id"
                class="chip chip-btn" :class="{ 'chip-on': draft.skills.includes(s.id) }"
                :title="tooltipOf(s.id)" @click="toggleActive(s.id)"
              >
                <span v-if="draft.skills.includes(s.id)" class="mr-0.5 text-amber-300">{{ draft.skills.indexOf(s.id) + 1 }}</span>{{ s.name }}<span v-if="s.jobId" class="opacity-60"> ◆</span>
              </button>
            </div>

            <p class="mb-1 text-[11px] opacity-75">Ultimate (ใช้เมื่อ Insight เต็ม ✦3)</p>
            <div class="mb-2 flex flex-wrap gap-1">
              <button
                v-for="s in ultimatePool" :key="s.id"
                class="chip chip-btn" :class="{ 'chip-on chip-ult': draft.ultimate === s.id }"
                :title="tooltipOf(s.id)" @click="draft.ultimate = s.id"
              >★ {{ s.name }}</button>
            </div>

            <p class="mb-1 text-[11px] opacity-75">Passives — เลือกได้ {{ PASSIVE_SLOTS }} ช่อง: <span class="gold-text font-bold">{{ draft.passives.length }}/{{ PASSIVE_SLOTS }}</span></p>
            <div class="mb-2 flex flex-wrap gap-1">
              <button
                v-for="s in passivePool" :key="s.id"
                class="chip chip-btn" :class="{ 'chip-on chip-passive': draft.passives.includes(s.id) }"
                :title="tooltipOf(s.id)" @click="togglePassive(s.id)"
              >{{ s.name }}<span v-if="s.jobId" class="opacity-60"> ◆</span></button>
            </div>

            <p v-if="draftErrors.length" class="text-[11px] text-red-300">{{ draftErrors[0] }}</p>
            <p class="text-[10px] opacity-60">◆ = สกิลจากอาชีพขั้นสูง · hover/แตะค้างเพื่อดูรายละเอียดสกิล</p>
          </div>
        </div>

        <!-- ============================ TALENTS TAB (legacy skill tree) ============================ -->
        <div v-else>
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { skillsForClass, canLearnSkill, type SkillBranch, type SkillNode } from '~/data/skills'
import {
  SKILL_LOADOUT_ENABLED, JOB_UNLOCK_LEVEL, getSkillDef, jobsForClass,
  skillsForClass as loadoutPoolForClass, type JobId,
} from '~/data/combat/skillDefs'
import { buildsForClass, type BuildDef } from '~/data/combat/builds'
import { LOADOUT_ACTIVE_SLOTS, validateLoadout } from '~/data/combat/loadoutEngine'
import { STATUS_EFFECTS } from '~/data/combat/statusEffects'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()

const tab = ref<'loadout' | 'talents'>(SKILL_LOADOUT_ENABLED ? 'loadout' : 'talents')

// ---- Loadout tab (Master Plan Phase 4 Batch C) ----
// UI cap 2 passives = ให้เท่ากับ preset/balance sim (validateLoadout เองไม่จำกัด แต่ UI คุมความแฟร์)
const PASSIVE_SLOTS = 2

const jobs = computed(() => jobsForClass(player.classId))
const presets = computed(() => buildsForClass(player.classId))
const pool = computed(() => loadoutPoolForClass(player.classId, (player.jobId || undefined) as JobId | undefined))
const activePool = computed(() => pool.value.filter((s) => s.kind === 'active'))
const ultimatePool = computed(() => pool.value.filter((s) => s.kind === 'ultimate'))
const passivePool = computed(() => pool.value.filter((s) => s.kind === 'passive'))

const draft = reactive<{ skills: string[]; ultimate: string; passives: string[] }>({ skills: [], ultimate: '', passives: [] })
function syncDraft() {
  draft.skills = [...player.skillLoadout.skills]
  draft.ultimate = player.skillLoadout.ultimate
  draft.passives = [...player.skillLoadout.passives]
}
watch(() => props.open, (o) => { if (o) syncDraft() }, { immediate: true })

const draftDirty = computed(() =>
  JSON.stringify(draft) !== JSON.stringify({ skills: player.skillLoadout.skills, ultimate: player.skillLoadout.ultimate, passives: player.skillLoadout.passives }))
const draftErrors = computed(() =>
  validateLoadout(draft.skills, draft.ultimate, draft.passives, player.classId, player.jobId || undefined))

function toggleActive(id: string) {
  const i = draft.skills.indexOf(id)
  if (i >= 0) draft.skills.splice(i, 1)
  else if (draft.skills.length < LOADOUT_ACTIVE_SLOTS) draft.skills.push(id)
}
function togglePassive(id: string) {
  const i = draft.passives.indexOf(id)
  if (i >= 0) draft.passives.splice(i, 1)
  else if (draft.passives.length < PASSIVE_SLOTS) draft.passives.push(id)
}
function applyDraft() {
  if (player.setSkillLoadout({ skills: [...draft.skills], ultimate: draft.ultimate, passives: [...draft.passives] })) syncDraft()
}
function applyPreset(b: BuildDef) {
  if (player.setSkillLoadout({ skills: [...b.skills], ultimate: b.ultimate, passives: [...b.passives] })) syncDraft()
}
function isEquipped(b: BuildDef) {
  const lo = player.skillLoadout
  return JSON.stringify([lo.skills, lo.ultimate, lo.passives]) === JSON.stringify([b.skills, b.ultimate, b.passives])
}
function doRespec() {
  player.respecLoadout()
  syncDraft()
}
function pickJob(id: JobId) {
  if (player.chooseJob(id)) syncDraft() // chooseJob อาจ respec loadout ให้ — ดึง draft ตาม
}

const nameOf = (id: string) => getSkillDef(id)?.name ?? id
function tooltipOf(id: string): string {
  const def = getSkillDef(id)
  if (!def) return id
  if (def.kind === 'passive') return `${def.name} — ${def.description}`
  const cost = [def.insightCost ? `${def.insightCost} Insight` : '', def.mpCost ? `${def.mpCost} MP` : ''].filter(Boolean).join(' + ') || 'Free'
  const applies = def.applies?.length ? ` · Applies ${def.applies.map((s) => STATUS_EFFECTS[s].name).join('/')}` : ''
  const combo = def.consumes?.length ? ` · Combo: consumes ${def.consumes.map((s) => STATUS_EFFECTS[s].name).join('/')}` : ''
  return `${def.name} — ${def.description} [${cost} · CD ${(def.cooldownMs / 1000).toFixed(1)}s${applies}${combo}]`
}

// ---- Talents tab (legacy tree — unchanged behaviour) ----
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

/* ---- Loadout tab ---- */
.job-card {
  border: 1px solid rgba(138, 106, 47, 0.5);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 10px;
}
.job-card:hover { border-color: #c9a25a; }
.job-active { border-color: #6ee7a0; box-shadow: inset 0 0 0 1px rgba(110, 231, 160, 0.25); }
.build-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(138, 106, 47, 0.5);
  background: rgba(0, 0, 0, 0.3);
}
.chip {
  display: inline-block;
  border: 1px solid rgba(138, 106, 47, 0.6);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.35);
}
.chip-btn { cursor: pointer; }
.chip-btn:hover { border-color: #c9a25a; }
.chip-on { border-color: #ffd879; color: #ffd879; box-shadow: inset 0 0 0 1px rgba(255, 216, 121, 0.3); }
.chip-ult { border-color: #c78bff; color: #dfc2ff; }
.chip-passive { border-color: #7fb0ff; color: #b8d2ff; }
</style>
