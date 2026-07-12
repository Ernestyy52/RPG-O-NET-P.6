# ADR 0002 — Pure, UI-independent combat domain

- **Status:** Accepted (Phase 01)
- **Deciders:** combat-engineer, game-architect (routed), main session
- **Context date:** 2026-07-12

## Context
`components/game/BattleModal.vue` currently owns the entire combat computation: `heroDamage()`, `monsterAttack()`, initiative, combo bonus, reward grants (`gainRewards`), and loot rolls (`rollLoot`). Rules living in a Vue component make them untestable in isolation, impossible to reuse for real-time combat or server authority, and easy to duplicate/diverge when a second front-end appears.

## Decision
Extract a framework-agnostic combat domain (plain TypeScript, no Vue/Phaser imports): `CombatActor`, `RuntimeStats`, `DamageRequest → DamageResult`, `SkillDefinition → SkillExecution`, `Cooldown`, `Resource`, `StatusEffect`, `CombatEvent`, `EncounterResult`, `RewardRequest`. Rules become pure functions with deterministic, seed-testable behavior. Reward computation returns a `RewardRequest` that is validated/applied by the Economy domain (idempotent), never granted from UI.

`BattleModal` becomes a thin adapter: it turns an answer into a `DamageRequest` and renders emitted `CombatEvent`s. The extraction is guarded by a `combatDomain` flag and validated against equivalent legacy test cases so behavior is preserved (Phase 07 gate: no duplicated formula).

## Consequences
- (+) One formula, one place; reusable by real-time combat (Phase 09) and server authority (Phase 15/20) unchanged.
- (+) Deterministic unit tests; no frame-rate-dependent damage.
- (+) Rewards validated/idempotent → anti-duplication baked in.
- (−) Requires careful behavior-parity testing during extraction.
- **Reversibility:** `combatDomain` flag reverts to the legacy modal path.

## Alternatives considered
- *Refactor within the component:* rejected — still coupled to Vue, unusable for Phaser/real-time/server.
- *Rewrite combat from scratch:* rejected — violates "no full rewrite"; loses the working, tuned turn-based behavior before a replacement is proven.
