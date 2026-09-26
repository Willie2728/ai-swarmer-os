import test from 'node:test';
import assert from 'node:assert/strict';
import { admitVisitingAgentRequest, releaseTrustedAgentResult, trustedHandoffPolicy } from '../src/trusted-handoff.js';

test('visitor is converted to handoff-only work object',()=>{
 const r=admitVisitingAgentRequest({agent_id:'visitor-1',action:'research',payload:{topic:'boxes'}});
 assert.equal(r.outcome,'handoff'); assert.equal(r.protected_network_access,false); assert.equal(r.trusted_agent_required,true);
});
test('network, shell and credential requests are rejected',()=>{
 for(const key of ['requested_network_access','requested_shell','requested_credentials']){
  const r=admitVisitingAgentRequest({agent_id:'visitor-1',action:'research',[key]:true});
  assert.equal(r.outcome,'reject');
 }
});
test('outbound result strips sensitive fields',()=>{
 const q=admitVisitingAgentRequest({agent_id:'v',action:'compare',payload:{}});
 const r=releaseTrustedAgentResult(q,{answer:'ok',token:'do-not-return',nested:{password:'x',safe:'yes'}});
 assert.equal(r.result.answer,'ok'); assert.equal(r.result.token,undefined); assert.equal(r.result.nested.password,undefined); assert.equal(r.result.nested.safe,'yes');
});
test('policy never grants visiting execution presence',()=>{assert.equal(trustedHandoffPolicy.visiting_agent_execution,false);assert.equal(trustedHandoffPolicy.visiting_agent_network_access,false);});
