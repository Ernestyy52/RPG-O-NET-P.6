export type WeaponMasteryFamily = 'blade' | 'heavy' | 'polearm' | 'ranged' | 'arcane' | 'divine' | 'unarmed'

export interface WeaponMasteryState { level: number; exp: number }

export function jobExpToNext(level: number): number {
  const safe = Math.max(1, Math.min(50, Math.floor(level)))
  return Math.round(24 + 18 * Math.pow(safe, 1.32))
}

export function grantJobExp(level: number, exp: number, gained: number): { level: number; exp: number; skillPoints: number } {
  let nextLevel = Math.max(1, Math.min(50, Math.floor(level)))
  let nextExp = Math.max(0, exp) + Math.max(0, Math.round(gained))
  let skillPoints = 0
  while (nextLevel < 50 && nextExp >= jobExpToNext(nextLevel)) {
    nextExp -= jobExpToNext(nextLevel)
    nextLevel += 1
    skillPoints += nextLevel % 5 === 0 ? 2 : 1
  }
  if (nextLevel >= 50) nextExp = 0
  return { level: nextLevel, exp: nextExp, skillPoints }
}

export function weaponMasteryFamily(type: string | undefined): WeaponMasteryFamily {
  if (!type) return 'unarmed'
  if (['sword', 'longsword', 'dagger', 'kris', 'rapier'].includes(type)) return 'blade'
  if (['greatsword', 'axe', 'battleaxe', 'warhammer', 'scythe'].includes(type)) return 'heavy'
  if (['spear', 'halberd'].includes(type)) return 'polearm'
  if (['bow', 'longbow', 'crossbow'].includes(type)) return 'ranged'
  if (['staff', 'wand'].includes(type)) return 'arcane'
  if (['mace'].includes(type)) return 'divine'
  return 'unarmed'
}

export function masteryExpToNext(level: number): number { return 18 + Math.max(1, level) * 12 }

export function grantMastery(current: WeaponMasteryState | undefined, gained: number): WeaponMasteryState {
  let level = Math.max(1, Math.min(20, current?.level ?? 1))
  let exp = Math.max(0, current?.exp ?? 0) + Math.max(0, Math.round(gained))
  while (level < 20 && exp >= masteryExpToNext(level)) {
    exp -= masteryExpToNext(level)
    level += 1
  }
  if (level >= 20) exp = 0
  return { level, exp }
}

export function masteryDamageBonus(level: number): number {
  return Math.min(0.12, Math.max(0, level - 1) * 0.006)
}
