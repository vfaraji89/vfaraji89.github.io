#!/usr/bin/env node
// Evals for "Ask my work" and the fit brief.
//   node tools/evals/run.mjs            run, print, write site/data/evals.json
//   node tools/evals/run.mjs --check    same, and exit 1 if a threshold fails (CI)
//   node tools/evals/run.mjs --live https://<worker>   also score the Claude endpoint
// The engine under test is site/assets/ask/engine.js, the same file visitors run.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const site = path.join(root, 'site');
const require = createRequire(import.meta.url);
const Engine = require(path.join(site, 'assets/ask/engine.js'));

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const liveAt = args.indexOf('--live');
const LIVE = liveAt !== -1 ? args[liveAt + 1] : null;

const data = JSON.parse(readFileSync(path.join(site, 'data/evidence.json'), 'utf8'));
const cases = JSON.parse(readFileSync(path.join(here, 'cases.json'), 'utf8'));
const eng = Engine.create(data);

const THRESHOLDS = { ask: 0.9, abstain: 1.0, fit: 0.9, links: 1.0 };

// ---- 1. Ask: cited sources contain the expected evidence; out-of-scope abstains
const ask = cases.ask.map((c) => {
  const r = eng.ask(c.q);
  const cited = r.sources.map((s) => s.id);
  let pass, why;
  if (c.abstain) {
    pass = r.abstain;
    why = pass ? 'said no evidence' : `answered from ${cited.join(', ')} (should have said no evidence)`;
  } else {
    const hit = cited.find((id) => c.expect.includes(id));
    const firstOk = !c.first || c.first.includes(cited[0]);
    pass = !r.abstain && !!hit && firstOk;
    why = r.abstain ? 'said no evidence (should have answered)'
      : !hit ? `cited ${cited.join(', ')}; expected one of ${c.expect.join(', ')}`
      : !firstOk ? `led with ${cited[0]}; strongest proof should come first (${c.first.join(', ')})`
      : `cited ${hit}${c.first ? ', strongest first' : ''}`;
  }
  const rank = c.abstain ? null : r.candidates.findIndex((x) => c.expect.includes(x.id)) + 1;
  return { id: c.id, q: c.q, kind: c.abstain ? 'abstain' : 'answer', split: c.split || 'tuning', pass, why, cited, answer: r.answer.map((a) => a.text).join(' '), rank: rank || null, ms: r.ms };
});
const answerCases = ask.filter((a) => a.kind === 'answer');
const abstainCases = ask.filter((a) => a.kind === 'abstain');
const mrr = answerCases.reduce((s, a) => s + (a.rank ? 1 / a.rank : 0), 0) / answerCases.length;

// ---- 2. Fit: each expected concept gets the expected status
const fit = cases.fit.map((c) => {
  const b = eng.fit(c.jd);
  const got = Object.fromEntries(b.concepts.map((x) => [x.key, x.status]));
  const checks = Object.entries(c.expect).map(([k, want]) => ({ concept: k, want, got: got[k] || 'not detected', pass: got[k] === want }));
  return { id: c.id, title: c.title, score: b.score, pass: checks.every((x) => x.pass), checks };
});
const fitChecks = fit.flatMap((f) => f.checks);

// ---- 3. Grounding: every evidence link points at something that exists
const fileCache = {};
const links = data.evidence.map((e) => {
  if (/^https?:/.test(e.url)) return { id: e.id, url: e.url, pass: true, why: 'external' };
  const [file, anchor] = e.url.split('#');
  const p = path.join(site, file);
  if (!existsSync(p)) return { id: e.id, url: e.url, pass: false, why: 'file missing' };
  fileCache[p] ??= readFileSync(p, 'utf8');
  const ok = !anchor || new RegExp(`id="${anchor}"`).test(fileCache[p]);
  return { id: e.id, url: e.url, pass: ok, why: ok ? 'anchor found' : `no id="${anchor}" in ${file}` };
});

