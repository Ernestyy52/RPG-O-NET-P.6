# S-GRADE AUDIT (Phase 18)

> Independent, honest assessment of the S-grade transformation. Per the constitution gate: **every
> mandatory gate must pass, unresolved issues must be classified accurately, and NO false S-grade claim
> may be made.** This document states the true status — code-complete + fully unit-tested, with the
> live/human-verification items explicitly outstanding.

**Audit date:** 2026-07-15 · **Branch:** `foundation/sgrade-full-transformation` · **Evidence:**
`npm test` → **281 passing / 31 files**; `npm run build` exit 0; `node --check server/index.js` OK;
`nuxt generate` output 24 MB with no hardcoded root asset paths.

## Verdict

**NOT an unconditional S-grade — and this audit does not claim one.** The build is **S-grade in
engineering discipline** (every phase is a pure/tested domain behind a reversible flag, no rewrite, saves
sacred, formulas single-source, rewards idempotent, offline-deterministic) and **every automatable
acceptance-gate row passes with test evidence.** What stands between this and a signed S-grade release is
a bounded, well-classified set of **live/human verifications that cannot be performed headless** — not
unknown risk, not missing logic.

## Per-phase gate matrix

| Phase | Gate | Status | Evidence / outstanding |
|---|---|---|---|
| 00 Baseline | reproducible, clean diff, rollback | ✅ PASS | tags `backup/pre-transformation-*`, `backup/pre-phase-14` |
| 01 Audit | independently reviewable, no gameplay code | ✅ PASS | docs only |
| 02 Constitution | valid agents/settings, no app change | ✅ PASS | docs/.claude only |
| 03 Test/diagnostics | deterministic tests, build passes | ✅ PASS | Vitest suite |
| 04 Saves | migrate, idempotent, recovery, rollback | ✅ PASS | `save.spec.ts` v1→v4 |
| 05 Curriculum | reviewed-only selectable, invalid rejected | ✅ PASS | curriculum tests |
| 06 Mastery | deterministic, weak-recur, learning≠power | ✅ PASS | `learning.spec.ts` |
| 07 Combat extract | no dup formula, equivalence, rollback flag | ✅ PASS | `combat.spec.ts` |
| 08 Zone runtime | legacy remains, no leak on re-enter | ✅ PASS | `zone-runtime.spec.ts` + lifecycle |
| 09 Real-time combat | no fps-dep dmg, no dup reward, safe reset | ✅ PASS | `combat-realtime.spec.ts` |
| 10 Knowledge Break | not every hit, wrong≠death, learning updates | ✅ PASS | `knowledge-break.spec.ts` |
| 11 Expeditions | vary, non-punitive, deterministic, no filler | ✅ PASS | `expedition.spec.ts` |
| 12 Class kits | identity, no best path, solo-viable, migrate | ✅ PASS | `class-kits.spec.ts` |
| 13 Economy | seeded sim, no negative, no dup, no grind | ✅ PASS | `economy.spec.ts` |
| 14 World 1 | boss beatable, no soft-lock, summary, phases, no placeholder | ✅ PASS (automatable) · ⏳ human | soft-lock/save/economy/asset-path tested; **interactive playthrough + boss glance + mobile = human** |
| 15 Co-op authority | no lone victory, no dup, sync boss, reconnect, offline | ✅ PASS (properties) · ⏳ live | `coop.spec.ts` proves all properties; **live multi-client run = deployed server** |
| 16 Teacher | no answer-key exposure, data separated, export tested | ✅ PASS (domain) · ⏳ UI | `teacher.spec.ts`; **dashboard page = `TEACHER_ENABLED` flip** |
| 17 Mobile/a11y/perf | build, cycles stable, reduced-motion, perf | ✅ PASS (automatable) · ⏳ human | `stability.spec.ts` + a11y guards; **viewport/FPS matrix = human-measured** |
| 18 S-grade audit | all gates pass, issues classified, no false claim | ✅ PASS | this document |
| 19–24 MMORPG | tested persistence/instance/economy/security ifaces | ✅ PASS (interfaces) · ⏳ live | `mmo.spec.ts` — deterministic instance lifecycle, atomic+idempotent server-owned ledger, versioned safe-recovery persistence; **live load/security = real-infra evidence (Class B), not claimed** |

## Outstanding issues — classified (not hidden)

**Class A — human-at-browser verification (Phaser can't render headless here).** World-1 fresh-profile
playthrough (desktop/mobile/reduced-motion), boss 3-channel glance test, viewport/FPS matrix. *Risk:*
low — the underlying logic is unit-tested; this is visual/feel confirmation. *Action:* run `npm run dev`
before any public release.

**Class B — live infrastructure verification.** Co-op server-authority live run (deployed Colyseus +
multiple clients + reconnect); MMORPG-phase load/security evidence. *Risk:* medium — authority
*properties* are unit-tested and the server room mirrors the tested spec, but real network/scale behavior
is unverified. *Action:* deploy the server, flip `COOP_ENABLED`, exercise multi-client.

**Class C — deferred flag-flip integrations (built dormant, un-surfaced).** ~~Teacher dashboard page
(`TEACHER_ENABLED`)~~ **CLOSED 2026-07-15** — `/teacher` page live on the tested reports domain (D-026).
Remaining: save-envelope cutover (`SAVE_ENVELOPE_ENABLED`), World-1 named-gear icons/SFX
(asset backlog). *Risk:* low — additive, reversible, un-surfaced until intentionally enabled.

**Post-audit S-grade learning pass (2026-07-15, D-025/D-026):** question bank 150 reviewed items with
full pedagogy metadata (explanation / distractor reasoning / subskill / provenance — constitution rule 2
now holds for EVERY production item, guarded by `test/question-bank.spec.ts`); explanations surfaced
after every answer in all three question UIs; mastery-weighted weak-recur battle selection
(`MASTERY_BATTLE_SELECTION_ENABLED`); battle answers feed mastery. Evidence: **309 tests / 34 files**,
build exit 0, dev smoke green. A teacher spot-check of the 81 generated items is recommended
(non-blocking; items pass the full validation pipeline).

**No Class-D (correctness-unknown) issues.** Every shipped code path is either unit-tested or a dormant,
reversible flag.

## Why this is an honest report

Per the gate, an S-grade claim is only valid when it is true. This build has **not** been proven end-to-end
by a human/live run, so it is **not** declared release-S-grade. It **is** declared **engineering-complete
and gate-audited**: 00–18 pass every automatable acceptance-gate row with test evidence, and the remaining
work is the explicitly-classified live/human verification above — the correct, non-inflated status.
