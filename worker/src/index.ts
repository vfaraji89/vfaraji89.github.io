// Ask my work: the Claude layer for vfaraji89.github.io.
//
// POST /ask  { q }   -> an answer written by Claude from retrieved evidence, with citations
// POST /fit  { jd }  -> a fit brief: the rule-based scoring plus Claude's write-up as JSON
// GET  /health       -> model, today's spend, the cap
//
// Every answer is grounded the same way the static site is: retrieval runs first
// over data/evidence.json (the same engine and file the browser uses). If retrieval
// finds nothing, Claude is never called and the reply is "no evidence" at $0.
// Each reply carries a receipt: model, tokens, dollars, milliseconds.
import Anthropic from "@anthropic-ai/sdk";
import EngineModule from "../../site/assets/ask/engine.js";
import evidenceData from "../../site/data/evidence.json";

interface Env {
  ANTHROPIC_API_KEY: string;
  MODEL: string;
  DAILY_BUDGET_USD: string;
  ALLOWED_ORIGINS: string;
  SPEND: KVNamespace;
  LIMITER: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

type Evidence = { id: string; title: string; text: string; url: string; level: string; tags: string[] };
const engine = EngineModule.create(evidenceData);
const byId: Record<string, Evidence> = engine.byId;

// US dollars per million tokens. Priced by the model that actually served the reply.
const PRICES: Record<string, { in: number; out: number; cacheRead: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheRead: 0.01 },
  "claude-opus-5": { in: 5, out: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { in: 5, out: 25, cacheRead: 0.5 },
  "claude-sonnet-5": { in: 2, out: 10, cacheRead: 0.2 },
};

const ASK_SYSTEM = `You answer questions about Vahid Faraji's work for recruiters and hiring managers, using only the documents provided. Each document is one piece of evidence from his public portfolio.

Write two to four plain sentences in the third person. Lead with the direct answer, then the strongest number or result. Cite every factual sentence. Do not add skills, employers, dates or numbers that are not in the documents. If the documents do not answer the question, reply with exactly: "The evidence on this site doesn't cover that."`;

const FIT_SYSTEM = `You write a short, honest fit brief for a recruiter comparing a job description with Vahid Faraji's public evidence. You get the job description, a rule-based scoring of each requirement, and the evidence items with their ids.

Be specific and fair. Strengths must cite evidence ids from the list, and only those. Name real gaps plainly; do not soften them or invent adjacent experience. Keep each field short.`;

const FIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "strengths", "gaps", "interview_questions"],
  properties: {
    headline: { type: "string", description: "One sentence: how well this role fits, and why." },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "evidence_ids"],
        properties: {
          claim: { type: "string" },
          evidence_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "note"],
        properties: { requirement: { type: "string" }, note: { type: "string" } },
      },
    },
    interview_questions: { type: "array", items: { type: "string" }, description: "Two or three questions that would test the thin areas." },
  },
} as const;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("origin") || "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const cors: Record<string, string> = {
      "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0],
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin",
    };
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);

    const budget = parseFloat(env.DAILY_BUDGET_USD || "2");
    const dayKey = "spend:" + new Date().toISOString().slice(0, 10);
    const spent = parseFloat((await env.SPEND.get(dayKey)) || "0");

    if (url.pathname === "/health") return json({ model: env.MODEL, spent_today_usd: +spent.toFixed(4), budget_usd: budget });
    if (req.method !== "POST" || (url.pathname !== "/ask" && url.pathname !== "/fit")) return json({ error: "not found" }, 404);
    if (!allowed.includes(origin)) return json({ error: "origin not allowed" }, 403);

    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited", fallback: true }, 429);
    if (spent >= budget) return json({ error: "daily_budget_reached", fallback: true }, 429);

    let body: { q?: string; jd?: string };
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const t0 = Date.now();
    try {
      const result = url.pathname === "/ask"
        ? await ask(client, env, String(body.q || "").slice(0, 400))
        : await fit(client, env, String(body.jd || "").slice(0, 12000));
      if (result.receipt) {
        result.receipt.ms = Date.now() - t0;
        if (result.receipt.cost_usd) await env.SPEND.put(dayKey, String(spent + result.receipt.cost_usd), { expirationTtl: 60 * 60 * 48 });
      }
      return json(result);
    } catch (err) {
      // Any API trouble: tell the page to fall back to retrieval, which always works.
      if (err instanceof Anthropic.RateLimitError) return json({ error: "upstream_rate_limited", fallback: true }, 503);
      if (err instanceof Anthropic.APIError) return json({ error: `upstream_${err.status}`, fallback: true }, 502);
      return json({ error: "internal", fallback: true }, 500);
    }
  },
};

type Receipt = { model: string; input_tokens: number; output_tokens: number; cache_read_tokens: number; cost_usd: number | null; ms?: number; fallback_model?: boolean };

