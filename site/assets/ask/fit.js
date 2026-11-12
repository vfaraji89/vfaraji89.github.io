/* Fit check: the instrument. Scores a pasted job description live, in the
   browser, with the same engine and evidence file the evals run on. If the
   page names a Claude endpoint, a written brief can be added on request. */
(function () {
    'use strict';
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    var NS = 'http://www.w3.org/2000/svg';
    function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function track(name, p) { try { if (window.gtag) gtag('event', name, p || {}); } catch (e) {} }
    function link(href, cls) { var a = el('a', cls); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var meta = $('meta[name="vf-ask-endpoint"]');
    var ENDPOINT = meta ? (meta.getAttribute('content') || '').trim().replace(/\/$/, '') : '';
    var eng = null;
    var ready = fetch('data/evidence.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) { eng = VFEngine.create(d); return eng; });

    var input = $('#fit-input'), tray = $('#fx-tray'), dial = $('#fx-dial'), center = $('#fx-center'), out = $('#fit-out'), dock = $('#fx-dock');
    var pills = $$('.fx-pill');
    var ORDER = { strong: 0, partial: 1, gap: 2 };
    var LABEL_EN = { strong: 'Strong', partial: 'Partial', gap: 'Gap' };
    // Every word this script writes goes through T(): the active language (i18n/<lang>/fit.json), else English.
    function T(key, en, vars) { if (window.vfT) return vfT('fit.' + key, en, vars); return vars ? en.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : en; }
    var LABEL = { get strong() { return T('st_strong', LABEL_EN.strong); }, get partial() { return T('st_partial', LABEL_EN.partial); }, get gap() { return T('st_gap', LABEL_EN.gap); } };
    var SAMPLES = {
        agents: 'Applied AI Engineer\n- Build and ship LLM agents with tool calling (MCP) to production\n- Design evals and tracing for agent systems\n- Strong Python; TypeScript a plus\n- Work with business stakeholders end to end\n- Experience with Kubernetes',
        architect: 'AI Solutions Architect\n- Lead customer-facing discovery and turn workflows into AI systems\n- Design RAG and multi-agent architectures on Azure or Google Cloud\n- Set governance, security and guardrails\n- Enable teams through workshops\n- Measure ROI and token cost',
        ml: 'Machine Learning Engineer\n- Fine-tune LLMs with LoRA and RLHF\n- PyTorch at scale on GPU clusters\n- Computer vision experience\n- Publications at top venues'
    };
    var state = { b: null, filter: 'all', pinned: null, seen: {} };

    // ---- the dial -------------------------------------------------------------
    var CX = 130, R = 104;
    function pt(deg, r) { var a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CX + r * Math.sin(a)]; }
    function arc(a0, a1) {
        var p0 = pt(a0, R), p1 = pt(a1, R);
        return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
    }
    function idleDial() {
        dial.textContent = '';
        dial.appendChild(sv('circle', { cx: CX, cy: CX, r: R, class: 'fx-track' }));
        var g = sv('g', { class: 'fx-orbit' });
        var a = pt(0, R), b = pt(140, R);
        g.appendChild(sv('circle', { cx: a[0], cy: a[1], r: 9 }));
        g.appendChild(sv('circle', { cx: b[0], cy: b[1], r: 6 }));
        dial.appendChild(g);
        dial.setAttribute('aria-label', T('dial_idle', 'Fit dial: waiting for a job description'));
        setCenter(null);
        $('.fx-score b', center).textContent = '0'; center.classList.add('is-idle');
        $('.fx-cap', center).textContent = T('cap_idle', 'paste a role');
    }
    function drawDial(b) {
        dial.textContent = '';
        dial.appendChild(sv('circle', { cx: CX, cy: CX, r: R, class: 'fx-track' }));
        var list = b.concepts.slice().sort(function (x, y) { return ORDER[x.status] - ORDER[y.status]; });
        var n = list.length, step = 360 / n, gap = n > 1 ? Math.min(5, step * 0.22) : 0;
        list.forEach(function (c, i) {
            var a0 = i * step + gap / 2, a1 = (i + 1) * step - gap / 2;
            if (n === 1) { a0 = 0.5; a1 = 359.5; }
            var p = sv('path', { d: arc(a0, a1), class: 'seg s-' + c.status, pathLength: 100, tabindex: 0, role: 'button', 'aria-label': c.label + ': ' + LABEL[c.status] });
            p.style.animationDelay = (reduce ? 0 : i * 45) + 'ms';
            p.addEventListener('mouseenter', function () { if (!state.pinned) focus(c); });
            p.addEventListener('mouseleave', function () { if (!state.pinned) focus(null); });
            p.addEventListener('focus', function () { focus(c); });
            p.addEventListener('blur', function () { if (!state.pinned) focus(null); });
            p.addEventListener('click', function () { state.pinned = state.pinned === c.key ? null : c.key; focus(state.pinned ? c : null); });
            p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.dispatchEvent(new Event('click')); } });
            p.dataset.key = c.key;
            dial.appendChild(p);
        });
        dial.setAttribute('aria-label', T('dial_aria', 'Fit dial: {s} strong, {p} partial, {g} gaps', { s: b.count.strong, p: b.count.partial, g: b.count.gap }));
    }
    function setCenter(c) {
        center.classList.toggle('is-focus', !!c);
        if (!c) return;
        var f = $('.fx-focus', center); f.textContent = '';
        f.appendChild(el('b', null, c.label));
        f.appendChild(el('em', 's-' + c.status, LABEL[c.status]));
        f.appendChild(el('small', null, c.evidence[0] ? c.evidence[0].title : T('no_ev_site', 'No evidence on this site')));
    }
    function focus(c) {
        setCenter(c);
        dial.classList.toggle('has-focus', !!c);
        $$('.seg', dial).forEach(function (s) { s.classList.toggle('is-focus', !!c && s.dataset.key === c.key); });
        $$('.fx-rq', out).forEach(function (r) {
            var has = !!c && (r.dataset.keys || '').split(' ').indexOf(c.key) !== -1;
            r.classList.toggle('is-hot', has);
        });
        $$('.fx-mx tbody tr', out).forEach(function (r) { r.classList.toggle('is-hot', !!c && r.dataset.key === c.key); });
    }
    var counter = null;
    function countTo(to) {
        var b = $('.fx-score b', center), from = parseInt(b.textContent, 10) || 0;
        $('.fx-cap', center).textContent = T('cap_fit', 'fit'); center.classList.remove('is-idle');
        if (counter) cancelAnimationFrame(counter);
        if (reduce) { b.textContent = to; return; }
        var t0 = performance.now();
        (function tick(t) {
            var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
            b.textContent = Math.round(from + (to - from) * e);
            if (k < 1) counter = requestAnimationFrame(tick);
        })(t0);
    }

    // ---- the live tray ----------------------------------------------------------
    function drawTray(b) {
        var keys = {};
        tray.textContent = '';
        (b ? b.concepts : []).forEach(function (c) {
            keys[c.key] = 1;
            var chip = el('span', 'fx-chip s-' + c.status + (state.seen[c.key] ? '' : ' is-new'));
            chip.appendChild(el('i')); chip.appendChild(document.createTextNode(c.label));
            tray.appendChild(chip);
        });
        state.seen = keys;
    }

    // ---- legend pills (filters) -------------------------------------------------
    function drawPills(b) {
        pills.forEach(function (p) {
            var k = p.dataset.f;
            $('b', p).textContent = b ? b.count[k] : 0;
            p.disabled = !b || !b.count[k];
            p.setAttribute('aria-pressed', state.filter === k ? 'true' : 'false');
        });
    }
    pills.forEach(function (p) {
        p.addEventListener('click', function () {
            state.filter = state.filter === p.dataset.f ? 'all' : p.dataset.f;
            drawPills(state.b); applyFilter();
            var sec = $('#fx-reqs'); if (sec && state.filter !== 'all') sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
    });
    function applyFilter() {
        $$('.fx-rq', out).forEach(function (r) { r.hidden = state.filter !== 'all' && !r.classList.contains('s-' + state.filter); });
    }

    // ---- results ----------------------------------------------------------------
    function section(title, sub, id) {
        var s = el('section', 'fx-sec'); if (id) s.id = id;
        var h = el('h2', 'fx-h', title); if (sub) h.appendChild(el('span', null, sub));
        s.appendChild(h); return s;
    }
    function drawOut(b, ai) {
        out.textContent = '';
        if (b.score == null) { out.appendChild(el('p', 'fx-none', T('none', 'No skills I can check in that text yet. Paste the requirements part.'))); return; }
        if (ai && ai.headline) out.appendChild(el('p', 'fx-says', ai.headline));

        // coverage: evidence cards + matrix
        if (b.topEvidence.length) {
            var cov = section(T('sec_coverage', 'Coverage'), T('sec_coverage_sub', '{p} proofs × {a} asks', { p: b.topEvidence.length, a: b.concepts.length }));
            var evs = el('div', 'fx-evs');
            var max = Math.max.apply(null, b.topEvidence.map(function (e) { return e.covers.length; })) || 1;
            b.topEvidence.forEach(function (e, i) {
                var a = link(e.url, 'fx-ev'); a.style.animationDelay = (i * 70) + 'ms';
                a.dataset.col = i;
                var top = el('span'); top.style.display = 'flex'; top.style.justifyContent = 'space-between'; top.style.alignItems = 'center';
                top.appendChild(el('span', 'n', String(i + 1))); top.appendChild(el('span', 'lv', e.levelLabel));
                a.appendChild(top); a.appendChild(el('b', null, e.title));
                var bar = el('span', 'bar'), fill = el('span'); fill.style.width = (100 * e.covers.length / max) + '%'; bar.appendChild(fill); a.appendChild(bar);
                a.setAttribute('aria-label', T('ev_aria', '{t}, covers {n} of the asks', { t: e.title, n: e.covers.length }));
                a.addEventListener('mouseenter', function () { hotCol(i, true); });
                a.addEventListener('mouseleave', function () { hotCol(i, false); });
                evs.appendChild(a);
            });
            cov.appendChild(evs);
            var wrap = el('div', 'fx-mx-wrap'), t = el('table', 'fx-mx');
            var thead = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, ''));
            b.topEvidence.forEach(function (e, i) { var th = el('th', null, String(i + 1)); th.title = e.title; th.scope = 'col'; hr.appendChild(th); });
            thead.appendChild(hr); t.appendChild(thead);
            var tb = el('tbody');
            b.concepts.slice().sort(function (x, y) { return ORDER[x.status] - ORDER[y.status]; }).forEach(function (c, ri) {
                var tr = el('tr'); tr.dataset.key = c.key;
                var th = el('th'); th.scope = 'row'; th.appendChild(el('i', 's-' + c.status)); th.appendChild(document.createTextNode(c.label)); tr.appendChild(th);
                b.topEvidence.forEach(function (e, ci) {
                    var on = e.covers.indexOf(c.label) !== -1;
                    var td = el('td', on ? 'on' : 'off'); td.dataset.col = ci;
                    td.style.setProperty('--d', (ri * 35 + ci * 50) + 'ms');
                    td.setAttribute('aria-label', on ? T('cell_on', '{t} covers {c}', { t: e.title, c: c.label }) : T('cell_off', 'not covered'));
                    tr.appendChild(td);
                });
                tr.addEventListener('mouseenter', function () { if (!state.pinned) focus(c); });
                tr.addEventListener('mouseleave', function () { if (!state.pinned) focus(null); });
                tb.appendChild(tr);
            });
            t.appendChild(tb); wrap.appendChild(t); cov.appendChild(wrap);
            out.appendChild(cov);
        }

        // requirements as rods
        var scored = b.requirements.filter(function (r) { return r.status !== 'unscored'; });
        var rs = section(T('sec_reqs', 'Requirements'), T('sec_reqs_sub', '{n} scored', { n: scored.length }), 'fx-reqs');
        var ul = el('ul', 'fx-rqs');
        var DOTS = { strong: 3, partial: 2, gap: 0 };
        scored.forEach(function (r, i) {
            var li = el('li', 'fx-rq s-' + r.status); li.style.animationDelay = (Math.min(i, 10) * 45) + 'ms';
            li.dataset.keys = r.concepts.map(function (c) { return c.key; }).join(' ');
            var btn = el('button'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false');
            var rod = el('span', 'rod'); rod.setAttribute('aria-label', LABEL[r.status]);
            for (var k = 0; k < 3; k++) { var bead = el('i', k < DOTS[r.status] ? 'on' : ''); bead.style.animationDelay = (Math.min(i, 10) * 45 + 120 + k * 70) + 'ms'; rod.appendChild(bead); }
            btn.appendChild(rod); btn.appendChild(el('p', null, r.text)); btn.appendChild(el('span', 'chev', '⌄'));
            var more = el('div', 'fx-rq-more'), inner = el('div'), cs = el('div', 'fx-cs');
            r.concepts.forEach(function (c) {
                var e = c.evidence[0];
                var chip = e ? link(e.url, 'fx-c s-' + c.status) : el('span', 'fx-c s-' + c.status);
                chip.appendChild(el('i')); chip.appendChild(el('b', null, c.label)); chip.appendChild(el('span', null, e ? e.title : T('no_ev_here', 'no evidence here')));
                cs.appendChild(chip);
            });
            inner.appendChild(cs); more.appendChild(inner);
            btn.addEventListener('click', function () { var o = li.classList.toggle('open'); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); });
            li.appendChild(btn); li.appendChild(more); ul.appendChild(li);
        });
        rs.appendChild(ul);
        var unscored = b.requirements.length - scored.length;
        if (unscored) rs.appendChild(el('p', 'fx-more-n', unscored === 1 ? T('unscored_one', '+ 1 line with no skill to check') : T('unscored_many', '+ {n} lines with no skill to check', { n: unscored })));
        out.appendChild(rs);

        // gaps
        if (b.gaps.length) {
            var gs = section(T('sec_gaps', 'Gaps'), T('sec_gaps_sub', 'no evidence on this site'));
            var gw = el('div', 'fx-gaps');
            b.gaps.forEach(function (g, i) { var s = el('span', 'fx-gap', g); s.style.animationDelay = (i * 60) + 'ms'; gw.appendChild(s); });
            gs.appendChild(gw); out.appendChild(gs);
        }

        var rc = el('p', 'fx-receipt');
        (ai && ai.receipt ? [ai.receipt.model, '$' + (ai.receipt.cost_usd || 0).toFixed(4), (ai.receipt.ms / 1000).toFixed(1) + ' s']
            : [T('rc_rules', 'Rules in your browser'), T('rc_calls', '0 model calls'), '$0.00', b.ms + ' ms', T('rc_private', 'nothing you paste leaves this page')]).forEach(function (x) { rc.appendChild(el('span', null, x)); });
        out.appendChild(rc);
        applyFilter();
    }
    function hotCol(i, on) {
        $$('.fx-mx td[data-col="' + i + '"]', out).forEach(function (td) { td.classList.toggle('is-hot', on); });
    }

    // ---- the dock -----------------------------------------------------------------
    var md = '';
    function drawDock(b) {
        if (!b || b.score == null) { dock.classList.remove('show'); return; }
        md = eng.briefMarkdown(b);
        dock.style.setProperty('--p', b.score);
        $('.mini b', dock).textContent = b.score;
        var dl = $('#fx-dl', dock);
        if (dl.dataset.url) URL.revokeObjectURL(dl.dataset.url);
        dl.dataset.url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
        dl.href = dl.dataset.url;
        dock.classList.add('show');
    }
    $('#fx-copy').addEventListener('click', function () {
        var btn = this, lbl = $('.lbl', btn);
        (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(function () { lbl.textContent = T('copied', 'Copied'); }, function () { lbl.textContent = T('copy_failed', 'Copy failed'); });
        setTimeout(function () { lbl.textContent = T('copy', 'Copy'); }, 1600); track('fit_brief_copy');
    });

    // ---- run --------------------------------------------------------------------------
    function run(jd) {
        if (!eng) return;
        jd = (jd || '').trim();
        if (jd.length < 20) { state.b = null; idleDial(); drawTray(null); drawPills(null); out.textContent = ''; drawDock(null); return; }
        var b = eng.fit(jd);
        state.b = b; state.pinned = null;
        drawTray(b); drawPills(b);
        if (b.score == null) { idleDial(); $('.fx-cap', center).textContent = T('cap_none', 'no skills yet'); }
        else { drawDial(b); countTo(b.score); }
        drawOut(b, null);
        drawDock(b);
        return b;
    }
    var timer = null, lastTracked = '';
    input.addEventListener('input', function () {
        $$('.fx-sample').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        clearTimeout(timer);
        timer = setTimeout(function () {
            var b = run(input.value);
            if (b && b.score != null && input.value.length > 60 && lastTracked !== String(b.score)) { lastTracked = String(b.score); track('fit_brief', { mode: 'live', score: b.score, asks: b.concepts.length, gaps: b.count.gap }); }
        }, 280);
    });

    // samples: typed in quickly, then scored
    $$('.fx-sample').forEach(function (s) {
        s.addEventListener('click', function () {
            var text = SAMPLES[s.dataset.sample];
            $$('.fx-sample').forEach(function (o) { o.setAttribute('aria-pressed', o === s ? 'true' : 'false'); });
            clearTimeout(timer);
            if (reduce) { input.value = text; run(text); return; }
            var i = 0, chunk = Math.ceil(text.length / 18);
            (function type() {
                i = Math.min(text.length, i + chunk);
                input.value = text.slice(0, i);
                if (i % (chunk * 4) < chunk) run(input.value);
                if (i < text.length) setTimeout(type, 28); else { var sb = run(text); track('fit_brief', { mode: 'sample', sample: s.dataset.sample, score: sb && sb.score != null ? sb.score : -1 }); }
            })();
        });
    });

    // optional: a written brief from Claude, only when the page names an endpoint
    if (ENDPOINT) {
        var write = $('#fx-write'); if (write) {
            write.hidden = false;
            write.addEventListener('click', function () {
                var jd = input.value.trim(); if (!state.b || state.b.score == null) return;
                write.disabled = true;
                fetch(ENDPOINT + '/fit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jd: jd }) })
                    .then(function (r) { return r.json(); })
                    .then(function (j) { if (j && j.brief) { var ai = j.brief; ai.receipt = j.receipt; drawOut(state.b, ai); } })
                    .catch(function () {}).then(function () { write.disabled = false; });
            });
        }
    }

    // a language change re-renders everything this script wrote
    document.addEventListener('vf:lang', function () { if (eng && input.value.trim()) run(input.value); else idleDial(); });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.pinned) { state.pinned = null; focus(null); } });
    ready.then(function () { idleDial(); if (input.value.trim()) run(input.value); });
    idleDial();
})();
