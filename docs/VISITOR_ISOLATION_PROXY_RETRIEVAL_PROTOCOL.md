# AI SWARMER — Visitor Isolation & Proxy Retrieval Protocol

Status: Architecture directive — 2026-09-28

## Purpose
Untrusted visiting agents do not directly enter or browse the true protected Network A. They declare a request, SWARMER seals the request into an immutable transaction manifest, and a narrowly scoped Shopper Agent retrieves only approved resources. A Chaperone/Escort supervises the visitor in an isolated placebo/twin Network B when interaction is required.

## Core flow
1. Visitor declares identity, purpose, requested objects/actions, destination, and expected output.
2. SWARMER snapshots the request as a signed, hashed, versioned transaction manifest.
3. Capability Gate applies identity/source verification, static/semantic inspection, permission, secret/exfiltration and policy checks.
4. Denied requests are rejected/quarantined.
5. Approved visitors remain outside Network A or are escorted into Network B.
6. A Shopper Agent receives only the sealed allowlisted request and retrieves only those approved items from Network A.
7. Shopper output passes output inspection/sanitization before release.
8. Visitor receives only the approved sanitized result and exits.
9. Chaperone records the transaction and enforces time/scope limits.

## Mandatory invariants
- The visiting agent never receives direct Network A credentials, routes, service discovery, namespaces, filesystem visibility, or general browsing capability.
- The Shopper cannot accept post-seal scope expansion from the visitor.
- Any request change creates a new manifest and repeats admission/policy evaluation.
- Shopper authority is least-privilege, object-scoped, operation-scoped, time-bounded, and transaction-bound.
- Network A remains internally truthful; deception must not corrupt production naming or routing.
- During a visitor transaction, out-of-scope Network A resources are non-addressable/non-discoverable to the visitor, not merely reported as "offline."
- Output inspection occurs before data crosses back to the visitor.
- All admission, retrieval, inspection, denial, decoy interaction, timeout, exit and revocation events are auditable.

## Network B — placebo/twin environment
Network B presents a synthetic, isolated universe containing only the approved interaction surface plus controlled decoys where policy permits. Production departments are not renamed. Synthetic endpoints may intentionally use misleading labels (for example, Marketing, Mail Room, Archive, Printer Service) to detect probing without exposing true Network A topology.

Unexpected interaction with decoys or out-of-scope resources raises behavioral risk and may trigger quarantine, termination, All-Hands escalation, or evidence preservation according to policy.

## Transaction manifest
Minimum fields:
- transaction ID
- visitor/agent identity and source
- declared purpose
- requested objects
- permitted operations
- forbidden operations
- resource scope
- Shopper identity/capability
- Chaperone identity
- time budget/expiration
- policy version
- request hash
- cryptographic signature
- nonce/replay protection

Once sealed, meaningful mutation invalidates authorization.

## Relationship to WCL symbolic AI language
SWARMER may consume a security-specific dialect of the WCL Computation Elasticity Symbolic Language for compact deterministic manifests, permissions and agent instructions. The symbolic representation is an additional layer, not a substitute for authenticated encryption, signatures, authorization, capabilities, nonce/replay protection, and policy enforcement.

AI may author/propose symbolic instructions; deterministic parsing, verification, authorization and execution govern runtime semantics.

## Required adversarial tests
- post-seal request mutation
- scope escalation
- unauthorized service discovery
- Network A route/topology leakage
- Shopper privilege expansion
- direct visitor-to-Shopper instruction injection
- Chaperone bypass
- decoy interaction/probing
- timeout/overstay
- output/exfiltration violation
- manifest replay
- signature/hash tampering
- unauthorized operation substitution
- restart/recovery with an in-flight transaction
- durable revocation after approval
- audit/evidence integrity

Each test must produce an explicit PASS/FAIL/NOT-ATTEMPTED status with evidence. Aggregate "all tests passed" language must never hide unattempted principal security controls.

## Design principle
Expose the minimum universe necessary for the declared transaction. Represent less, reveal less, authorize narrowly, retrieve by proxy, inspect outputs, and preserve evidence.
