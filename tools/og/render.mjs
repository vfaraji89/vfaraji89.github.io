// Share images (Open Graph / Twitter cards), 1200x630, drawn from one HTML template with the
// site's own fonts and colours. Usage: node scripts/og/render.mjs <cards.json> <outDir> <fontDir>
// Each card: { file, brand: "aai"|"vf", kicker, title, desc, stats: [{n, l}], url, visual:
// "abacus"|"photo"|"number", number?, photo?, langs? }. Titles may use <mark> for the highlight.
// Needs Playwright with Chromium (preinstalled in this environment; `npx playwright install chromium` elsewhere).
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [cardsPath, outDir, fontDir] = process.argv.slice(2);
const cards = JSON.parse(readFileSync(cardsPath, "utf8"));
mkdirSync(outDir, { recursive: true });
// fonts and photos go in as data URLs: a page set with setContent cannot read file:// URLs
const F = (f) => `data:font/woff2;base64,${readFileSync(resolve(fontDir, f)).toString("base64")}`;
const IMG = (f) => `data:image/${f.endsWith(".png") ? "png" : f.endsWith(".webp") ? "webp" : "jpeg"};base64,${readFileSync(resolve(f)).toString("base64")}`;
const esc = (s) => String(s ?? "").replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;");

const MARK = `<svg viewBox="0 0 24 24" width="44" height="44" fill="none"><defs><radialGradient id="b" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="#ff9d8f"/><stop offset=".45" stop-color="#e0301e"/><stop offset="1" stop-color="#9e1a0c"/></radialGradient></defs><rect x="1.6" y="3.6" width="15.4" height="16.8" rx="4.6" fill="#fff" stroke="#1c1c1e" stroke-width="1.8"/><path d="M12.4 12h7.4" stroke="#1c1c1e" stroke-width="1.8" stroke-linecap="round"/><rect x="19.2" y="9.6" width="4.2" height="4.8" rx="1.3" fill="#1c1c1e"/><circle cx="9.3" cy="12" r="3.3" fill="url(#b)"/></svg>`;

// three rods of beads; `fill` says which beads are red (r), black (k) or white (w)
function abacus(rows) {
  const rod = (row, y) => `<div class="rod" style="top:${y}px">${[...row].map((c) => `<i class="b ${c}"></i>`).join("")}</div>`;
  return `<div class="abacus"><span class="post l"></span><span class="post r"></span>${rows.map((r, i) => rod(r, 70 + i * 92)).join("")}</div>`;
}

