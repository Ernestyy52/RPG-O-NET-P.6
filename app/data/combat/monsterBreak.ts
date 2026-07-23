export type AnswerGrade = 'perfect' | 'great' | 'steady' | 'miss'

export interface MonsterBreakProfile {
  max: number
  stunMs: number
  label: string
  passive: string
}

export function monsterBreakProfile(monsterId?: string, isBoss = false): MonsterBreakProfile {
  const id = (monsterId ?? '').toLowerCase()
  if (isBoss) return { max: 10, stunMs: 3200, label: 'Guardian Armor', passive: 'บอสมีเกราะหนา แต่ Break จะหยุดการโจมตีได้นาน' }
  if (/(golem|construct|guardian|sentinel|armor)/.test(id)) return { max: 8, stunMs: 2800, label: 'Iron Poise', passive: 'ตอบเร็วเพื่อเจาะเกราะจักรกล' }
  if (/(dragon|drake|wyrm|wyvern)/.test(id)) return { max: 9, stunMs: 3000, label: 'Wing Guard', passive: 'ทำลายสมดุลก่อนมังกรชาร์จท่าใหญ่' }
  if (/(spirit|ghost|wisp|shade)/.test(id)) return { max: 5, stunMs: 2200, label: 'Spirit Veil', passive: 'คำตอบต่อเนื่องทำให้ร่างวิญญาณปรากฏ' }
  return { max: 6, stunMs: 2400, label: 'Break', passive: 'ตอบถูกและตอบเร็วเพื่อลดเกจ Break' }
}

export function gradeAnswer(correct: boolean, responseMs: number): { grade: AnswerGrade; breakDamage: number; label: string } {
  if (!correct) return { grade: 'miss', breakDamage: 0, label: 'MISS' }
  if (responseMs <= 4500) return { grade: 'perfect', breakDamage: 3, label: 'PERFECT' }
  if (responseMs <= 8500) return { grade: 'great', breakDamage: 2, label: 'GREAT' }
  return { grade: 'steady', breakDamage: 1, label: 'CORRECT' }
}

export function applyBreakDamage(current: number, damage: number): { remaining: number; broken: boolean } {
  const remaining = Math.max(0, Math.round(current - Math.max(0, damage)))
  return { remaining, broken: current > 0 && remaining === 0 }
}
