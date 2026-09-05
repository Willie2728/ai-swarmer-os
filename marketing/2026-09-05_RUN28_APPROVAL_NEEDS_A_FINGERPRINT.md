# Run 28 — Approval Needs a Fingerprint

Date: 2026-09-05
Audience: CISO, CTO, AI platform/security engineering, enterprise architecture
Status: Prompt Ready / text only / not published

## Customer truth

A security team cannot reliably revalidate an approved agent capability if it cannot say exactly what version, publisher, dependency state, permissions and behavior were approved.

OWASP released the Agent Control Standard on September 1, 2026, emphasizing inspectable, traceable, instrumentable agents and enforceable runtime controls. Microsoft has separately described MCP as an execution surface that does not itself supply a built-in policy checkpoint before tool calls. Those market signals support the control problem; they do not certify SWARMER or prove deployment outcomes.

## Creative strategy

**Hook:** Approval without a fingerprint is temporary memory.

**Body:**
If you cannot say exactly what was approved, you cannot know whether the thing running today is still the thing you trusted yesterday.

SWARMER's Capability Passport is designed around that problem: bind approval to source, version, permission state, dependency state and approval history; compare claimed and observed behavior; then require revalidation when the trust-relevant state changes.

`admit → inspect → isolate when needed → approve → fingerprint → observe → revalidate on change`

**CTA:** Scope one agent/tool boundary where a changed capability should lose inherited trust.

## Product-truth boundary

No OWASP certification or compatibility claim. No guaranteed prevention claim. The connected Base44 app is a public product/control-plane demonstration; live incident counts require an operational backend. Run 28 relabeled the hero/control metrics as sample/demo data and relabeled pricing as illustrative packaging rather than an active public quote.

## Production / distribution

Text only. No new media rendered. Nothing posted.
