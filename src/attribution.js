import { createHash } from 'node:crypto';
import net from 'node:net';

const clean = value => String(value || '').replace(/^::ffff:/, '').trim().slice(0, 512);
const sha = value => createHash('sha256').update(value).digest('hex');

export function validIp(value) {
  const ip = clean(value);
  return net.isIP(ip) ? ip : null;
}

export function collectNetworkEvidence(req, event, trustProxy = false) {
  const peerIp = validIp(req.socket.remoteAddress);
  const forwarded = trustProxy ? clean(req.headers['x-forwarded-for']).split(',').map(validIp).filter(Boolean) : [];
  const reported = Array.isArray(event.trace?.hops) ? event.trace.hops.map(h => ({
    ip: validIp(h.ip), timestamp: clean(h.timestamp), observer: clean(h.observer), interface: clean(h.interface)
  })).filter(h => h.ip) : [];
  const sourceIp = forwarded[0] || peerIp;
  return {
    source_ip: sourceIp,
    transport_peer_ip: peerIp,
    proxy_chain: forwarded,
    reported_route: reported,
    user_agent: clean(req.headers['user-agent']),
    collector_id: clean(req.headers['x-swarmer-collector-id']),
    received_at: new Date().toISOString(),
    provenance: {
      source_ip: forwarded.length ? 'trusted_proxy_header' : 'direct_transport',
      reported_route: reported.length ? 'collector_reported_unverified' : 'not_available'
    }
  };
}

export function fingerprintEvent(event, network) {
  const indicators = [network.source_ip, network.user_agent, event.attributes?.ja3, event.attributes?.ja4,
    event.attributes?.process_hash, event.attributes?.tool_signature, event.attributes?.campaign_marker]
    .map(clean).filter(Boolean).sort();
  return sha(indicators.join('|'));
}

export function attributionAssessment(event, network) {
  const fingerprint = fingerprintEvent(event, network);
  return {
    fingerprint,
    campaign_id: `camp-${fingerprint.slice(0, 16)}`,
    network,
    characteristics: {
      tls_fingerprint: clean(event.attributes?.ja3 || event.attributes?.ja4),
      process_hash: clean(event.attributes?.process_hash),
      tool_signature: clean(event.attributes?.tool_signature),
      autonomous_system: clean(event.attributes?.asn),
      country_code: clean(event.attributes?.country_code)
    },
    confidence: network.source_ip ? 45 : 20,
    caveat: 'Technical association only. IP addresses, geolocation, and fingerprints do not establish a human identity.'
  };
}
