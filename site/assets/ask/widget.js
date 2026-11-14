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

    // the same mark as the tab icon: beads on three rails, no box (the live canvas takes over when motion is allowed)
    var ABACUS = '<svg class="vfa-abacus" viewBox="0 0 48 48" aria-hidden="true" fill="none">' +
        '<defs><radialGradient id="vfa-br" cx=".38" cy=".33" r=".7"><stop offset="0" stop-color="#ffb3a8"/><stop offset=".5" stop-color="#e0301e"/><stop offset="1" stop-color="#9e1a0c"/></radialGradient>' +
        '<radialGradient id="vfa-bk" cx=".38" cy=".33" r=".7"><stop offset="0" stop-color="#8a8a90"/><stop offset=".6" stop-color="#1c1c1e"/><stop offset="1" stop-color="#000"/></radialGradient></defs>' +
        '<g transform="translate(24 24) scale(1.36) translate(-24 -24)">' +
        '<path d="M11 16.5h26M11 24h26M11 31.5h26" stroke="rgba(28,28,30,0.3)" stroke-width="1.6" stroke-linecap="round"/>' +
        '<circle cx="15.5" cy="16.5" r="3.4" fill="url(#vfa-br)"/><circle cx="22.5" cy="16.5" r="3.4" fill="url(#vfa-bk)"/>' +
        '<circle cx="15.5" cy="24" r="3.4" fill="url(#vfa-bk)"/><circle cx="22.5" cy="24" r="3.4" fill="url(#vfa-bk)"/>' +
        '<circle cx="29.5" cy="24" r="3.4" fill="url(#vfa-bk)"/><circle cx="32.5" cy="31.5" r="3.4" fill="url(#vfa-bk)"/></g></svg>';

    // ---- shell ----------------------------------------------------------------
    var root = el('div', 'vfa'); root.setAttribute('data-nosnippet', '');
    root.innerHTML =
        '<button type="button" class="vfa-launch" aria-haspopup="dialog" aria-expanded="false">' + ABACUS +
        '<span class="vfa-l-text"><b>Vahid’s agent</b><em>Ask · sources shown</em></span><span class="vfa-sr">Vahid’s agent: ask about his work, answered from public evidence</span></button>' +
        '<div class="vfa-panel" role="dialog" aria-label="Vahid’s agent">' +
        '<div class="vfa-head">' + ABACUS + '<div class="vfa-title"><b>Vahid’s agent</b><span><i></i>' + (ENDPOINT ? 'Claude · evidence only' : 'Evidence only') + '</span></div>' +
        '<button type="button" class="vfa-x" aria-label="Close"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>' +
        '<div class="vfa-body" aria-live="polite"></div>' +
        '<div class="vfa-foot"><form class="vfa-form"><label class="vfa-sr" for="vfa-in">Your question</label>' +
        '<input id="vfa-in" type="text" maxlength="400" autocomplete="off" placeholder="Ask about his work…">' +
        '<button type="submit" aria-label="Ask"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>' +
        '<p class="vfa-meta"><span></span><a href="' + BASE + 'evals.html">How it’s tested →</a></p></div></div>';
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
    ip.innerHTML = 'Ask about Vahid\u2019s work. Every answer cites its source.';
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

    // each step is a tool call, the way an agent shows them: name, arguments, a short result; tap to see the output
    function step(list, fn, args) {
        var li = el('li', 'vfa-step'), d = el('details', 'vfa-call'), sm = el('summary');
        sm.appendChild(el('span', 'st'));
        var sig = el('code', 'sig'); sig.appendChild(el('b', null, fn)); sig.appendChild(el('span', null, '(' + args + ')')); sm.appendChild(sig);
        var res = el('span', 'res', ''); sm.appendChild(res);
        d.appendChild(sm); var box = el('div', 'out'); d.appendChild(box); li.appendChild(d); list.appendChild(li);
        return { li: li, box: box, d: d, on: function () { li.classList.add('on'); res.textContent = 'running'; body.scrollTop = body.scrollHeight; }, done: function (det, short) {
            li.classList.remove('on'); li.classList.add('done'); res.textContent = short || 'done';
            if (det) box.appendChild(det); else li.classList.add('empty');
            body.scrollTop = body.scrollHeight;
        } };
    }
    function q1(x) { x = String(x); return '"' + (x.length > 28 ? x.slice(0, 27) + '\u2026' : x) + '"'; }
    function det(text) { return el('div', 'det', text); }

    function run(q) {
        q = String(q || '').trim(); if (q.length < 3 || busy) return;
        busy = true; input.value = ''; if (intro.parentNode) intro.remove();
        root.classList.add('is-thinking');
        body.appendChild(el('div', 'vfa-q', q));
        var runBox = el('div', 'vfa-run'), list = el('ol', 'vfa-steps');
        runBox.appendChild(list); body.appendChild(runBox); body.scrollTop = body.scrollHeight;
        var s1 = step(list, 'read_question', q1(q)), s2 = step(list, 'search_evidence', 'k: 5'), s3 = step(list, 'weigh_proof', 'top: 4'), s4 = step(list, 'decide', 'abstain_if: weak'), s5 = step(list, ENDPOINT ? 'claude.write' : 'quote_sources', 'cite: true');
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
                s1.done(det(words.length + ' key terms: ' + words.slice(0, 6).join(', ') + (concepts.length ? ' · skills: ' + concepts.join(', ') : '')), words.length + ' terms' + (concepts.length ? ' · ' + concepts.length + ' skill' + (concepts.length > 1 ? 's' : '') : ''));
                s2.on(); return wait(STEP_MS);
            });
        }).then(function () {
            var bars = el('div', 'vfa-bars'), top = sr.results.slice(0, 4), max = top.length ? top[0].score : 1;
            var picked = r.sources.map(function (s) { return s.id; });
            s2.done(det('BM25 over ' + eng.evidence.length + ' items · ' + sr.results.length + ' matched, ranked by relevance × proof'), sr.results.length + ' / ' + eng.evidence.length + ' hits');
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
            s3.done(det(Object.keys(lv).length ? 'Proof levels: ' + Object.keys(lv).join(' · ') + '. In-production and published work rank first.' : 'Nothing to weigh.'), Object.keys(lv).length + ' proof level' + (Object.keys(lv).length === 1 ? '' : 's'));
            s4.on(); return wait(STEP_MS);
        }).then(function () {
            var best = sr.results.slice().sort(function (a, b) { return (b.raw || 0) - (a.raw || 0); })[0];
            var cov = best ? Math.round(100 * Math.min(1, best.coverage)) : 0;
            var d = det(best ? 'Best match covers ' + cov + '% of the question' + (best.tagged ? ' and carries the skill asked about' : best.named ? ' and names it directly' : '') + '.' : 'No relevant evidence found.');
            d.appendChild(document.createElement('br'));
            d.appendChild(el('span', 'vfa-verdict' + (r.abstain ? ' no' : ''), r.abstain ? 'Not enough evidence → say so' : 'Enough evidence → answer'));
            s4.done(d, r.abstain ? 'abstain' : 'answer'); if (r.abstain) s4.li.classList.add('no'); s5.on();
            if (!ENDPOINT || r.abstain) return wait(STEP_MS).then(function () { return { mode: 'retrieval', r: r }; });
            return remote(q).then(function (j) { return j.mode === 'claude' ? { mode: 'claude', r: j } : { mode: 'retrieval', r: r }; },
                function () { return { mode: 'retrieval', r: r, note: 'Claude unavailable, answered from quotes.' }; });
        }).then(function (out) {
            var res = out.r, ms = Math.round(performance.now() - t0);
            s5.li.classList.add('final'); s5.done(det(res.abstain ? 'No answer written: nothing here backs one.' : (out.mode === 'claude' ? 'Claude wrote from ' : 'Quoted ') + res.sources.length + ' source' + (res.sources.length === 1 ? '' : 's') + '.'), res.abstain ? 'skipped' : res.sources.length + ' cited');
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
                : '$0.00 · ' + r.ms + ' ms' + (out.note ? ' · ' + out.note : '')));
            runBox.appendChild(ans);
            // land on the answer, not the bottom of it
            body.scrollTop = Math.max(0, ans.offsetTop - body.offsetTop - 8);
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
