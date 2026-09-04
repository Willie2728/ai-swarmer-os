# WCL Default Scaffold: SOVRAIL AI

Use this scaffold in applicable Wilkerson Collective software when a product, agent, workflow, or service needs AI/API access.

## Required architecture

1. Product receives a WCL-issued `sov_` credential.
2. Product calls the SOVRAIL base URL, not provider URLs directly.
3. SWARMER evaluates trust/permission before external execution.
4. SOVRAIL prefers approved local/self-hosted execution where capable.
5. Paid providers are fallback/explicit routes subject to budgets and allow-lists.
6. Provider secrets stay server-side.
7. KAMERON checkpoints are used for long-running/recoverable tasks.

## Environment contract

```env
SOVRAIL_BASE_URL=
SOVRAIL_API_KEY=
SOVRAIL_MODE=local-first
SOVRAIL_MAX_DAILY_SPEND_USD=25
SOVRAIL_ALLOWED_PROVIDERS=local,openai,anthropic,tavus
SWARMER_REQUIRED=true
KAMERON_RECOVERY=true
```

## Plain rule for future builds

Do not wire a new WCL product directly to a commercial AI/API provider by default. First ask whether the call can go through SOVRAIL. If yes, use SOVRAIL. Document any exception.
