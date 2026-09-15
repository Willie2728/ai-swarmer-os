# WCL Agent Authority Registry Architecture

## Principle
Registration does not grant an AI agent permission to exist. It establishes cryptographically verifiable permission to operate within a defined scope.

## Agent Identification Number (AIN)
Every agent and sub-agent receives a globally unique, non-reusable identifier bound to a cryptographic public key and genesis record.

## Agent Operating Credential (AOC)
A signed credential records creator, owner, operator, parent-agent lineage, model/runtime declaration, software fingerprint, version, permitted capabilities, tools, resources, financial limits, network destinations, filesystem/credential authority, delegation depth, policy domain, issue/expiry times and lifecycle status.

Lifecycle: PROVISIONAL -> ACTIVE -> RESTRICTED -> SUSPENDED -> REVOKED -> RETIRED.

## Delegation lineage
Every principal-to-agent and parent-to-child grant is signed and scoped. A child may never inherit or delegate authority the parent does not possess.

## Action receipts / Agent Black Box
Consequential autonomous actions produce append-only signed receipts: AIN, principal, action, resource, authority used, capability, software fingerprint, timestamp and decision. Detailed telemetry remains private. Cryptographic commitments/Merkle roots may be anchored to immutable storage or a distributed ledger for tamper evidence without exposing private enterprise activity.

## SWARMER integration
AI SWARMER OS verifies AIN/AOC before consequential autonomous actions, evaluates runtime behavior against signed authority, detects scope violations and behavioral drift, records security receipts, and may review, deny, quarantine, contain, suspend or recommend revocation. Material software, dependency, permission, publisher, ownership or fingerprint changes require revalidation.

## SOVRAIL integration
SOVRAIL AI OS consumes AOC authority as an execution envelope for API/provider access, budgets, rate limits, tools, destinations and external effects. Actions outside credential scope are denied and recorded.

## KAMERON integration
KAMERON AI OS binds recovery capsules to AIN, AOC version, software fingerprint and authority state. Suspended/revoked agents cannot resume. Recovery requires current authorization and may require SWARMER clearance.

## Trust fabric
Identity -> Authority -> Execution -> Observation -> Enforcement -> Recovery.

This specification is implementation guidance and product architecture; cryptographic formats, trust scoring, reputation weighting and enforcement internals remain restricted WCL IP.