# TEST STRATEGY (Phase 03)

## Goals
Establish the smallest compatible, deterministic test foundation that locks in the pure logic the
transformation depends on — without pulling in a heavy DOM/browser harness before it is needed.

## Tooling
- **Runner:** Vitest 3 (native to the existing Vite/Nuxt 4 toolchain — no new bundler).
- **Config:** `vitest.config.ts` — `environment: 'node'`, `~`/`@` aliased to `app/`, deterministic order (`sequence.shuffle: false`).
- **Scripts:** `npm test` → `vitest run` (CI/one-shot), `npm run test:watch` → `vitest`.
- **Scope now:** pure logic + Pinia store logic in Node. No `happy-dom`/component rendering yet; add only when a phase needs it (e.g., real-time combat UI).

## What is covered (45 tests / 7 files)
| File | Domain | Covers roadmap item |
|---|---|---|
| `test/floors.spec.ts` | scaling | stats/difficulty scaling, boss vs monster, town cadence, monotonic rewards |
| `test/questions.spec.ts` | learning | CEFR banding, content integrity, shuffle-bag no-repeat |
| `test/skills.spec.ts` | character | skill-tree integrity, **skill prerequisites** |
| `test/quests.spec.ts` | quest | **daily generation** (seeded determinism), quest shape, reward scaling |
| `test/equipment.spec.ts` | economy | catalog integrity, tier mapping, shop rules, **crafting recipes** |
| `test/loot.spec.ts` | economy | drop logic under controlled randomness, world-gated key drops |
| `test/player-store.spec.ts` | character/economy | **stats**, **rewards** & level-up, **damage seam** (def mitigation), **item transactions**, **quest transitions**, idempotent claim |

## Determinism rules
- Seeded generators (`rollDailyQuests`) asserted by equality across identical inputs.
- Randomized code (`rollLoot`, question selection) tested via `vi.spyOn(Math,'random')` or state-independent invariants (shuffle-bag detects a fresh-bag boundary rather than assuming pristine module state).
- No wall-clock or network dependencies. Vitest isolates each file's module registry, so module-level caches don't leak across files.

## Not yet covered (deferred, by design)
- Combat damage/reward formula lives in `BattleModal.vue` (UI). It is exercised indirectly via the store's damage seam; full unit coverage lands when the combat domain is extracted (Phase 07, ADR 0002).
- Save-migration tests arrive with the versioned SaveEnvelope (Phase 04).
- Scene lifecycle / listener-leak checks arrive with the new zone runtime (Phase 08) using the diagnostics `stats()` readout.

## Adding tests
Place `*.spec.ts` under `test/`. Prefer pure-function tests; for store logic use
`setActivePinia(createPinia())` in `beforeEach`. Keep tests deterministic and fast (<1s total today).
