import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSovrailRoutePlan,normalizeSovrailPolicy,sovrailAuthorizationDecision,fingerprintRequest,SOVRAIL_INTEGRATION_VERSION} from '../src/sovrail.js';

test('SOVRAIL defaults to local-first routing',()=>{
  const plan=buildSovrailRoutePlan({provider:'auto',operation:'chat'});
  assert.equal(plan.route[0],'local');
  assert.ok(plan.route.includes('openai'));
});

test('SOVRAIL blocks execution without SWARMER approval',()=>{
  const decision=sovrailAuthorizationDecision({swarmerApproved:false,provider:'openai',estimatedCostUsd:0.01});
  assert.equal(decision.approved,false);
  assert.match(decision.reasons.join(' '),/SWARMER approval/);
});

test('SOVRAIL blocks disallowed providers',()=>{
  const policy=normalizeSovrailPolicy({allowedProviders:['local']});
  const decision=sovrailAuthorizationDecision({swarmerApproved:true,provider:'openai',estimatedCostUsd:0,policy});
  assert.equal(decision.approved,false);
});

test('request fingerprint is stable for matching request shapes',()=>{
  const a=fingerprintRequest({provider:'auto',operation:'chat',payload:{b:1,a:2}});
  const b=fingerprintRequest({provider:'auto',operation:'chat',payload:{a:9,b:7}});
  assert.equal(a,b);
});

test('integration version is exposed',()=>assert.equal(SOVRAIL_INTEGRATION_VERSION,'2.0-swarmer'));
