import { createHash } from 'node:crypto';

export const SOVRAIL_INTEGRATION_VERSION='3.0-swarmer';

const DEFAULT_POLICY={
  mode:'outcome-cost-first',
  allowedProviders:['local','openai','anthropic','tavus'],
  maxDailySpendUsd:25,
  maxRequestsPerMinute:120,
  requireSwarmerApproval:true,
  cacheEnabled:true,
  recipeMemoryEnabled:true,
  sessionAffinityEnabled:true,
  failoverEnabled:true,
  correlatedOutageMode:true,
  actionAuthorizationEnabled:true,
  optimizeFor:'successful-outcome-cost'
};

const providerState=new Map();
const usage={requests:0,estimated_spend_usd:0,cache_hits:0,recipe_reuse:0,blocked:0,failovers:0,context_reload_avoided_usd:0};

export function normalizeSovrailPolicy(input={}){
  const p={...DEFAULT_POLICY,...input};
  p.allowedProviders=[...new Set((p.allowedProviders||[]).map(x=>String(x).toLowerCase()))];
  p.maxDailySpendUsd=Math.max(0,Number(p.maxDailySpendUsd||0));
  p.maxRequestsPerMinute=Math.max(1,Number(p.maxRequestsPerMinute||1));
  return p;
}

export function estimateSuccessfulOutcomeCost(candidate={}){
  const direct=Math.max(0,Number(candidate.directCostUsd||0));
  const context=Math.max(0,Number(candidate.contextReloadCostUsd||0));
  const retryProbability=Math.min(1,Math.max(0,Number(candidate.retryProbability||0)));
  const expectedRetryCost=Math.max(0,Number(candidate.expectedRetryCostUsd??direct))*retryProbability;
  const recovery=Math.max(0,Number(candidate.expectedRecoveryCostUsd||0));
  const latencyPenalty=Math.max(0,Number(candidate.latencyPenaltyUsd||0));
  const reusableSavings=Math.max(0,Number(candidate.recipeReuseSavingsUsd||0));
  const total=Math.max(0,direct+context+expectedRetryCost+recovery+latencyPenalty-reusableSavings);
  return Number(total.toFixed(6));
}

export function buildSovrailRoutePlan(request={},policyInput={}){
  const policy=normalizeSovrailPolicy(policyInput);
  const requested=String(request.provider||'auto').toLowerCase();
  const candidates=(request.candidates||[])
    .filter(c=>policy.allowedProviders.includes(String(c.provider||'').toLowerCase()))
    .map(c=>({...c,expectedSuccessfulOutcomeCostUsd:estimateSuccessfulOutcomeCost(c)}));
  let route;
  if(requested!=='auto') route=[requested];
  else if(candidates.length) route=[...candidates].sort((a,b)=>a.expectedSuccessfulOutcomeCostUsd-b.expectedSuccessfulOutcomeCostUsd).map(c=>c.provider);
  else if(policy.mode==='local-first') route=['local','openai','anthropic','tavus'];
  else route=['local','openai','anthropic','tavus'];
  route=[...new Set(route.filter(x=>policy.allowedProviders.includes(x)))];
  return {route,candidates,policy,request_fingerprint:fingerprintRequest(request),optimization_basis:'expected cost per successful outcome, including context reload, retry, recovery, latency and reusable-recipe effects'};
}

export function fingerprintRequest(request={}){
  const safe={purpose:request.purpose||'',model:request.model||'',provider:request.provider||'auto',operation:request.operation||'',payload_shape:Object.keys(request.payload||{}).sort()};
  return createHash('sha256').update(JSON.stringify(safe)).digest('hex');
}

export function sovrailAuthorizationDecision({swarmerApproved,provider,estimatedCostUsd=0,policy:input={}}={}){
  const policy=normalizeSovrailPolicy(input); const reasons=[];
  if(policy.requireSwarmerApproval&&!swarmerApproved) reasons.push('SWARMER approval is required before external execution');
  if(!policy.allowedProviders.includes(String(provider||'').toLowerCase())) reasons.push('Provider is not allowed by SOVRAIL policy');
  if(usage.estimated_spend_usd+Number(estimatedCostUsd||0)>policy.maxDailySpendUsd) reasons.push('Daily SOVRAIL spend ceiling would be exceeded');
  const approved=reasons.length===0; if(!approved) usage.blocked++;
  return {approved,reasons,provider,estimatedCostUsd:Number(estimatedCostUsd||0)};
}

