# SWARMER Trusted Handoff Gateway (THG)

## Purpose
THG lets an external/visiting agent delegate work without receiving execution presence or routable access inside the protected workload network. A2A is the interoperability envelope; SWARMER remains the trust and policy authority.

## Trust-boundary flow
```text
VISITING AGENT
     |  A2A request
     v
[EXTERNAL A2A FRONTIER / DMZ]
 identity + provenance + schema + payload inspection
 capability/risk/policy + rate/time/spend constraints
     |
     | sanitized work object only
     v
[TRUSTED HANDOFF GATE] ---- reject/quarantine ---> [RED ROOM]
     |
     v
[TRUSTED WCL AGENT]
 approved tools / computer / APIs; visitor has no credentials,
 shell, browser session or protected-network route
     |
     v
[RESULT GATE]
 DLP + secret stripping + provenance + receipt
     |
     | sanitized A2A result
     v
VISITING AGENT
```

## Invariants
1. Visiting agents are HANDOFF_ONLY.
2. No visiting-agent shell, credential, browser-session or protected-network authority.
3. Only schema-constrained sanitized job objects cross inward.
4. Trusted agents execute with separately governed least privilege.
5. Results cross an outbound DLP/sanitization gate.
6. Every admission, rejection, execution and return should be auditable.
7. Suspicious requests may be rejected or diverted to Red Room inspection.

## API contract
`POST /api/v1/a2a/handoff` creates an inspected handoff object.
`POST /api/v1/a2a/handoff/:request_id/result` releases a sanitized result.

These endpoints use SWARMER admin authentication in the MVP. Production A2A federation must add signed Agent Cards/requests, replay protection, tenant isolation, durable handoff storage, scoped trusted-agent assignment and independent security testing.
