# SWARMER SELF-HEAL — Governed Self-Sustaining Security Architecture

## Objective
Maintain SWARMER's trusted operating state without allowing production security software to rewrite and approve its own live controls.

## Closed loop
Observe → Detect → Contain → Diagnose → Propose Repair → Fingerprint → Capability Gate → Red Room → Attack/Test → Invariant Verification → Independent Judges → Approval → Canary → Observe → Promote/Rollback → Experience Ledger.

## Trust separation
- Repair producers cannot approve their own repair.
- Candidate repairs are untrusted capabilities.
- Candidate code must be signed/identified, pass Capability Gate, Red Room, regression tests and immutable invariants.
- Production promotion is staged.
- Security regression forces rollback.
- LLM reasoning is advisory; deterministic authorization remains authoritative.

## Immutable invariants
The machine-readable invariant catalog is exported from `src/self-heal.js`. These invariants protect human authority, containment, secrets, control provenance, audit integrity, revalidation, data egress and emergency shutdown.

## Five healing classes
1. Code healing — propose patches for defects/vulnerabilities.
2. Configuration healing — restore approved configuration after drift.
3. Identity healing — revoke/rotate/reduce compromised authority.
4. Infrastructure healing — restart/replace/reroute unhealthy workloads through authorized adapters.
5. Policy healing — detect enforcement gaps and propose policy changes.

The current module implements the governance decisions for these classes. Real infrastructure/code mutation adapters remain external and must be explicitly authorized.

## Graceful degradation
- LLM unavailable: deterministic enforcement continues.
- Red Room unavailable: suspicious capabilities remain quarantined.
- Threat intelligence unavailable: cached/local policy continues.
- Primary store unavailable: signed evidence should be buffered by the deployment adapter; privileged mutations fail closed.

## Independent judges
A repair requires security, regression, policy, adversarial and deterministic verification. A judge may be implemented by a separate model/provider or deterministic test system, but the deterministic controls remain authoritative.

## Canary
Default stages: 1% → 5% → 25% → 100%. Health regression, invariant failure or excessive error-rate delta produces rollback.

## Experience Ledger
Repair outcomes are hash chained so prior failures and successful repairs can inform future diagnosis without making old repairs automatically trusted.

## Safety boundary
This architecture does not authorize SWARMER to attack external systems, silently modify production, bypass human/policy approval, or self-certify a repair it produced.
