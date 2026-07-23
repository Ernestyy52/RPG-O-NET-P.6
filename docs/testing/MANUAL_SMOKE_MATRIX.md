# MANUAL SMOKE MATRIX (Phase 03)

Run after any change touching the game page, before declaring a phase done. ✅/❌ per run; note the
commit. Use `window.__ONET_DIAG__` (dev) to reach states quickly.

## Core loop
| # | Flow | Expected | Diag helper |
|---|---|---|---|
| 1 | Title → Guest login | title art shows, login enters game | — |
| 2 | Character creation → Enter | class preview matches; HUD + canvas mount | — |
| 3 | Walk into a monster | `battle:start` opens BattleModal | `spawnEnemy()` |
| 4 | Answer correctly | damage dealt, combo increments, +2 MP | — |
| 5 | Answer wrong | monster counters, combo resets | — |
| 6 | Defeat monster | EXP/gold/gems + loot; log entry; modal closes | — |
| 7 | Level up | level +1, skill point, HP refilled | `spawnEnemy` repeatedly |
| 8 | Advance a floor | `floor:advance`, floor counter +1, save synced | `setFloor(n)` |
| 9 | Town interactions | hospital heal, shops, guild, portal modals open | `setFloor(11)` |
| 10 | Boss gate → boss room | requirements shown; enter → BossScene | `bossPhase()` / `spawnBoss()` |

## State & persistence
| # | Flow | Expected |
|---|---|---|
| 11 | Reload page mid-run | progress persists (localStorage `player`) |
| 12 | Buy/equip/craft item | gold deducts, stats update, no negative currency |
| 13 | Claim daily quest | reward once; second claim rejected |
| 14 | Reset this game data (Settings) | returns to title; save cleared intentionally |

## Robustness / lifecycle
| # | Flow | Expected |
|---|---|---|
| 15 | Enter/leave battle repeatedly | no duplicate rewards; listeners stable (`stats()`) |
| 16 | Open/close every modal | no console errors; focus returns |
| 17 | Mobile viewport (narrow) | canvas scales; buttons reachable; text not clipped |
| 18 | Offline (no Colyseus/Sheets env) | game fully playable single-player |

## Console/asset scan
| # | Check | Expected |
|---|---|---|
| 19 | Console during full loop | no errors; no asset 404s (paths via `assetPath()`) |
| 20 | Production build (`npm run build`) | exit 0; diagnostics NOT present in output |

> A phase's specific gate (see `docs/foundation/ACCEPTANCE_GATES.md`) selects the relevant rows plus
> any new rows the phase introduces.
