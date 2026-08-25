import test from 'node:test';
import assert from 'node:assert/strict';
import { collectNetworkEvidence, attributionAssessment, validIp } from '../src/attribution.js';

const request = (headers={}) => ({headers,socket:{remoteAddress:'::ffff:10.0.0.8'}});

test('validates and normalizes IP addresses',()=>{
  assert.equal(validIp('::ffff:192.0.2.5'),'192.0.2.5');
  assert.equal(validIp('not-an-ip'),null);
});

test('ignores spoofable forwarding headers by default',()=>{
  const n=collectNetworkEvidence(request({'x-forwarded-for':'203.0.113.9'}),{},false);
  assert.equal(n.source_ip,'10.0.0.8');
  assert.deepEqual(n.proxy_chain,[]);
  assert.equal(n.provenance.source_ip,'direct_transport');
});

test('uses forwarding path only when proxy trust is explicit',()=>{
  const n=collectNetworkEvidence(request({'x-forwarded-for':'203.0.113.9, 10.1.1.2'}),{},true);
  assert.equal(n.source_ip,'203.0.113.9');
  assert.deepEqual(n.proxy_chain,['203.0.113.9','10.1.1.2']);
});

test('stable characteristics produce a stable campaign',()=>{
  const n=collectNetworkEvidence(request({'user-agent':'collector/1'}),{},false);
  const a=attributionAssessment({attributes:{ja4:'t13d1516h2_abc'}},n);
  const b=attributionAssessment({attributes:{ja4:'t13d1516h2_abc'}},n);
  assert.equal(a.campaign_id,b.campaign_id);
  assert.match(a.caveat,/do not establish a human identity/);
});
