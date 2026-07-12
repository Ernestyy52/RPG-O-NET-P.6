# ADR 0003 — Learning ↔ Combat firewall

- **Status:** Accepted (Phase 01)
- **Deciders:** learning-architect, combat-engineer (routed), main session
- **Context date:** 2026-07-12

## Context
A core product rule: measurable O-NET learning must stay honest and separate from combat power, and missed days must not punish the student. Today `player.ts` mixes a `correctAnswers` counter and `knowledge` stat that feeds `heroDamage()` — so answering questions both teaches and buffs damage, and there is no mastery/spaced-review model. If mastery ever scales combat power (or vice versa), learning metrics stop reflecting real understanding.

## Decision
Establish a strict firewall:
- **Learning domain** owns subskill mastery, misconceptions, spaced review, and daily planning. Its state changes only from validated answer events.
- **Combat domain** may *trigger* a Knowledge Break and *report* an answer outcome to Learning; it receives back feedback/scheduling, never a power multiplier derived from mastery.
- The existing `knowledge` **stat** remains a character/combat attribute (flavor: focus), explicitly distinct from **learning mastery**. Mastery never reads or writes combat stats; combat never reads mastery to scale damage.
- No punitive streaks; catch-up and rested-learning bonuses only. Only reviewed questions reach production.

## Consequences
- (+) Learning reports stay truthful (mastery = understanding, not grind).
- (+) Combat balance is independent of a student's answer history.
- (+) Enables teacher reporting without answer-key leakage (Phase 16).
- (−) Two parallel progress systems to maintain and test (seeded determinism required).
- **Reversibility:** additive domain; the firewall is a design invariant enforced in code review and tests, not a flag.

## Alternatives considered
- *Let mastery buff combat for motivation:* rejected — corrupts learning measurement and can create pay-to-win-like grind pressure.
