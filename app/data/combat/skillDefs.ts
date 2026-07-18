// ================================================================================================
// Data-driven skill definitions (Master Plan Phase 4)
//
// ต่อ base class: 6 active + 3 passive + 1 ultimate; ต่อ advanced job (คลาสละ 2): 4 active + 2 passive
// รวม 4×10 + 8×6 = 88 สกิล — ตัวเลข/สถานะ/คอมโบทั้งหมดเป็น data; engine (loadoutEngine.ts) ตีความ
//
// กติกา learning-gate (สืบทอด P0.5): ทุกสกิลที่มีส่วน damage ต้องมี insightCost ≥ 1 (ultimate = 3)
// — ไม่มีทางสร้างดาเมจโดยไม่ตอบคำถาม; utility (ward/heal/mp) ใช้ได้โดยไม่ใช้ Insight
// validateSkillDefs() บังคับกติกานี้ + ครบ icon/vfx/sfx/anim key ทุกสกิล (test/skill-defs.spec.ts)
// ================================================================================================
import type { HeroClassId } from '~/data/classes'
import type { StatusId } from './statusEffects'

/** Rollback flag (Phase 4): เปิด loadout engine 5+1 ใน World-1 realtime; false ⇒ class-kit 3 ปุ่มเดิม */
export const SKILL_LOADOUT_ENABLED = true

export type SkillRole = 'generator' | 'spender' | 'opener' | 'extender' | 'finisher' | 'defense' | 'support'
export type SkillKind = 'active' | 'passive' | 'ultimate'
export type JobId =
  | 'berserker' | 'warmaster'
  | 'stormcaller' | 'lorekeeper'
  | 'sharpshooter' | 'trickster'
  | 'bulwark' | 'lightwarden'

export type SkillEffect =
  | { kind: 'damage'; mult: number; executeBelowPct?: number; executeMult?: number }
  | { kind: 'apply'; status: StatusId; ms: number; magnitude: number }
  | { kind: 'consume'; status: StatusId; bonus: SkillEffect }
  | { kind: 'heal'; base: number }
  | { kind: 'ward'; incomingMult: number; hits: number }
  | { kind: 'mp'; amount: number }
  | { kind: 'combo'; delta: number }
  | { kind: 'stagger'; ms: number }

export type PassiveHook =
  | 'outgoing-mult' | 'incoming-mult' | 'heal-mult' | 'mp-per-answer'
  | 'insight-cap' | 'status-duration-mult' | 'cooldown-mult'

export interface SkillDef {
  id: string
  classId: HeroClassId
  jobId?: JobId
  kind: SkillKind
  role: SkillRole
  name: string
  description: string
  insightCost: number
  mpCost: number
  cooldownMs: number
  tags: string[]
  applies?: StatusId[]
  consumes?: StatusId[]
  effects: SkillEffect[]
  /** passive เท่านั้น */
  passive?: { hook: PassiveHook; value: number }
  animationKey: string
  iconKey: string
  vfxKey: string
  sfxKey: string
}

// ---- compact row builders ----
type ARow = [id: string, role: SkillRole, name: string, desc: string, insight: number, mp: number,
  cdMs: number, tags: string[], effects: SkillEffect[], icon: string]
type PRow = [id: string, name: string, desc: string, hook: PassiveHook, value: number, icon: string]

const dmgOf = (e: SkillEffect[]): boolean => e.some((x) =>
  x.kind === 'damage' || (x.kind === 'consume' && (x.bonus.kind === 'damage')))

function active(classId: HeroClassId, jobId: JobId | undefined, kind: SkillKind, r: ARow): SkillDef {
  const [id, role, name, description, insightCost, mpCost, cooldownMs, tags, effects, iconKey] = r
  return {
    id, classId, jobId, kind, role, name, description, insightCost, mpCost, cooldownMs, tags,
    applies: effects.flatMap((e) => (e.kind === 'apply' ? [e.status] : [])),
    consumes: effects.flatMap((e) => (e.kind === 'consume' ? [e.status] : [])),
    effects,
    animationKey: `anim_${id}`, iconKey, vfxKey: `vfx_${classId}_${role}`, sfxKey: `sfx_${role}`,
  }
}
function passive(classId: HeroClassId, jobId: JobId | undefined, r: PRow): SkillDef {
  const [id, name, description, hook, value, iconKey] = r
  return {
    id, classId, jobId, kind: 'passive', role: 'support', name, description,
    insightCost: 0, mpCost: 0, cooldownMs: 0, tags: ['passive'], effects: [],
    passive: { hook, value },
    animationKey: 'anim_passive', iconKey, vfxKey: 'vfx_passive', sfxKey: 'sfx_passive',
  }
}

