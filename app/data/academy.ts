import { STUDY_LESSONS, type StudyCategory } from './study'

export interface AcademyTutor {
  npcId: string
  category: StudyCategory
  name: string
  title: string
  roomTh: string
  roomEn: string
  color: number
}

/** Five rooms mirror the recurring domains abstracted from all 11 years in knowledge/. */
export const ACADEMY_TUTORS: AcademyTutor[] = [
  { npcId: 'tutor_grammar', category: 'grammar', name: 'Professor Elara', title: 'Grammar Sage', roomTh: 'ห้องไวยากรณ์รูน', roomEn: 'Rune Grammar Hall', color: 0x6fb477 },
  { npcId: 'tutor_reading', category: 'reading', name: 'Archivist Nox', title: 'Reading Keeper', roomTh: 'หอจดหมายเหตุการอ่าน', roomEn: 'Reading Archive', color: 0x6f91d8 },
  { npcId: 'tutor_strategy', category: 'strategy', name: 'Master Orion', title: 'Exam Cartographer', roomTh: 'หอสังเกตการณ์ข้อสอบ', roomEn: 'Exam Observatory', color: 0xd0a457 },
  { npcId: 'tutor_conversation', category: 'conversation', name: 'Lady Celine', title: 'Dialogue Mentor', roomTh: 'ซาลอนบทสนทนา', roomEn: 'Conversation Salon', color: 0xc97576 },
  { npcId: 'tutor_vocabulary', category: 'vocabulary', name: 'Scholar Vireo', title: 'Word Keeper', roomTh: 'คลังคำศัพท์เวท', roomEn: 'Vocabulary Library', color: 0x8175d6 },
]

export const ACADEMY_KNOWLEDGE_YEARS = 'O-NET 2558–2568'
export const ACADEMY_PATTERN_COUNT = 456

export function academyTutor(npcId: string): AcademyTutor | undefined {
  return ACADEMY_TUTORS.find((tutor) => tutor.npcId === npcId)
}

export function academyLessons(category: StudyCategory) {
  return STUDY_LESSONS.filter((lesson) => lesson.category === category)
}

