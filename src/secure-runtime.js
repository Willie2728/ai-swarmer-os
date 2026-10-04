import { DatabaseSync } from 'node:sqlite';
import { createHmac, randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { inspectHandoffContent } from './agent-shield.js';
import { evaluateUnifiedStack } from './unified-stack.js';

const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const denied=reason=>({decision:'BLOCK',executed:false,reason});

/** Trusted server-side composition root. Never construct from visitor-supplied policy,
 * capabilities, keys, adapters, environment facts or approvals. This mediates ONLY
 * registered adapters. OS/network isolation must be provided by deployment. */
export function createUnifiedRuntime({dbPath,key,environmentFingerprint,policyVersion,registrations={},clock=Date.now,ttlMs=300000}={}) {
  if(!dbPath||!Buffer.isBuffer(key)||key.length<32||!environmentFingerprint||!policyVersion||!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>300000) throw Error('Durable database, 256-bit key, environment, policy version and bounded TTL required');
  fs.mkdirSync(path.dirname(dbPath),{recursive:true});
  const db=new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS runtime_quarantine(agent TEXT PRIMARY KEY,reason TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runtime_checkpoints(id TEXT PRIMARY KEY,body TEXT NOT NULL,mac TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS runtime_receipts(id TEXT PRIMARY KEY,body TEXT NOT NULL);`);
  const secret=Buffer.from(key);
  // Copy security configuration so subsequent caller mutation cannot widen authority.
  const registry=new Map(Object.entries(registrations).map(([id,r])=>[id,{
    tenant:r.tenant,capability:structuredClone(r.capability),actions:[...(r.actions||[])],
    resources:[...(r.resources||[])],provider:r.provider||'local',adapter:r.adapter,
    restore:r.restore,trust:r.trust??100
  }]));
  const binding=digest([...registry].map(([id,{adapter,restore,...r}])=>[id,r]));
  function receipt(value){const id=randomUUID();db.prepare('INSERT INTO runtime_receipts VALUES(?,?)').run(id,JSON.stringify(value));return {...value,receipt_id:id};}
  function evaluate(request){
    if(!request||typeof request!=='object'||Object.keys(request).some(k=>!['agent_id','tenant','task_id','action','resource'].includes(k)))return denied('Unknown request fields or caller-supplied authority');
    if(!Object.values(request).every(v=>typeof v==='string'&&v.length>0&&v.length<=256))return denied('Bounded string fields required');
    const r=registry.get(request.agent_id);
    if(!r||typeof r.adapter!=='function'||r.tenant!==request.tenant)return denied('Unregistered agent, adapter or tenant');
    if(db.prepare('SELECT 1 FROM runtime_quarantine WHERE agent=?').get(request.agent_id))return denied('Agent quarantined');
    if(!r.resources.includes(request.resource))return denied('Resource not allowed');
    const result=evaluateUnifiedStack({capability:r.capability,observedActions:[request.action],execution:{provider:r.provider,action:request.action,risk:'high',allowedActions:r.actions,policy:{allowedProviders:['local']}},recovery:{task_id:request.task_id,agent_id:request.agent_id,environment_fingerprint:environmentFingerprint,security_policy_version:policyVersion,swarmer_trust_score:r.trust}});
    if(result.decision!=='ALLOW')return denied('Mandatory stack denied request');
    return {decision:'ALLOW',registration:r};
  }
  function issue(request,state){
    const checkpoint={id:randomUUID(),request:structuredClone(request),state:structuredClone(state),environment:environmentFingerprint,policy:policyVersion,binding,expires:clock()+ttlMs};
    const body=JSON.stringify(checkpoint),mac=createHmac('sha256',secret).update(body).digest('hex');
    db.prepare('INSERT INTO runtime_checkpoints(id,body,mac) VALUES(?,?,?)').run(checkpoint.id,body,mac);
    return {id:checkpoint.id,expires:checkpoint.expires};
  }
  return Object.freeze({
    async execute(request){
      const input=structuredClone(request),e=evaluate(input);
      if(e.decision!=='ALLOW')return receipt(e);
      // Only canonical bounded requests reach a registered adapter. No eval, shell,
      // raw prompt, caller destination, capability or policy is forwarded.
      try {const result=await e.registration.adapter(Object.freeze(input));
        if(inspectHandoffContent(result).length)return receipt({...denied('Outbound restricted-content gate blocked result'),executed:true,delivered:false});
        const checkpoint=issue(input,result);
        return receipt({decision:'ALLOW',executed:true,result,checkpoint});
      }catch {return receipt({decision:'ERROR',executed:null,attempted:true,reason:'Adapter failed after admission; side effects require inspection'});}
    },
    async recover(id){
      const row=db.prepare('SELECT * FROM runtime_checkpoints WHERE id=?').get(id);
      if(!row||row.used)return receipt(denied('Unknown or consumed checkpoint'));
      const expected=Buffer.from(createHmac('sha256',secret).update(row.body).digest('hex'));
      const actual=Buffer.from(row.mac);
      if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return receipt(denied('Checkpoint authentication failed'));
      const c=JSON.parse(row.body);
      if(!Number.isFinite(c.expires)||c.expires<=clock()||c.environment!==environmentFingerprint||c.policy!==policyVersion||c.binding!==binding)return receipt(denied('Checkpoint expired or context changed'));
      const e=evaluate(c.request);
      if(e.decision!=='ALLOW'||typeof e.registration.restore!=='function')return receipt(denied('Recovery mediation or restore adapter unavailable'));
      // Atomic single-use claim before any restoration effect, including concurrent calls.
      const claimed=db.prepare('UPDATE runtime_checkpoints SET used=1 WHERE id=? AND used=0').run(id);
      if(claimed.changes!==1)return receipt(denied('Checkpoint replay'));
      try {const result=await e.registration.restore(Object.freeze(structuredClone(c.request)),structuredClone(c.state));if(inspectHandoffContent(result).length)return receipt({...denied('Outbound restricted-content gate blocked result'),executed:true,delivered:false});return receipt({decision:'ALLOW',executed:true,result});}
      catch{return receipt({decision:'ERROR',executed:null,attempted:true,reason:'Restore failed; checkpoint remains consumed; side effects require inspection'});}
    },
    observe(agent,actions){
      const r=registry.get(agent);
      if(!r||!Array.isArray(actions)||actions.some(a=>!r.capability.claimed_actions?.includes(a))){db.prepare('INSERT OR REPLACE INTO runtime_quarantine VALUES(?,?)').run(agent,'Behavior mismatch');return denied('Persistent quarantine');}
      return {decision:'ALLOW'};
    },
    close(){secret.fill(0);db.close();}
  });
}
