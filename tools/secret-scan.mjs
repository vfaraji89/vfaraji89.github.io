#!/usr/bin/env node
// Fails (exit 1) if any tracked file holds something that looks like a real secret.
// Runs in CI before every deploy and works as a pre-commit check:
//   node tools/secret-scan.mjs            scan tracked files
//   node tools/secret-scan.mjs --staged   scan only what is staged for commit
// Real keys live in a secrets store, never in the repo: Cloudflare Worker secrets
// (`wrangler secret put`) and GitHub Actions secrets. See ANALYTICS.md, "Secrets".
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const RULES = [
  ["Anthropic API key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /\bsk-(proj-)?[A-Za-z0-9]{32,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|github_pat_[A-Za-z0-9_]{60,}/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Cloudflare API token", /\bCLOUDFLARE_API_TOKEN\s*[=:]\s*['"]?[A-Za-z0-9_-]{30,}/],
  ["GA4 Measurement Protocol secret", /\bapi_secret\s*[=:]\s*['"][A-Za-z0-9_-]{16,}['"]/],
  ["Private key", /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ["Generic secret assignment", /\b(ANTHROPIC_API_KEY|OPENAI_API_KEY|SECRET_KEY|CLIENT_SECRET)\s*=\s*['"]?[A-Za-z0-9_\-]{20,}/],
];
const FORBIDDEN_FILES = /(^|\/)(\.env(\..*)?|\.dev\.vars|credentials\.json|service-account.*\.json|.*\.pem|id_rsa)$/;
const SKIP = /(^|\/)(node_modules|\.git)\/|\.(png|jpe?g|gif|webp|ico|pdf|woff2?|mp4|webm|zip)$|package-lock\.json$|bun\.lockb?$/;

const staged = process.argv.includes("--staged");
const files = execSync(staged ? "git diff --cached --name-only --diff-filter=ACM" : "git ls-files", { encoding: "utf8" })
  .split("\n").filter(Boolean);

const hits = [];
for (const f of files) {
  if (FORBIDDEN_FILES.test(f) && !f.endsWith(".example")) { hits.push(`${f}: a secrets file must never be committed`); continue; }
  if (SKIP.test(f)) continue;
  let text;
  try { if (statSync(f).size > 2_000_000) continue; text = readFileSync(f, "utf8"); } catch { continue; }
  text.split("\n").forEach((line, i) => {
    for (const [name, re] of RULES) if (re.test(line)) hits.push(`${f}:${i + 1}: ${name}`);
  });
}

if (hits.length) {
  console.error(`Secret scan: ${hits.length} finding(s). Move the value into a secrets store and rotate it.\n` + hits.map((h) => "  " + h).join("\n"));
  process.exit(1);
}
console.log(`Secret scan: ${files.length} files, nothing found.`);