// ================================================================================================
// BASE CLASS KITS — 6 active + 1 ultimate + 3 passive ต่อคลาส
// ================================================================================================
const BASE: SkillDef[] = [
  // ---- WARRIOR: เลือดและโมเมนตัม (bleed → rampage) ----
  active('warrior', undefined, 'active', ['war_crush', 'spender', 'Crushing Blow', 'A heavy overhead swing.', 1, 0, 900, ['melee'], [{ kind: 'damage', mult: 1.45 }], 'sword']),
  active('warrior', undefined, 'active', ['war_rend', 'opener', 'Rending Slash', 'Tear the foe open — it bleeds over time.', 1, 2, 1600, ['melee', 'dot'], [{ kind: 'damage', mult: 0.85 }, { kind: 'apply', status: 'bleed', ms: 6000, magnitude: 0.35 }], 'cleave']),
  active('warrior', undefined, 'active', ['war_rampage', 'extender', 'Rampage', 'Savage follow-up — devastating against bleeding foes.', 1, 3, 2000, ['melee', 'combo'], [{ kind: 'damage', mult: 0.9 }, { kind: 'consume', status: 'bleed', bonus: { kind: 'damage', mult: 1.1 } }], 'swords']),
  active('warrior', undefined, 'active', ['war_execute', 'finisher', 'Execute', 'Finish a weakened enemy.', 1, 4, 2600, ['melee', 'execute'], [{ kind: 'damage', mult: 1.1, executeBelowPct: 35, executeMult: 2.1 }], 'greatsword']),
  active('warrior', undefined, 'active', ['war_cry', 'generator', 'War Cry', 'Rally yourself — restore MP and build combo.', 0, 0, 6000, ['shout', 'tempo'], [{ kind: 'mp', amount: 5 }, { kind: 'combo', delta: 1 }], 'brain']),
  active('warrior', undefined, 'active', ['war_slam', 'defense', 'Shield Wall', 'Raise the shield — blunt the next two hits.', 0, 4, 3500, ['guard'], [{ kind: 'ward', incomingMult: 0.45, hits: 2 }], 'shield']),
  active('warrior', undefined, 'ultimate', ['war_ult', 'finisher', 'Titan Breaker', 'An earth-shattering blow that staggers the foe.', 3, 6, 12000, ['melee', 'ultimate'], [{ kind: 'damage', mult: 3.1 }, { kind: 'stagger', ms: 1800 }], 'greatsword']),
  passive('warrior', undefined, ['war_p_bloodlust', 'Bloodlust', '+8% damage dealt.', 'outgoing-mult', 1.08, 'swords']),
  passive('warrior', undefined, ['war_p_hide', 'Thick Hide', '-8% damage taken.', 'incoming-mult', 0.92, 'armor']),
  passive('warrior', undefined, ['war_p_meditate', 'Battle Meditation', '+1 MP per correct answer.', 'mp-per-answer', 1, 'book']),

  // ---- MAGE: ธาตุไฟ/น้ำแข็ง (burn → combustion, chill คุมจังหวะ) ----
  active('mage', undefined, 'active', ['mag_bolt', 'opener', 'Firebolt', 'Ignite the enemy — burns over time.', 1, 3, 1200, ['spell', 'fire', 'dot'], [{ kind: 'damage', mult: 0.95 }, { kind: 'apply', status: 'burn', ms: 6000, magnitude: 0.3 }], 'fire']),
  active('mage', undefined, 'active', ['mag_lance', 'opener', 'Ice Lance', 'Chill the enemy, slowing its attacks.', 1, 3, 1400, ['spell', 'ice', 'control'], [{ kind: 'damage', mult: 1.2 }, { kind: 'apply', status: 'chill', ms: 5000, magnitude: 1 }], 'ice']),
  active('mage', undefined, 'active', ['mag_combust', 'extender', 'Combustion', 'Detonate the flames — huge damage on burning foes.', 1, 5, 2200, ['spell', 'fire', 'combo'], [{ kind: 'damage', mult: 0.8 }, { kind: 'consume', status: 'burn', bonus: { kind: 'damage', mult: 1.5 } }], 'orb']),
  active('mage', undefined, 'active', ['mag_blast', 'spender', 'Mind Blast', 'A focused psychic strike.', 1, 4, 1600, ['spell'], [{ kind: 'damage', mult: 1.55 }], 'wand']),
  active('mage', undefined, 'active', ['mag_surge', 'generator', 'Arcane Surge', 'Draw in mana and sharpen focus.', 0, 0, 6000, ['spell', 'tempo'], [{ kind: 'mp', amount: 8 }, { kind: 'combo', delta: 1 }], 'scroll']),
  active('mage', undefined, 'active', ['mag_nova', 'defense', 'Frost Nova', 'Freeze the air — the foe hesitates; you gain a ward.', 0, 6, 4500, ['spell', 'ice', 'guard'], [{ kind: 'stagger', ms: 2000 }, { kind: 'ward', incomingMult: 0.35, hits: 1 }], 'ward']),
  active('mage', undefined, 'ultimate', ['mag_ult', 'finisher', 'Elemental Storm', 'Fire and frost in one cataclysm.', 3, 8, 12000, ['spell', 'ultimate'], [{ kind: 'damage', mult: 2.5 }, { kind: 'apply', status: 'burn', ms: 6000, magnitude: 0.4 }, { kind: 'apply', status: 'chill', ms: 5000, magnitude: 1 }], 'orb']),
  passive('mage', undefined, ['mag_p_pyro', 'Pyromancer', 'Status effects last 30% longer.', 'status-duration-mult', 1.3, 'fire']),
  passive('mage', undefined, ['mag_p_font', 'Mana Font', '+2 MP per correct answer.', 'mp-per-answer', 2, 'book']),
  passive('mage', undefined, ['mag_p_ward', 'Woven Ward', 'Healing received +25%.', 'heal-mult', 1.25, 'ward']),

  // ---- ARCHER: จังหวะเร็ว + จุดอ่อน (expose → pierce) ----
  active('archer', undefined, 'active', ['arc_quick', 'spender', 'Quick Shot', 'A fast arrow on a very short cooldown.', 1, 0, 450, ['ranged', 'tempo'], [{ kind: 'damage', mult: 0.9 }], 'arrow']),
  active('archer', undefined, 'active', ['arc_mark', 'opener', "Hunter's Mark", 'Expose a weak point — the next hit strikes true.', 0, 3, 3000, ['ranged', 'setup'], [{ kind: 'apply', status: 'expose', ms: 6000, magnitude: 1.5 }], 'book']),
  active('archer', undefined, 'active', ['arc_barbed', 'opener', 'Barbed Arrow', 'A cruel barb that keeps cutting.', 1, 2, 1800, ['ranged', 'dot'], [{ kind: 'damage', mult: 0.8 }, { kind: 'apply', status: 'bleed', ms: 6000, magnitude: 0.45 }], 'bow']),
  active('archer', undefined, 'active', ['arc_pierce', 'finisher', 'Piercing Shot', 'Drive through the exposed gap.', 1, 4, 2200, ['ranged', 'combo'], [{ kind: 'damage', mult: 1.2 }, { kind: 'consume', status: 'expose', bonus: { kind: 'damage', mult: 0.9 } }], 'arrow']),
  active('archer', undefined, 'active', ['arc_focus', 'generator', 'Focus Draw', 'Steady breath — recover focus.', 0, 0, 5000, ['tempo'], [{ kind: 'mp', amount: 4 }, { kind: 'combo', delta: 1 }], 'quill']),
  active('archer', undefined, 'active', ['arc_tumble', 'defense', 'Tumble', 'Roll aside — the next hit barely grazes.', 0, 5, 4500, ['guard', 'mobility'], [{ kind: 'ward', incomingMult: 0.25, hits: 1 }], 'boots']),
  active('archer', undefined, 'ultimate', ['arc_ult', 'finisher', 'Arrow Tempest', 'A storm of arrows blots out the sky.', 3, 6, 12000, ['ranged', 'ultimate'], [{ kind: 'damage', mult: 2.7 }, { kind: 'apply', status: 'expose', ms: 5000, magnitude: 1.4 }], 'bow']),
  passive('archer', undefined, ['arc_p_fleet', 'Fleet Hands', 'Skill cooldowns -10%.', 'cooldown-mult', 0.9, 'wings']),
  passive('archer', undefined, ['arc_p_keen', 'Keen Quiver', '+6% damage dealt.', 'outgoing-mult', 1.06, 'arrow']),
  passive('archer', undefined, ['arc_p_scout', 'Scout Rations', '+1 MP per correct answer.', 'mp-per-answer', 1, 'book']),

  // ---- GUARDIAN: ปราการ + ศักดิ์สิทธิ์ (expose ผ่าน sunder → judgement) ----
  active('guardian', undefined, 'active', ['gua_bash', 'spender', 'Shield Bash', 'A sturdy blow with the shield edge.', 1, 0, 850, ['melee'], [{ kind: 'damage', mult: 1.6 }], 'shield']),
  active('guardian', undefined, 'active', ['gua_sunder', 'opener', 'Sunder', 'Crack the armor — the foe stands exposed.', 1, 3, 2400, ['melee', 'setup'], [{ kind: 'damage', mult: 1.0 }, { kind: 'apply', status: 'expose', ms: 6000, magnitude: 1.4 }], 'cleave']),
  active('guardian', undefined, 'active', ['gua_judge', 'finisher', 'Judgement', 'Strike the exposed with radiant force.', 1, 4, 2400, ['melee', 'combo'], [{ kind: 'damage', mult: 1.55 }, { kind: 'consume', status: 'expose', bonus: { kind: 'damage', mult: 1.3 } }], 'tower_shield']),
  active('guardian', undefined, 'active', ['gua_fortify', 'defense', 'Fortress', 'Plant the shield — heavy mitigation for two hits.', 0, 6, 4000, ['guard'], [{ kind: 'ward', incomingMult: 0.35, hits: 2 }], 'tower_shield']),
  active('guardian', undefined, 'active', ['gua_consecrate', 'support', 'Consecrate', 'Holy ground mends your wounds over time.', 0, 6, 6000, ['holy', 'sustain'], [{ kind: 'apply', status: 'regen', ms: 6000, magnitude: 4 }], 'ward']),
  active('guardian', undefined, 'active', ['gua_vigil', 'generator', 'Vigilance', 'Watchful stance — recover and prepare.', 0, 0, 6000, ['tempo'], [{ kind: 'mp', amount: 5 }, { kind: 'combo', delta: 1 }], 'helm']),
  active('guardian', undefined, 'ultimate', ['gua_ult', 'finisher', 'Aegis Wrath', 'The bulwark answers — damage and an unbreakable ward.', 3, 6, 12000, ['holy', 'ultimate'], [{ kind: 'damage', mult: 2.8 }, { kind: 'ward', incomingMult: 0.25, hits: 2 }], 'tower_shield']),
  passive('guardian', undefined, ['gua_p_stalwart', 'Stalwart', '-12% damage taken.', 'incoming-mult', 0.88, 'armor']),
  passive('guardian', undefined, ['gua_p_vigil', 'Quiet Vigil', 'Healing received +20%.', 'heal-mult', 1.2, 'ward']),
  passive('guardian', undefined, ['gua_p_resolve', 'Deep Resolve', 'Insight cap +1 (bank more correct answers).', 'insight-cap', 1, 'brain']),
]

