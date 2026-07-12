# MMORPG TARGET ARCHITECTURE (Phase 01)

Direction only. No massive-scale claims without measured load evidence (roadmap rule). This describes the eventual service shape that the client domain cores must remain compatible with.

## Guiding constraints
- Educational integrity and child-safety are first-class, not add-ons.
- No real-money trading, gambling, paid loot boxes, or pay-to-win — ever.
- Clients are untrusted; critical combat results, inventory, and rewards are server-authoritative.
- Domain cores (Combat/Learning/Economy) keep the **same interfaces** offline and online — the server runs the same rules authoritatively.
- Offline/classroom play must remain possible (deterministic local path).

## Service boundaries (Phases 19–23)

```
Client (Nuxt+Phaser, domain cores)
        │  versioned protocol
        ▼
┌ Gateway / Session ─ auth, session identity, presence routing
├ World Directory ─ zone/instance registry, matchmaking
├ Zone Services ─ town zones · field zones · dungeon instances · party instances
│     └ authoritative movement constraints, monster/combat state, instance lifecycle
├ Persistence ─ account · character · inventory/economy · learning profile · quest/world
│     └ migrations · backups · data ownership · local/offline sync
├ Social ─ friends · party finder · guild/roles · chat channels · block/report · moderation
├ Economy ─ secure trade · optional market · bind rules · sinks/taxes · fraud/dup detection · audit log
└ Live-Ops / Observability ─ content templates · event scheduler · feature flags · analytics (minimal PII) · health/error metrics
```

## Authority model
- **Movement:** client-predicted, server-validated (bounds/speed). Replaces today's clamp-only town prototype.
- **Combat:** server owns encounter state and result for online instances; client renders. Offline uses the same domain core locally.
- **Inventory/economy:** never client-authoritative online; atomic transactions with replay protection and reconciliation.
- **Learning:** mastery/review computed from validated answer events; teacher reports read-only, no active answer keys.

## Persistence targets (Phase 19)
- Interfaces + local-development adapters + schemas + migrations + tests shipped first.
- Real provider (DB/hosted realtime) provisioning is an **external owner blocker** (credentials/payment) — implement to interfaces, mark provisioning as the only blocker.

## Scaling & readiness (Phases 20, 24)
- Horizontal scaling hooks on zone/instance services; deterministic instance lifecycle; reconnect routing; no orphaned encounters; protocol versioning; load-test harness.
- MMORPG readiness (Phase 24) requires measured load/security/economy/DR evidence — documented in `docs/mmorpg/*`. No readiness claim without it.

## Cost & operations
- Server hosting, DB, moderation, and observability carry recurring cost — an owner decision. Captured in KNOWN_BLOCKERS (B-02..B-04).
