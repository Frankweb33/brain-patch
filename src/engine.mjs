/** Transparent phrase checks, not a classifier, diagnosis, or trading signal. */
export const RULES = [
  { id: 'confirmation', name: 'Confirmation bias', pattern: /only bullish|ignore (?:the )?(?:fud|bears)|everyone i follow|all the evidence supports/i, question: 'What is the strongest verifiable evidence against this idea?', note: 'Agreement in your feed is not independent confirmation.' },
  { id: 'anchoring', name: 'Anchoring', pattern: /back to (?:the )?(?:high|ath|peak)|was worth|previous high|old high|back to my entry|recover my entry/i, question: 'Would you make the same decision without knowing the previous price?', note: 'A past price can become a target without supporting evidence.' },
  { id: 'survivorship', name: 'Survivorship bias', pattern: /winning wallets|top wallets|winners prove|successful traders|every winner/i, question: 'Where are the failed positions, missing records, and costs?', note: 'A collection of winners does not describe the whole sample.' },
  { id: 'herding', name: 'Herding', pattern: /everyone is buying|everyone(?:'s| is) aping|whole timeline|all over my feed|everyone is in/i, question: 'Do these signals come from independent sources?', note: 'Repeated promotion can look like many separate opinions.' },
  { id: 'authority', name: 'Authority bias', pattern: /influencer|big account|would never (?:shill|promote)|trusted caller|famous trader/i, question: 'What supports the claim besides the person making it?', note: 'Inspect incentives and evidence separately from reputation.' },
  { id: 'sunk-cost', name: 'Sunk-cost effect', pattern: /too much (?:money|time)|already (?:put|spent|invested)|can(?:not|'t) quit now|cannot walk away/i, question: 'If you had no position, would this still be your next choice?', note: 'Money already spent cannot establish the value of the next decision.' },
  { id: 'overconfidence', name: 'Overconfidence', pattern: /can(?:not|'t) lose|guaranteed|figured it out|easy money|three wins|sure thing|100% certain/i, question: 'How many independent decisions support that confidence?', note: 'A short winning streak can feel like a reliable method.' },
  { id: 'outcome', name: 'Outcome bias', pattern: /made money so|profitable so|profit proves|won so|worked last time/i, question: 'Was the reasoning sound before you knew the result?', note: 'A favorable result alone does not validate the process.' },
];

export const SCENARIOS = {
  peak: { title: 'Holding for the old high', thesis: 'It was worth twice this yesterday. I will hold until it gets back to the high. Three wins and I have figured it out.', evidence: 'One screenshot shared by a large account. No independent verification yet.', invalidation: '', action: 'hold', positionPct: 18, maxPositionPct: 10, horizon: 'Today' },
  crowd: { title: 'The whole timeline is buying', thesis: 'Everyone is buying. Every big account says this is a sure thing. The winning wallets prove the strategy.', evidence: 'Three accounts linked the same promotional post.', invalidation: 'Reconsider if the sources are connected.', action: 'enter', positionPct: 8, maxPositionPct: 5, horizon: 'Today' },
  cost: { title: 'Too much invested to walk away', thesis: "I have already invested too much money. I can't quit now. It worked last time.", evidence: 'No new information since the original decision.', invalidation: '', action: 'increase', positionPct: 20, maxPositionPct: 5, horizon: 'This week' },
  considered: { title: 'A documented paper decision', thesis: 'This paper experiment tests whether independent attention persists over a week. The result is uncertain.', evidence: 'Two independently collected observations are in my notebook. Their reliability still needs checking.', invalidation: 'Reconsider if the observations share a source or the data is incomplete.', action: 'paper', positionPct: 1, maxPositionPct: 2, horizon: 'One week' },
};

const text = (value, cap = 6000) => typeof value === 'string' ? value.trim().slice(0, cap) : '';
const pct = value => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; };
export function normalizeDecision(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  return { title: text(input.title, 120), thesis: text(input.thesis), evidence: text(input.evidence), invalidation: text(input.invalidation, 2000), action: ['enter','hold','increase','exit','paper'].includes(input.action) ? input.action : 'paper', positionPct: pct(input.positionPct), maxPositionPct: pct(input.maxPositionPct), horizon: text(input.horizon, 80) };
}

export function reviewDecision(input, previous = null) {
  const decision = normalizeDecision(input);
  if (decision.thesis.length < 12) throw new Error('Write at least 12 characters about your reasoning before reviewing.');
  const findings = RULES.flatMap(rule => {
    const match = decision.thesis.match(rule.pattern);
    return match ? [{ id: rule.id, name: rule.name, cue: match[0], note: rule.note, question: rule.question }] : [];
  });
  const checks = [];
  if (!decision.evidence) checks.push({ id: 'evidence', role: 'Researcher', title: 'Evidence is missing', detail: 'Add the observations supporting the thesis. This demo cannot verify sources.' });
  if (!decision.invalidation) checks.push({ id: 'invalidation', role: 'Skeptic', title: 'No condition for reconsidering', detail: 'Write what evidence would make you change your mind before the result is known.' });
  if (!decision.maxPositionPct) checks.push({ id: 'limit', role: 'Rule checker', title: 'No position limit set', detail: 'Record your own limit. The tool does not choose a suitable allocation for you.' });
  if (decision.maxPositionPct && decision.positionPct > decision.maxPositionPct) checks.push({ id: 'size', role: 'Rule checker', title: 'Your position exceeds your limit', detail: `${decision.positionPct}% proposed versus your ${decision.maxPositionPct}% limit.` });
  const changes = [];
  if (previous) {
    const before = normalizeDecision(previous);
    if (decision.thesis !== before.thesis) changes.push({ field: 'Thesis', before: before.thesis, after: decision.thesis });
    if (decision.horizon !== before.horizon) changes.push({ field: 'Time horizon', before: before.horizon, after: decision.horizon });
    if (decision.positionPct !== before.positionPct) changes.push({ field: 'Position size', before: `${before.positionPct}%`, after: `${decision.positionPct}%` });
    if (changes.length && decision.evidence === before.evidence) checks.push({ id: 'drift', role: 'Memory', title: 'The plan changed; the evidence did not', detail: 'Compare both versions. A change can be justified, but it needs an explanation.' });
  }
  return { version: 1, mode: 'local-heuristic', decision, findings, checks, changes, flagCount: findings.length + checks.length, limitation: 'Phrase matches are prompts for review, not proof of bias. No market data or LLM is connected. A clean review does not mean a safe trade.' };
}
