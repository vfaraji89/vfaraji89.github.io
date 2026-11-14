/* Vahid’s agent: the corner agent (was "Ask my work").
   A small abacus in the corner. Opening it loads the engine and the evidence
   file (nothing loads before that), and every question runs as a visible
   pipeline: read the question, search the evidence, weigh the proof, decide
   whether there is enough to answer, then answer with sources and a receipt.
   The engine is site/assets/ask/engine.js, the one tools/evals tests.
   Optional Claude endpoint: <meta name="vf-ask-endpoint" content="https://..."> */
(function () {
    'use strict';
    if (window.__vfAsk) return; window.__vfAsk = true;
    var me = document.currentScript;
    var BASE = me ? me.src.replace(/assets\/ask\/widget\.js.*$/, '') : '';
    var metaEp = document.querySelector('meta[name="vf-ask-endpoint"]');
    var ENDPOINT = metaEp ? (metaEp.getAttribute('content') || '').trim().replace(/\/$/, '') : '';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var STEP_MS = reduce ? 0 : 230;

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function link(href, text, cls) { var a = el('a', cls, text); a.href = /^https?:/.test(href) ? href : BASE + href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function track(n, p) { try { if (window.gtag) gtag('event', n, p || {}); } catch (e) {} }

    var ABACUS = '<svg class="vfa-abacus" viewBox="0 0 40 40" aria-hidden="true" fill="none">' +
        '<rect x="3" y="4" width="34" height="32" rx="7" fill="#fff6f4" stroke="#c9a67b" stroke-width="2"/>' +
        '<path d="M8 13h24M8 20h24M8 27h24" stroke="rgba(28,28,30,0.25)" stroke-width="1.3"/>' +
        '<circle class="bd bd-1" cx="11.5" cy="13" r="3" fill="#e0301e"/><circle cx="17.5" cy="13" r="3" fill="#1c1c1e" opacity="0.18"/>' +
        '<circle class="bd bd-2" cx="26" cy="20" r="3" fill="#1c1c1e"/><circle cx="20" cy="20" r="3" fill="#1c1c1e" opacity="0.18"/>' +
        '<circle class="bd bd-3" cx="13" cy="27" r="3" fill="#1c1c1e"/><circle cx="28.5" cy="27" r="3" fill="#1c1c1e" opacity="0.18"/></svg>';

    // ---- shell ----------------------------------------------------------------
    var root = el('div', 'vfa'); root.setAttribute('data-nosnippet', '');
    root.innerHTML =
        '<button type="button" class="vfa-launch" aria-haspopup="dialog" aria-expanded="false">' + ABACUS +
        '<span class="vfa-l-text"><b>Vahid’s agent</b><em>Ask · sources shown</em></span><span class="vfa-sr">Vahid’s agent: ask about his work, answered from public evidence</span></button>' +
        '<div class="vfa-panel" role="dialog" aria-label="Vahid’s agent">' +
        '<div class="vfa-head">' + ABACUS + '<div class="vfa-title"><b>Vahid’s agent</b><span><i></i>' + (ENDPOINT ? 'Claude · grounded in evidence' : 'Retrieval agent · runs in your browser') + '</span></div>' +
        '<button type="button" class="vfa-x" aria-label="Close"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>' +
        '<div class="vfa-body" aria-live="polite"></div>' +
        '<div class="vfa-foot"><form class="vfa-form"><label class="vfa-sr" for="vfa-in">Your question</label>' +
        '<input id="vfa-in" type="text" maxlength="400" autocomplete="off" placeholder="Ask about his projects, papers, results…">' +
        '<button type="submit" aria-label="Ask"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>' +
        '<p class="vfa-meta"><span>Only answers from public evidence</span><a href="' + BASE + 'evals.html">How it’s tested →</a></p></div></div>';
    document.body.appendChild(root);
    var launch = root.querySelector('.vfa-launch'), panel = root.querySelector('.vfa-panel');
    // The launcher's mark plays the site's own loop, from the abacus to agents (the favicon's frames,
    // assets/brand/favicon-anim.js), all the time. Reduced motion keeps the still abacus.
    (function liveMark() {
        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var still = launch.querySelector('.vfa-abacus');
        var cv = document.createElement('canvas'); if (!cv.getContext || !still) return;
        var css = 38, px = Math.round(css * Math.min(3, window.devicePixelRatio || 1));
        cv.width = cv.height = px; cv.className = 'vfa-abacus vfa-live'; cv.setAttribute('aria-hidden', 'true');
        var g = cv.getContext('2d'), LOOP = 6400, t0 = performance.now(), swapped = false;
        function draw(now) {
            requestAnimationFrame(draw);
            if (!window.vfFaviconFrame || document.hidden || root.classList.contains('is-open')) return;
            if (!swapped) { still.replaceWith(cv); swapped = true; }
            g.setTransform(px / 64, 0, 0, px / 64, 0, 0);
            window.vfFaviconFrame(g, ((now - t0) % LOOP) / LOOP);
        }
        requestAnimationFrame(draw);
    })();
    var body = root.querySelector('.vfa-body'), form = root.querySelector('.vfa-form'), input = root.querySelector('#vfa-in');

    var CHIPS = ['Has he shipped agents to production?', 'What did ProjectLens save?', 'How does he cut token costs?', 'Which papers are peer-reviewed?', 'Kubernetes experience?'];
    var intro = el('div');
    var ip = el('p', 'vfa-intro');
    ip.innerHTML = 'I\u2019m Vahid\u2019s agent. I answer questions about his work only from <b>public evidence</b> on this site, show each step I take, and say so when the evidence doesn\u2019t cover something.';
    intro.appendChild(ip);
    var chips = el('div', 'vfa-chips');
    CHIPS.forEach(function (c) { var b = el('button', 'vfa-chip', c); b.type = 'button'; b.addEventListener('click', function () { run(c); }); chips.appendChild(b); });
    intro.appendChild(chips);
    body.appendChild(intro);

    // stay clear of the cookie prompt while it is on screen
    function dodge() {
        if (root.classList.contains('is-open')) { root.style.bottom = ''; return; }
        var c = document.querySelector('[aria-label="Analytics consent"]');
        var r = c && c.isConnected ? c.getBoundingClientRect() : null;   // fixed elements have no offsetParent
        var narrow = window.innerWidth <= 640;
        root.style.bottom = r && r.height && (narrow || r.right > window.innerWidth - 260) ? (window.innerHeight - r.top + 12) + 'px' : '';
    }
    new MutationObserver(dodge).observe(document.body, { childList: true, subtree: false });
    window.addEventListener('resize', dodge); setTimeout(dodge, 600); setTimeout(dodge, 2500);

    // ---- open / close ---------------------------------------------------------
    var eng = null, loading = null;
    function load() {
        if (loading) return loading;
        loading = new Promise(function (res, rej) {
            if (window.VFEngine) return res();
            var s = document.createElement('script'); s.src = BASE + 'assets/ask/engine.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
        }).then(function () { return fetch(BASE + 'data/evidence.json', { cache: 'no-cache' }); })
          .then(function (r) { return r.json(); })
          .then(function (d) { eng = VFEngine.create(d); return eng; });
        return loading;
    }
    function open(focus) {
        root.classList.add('is-open'); launch.setAttribute('aria-expanded', 'true'); root.style.bottom = '';
        load(); if (focus !== false) setTimeout(function () { input.focus(); }, 60);
        track('ask_widget_open');
    }
    function close() { root.classList.remove('is-open'); launch.setAttribute('aria-expanded', 'false'); launch.focus(); dodge(); }
    launch.addEventListener('click', function () { open(); });
    root.querySelector('.vfa-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
    launch.addEventListener('mouseenter', function () { load(); }, { once: true });
    // any link to #ask (or a page's [data-ask]) opens the agent
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href$="#ask"], [data-ask]');
        if (!a) return; e.preventDefault(); open(); var q = a.getAttribute('data-ask'); if (q) run(q);
    });
    window.vfAsk = function (q) { open(false); if (q) run(q); };

    // ---- the pipeline ---------------------------------------------------------
    var busy = false;
    form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });

    function step(list, title) {
        var li = el('li', 'vfa-step'); li.appendChild(el('span', 'dot'));
        var box = el('div'); box.appendChild(el('b', null, title)); li.appendChild(box); list.appendChild(li);
        return { li: li, box: box, on: function () { li.classList.add('on'); }, done: function (det) {
            li.classList.remove('on'); li.classList.add('done'); if (det) box.appendChild(det); body.scrollTop = body.scrollHeight;
        } };
    }
    function det(text) { return el('div', 'det', text); }

    function run(q) {
        q = String(q || '').trim(); if (q.length < 3 || busy) return;
        busy = true; input.value = ''; if (intro.parentNode) intro.remove();
        root.classList.add('is-thinking');
        body.appendChild(el('div', 'vfa-q', q));
        var runBox = el('div', 'vfa-run'), list = el('ol', 'vfa-steps');
        runBox.appendChild(list); body.appendChild(runBox); body.scrollTop = body.scrollHeight;
        var s1 = step(list, 'Read the question'), s2 = step(list, 'Search the evidence'), s3 = step(list, 'Weigh the proof'), s4 = step(list, 'Decide'), s5 = step(list, ENDPOINT ? 'Write with Claude, cite sources' : 'Answer from quotes, cite sources');
        var t0 = performance.now(), r, sr;
        s1.on();
        load().then(function () {
            r = eng.ask(q); sr = eng.search(q, 5);
            var stems = eng.tokens(q), words = [];
            (q.match(/[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F+#.-]*/g) || []).forEach(function (w) {
                var t = eng.tokens(w)[0]; if (t && stems.indexOf(t) !== -1 && words.indexOf(w) === -1) words.push(w.replace(/[.?!]+$/, ''));
            });
            var concepts = (r.concepts || []).map(function (k) { var c = eng.concepts.filter(function (x) { return x.key === k; })[0]; return c ? c.label : k; });
            return wait(STEP_MS).then(function () {
                s1.done(det(words.length + ' key terms: ' + words.slice(0, 6).join(', ') + (concepts.length ? ' · skills: ' + concepts.join(', ') : '')));
                s2.on(); return wait(STEP_MS);
            });
        }).then(function () {
            var bars = el('div', 'vfa-bars'), top = sr.results.slice(0, 4), max = top.length ? top[0].score : 1;
            var picked = r.sources.map(function (s) { return s.id; });
            s2.done(det('BM25 over ' + eng.evidence.length + ' items · ' + sr.results.length + ' matched, ranked by relevance × proof'));
            top.forEach(function (x) {
                var b = el('div', 'vfa-bar' + (picked.indexOf(x.e.id) !== -1 ? ' pick' : '')), s = el('span'), i = el('i');
                i.style.width = Math.max(6, Math.round(100 * x.score / max)) + '%';
                s.appendChild(i); s.appendChild(el('em', null, x.e.title)); b.appendChild(s); b.appendChild(el('u', null, x.score.toFixed(1)));
                bars.appendChild(b);
            });
            if (top.length) s2.box.appendChild(bars);
            s3.on(); return wait(STEP_MS);
        }).then(function () {
            var lv = {}; sr.results.slice(0, 4).forEach(function (x) { var L = eng.levels[x.e.level] || {}; lv[L.label || x.e.level] = 1; });
            s3.done(det(Object.keys(lv).length ? 'Proof levels: ' + Object.keys(lv).join(' · ') + '. In-production and published work rank first.' : 'Nothing to weigh.'));
            s4.on(); return wait(STEP_MS);
        }).then(function () {
            var best = sr.results.slice().sort(function (a, b) { return (b.raw || 0) - (a.raw || 0); })[0];
            var cov = best ? Math.round(100 * Math.min(1, best.coverage)) : 0;
            var d = det(best ? 'Best match covers ' + cov + '% of the question' + (best.tagged ? ' and carries the skill asked about' : best.named ? ' and names it directly' : '') + '.' : 'No relevant evidence found.');
            d.appendChild(document.createElement('br'));
            d.appendChild(el('span', 'vfa-verdict' + (r.abstain ? ' no' : ''), r.abstain ? 'Not enough evidence → say so' : 'Enough evidence → answer'));
            s4.done(d); s5.on();
            if (!ENDPOINT || r.abstain) return wait(STEP_MS).then(function () { return { mode: 'retrieval', r: r }; });
            return remote(q).then(function (j) { return j.mode === 'claude' ? { mode: 'claude', r: j } : { mode: 'retrieval', r: r }; },
                function () { return { mode: 'retrieval', r: r, note: 'Claude unavailable, answered from quotes.' }; });
        }).then(function (out) {
            var res = out.r, ms = Math.round(performance.now() - t0);
            s5.li.classList.add('final'); s5.done(det(res.abstain ? 'No answer written: nothing here backs one.' : (out.mode === 'claude' ? 'Claude wrote from ' : 'Quoted ') + res.sources.length + ' source' + (res.sources.length === 1 ? '' : 's') + '.'));
            var ans = el('div', 'vfa-ans');
            if (res.abstain) {
                ans.appendChild(el('p', 'none', 'The evidence on this site doesn’t cover that.'));
                var w = el('p', 'why', 'That’s deliberate: no guessing. '); w.appendChild(link('https://calendar.app.google/KWQg6gBjXetC4ofp9', 'Ask me directly →')); ans.appendChild(w);
            } else {
                res.answer.forEach(function (a) {
                    var p = el('p', out.mode === 'claude' ? '' : 'quote', a.text);
                    (a.cites || (a.cite ? [a.cite] : [])).forEach(function (n) { var s = res.sources[n - 1]; if (s) p.appendChild(link(s.url, String(n), 'vfa-cn')); });
                    ans.appendChild(p);
                });
                var ul = el('ul', 'vfa-src');
                res.sources.forEach(function (s) {
                    var li = el('li'); li.appendChild(el('b', null, String(s.n))); li.appendChild(link(s.url, s.title));
                    var L = (eng.levels[s.level] || {}); var em = el('em', (L.weight || 0) >= 3 ? 'strong' : '', L.label || s.level); li.appendChild(em); ul.appendChild(li);
                });
                ans.appendChild(ul);
            }
            var rc = res.receipt;
            ans.appendChild(el('p', 'vfa-rc', out.mode === 'claude' && rc
                ? rc.model + ' · ' + rc.input_tokens + ' in / ' + rc.output_tokens + ' out · $' + (rc.cost_usd || 0).toFixed(4) + ' · ' + (rc.ms / 1000).toFixed(1) + ' s'
                : '0 model calls · $0.00 · ' + r.ms + ' ms compute · ' + ms + ' ms shown step by step' + (out.note ? ' · ' + out.note : '')));
            runBox.appendChild(ans); body.scrollTop = body.scrollHeight;
            track('ask_widget', { mode: out.mode, abstain: !!res.abstain });
        }).catch(function () {
            runBox.appendChild(el('div', 'vfa-ans', 'The evidence file did not load. Try again in a moment.'));
        }).then(function () { busy = false; root.classList.remove('is-thinking'); input.focus(); });
    }

    function remote(q) {
        var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var t = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
        return fetch(ENDPOINT + '/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q }), signal: ctl ? ctl.signal : undefined })
            .then(function (res) { clearTimeout(t); return res.json().then(function (j) { if (!res.ok || j.fallback || j.error) throw new Error('fallback'); return j; }); });
    }

    // ?ask=… opens the agent with that question
    try { var qq = new URLSearchParams(location.search).get('ask'); if (qq) { open(false); run(qq); } } catch (e) {}
})();
