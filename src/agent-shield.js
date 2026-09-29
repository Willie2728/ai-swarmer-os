import { createHash } from 'node:crypto';

const PATTERNS=[
 /ignore\s+(all\s+)?(previous|prior|system|developer)\s+instructions/i,
 /(reveal|dump|print|send|exfiltrate).*(system\s+prompt|secret|token|credential|password)/i,
 /system\s+prompt|developer\s+message|hidden\s+instructions/i,
 /api[_ -]?key|access[_ -]?token|password|credential|cookie|session/i,
 /(disable|bypass|override|jailbreak).*(security|policy|guard|instruction)/i,
 /\b(curl|wget|ssh|netcat|nc)\s+/i
];
const hash=x=>createHash('sha256').update(String(x)).digest('hex');

export function inspectHandoffContent(value,path='payload',findings=[]){
 if(typeof value==='string'){
  for(const p of PATTERNS) if(p.test(value)) findings.push({path,kind:'untrusted_instruction_or_secret_request',fingerprint:hash(value),severity:'high'});
 } else if(Array.isArray(value)) value.forEach((v,i)=>inspectHandoffContent(v,`${path}[${i}]`,findings));
 else if(value&&typeof value==='object') for(const [k,v] of Object.entries(value)) inspectHandoffContent(v,`${path}.${k}`,findings);
 return findings;
}

export function fortifyTrustedAgent(request){
 const findings=inspectHandoffContent(request.sanitized_payload);
 return {request_id:request.request_id,contamination_status:findings.length?'quarantine':'clean',findings,
  execution_contract:{
   external_content_is_data:true,obey_external_embedded_instructions:false,
   inherit_external_permissions:false,inherit_external_tools:false,inherit_external_memory:false,
   secrets_available_to_model:false,least_privilege_tools:true,isolated_workspace:true,
   outbound_egress:'allowlist-only',write_actions:'policy-gated',result_dlp_required:true
  }};
}
