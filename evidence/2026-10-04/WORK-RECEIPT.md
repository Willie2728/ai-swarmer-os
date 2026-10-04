# SWARMER security retest — 2026-10-04

Result: all 109 executable tests pass on three consecutive runs after repairs.
This is evidence of implemented local controls, not certification of universal network protection.

## Source and reproduction

- Repository: Willie2728/ai-swarmer-os.
- Base: codex/unified-stack-adversarial-test, 8cba87f57b04207d7786fbe1b8538ab01a528df5.
- Repair branch: codex/security-retest-2026-10-04.
- The reported separate local commit 90b2ace47e29ba4a458d32f03b99a7cf58e8e4c3 was not present on available remote branches; it was not verified or reused.
- Node v24.19.0 on Linux. No customer data, production attacks, Windows D-drive execution, Orgo compute, production deployment or merge.
- Run `node --test --test-reporter=tap` from repository root. Tests create and remove their own temporary SQLite databases/files and local HTTP servers.
- Hostile corpus seed: 0x57434c; 2,000 requests per full run, 6,000 total across three recorded runs. This is a bounded corpus of eight request-mutation classes, not 6,000 independent attack techniques.

## Progression

| Batch | PASS | FAIL | Evidence |
|---|---:|---:|---|
| Unmodified remote baseline | 41 | 3 | baseline.tap, exit 1 |
| First newly written regression batch before repairs | 1 | 13 | regression-before-raw.txt, exit 1 |
| Final full run 1 | 109 | 0 | retest-1.tap, exit 0 |
| Final full run 2 | 109 | 0 | retest-2.tap, exit 0 |
| Final full run 3 | 109 | 0 | retest-3.tap, exit 0 |

JavaScript syntax and Git whitespace checks pass. SHA256SUMS records source and test hashes; TAP records contain all assertions and failures. Baseline-raw.txt preserves the initial default reporter output as well.

## Repairs implemented

- Prohibited capability findings now deny admission independent of numerical risk thresholds. Permission, publisher and claim changes affect canonical capability fingerprints.
- Empty tool, destination and action allowlists deny access. Consequential actions cannot bypass approval by labeling risk low; they remain disabled in this bounded runtime.
- SWARMER approval must be boolean true; a caller cannot disable this requirement. Nonfinite, negative and nonnumeric authorization costs are rejected.
- Unified decision eligibility requires all three layers, including KAMERON trust and integrity validation. The diagnostic function is explicitly non-authoritative.
- Caller-built recovery capsules cannot self-authorize restoration. Structural validity is distinguished from authenticated executable authority. Existing unit tests were updated for this deliberately stricter contract; attack assertions remain strict.
- Added createUnifiedRuntime: server-owned immutable registrations, exact bounded request schema, tenant/resource/action checks, registered adapter mediation, durable receipts and quarantine, HMAC-authenticated checkpoints, context binding, expiration and atomic single-use consumption before restoration effects.
- Runtime HTTP endpoints use this mandatory chain for one bounded local system-status adapter. Arbitrary customer adapters, raw prompts, shell operations and external destinations are not enabled.
- Checkpoint, quarantine and receipt state persists in SQLite. Existing diagnostic server checkpoints also survive restart, but cannot grant restoration authority.
- Signed telemetry now requires a signed event id and fresh timestamp; duplicate ids are rejected across restart. UTF-8 request limits count bytes, and bearer comparison handles byte lengths safely.
- Handoff content inspection is integrated. Outbound secret/instruction markers in ordinary string values block delivery. Handoff delivery is single-use during a server lifetime.
- Integrated PR5 self-heal and pattern-correlation modules and their existing tests. Missing critical health evidence causes safe hold; altered repair content invalidates its fingerprint; required independent approval cannot be disabled; absent canary invariant evidence causes rollback.
- Direct Tavus calls are disabled until a dedicated authenticated provider adapter is integrated and tested. Configuration status no longer implies operational provider execution.
- Adapter failures after admission explicitly report attempted execution with unknown side effects. A blocked result delivery does not falsely imply that its previously authorized operation never ran.

