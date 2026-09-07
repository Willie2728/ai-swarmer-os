# RUN78 — SWR-TXT-003: One Workflow, One Authority Boundary

## Customer Truth

An enterprise security buyer should not be asked to accept a broad protection claim before the product knows which autonomous workflow, tools, sensitive destinations, approval gates, trust-expiry triggers, and enforcement path are actually in scope.

The strongest early commercial action for SWARMER is therefore not a generic demo request. It is a durable scoping request for one bounded workflow and its authority boundary.

## Creative Strategy

**Hook:** Scope one workflow before you buy a security promise.

**CTA:** Record enterprise pilot scope.

The buyer supplies company, role/title, one autonomous workflow, authority boundary, human-approval actions, trust-expiry trigger, expected enforcement path/adapter, and decision window.

## Production Readiness

A new durable Base44 entity `EnterprisePilotRequest` was created. The public pilot section now persists the scope request and only shows success after the entity write succeeds.

Success language explicitly states that a recorded request is not pilot acceptance, a contract, a deployment, a security certification, an SLA, a subscription, a payment, or proof of complete protection.

- Base44 app: `6a9bb19021a824787266b7d4`
- Sandbox build: exit `0`
- Checkpoint: `6a9ef3dcb640ca0f494f40ba`
- Base44 commit: `df384a5aa76285d7c61e5ecd3fd16c802dc7c7c7`

## Distribution Queue

The WCL vault asset is approved and unpublished. SWARMER currently has 0/81 Base44 connectors connected, so no authenticated external distribution was attempted or claimed.

## Analytics / Evaluation

Fresh `EnterprisePilotRequest` baseline after instrumentation: **0 durable requests**. This is a new empty request baseline, not evidence of zero enterprise interest.

The first meaningful commercial conversion is a persisted scope request. Later stages must remain separate: operator fit review → verified contact attempt → confirmed conversation → accepted scope/contract → connected deployment → evidence receipt/outcome.

## Winner Library

No winner is declared without attributable production traffic and comparable qualified-request samples.

## Repository / Maturity Boundary

The operational GitHub repository describes SWARMER as an operational MVP with capability admission, fingerprinting, revalidation, evidence-backed incidents, policy enforcement and related controls, while explicitly stating that production still requires collectors/enforcement adapters, enterprise authentication, TLS, secrets management, backups, tenant isolation, fuller sandbox/scanner infrastructure, and independent security testing.

The Base44 UI is not represented as proof that those production enforcement integrations are connected. Base44 UI ↔ operational runtime/enforcement integration remains a Build Liaison verification item.
