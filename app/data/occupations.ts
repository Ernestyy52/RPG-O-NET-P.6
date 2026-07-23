import type { HeroClassId } from './classes'
import type { JobId } from './combat/skillDefs'
import type { EquipmentItem, EquipmentSlot } from './equipment'

export interface OccupationIdentity {
  classId: HeroClassId
  title: string
  titleTh: string
  fantasy: string
  combatLoop: string
  primaryStats: string[]
  weaponTypes: string[]
  armorTypes: string[]
  starterEquipment: Record<EquipmentSlot, string>
  signatureSkills: string[]
  portrait: string
}

/** Original class identities with the readable silhouettes and job fantasy of classic party MMORPGs. */
export const OCCUPATIONS: Record<HeroClassId, OccupationIdentity> = {
  warrior: {
    classId: 'warrior', title: 'Vanguard', titleTh: 'แนวหน้า',
    fantasy: 'นักดาบภาคสนามที่ยืนแนวหน้า เปิดบาดแผล แล้วต่อคอมโบด้วยแรงกดดัน',
    combatLoop: 'Rending Slash → Rampage → Execute; ใช้ Shield Wall รับท่าหนัก',
    primaryStats: ['ATK', 'HP', 'DEF'], weaponTypes: ['sword', 'longsword', 'greatsword', 'spear'], armorTypes: ['chain', 'plate'],
    starterEquipment: { weapon: 'job_vanguard_oathblade', armor: 'job_vanguard_brigandine', trinket: 'job_vanguard_emblem' },
    signatureSkills: ['war_rend', 'war_rampage', 'war_execute', 'war_ult'], portrait: 'class-jobs/vanguard.webp',
  },
  mage: {
    classId: 'mage', title: 'Arcanist', titleTh: 'นักเวทอาคม',
    fantasy: 'นักวิชาการเวทที่สลับไฟ น้ำแข็ง และรูน คุมจังหวะก่อนระเบิดสถานะธาตุ',
    combatLoop: 'Firebolt → Combustion หรือ Ice Lance → Frost Nova; รักษา MP ด้วย Arcane Surge',
    primaryStats: ['MAG', 'KNOW', 'MP'], weaponTypes: ['staff', 'wand'], armorTypes: ['robe', 'mage_robe'],
    starterEquipment: { weapon: 'job_arcanist_runestaff', armor: 'job_arcanist_aetherrobe', trinket: 'job_arcanist_grimoire' },
    signatureSkills: ['mag_bolt', 'mag_lance', 'mag_combust', 'mag_ult'], portrait: 'class-jobs/arcanist.webp',
  },
  archer: {
    classId: 'archer', title: 'Wind Ranger', titleTh: 'พรานสายลม',
    fantasy: 'นักสำรวจระยะไกลที่ทำเครื่องหมายจุดอ่อน เคลื่อนที่เร็ว และลงโทษเป้าหมายอย่างแม่นยำ',
    combatLoop: "Hunter's Mark → Piercing Shot; ใช้ Quick Shot รักษาจังหวะและ Tumble หลบท่าหนัก",
    primaryStats: ['SPD', 'ATK', 'KNOW'], weaponTypes: ['bow', 'longbow', 'crossbow'], armorTypes: ['leather', 'cloak'],
    starterEquipment: { weapon: 'job_ranger_windbow', armor: 'job_ranger_scoutjerkin', trinket: 'job_ranger_fletching' },
    signatureSkills: ['arc_mark', 'arc_pierce', 'arc_tumble', 'arc_ult'], portrait: 'class-jobs/wind-ranger.webp',
  },
  guardian: {
    classId: 'guardian', title: 'Aegis Acolyte', titleTh: 'ศิษย์โล่ศักดิ์สิทธิ์',
    fantasy: 'ผู้พิทักษ์กึ่งนักบวช ใช้โล่ แสงรักษา และคำพิพากษาเพื่อประคองการต่อสู้ยาว',
    combatLoop: 'Sunder → Judgement; ใช้ Fortress รับดาเมจ และ Consecrate ฟื้นฟู',
    primaryStats: ['DEF', 'HP', 'KNOW'], weaponTypes: ['mace', 'warhammer', 'sword'], armorTypes: ['chain', 'plate', 'fullplate'],
    starterEquipment: { weapon: 'job_acolyte_dawnmace', armor: 'job_acolyte_pilgrimmail', trinket: 'job_acolyte_prayerbeads' },
    signatureSkills: ['gua_sunder', 'gua_judge', 'gua_consecrate', 'gua_ult'], portrait: 'class-jobs/aegis-acolyte.webp',
  },
}

type OccupationEquipment = EquipmentItem & { classId: HeroClassId; advancedJobId?: JobId }
const item = (
  id: string, classId: HeroClassId, slot: EquipmentSlot, type: string, name: string,
  stats: EquipmentItem['stats'], icon: string, visual: string, advancedJobId?: JobId,
): OccupationEquipment => ({
  id, classId, advancedJobId, kind: 'equipment', slot, type,
  tier: advancedJobId ? 2 : 1, rarity: advancedJobId ? 'rare' : 'common',
  name, cost: advancedJobId ? 900 : 1, minFloor: advancedJobId ? 15 : 1, stats, icon, visual,
  dropOnly: true,
})