// ================================================================================================
// ADVANCED JOBS — คลาสละ 2 อาชีพ อาชีพละ 4 active + 2 passive (ปลดล็อกเลเวล 15)
// ================================================================================================
export const JOB_UNLOCK_LEVEL = 15
export interface JobDef { id: JobId; classId: HeroClassId; name: string; theme: string }
export const JOBS: JobDef[] = [
  { id: 'berserker', classId: 'warrior', name: 'Berserker', theme: 'All-out offense — trade safety for fury.' },
  { id: 'warmaster', classId: 'warrior', name: 'Warmaster', theme: 'Discipline — bleed control and counter-tempo.' },
  { id: 'stormcaller', classId: 'mage', name: 'Stormcaller', theme: 'Lightning burst and stunning force.' },
  { id: 'lorekeeper', classId: 'mage', name: 'Lorekeeper', theme: 'Knowledge itself becomes power.' },
  { id: 'sharpshooter', classId: 'archer', name: 'Sharpshooter', theme: 'One perfect shot at the perfect moment.' },
  { id: 'trickster', classId: 'archer', name: 'Trickster', theme: 'Never there when the blow lands.' },
  { id: 'bulwark', classId: 'guardian', name: 'Bulwark', theme: 'The wall that outlasts everything.' },
  { id: 'lightwarden', classId: 'guardian', name: 'Lightwarden', theme: 'Radiant mending and righteous wrath.' },
]

