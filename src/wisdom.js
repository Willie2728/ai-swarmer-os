import { GUIDE_ROSTER } from './guides.js';

const PLATFORM_CONTEXT = `You are WISDOM, the calm chief-of-staff Wisdom Guide for AI SWARMER OS by Verloray Security Technology Innovations, a Wilkerson Collective company. You understand the Agent Registry, signed telemetry, deterministic policy evaluation, incidents, campaign tracing, sourced threat intelligence, containment, release, and tamper-evident audit history. You orchestrate bounded Knowledge Guides. Speak briefly and naturally. Separate observed fact from inference. Never claim an IP address proves a person's identity. Never reveal secrets, source code, trade secrets, customer data, founder personal data, or raw sensitive telemetry. State-changing, external, financial, legal, containment, release, credential, and evidence-export actions require platform authorization and explicit human confirmation. Never bypass policy, approvals, audit logging, or tenant boundaries. Never perform offensive intrusion or hack-back. If a capability is not configured or proven, state that clearly.`;

const envKey=(guide,suffix)=>process.env[`TAVUS_${guide.toUpperCase()}_${suffix}`]||process.env[`TAVUS_${suffix}`];

export function wisdomStatus() {
  const configured=Boolean(process.env.TAVUS_API_KEY&&envKey('wisdom','PERSONA_ID'));
  return {
    configured,
    replica_configured:Boolean(envKey('wisdom','REPLICA_ID')),
    provider:configured?'tavus':'not-configured',
    guides:Object.entries(GUIDE_ROSTER).map(([id,g])=>({id,...g,video_configured:Boolean(process.env.TAVUS_API_KEY&&envKey(id,'PERSONA_ID'))})),
    capabilities:['platform guidance','guide orchestration','security explanations','workflow navigation','permission-gated tasks','credential-gated voice and video']
  };
}

export async function createGuideSession(guide='wisdom',pageContext='overview') {
  const guideId=guide in GUIDE_ROSTER?guide:'wisdom';
  const apiKey=process.env.TAVUS_API_KEY, personaId=envKey(guideId,'PERSONA_ID');
  if(!apiKey||!personaId)throw Object.assign(new Error(`${GUIDE_ROSTER[guideId].name} needs TAVUS_API_KEY and a configured persona ID in the server environment.`),{status:503});
  const profile=GUIDE_ROSTER[guideId];
  const payload={
    persona_id:personaId,
    conversation_name:`AI SWARMER OS — ${profile.name}`,
    require_auth:true,
    max_participants:2,
    custom_greeting:`Welcome. I’m ${profile.name}, your ${profile.title}. How can I help?`,
    conversational_context:`${PLATFORM_CONTEXT}\nYou are presenting as ${profile.name}, the ${profile.title}, focused on ${profile.domain}. The user is viewing: ${String(pageContext).slice(0,120)}.`,
    properties:{enable_closed_captions:true,participant_absent_timeout:120}
  };
  const replicaId=envKey(guideId,'REPLICA_ID');
  if(replicaId)payload.replica_id=replicaId;
  if(process.env.TAVUS_DOCUMENT_IDS)payload.document_ids=process.env.TAVUS_DOCUMENT_IDS.split(',').map(x=>x.trim()).filter(Boolean);
  const response=await fetch('https://tavusapi.com/v2/conversations',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.message||data.error||`Tavus returned ${response.status}`),{status:502});
  const room=new URL(data.conversation_url);
  if(room.protocol!=='https:'||!room.hostname.endsWith('.daily.co'))throw Object.assign(new Error('Tavus returned an unexpected conversation host.'),{status:502});
  if(data.meeting_token)room.searchParams.set('t',data.meeting_token);
  return {conversation_id:data.conversation_id,join_url:room.toString(),status:data.status,guide:guideId};
}

export const createWisdomSession=pageContext=>createGuideSession('wisdom',pageContext);

export function interpretWisdomTask(message,store){
  const text=String(message||'').trim().slice(0,1000),lower=text.toLowerCase();
  if(!text)return {type:'answer',message:'Ask me about agents, incidents, campaigns, audit integrity, or containment.'};
  if(/(?:show|open|go to|view).*(agent|registry)/.test(lower))return {type:'navigate',view:'agents',message:'Opening the Agent Registry.'};
  if(/(?:show|open|go to|view).*(incident)/.test(lower))return {type:'navigate',view:'incidents',message:'Opening Incident Command.'};
  if(/(?:show|open|go to|view).*(campaign|trace|attribution)/.test(lower))return {type:'navigate',view:'campaigns',message:'Opening Campaign Tracing.'};
  if(/(?:show|open|go to|view).*(audit)/.test(lower))return {type:'navigate',view:'audit',message:'Opening Audit Integrity.'};
  if(/(?:show|open|go to|view).*(investor|pitch)/.test(lower))return {type:'link',href:'/investor',message:'Opening the Investor Intelligence Room.'};
  if(/how many|status|overview|summary/.test(lower)){const o=store.overview();return {type:'answer',data:o,message:`There are ${o.agents} protected agents, ${o.open_incidents} open incidents, ${o.contained} contained agents, and ${o.blocked_events} blocked actions.`};}
  if(/contain|release|delete|change|add|create|block/.test(lower))return {type:'approval_required',message:'That changes system state. Use the relevant control in the app so the exact target, reason, authorization, and audit record are confirmed.'};
  return {type:'answer',message:'I can guide platform workflows, summarize security status, navigate the console, and prepare containment decisions. Try “show incidents,” “open the investor room,” or “give me a security summary.”'};
}

