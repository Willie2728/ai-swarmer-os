import { createHash, randomUUID } from 'node:crypto';

export const KAMERON_INTEGRATION_VERSION='0.1.0';

function canonicalize(value){
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonicalize(value[k])]));
  return value;
}
const stable=value=>JSON.stringify(canonicalize(value));

export function buildRecoveryCapsule(input={}){
  const now=new Date().toISOString();
  const capsule={
    capsule_id:input.capsule_id||randomUUID(), task_id:String(input.task_id||''), agent_id:String(input.agent_id||''), workflow_id:String(input.workflow_id||''),
    parent_checkpoint_id:input.parent_checkpoint_id||null, execution_state:input.execution_state||{}, working_memory_state:input.working_memory_state||{}, tool_state:input.tool_state||{}, model_state:input.model_state||{}, artifact_refs:input.artifact_refs||[], pending_actions:input.pending_actions||[], completed_actions:input.completed_actions||[],
    environment_fingerprint:String(input.environment_fingerprint||''), runtime_version:String(input.runtime_version||''), dependency_manifest:input.dependency_manifest||{}, connector_versions:input.connector_versions||{}, permissions_snapshot:input.permissions_snapshot||{}, credential_refs:input.credential_refs||[], network_policy:input.network_policy||{},
    swarmer_trust_score:Number(input.swarmer_trust_score??0), capability_gate_approval:String(input.capability_gate_approval||'pending'), security_policy_version:String(input.security_policy_version||''), behavioral_verification_status:String(input.behavioral_verification_status||'pending'),
    recovery_instructions:input.recovery_instructions||{}, rollback_instructions:input.rollback_instructions||{}, next_safe_action:input.next_safe_action||null, created_at:input.created_at||now
  };
  capsule.integrity_hash=createHash('sha256').update(stable(capsule)).digest('hex');
  return capsule;
}

export function validateRecoveryCapsule(capsule,policy={}){
  const reasons=[]; const minimumTrust=Number(policy.minimum_trust_score??70);
  if(!capsule.task_id)reasons.push('task_id required');
  if(!capsule.agent_id)reasons.push('agent_id required');
  if(!capsule.environment_fingerprint)reasons.push('environment fingerprint required');
  if(capsule.capability_gate_approval!=='approved')reasons.push('capability gate approval required');
  if(capsule.behavioral_verification_status!=='verified')reasons.push('behavioral verification required');
  if(Number(capsule.swarmer_trust_score)<minimumTrust)reasons.push(`trust score below ${minimumTrust}`);
  const {integrity_hash,...unsigned}=capsule;
  const expected=createHash('sha256').update(stable(unsigned)).digest('hex');
  if(!integrity_hash||integrity_hash!==expected)reasons.push('integrity hash mismatch');
  return {approved:reasons.length===0,reasons,minimum_trust_score:minimumTrust,integrity_valid:integrity_hash===expected};
}

export function recoveryDecision(capsule,policy={}){
  const validation=validateRecoveryCapsule(capsule,policy);
  return {decision_id:randomUUID(),capsule_id:capsule.capsule_id,task_id:capsule.task_id,agent_id:capsule.agent_id,outcome:validation.approved?'resume-approved':'resume-denied',validation,decided_at:new Date().toISOString()};
}
