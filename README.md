# AI SWARMER OS

**Zero trust for autonomous action.** AI SWARMER OS is a defensive security control plane for governing AI agents and the capabilities they use: skills, MCP servers, plugins, repositories, packages, workflows, model tools, API connectors and updates.

## Core architecture

`Guest List → Capability Gate → Risk/Policy Engine → Red Room → Behavior Verification → Capability Passport → Reputation Ledger → Runtime Enforcement`

The Capability Gate separates **identity trust** from **payload trust**. Approved sources are still inspected. Capabilities are fingerprinted and material changes trigger revalidation. Claimed-vs-observed behavioral mismatch results in quarantine.

## Run locally

Requires Node.js 22.5 or newer (Node 24 recommended).

```powershell
Copy-Item .env.example .env
$env:SWARMER_ADMIN_TOKEN='use-a-long-random-admin-token'
$env:SWARMER_INGEST_SECRET='use-a-different-ingest-secret'
npm test
npm start
```

## Security properties in this build

- Agent tool and network-destination allowlists
- Signed runtime telemetry and deterministic policy enforcement
- Prompt-injection, sensitive-data, credential, shell, delegation and high-volume egress detections
- Capability Gate static/semantic heuristics, permission analysis, SHA-256 capability fingerprinting and admission decisions
- Claimed-vs-observed behavior comparison with quarantine decisions
- Red Room-required state for capabilities needing behavioral verification
- Continuous-trust revalidation triggers for code, version, dependency, permission, publisher and fingerprint changes
- Reversible agent kill switch
- Evidence-backed incidents and risk state
- Append-only SHA-256 chained audit history
- Passive network evidence, behavioral fingerprints, campaign correlation and sourced threat-intelligence matching
- Persistent SQLite storage using WAL and foreign keys

## Why SWARMER exists

Conventional endpoint, network, cloud and SIEM security remain essential. Agentic AI adds another control problem: autonomous software can reason, invoke tools, access sensitive systems and take consequential actions. SWARMER is designed as the admission, governance and runtime safety layer between autonomous intelligence and enterprise authority.

See `docs/CAPABILITY_GATE_AND_MARKET_POSITION.md` for the researched architecture/competitive positioning and `docs/AI_SWARMER_TRIFOLD_COPY.md` for the trifold marketing copy.

## Current maturity

This repository is an operational MVP, **not a claim of complete network protection or independently validated superiority over established cybersecurity platforms**. Production deployment still requires collectors/enforcement adapters at agent gateways, identity, endpoint, cloud and network egress layers; enterprise authentication; TLS; secrets management; backups; tenant isolation; full sandbox infrastructure; dependency/SBOM scanners; and independent penetration/red-team testing.

Attribution is deliberately evidence-based. SWARMER correlates infrastructure and technical characteristics but never equates an IP address with a human identity and does not hack back.
