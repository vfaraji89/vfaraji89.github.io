# Ask my work: the Claude layer

`site/ask.html` works without this Worker: questions are answered by retrieval in
the browser, quoted from `site/data/evidence.json`, at $0. Deploying this Worker
adds answers written by Claude from the same evidence, with citations and a cost
receipt on each one.

## What it does

- `POST /ask {q}`: runs the same retrieval as the browser first. If nothing in the
  evidence is relevant, it answers "no evidence" **without calling Claude**.
  Otherwise it sends the top six evidence items to Claude as documents with
  citations on, and maps each citation back to an evidence id.
- `POST /fit {jd}`: runs the rule-based fit scoring, then asks Claude for a short
  brief as JSON (structured output). Any evidence id Claude invents is dropped and
  counted (`grounding.invented_ids_dropped`).
- `GET /health`: model, today's spend, the cap.

Guardrails: only the site's origin is allowed, 10 requests a minute per visitor,
and a daily dollar cap (`DAILY_BUDGET_USD`, default $2). Past the cap, or on any
API error, the page falls back to retrieval and says so.

Model: `claude-opus-5-5` (set `MODEL` in `wrangler.toml`). At $4 / $20 per million
tokens a typical answer is about 2,000 tokens in and 150 out, roughly $0.011. To
spend less, set `MODEL = "claude-sonnet-5-5"` (half the price) or
`"claude-haiku-5-5"`. Server-side refusal fallback is on (`fallbacks: "default"`).

## Deploy (about 10 minutes)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create SPEND      # paste the id into wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY   # your key, never committed
npx wrangler deploy                         # prints https://ask-my-work.<you>.workers.dev
```

Then switch the site on: in `site/ask.html` set

```html
<meta name="vf-ask-endpoint" content="https://ask-my-work.<you>.workers.dev">
```

The page's Content-Security-Policy already allows `*.workers.dev`. Score the
endpoint with the same eval cases (this spends real tokens, about 40 questions):

```bash
node tools/evals/run.mjs --live https://ask-my-work.<you>.workers.dev
```

The evidence file is bundled into the Worker when it is deployed, so redeploy
after editing `site/data/evidence.json`.

## Local run

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .dev.vars
npx wrangler dev        # http://localhost:8787
```
