// ================================================================================================
// MMORPG account persistence interface (Phases 19–24)
//
// A versioned, integrity-checked persistence contract for the server-owned account (gate: "persistence
// interfaces tested"). Loading is TOTAL + safe: a corrupt/partial/unknown blob never throws and never
// silently loses data without a safe default — it returns a fresh account flagged `recovered` so the
// caller can log/repair rather than crash. Pure ⇒ unit-testable without any storage backend.
// ================================================================================================
import { emptyAccount, type MmoAccount } from './ledger'

export const MMO_ACCOUNT_VERSION = 1

export interface PersistedAccount {
  version: number
  account: MmoAccount
  /** deterministic integrity checksum of `account` — a mismatch means the blob was tampered/corrupted. */
  checksum: number
}

/** Deterministic FNV-1a-style checksum over the canonical account shape. Same account ⇒ same checksum. */
export function accountChecksum(account: MmoAccount): number {
  const canonical = JSON.stringify({
    gold: account.gold,
    gems: account.gems,
    items: Object.fromEntries(Object.entries(account.items).sort(([a], [b]) => a.localeCompare(b))),
  })
  let h = 0x811c9dc5
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Serialize an account into the versioned, checksummed envelope for atomic write. */
export function serializeAccount(account: MmoAccount): PersistedAccount {
  return { version: MMO_ACCOUNT_VERSION, account, checksum: accountChecksum(account) }
}

export interface LoadResult {
  account: MmoAccount
  /** true when the blob was missing/corrupt/tampered and a safe default was substituted (never a silent loss). */
  recovered: boolean
}

function isPlainAccount(a: unknown): a is MmoAccount {
  if (!a || typeof a !== 'object') return false
  const o = a as Record<string, unknown>
  return typeof o.gold === 'number' && typeof o.gems === 'number' && !!o.items && typeof o.items === 'object'
}

/**
 * Load an account from an untrusted blob. Total + safe: returns `{ account, recovered }`. `recovered` is
 * true when the input was missing, the wrong version, structurally invalid, or failed the checksum —
 * in which case a fresh empty account is returned (never throws, never a silent partial load).
 */
export function loadAccount(raw: unknown): LoadResult {
  if (!raw || typeof raw !== 'object') return { account: emptyAccount(), recovered: true }
  const env = raw as Partial<PersistedAccount>
  if (env.version !== MMO_ACCOUNT_VERSION || !isPlainAccount(env.account)) {
    return { account: emptyAccount(), recovered: true }
  }
  const acc: MmoAccount = { gold: env.account.gold, gems: env.account.gems, items: { ...env.account.items } }
  if (accountChecksum(acc) !== env.checksum) return { account: emptyAccount(), recovered: true }
  // clamp any impossible negatives defensively (a valid checksum on bad data still shouldn't corrupt state)
  if (acc.gold < 0 || acc.gems < 0 || Object.values(acc.items).some((q) => q < 0)) {
    return { account: emptyAccount(), recovered: true }
  }
  return { account: acc, recovered: false }
}
