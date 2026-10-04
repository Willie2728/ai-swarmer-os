import test from 'node:test';
import assert from 'node:assert/strict';
import {IMMUTABLE_INVARIANTS,assessHealth,verifyControlIntegrity,createRepairProposal,evaluateRepairAdmission,judgeRepair,canaryDecision,degradedSecurityPolicy,ExperienceLedger} from '../src/self-heal.js';

test('self-heal defines ten immutable security invariants',()=>assert.equal(IMMUTABLE_INVARIANTS.length,10));
test('critical control outage enters safe hold',()=>assert.equal(assessHealth({components:{policy_gate:{status:'down'}}}).mode,'SAFE_HOLD'));
test('optional AI outage degrades without disabling deterministic security',()=>assert.deepEqual(degradedSecurityPolicy({llm:'down'}),{mode:'DEGRADED',actions:['continue deterministic enforcement']}));
test('control fingerprint drift is quarantined',()=>assert.equal(verifyControlIntegrity({guest:'abc'},{guest:'xyz'}).decision,'QUARANTINE_CONTROL_CHANGE'));
test('repair producer cannot self approve',()=>{const p=createRepairProposal({incident_id:'i1',producer_id:'builder',summary:'fix'});const r=evaluateRepairAdmission(p,{signature_valid:true,capability_gate_passed:true,red_room_passed:true,regression_passed:true,invariants_passed:true,approver_id:'builder'});assert.equal(r.approved,false);assert.ok(r.reasons.includes('repair producer cannot self-approve'));});
test('fully verified independently approved repair becomes canary eligible',()=>{const p=createRepairProposal({incident_id:'i1',producer_id:'builder',summary:'fix'});assert.equal(evaluateRepairAdmission(p,{signature_valid:true,capability_gate_passed:true,red_room_passed:true,regression_passed:true,invariants_passed:true,approver_id:'security-judge'}).outcome,'CANARY_ELIGIBLE');});
test('all independent judges must pass',()=>{const judges=['security','regression','policy','adversarial','deterministic'].map(type=>({type,outcome:'PASS'}));assert.equal(judgeRepair({judges}).passed,true);});
test('canary rolls back on security regression',()=>assert.equal(canaryDecision({current_percent:5,health_regressed:true,invariants_passed:true}).outcome,'ROLLBACK'));
test('canary promotes through staged rollout',()=>assert.equal(canaryDecision({current_percent:5,error_rate_delta:0,invariants_passed:true}).next_percent,25));
test('experience ledger is hash chained',()=>{const l=new ExperienceLedger();l.append({incident_id:'i1',outcome:'FAIL'});l.append({incident_id:'i1',outcome:'PASS'});assert.equal(l.verify().valid,true);assert.equal(l.similar('i1').length,2);});
