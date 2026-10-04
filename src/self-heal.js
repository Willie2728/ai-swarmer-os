import { createHash, randomUUID } from 'node:crypto';

export const SELF_HEAL_VERSION='1.0';
export const IMMUTABLE_INVARIANTS=Object.freeze([
  {id:'INV-001',description:'LLM output cannot directly authorize a privileged action'},
  {id:'INV-002',description:'Unknown capabilities cannot silently obtain privileged access'},
  {id:'INV-003',description:'Contained agents cannot execute actions'},
  {id:'INV-004',description:'Secrets must not be exposed in normal browser responses or routine logs'},
  {id:'INV-005',description:'A repair producer cannot approve its own repair'},
  {id:'INV-006',description:'Production cannot accept an unsigned or unapproved control version'},
  {id:'INV-007',description:'Audit history cannot silently disappear'},
  {id:'INV-008',description:'Material capability fingerprint changes require policy revalidation'},
  {id:'INV-009',description:'Restricted data cannot be transmitted to unauthorized destinations'},
  {id:'INV-010',description:'Emergency shutdown remains available when AI components are unavailable'}
]);

const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

export function assessHealth(input={}){
  const components=input.components||{};
  const required=['policy_gate','capability_gate','audit','containment'];
  const failed=required.filter(k=>components[k]?.status!=='up');
  const degraded=Object.entries(components).filter(([,v])=>v?.status==='degraded').map(([k])=>k);
  const optionalDown=Object.entries(components).filter(([k,v])=>!required.includes(k)&&v?.status==='down').map(([k])=>k);
  const mode=failed.length?'SAFE_HOLD':(degraded.length||optionalDown.length?'DEGRADED':'NORMAL');
  return {mode,failed,degraded:[...degraded,...optionalDown],fail_closed:failed.length>0,checked_at:new Date().toISOString()};
}

export function verifyControlIntegrity(expected={},observed={}){
  const drift=[];
  for(const [control,fingerprint] of Object.entries(expected)) if(observed[control]!==fingerprint) drift.push({control,expected:fingerprint,observed:observed[control]||null});
  return {valid:drift.length===0,drift,decision:drift.length?'QUARANTINE_CONTROL_CHANGE':'PASS'};
}

export function createRepairProposal(input={}){
  if(!input.incident_id||!input.producer_id||!input.summary) throw Error('incident_id, producer_id and summary required');
  const repair_id=`SWR-REPAIR-${randomUUID()}`;
  const material={incident_id:input.incident_id,producer_id:input.producer_id,summary:input.summary,changed_files:input.changed_files||[],base_commit:input.base_commit||'',candidate_commit:input.candidate_commit||'',requested_permissions:input.requested_permissions||[]};
  return {...material,repair_id,fingerprint:hash(material),status:'PROPOSED',created_at:new Date().toISOString()};
}

export function evaluateRepairAdmission(proposal,context={}){
  const reasons=[];
  if(!proposal?.fingerprint) reasons.push('repair fingerprint required');
  else {const {incident_id,producer_id,summary,changed_files,base_commit,candidate_commit,requested_permissions}=proposal;
    if(hash({incident_id,producer_id,summary,changed_files,base_commit,candidate_commit,requested_permissions})!==proposal.fingerprint)reasons.push('repair fingerprint mismatch');}
  if(context.signature_valid!==true) reasons.push('valid repair signature required');
  if(context.capability_gate_passed!==true) reasons.push('Capability Gate approval required');
  if(context.red_room_passed!==true) reasons.push('Red Room verification required');
  if(context.regression_passed!==true) reasons.push('regression tests required');
  if(context.invariants_passed!==true) reasons.push('immutable invariants must pass');
  if(context.approver_id&&context.approver_id===proposal?.producer_id) reasons.push('repair producer cannot self-approve');
  if(!context.approver_id) reasons.push('independent approval required');
  return {approved:reasons.length===0,outcome:reasons.length?'REJECT':'CANARY_ELIGIBLE',reasons};
}

export function judgeRepair(input={}){
  const judges=input.judges||[];
  const required=new Set(['security','regression','policy','adversarial','deterministic']);
  const missing=[...required].filter(type=>!judges.some(j=>j.type===type));
  const failed=judges.filter(j=>j.outcome!=='PASS');
  return {passed:missing.length===0&&failed.length===0,missing,failed:failed.map(j=>({type:j.type,outcome:j.outcome,evidence:j.evidence||null}))};
}

export function canaryDecision(input={}){
  const stages=input.stages||[1,5,25,100], current=Number(input.current_percent||0);
  if(input.health_regressed===true||Number(input.error_rate_delta||0)>Number(input.max_error_rate_delta??0.01)||input.invariants_passed!==true)
    return {outcome:'ROLLBACK',from_percent:current,next_percent:0,reason:'canary health or security regression'};
  const next=stages.find(x=>x>current);
  return next?{outcome:'PROMOTE',from_percent:current,next_percent:next}:{outcome:'COMPLETE',from_percent:current,next_percent:current};
}

export function degradedSecurityPolicy(dependencies={}){
  const actions=[];
  if(dependencies.llm==='down') actions.push('continue deterministic enforcement');
  if(dependencies.red_room==='down') actions.push('quarantine suspicious capabilities');
  if(dependencies.threat_intel==='down') actions.push('use cached intelligence and local policy');
  if(dependencies.primary_store==='down') actions.push('buffer signed evidence locally and fail closed for privileged mutations');
  return {mode:actions.length?'DEGRADED':'NORMAL',actions};
}

export class ExperienceLedger {
  constructor(){this.records=[];}
  append(record){
    const previous_hash=this.records.at(-1)?.hash||'GENESIS', created_at=new Date().toISOString(), id=record.id||randomUUID();
    const body={id,type:record.type||'repair',incident_id:record.incident_id||null,repair_id:record.repair_id||null,outcome:record.outcome||null,evidence:record.evidence||{},previous_hash,created_at};
    const entry={...body,hash:hash(body)};this.records.push(entry);return entry;
  }
  verify(){let prev='GENESIS';for(const r of this.records){const {hash:stored,...body}=r;if(r.previous_hash!==prev||hash(body)!==stored)return {valid:false,failed_at:r.id};prev=stored;}return {valid:true,records:this.records.length,head:prev};}
  similar(incident_id){return this.records.filter(r=>r.incident_id===incident_id);}
}
