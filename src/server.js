import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { detectThreats, enforcementDecision } from './detection.js';
import { collectNetworkEvidence, attributionAssessment } from './attribution.js';
import { createGuideSession, createWisdomSession, interpretWisdomTask, wisdomStatus } from './wisdom.js';
import { answerGuideQuestion } from './guides.js';
import { buildRecoveryCapsule, recoveryDecision, KAMERON_INTEGRATION_VERSION } from './kameron.js';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port=Number(process.env.PORT||8080), host=process.env.HOST||'127.0.0.1', admin=process.env.SWARMER_ADMIN_TOKEN||'dev-admin-change-me', secret=process.env.SWARMER_INGEST_SECRET||'dev-ingest-change-me';
const trustProxy=process.env.TRUST_PROXY==='true';
if(process.env.NODE_ENV==='production'&&(admin.startsWith('dev-')||secret.startsWith('dev-'))) throw Error('Production requires explicit SWARMER_ADMIN_TOKEN and SWARMER_INGEST_SECRET');
const store=new Store(path.resolve(process.env.SWARMER_DB_PATH||path.join(root,'data','swarmer.db')));
const kameronCheckpoints=new Map();
const kameronDecisions=[];
const securityHeaders={'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','permissions-policy':'camera=(self), microphone=(self)','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://*.daily.co"};
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json',...securityHeaders});res.end(JSON.stringify(data));};
const body=async req=>{let s='';for await(const c of req){s+=c;if(s.length>1_000_000)throw Error('Body too large');}return s;};
const auth=req=>{const supplied=(req.headers.authorization||'').replace('Bearer ','');return supplied.length===admin.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(admin));};
const serve=(res,file,type)=>{try{const data=fs.readFileSync(path.join(root,'public',file));res.writeHead(200,{'content-type':type,...securityHeaders});res.end(data);}catch{json(res,404,{error:'Not found'});}};