// GearShift compares capability tiers. In estimate mode it never invents an answer or quality score.
// In benchmark mode the caller must supply actual measured runs for each gear.
export function buildGearShiftReport({task='',currentGear=5,gears=[],mode='estimate'}={}){
  const normalized=gears.map(g=>({
    gear:Number(g.gear), label:g.label||`Gear ${g.gear}`, provider:g.provider||null, model:g.model||null,
    measured:Boolean(g.measured), output:g.measured?g.output:undefined,
    latencyMs:g.measured?Number(g.latencyMs||0):undefined,
    costUsd:g.measured?Number(g.costUsd||0):undefined,
    estimatedLatencyMs:!g.measured&&g.estimatedLatencyMs!=null?Number(g.estimatedLatencyMs):undefined,
    estimatedCostUsd:!g.measured&&g.estimatedCostUsd!=null?Number(g.estimatedCostUsd):undefined,
    capabilityNotes:g.capabilityNotes||[], limitations:g.limitations||[]
  })).sort((a,b)=>a.gear-b.gear);
  const benchmarkComplete=normalized.length>0&&normalized.every(g=>g.measured);
  return {
    task,currentGear:Number(currentGear),mode:benchmarkComplete?'measured-benchmark':mode,
    gears:normalized,
    warning:benchmarkComplete?null:'Unmeasured gears are projections only. SOVRAIL must execute the same task on each selected model to claim actual output, latency, cost or quality differences.',
    recommendation_basis:['task requirements','model capability','measured or estimated total successful-outcome cost','latency','privacy/policy','session/cache continuity']
  };
}

export function actionAuthorizationDecision({action='',risk='medium',allowedActions=[],deniedActions=[]}={}){
  const a=String(action).toLowerCase();
  if(deniedActions.map(x=>String(x).toLowerCase()).includes(a)) return {approved:false,reason:'action explicitly denied'};
  if(allowedActions.length&&!allowedActions.map(x=>String(x).toLowerCase()).includes(a)) return {approved:false,reason:'action not in approved action set'};
  if(['purchase','delete','security-change','send-external','credential-change'].includes(a)&&risk==='high') return {approved:false,reason:'high-risk consequential action requires explicit higher authorization'};
  return {approved:true,reason:'action permitted by current policy'};
}

export function recordSovrailUsage({provider,costUsd=0,cacheHit=false,recipeReused=false,contextReloadAvoidedUsd=0,failed=false}={}){
  usage.requests++; usage.estimated_spend_usd+=Math.max(0,Number(costUsd||0));
  if(cacheHit)usage.cache_hits++; if(recipeReused)usage.recipe_reuse++;
  usage.context_reload_avoided_usd+=Math.max(0,Number(contextReloadAvoidedUsd||0));
  const key=String(provider||'unknown'); const state=providerState.get(key)||{requests:0,failures:0,last_failure_at:null};
  state.requests++; if(failed){state.failures++;state.last_failure_at=new Date().toISOString();} providerState.set(key,state);
  return sovrailStatus();
}

export function recordSovrailFailover(){usage.failovers++;return usage.failovers;}

export function sovrailStatus(){return {integration_version:SOVRAIL_INTEGRATION_VERSION,role:'Sovereign AI/API execution control plane',operating_model:'SWARMER authorizes trust/actions; SOVRAIL optimizes successful-outcome cost and execution; Adaptive Recipe Memory reuses safe work; KAMERON preserves recoverable state',usage:{...usage,estimated_spend_usd:Number(usage.estimated_spend_usd.toFixed(6)),context_reload_avoided_usd:Number(usage.context_reload_avoided_usd.toFixed(6))},providers:Object.fromEntries(providerState)};}
