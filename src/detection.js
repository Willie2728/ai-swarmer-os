const SENSITIVE = /(?:api[_-]?key|password|passwd|secret|token|private[_-]?key|ssn|credit[_ -]?card)/i;
const INJECTION = /(?:ignore (?:all |the )?previous|system prompt|developer message|bypass (?:policy|safety)|jailbreak|override instructions)/i;
const SHELL = /(?:powershell|cmd\.exe|\/bin\/(?:ba)?sh|curl\s|wget\s|nc\s+-|netcat)/i;
const COVERT_CHANNEL = /(?:pastebin|gist|webhook|wiki|comment|issue|form|shortener|dead[-_ ]?drop|beacon|rendezvous|message[-_ ]?board)/i;
const WRITE_ACTIONS = new Set(['network.egress','data.write','file.write','message.send','web.write','browser.submit','tool.call']);

export function detectThreats(event, agent = {}) {
  const text = JSON.stringify(event.attributes || {});
  const findings = [];
  const add = (rule, severity, title, score, evidence) => findings.push({ rule, severity, title, score, evidence });
  if (INJECTION.test(text)) add('prompt-injection', 'high', 'Prompt injection indicators detected', 75, 'Instruction-override language in event attributes');
  if (SENSITIVE.test(text) && ['network.egress', 'tool.call', 'data.read'].includes(event.action)) add('sensitive-data-access', 'high', 'Possible sensitive data movement', 80, 'Sensitive-data marker combined with access or egress');
  if (event.action === 'network.egress' && event.attributes?.bytes > 5_000_000) add('large-egress', 'critical', 'Unusually large outbound transfer', 95, `${event.attributes.bytes} outbound bytes`);
  if (event.action === 'network.egress' && agent.allowed_destinations?.length && !agent.allowed_destinations.includes(event.resource)) add('destination-deny', 'critical', 'Unapproved outbound destination', 98, `Destination ${event.resource} is not allowlisted`);
  if (event.action === 'tool.call' && agent.allowed_tools?.length && !agent.allowed_tools.includes(event.resource)) add('tool-deny', 'critical', 'Unapproved tool invocation', 98, `Tool ${event.resource} is not allowlisted`);
  if (event.action === 'credential.access') add('credential-access', 'high', 'Agent accessed credential material', 85, 'Credential access event requires investigation');
  if (event.action === 'process.execute' && SHELL.test(text + event.resource)) add('shell-execution', 'high', 'Shell or transfer utility execution', 82, 'Command execution tooling observed');
  if ((event.attributes?.delegation_depth || 0) > 3) add('delegation-depth', 'medium', 'Agent delegation depth exceeded', 60, `Depth ${event.attributes.delegation_depth}`);

  // Effect-based controls: do not trust a "read-only" label if the observed action mutates external state.
  if (event.attributes?.declared_mode === 'read-only' && (WRITE_ACTIONS.has(event.action) || event.attributes?.external_state_changed === true)) {
    add('read-only-side-effect', 'critical', 'Read-only capability produced an external write effect', 99, `Observed ${event.action} while declared_mode=read-only`);
  }
  if (event.attributes?.external_state_changed === true && event.attributes?.authorized_effect !== true) {
    add('unmatched-external-effect', 'critical', 'External state changed without a matching authorized effect', 99, 'Observed external mutation is not linked to an approved consequence envelope');
  }

  // Fleet/covert-channel signals. Correlators can populate these attributes from browser/network sensors.
  const peerCount = Number(event.attributes?.peer_agent_count || 0);
  const repeatedMarkerCount = Number(event.attributes?.repeated_marker_count || 0);
  const destinationNovelty = Number(event.attributes?.destination_novelty_score || 0);
  if (WRITE_ACTIONS.has(event.action) && COVERT_CHANNEL.test(`${event.resource} ${text}`) && (peerCount >= 2 || repeatedMarkerCount >= 2)) {
    add('covert-coordination', 'critical', 'Possible covert agent-to-agent coordination channel', 97, `${peerCount} peer agents / ${repeatedMarkerCount} repeated markers observed at ${event.resource}`);
  }
  if (event.action === 'network.egress' && destinationNovelty >= 0.9 && event.attributes?.business_justification !== true) {
    add('novel-egress-destination', 'high', 'High-novelty outbound destination requires review', 88, `destination_novelty_score=${destinationNovelty}`);
  }
  if (peerCount >= 5 && event.attributes?.shared_destination === true && event.attributes?.approved_fleet_channel !== true) {
    add('fleet-rendezvous', 'critical', 'Multiple agents converged on an unapproved shared destination', 98, `${peerCount} agents observed using ${event.resource}`);
  }
  if (event.attributes?.control_fingerprint_expected && event.attributes?.control_fingerprint_observed && event.attributes.control_fingerprint_expected !== event.attributes.control_fingerprint_observed) {
    add('control-provenance-drift', 'critical', 'Security control fingerprint changed from approved version', 99, 'Runtime control or policy engine no longer matches approved provenance');
  }
  return findings;
}

export function enforcementDecision(agent, findings) {
  if (agent.status === 'contained') return { outcome: 'block', reason: 'Agent is contained' };
  const critical = findings.some(f => f.severity === 'critical');
  if (critical) return { outcome: 'block', reason: findings.find(f => f.severity === 'critical').title };
  if (findings.some(f => f.severity === 'high')) return { outcome: 'review', reason: 'High-severity behavior requires approval' };
  return { outcome: 'allow', reason: 'No blocking policy matched' };
}
