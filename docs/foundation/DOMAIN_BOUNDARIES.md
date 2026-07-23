# DOMAIN BOUNDARIES (Phase 01)

Target domain decomposition. Each domain owns its state, rules, and tests; cross-domain calls go through explicit interfaces, never by reaching into another domain's store.

## Domains

1. **Profile / Account** — identity, account name, auth surface, settings ownership pointer. (Today: fields in `player.ts`; future account service Phase 19.)
2. **Character** — class, appearance, level, job level, learned skills, derived stats. Owns the `stats` composition. Does **not** own learning mastery.
3. **Learning** — O-NET taxonomy, question schema/status/provenance, subskill mastery, misconceptions, spaced review, daily learning plan. **Strictly separate from combat power.** Owns validation pipeline.
4. **Combat** — pure rules: `CombatActor`, `RuntimeStats`, `DamageRequest/Result`, `SkillDefinition/Execution`, cooldown/resource, status effects, `CombatEvent`, `EncounterResult`, `RewardRequest`. UI-independent, no frame-rate-dependent damage.
5. **Session / Runtime** — Phaser zone runtime (ZoneLoader, controllers, systems), current encounter, transient scene state. Bridges to Vue via TypedGameBridge.
6. **Inventory / Economy** — items, currency, equipment, affixes/sockets, Sigils, crafting, drops, pity. Idempotent reward claims; no negative currency/duplication.
7. **Quest / Progression** — main/side quests, Daily Expeditions, world reputation, boss gates.
8. **UI / Settings** — HUD, modals, accessibility, input mode (keyboard/mouse/touch), audio controls.
9. **Network / Multiplayer** — rooms, party, presence, authoritative validation, reconnect, protocol versioning (grows in Phases 15, 20–22).
10. **Teacher / Reporting** — class/session setup, mastery movement, export (CSV/JSON/optional Sheets). Read-only over Learning; no active answer-key exposure.

## Ownership rules

- **State ownership:** each domain owns one slice of the SaveEnvelope (Phase 04): `profile`, `character`, `learning`, `session`, `inventory`, `quest`, `settings`.
- **Vue/Phaser boundary:** Phaser (Session/Runtime + Combat execution) never imports Pinia stores directly; it emits/consumes typed events via TypedGameBridge. Vue owns persistence and presentation. Combat **rules** are pure functions callable from either side.
- **Client/server authority:** offline single-player is client-computed but domain-validated; online-critical combat results and rewards are server-authoritative (Phases 15/20). Clients are untrusted.
- **Learning ↔ Combat firewall:** combat may *trigger* a Knowledge Break and report an answer outcome to Learning; Learning returns feedback/scheduling. Combat power never reads mastery to scale damage, and mastery never changes from combat stats.

## Current violations to unwind (from baseline)

- `BattleModal.vue` owns combat formulas, reward grants, and loot rolls (mixes Combat + Economy + UI). → extract (Phase 07/13).
- `player.ts` owns Character + Learning(`correctAnswers`) + Inventory + Quest + Session(`hp/mp`) in one store. → split (Phase 04).
- `index.vue` wires every event and modal (UI + Session + Quest orchestration). → decompose.
