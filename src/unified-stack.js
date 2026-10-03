import { capabilityAdmission } from './capability-gate.js';
import { buildRecoveryCapsule, recoveryDecision } from './kameron.js';
import { sovrailAuthorizationDecision, actionAuthorizationDecision } from './sovrail.js';

export const UNIFIED_STACK_VERSION = '1.0.0';

/**
 * Single enforcement entry point for the WCL agent-control stack.
 * SWARMER admits/quarantines capabilities; SOVRAIL authorizes execution;
 * KAMERON permits recovery only when the same trust state remains valid.
 */
export function evaluateUnifiedStack({capability={}, observedActions=[], execution={}, recovery={}}={}) {
  const admission = capabilityAdmission(capability, observedActions);
  const swarmerApproved = admission.outcome === 'ALLOW';

  const sovrail = sovrailAuthorizationDecision({
    swarmerApproved,
    provider: execution.provider,
    estimatedCostUsd: execution.estimatedCostUsd,
    policy: execution.policy
  });
  const action = actionAuthorizationDecision({
    action: execution.action,
    risk: execution.risk,
    allowedActions: execution.allowedActions || [],
    deniedActions: execution.deniedActions || []
  });

  const executionApproved = swarmerApproved && sovrail.approved && action.approved;
  const capsule = buildRecoveryCapsule({
    ...recovery,
    swarmer_trust_score: recovery.swarmer_trust_score ?? (swarmerApproved ? 100 : 0),
    capability_gate_approval: executionApproved ? 'approved' : 'denied',
    behavioral_verification_status: executionApproved ? 'verified' : 'failed'
  });
  const recoveryResult = recoveryDecision(capsule, recovery.policy || {});

  return {
    stack_version: UNIFIED_STACK_VERSION,
    decision: executionApproved ? 'ALLOW' : 'BLOCK',
    admission,
    execution: {sovrail, action, approved: executionApproved},
    recovery: recoveryResult,
    invariant: 'No execution or recovery may bypass SWARMER trust, SOVRAIL authorization, or KAMERON integrity validation.'
  };
}
