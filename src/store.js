import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY,name TEXT NOT NULL,owner TEXT NOT NULL,purpose TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',allowed_tools TEXT NOT NULL DEFAULT '[]',allowed_destinations TEXT NOT NULL DEFAULT '[]',risk INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,agent_id TEXT NOT NULL,action TEXT NOT NULL,resource TEXT NOT NULL,attributes TEXT NOT NULL,decision TEXT NOT NULL,risk INTEGER NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(agent_id) REFERENCES agents(id));
      CREATE TABLE IF NOT EXISTS incidents(id TEXT PRIMARY KEY,agent_id TEXT NOT NULL,severity TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',evidence TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(agent_id) REFERENCES agents(id));
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,details TEXT NOT NULL,previous_hash TEXT NOT NULL,hash TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS attribution(event_id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL,fingerprint TEXT NOT NULL,source_ip TEXT,assessment TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(event_id) REFERENCES events(id));
      CREATE INDEX IF NOT EXISTS attribution_campaign_idx ON attribution(campaign_id);
      CREATE INDEX IF NOT EXISTS attribution_source_idx ON attribution(source_ip);
      CREATE TABLE IF NOT EXISTS threat_intel(id TEXT PRIMARY KEY,indicator_type TEXT NOT NULL,indicator_value TEXT NOT NULL,classification TEXT NOT NULL,confidence INTEGER NOT NULL,source TEXT NOT NULL,actor_label TEXT,verified INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,UNIQUE(indicator_type,indicator_value,source));
      CREATE INDEX IF NOT EXISTS threat_intel_indicator_idx ON threat_intel(indicator_type,indicator_value);
    `);
  }
  audit(actor, action, target, details={}) {
    const id=randomUUID(), created_at=new Date().toISOString();
    const last=this.db.prepare('SELECT hash FROM audit ORDER BY rowid DESC LIMIT 1').get();
    const previous_hash=last?.hash || 'GENESIS';
    const body=JSON.stringify({id,actor,action,target,details,previous_hash,created_at});
    const hash=createHash('sha256').update(body).digest('hex');
    this.db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?,?)').run(id,actor,action,target,JSON.stringify(details),previous_hash,hash,created_at);
    return {id,hash};
  }
  createAgent(a, actor='admin') { const x={id:randomUUID(),name:a.name,owner:a.owner,purpose:a.purpose,status:'active',allowed_tools:a.allowed_tools||[],allowed_destinations:a.allowed_destinations||[],risk:0,created_at:new Date().toISOString()}; this.db.prepare('INSERT INTO agents VALUES(?,?,?,?,?,?,?,?,?)').run(x.id,x.name,x.owner,x.purpose,x.status,JSON.stringify(x.allowed_tools),JSON.stringify(x.allowed_destinations),x.risk,x.created_at); this.audit(actor,'agent.create',x.id,{name:x.name}); return x; }
  agents(){ return this.db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all().map(this.agent); }
  getAgent(id){ const x=this.db.prepare('SELECT * FROM agents WHERE id=?').get(id); return x&&this.agent(x); }
  agent(x){ return {...x,allowed_tools:JSON.parse(x.allowed_tools),allowed_destinations:JSON.parse(x.allowed_destinations)}; }
  recordEvent(e, decision, findings, attribution=null){ const id=e.id||randomUUID(), now=new Date().toISOString(), risk=Math.max(0,...findings.map(f=>f.score)); this.db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?,?)').run(id,e.agent_id,e.action,e.resource||'',JSON.stringify(e.attributes||{}),decision.outcome,risk,now); if(attribution)this.db.prepare('INSERT INTO attribution VALUES(?,?,?,?,?,?)').run(id,attribution.campaign_id,attribution.fingerprint,attribution.network.source_ip,JSON.stringify(attribution),now); this.db.prepare('UPDATE agents SET risk=MAX(risk,?) WHERE id=?').run(risk,e.agent_id); for(const f of findings){ this.db.prepare('INSERT INTO incidents VALUES(?,?,?,?,?,?,?)').run(randomUUID(),e.agent_id,f.severity,f.title,'open',JSON.stringify({event_id:id,rule:f.rule,evidence:f.evidence,campaign_id:attribution?.campaign_id}),now); } this.audit('collector','event.evaluate',id,{decision:decision.outcome,findings:findings.map(f=>f.rule),campaign_id:attribution?.campaign_id}); return {id,decision,findings,risk,attribution,created_at:now}; }
  events(limit=100){ return this.db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?').all(limit).map(x=>({...x,attributes:JSON.parse(x.attributes)})); }
  incidents(){ return this.db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all().map(x=>({...x,evidence:JSON.parse(x.evidence)})); }
  campaigns(){ return this.db.prepare(`SELECT a.campaign_id,a.fingerprint,a.source_ip,COUNT(*) event_count,MIN(a.created_at) first_seen,MAX(a.created_at) last_seen,MAX(e.risk) max_risk FROM attribution a JOIN events e ON e.id=a.event_id GROUP BY a.campaign_id,a.fingerprint,a.source_ip ORDER BY last_seen DESC`).all(); }
  campaign(id){ const records=this.db.prepare(`SELECT a.*,e.agent_id,e.action,e.resource,e.decision,e.risk FROM attribution a JOIN events e ON e.id=a.event_id WHERE a.campaign_id=? ORDER BY a.created_at`).all(id).map(x=>({...x,assessment:JSON.parse(x.assessment)})); if(!records.length)return null; return {campaign_id:id,classification:'technical-association',confidence:Math.min(85,35+records.length*10),events:records,disclaimer:'This evidence associates technical observables. It does not identify, accuse, or verify a natural person.'}; }
  addIntel(x,actor='admin'){ const row={id:randomUUID(),indicator_type:x.indicator_type,indicator_value:String(x.indicator_value).toLowerCase(),classification:x.classification,confidence:Math.max(0,Math.min(100,Number(x.confidence))),source:x.source,actor_label:x.actor_label||null,verified:x.verified?1:0,notes:x.notes||'',created_at:new Date().toISOString()}; this.db.prepare('INSERT INTO threat_intel VALUES(?,?,?,?,?,?,?,?,?,?)').run(...Object.values(row)); this.audit(actor,'threat_intel.add',row.id,{indicator_type:row.indicator_type,source:row.source}); return row; }
  intel(){ return this.db.prepare('SELECT * FROM threat_intel ORDER BY created_at DESC').all(); }
  matchIntel(attribution){ const values=[['ip',attribution.network.source_ip],['fingerprint',attribution.fingerprint],['process_hash',attribution.characteristics.process_hash],['tool_signature',attribution.characteristics.tool_signature]].filter(x=>x[1]); const matches=[]; for(const [type,value] of values)matches.push(...this.db.prepare('SELECT * FROM threat_intel WHERE indicator_type=? AND indicator_value=?').all(type,String(value).toLowerCase())); return matches; }
  contain(id,actor,reason){ const a=this.getAgent(id); if(!a) return null; this.db.prepare("UPDATE agents SET status='contained',risk=100 WHERE id=?").run(id); this.audit(actor,'agent.contain',id,{reason,previous_status:a.status}); return this.getAgent(id); }
  release(id,actor,reason){ const a=this.getAgent(id); if(!a) return null; this.db.prepare("UPDATE agents SET status='active',risk=0 WHERE id=?").run(id); this.audit(actor,'agent.release',id,{reason,previous_status:a.status}); return this.getAgent(id); }
  audits(){ return this.db.prepare('SELECT * FROM audit ORDER BY rowid DESC LIMIT 200').all().map(x=>({...x,details:JSON.parse(x.details)})); }
  verifyAudit(){ const rows=this.db.prepare('SELECT * FROM audit ORDER BY rowid').all(); let prev='GENESIS'; for(const r of rows){ const body=JSON.stringify({id:r.id,actor:r.actor,action:r.action,target:r.target,details:JSON.parse(r.details),previous_hash:r.previous_hash,created_at:r.created_at}); const hash=createHash('sha256').update(body).digest('hex'); if(r.previous_hash!==prev||r.hash!==hash)return {valid:false,failed_at:r.id}; prev=r.hash; } return {valid:true,records:rows.length,head:prev}; }
  overview(){ return {agents:this.db.prepare('SELECT COUNT(*) n FROM agents').get().n,contained:this.db.prepare("SELECT COUNT(*) n FROM agents WHERE status='contained'").get().n,open_incidents:this.db.prepare("SELECT COUNT(*) n FROM incidents WHERE status='open'").get().n,blocked_events:this.db.prepare("SELECT COUNT(*) n FROM events WHERE decision='block'").get().n}; }
}
