// ================================================================================================
// World 1 — hidden secrets (Phase 14 Inc 4)
//
// Discoverable, one-time rewards tucked into the World-1 dungeons. Each id matches a `DungeonSecret`
// already placed in the layout configs (app/game/runtime/dungeonLayouts.ts), so the scene renders a
// faint marker there and emits `secret:found` on overlap. Rewards are bounded + granted ONCE (validated
// through the store's reward path — no duplication). Satisfies the Phase-14 gate's "≥3 secrets" item.
// ================================================================================================

export type World1SecretLayout = 'world01-mini' | 'world01-main'

export interface World1Secret {
  id: string
  layoutId: World1SecretLayout
  name: string
  nameTh: string
  hint: string
  reward: { exp: number; gold: number; gems: number; itemId?: string; qty?: number }
}

export const WORLD1_SECRETS: World1Secret[] = [
  {
    id: 'w1-mini-alcove', layoutId: 'world01-mini',
    name: 'Hidden Alcove', nameTh: 'ซอกหลืบลับ',
    hint: 'A faint glow in the grotto corner.',
    reward: { exp: 40, gold: 30, gems: 1 },
  },
  {
    id: 'w1-main-chest', layoutId: 'world01-main',
    name: 'Buried Chest', nameTh: 'หีบสมบัติที่ถูกฝัง',
    hint: 'The soil is disturbed near the far wall.',
    reward: { exp: 60, gold: 80, gems: 1, itemId: 'potion_m', qty: 1 },
  },
  {
    id: 'w1-main-inscription', layoutId: 'world01-main',
    name: 'Ancient Inscription', nameTh: 'จารึกโบราณ',
    hint: 'Old words carved into the stone — knowledge rewards the curious.',
    reward: { exp: 90, gold: 40, gems: 0 },
  },
]

const SECRET_BY_ID = new Map(WORLD1_SECRETS.map((s) => [s.id, s]))
export function getWorld1Secret(id: string): World1Secret | undefined { return SECRET_BY_ID.get(id) }
