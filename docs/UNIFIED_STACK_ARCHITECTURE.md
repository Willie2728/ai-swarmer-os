# Unified WCL Agent Control Stack

This repository is one product and one security architecture. The modules are layers, not standalone products.

## Enforcement path

`Untrusted agent/capability → SWARMER admission + behavior verification → SOVRAIL execution/action authorization → protected tools/providers → KAMERON integrity-bound recovery`

## Layer responsibilities

- **AI SWARMER** — zero-trust admission, capability fingerprinting, risk detection, claimed-vs-observed verification, quarantine/Red Room decisions, continuous revalidation.
- **SOVRAIL** — sovereign execution boundary: provider allowlists, spend/routing policy, action authorization, failover and execution controls. It must not execute when SWARMER has not approved trust.
- **KAMERON** — resilience/recovery layer: checkpoints/recovery capsules, environment and integrity binding, safe resume/rollback. It must not resume work whose trust or behavioral verification failed.

`src/unified-stack.js` is the canonical integrated decision entry point. No layer may bypass another.

## Security invariant

**No autonomous action or recovery is permitted unless capability trust, execution policy, action authority, and recovery integrity all pass. Fail closed.**

## Acceptance test

Run `npm test`. The integrated adversarial suite is `test/unified-stack-adversarial.test.js`. It tests prompt injection, credential access, destructive commands, privilege escalation, tool poisoning, exfiltration indicators, behavioral mismatch, provider-policy bypass, denied/high-risk actions, and recovery after trust failure.

Passing these tests demonstrates implemented controls against these coded scenarios; it is not equivalent to independent penetration testing or proof against every adversary.
