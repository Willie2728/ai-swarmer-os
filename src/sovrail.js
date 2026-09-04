import { createHash } from 'node:crypto';

export const SOVRAIL_INTEGRATION_VERSION='2.0-swarmer';

const DEFAULT_POLICY={
  mode:'local-first',
  allowedProviders:['local','openai','anthropic','tavus'],
  maxDailySpendUsd:25,
  maxRequestsPerMinute:120,
  requireSwarmerApproval:true,
  cacheEnabled:true,
  failoverEnabled:true
};

const providerState=new Map();
const usage={requests:0,estimated_spend_usd:0,cache_hits:0,blocked:0,failovers:0};

export function normalizeSovrailPolicy(input={}){
  const p={...DEFAULT_POLICY,...input};
  p.allowedProviders=[...new Set((p.allowedProviders||[]).map(x=>String(x).toLowerCase()))];
  p.maxDailySpendUsd=Math.max(0,Number(p.maxDailySpendUsd||0));
  p.maxRequestsPerMinute=Math.max(1,Number(p.maxRequestsPerMinute||1));
  return p;
}

export function buildSovrailRoutePlan(request={},policyInput={}){
  const policy=normalizeSovrailPolicy(policyInput);
  const requested=String(request.provider||'auto').toLowerCase();
  let route;
  if(requested!=='auto') route=[requested];
  else if(policy.mode==='local-first') route=['local','openai','anthropic','tavus'];
  else route=['openai','anthropic','local','tavus'];
  route=route.filter(x=>policy.allowedProviders.includes(x));
  return {route,policy,request_fingerprint:fingerprintRequest(request)};
}

export function fingerprintRequest(request={}){
  const safe={purpose:request.purpose||'',model:request.model||'',provider:request.provider||'auto',operation:request.operation||'',payload_shape:Object.keys(request.payload||{}).sort()};
  return createHash('sha256').update(JSON.stringify(safe)).digest('hex');
}

export function sovrailAuthorizationDecision({swarmerApproved,provider,estimatedCostUsd=0,policy:input={}}={}){
  const policy=normalizeSovrailPolicy(input);
  const reasons=[];
  if(policy.requireSwarmerApproval&&!swarmerApproved) reasons.push('SWARMER approval is required before external execution');
  if(!policy.allowedProviders.includes(String(provider||'').toLowerCase())) reasons.push('Provider is not allowed by SOVRAIL policy');
  if(usage.estimated_spend_usd+Number(estimatedCostUsd||0)>policy.maxDailySpendUsd) reasons.push('Daily SOVRAIL spend ceiling would be exceeded');
  const approved=reasons.length===0;
  if(!approved) usage.blocked++;
  return {approved,reasons,provider,estimatedCostUsd:Number(estimatedCostUsd||0)};
}

export function recordSovrailUsage({provider,costUsd=0,cacheHit=false,failed=false}={}){
  usage.requests++;
  usage.estimated_spend_usd+=Math.max(0,Number(costUsd||0));
  if(cacheHit)usage.cache_hits++;
  const key=String(provider||'unknown');
  const state=providerState.get(key)||{requests:0,failures:0,last_failure_at:null};
  state.requests++;
  if(failed){state.failures++;state.last_failure_at=new Date().toISOString();}
  providerState.set(key,state);
  return sovrailStatus();
}

export function recordSovrailFailover(){usage.failovers++;return usage.failovers;}

export function sovrailStatus(){
  return {
    integration_version:SOVRAIL_INTEGRATION_VERSION,
    role:'Sovereign API Runtime & Integration Layer',
    operating_model:'SWARMER approves trust; SOVRAIL routes/controls execution cost; KAMERON preserves recoverable state',
    usage:{...usage,estimated_spend_usd:Number(usage.estimated_spend_usd.toFixed(6))},
    providers:Object.fromEntries(providerState)
  };
}
