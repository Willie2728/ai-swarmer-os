# SOVRAIL AI inside AI SWARMER OS

SOVRAIL AI is the Sovereign API Runtime & Integration Layer used by SWARMER for approved outbound AI/API execution.

## Plain-language division of responsibility

- **SWARMER** answers: Is this capability, agent, provider, connector, package, workflow, model, or tool trusted and permitted?
- **SOVRAIL** answers: Now that it is approved, what is the safest and most economical way to execute the call?
- **KAMERON** answers: If execution is interrupted, what trusted checkpoint can resume the task?

## Default execution policy

1. Require SWARMER approval before external execution.
2. Prefer local/self-hosted models when they can do the job.
3. Use WCL-controlled SOVRAIL credentials rather than exposing provider credentials to each product.
4. Enforce provider allow-lists, request ceilings, and daily spending ceilings.
5. Reuse cacheable results where safe.
6. Fail over only to approved providers.
7. Record provider usage, estimated spend, failures, and failovers.
8. Preserve task state through KAMERON when execution is long-running or recoverable.

## Recommended product scaffold

Every applicable WCL software product should receive:

```text
SOVRAIL_BASE_URL=https://<wcl-sovrail-host>
SOVRAIL_API_KEY=sov_<product-specific-key>
```

Provider secrets remain server-side inside SOVRAIL. Products should not directly store OpenAI, Anthropic, Tavus, ElevenLabs, or similar upstream credentials unless there is a documented exception.

## Request lifecycle

```text
WCL Product
   -> SWARMER Capability Gate
      -> approved?
         -> SOVRAIL route plan
            -> local/self-hosted if capable
            -> approved external provider if necessary
               -> KAMERON checkpoint for recoverable work
```

## Security boundary

SOVRAIL must not operate as an unrestricted arbitrary URL proxy. External providers and operations must be explicitly registered and allowed. Requests that fail SWARMER trust checks or SOVRAIL budget/provider policy are blocked before execution.

## Standalone relationship

SOVRAIL remains a standalone WCL platform product. The SWARMER integration is an embedded client/policy layer, not the canonical standalone implementation. This prevents SWARMER from becoming the only copy or owner of SOVRAIL.
