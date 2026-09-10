# RUN137 — AI SWARMER OS
## SWR-TXT-010 / SWR-DOC-001 — Deliberate Evaluation Timing

### Customer Truth
A buyer can define a credible workflow, abuse case, authority boundary, human-approval boundary, trust-expiry trigger, enforcement path, failure mode, and evidence receipt while still never choosing when the evaluation should happen. A preselected timing value creates false qualification signal.

### Creative Strategy
**Hook:** Choose the evaluation timing before the control test counts as qualified.

**Message:** Security evaluation intent should preserve deliberate timing rather than silently treating every visitor as "Exploring." The buyer selects Exploring, 0–30 days, 31–90 days, or 90+ days after defining the bounded control test.

**CTA:** Define one bounded control test and deliberately choose the evaluation window before sharing contact information.

### Production Readiness
The connected Base44 app was updated so `decisionWindow` starts blank, `pilotScopeReady` requires an explicit timing choice, submit validation requires the same choice, and both `EnterprisePilotRequest` and `EnterpriseScopeSignal` require `decision_window` in their durable schemas. `SWR-DOC-001-deliberate-evaluation-timing-card.html` was added as a buyer-planning aid. The Base44 build passed during RUN137.

### Distribution Queue
External publication remains held until an authorized channel returns a verifiable publication receipt. No post, ad, email, or campaign is claimed live.

### Analytics / Evaluation
RUN137 baseline: 0 `EnterpriseScopeSignal` records and 0 `EnterprisePilotRequest` records at inspection time. The change prevents future default timing from being mistaken for deliberate buyer intent; it does not establish demand or conversion lift.

### Winner Library
No winner. There is no attributable production sample supporting promotion.

### Claims Boundary
A selected evaluation window does not establish budget, authority, procurement readiness, pilot acceptance, deployment, security effectiveness, certification, or protection outcomes.
