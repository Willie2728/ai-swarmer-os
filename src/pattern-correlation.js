export function correlateSharedIndicators(events=[]) {
  const buckets=new Map();
  for(const event of events){
    const attrs=event.attributes||{};
    const indicators=[
      ['source_ip',attrs.source_ip],
      ['fingerprint',attrs.fingerprint],
      ['tool_signature',attrs.tool_signature],
      ['process_hash',attrs.process_hash],
      ['marker',attrs.marker]
    ].filter(([,v])=>v);
    for(const [type,value] of indicators){
      const key=`${type}:${String(value).toLowerCase()}`;
      const arr=buckets.get(key)||[]; arr.push(event); buckets.set(key,arr);
    }
  }
  return [...buckets.entries()].filter(([,xs])=>xs.length>=2).map(([indicator,xs])=>({
    rule:'shared-indicator-pattern',
    severity:xs.length>=5?'critical':'high',
    title:'Repeated shared indicator detected across security events',
    score:Math.min(99,70+xs.length*5),
    indicator,
    event_count:xs.length,
    event_ids:xs.map(x=>x.id).filter(Boolean)
  }));
}