// ---- 4. Optional: the Claude endpoint, scored on the same ask cases
let live = null;
if (LIVE) {
  const rows = [];
  for (const c of cases.ask) {
    const res = await fetch(LIVE.replace(/\/$/, '') + '/ask', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://vfaraji89.github.io' },
      body: JSON.stringify({ q: c.q }),
    });
    const j = await res.json().catch(() => ({}));
    const cited = (j.sources || []).filter((s) => s.cited).map((s) => s.id);
    const grounded = (j.sources || []).every((s) => data.evidence.some((e) => e.id === s.id));
    const pass = c.abstain ? !!j.abstain : !j.abstain && cited.some((id) => c.expect.includes(id)) && grounded;
    rows.push({ id: c.id, pass, cited, cost: j.receipt?.cost_usd ?? null, ms: j.receipt?.ms ?? null, model: j.receipt?.model ?? null });
  }
  const costs = rows.map((r) => r.cost).filter((x) => x != null);
  live = {
    endpoint: LIVE, model: rows.find((r) => r.model)?.model ?? null,
    pass_rate: rows.filter((r) => r.pass).length / rows.length,
    avg_cost_usd: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
    p50_ms: median(rows.map((r) => r.ms).filter((x) => x != null)), cases: rows,
  };
}
function median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

const rate = (xs) => (xs.length ? xs.filter((x) => x.pass).length / xs.length : 1);
const metrics = {
  ask: rate(answerCases), abstain: rate(abstainCases), fit: rate(fitChecks), links: rate(links),
  holdout: rate(ask.filter((a) => a.split === 'holdout')),
  mrr: +mrr.toFixed(3), cases: ask.length + fitChecks.length + links.length,
};
let sha = 'local';
try { sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch {}

const outPath = path.join(site, 'data/evals.json');
let history = [];
try { history = JSON.parse(readFileSync(outPath, 'utf8')).history || []; } catch {}
const run = { at: new Date().toISOString(), sha, metrics };
const last = history[history.length - 1];
if (!last || JSON.stringify(last.metrics) !== JSON.stringify(metrics)) history.push(run);
history = history.slice(-40);

const out = {
  note: 'Generated by tools/evals/run.mjs. Do not edit by hand.',
  latest: run, thresholds: THRESHOLDS, evidence_items: data.evidence.length,
  ask, fit, links: links.filter((l) => !l.pass).length ? links : links.map(({ id, pass }) => ({ id, pass })),
  live, history,
};
writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');

const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
console.log(`Ask, answers   ${pct(metrics.ask)}  (${answerCases.filter((a) => a.pass).length}/${answerCases.length})   MRR ${metrics.mrr}`);
console.log(`Ask, abstains  ${pct(metrics.abstain)}  (${abstainCases.filter((a) => a.pass).length}/${abstainCases.length})`);
console.log(`Fit, labels    ${pct(metrics.fit)}  (${fitChecks.filter((a) => a.pass).length}/${fitChecks.length})`);
console.log(`Held-out ask   ${pct(metrics.holdout)}  (${ask.filter((a) => a.split === 'holdout' && a.pass).length}/${ask.filter((a) => a.split === 'holdout').length}, written after the first tuning round)`);
console.log(`Evidence links ${pct(metrics.links)}  (${links.filter((a) => a.pass).length}/${links.length})`);
if (live) console.log(`Claude endpoint ${pct(live.pass_rate)}  avg $${live.avg_cost_usd?.toFixed(5)}  p50 ${live.p50_ms}ms`);
for (const a of ask.filter((x) => !x.pass)) console.log(`  FAIL ${a.id} "${a.q}": ${a.why}`);
for (const f of fit) for (const c of f.checks.filter((x) => !x.pass)) console.log(`  FAIL ${f.id} ${c.concept}: want ${c.want}, got ${c.got}`);
for (const l of links.filter((x) => !x.pass)) console.log(`  FAIL link ${l.id}: ${l.why}`);

if (CHECK) {
  const bad = Object.entries(THRESHOLDS).filter(([k, t]) => metrics[k] < t);
  if (bad.length) { console.error('Below threshold: ' + bad.map(([k, t]) => `${k} ${pct(metrics[k])} < ${pct(t)}`).join(', ')); process.exit(1); }
}
