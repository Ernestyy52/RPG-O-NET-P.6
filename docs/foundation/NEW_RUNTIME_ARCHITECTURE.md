# NEW RUNTIME ARCHITECTURE (Phase 01)

Target architecture for the transformed client. Introduced incrementally behind feature flags; the legacy path stays until each slice's gate passes.

## Layered view

```
┌──────────────────────────────────────────────────────────────┐
│ Presentation (Vue)                                            │
│  pages/ · components/game/* · HUD · modals · accessibility    │
│  — owns rendering, input surfacing, persistence orchestration │
└───────────────▲───────────────────────────────┬──────────────┘
                │ TypedGameBridge (typed events) │
┌───────────────┴───────────────────────────────▼──────────────┐
│ Session / Runtime (Phaser)                                    │
│  ZoneLoader · PlayerController · CollisionSystem · SpawnSystem │
│  EnemyController · InteractionSystem · CameraSystem           │
│  AtmosphereSystem · AudioSystem · NetworkAdapter              │
└───────────────▲───────────────────────────────┬──────────────┘
                │ pure calls                     │ CombatEvent
┌───────────────┴───────────────────────────────▼──────────────┐
│ Domain cores (framework-agnostic TypeScript, unit-tested)     │
│  Combat · Learning · Economy · Quest · Character · Progression│
└───────────────▲───────────────────────────────┬──────────────┘
                │ SaveEnvelope slices            │ RewardRequest (validated)
┌───────────────┴───────────────────────────────▼──────────────┐
│ Persistence & Services                                        │
│  SaveEnvelope + migration registry (localStorage)             │
│  NetworkAdapter → Colyseus (authoritative later)              │
│  Optional: Sheets report sink                                 │
└──────────────────────────────────────────────────────────────┘
```

## Principles

1. **Pure domain cores.** Combat/Learning/Economy rules are plain TS modules with no Vue/Phaser imports → deterministic, seed-testable. UI and scenes call them; they never call UI.
2. **One formula, one place.** Damage, rewards, mastery updates, loot exist exactly once. UI/scene are thin.
3. **Typed bridge.** Phaser⇄Vue only via `TypedGameBridge` (evolved `eventBus`). No store imports inside scenes.
4. **Feature-flagged replacement.** New zone runtime & real-time combat live behind flags; legacy Tower/BattleModal remain functional through adapters until World 1 gate.
5. **Versioned saves.** All persistence flows through a `SaveEnvelope { version, slices }` with an idempotent migration registry and pre-migration backup.
6. **Untrusted clients.** Offline is domain-validated; online-critical results/rewards become server-authoritative without changing the domain core signatures.
7. **Accessibility & mobile first-class.** Input abstraction (keyboard/mouse/touch), reduced motion/flash, reading-time settings live in UI/Settings and are honored by Session + Learning.

## Combat domain sketch (Phase 07 target types)

`CombatActor`, `RuntimeStats`, `DamageRequest → DamageResult`, `SkillDefinition → SkillExecution`, `Cooldown`, `Resource`, `StatusEffect`, `CombatEvent`, `EncounterResult`, `RewardRequest`. Legacy `BattleModal` becomes an adapter that submits `answer→DamageRequest` and renders `CombatEvent`s.

## Learning domain sketch (Phases 05–06)

`Question{ schema, status, provenance }`, `SubskillMastery`, `MisconceptionTag`, `ReviewSchedule`, `QuestionSelector`, `MasteryUpdater`, `ReviewScheduler`, `DailyLearningPlanGenerator`, `LearningSessionSummary`. Combat reports an answer outcome; Learning owns all state changes.

## Save slices (Phase 04 target)

`profile`, `character`, `learning`, `session`, `inventory`, `quest`, `settings` — each independently versioned inside one `SaveEnvelope`, with a legacy adapter reading today's monolithic `player` blob.
