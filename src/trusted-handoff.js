import { createHash, randomUUID } from 'node:crypto';

import { inspectHandoffContent } from './agent-shield.js';

const ALLOWED_ACTIONS=new Set(['research','search','compare','quote','draft','analyze','procure.search','procure.quote']);
const FORBIDDEN_KEYS=/credential|password|secret|token|cookie|session|shell|ssh|network_topology|internal_reasoning/i;
const MAX_TEXT=32_000;

const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean=(value,depth=0)=>{
  if(depth>8) return '[TRUNCATED]';
  if(typeof value==='string') return value.slice(0,MAX_TEXT);
  if(Array.isArray(value)) return value.slice(0,100).map(v=>clean(v,depth+1));
  if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([k])=>!FORBIDDEN_KEYS.test(k)).map(([k,v])=>[k,clean(v,depth+1)]));
  return value;
};

export function admitVisitingAgentRequest(input={}){
  const reasons=[];
  if(!input.agent_id) reasons.push('agent_id required');
  if(!input.action) reasons.push('action required');
  if(!ALLOWED_ACTIONS.has(String(input.action||'').toLowerCase())) reasons.push('requested action is not handoff-allowlisted');
  if(input.requested_network_access===true) reasons.push('visiting agents cannot receive protected-network access');
  if(input.requested_shell===true) reasons.push('visiting agents cannot receive shell access');
  if(input.requested_credentials===true) reasons.push('visiting agents cannot receive credentials');
  if(inspectHandoffContent(input.payload??{}).length)reasons.push('untrusted instruction or restricted content detected');
  const sanitized=clean(input.payload??{});
  const request_id=input.request_id||`SWR-A2A-${randomUUID()}`;
  return {
    request_id,
    protocol:'A2A',
    boundary:'SWARMER_TRUSTED_HANDOFF_GATEWAY',
    outcome:reasons.length?'reject':'handoff',
    execution_presence:'none',
    protected_network_access:false,
    trusted_agent_required:true,
    action:String(input.action||'').toLowerCase(),
    sanitized_payload:sanitized,
    payload_sha256:hash(sanitized),
    reasons
  };
}

export function releaseTrustedAgentResult(request,result={}){
  if(!request||request.outcome!=='handoff')throw Object.assign(Error('Approved handoff required'),{status:403});
  const sanitized=clean(result);
  if(inspectHandoffContent(sanitized).length)throw Object.assign(Error('Outbound restricted-content gate blocked result'),{status:403});
  return {
    request_id:request.request_id,
    protocol:'A2A',
    outcome:'return',
    execution_presence:'none',
    protected_network_access:false,
    result:sanitized,
    result_sha256:hash(sanitized),
    removed_classes:['credentials','tokens','cookies','sessions','shell','network_topology','internal_reasoning'],
    completed_at:new Date().toISOString()
  };
}

export const trustedHandoffPolicy=Object.freeze({
  mode:'HANDOFF_ONLY',
  visiting_agent_execution:false,
  visiting_agent_network_access:false,
  trusted_agent_executes:true,
  inbound_sanitization:true,
  outbound_dlp:true
});
