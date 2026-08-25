import test from 'node:test'; import assert from 'node:assert/strict'; import {detectThreats,enforcementDecision} from '../src/detection.js';
const agent={status:'active',allowed_tools:['search'],allowed_destinations:['safe.example']};
test('blocks unapproved tool calls',()=>{const f=detectThreats({action:'tool.call',resource:'shell',attributes:{}},agent);assert.equal(enforcementDecision(agent,f).outcome,'block');assert.equal(f[0].rule,'tool-deny')});
test('blocks large egress',()=>{const f=detectThreats({action:'network.egress',resource:'safe.example',attributes:{bytes:6000000}},agent);assert.equal(enforcementDecision(agent,f).outcome,'block')});
test('allows expected behavior',()=>{const f=detectThreats({action:'tool.call',resource:'search',attributes:{query:'weather'}},agent);assert.deepEqual(f,[]);assert.equal(enforcementDecision(agent,f).outcome,'allow')});
test('contained agents always block',()=>assert.equal(enforcementDecision({...agent,status:'contained'},[]).outcome,'block'));
