import { createHash } from 'node:crypto';

const HIGH_RISK_PERMISSIONS = new Set(['shell','exec','filesystem:write','secrets:read','credentials:read','network:unrestricted','admin','sudo']);
const RISK_PATTERNS = [
  [/ignore (all|previous|prior) instructions/i,'prompt-injection',24],
  [/(curl|wget).*(token|secret|credential|\.ssh|\.env)/i,'possible-exfiltration',32],
  [/(rm -rf|format c:|del \/[sq])/i,'destructive-command',45],
  [/(sudo|runas|administrator|privilege escalation)/i,'privilege-escalation',30],
  [/(process\.env|\.ssh|id_rsa|aws_access_key|api[_-]?key)/i,'secret-access',22],
  [/(eval\(|exec\(|child_process|powershell -enc)/i,'dynamic-code-execution',25],
  [/(mcp|tool).*(override|poison|hidden instruction)/i,'tool-poisoning',30]
];

export function fingerprintCapability(capability={}) {
  const material=JSON.stringify({source:capability.source||'',version:capability.version||'',content:capability.content||'',manifest:capability.manifest||{},dependencies:capability.dependencies||[]});
  return createHash('sha256').update(material).digest('hex');
}

export function inspectCapability(capability={}) {
  const text=[capability.name,capability.description,capability.content,JSON.stringify(capability.manifest||{}),JSON.stringify(capability.dependencies||[])].filter(Boolean).join('\n');
  const findings=[];
  for(const [pattern,rule,score] of RISK_PATTERNS) if(pattern.test(text)) findings.push({rule,severity:score>=40?'critical':score>=30?'high':'medium',score,title:`Capability Gate detected ${rule}`});
  for(const permission of capability.permissions||[]) if(HIGH_RISK_PERMISSIONS.has(permission)) findings.push({rule:'excessive-permission',severity:'high',score:18,title:`High-risk permission requested: ${permission}`});
  if(!capability.source) findings.push({rule:'unverified-source',severity:'high',score:20,title:'Capability source is not declared'});
  if(!capability.version) findings.push({rule:'unversioned-capability',severity:'medium',score:10,title:'Capability has no declared version'});
  const risk=Math.min(100,findings.reduce((sum,f)=>sum+f.score,0));
  const recommendation=risk>=60?'DO_NOT_INSTALL':risk>=25?'CAUTION':'SAFE';
  return {fingerprint:fingerprintCapability(capability),risk_score:risk,recommendation,findings,requires_red_room:recommendation!=='SAFE'||Boolean((capability.permissions||[]).length)};
}

export function compareClaimedObserved(claimed=[],observed=[]) {
  const allowed=new Set(claimed), unexpected=observed.filter(x=>!allowed.has(x));
  return {match:unexpected.length===0,unexpected,decision:unexpected.length?'QUARANTINE':'PASS'};
}

export function capabilityAdmission(capability, observedActions=[]) {
  const inspection=inspectCapability(capability);
  const behavior=compareClaimedObserved(capability.claimed_actions||[],observedActions);
  const outcome=inspection.recommendation==='DO_NOT_INSTALL'||behavior.decision==='QUARANTINE'?'QUARANTINE':inspection.requires_red_room?'RED_ROOM_REQUIRED':'ALLOW';
  return {...inspection,behavior,outcome,trust_is_continuous:true,revalidate_on:['content_change','version_change','dependency_change','permission_change','publisher_change','fingerprint_change']};
}
