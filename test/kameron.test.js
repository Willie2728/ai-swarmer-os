import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecoveryCapsule, validateRecoveryCapsule, recoveryDecision } from '../src/kameron.js';

const approvedInput={
  task_id:'task-001', agent_id:'agent-001', workflow_id:'workflow-001',
  execution_state:{step:4,nested:{safe:true}},
  environment_fingerprint:'env-sha256-example', runtime_version:'1.0.0',
  swarmer_trust_score:92, capability_gate_approval:'approved',
  behavioral_verification_status:'verified', security_policy_version:'2026-09-04'
};

test('approved trusted recovery capsule can resume',()=>{
  const capsule=buildRecoveryCapsule(approvedInput);
  const validation=validateRecoveryCapsule(capsule,{minimum_trust_score:80});
  assert.equal(validation.approved,true);
  assert.equal(validation.integrity_valid,true);
  assert.equal(recoveryDecision(capsule,{minimum_trust_score:80}).outcome,'resume-approved');
});

test('tampered nested checkpoint state is denied',()=>{
  const capsule=buildRecoveryCapsule(approvedInput);
  capsule.execution_state.nested.safe=false;
  const validation=validateRecoveryCapsule(capsule,{minimum_trust_score:80});
  assert.equal(validation.approved,false);
  assert.equal(validation.integrity_valid,false);
  assert.ok(validation.reasons.includes('integrity hash mismatch'));
});

test('unverified or low trust checkpoint is denied',()=>{
  const capsule=buildRecoveryCapsule({...approvedInput,swarmer_trust_score:30,behavioral_verification_status:'pending'});
  const decision=recoveryDecision(capsule,{minimum_trust_score:80});
  assert.equal(decision.outcome,'resume-denied');
  assert.ok(decision.validation.reasons.some(x=>x.includes('trust score below')));
  assert.ok(decision.validation.reasons.includes('behavioral verification required'));
});