function receiptOf(msg: Anthropic.Beta.BetaMessage): Receipt {
  const u = msg.usage;
  const p = PRICES[msg.model];
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cost = p ? ((u.input_tokens * p.in) + (u.output_tokens * p.out) + (cacheRead * p.cacheRead)) / 1e6 : null;
  const fallback = (u.iterations ?? []).some((it: { type?: string }) => it.type === "fallback_message");
  return { model: msg.model, input_tokens: u.input_tokens, output_tokens: u.output_tokens, cache_read_tokens: cacheRead, cost_usd: cost == null ? null : +cost.toFixed(6), fallback_model: fallback };
}

async function ask(client: Anthropic, env: Env, q: string) {
  if (q.trim().length < 3) return { abstain: true, answer: [], sources: [], receipt: null };
  // 1. Retrieval decides whether there is anything to say. No evidence, no model call.
  const r = engine.ask(q, { k: 6 });
  if (r.abstain) return { abstain: true, answer: [], sources: [], mode: "retrieval", receipt: null };
  const docs: Evidence[] = r.candidates.slice(0, 6).map((c: { id: string }) => byId[c.id]);

  // 2. Claude writes the answer from those documents, citing them.
  const msg = await client.beta.messages.create({
    model: env.MODEL,
    max_tokens: 1024,
    system: ASK_SYSTEM,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{
      role: "user",
      content: [
        ...docs.map((d) => ({
          type: "document" as const,
          source: { type: "text" as const, media_type: "text/plain" as const, data: d.text },
          title: d.title,
          context: `id: ${d.id} | proof: ${d.level}`,
          citations: { enabled: true },
        })),
        { type: "text" as const, text: `Question: ${q}` },
      ],
    }],
  });
  const receipt = receiptOf(msg);
  if (msg.stop_reason === "refusal") return { abstain: true, answer: [], sources: [], mode: "claude", receipt };

  // 3. Map citations back to evidence ids; number sources in order of first use.
  const order: string[] = [];
  const answer: { text: string; cites: number[] }[] = [];
  for (const block of msg.content) {
    if (block.type !== "text") continue;
    const cites: number[] = [];
    for (const c of block.citations ?? []) {
      if (!("document_index" in c)) continue;
      const id = docs[c.document_index]?.id;
      if (!id) continue;
      if (!order.includes(id)) order.push(id);
      const n = order.indexOf(id) + 1;
      if (!cites.includes(n)) cites.push(n);
    }
    const prev = answer[answer.length - 1];
    if (prev && !cites.length && !block.text.trim()) continue;
    answer.push({ text: block.text, cites });
  }
  const text = answer.map((a) => a.text).join("").trim();
  const abstain = !order.length || /doesn't cover that/i.test(text);
  const sources = order.map((id, i) => ({ n: i + 1, id, title: byId[id].title, url: byId[id].url, level: byId[id].level, cited: true }));
  return { abstain, answer: abstain ? [] : answer, sources: abstain ? [] : sources, mode: "claude", receipt };
}

async function fit(client: Anthropic, env: Env, jd: string) {
  if (jd.trim().length < 40) return { error: "too_short" };
  // 1. The rule-based brief: deterministic, and what the evals check.
  const rules = engine.fit(jd);
  const ids = new Set<string>();
  rules.concepts.forEach((c: { evidence: { id: string }[] }) => c.evidence.forEach((e) => ids.add(e.id)));
  const items = [...ids].map((id) => byId[id]);

  // 2. Claude turns it into a recruiter-ready brief, as JSON.
  const msg = await client.beta.messages.create({
    model: env.MODEL,
    max_tokens: 2048,
    system: FIT_SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema: FIT_SCHEMA } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{
      role: "user",
      content: `<job_description>\n${jd}\n</job_description>\n\n<rule_scoring>\n${JSON.stringify(rules.requirements.map((r: { text: string; status: string; concepts: { label: string; status: string }[] }) => ({ requirement: r.text, status: r.status, concepts: r.concepts.map((c) => `${c.label}: ${c.status}`) })))}\n</rule_scoring>\n\n<evidence>\n${items.map((e) => `[${e.id}] (${e.level}) ${e.title}: ${e.text}`).join("\n")}\n</evidence>`,
    }],
  });
  const receipt = receiptOf(msg);
  if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") return { rules, brief: null, receipt };
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  let brief: { headline: string; strengths: { claim: string; evidence_ids: string[] }[]; gaps: { requirement: string; note: string }[]; interview_questions: string[] };
  try { brief = JSON.parse(text); } catch { return { rules, brief: null, receipt }; }

  // 3. Grounding check: drop any evidence id Claude invented, and any claim left with none.
  let dropped = 0;
  brief.strengths = brief.strengths
    .map((s) => { const ok = s.evidence_ids.filter((id) => byId[id]); dropped += s.evidence_ids.length - ok.length; return { ...s, evidence_ids: ok }; })
    .filter((s) => s.evidence_ids.length);
  return { rules, brief, grounding: { invented_ids_dropped: dropped }, receipt };
}
