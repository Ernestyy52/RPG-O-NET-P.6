<template>
  <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="skill-modal-title">
    <div class="pixel-window anime-window skill-window w-full max-w-4xl">
      <div class="pixel-titlebar skill-titlebar">
        <div>
          <p class="fantasy-kicker">ARCANE DISCIPLINES</p>
          <h2 id="skill-modal-title" class="gold-text font-display text-lg font-bold">{{ player.heroClass.name }} Mastery</h2>
        </div>
        <div class="flex items-center gap-3">
          <div class="skill-point-orb" :class="{ 'orb-ready': player.skillPoints > 0 }" data-testid="skill-points">
            <strong>{{ player.skillPoints }}</strong><span>SP</span>
          </div>
          <button class="icon-btn-close" aria-label="Close skills" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="pixel-window-body max-h-[84vh] overflow-y-auto p-3 sm:p-4">
        <div class="skill-tabs" role="tablist" aria-label="Skill sections">
          <button role="tab" :aria-selected="tab === 'talents'" :class="{ active: tab === 'talents' }" @click="tab = 'talents'">
            <img :src="assetPath('skill-icons/brain.png')" alt=""> Talent Ranks
            <span v-if="player.skillPoints" class="tab-badge">{{ player.skillPoints }}</span>
          </button>
          <button v-if="SKILL_LOADOUT_ENABLED" role="tab" :aria-selected="tab === 'loadout'" :class="{ active: tab === 'loadout' }" @click="tab = 'loadout'">
            <img :src="assetPath('skill-icons/swords.png')" alt=""> Combat Deck
          </button>
        </div>

        <section v-if="tab === 'talents'" class="space-y-3">
          <div class="skill-ledger">
            <div>
              <p class="font-display text-sm font-bold text-[#f4d993]">Shape your permanent strengths</p>
              <p class="text-[11px] text-[#cdbd98]">เริ่มต้น {{ STARTING_SKILL_POINTS }} แต้ม · ได้ {{ SKILL_POINTS_PER_LEVEL }} แต้มทุกเลเวล และโบนัส +1 ทุกเลเวลที่หาร {{ SKILL_POINT_MILESTONE }} ลงตัว</p>
            </div>
            <div class="text-right text-xs">
              <span class="block text-[#a99a79]">Spent</span>
              <strong class="text-[#f2c14e]">{{ spentPoints }} SP</strong>
            </div>
            <button class="btn-secondary px-3 py-1.5 text-[11px]" :disabled="!player.learnedSkills.length" data-testid="skill-reset" @click="resetTalents">Reset talents</button>
          </div>

          <p v-if="feedback" class="skill-feedback" role="status">{{ feedback }}</p>

          <div class="skill-branches">
            <article v-for="branch in branches" :key="branch.id" class="skill-branch" :style="{ '--branch': branch.color }">
              <header class="branch-header">
                <div class="branch-rune">{{ branch.rune }}</div>
                <div>
                  <h3>{{ branch.label }}</h3>
                  <p>{{ branch.subtitle }}</p>
                </div>
                <span>{{ learnedIn(branch.id) }}/4</span>
              </header>

              <div class="skill-path">
                <div
                  v-for="skill in skillsFor(branch.id)" :key="skill.id" class="skill-node"
                  :class="{ learned: player.learnedSkills.includes(skill.id), available: canLearn(skill), locked: !player.learnedSkills.includes(skill.id) && !canLearn(skill) }"
                  :data-testid="`talent-${skill.id}`"
                >
                  <span class="path-line" />
                  <div class="skill-ico">
                    <img :src="assetPath(`skill-icons/${skill.icon}.png`)" :alt="skill.name" @error="onImageError">
                    <span class="rank-medal">{{ skill.rank }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <strong class="text-[13px]">{{ skill.name }}</strong>
                      <span class="cost-chip">{{ skill.cost }} SP</span>
                    </div>
                    <p class="text-[11px] text-[#c8baa0]">{{ skill.description }}</p>
                    <p v-if="!player.learnedSkills.includes(skill.id)" class="mt-1 text-[10px]" :class="canLearn(skill) ? 'text-emerald-300' : 'text-[#8f8677]'">{{ reasonFor(skill) }}</p>
                  </div>
                  <button
                    v-if="!player.learnedSkills.includes(skill.id)" class="upgrade-btn" :disabled="!canLearn(skill)"
                    :aria-label="`Upgrade ${skill.name} for ${skill.cost} skill points`" @click="learn(skill)"
                  >Upgrade</button>
                  <span v-else class="learned-mark" title="Learned">✓</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="SKILL_LOADOUT_ENABLED" class="grid gap-3 lg:grid-cols-[.8fr_1.2fr]">
          <div class="space-y-3">
            <div class="fantasy-panel p-3">
              <h3 class="gold-text mb-2 text-sm font-bold">Advanced Job</h3>
              <p v-if="player.level < JOB_UNLOCK_LEVEL" class="text-xs opacity-70">ปลดล็อกที่ Lv. {{ JOB_UNLOCK_LEVEL }} · ตอนนี้ Lv. {{ player.level }}</p>
              <div v-else class="grid gap-2">
                <button v-for="job in jobs" :key="job.id" data-testid="job-pick" class="job-card text-left" :class="{ 'job-active': player.jobId === job.id }" @click="pickJob(job.id)">
                  <span class="block text-[13px] font-bold">{{ job.name }} <span v-if="player.jobId === job.id" class="text-emerald-400">✓</span></span>
                  <span class="block text-[11px] opacity-75">{{ job.theme }}</span>
                </button>
              </div>
            </div>

            <div class="fantasy-panel p-3">
              <h3 class="gold-text mb-2 text-sm font-bold">Preset Builds</h3>
              <div class="space-y-2">
                <div v-for="build in presets" :key="build.id" class="build-row">
                  <div class="min-w-0 flex-1"><strong class="text-[13px]">{{ build.name }}</strong><p class="text-[11px] opacity-70">{{ build.description }}</p></div>
                  <button class="shrink-0 px-2 py-1 text-[11px]" data-testid="preset-equip" :class="isEquipped(build) ? 'btn-primary' : 'btn-secondary'" @click="applyPreset(build)">{{ isEquipped(build) ? 'Equipped' : 'Equip' }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="fantasy-panel p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div><h3 class="gold-text text-sm font-bold">Custom Combat Deck</h3><p class="text-[10px] opacity-60">เรียงสกิลให้เกิดจังหวะ setup → combo → finisher</p></div>
              <div class="flex gap-2">
                <button class="btn-secondary px-2 py-1 text-[11px]" data-testid="loadout-respec" @click="doRespec">Default</button>
                <button class="btn-primary px-2 py-1 text-[11px]" data-testid="loadout-apply" :disabled="draftErrors.length > 0 || !draftDirty" @click="applyDraft">{{ draftDirty ? 'Apply deck' : 'Saved ✓' }}</button>
              </div>
            </div>

            <DeckPicker title="Active skills" :hint="`${draft.skills.length}/${LOADOUT_ACTIVE_SLOTS}`">
              <button v-for="skill in activePool" :key="skill.id" data-testid="active-chip" :data-skill-id="skill.id" class="skill-chip" :class="{ on: draft.skills.includes(skill.id) }" :title="tooltipOf(skill.id)" @click="toggleActive(skill.id)">
                <span v-if="draft.skills.includes(skill.id)" class="chip-order">{{ draft.skills.indexOf(skill.id) + 1 }}</span>{{ skill.name }}
              </button>
            </DeckPicker>
            <DeckPicker title="Ultimate" hint="Insight ✦3">
              <button v-for="skill in ultimatePool" :key="skill.id" class="skill-chip ultimate" :class="{ on: draft.ultimate === skill.id }" :title="tooltipOf(skill.id)" @click="draft.ultimate = skill.id">★ {{ skill.name }}</button>
            </DeckPicker>
            <DeckPicker title="Passives" :hint="`${draft.passives.length}/${PASSIVE_SLOTS}`">
              <button v-for="skill in passivePool" :key="skill.id" class="skill-chip passive" :class="{ on: draft.passives.includes(skill.id) }" :title="tooltipOf(skill.id)" @click="togglePassive(skill.id)">{{ skill.name }}</button>
            </DeckPicker>
            <p v-if="draftErrors.length" class="mt-2 text-[11px] text-red-300">{{ draftErrors[0] }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'
import {
  STARTING_SKILL_POINTS, SKILL_POINTS_PER_LEVEL, SKILL_POINT_MILESTONE,
  skillsForClass, canLearnSkill, skillPointsSpent, type SkillBranch, type SkillNode,
} from '~/data/skills'
import { SKILL_LOADOUT_ENABLED, JOB_UNLOCK_LEVEL, getSkillDef, jobsForClass, skillsForClass as loadoutPoolForClass, type JobId } from '~/data/combat/skillDefs'
import { buildsForClass, type BuildDef } from '~/data/combat/builds'
import { LOADOUT_ACTIVE_SLOTS, validateLoadout } from '~/data/combat/loadoutEngine'
import { STATUS_EFFECTS } from '~/data/combat/statusEffects'
import { usePlayerStore } from '~/stores/player'

const DeckPicker = defineComponent({
  props: { title: { type: String, required: true }, hint: { type: String, required: true } },
  setup(props, { slots }) { return () => h('div', { class: 'deck-picker' }, [h('div', { class: 'deck-label' }, [h('span', props.title), h('small', props.hint)]), h('div', { class: 'flex flex-wrap gap-1.5' }, slots.default?.())]) },
})

const props = defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const player = usePlayerStore()
const config = useRuntimeConfig()
const tab = ref<'loadout' | 'talents'>('talents')
const feedback = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
const PASSIVE_SLOTS = 2

const branches: { id: SkillBranch; label: string; subtitle: string; color: string; rune: string }[] = [
  { id: 'attack', label: 'Valor', subtitle: 'Power and decisive strikes', color: '#e97955', rune: 'V' },
  { id: 'defense', label: 'Aegis', subtitle: 'Survival and endurance', color: '#66a7db', rune: 'A' },
  { id: 'knowledge', label: 'Lore', subtitle: 'Insight and spellcraft', color: '#a879d8', rune: 'L' },
]
const mySkills = computed(() => skillsForClass(player.classId))
const skillsFor = (branch: SkillBranch) => mySkills.value.filter((skill) => skill.branch === branch)
const learnedIn = (branch: SkillBranch) => skillsFor(branch).filter((skill) => player.learnedSkills.includes(skill.id)).length
const spentPoints = computed(() => skillPointsSpent(player.learnedSkills))
const canLearn = (skill: SkillNode) => canLearnSkill(skill, player.learnedSkills, player.skillPoints)
function reasonFor(skill: SkillNode) {
  if (skill.rank > 1 && !player.learnedSkills.includes(`${skill.classId}_${skill.branch}_${skill.rank - 1}`)) return `Requires rank ${skill.rank - 1}`
  if (player.skillPoints < skill.cost) return `Need ${skill.cost - player.skillPoints} more SP`
  return 'Ready to upgrade'
}
function say(text: string) { feedback.value = text; if (feedbackTimer) clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => { feedback.value = '' }, 2200) }
function learn(skill: SkillNode) { if (player.learnSkill(skill.id)) say(`${skill.name} upgraded — ${skill.description}`) }
function resetTalents() { const refunded = player.resetSkillTree(); say(refunded ? `Refunded ${refunded} skill points.` : 'No talents to reset.') }

const jobs = computed(() => jobsForClass(player.classId))
const presets = computed(() => buildsForClass(player.classId))
const pool = computed(() => loadoutPoolForClass(player.classId, (player.jobId || undefined) as JobId | undefined))
const activePool = computed(() => pool.value.filter((skill) => skill.kind === 'active'))
const ultimatePool = computed(() => pool.value.filter((skill) => skill.kind === 'ultimate'))
const passivePool = computed(() => pool.value.filter((skill) => skill.kind === 'passive'))
const draft = reactive<{ skills: string[]; ultimate: string; passives: string[] }>({ skills: [], ultimate: '', passives: [] })
function syncDraft() { draft.skills = [...player.skillLoadout.skills]; draft.ultimate = player.skillLoadout.ultimate; draft.passives = [...player.skillLoadout.passives] }
watch(() => props.open, (open) => { if (open) syncDraft() }, { immediate: true })
const draftDirty = computed(() => JSON.stringify(draft) !== JSON.stringify({ skills: player.skillLoadout.skills, ultimate: player.skillLoadout.ultimate, passives: player.skillLoadout.passives }))
const draftErrors = computed(() => validateLoadout(draft.skills, draft.ultimate, draft.passives, player.classId, player.jobId || undefined))
function toggleActive(id: string) { const index = draft.skills.indexOf(id); if (index >= 0) draft.skills.splice(index, 1); else if (draft.skills.length < LOADOUT_ACTIVE_SLOTS) draft.skills.push(id) }
function togglePassive(id: string) { const index = draft.passives.indexOf(id); if (index >= 0) draft.passives.splice(index, 1); else if (draft.passives.length < PASSIVE_SLOTS) draft.passives.push(id) }
function applyDraft() { if (player.setSkillLoadout({ skills: [...draft.skills], ultimate: draft.ultimate, passives: [...draft.passives] })) { syncDraft(); say('Combat deck saved.') } }
function applyPreset(build: BuildDef) { if (player.setSkillLoadout({ skills: [...build.skills], ultimate: build.ultimate, passives: [...build.passives] })) { syncDraft(); say(`${build.name} equipped.`) } }
function isEquipped(build: BuildDef) { const loadout = player.skillLoadout; return JSON.stringify([loadout.skills, loadout.ultimate, loadout.passives]) === JSON.stringify([build.skills, build.ultimate, build.passives]) }
function doRespec() { player.respecLoadout(); syncDraft(); say('Default combat deck restored.') }
function pickJob(id: JobId) { if (player.chooseJob(id)) { syncDraft(); say('Advanced job changed.') } }
function tooltipOf(id: string) { const def = getSkillDef(id); if (!def) return id; if (def.kind === 'passive') return `${def.name} — ${def.description}`; const cost = [def.insightCost ? `${def.insightCost} Insight` : '', def.mpCost ? `${def.mpCost} MP` : ''].filter(Boolean).join(' + ') || 'Free'; const applies = def.applies?.length ? ` · ${def.applies.map((s) => STATUS_EFFECTS[s].name).join('/')}` : ''; return `${def.name} — ${def.description} [${cost} · CD ${(def.cooldownMs / 1000).toFixed(1)}s${applies}]` }
function assetPath(path: string) { const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`; return `${base}${path.replace(/^\/+/, '')}` }
function onImageError(event: Event) { (event.target as HTMLImageElement).style.visibility = 'hidden' }
</script>

<style scoped>
.skill-window { max-height: 94vh; }
.skill-titlebar { background: radial-gradient(circle at 80% 50%, rgba(113, 82, 170, .2), transparent 32%), linear-gradient(180deg, #302217, #130e0a); }
.fantasy-kicker { color: #9e8d69; font-size: 9px; font-weight: 800; letter-spacing: .22em; }
.skill-point-orb { display: grid; grid-template-columns: auto auto; align-items: baseline; gap: 3px; min-width: 52px; padding: 5px 9px; border: 1px solid #76613b; border-radius: 999px; background: #090c13; color: #a99a79; }
.skill-point-orb strong { font-size: 17px; color: #f0c765; }.skill-point-orb span { font-size: 9px; font-weight: 800; }.skill-point-orb.orb-ready { box-shadow: 0 0 14px rgba(240, 199, 101, .35), inset 0 0 12px rgba(240, 199, 101, .08); }
.skill-tabs { display: flex; gap: 5px; padding: 4px; margin-bottom: 12px; border: 1px solid #5f4a28; border-radius: 8px; background: rgba(3, 5, 10, .62); }
.skill-tabs button { position: relative; display: flex; align-items: center; justify-content: center; gap: 7px; flex: 1; min-height: 38px; border: 1px solid transparent; border-radius: 5px; color: #9e927d; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.skill-tabs button.active { border-color: #9d7a39; color: #f0dfb1; background: linear-gradient(180deg, #302313, #17100a); box-shadow: inset 0 1px rgba(255,255,255,.08); }.skill-tabs img { width: 22px; height: 22px; object-fit: contain; }.tab-badge { display: grid; place-items: center; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: #d28b31; color: #171006; font-size: 9px; }
.skill-ledger { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #6a5633; border-radius: 8px; background: linear-gradient(90deg, rgba(31,37,53,.9), rgba(14,15,22,.94)); box-shadow: inset 3px 0 #9b7a3d; }
.skill-feedback { padding: 8px 10px; border: 1px solid rgba(91, 207, 151, .45); border-radius: 6px; background: rgba(30, 90, 66, .24); color: #a7f3cf; font-size: 11px; }
.skill-branches { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.skill-branch { overflow: hidden; border: 1px solid color-mix(in srgb, var(--branch) 45%, #463a29); border-radius: 9px; background: linear-gradient(180deg, rgba(20,25,37,.96), rgba(7,9,14,.98)); box-shadow: inset 0 1px rgba(255,255,255,.04); }
.branch-header { display: grid; grid-template-columns: 32px 1fr auto; align-items: center; gap: 8px; padding: 10px; border-bottom: 1px solid color-mix(in srgb, var(--branch) 35%, transparent); background: linear-gradient(90deg, color-mix(in srgb, var(--branch) 15%, transparent), transparent); }.branch-header h3 { color: color-mix(in srgb, var(--branch) 76%, white); font-family: Cinzel, Georgia, serif; font-size: 13px; font-weight: 800; }.branch-header p { color: #948c7d; font-size: 9px; }.branch-header > span { color: #c5b993; font-size: 10px; }.branch-rune { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--branch); border-radius: 50% 50% 45% 45%; color: var(--branch); font-family: Cinzel, serif; font-weight: 900; box-shadow: 0 0 10px color-mix(in srgb, var(--branch) 28%, transparent); }
.skill-path { padding: 8px; }.skill-node { position: relative; display: flex; align-items: center; gap: 8px; min-height: 72px; padding: 7px; border: 1px solid rgba(116,101,73,.45); border-radius: 7px; background: rgba(4,6,10,.58); transition: border-color .15s, transform .15s; }.skill-node + .skill-node { margin-top: 9px; }.skill-node.available { border-color: color-mix(in srgb, var(--branch) 70%, #f0d382); box-shadow: 0 0 12px color-mix(in srgb, var(--branch) 16%, transparent); }.skill-node.learned { border-color: rgba(77,190,132,.62); background: linear-gradient(90deg, rgba(38,103,75,.2), rgba(4,6,10,.7)); }.skill-node.locked { opacity: .63; }.path-line { position: absolute; left: 28px; top: -10px; width: 2px; height: 9px; background: color-mix(in srgb, var(--branch) 55%, #29231b); }.skill-node:first-child .path-line { display: none; }
.skill-ico { position: relative; display: grid; place-items: center; flex: 0 0 42px; height: 42px; border: 1px solid color-mix(in srgb, var(--branch) 72%, #6c5c43); border-radius: 9px; background: radial-gradient(circle, color-mix(in srgb, var(--branch) 17%, transparent), #07090d 68%); }.skill-ico img { width: 32px; height: 32px; object-fit: contain; }.rank-medal { position: absolute; right: -5px; bottom: -5px; display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #aa8746; border-radius: 50%; background: #17110a; color: #f2c14e; font-size: 8px; font-weight: 900; }.cost-chip { color: #b9a66f; font-size: 9px; white-space: nowrap; }
.upgrade-btn { flex: 0 0 auto; padding: 5px 7px; border: 1px solid #e4bd60; border-radius: 5px; background: linear-gradient(180deg, #dfad4e, #8c5520); color: #170e06; font-size: 9px; font-weight: 900; text-transform: uppercase; box-shadow: 0 2px #311b07; }.upgrade-btn:disabled { border-color: #514a3d; background: #191a1e; color: #777166; box-shadow: none; }.learned-mark { display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid #4bbe84; border-radius: 50%; color: #7ce7aa; background: rgba(35,96,68,.35); }
.fantasy-panel { border: 1px solid #685334; border-radius: 8px; background: linear-gradient(180deg, rgba(30,31,42,.94), rgba(9,10,15,.97)); box-shadow: inset 0 1px rgba(255,255,255,.04); }.job-card,.build-row { border: 1px solid rgba(121,101,66,.55); border-radius: 6px; background: rgba(3,5,8,.52); padding: 8px; }.job-card:hover,.job-active { border-color: #d1aa58; }.build-row { display: flex; align-items: flex-start; gap: 8px; }.deck-picker { padding: 10px 0; border-top: 1px solid rgba(121,101,66,.36); }.deck-label { display: flex; justify-content: space-between; margin-bottom: 6px; color: #e3d4ad; font-size: 11px; font-weight: 800; }.deck-label small { color: #9f916f; }.skill-chip { position: relative; padding: 5px 8px; border: 1px solid #65583e; border-radius: 5px; background: #10131b; color: #bcb29f; font-size: 10px; }.skill-chip.on { border-color: #d7ae55; color: #f1d88f; box-shadow: inset 0 0 10px rgba(215,174,85,.12); }.skill-chip.ultimate.on { border-color: #b785e3; color: #e0c3fa; }.skill-chip.passive.on { border-color: #68a8de; color: #baddfa; }.chip-order { display: inline-grid; place-items: center; width: 15px; height: 15px; margin-right: 4px; border-radius: 50%; background: #b67a2b; color: #140d05; font-size: 8px; font-weight: 900; }
@media (max-width: 760px) { .skill-branches { grid-template-columns: 1fr; }.skill-ledger { grid-template-columns: 1fr auto; }.skill-ledger button { grid-column: 1 / -1; }.skill-node { min-height: 68px; }.upgrade-btn { padding-inline: 9px; } }
</style>
