# AI SWARMER OS

A runnable defensive control-plane MVP for registering AI agents, ingesting signed runtime telemetry, enforcing deterministic policy, opening evidence-backed incidents, and containing agents.

## Run locally

Requires Node.js 22.5 or newer (Node 24 recommended).

On this Windows workspace, double-click `START-AI-SWARMER-OS.cmd`. It starts the local server and opens the dashboard. Keep the project folder in place; the service stores its local database under `data/`.

```powershell
Copy-Item .env.example .env
$env:SWARMER_ADMIN_TOKEN='use-a-long-random-admin-token'
$env:SWARMER_INGEST_SECRET='use-a-different-ingest-secret'
npm test
npm start
```

Open `http://localhost:8080`, then set the same admin token in the browser console once:

```js
localStorage.setItem('swarmer_token', 'use-a-long-random-admin-token'); location.reload()
```

## Signed telemetry example

Collectors POST JSON to `/api/v1/events` with `X-Swarmer-Signature`, the lowercase hex HMAC-SHA256 of the exact request body using `SWARMER_INGEST_SECRET`. A blocked response is HTTP 403; allowed/review events return HTTP 202.

```json
{"agent_id":"registry UUID","action":"tool.call","resource":"shell","attributes":{"command":"curl example"}}
```

## Real security properties in this build

- Enforceable agent tool and network-destination allowlists
- Signed telemetry with constant-time signature comparison
- Deterministic prompt-injection, sensitive-data, credential, shell, delegation, and high-volume egress detections
- Progressive decisions: allow, review, block
- Reversible agent kill switch
- Evidence-backed incidents and risk state
- Append-only SHA-256 chained audit history with verification
- Passive network evidence, route provenance, behavioral fingerprints, campaign correlation, and sourced threat-intelligence matching
- Persistent WISDOM guide with text workflow assistance and optional private Tavus CVI voice/video sessions
- Interactive investor intelligence room at `/investor`, with skeptical diligence Q&A and orchestrated CTO, CFO, security, GTM, and governance Knowledge Guides
- Persistent SQLite storage using WAL and foreign keys
- Safe response headers, bounded request bodies, and escaped UI output

This is an operational MVP, not a claim of complete network protection. Production deployment still requires collectors/enforcement adapters at the agent gateway, identity provider, endpoint, cloud, and network egress layers; stronger enterprise authentication; TLS; secrets management; backups; tenant isolation; and external security testing.

Attribution is deliberately evidence-based: the system correlates infrastructure and technical characteristics but never equates an IP address with a human identity. It does not hack back or access suspected third-party infrastructure.

## Configure WISDOM live video

Create a Tavus persona and replica, then set `TAVUS_API_KEY`, `TAVUS_PERSONA_ID`, and optionally `TAVUS_REPLICA_ID` before starting the server. The API key remains server-side. Optional `TAVUS_DOCUMENT_IDS` accepts comma-separated Tavus knowledge-base document IDs. Without these settings, WISDOM remains available as a persistent text guide; the photorealistic voice/video session clearly reports that Tavus configuration is required.

Specialist guide personas can be configured with `TAVUS_SENTINEL_PERSONA_ID`, `TAVUS_ARCHITECT_PERSONA_ID`, `TAVUS_STEWARD_PERSONA_ID`, `TAVUS_VANGUARD_PERSONA_ID`, and `TAVUS_COUNSEL_PERSONA_ID` plus matching replica variables. If omitted, each guide falls back to the generic Tavus persona/replica.

## Company and investor system

- `docs/FOUNDER_BRAIN.md` is the durable company vocabulary and decision source. WISDOM is the chief-of-staff Wisdom Guide; specialist agents are Knowledge Guides.
- `docs/AI_SWARMER_OS_COMPANY_BUILD_AND_GTM_PLAN.md` is the portable maintained strategy source.
- `deliverables/AI_SWARMER_OS_Company_Build_and_GTM_Plan.docx` is the formatted business-plan document.
- `deliverables/AI_SWARMER_OS_Investor_Briefing.pptx` is the portable investor presentation with source notes.
- `deliverables/AI_SWARMER_OS_Logo.svg` and `deliverables/AI_SWARMER_OS_Mark.svg` are editable vector brand assets.
- The reusable personal presentation template is installed as `$artifact-template-ai-swarmer-living-investor-pitch`.
