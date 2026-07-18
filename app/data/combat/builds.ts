// ================================================================================================
// Recommended builds (Master Plan Phase 4) — อย่างน้อย 3 viable builds ต่อคลาส
// ใช้เป็น preset ใน UI + fixture ของ balance simulation (test/skill-balance.spec.ts)
// ความ viable พิสูจน์ด้วย sim ไม่ใช่คำโฆษณา: ทุก build ต้อง clear ได้ใน parity band และ
// ไม่มี build เดียวที่ชนะทุก scenario
// ================================================================================================
import type { HeroClassId } from '~/data/classes'
import { validateLoadout } from './loadoutEngine'
import type { JobId } from './skillDefs'

export interface BuildDef {
  id: string
  classId: HeroClassId
  jobId?: JobId
  name: string
  description: string
  skills: string[]
  ultimate: string
  passives: string[]
  /** ลำดับความสำคัญที่ sim/AI-hint ใช้ (ซ้าย = ก่อน) — ผู้เล่นจริงไม่ถูกบังคับลำดับ */
  rotation: string[]
}

export const BUILDS: BuildDef[] = [
  // ---- WARRIOR ----
  {
    id: 'war_bleed', classId: 'warrior', name: 'Bloodletter',
    description: 'เปิดแผล → ซ้ำด้วย Rampage — เก่งสู้ยืดเยื้อ',
    skills: ['war_rend', 'war_rampage', 'war_crush', 'war_cry', 'war_slam'], ultimate: 'war_ult',
    passives: ['war_p_bloodlust', 'war_p_meditate'],
    rotation: ['war_rend', 'war_rampage', 'war_crush', 'war_cry', 'war_slam'],
  },
  {
    id: 'war_burst', classId: 'warrior', name: 'Executioner',
    description: 'บดให้ต่ำแล้ว Execute — เก่งปิดไฟต์เร็ว',
    skills: ['war_crush', 'war_execute', 'war_rend', 'war_cry', 'war_slam'], ultimate: 'war_ult',
    passives: ['war_p_bloodlust', 'war_p_hide'],
    rotation: ['war_execute', 'war_crush', 'war_rend', 'war_cry', 'war_slam'],
  },
  {
    id: 'war_tank', classId: 'warrior', name: 'Juggernaut',
    description: 'ยืนทน แลกหมัดช้าๆ — เก่งเจอมอนสเตอร์หนัก',
    skills: ['war_slam', 'war_crush', 'war_rend', 'war_cry', 'war_rampage'], ultimate: 'war_ult',
    passives: ['war_p_hide', 'war_p_meditate'],
    rotation: ['war_slam', 'war_crush', 'war_rend', 'war_rampage', 'war_cry'],
  },

  // ---- MAGE ----
  {
    id: 'mag_fire', classId: 'mage', name: 'Pyre Weaver',
    description: 'เผาแล้วจุดระเบิด — สายคอมโบไฟ',
    skills: ['mag_bolt', 'mag_combust', 'mag_blast', 'mag_surge', 'mag_nova'], ultimate: 'mag_ult',
    passives: ['mag_p_pyro', 'mag_p_font'],
    rotation: ['mag_bolt', 'mag_combust', 'mag_blast', 'mag_surge', 'mag_nova'],
  },
  {
    id: 'mag_control', classId: 'mage', name: 'Frost Warden',
    description: 'ชะลอศัตรูให้ช้าจนแทบไม่ได้ตี — สายคุมจังหวะ',
    skills: ['mag_lance', 'mag_blast', 'mag_nova', 'mag_surge', 'mag_bolt'], ultimate: 'mag_ult',
    passives: ['mag_p_pyro', 'mag_p_ward'],
    rotation: ['mag_lance', 'mag_nova', 'mag_blast', 'mag_bolt', 'mag_surge'],
  },
  {
    id: 'mag_burst', classId: 'mage', name: 'Mindstorm',
    description: 'Mind Blast รัวๆ ด้วย MP จาก Arcane Surge — สาย nuke ตรง',
    skills: ['mag_blast', 'mag_surge', 'mag_bolt', 'mag_nova', 'mag_combust'], ultimate: 'mag_ult',
    passives: ['mag_p_font', 'mag_p_ward'],
    rotation: ['mag_blast', 'mag_bolt', 'mag_surge', 'mag_combust', 'mag_nova'],
  },

  // ---- ARCHER ----
  {
    id: 'arc_tempo', classId: 'archer', name: 'Rapid Volley',
    description: 'Quick Shot ถี่ยิบ — ดาเมจไหลตลอดเวลา',
    skills: ['arc_quick', 'arc_focus', 'arc_barbed', 'arc_tumble', 'arc_mark'], ultimate: 'arc_ult',
    passives: ['arc_p_fleet', 'arc_p_keen'],
    rotation: ['arc_quick', 'arc_barbed', 'arc_focus', 'arc_mark', 'arc_tumble'],
  },
  {
    id: 'arc_combo', classId: 'archer', name: 'Marked Hunt',
    description: 'Mark → Pierce ซ้ำๆ — สายคอมโบจุดอ่อน',
    skills: ['arc_mark', 'arc_pierce', 'arc_quick', 'arc_focus', 'arc_tumble'], ultimate: 'arc_ult',
    passives: ['arc_p_keen', 'arc_p_scout'],
    rotation: ['arc_mark', 'arc_pierce', 'arc_quick', 'arc_focus', 'arc_tumble'],
  },
  {
    id: 'arc_dot', classId: 'archer', name: 'Thousand Cuts',
    description: 'เลือดไหลไม่หยุดจาก Barbed Arrow — สาย DoT',
    skills: ['arc_barbed', 'arc_quick', 'arc_mark', 'arc_tumble', 'arc_focus'], ultimate: 'arc_ult',
    passives: ['arc_p_fleet', 'arc_p_scout'],
    rotation: ['arc_barbed', 'arc_quick', 'arc_mark', 'arc_focus', 'arc_tumble'],
  },

  // ---- GUARDIAN ----
  {
    id: 'gua_combo', classId: 'guardian', name: 'Lawbringer',
    description: 'Sunder → Judgement — แทงเกราะแตกซ้ำๆ',
    skills: ['gua_sunder', 'gua_judge', 'gua_bash', 'gua_vigil', 'gua_fortify'], ultimate: 'gua_ult',
    passives: ['gua_p_stalwart', 'gua_p_resolve'],
    rotation: ['gua_sunder', 'gua_judge', 'gua_bash', 'gua_vigil', 'gua_fortify'],
  },
  {
    id: 'gua_wall', classId: 'guardian', name: 'Iron Rampart',
    description: 'Fortress ต่อ Fortress — มอนสเตอร์เกาแทบไม่เข้า',
    skills: ['gua_fortify', 'gua_bash', 'gua_consecrate', 'gua_vigil', 'gua_sunder'], ultimate: 'gua_ult',
    passives: ['gua_p_stalwart', 'gua_p_vigil'],
    rotation: ['gua_fortify', 'gua_bash', 'gua_consecrate', 'gua_sunder', 'gua_vigil'],
  },
  {
    id: 'gua_sustain', classId: 'guardian', name: 'Warden of Dawn',
    description: 'Consecrate ฟื้นตัวตลอดไฟต์ — อึดแบบมีจังหวะรุก',
    skills: ['gua_consecrate', 'gua_bash', 'gua_sunder', 'gua_judge', 'gua_vigil'], ultimate: 'gua_ult',
    passives: ['gua_p_vigil', 'gua_p_resolve'],
    rotation: ['gua_consecrate', 'gua_sunder', 'gua_judge', 'gua_bash', 'gua_vigil'],
  },
]

/** loadout เริ่มต้นของคลาส = preset build ตัวแรก (ใช้เป็นค่า default ของเซฟ) */
export function defaultSkillLoadout(classId: HeroClassId): { skills: string[]; ultimate: string; passives: string[] } {
  const b = buildsForClass(classId)[0]!
  return { skills: [...b.skills], ultimate: b.ultimate, passives: [...b.passives] }
}

export function buildsForClass(classId: HeroClassId): BuildDef[] {
  return BUILDS.filter((b) => b.classId === classId)
}
export function getBuild(id: string): BuildDef | undefined {
  return BUILDS.find((b) => b.id === id)
}

/** ทุก preset ต้อง validate ผ่าน loadout rules — test บังคับ */
export function validateBuilds(): string[] {
  const problems: string[] = []
  for (const b of BUILDS) {
    for (const p of validateLoadout(b.skills, b.ultimate, b.passives, b.classId, b.jobId)) {
      problems.push(`${b.id}: ${p}`)
    }
    for (const r of b.rotation) if (!b.skills.includes(r)) problems.push(`${b.id}: rotation uses ${r} not in loadout`)
  }
  return problems
}
