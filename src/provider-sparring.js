import { createHash } from 'node:crypto';

export const PROVIDER_SPARRING_VERSION = '1.0';

const DEFAULT_WEIGHTS = {
  quality: 0.40,
  success: 0.20,
  directCost: 0.15,
  latency: 0.10,
  cacheEfficiency: 0.05,
  toolFit: 0.05,
  reliability: 0.05
};

const taskProfiles = new Map();

export function taskClassFingerprint(task={}) {
  const safe = {
    purpose: task.purpose || '',
    modality: task.modality || 'text',
    tools: [...(task.tools || [])].sort(),
    output: task.outputType || '',
    risk: task.risk || 'normal',
    schema: task.schema || null
  };
  return createHash('sha256').update(JSON.stringify(safe)).digest('hex');
}

export function planProviderSparring({task={}, candidates=[], mode='on-demand', maxRuns=6, incumbent=null, force=false}={}) {
  const fp = taskClassFingerprint(task);
  const previous = taskProfiles.get(fp);
  const stale = !previous || Date.now() - previous.updatedAt > 7*24*60*60*1000;
  const lowConfidence = !previous || previous.confidence < 0.75;
  const shouldRun = force || mode === 'on-demand' || (mode === 'auto' && (stale || lowConfidence));
  if (!shouldRun) return {run:false, reason:'Existing provider profile is fresh and sufficiently confident', fingerprint:fp, recommendation:previous?.recommendation};

  const ordered = [...candidates]
    .filter(c => c && c.provider && c.model)
    .sort((a,b) => {
      if (incumbent && a.provider===incumbent.provider && a.model===incumbent.model) return -1;
      if (incumbent && b.provider===incumbent.provider && b.model===incumbent.model) return 1;
      return Number(a.estimatedCostUsd||0)-Number(b.estimatedCostUsd||0);
    })
    .slice(0, Math.max(1, maxRuns));

  return {
    run:true,
    mode,
    fingerprint:fp,
    candidates:ordered,
    controls:{samePrompt:true,sameTaskInputs:true,isolatedProviderCredentials:true,recordActualLatency:true,recordActualCost:true,recordActualOutput:true}
  };
}

function inv(x, cap=1){
  const n=Math.max(0, Number(x||0));
  return 1/(1+Math.min(n,cap));
}

export function scoreProviderRun(run={}, weights={}) {
  const w={...DEFAULT_WEIGHTS,...weights};
  const quality=Math.max(0,Math.min(1,Number(run.qualityScore||0)));
  const success=run.success===false?0:1;
  const directCost=inv(Number(run.totalOutcomeCostUsd ?? run.directCostUsd ?? 0), 100);
  const latency=inv(Number(run.latencyMs||0)/1000, 120);
  const cacheEfficiency=Math.max(0,Math.min(1,Number(run.cacheEfficiency||0)));
  const toolFit=Math.max(0,Math.min(1,Number(run.toolFit||0.5)));
  const reliability=Math.max(0,Math.min(1,Number(run.reliability||0.5)));
  const score = quality*w.quality + success*w.success + directCost*w.directCost + latency*w.latency + cacheEfficiency*w.cacheEfficiency + toolFit*w.toolFit + reliability*w.reliability;
  return {...run, normalizedScore:Number(score.toFixed(6))};
}

export function summarizeProviderSparring({task={}, runs=[], weights={}, minimumQuality=0.75}={}) {
  if (!runs.length) return {status:'insufficient-data', message:'No measured provider runs were supplied'};
  const scored=runs.map(r=>scoreProviderRun(r,weights));
  const qualified=scored.filter(r=>r.success!==false && Number(r.qualityScore||0)>=minimumQuality);
  const pool=qualified.length?qualified:scored.filter(r=>r.success!==false);
  pool.sort((a,b)=>b.normalizedScore-a.normalizedScore);
  const best=pool[0]||scored[0];
  const fp=taskClassFingerprint(task);
  const confidence=Math.min(0.99, 0.45 + Math.min(runs.length,8)*0.06 + (qualified.length>=2?0.08:0));
  const report={
    fingerprint:fp,
    measured:true,
    taskClass:task.purpose||'unspecified',
    recommendation: best ? {provider:best.provider,model:best.model,gear:best.gear||null,score:best.normalizedScore,reason:'Best measured successful-outcome score among tested candidates'} : null,
    runs:scored.sort((a,b)=>b.normalizedScore-a.normalizedScore),
    confidence:Number(confidence.toFixed(2)),
    generatedAt:new Date().toISOString()
  };
  taskProfiles.set(fp,{recommendation:report.recommendation,confidence:report.confidence,updatedAt:Date.now(),report});
  return report;
}

export function providerProfile(task={}) {
  return taskProfiles.get(taskClassFingerprint(task)) || null;
}

export function shouldAutoRespar({task={}, drift={}}={}) {
  const profile=providerProfile(task);
  if (!profile) return {run:true, reason:'No historical provider profile'};
  if (profile.confidence < 0.75) return {run:true, reason:'Provider recommendation confidence is low'};
  if (drift.modelChanged || drift.providerPricingChanged || drift.failureRateSpike || drift.qualityDrop || drift.latencySpike) {
    return {run:true, reason:'Material provider/model drift detected'};
  }
  const age=Date.now()-profile.updatedAt;
  if (age > 30*24*60*60*1000) return {run:true, reason:'Provider benchmark is older than 30 days'};
  return {run:false, reason:'Current benchmark remains valid'};
}

export function compareGearsAndProviders({task={}, gearReports=[], providerReport=null}={}) {
  return {
    feature:'SOVRAIL GearShift + Provider Sparring',
    taskClass:task.purpose||'unspecified',
    gearComparison:gearReports,
    providerComparison:providerReport,
    explanation:'GearShift compares capability tiers inside or across model families. Provider Sparring compares vendor/model combinations for the same controlled task. Recommendations optimize measured successful-outcome value, not token price alone.'
  };
}
