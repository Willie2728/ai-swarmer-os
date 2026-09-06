# AI SWARMER OS — Run 37 — Approval Is a Lease, Not a Lifetime Pass

## Customer truth

Enterprise teams do not only need to decide whether an agent capability is acceptable once. They need a defensible answer to a harder question: **what changes should invalidate yesterday's approval?**

Current SWARMER product-grounded sequence:

`Verify → Inspect → Isolate → Approve → Fingerprint → Monitor → Revalidate`

The Capability Passport records the approved source/version/permissions/dependency state/approval history, and Continuous Revalidation is designed to treat material changes as a reason to reconsider trust.

## Campaign

**Hook:** If the capability changes, the old approval should expire.

An agent can still have the same name while its source, publisher, dependency tree, permissions, behavior, or fingerprint has changed. Treating the old approval as permanent turns a one-time review into stale authority.

AI SWARMER OS is built around a different operating idea: approve a known capability state, preserve its fingerprint and evidence, observe what it actually does, and require revalidation when material trust inputs change.

**CTA:** Take one agent capability you already approve and define which changes must force revalidation: code, publisher, dependency, permission, behavior, or fingerprint.

## Market context

OWASP's Agent Control Standard, released September 1, 2026, emphasizes inspectable, traceable, instrumentable, controllable runtime behavior and portable runtime controls for agents. That supports the category need for ongoing governance, but it is not a SWARMER certification or independent validation.

## Product boundary

The connected Base44 app is explicitly an illustrative control-plane demonstration with demo/sample data. The GitHub repository describes an operational MVP, not complete network protection or independently validated superiority. Production still requires deployment-specific enforcement adapters, enterprise identity, TLS, secrets management, tenant controls, sandbox/scanner infrastructure, backups, and independent testing.

Exact campaign state: **production-ready text only; no new media rendered; nothing published**.

Build verification: `cd /app && npm run build` completed with exit code 0 in the connected Base44 sandbox during Run 37. This does not independently verify production deployment.
