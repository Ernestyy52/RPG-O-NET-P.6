# MIGRATION SEQUENCE (Phase 01)

Dependency-ordered implementation plan. Each slice is independently shippable, flag-guarded where it touches gameplay, and gated (see ACCEPTANCE_GATES.md). Order chosen so that safety/foundation precedes gameplay change, and every gameplay change has tests + rollback available first.

| # | Phase | Depends on | Flag? | Rollback |
|---|---|---|---|---|
| 1 | 00 Baseline | — | n/a | backup tag |
| 2 | 01 Audit | 00 | n/a | docs only |
| 3 | 02 Constitution/router | 01 | n/a | revert docs/config |
| 4 | **03 Test + diagnostics foundation** | 02 | diagnostics dev-only | test-only |
| 5 | **04 State split + versioned saves** | 03 | `saveEnvelope` | legacy store retained |
| 6 | 05 Curriculum + validation | 03 | adapter | current questions preserved |
| 7 | 06 Mastery + spaced review + daily planner | 04, 05 | — | learning state separate |
| 8 | **07 Extract combat domain** | 03, 04 | `combatDomain` | BattleModal adapter |
| 9 | 08 New Phaser zone runtime | 07 | `newZoneRuntime` | TowerScene legacy stays |
| 10 | 09 Real-time action-lite combat | 07, 08 | `realtimeCombat` | legacy modal fallback |
| 11 | 10 Knowledge Break | 06, 09 | `knowledgeBreak` | no-question fallback |
| 12 | 11 Adaptive Daily Expeditions | 06, 09 | adapter | shallow-counter fallback |
| 13 | 12 Four class kits | 07, 09 | per-class data | save migration |
| 14 | 13 Progression/loot/crafting/Sigils | 04, 07 | — | idempotent claims |
| 15 | 14 World 1 vertical slice | 08–13 | zone flags | per-zone |
| 16 | 15 Safe co-op + server authority | 07, 13, 14 | `coop` | offline deterministic path |
| 17 | 16 Teacher mode + reports | 05, 06 | — | export additive |
| 18 | 17 Mobile/a11y/perf/reliability | 08–16 | — | additive |
| 19 | 18 S-grade release audit | all above | n/a | audit only |
| 20 | 19 Account/DB/persistence | 04, 18 | interfaces + local adapter | provider = external blocker |
| 21 | 20 Authoritative world/zone services | 15, 19 | — | protocol versioned |
| 22 | 21 Social/guild/chat/moderation | 19, 20 | — | permission-gated |
| 23 | 22 Safe trade/economy | 13, 20 | — | atomic + reconciliation |
| 24 | 23 Content authoring/live-ops/observability | 19–22 | feature flags | config rollback |
| 25 | 24 MMORPG readiness audit | 19–23 | n/a | audit only |

## Critical-path notes

- **Saves (04) before any gameplay data change.** Class kits (12), loot (13), expeditions (11) all mutate persisted shape — they must land on the versioned envelope with migrations.
- **Combat extraction (07) before real-time (09) and classes (12).** A single pure formula must exist before new front-ends consume it.
- **Curriculum (05) + mastery (06) before Knowledge Break (10)** so that answer outcomes have somewhere correct to go.
- **World 1 (14) is the first big integration gate** — it consumes 08–13. S-grade (18) must pass before MMORPG phases (19+).
- **Server authority is introduced without changing domain-core signatures**, so offline and online share one rule set.
