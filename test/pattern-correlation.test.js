import test from 'node:test';
import assert from 'node:assert/strict';
import { correlateSharedIndicators } from '../src/pattern-correlation.js';

test('shared indicators correlate repeat events',()=>{
  const findings=correlateSharedIndicators([
    {id:'e1',attributes:{marker:'same-campaign'}},
    {id:'e2',attributes:{marker:'same-campaign'}},
    {id:'e3',attributes:{marker:'other'}}
  ]);
  assert.equal(findings.length,1);
  assert.equal(findings[0].rule,'shared-indicator-pattern');
  assert.equal(findings[0].event_count,2);
});