/** Starter sets immediately drive the existing 4-direction paper-doll via their weapon/armor types. */
export const OCCUPATION_EQUIPMENT: OccupationEquipment[] = [
  item('job_vanguard_oathblade', 'warrior', 'weapon', 'sword', 'Vanguard Oathblade', { atk: 5, hp: 3 }, 'wpn_sword', 'navy-steel oath sword'),
  item('job_vanguard_brigandine', 'warrior', 'armor', 'chain', 'Vanguard Brigandine', { hp: 12, def: 3 }, 'arm_chain', 'navy and brass field mail'),
  item('job_vanguard_emblem', 'warrior', 'trinket', 'badge', 'Vanguard Emblem', { def: 1, knowledge: 1 }, 'trk_badge', 'guild oath emblem'),
  item('job_arcanist_runestaff', 'mage', 'weapon', 'staff', 'Apprentice Rune Staff', { mag: 5, knowledge: 2 }, 'wpn_staff', 'teal crystal rune staff'),
  item('job_arcanist_aetherrobe', 'mage', 'armor', 'mage_robe', 'Aetherweave Robe', { hp: 8, mag: 3, knowledge: 1 }, 'arm_robe', 'teal-violet rune robe'),
  item('job_arcanist_grimoire', 'mage', 'trinket', 'tome', 'Novice Grimoire', { mag: 1, knowledge: 2 }, 'trk_tome', 'field spellbook'),
  item('job_ranger_windbow', 'archer', 'weapon', 'bow', 'Windstring Bow', { atk: 4, speed: 3 }, 'wpn_bow', 'greenwood scout bow'),
  item('job_ranger_scoutjerkin', 'archer', 'armor', 'leather', 'Wind Scout Jerkin', { hp: 9, def: 2, speed: 2 }, 'arm_leather', 'forest-green scout leather'),
  item('job_ranger_fletching', 'archer', 'trinket', 'charm', 'Fletcher Charm', { speed: 2, knowledge: 1 }, 'trk_charm', 'feather and arrow charm'),
  item('job_acolyte_dawnmace', 'guardian', 'weapon', 'mace', 'Dawn Mace', { atk: 4, def: 3, knowledge: 1 }, 'wpn_mace', 'ivory sun-headed mace'),
  item('job_acolyte_pilgrimmail', 'guardian', 'armor', 'chain', 'Pilgrim Mail', { hp: 15, def: 4 }, 'arm_chain', 'ivory and sky-blue mail'),
  item('job_acolyte_prayerbeads', 'guardian', 'trinket', 'amulet', 'Prayer Beads', { hp: 7, knowledge: 2 }, 'trk_amulet', 'sunlit prayer beads'),

  item('job_berserker_riftcleaver', 'warrior', 'weapon', 'greatsword', 'Bloodreaver Riftcleaver', { atk: 18, hp: 8 }, 'wpn_greatsword', 'crimson broken-edge greatsword', 'berserker'),
  item('job_warmaster_commandsabre', 'warrior', 'weapon', 'longsword', 'Banner Knight Command Sabre', { atk: 13, def: 4, knowledge: 2 }, 'wpn_sword', 'brass command sabre', 'warmaster'),
  item('job_stormcaller_skycoil', 'mage', 'weapon', 'wand', 'Tempest Sage Skycoil', { mag: 17, speed: 3 }, 'wpn_wand', 'stormglass coil wand', 'stormcaller'),
  item('job_lorekeeper_codexstaff', 'mage', 'weapon', 'staff', 'Rune Scholar Codex Staff', { mag: 12, knowledge: 7 }, 'wpn_staff', 'floating-page rune staff', 'lorekeeper'),
  item('job_sharpshooter_starfall', 'archer', 'weapon', 'longbow', 'Falconeye Starfall Bow', { atk: 16, speed: 5 }, 'wpn_bow', 'silver longbow with star sight', 'sharpshooter'),
  item('job_trickster_whisperkris', 'archer', 'weapon', 'kris', 'Shadow Scout Whisper Kris', { atk: 11, speed: 8 }, 'wpn_dagger', 'smokeglass curved dagger', 'trickster'),
  item('job_bulwark_citadelhammer', 'guardian', 'weapon', 'warhammer', 'Iron Templar Citadel Hammer', { atk: 12, def: 8, hp: 10 }, 'wpn_mace', 'fortress-headed warhammer', 'bulwark'),
  item('job_lightwarden_sunscepter', 'guardian', 'weapon', 'mace', 'Dawn Priest Sun Scepter', { atk: 8, mag: 7, knowledge: 5 }, 'wpn_mace', 'ivory sun scepter', 'lightwarden'),
]

export function occupationForClass(classId: HeroClassId): OccupationIdentity { return OCCUPATIONS[classId] }
export function starterEquipmentForClass(classId: HeroClassId): Record<EquipmentSlot, string> { return { ...OCCUPATIONS[classId].starterEquipment } }
export function gearAllowedForClass(item: Pick<OccupationEquipment, 'classId' | 'advancedJobId'>, classId: HeroClassId, jobId?: string): boolean {
  return item.classId === classId && (!item.advancedJobId || item.advancedJobId === jobId)
}
export function signatureGearForJob(jobId: JobId): OccupationEquipment | undefined {
  return OCCUPATION_EQUIPMENT.find((gear) => gear.advancedJobId === jobId)
}