const JOB_SKILLS: SkillDef[] = [
  // Berserker — ดาเมจสุดทาง
  active('warrior', 'berserker', 'active', ['brk_frenzy', 'spender', 'Frenzied Blows', 'A flurry of reckless strikes.', 1, 2, 700, ['melee'], [{ kind: 'damage', mult: 1.3 }], 'swords']),
  active('warrior', 'berserker', 'active', ['brk_gash', 'opener', 'Savage Gash', 'A deep wound that bleeds hard.', 1, 3, 1800, ['melee', 'dot'], [{ kind: 'damage', mult: 0.8 }, { kind: 'apply', status: 'bleed', ms: 7000, magnitude: 0.45 }], 'cleave']),
  active('warrior', 'berserker', 'active', ['brk_carnage', 'extender', 'Carnage', 'Feed on the bleeding — massive follow-up.', 1, 4, 2200, ['melee', 'combo'], [{ kind: 'damage', mult: 1.0 }, { kind: 'consume', status: 'bleed', bonus: { kind: 'damage', mult: 1.4 } }], 'greatsword']),
  active('warrior', 'berserker', 'active', ['brk_roar', 'generator', 'Blood Roar', 'A terrifying roar — momentum surges.', 0, 0, 5500, ['shout', 'tempo'], [{ kind: 'combo', delta: 2 }], 'brain']),
  passive('warrior', 'berserker', ['brk_p_fury', 'Fury', '+14% damage dealt.', 'outgoing-mult', 1.14, 'swords']),
  passive('warrior', 'berserker', ['brk_p_thin', 'Reckless', '+8% damage taken (the price of fury).', 'incoming-mult', 1.08, 'cleave']),

  // Warmaster — คุมจังหวะ
  active('warrior', 'warmaster', 'active', ['wm_precision', 'spender', 'Precision Cut', 'A measured, efficient strike.', 1, 0, 850, ['melee'], [{ kind: 'damage', mult: 1.35 }], 'sword']),
  active('warrior', 'warmaster', 'active', ['wm_hamstring', 'opener', 'Hamstring', 'Slow the foe with a low cut.', 1, 3, 2000, ['melee', 'control'], [{ kind: 'damage', mult: 0.7 }, { kind: 'apply', status: 'chill', ms: 5000, magnitude: 1 }], 'dagger']),
  active('warrior', 'warmaster', 'active', ['wm_riposte', 'defense', 'Riposte', 'Guard and answer in one motion.', 1, 4, 3200, ['melee', 'guard'], [{ kind: 'damage', mult: 0.8 }, { kind: 'ward', incomingMult: 0.45, hits: 1 }], 'shield']),
  active('warrior', 'warmaster', 'active', ['wm_standard', 'support', 'Battle Standard', 'Plant the standard — steady recovery.', 0, 5, 6000, ['sustain'], [{ kind: 'apply', status: 'regen', ms: 6000, magnitude: 3 }, { kind: 'mp', amount: 3 }], 'helm']),
  passive('warrior', 'warmaster', ['wm_p_tactics', 'Tactics', 'Skill cooldowns -8%.', 'cooldown-mult', 0.92, 'scroll']),
  passive('warrior', 'warmaster', ['wm_p_drill', 'Drill Discipline', '+1 MP per correct answer.', 'mp-per-answer', 1, 'book']),

  // Stormcaller — สายฟ้า/สตัน
  active('mage', 'stormcaller', 'active', ['stm_bolt', 'spender', 'Thunder Bolt', 'A crackling lance of lightning.', 1, 4, 1300, ['spell', 'storm'], [{ kind: 'damage', mult: 1.6 }], 'lightning']),
  active('mage', 'stormcaller', 'active', ['stm_static', 'opener', 'Static Field', 'Charge the air — the foe seizes up.', 1, 5, 3000, ['spell', 'storm', 'control'], [{ kind: 'damage', mult: 0.6 }, { kind: 'apply', status: 'shock', ms: 1800, magnitude: 1 }], 'lightning']),
  active('mage', 'stormcaller', 'active', ['stm_discharge', 'extender', 'Discharge', 'Release the stored charge into a shocked foe.', 1, 5, 2400, ['spell', 'storm', 'combo'], [{ kind: 'damage', mult: 1.0 }, { kind: 'consume', status: 'shock', bonus: { kind: 'damage', mult: 1.2 } }], 'orb']),
  active('mage', 'stormcaller', 'active', ['stm_conduit', 'generator', 'Conduit', 'Draw power from the storm.', 0, 0, 5500, ['spell', 'tempo'], [{ kind: 'mp', amount: 9 }], 'scroll']),
  passive('mage', 'stormcaller', ['stm_p_over', 'Overcharge', '+10% damage dealt.', 'outgoing-mult', 1.1, 'lightning']),
  passive('mage', 'stormcaller', ['stm_p_insul', 'Insulated', '-6% damage taken.', 'incoming-mult', 0.94, 'ward']),

  // Lorekeeper — ความรู้คือพลัง
  active('mage', 'lorekeeper', 'active', ['lor_verse', 'spender', 'Binding Verse', 'Words with weight enough to wound.', 1, 3, 1400, ['spell', 'lore'], [{ kind: 'damage', mult: 1.4 }], 'book']),
  active('mage', 'lorekeeper', 'active', ['lor_glossary', 'opener', 'Open Glossary', 'Reveal the enemy weakness in the margins.', 0, 3, 3000, ['spell', 'setup'], [{ kind: 'apply', status: 'expose', ms: 7000, magnitude: 1.5 }], 'quill']),
  active('mage', 'lorekeeper', 'active', ['lor_recite', 'finisher', 'Recite', 'Quote the fatal passage at the exposed foe.', 1, 4, 2200, ['spell', 'combo'], [{ kind: 'damage', mult: 1.0 }, { kind: 'consume', status: 'expose', bonus: { kind: 'damage', mult: 1.0 } }], 'scroll']),
  active('mage', 'lorekeeper', 'active', ['lor_mend', 'support', 'Marginal Notes', 'Healing words in a careful hand.', 0, 6, 5500, ['sustain'], [{ kind: 'heal', base: 22 }], 'ward']),
  passive('mage', 'lorekeeper', ['lor_p_index', 'Indexed Mind', 'Insight cap +1.', 'insight-cap', 1, 'brain']),
  passive('mage', 'lorekeeper', ['lor_p_gloss', 'Glossed Pages', '+2 MP per correct answer.', 'mp-per-answer', 2, 'book']),

  // Sharpshooter — ช็อตเดียวจอด
  active('archer', 'sharpshooter', 'active', ['shs_deadeye', 'spender', 'Deadeye Shot', 'A slow, perfect shot.', 1, 3, 1800, ['ranged'], [{ kind: 'damage', mult: 1.8 }], 'arrow']),
  active('archer', 'sharpshooter', 'active', ['shs_target', 'opener', 'Call the Shot', 'Read the target — expose the flaw.', 0, 3, 3200, ['ranged', 'setup'], [{ kind: 'apply', status: 'expose', ms: 6000, magnitude: 1.6 }], 'book']),
  active('archer', 'sharpshooter', 'active', ['shs_longshot', 'finisher', 'Long Shot', 'Execute distant, weakened prey.', 1, 4, 2600, ['ranged', 'execute'], [{ kind: 'damage', mult: 1.1, executeBelowPct: 30, executeMult: 2.2 }], 'bow']),
  active('archer', 'sharpshooter', 'active', ['shs_steady', 'generator', 'Steady Breath', 'In. Out. Loose.', 0, 0, 5000, ['tempo'], [{ kind: 'mp', amount: 4 }, { kind: 'combo', delta: 1 }], 'quill']),
  passive('archer', 'sharpshooter', ['shs_p_scope', 'Hawk Eye', '+12% damage dealt.', 'outgoing-mult', 1.12, 'arrow']),
  passive('archer', 'sharpshooter', ['shs_p_still', 'Stillness', '-6% damage taken.', 'incoming-mult', 0.94, 'boots']),

  // Trickster — ไม่เคยอยู่ตรงนั้น
  active('archer', 'trickster', 'active', ['trk_fan', 'spender', 'Fan of Knives', 'A spray of blades.', 1, 2, 600, ['ranged', 'tempo'], [{ kind: 'damage', mult: 0.95 }], 'dagger']),
  active('archer', 'trickster', 'active', ['trk_caltrops', 'opener', 'Caltrops', 'Scatter spikes — the foe limps.', 1, 3, 2400, ['control', 'dot'], [{ kind: 'damage', mult: 0.5 }, { kind: 'apply', status: 'chill', ms: 5000, magnitude: 1 }, { kind: 'apply', status: 'bleed', ms: 5000, magnitude: 0.25 }], 'boots']),
  active('archer', 'trickster', 'active', ['trk_vanish', 'defense', 'Vanish', 'Gone before the swing lands.', 0, 6, 5000, ['guard', 'mobility'], [{ kind: 'ward', incomingMult: 0.15, hits: 1 }], 'wings']),
  active('archer', 'trickster', 'active', ['trk_jab', 'extender', 'Opportunist Jab', 'Punish the slowed and bleeding.', 1, 3, 1800, ['melee', 'combo'], [{ kind: 'damage', mult: 0.8 }, { kind: 'consume', status: 'bleed', bonus: { kind: 'damage', mult: 1.0 } }], 'dagger']),
  passive('archer', 'trickster', ['trk_p_slip', 'Slippery', 'Skill cooldowns -12%.', 'cooldown-mult', 0.88, 'wings']),
  passive('archer', 'trickster', ['trk_p_luck', "Fool's Luck", 'Healing received +15%.', 'heal-mult', 1.15, 'ward']),

  // Bulwark — กำแพงที่มีชีวิต
  active('guardian', 'bulwark', 'active', ['blw_ram', 'spender', 'Shield Ram', 'The wall moves forward.', 1, 0, 1100, ['melee'], [{ kind: 'damage', mult: 1.15 }], 'shield']),
  active('guardian', 'bulwark', 'active', ['blw_anchor', 'defense', 'Anchor', 'Immovable — heavy mitigation for three hits.', 0, 8, 6000, ['guard'], [{ kind: 'ward', incomingMult: 0.3, hits: 3 }], 'tower_shield']),
  active('guardian', 'bulwark', 'active', ['blw_quake', 'opener', 'Ground Quake', 'Stagger the foe with a ground-shaking stomp.', 1, 5, 3600, ['control'], [{ kind: 'damage', mult: 0.7 }, { kind: 'apply', status: 'shock', ms: 1600, magnitude: 1 }], 'helm']),
  active('guardian', 'bulwark', 'active', ['blw_recover', 'support', 'Shield Rest', 'Breathe behind the wall.', 0, 5, 5500, ['sustain'], [{ kind: 'heal', base: 18 }], 'armor']),
  passive('guardian', 'bulwark', ['blw_p_granite', 'Granite Skin', '-16% damage taken.', 'incoming-mult', 0.84, 'armor']),
  passive('guardian', 'bulwark', ['blw_p_mass', 'Massive Frame', '+6% damage dealt.', 'outgoing-mult', 1.06, 'shield']),

  // Lightwarden — แสงที่รักษา
  active('guardian', 'lightwarden', 'active', ['lw_smite', 'spender', 'Smite', 'Radiance given an edge.', 1, 3, 1300, ['holy'], [{ kind: 'damage', mult: 1.35 }], 'sword']),
  active('guardian', 'lightwarden', 'active', ['lw_beacon', 'support', 'Beacon', 'A standing light that mends.', 0, 6, 6000, ['holy', 'sustain'], [{ kind: 'apply', status: 'regen', ms: 8000, magnitude: 5 }], 'ward']),
  active('guardian', 'lightwarden', 'active', ['lw_dawn', 'opener', 'Break of Dawn', 'Light reveals every flaw.', 0, 4, 3200, ['holy', 'setup'], [{ kind: 'apply', status: 'expose', ms: 6000, magnitude: 1.4 }], 'book']),
  active('guardian', 'lightwarden', 'active', ['lw_verdict', 'finisher', 'Verdict', 'The light passes judgement on the exposed.', 1, 5, 2400, ['holy', 'combo'], [{ kind: 'damage', mult: 0.95 }, { kind: 'consume', status: 'expose', bonus: { kind: 'damage', mult: 1.05 } }], 'tower_shield']),
  passive('guardian', 'lightwarden', ['lw_p_grace', 'Grace', 'Healing received +30%.', 'heal-mult', 1.3, 'ward']),
  passive('guardian', 'lightwarden', ['lw_p_faith', 'Quiet Faith', '+1 MP per correct answer.', 'mp-per-answer', 1, 'book']),
]

