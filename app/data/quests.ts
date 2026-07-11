// เควสรายวันจาก Guild Hall — สุ่ม 3 ภารกิจต่อวัน ผูกกับกิจกรรมจริงในเกม (ตอบถูก/ล้มมอนสเตอร์/ขึ้นชั้น)
// รางวัลเป็น gold/gems/exp เพื่อจูงใจให้กลับมาเล่นทุกวันและฝึกภาษาอังกฤษต่อเนื่อง
export type QuestKind = 'answer' | 'defeat' | 'climb'

export interface DailyQuest {
  id: string
  kind: QuestKind
  label: string
  target: number
  progress: number
  reward: { gold: number; gems: number; exp: number }
  claimed: boolean
}

interface QuestTemplate {
  kind: QuestKind
  label: (n: number) => string
  targets: number[]
  reward: (n: number, floor: number) => { gold: number; gems: number; exp: number }
}

const TEMPLATES: QuestTemplate[] = [
  {
    kind: 'answer',
    label: (n) => `Answer ${n} questions correctly`,
    targets: [5, 8, 12],
    reward: (n, floor) => ({ gold: n * (8 + floor), gems: 0, exp: n * 6 }),
  },
  {
    kind: 'defeat',
    label: (n) => `Defeat ${n} monsters`,
    targets: [4, 6, 10],
    reward: (n, floor) => ({ gold: n * (6 + floor), gems: n >= 10 ? 1 : 0, exp: n * 5 }),
  },
  {
    kind: 'climb',
    label: (n) => `Clear ${n} floor${n > 1 ? 's' : ''}`,
    targets: [1, 2, 3],
    reward: (n, floor) => ({ gold: n * (20 + floor * 2), gems: n >= 3 ? 1 : 0, exp: n * 15 }),
  },
]

// PRNG แบบ deterministic ต่อวัน+ชั้น — ทุก client ที่วันเดียวกันได้เควสชุดเดียวกัน
function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function rollDailyQuests(dateKey: string, floor: number): DailyQuest[] {
  let seed = 0
  for (let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0
  const rng = seeded(seed)
  return TEMPLATES.map((tpl, i) => {
    const target = tpl.targets[Math.floor(rng() * tpl.targets.length)]
    return {
      id: `${dateKey}_${tpl.kind}_${i}`,
      kind: tpl.kind,
      label: tpl.label(target),
      target,
      progress: 0,
      reward: tpl.reward(target, floor),
      claimed: false,
    }
  })
}