const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://local');
  if(req.method==='GET'&&url.pathname==='/')return serve(res,'index.html','text/html; charset=utf-8');
  if(req.method==='GET'&&(url.pathname==='/investor'||url.pathname==='/investor/'))return serve(res,'investor.html','text/html; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/app.js')return serve(res,'app.js','text/javascript; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/styles.css')return serve(res,'styles.css','text/css; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/wisdom.css')return serve(res,'wisdom.css','text/css; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/navigation.css')return serve(res,'navigation.css','text/css; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/ai-swarmer-logo.svg')return serve(res,'ai-swarmer-logo.svg','image/svg+xml');
  if(req.method==='GET'&&url.pathname==='/ai-swarmer-mark.svg')return serve(res,'ai-swarmer-mark.svg','image/svg+xml');
  if(req.method==='GET'&&url.pathname==='/investor.js')return serve(res,'investor.js','text/javascript; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/investor.css')return serve(res,'investor.css','text/css; charset=utf-8');
  if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{status:'ok',service:'ai-swarmer-os',kameron_integration:KAMERON_INTEGRATION_VERSION,time:new Date().toISOString()});
  if(!url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found'});
  if(req.method==='POST'&&url.pathname==='/api/v1/events'){
    const raw=await body(req), sig=req.headers['x-swarmer-signature']||'', expected=createHmac('sha256',secret).update(raw).digest('hex');
    if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return json(res,401,{error:'Invalid event signature'});
    const e=JSON.parse(raw), agent=store.getAgent(e.agent_id); if(!agent)return json(res,404,{error:'Unknown agent'});
    if(!e.action||!e.resource)return json(res,400,{error:'action and resource required'});
    const network=collectNetworkEvidence(req,e,trustProxy), attribution=attributionAssessment(e,network);
    const intelMatches=store.matchIntel(attribution), findings=detectThreats(e,agent);
    if(intelMatches.length)findings.push({rule:'known-threat-indicator',severity:intelMatches.some(x=>x.verified&&x.confidence>=80)?'critical':'high',title:'Known threat-intelligence indicator matched',score:Math.max(...intelMatches.map(x=>x.confidence)),evidence:`${intelMatches.length} sourced intelligence record(s) matched technical observables`});
    const decision=enforcementDecision(agent,findings); const recorded=store.recordEvent(e,decision,findings,attribution); recorded.intelligence_matches=intelMatches; return json(res,decision.outcome==='block'?403:202,recorded);
  }
  if(!auth(req))return json(res,401,{error:'Admin bearer token required'});
  if(req.method==='GET'&&url.pathname==='/api/v1/overview')return json(res,200,{...store.overview(),kameron:{checkpoints:kameronCheckpoints.size,recovery_decisions:kameronDecisions.length,integration_version:KAMERON_INTEGRATION_VERSION}});
  if(req.method==='GET'&&url.pathname==='/api/v1/agents')return json(res,200,store.agents());
  if(req.method==='POST'&&url.pathname==='/api/v1/agents'){const a=JSON.parse(await body(req));if(!a.name||!a.owner||!a.purpose)return json(res,400,{error:'name, owner, purpose required'});return json(res,201,store.createAgent(a));}
  if(req.method==='GET'&&url.pathname==='/api/v1/events')return json(res,200,store.events());
  if(req.method==='GET'&&url.pathname==='/api/v1/incidents')return json(res,200,store.incidents());
  if(req.method==='GET'&&url.pathname==='/api/v1/audit')return json(res,200,{verification:store.verifyAudit(),records:store.audits()});
  if(req.method==='GET'&&url.pathname==='/api/v1/wisdom/status')return json(res,200,wisdomStatus());
  if(req.method==='POST'&&url.pathname==='/api/v1/wisdom/session'){const x=JSON.parse(await body(req)||'{}');return json(res,201,await createWisdomSession(x.page));}
  if(req.method==='POST'&&url.pathname==='/api/v1/wisdom/task'){const x=JSON.parse(await body(req)||'{}');const result=interpretWisdomTask(x.message,store);store.audit('admin','wisdom.task','assistant',{type:result.type});return json(res,200,result);}
  if(req.method==='POST'&&url.pathname==='/api/v1/guides/query'){const x=JSON.parse(await body(req)||'{}');const result=answerGuideQuestion(x.message,x.guide);store.audit('admin','guide.query',result.guide.name,{classification:result.classification});return json(res,200,result);}
  if(req.method==='POST'&&url.pathname==='/api/v1/guides/session'){const x=JSON.parse(await body(req)||'{}');return json(res,201,await createGuideSession(String(x.guide||'wisdom').toLowerCase(),x.page||'investor-room'));}
  if(req.method==='GET'&&url.pathname==='/api/v1/campaigns')return json(res,200,store.campaigns());
  if(req.method==='GET'&&url.pathname==='/api/v1/threat-intel')return json(res,200,store.intel());
  if(req.method==='POST'&&url.pathname==='/api/v1/threat-intel'){const x=JSON.parse(await body(req));if(!['ip','fingerprint','process_hash','tool_signature'].includes(x.indicator_type)||!x.indicator_value||!x.classification||!x.source||!Number.isFinite(Number(x.confidence)))return json(res,400,{error:'indicator_type, indicator_value, classification, confidence, and source required'});return json(res,201,store.addIntel(x));}
  if(req.method==='GET'&&url.pathname==='/api/v1/kameron/checkpoints')return json(res,200,[...kameronCheckpoints.values()].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  if(req.method==='POST'&&url.pathname==='/api/v1/kameron/checkpoints'){const x=JSON.parse(await body(req)||'{}');if(!x.task_id||!x.agent_id)return json(res,400,{error:'task_id and agent_id required'});if(!store.getAgent(x.agent_id))return json(res,404,{error:'Unknown agent'});const capsule=buildRecoveryCapsule(x);kameronCheckpoints.set(capsule.capsule_id,capsule);store.audit('kameron-runtime','kameron.checkpoint.create',capsule.capsule_id,{task_id:capsule.task_id,agent_id:capsule.agent_id,trust_score:capsule.swarmer_trust_score});return json(res,201,capsule);}
  if(req.method==='GET'&&url.pathname==='/api/v1/kameron/recovery-decisions')return json(res,200,kameronDecisions.slice().reverse());
  const recovery=url.pathname.match(/^\/api\/v1\/kameron\/checkpoints\/([^/]+)\/evaluate$/);
  if(req.method==='POST'&&recovery){const capsule=kameronCheckpoints.get(recovery[1]);if(!capsule)return json(res,404,{error:'Unknown checkpoint'});const x=JSON.parse(await body(req)||'{}');const decision=recoveryDecision(capsule,{minimum_trust_score:x.minimum_trust_score});kameronDecisions.push(decision);store.audit('swarmer','kameron.recovery.evaluate',capsule.capsule_id,{outcome:decision.outcome,reasons:decision.validation.reasons});return json(res,decision.validation.approved?200:409,decision);}
  const campaign=url.pathname.match(/^\/api\/v1\/campaigns\/([^/]+)$/);
  if(req.method==='GET'&&campaign){const result=store.campaign(campaign[1]);return result?json(res,200,result):json(res,404,{error:'Unknown campaign'});}
  const m=url.pathname.match(/^\/api\/v1\/agents\/([^/]+)\/(contain|release)$/);
  if(req.method==='POST'&&m){const b=JSON.parse(await body(req));if(!b.reason)return json(res,400,{error:'reason required'});const a=m[2]==='contain'?store.contain(m[1],'admin',b.reason):store.release(m[1],'admin',b.reason);return a?json(res,200,a):json(res,404,{error:'Unknown agent'});}
  return json(res,404,{error:'Not found'});
}catch(e){return json(res,e instanceof SyntaxError?400:(e.status||500),{error:e.message});}});
server.listen(port,host,()=>console.log(`AI SWARMER OS listening on http://${host}:${port}`));