export const ALL_SKILL_DEFS: SkillDef[] = [...BASE, ...JOB_SKILLS]
const SKILL_BY_ID = new Map(ALL_SKILL_DEFS.map((s) => [s.id, s]))
export function getSkillDef(id: string): SkillDef | undefined { return SKILL_BY_ID.get(id) }

export function skillsForClass(classId: HeroClassId, jobId?: JobId): SkillDef[] {
  return ALL_SKILL_DEFS.filter((s) => s.classId === classId && (s.jobId === undefined || s.jobId === jobId))
}
export function jobsForClass(classId: HeroClassId): JobDef[] {
  return JOBS.filter((j) => j.classId === classId)
}

/** กติกาข้อมูลที่ห้ามละเมิด — test บังคับให้ว่าง */
export function validateSkillDefs(): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const s of ALL_SKILL_DEFS) {
    if (ids.has(s.id)) problems.push(`${s.id}: duplicate id`)
    ids.add(s.id)
    // learning gate: damage ⇒ insightCost ≥ 1; ultimate ⇒ 3
    if (dmgOf(s.effects) && s.insightCost < 1) problems.push(`${s.id}: deals damage with insightCost ${s.insightCost} (learning gate violation)`)
    if (s.kind === 'ultimate' && s.insightCost !== 3) problems.push(`${s.id}: ultimate must cost 3 insight`)
    if (s.kind !== 'passive' && s.effects.length === 0) problems.push(`${s.id}: active with no effects`)
    if (s.kind === 'passive' && !s.passive) problems.push(`${s.id}: passive without hook`)
    if (!s.iconKey || !s.animationKey || !s.vfxKey || !s.sfxKey) problems.push(`${s.id}: missing presentation key`)
  }
  // โครงต่อคลาส: 6A/3P/1U; ต่อ job: 4A/2P
  for (const classId of ['warrior', 'mage', 'archer', 'guardian'] as HeroClassId[]) {
    const base = ALL_SKILL_DEFS.filter((s) => s.classId === classId && !s.jobId)
    const a = base.filter((s) => s.kind === 'active').length
    const p = base.filter((s) => s.kind === 'passive').length
    const u = base.filter((s) => s.kind === 'ultimate').length
    if (a !== 6 || p !== 3 || u !== 1) problems.push(`${classId}: base kit is ${a}A/${p}P/${u}U (want 6/3/1)`)
  }
  for (const job of JOBS) {
    const skills = ALL_SKILL_DEFS.filter((s) => s.jobId === job.id)
    const a = skills.filter((s) => s.kind === 'active').length
    const p = skills.filter((s) => s.kind === 'passive').length
    if (a !== 4 || p !== 2) problems.push(`${job.id}: job kit is ${a}A/${p}P (want 4/2)`)
    if (skills.some((s) => s.classId !== job.classId)) problems.push(`${job.id}: skill classId mismatch`)
  }
  return problems
}