function html(c) {
  const brand = c.brand === "vf"
    ? `<div class="brand"><span class="vf">Vahid Faraji<span class="dot">.</span></span><span class="sub">Applied AI</span></div>`
    : `<div class="brand">${MARK}<span class="aai">Applied AI<span class="dot">.</span></span><span class="sub">simplified</span></div>`;
  const visual = c.visual === "photo"
    ? `<div class="photo"><img src="${IMG(c.photo)}"></div>`
    : c.visual === "number"
      ? `<div class="bignum"><span class="k">${esc(c.numberLabel ?? "")}</span><b>${esc(c.number)}</b>${abacus(["wrrrw"]).replace('class="abacus"', 'class="abacus mini"')}</div>`
      : abacus(c.rows ?? ["wrrrw", "wkkww", "kwwww"]);
  const tags = (c.tags ?? []).map((t, i) => `<span class="tg${i === 0 ? " on" : ""}">${esc(t)}</span>`).join("");
  const stats = (c.stats ?? []).slice(0, 3).map((s) => `<div class="st"><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Sora;src:url(${F("VahidSora-Regular.woff2")});font-weight:400}
@font-face{font-family:Sora;src:url(${F("VahidSora-SemiBold.woff2")});font-weight:600}
@font-face{font-family:Sora;src:url(${F("VahidSora-Bold.woff2")});font-weight:700}
@font-face{font-family:Sora;src:url(${F("VahidSora-ExtraBold.woff2")});font-weight:800}
@font-face{font-family:Mono;src:url(${F("GeistMono-Variable.woff2")});font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px}
body{font-family:Sora;color:#1c1c1e;background:#fff6f4;position:relative;overflow:hidden;
 background-image:radial-gradient(circle,rgba(224,48,30,.13) 1.2px,transparent 1.7px);background-size:22px 22px}
.frame{position:absolute;inset:0;border-top:10px solid #e0301e}
.left{position:absolute;left:76px;top:56px;width:${c.visual === "photo" ? 660 : c.visual === "number" ? 720 : 690}px;bottom:84px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:12px}
.brand .aai{font-weight:700;font-size:31px;letter-spacing:-.02em}
.brand .vf{font-weight:800;font-size:31px;letter-spacing:-.03em}
.brand .sub{font-family:Mono;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#b4200f;margin-left:12px;padding:5px 10px;border:1.5px solid rgba(180,32,15,.35);border-radius:999px}
.dot{color:#e0301e}
.kicker{margin-top:40px;font-family:Mono;font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:#b4200f}
h1{margin-top:12px;font-weight:800;font-size:${c.titleSize ?? 68}px;line-height:1.02;letter-spacing:-.045em}
h1 mark{background:linear-gradient(transparent 58%,rgba(224,48,30,.18) 58%);color:inherit}
.desc{margin-top:18px;font-size:25px;line-height:1.38;color:#55555a;max-width:690px}
.stats{margin-top:auto;display:flex;gap:0}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;margin-bottom:16px}
.tags+.stats{margin-top:0}
.tg{font-family:Mono;font-size:15px;letter-spacing:.06em;padding:6px 12px;border-radius:999px;border:1.5px solid rgba(28,28,30,.16);background:#fff;color:#3a3a3e}
.tg.on{background:#e0301e;border-color:#e0301e;color:#fff;font-weight:600}
h1 .g{color:#16a34a}h1 .r{color:#e0301e}
.st{padding-right:30px;margin-right:30px;border-right:1.5px solid rgba(28,28,30,.14);display:flex;flex-direction:column;gap:2px}
.st:last-child{border-right:0}
.st b{font-weight:800;font-size:40px;letter-spacing:-.03em}
.st:first-child b{color:#e0301e}
.st span{font-family:Mono;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:#6d6d72}
.foot{position:absolute;left:76px;right:76px;bottom:26px;display:flex;justify-content:space-between;font-family:Mono;font-size:16px;color:#b4200f;letter-spacing:.02em}
.foot .langs{color:#8a8a90;letter-spacing:.12em}
.abacus{position:absolute;right:70px;top:120px;width:300px;height:330px}
.abacus .post{position:absolute;top:0;bottom:0;width:20px;border-radius:10px;background:linear-gradient(90deg,#c9a46e,#e9d3a8 45%,#b88d52)}
.abacus .post.l{left:0}.abacus .post.r{right:0}
.rod{position:absolute;left:10px;right:10px;height:6px;background:linear-gradient(#d9c39b,#b99a66);display:flex;justify-content:center;align-items:center;gap:2px}
.b{width:50px;height:50px;border-radius:50%;flex:none;box-shadow:0 8px 14px -6px rgba(0,0,0,.35)}
.b.r{background:radial-gradient(circle at 34% 30%,#ff9d8f,#e0301e 45%,#9e1a0c)}
.b.k{background:radial-gradient(circle at 34% 30%,#6b6b70,#1c1c1e 55%,#000)}
.b.w{background:radial-gradient(circle at 34% 30%,#fff,#f1ece6 60%,#d9d2c9)}
.photo{position:absolute;right:70px;top:96px;width:330px;height:330px;border-radius:30px;padding:10px;background:#fff;border:2px solid #d9c39b;box-shadow:0 26px 40px -24px rgba(158,26,12,.45)}
.photo img{width:100%;height:100%;object-fit:cover;border-radius:22px}
.bignum{position:absolute;right:76px;top:120px;width:300px;text-align:right}
.bignum .k{font-family:Mono;font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:#b4200f}
.bignum b{display:block;font-weight:800;font-size:190px;line-height:.95;letter-spacing:-.06em;color:#1c1c1e}
.abacus.mini{position:relative;right:auto;top:auto;margin:22px 0 0 auto;width:300px;height:70px}
.abacus.mini .rod{top:32px!important}
</style></head><body><div class="frame"></div>
<div class="left">${brand}<div class="kicker">${esc(c.kicker)}</div><h1>${c.title}<span class="dot">.</span></h1>${c.desc ? `<p class="desc">${esc(c.desc)}</p>` : ""}${tags ? `<div class="tags">${tags}</div>` : ""}<div class="stats">${stats}</div></div>
${visual}
<div class="foot"><span>${esc(c.url)}</span><span class="langs">${c.langs === false ? "" : "EN · TR · ES · NL · JA"}</span></div>
${c.gif ? `<script>
// frame(t), t from 0 to 1: beads slide in, words and tags pop, numbers count up. Stepped, not timed.
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3), back = (x) => { x = Math.min(1, Math.max(0, x)); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const nums = [...document.querySelectorAll('.st b')].map((b) => { const m = b.textContent.match(/^([^0-9]*)([0-9][0-9.,]*)(.*)$/); return m ? { b, pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, post: m[3] } : null; }).filter(Boolean);
window.frame = (t) => {
  document.querySelectorAll('.b').forEach((el, i) => { const k = ease((t - 0.04 * (i % 5) - 0.05) / 0.35); el.style.transform = 'translateX(' + ((1 - k) * -260) + 'px)'; el.style.opacity = k; });
  document.querySelectorAll('h1 .g, h1 .r').forEach((el, i) => { const k = back((t - 0.15 - i * 0.12) / 0.3); el.style.display = 'inline-block'; el.style.transform = 'scale(' + (0.6 + 0.4 * k) + ')'; el.style.opacity = Math.min(1, k * 1.4); });
  document.querySelectorAll('.tg').forEach((el, i) => { const k = back((t - 0.35 - i * 0.06) / 0.25); el.style.transform = 'translateY(' + ((1 - k) * 14) + 'px)'; el.style.opacity = Math.min(1, Math.max(0, k)); });
  nums.forEach((x, i) => { const k = ease((t - 0.4 - i * 0.06) / 0.45); x.b.textContent = x.pre + (x.n * k).toFixed(x.dec) + x.post; });
  const ph = document.querySelector('.photo'); if (ph) { const k = ease((t - 0.02) / 0.4); ph.style.transform = 'translateY(' + ((1 - k) * 30) + 'px) rotate(' + ((1 - k) * 3) + 'deg)'; ph.style.opacity = k; }
};
</script>` : ""}</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const c of cards) {
  await page.setContent(html(c), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // shrink a long title until the card fits
  await page.evaluate(() => { const h = document.querySelector("h1"), l = document.querySelector(".left"), s = document.querySelector(".stats");
    let px = parseFloat(getComputedStyle(h).fontSize);
    while (px > 40 && (h.scrollWidth > h.clientWidth + 2 || (s && s.getBoundingClientRect().top < (document.querySelector(".desc") ?? h).getBoundingClientRect().bottom + 16) || l.scrollHeight > l.clientHeight + 2)) { px -= 3; h.style.fontSize = px + "px"; } });
  await page.screenshot({ path: resolve(outDir, c.file), type: "png" });
  if (c.gif) {
    // 2.4 s of motion at 15 fps, then the finished card held for 3 s; palette per GIF for clean colour
    const { mkdtempSync, rmSync } = await import("node:fs"); const { execFileSync } = await import("node:child_process"); const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(resolve(tmpdir(), "og-gif-")), N = 36;
    for (let i = 0; i <= N; i++) { await page.evaluate((t) => window.frame(t), i / N); await page.screenshot({ path: resolve(dir, `f${String(i).padStart(3, "0")}.png`) }); }
    const out = resolve(outDir, c.gif);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "15", "-i", resolve(dir, "f%03d.png"), "-vf",
      "tpad=stop_mode=clone:stop_duration=3,scale=1200:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle", "-loop", "0", out]);
    rmSync(dir, { recursive: true, force: true });
    console.log("og gif:", c.gif);
  }
  console.log("og:", c.file);
}
await browser.close();
