// ================================================================================================
// Development-only diagnostics (Phase 03).
//
// Exposes `window.__ONET_DIAG__` for manual smoke-testing and verification. The ENTIRE body is
// gated behind `import.meta.dev`, so nothing is registered in a production build — production debug
// is disabled by default (Phase 03 gate).
//
// Safety: `reset()` restores an in-memory snapshot and never wipes the player's real localStorage
// save unless `persist: true` is explicitly passed. Reads the existing dev-only `window.__game`
// handle registered by GameCanvas for FPS/entity counts; no gameplay files are modified.
// ================================================================================================
import { usePlayerStore, type GenderId } from '~/stores/player'
import { HERO_CLASSES, type HeroClassId } from '~/data/classes'
import { getFloorConfig } from '~/data/floors'
import { getBossStats } from '~/data/floors'
import { getEquipmentById } from '~/data/equipment'
import { gameEvents } from '~/game/systems/eventBus'

interface DiagApi {
  help(): string[]
  setFloor(floor: number): void
  setClass(id: HeroClassId, gender?: GenderId): void
  grant(itemId: string, qty?: number): void
  spawnEnemy(opts?: { name?: string; hp?: number; atk?: number; boss?: boolean; floor?: number }): void
  spawnBoss(floor?: number): void
  knowledgeBreak(): void
  bossPhase(floor?: number): void
  stats(): Record<string, unknown>
  snapshot(): void
  reset(opts?: { persist?: boolean }): void
}

export default defineNuxtPlugin(() => {
  if (!import.meta.dev || typeof window === 'undefined') return

  let snap: string | null = null

  const api: DiagApi = {
    help: () => [
      'setFloor(n)            — jump the player to a floor',
      'setClass(id, gender?)  — warrior | mage | archer | guardian',
      'grant(itemId, qty=1)   — add item to inventory (auto-equips equipment)',
      'spawnEnemy({...})      — emit a battle:start encounter',
      'spawnBoss(floor?)      — emit a boss encounter for the floor',
      'knowledgeBreak()       — placeholder until Phase 10 (emits a notice)',
      'bossPhase(floor?)      — open the boss gate for the floor',
      'stats()                — FPS / entities / event-listener counts',
      'snapshot()             — capture current player state in memory',
      'reset({persist:false}) — restore snapshot; does NOT touch the real save unless persist:true',
    ],

    setFloor(floor) {
      const p = usePlayerStore()
      p.currentFloor = Math.max(1, Math.floor(floor))
      gameEvents.emit('notice', { text: `[diag] floor set to ${p.currentFloor}` })
    },

    setClass(id, gender) {
      const p = usePlayerStore()
      p.setClass(id)
      if (gender) p.setGender(gender)
      gameEvents.emit('notice', { text: `[diag] class set to ${id}` })
    },

    grant(itemId, qty = 1) {
      const p = usePlayerStore()
      p.addItem(itemId, qty)
      const equip = getEquipmentById(itemId)
      if (equip) p.equipItem(itemId)
      gameEvents.emit('notice', { text: `[diag] granted ${itemId} x${qty}` })
    },

    spawnEnemy(opts = {}) {
      const floor = opts.floor ?? usePlayerStore().currentFloor
      const cfg = getFloorConfig(floor)
      gameEvents.emit('battle:start', {
        floor,
        isBoss: !!opts.boss,
        name: opts.name ?? (opts.boss ? 'Diagnostic Boss' : 'Diagnostic Enemy'),
        hp: opts.hp ?? cfg.monsterHp,
        atk: opts.atk ?? cfg.monsterAtk,
        speed: cfg.monsterLevel,
        expReward: cfg.expReward,
        goldReward: cfg.goldReward,
      })
    },

    spawnBoss(floor) {
      const f = floor ?? usePlayerStore().currentFloor
      const boss = getBossStats(f)
      gameEvents.emit('battle:start', {
        floor: f, isBoss: true, name: `Floor ${f} Boss`,
        hp: boss.hp, atk: boss.atk, expReward: boss.expReward, goldReward: boss.goldReward,
      })
    },

    knowledgeBreak() {
      // Real Knowledge Break arrives in Phase 10; this is an honest placeholder.
      gameEvents.emit('notice', { text: '[diag] Knowledge Break not yet implemented (Phase 10)' })
    },

    bossPhase(floor) {
      gameEvents.emit('boss:gate', { floor: floor ?? usePlayerStore().currentFloor })
    },

    stats() {
      const g = (window as unknown as { __game?: any }).__game
      const scene = g?.scene?.getScenes?.(true)?.[0]
      const listeners = Object.values((gameEvents as any).all ?? new Map())
        .reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      return {
        fps: g?.loop?.actualFps ? Math.round(g.loop.actualFps) : 'n/a (game not mounted)',
        activeScene: scene?.scene?.key ?? 'n/a',
        entities: scene?.children?.list?.length ?? 'n/a',
        eventListeners: listeners,
      }
    },

    snapshot() {
      snap = JSON.stringify(usePlayerStore().$state)
      gameEvents.emit('notice', { text: '[diag] snapshot captured' })
    },

    reset(opts = {}) {
      const p = usePlayerStore()
      if (snap) p.$patch(JSON.parse(snap))
      else p.$reset()
      if (opts.persist && typeof localStorage !== 'undefined') {
        localStorage.setItem('player', JSON.stringify(p.$state))
      }
      gameEvents.emit('notice', { text: `[diag] reset (persist=${!!opts.persist})` })
    },
  }

  ;(window as unknown as { __ONET_DIAG__?: DiagApi }).__ONET_DIAG__ = api
  // eslint-disable-next-line no-console
  console.info('[ONET] diagnostics ready — window.__ONET_DIAG__.help()')
})
