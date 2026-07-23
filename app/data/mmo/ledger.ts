// ================================================================================================
// MMORPG atomic economy + server-authoritative inventory (Phases 19–24)
//
// The account (currency + items) is SERVER-owned; a client can only request a transaction the server
// validates (gate: "no client-authoritative inventory", "atomic economy"). Every transaction is:
//  • ATOMIC — all deltas apply together or none do (no partial spend, no negative balance/quantity).
//  • IDEMPOTENT — a transaction id applied twice takes effect once (safe on retry/reconnect — no dup).
//  • VALIDATED — the caller's requested deltas are checked against the current server state.
// Pure + deterministic ⇒ unit-testable without a server.
// ================================================================================================

export interface MmoAccount {
  gold: number
  gems: number
  items: Record<string, number>
}

export interface AccountDelta {
  gold?: number
  gems?: number
  /** itemId → signed quantity change. */
  items?: Record<string, number>
}

export interface MmoTransaction {
  /** stable id for idempotency (retry/reconnect safe). */
  id: string
  delta: AccountDelta
}

export interface TxResult {
  account: MmoAccount
  applied: boolean
  reason?: 'duplicate' | 'insufficient-funds' | 'insufficient-items'
}

export function emptyAccount(): MmoAccount {
  return { gold: 0, gems: 0, items: {} }
}

function clonedItems(items: Record<string, number>): Record<string, number> {
  return { ...items }
}

/**
 * Apply a transaction atomically. `appliedIds` is the server's idempotency set (mutated on success).
 * Rejects WITHOUT mutating the account when: the id was already applied (duplicate), or any resulting
 * gold/gems/item quantity would go negative (insufficient). Returns a NEW account on success.
 */
export function applyTransaction(account: MmoAccount, tx: MmoTransaction, appliedIds: Set<string>): TxResult {
  if (appliedIds.has(tx.id)) return { account, applied: false, reason: 'duplicate' }

  const d = tx.delta
  const gold = account.gold + (d.gold ?? 0)
  const gems = account.gems + (d.gems ?? 0)
  if (gold < 0 || gems < 0) return { account, applied: false, reason: 'insufficient-funds' }

  const items = clonedItems(account.items)
  for (const [id, qty] of Object.entries(d.items ?? {})) {
    const next = (items[id] ?? 0) + qty
    if (next < 0) return { account, applied: false, reason: 'insufficient-items' } // atomic: abort, no partial change
    items[id] = next
  }
  // prune zero-quantity items so the account can't grow unbounded with empty stacks
  for (const id of Object.keys(items)) if (items[id] === 0) delete items[id]

  appliedIds.add(tx.id)
  return { account: { gold, gems, items }, applied: true }
}

/** True when the account can afford a (negative-delta) transaction WITHOUT applying it — for previews. */
export function canApply(account: MmoAccount, delta: AccountDelta): boolean {
  if (account.gold + (delta.gold ?? 0) < 0) return false
  if (account.gems + (delta.gems ?? 0) < 0) return false
  for (const [id, qty] of Object.entries(delta.items ?? {})) {
    if ((account.items[id] ?? 0) + qty < 0) return false
  }
  return true
}
