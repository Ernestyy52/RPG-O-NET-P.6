# DIAGNOSTIC MODE (Phase 03)

Development-only tooling for manual verification. **Disabled in production by default** — the entire
plugin body is gated behind `import.meta.dev`, so a `nuxt build`/`generate` output registers nothing.

## Enabling
Run the dev server: `npm run dev`. On the game page, open the browser console. You should see:
```
[ONET] diagnostics ready — window.__ONET_DIAG__.help()
```

## API — `window.__ONET_DIAG__`
| Call | Effect |
|---|---|
| `help()` | list all commands |
| `setFloor(n)` | jump the player to floor `n` |
| `setClass(id, gender?)` | `warrior` \| `mage` \| `archer` \| `guardian` |
| `grant(itemId, qty=1)` | add an item; auto-equips if it is equipment |
| `spawnEnemy({name,hp,atk,boss,floor})` | emit a `battle:start` encounter |
| `spawnBoss(floor?)` | emit a boss encounter using `getBossStats` |
| `knowledgeBreak()` | honest placeholder until Phase 10 (emits a notice) |
| `bossPhase(floor?)` | open the boss gate for a floor |
| `stats()` | FPS, active scene, entity count, event-listener count |
| `snapshot()` | capture current player state in memory |
| `reset({persist:false})` | restore the snapshot; **does not** wipe the real save unless `persist:true` |

## Safety
- `reset()` operates on an in-memory snapshot and never touches `localStorage` unless `persist:true`
  is explicitly passed — a diagnostic session cannot clobber a real player save by accident.
- `stats()` reads the existing dev-only `window.__game` handle set by `GameCanvas.client.vue`; if the
  Phaser game is not mounted it reports `n/a` instead of throwing.
- No gameplay files were modified to add diagnostics.

## Observability roadmap
`stats().eventListeners` and `entities` are the first observability signals. Phase 08 will use repeated
enter/exit of the new zone runtime plus these counters to assert no listener/timer leaks; Phase 17/18
extend this into a measured performance/reliability benchmark.
