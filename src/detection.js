const SENSITIVE = /(?:api[_-]?key|password|passwd|secret|token|private[_-]?key|ssn|credit[_ -]?card)/i;
const INJECTION = /(?:ignore (?:all |the )?previous|system prompt|developer message|bypass (?:policy|safety)|jailbreak|override instructions)/i;
const SHELL = /(?:powershell|cmd\.exe|\/bin\/(?:ba)?sh|curl\s|wget\s|nc\s+-|netcat)/i;

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
  return findings;
}

export function enforcementDecision(agent, findings) {
  if (agent.status === 'contained') return { outcome: 'block', reason: 'Agent is contained' };
  const critical = findings.some(f => f.severity === 'critical');
  if (critical) return { outcome: 'block', reason: findings.find(f => f.severity === 'critical').title };
  if (findings.some(f => f.severity === 'high')) return { outcome: 'review', reason: 'High-severity behavior requires approval' };
  return { outcome: 'allow', reason: 'No blocking policy matched' };
}
