import { describe, it, expect } from 'vitest'
import {
  MMO_ENABLED,
  createInstance, advanceInstance, instanceAcceptsJoins, INSTANCE_DRAIN_GRACE_MS,
  emptyAccount, applyTransaction, canApply,
  serializeAccount, loadAccount, accountChecksum, MMO_ACCOUNT_VERSION,
} from '~/data/mmo'

// ================================================================================================
// Phases 19–24 (MMORPG foundation) — tested interface layers: deterministic instance lifecycle,
// atomic + idempotent server-owned economy/inventory, versioned safe-recovery persistence.
// (Live load/security evidence is a separate infra gate — see S_GRADE_AUDIT Class B.)
// ================================================================================================

describe('mmo — dormant flag', () => {
  it('MMO_ENABLED is false (no live MMO surface until infra + load/security evidence)', () => {
    expect(MMO_ENABLED).toBe(false)
  })
})

describe('mmo — deterministic instance lifecycle', () => {
  it('runs creating → active → draining → closed and never re-opens', () => {
    let s = createInstance('inst-1', 0)
    expect(s.phase).toBe('creating')
    s = advanceInstance(s, { type: 'ready' })
    expect(s.phase).toBe('active')
    expect(instanceAcceptsJoins(s)).toBe(true)
    s = advanceInstance(s, { type: 'join', playerId: 'p1' })
    s = advanceInstance(s, { type: 'join', playerId: 'p2' })
    expect(s.players).toEqual(['p1', 'p2'])
    s = advanceInstance(s, { type: 'join', playerId: 'p1' }) // dup join ignored
    expect(s.players).toEqual(['p1', 'p2'])

    s = advanceInstance(s, { type: 'drain', now: 1000 })
    expect(s.phase).toBe('draining')
    expect(instanceAcceptsJoins(s)).toBe(false)
    s = advanceInstance(s, { type: 'join', playerId: 'p3' }) // no join while draining
    expect(s.players).toEqual(['p1', 'p2'])

    s = advanceInstance(s, { type: 'leave', playerId: 'p1' })
    s = advanceInstance(s, { type: 'leave', playerId: 'p2' })
    s = advanceInstance(s, { type: 'tick', now: 1100 }) // empty ⇒ close
    expect(s.phase).toBe('closed')

    // terminal: further events are no-ops
    expect(advanceInstance(s, { type: 'ready' }).phase).toBe('closed')
    expect(advanceInstance(s, { type: 'join', playerId: 'x' }).players).toEqual([])
  })

  it('closes a non-empty draining instance after the grace period', () => {
    let s = advanceInstance(createInstance('i', 0), { type: 'ready' })
    s = advanceInstance(s, { type: 'join', playerId: 'p1' })
    s = advanceInstance(s, { type: 'drain', now: 0 })
    s = advanceInstance(s, { type: 'tick', now: INSTANCE_DRAIN_GRACE_MS - 1 })
    expect(s.phase).toBe('draining') // still within grace
    s = advanceInstance(s, { type: 'tick', now: INSTANCE_DRAIN_GRACE_MS })
    expect(s.phase).toBe('closed') // grace elapsed
  })

  it('is deterministic — same state+event ⇒ same next state', () => {
    const s = advanceInstance(createInstance('i', 0), { type: 'ready' })
    expect(advanceInstance(s, { type: 'join', playerId: 'p' })).toEqual(advanceInstance(s, { type: 'join', playerId: 'p' }))
  })
})

describe('mmo — atomic + idempotent economy (server-owned inventory)', () => {
  const applied = () => new Set<string>()

  it('applies gold + item deltas together (atomic) on success', () => {
    const acc = { gold: 100, gems: 0, items: { potion: 2 } }
    const ids = applied()
    const r = applyTransaction(acc, { id: 't1', delta: { gold: -30, items: { sword: 1, potion: -1 } } }, ids)
    expect(r.applied).toBe(true)
    expect(r.account.gold).toBe(70)
    expect(r.account.items).toEqual({ potion: 1, sword: 1 })
    expect(acc.gold).toBe(100) // original untouched (pure)
  })

  it('rejects the WHOLE transaction (no partial change) when any part is unaffordable', () => {
    const acc = { gold: 10, gems: 0, items: { potion: 1 } }
    const ids = applied()
    const r = applyTransaction(acc, { id: 't2', delta: { gold: -5, items: { potion: -5 } } }, ids) // can't remove 5 potions
    expect(r.applied).toBe(false)
    expect(r.reason).toBe('insufficient-items')
    expect(r.account).toBe(acc) // unchanged — atomic abort, no partial gold spend
  })

  it('never goes negative on currency', () => {
    const r = applyTransaction(emptyAccount(), { id: 't3', delta: { gold: -1 } }, applied())
    expect(r.applied).toBe(false)
    expect(r.reason).toBe('insufficient-funds')
  })

  it('is idempotent — the same transaction id applies exactly once (retry/reconnect safe)', () => {
    const ids = applied()
    let acc = emptyAccount()
    const tx = { id: 'grant-boss-1', delta: { gold: 100 } }
    let r = applyTransaction(acc, tx, ids)
    expect(r.applied).toBe(true)
    acc = r.account
    r = applyTransaction(acc, tx, ids) // duplicate
    expect(r.applied).toBe(false)
    expect(r.reason).toBe('duplicate')
    expect(r.account.gold).toBe(100) // not doubled
  })

  it('canApply previews affordability without mutating', () => {
    const acc = { gold: 50, gems: 0, items: {} as Record<string, number> }
    expect(canApply(acc, { gold: -50 })).toBe(true)
    expect(canApply(acc, { gold: -51 })).toBe(false)
  })
})

describe('mmo — versioned safe-recovery persistence', () => {
  it('round-trips a valid account', () => {
    const acc = { gold: 500, gems: 3, items: { sword: 1, potion: 4 } }
    const env = serializeAccount(acc)
    expect(env.version).toBe(MMO_ACCOUNT_VERSION)
    const r = loadAccount(env)
    expect(r.recovered).toBe(false)
    expect(r.account).toEqual(acc)
  })

  it('recovers (never throws, never silently loses) on missing/wrong-version/corrupt input', () => {
    expect(loadAccount(undefined).recovered).toBe(true)
    expect(loadAccount({ version: 999, account: emptyAccount(), checksum: 0 }).recovered).toBe(true)
    // tampered account with a stale checksum ⇒ integrity fail ⇒ safe recovery
    const env = serializeAccount({ gold: 100, gems: 0, items: {} })
    const tampered = { ...env, account: { ...env.account, gold: 999999 } }
    const r = loadAccount(tampered)
    expect(r.recovered).toBe(true)
    expect(r.account).toEqual(emptyAccount())
  })

  it('checksum is deterministic + order-independent for items', () => {
    expect(accountChecksum({ gold: 1, gems: 2, items: { a: 1, b: 2 } }))
      .toBe(accountChecksum({ gold: 1, gems: 2, items: { b: 2, a: 1 } }))
  })
})