## What was exercised against actual local resources

- Approved shopper reads a real temporary synthetic file.
- Denied actions, resources, tenants, identities, raw payloads and authority overrides cause zero file-read adapter calls.
- A local HTTP server independently counts actual provider requests: rejected requests produce zero calls; approved request produces exactly one.
- Server process restart: durable telemetry replay rejection, checkpoint survival, authenticated runtime recovery and single-use rejection.
- Checkpoint MAC tampering, key change, environment change, policy change, expiration and concurrent replay: zero restore adapter calls.
- Persisted behavior quarantine blocks both execution and recovery after restart.
- Outbound restricted content is withheld without issuing a checkpoint.
- Live HTTP tests verify authentication failure, body bounds, ingress injection rejection, result gate rejection, one-time delivery and disabled provider bypass.

## Coverage boundaries and unresolved requirements

| Requirement | Current evidence / state |
|---|---|
| Deterministic three-layer admission/authorization/recovery | PASS for registered local adapters and tested corpus |
| Durable local checkpoint authentication, replay rejection and recovery callback | PASS in synthetic SQLite/file/HTTP lab; not production agent-state restoration |
| Prompt-injection and secret-access patterns | PASS for coded examples; regex detection is not a complete semantic security boundary |
| Tenant checks | PASS for explicit registration tenant binding; not production multi-tenant isolation |
| Shopper handling of a canonical request | PASS in the bounded adapter slice; no visitor code or raw prompt is forwarded |
| Separate A true network / B external or decoy network | NOT IMPLEMENTED as physical/VM/network topology in this checkout; metadata is not isolation |
| Complete encrypted mailbox/conveyor workflow and guest agreement | NOT IMPLEMENTED end to end here |
| Freezing a visitor's remote agent or preventing its remote replication | Outside local control; terms cannot suspend third-party compute |
| OS/container Red Room, CPU/memory/network/credential isolation | BLOCKED in this runner: no Docker/Podman; unshare denied. Requires isolated VM host |
| Connected adaptive LLM agents, encoded/multistep attacks, real tool interception | NOT IMPLEMENTED as a complete live-agent harness; requires controlled model/tool setup |
| External customer/provider/MCP integrations | Disabled or unverified until registered, isolated and tested; no general network interception |
| Self-heal and indicator correlation | Locally tested libraries; not an authenticated autonomous production deployment pipeline |
| Production alert assignment/acknowledgement/resolution | NOT IMPLEMENTED end to end |
| Production identity, TLS, key rotation, RBAC, tenant provisioning | UNVERIFIED; existing admin API is not an enterprise identity system |
| Availability under floods, distributed racing and resource exhaustion | NOT established by sequential 2,000-case corpus |
| Kernel/hypervisor vulnerabilities, malicious internal admins, supply-chain compromise | Not proven eliminated |
| Every sector / size / attack / all network traffic | No supportable universal guarantee |

No silently skipped/todo tests exist in these recorded runs. This does not mean missing requirements passed: absent integration/platform coverage is explicitly listed above. The suite is green for its declared executable scope; the complete customer-network thesis remains unproven.

## Next environment and acceptance gate

Use a WCL-owned disposable VM lab on the D-drive host or an explicitly authorized virtualization host. Separate attacker/B, broker/DMZ and protected/A VMs with firewall rules that deny B-to-A routing. Place only synthetic services, credential canaries and customer-shaped fixtures in A. Give shoppers narrowly scoped service identities, never raw visitor instructions or unrestricted shells. Capture independent packet traces, file hashes, database writes and process events outside the attacked component. Add a connected adversarial-agent harness with bounded cost/time and repeatable seeds. Test the complete ingress-to-egress lifecycle, crash/restart, forged approvals, cross-tenant access, denial of service, compromised shoppers and every registered connector. Every rejection must have an independent zero-unauthorized-effect assertion. Then commission independent review before claiming customer production protection.

Evidence supports: SWARMER enforces tested local identity, capability, policy, containment and authenticated recovery boundaries for registered adapters. It does not support: SWARMER guarantees 100% protection against every AI agent or hacker on any network.
