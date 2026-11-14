/* Fit check: the instrument. Scores a pasted job description live, in the
   browser, with the same engine and evidence file the evals run on. If the
   page names a Claude endpoint, a written brief can be added on request. */
(function () {
    'use strict';
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function track(name, p) { try { if (window.gtag) gtag('event', name, p || {}); } catch (e) {} }
    function link(href, cls) { var a = el('a', cls); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var meta = $('meta[name="vf-ask-endpoint"]');
    var ENDPOINT = meta ? (meta.getAttribute('content') || '').trim().replace(/\/$/, '') : '';
    var eng = null;
    var ready = fetch('data/evidence.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) { eng = VFEngine.create(d); return eng; });

    var loop = $('#fx-loop'), mc = $('#fx-mc');
    var input = $('#fit-input'), tray = $('#fx-tray'), dial = $('#fx-dial'), center = $('#fx-center'), out = $('#fit-out'), dock = $('#fx-dock');
    var pills = $$('.fx-pill');
    var ORDER = { strong: 0, partial: 1, gap: 2 };
    var LABEL_EN = { strong: 'Strong', partial: 'Partial', gap: 'Gap' };
    // Every word this script writes goes through T(): the active language (i18n/<lang>/fit.json), else English.
    var CAP = 90;   // the engine never scores past this; see engine.js scoreOf
    function T(key, en, vars) { if (window.vfT) return vfT('fit.' + key, en, vars); return vars ? en.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : en; }
    var LABEL = { get strong() { return T('st_strong', LABEL_EN.strong); }, get partial() { return T('st_partial', LABEL_EN.partial); }, get gap() { return T('st_gap', LABEL_EN.gap); } };
    var SAMPLES = {
        agents: 'Applied AI Engineer\n- Build and ship LLM agents with tool calling (MCP) to production\n- Design evals and tracing for agent systems\n- Strong Python; TypeScript a plus\n- Work with business stakeholders end to end\n- Experience with Kubernetes',
        architect: 'AI Solutions Architect\n- Lead customer-facing discovery and turn workflows into AI systems\n- Design RAG and multi-agent architectures on Azure or Google Cloud\n- Set governance, security and guardrails\n- Enable teams through workshops\n- Measure ROI and token cost',
        ml: 'Machine Learning Engineer\n- Fine-tune LLMs with LoRA and RLHF\n- PyTorch at scale on GPU clusters\n- Computer vision experience\n- Publications at top venues'
    };
    var state = { b: null, filter: 'all', pinned: null, seen: {} };

    // ---- the abacus: an agent loop over the job description -----------------------
    // One rod per skill the role asks for. The loop reads, matches, proves and scores; each
    // bead slides as far as the proof goes: all the way (strong), halfway (partial) or not at all.
    var STEPS = [['loop_read', 'Read'], ['loop_match', 'Match'], ['loop_prove', 'Prove'], ['loop_score', 'Score']];
    var TO = { strong: 1, partial: 0.5, gap: 0 };
    var loopTimers = [];
    function drawLoop(active) {
        loop.textContent = '';
        STEPS.forEach(function (st, i) {
            var li = el('li', i < active ? 'done' : i === active ? 'now' : '');
            li.appendChild(el('i')); li.appendChild(el('span', null, T(st[0], st[1])));
            loop.appendChild(li);
        });
    }
    function playLoop(total) {
        loopTimers.forEach(clearTimeout); loopTimers = [];
        if (reduce) { drawLoop(3); return; }
        [0, 160, 160 + total * 0.55, 160 + total].forEach(function (t, i) { loopTimers.push(setTimeout(function () { drawLoop(i); }, t)); });
    }
    function rodRow(c, i) {
        var row = el('div', 'fx-row' + (c ? ' s-' + c.status : ' is-idle'));
        row.style.setProperty('--i', i);
        row.style.setProperty('--to', c ? TO[c.status] : 0);
        if (c) row.appendChild(el('span', 'fx-row-l', c.label));
        var rod = el('span', 'fx-rod'); rod.appendChild(el('i', 'fx-bead')); row.appendChild(rod);
        return row;
    }
    function idleDial() {
        dial.textContent = ''; dial.classList.remove('on', 'has-focus'); dial.classList.add('is-idle');
        dial.appendChild(el('span', 'fx-beam'));
        for (var i = 0; i < 4; i++) dial.appendChild(rodRow(null, i));
        dial.setAttribute('aria-label', T('dial_idle', 'Fit abacus: waiting for a job description'));
        loopTimers.forEach(clearTimeout); drawLoop(-1); mc.hidden = true;
        setCenter(null);
        setScore(0, true); center.classList.add('is-idle');
        $('.fx-cap', center).textContent = T('cap_idle', 'paste a role');
    }
    function drawDial(b) {
        dial.textContent = ''; dial.classList.remove('on', 'is-idle', 'has-focus');
        dial.appendChild(el('span', 'fx-beam'));
        var list = b.concepts.slice().sort(function (x, y) { return ORDER[x.status] - ORDER[y.status]; });
        list.forEach(function (c, i) {
            var row = rodRow(c, i);
            row.tabIndex = 0; row.setAttribute('role', 'button'); row.dataset.key = c.key;
            row.setAttribute('aria-label', c.label + ': ' + LABEL[c.status]);
            row.addEventListener('mouseenter', function () { if (!state.pinned) focus(c); });
            row.addEventListener('mouseleave', function () { if (!state.pinned) focus(null); });
            row.addEventListener('focus', function () { focus(c); });
            row.addEventListener('blur', function () { if (!state.pinned) focus(null); });
            row.addEventListener('click', function () { state.pinned = state.pinned === c.key ? null : c.key; focus(state.pinned ? c : null); });
            row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); } });
            dial.appendChild(row);
        });
        requestAnimationFrame(function () { requestAnimationFrame(function () { dial.classList.add('on'); }); });
        playLoop(Math.min(list.length, 12) * 70 + 700);
        dial.setAttribute('aria-label', T('dial_aria', 'Fit abacus: {s} strong, {p} partial, {g} gaps', { s: b.count.strong, p: b.count.partial, g: b.count.gap }));
        drawMatch(b);
    }

    // ---- match centre: what the role asks, against what is proven -------------------
    function drawMatch(b) {
        mc.textContent = ''; mc.hidden = false; mc.classList.remove('on');
        var prod = b.concepts.filter(function (c) { return c.evidence[0] && c.evidence[0].level === 'production'; }).length;
        var rows = [[T('mc_skills', 'Strong proof'), b.concepts.length, b.count.strong]];
        if (b.must && b.must.asked) rows.push([T('mc_must', 'Must-haves'), b.must.asked, b.must.met]);
        if (b.years) rows.push([T('mc_years', 'Years'), b.years.asked, b.years.have]);
        rows.push([T('mc_prod', 'In production'), b.concepts.length, prod]);
        var head = el('div', 'fx-mc-head');
        head.appendChild(el('span', null, T('mc_asked', 'Asked')));
        head.appendChild(el('b', null, T('mc_title', 'Match centre')));
        head.appendChild(el('span', 'r', T('mc_proven', 'Proven')));
        mc.appendChild(head);
        rows.forEach(function (r, i) {
            var max = Math.max(r[1], r[2]) || 1;
            var row = el('div', 'fx-mc-row' + (r[2] >= r[1] ? ' win' : ''));
            row.style.setProperty('--i', i);
            row.appendChild(el('b', 'v', String(r[1])));
            var l = el('span', 'bar l'), lf = el('span'); lf.style.setProperty('--w', r[1] / max); l.appendChild(lf); row.appendChild(l);
            row.appendChild(el('span', 'k', r[0]));
            var rr = el('span', 'bar r'), rf = el('span'); rf.style.setProperty('--w', r[2] / max); rr.appendChild(rf); row.appendChild(rr);
            row.appendChild(el('b', 'v r', String(r[2])));
            mc.appendChild(row);
        });
        mc.appendChild(el('p', 'fx-mc-foot', T('mc_foot', '{u} unchecked lines · 0 model calls · {ms} ms', { u: b.unchecked || 0, ms: b.ms })));
        requestAnimationFrame(function () { requestAnimationFrame(function () { mc.classList.add('on'); }); });
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
        $$('.fx-row', dial).forEach(function (s) { s.classList.toggle('is-focus', !!c && s.dataset.key === c.key); });
        $$('.fx-rq', out).forEach(function (r) {
            var has = !!c && (r.dataset.keys || '').split(' ').indexOf(c.key) !== -1;
            r.classList.toggle('is-hot', has);
        });
        $$('.fx-mx tbody tr', out).forEach(function (r) { r.classList.toggle('is-hot', !!c && r.dataset.key === c.key); });
    }
    // the score rolls on reels like a broadcast counter; the last digit lands last
    function setScore(n, still) {
        var b = $('.fx-score b', center), str = String(n);
        if (b.dataset.v === str) return;
        var fresh = b.dataset.len !== String(str.length);
        if (fresh) {
            b.textContent = '';
            b.appendChild(el('span', 'fx-sr', str));
            for (var i = 0; i < str.length; i++) {
                var reel = el('span', 'fx-reel'), col = el('span', 'fx-col');
                reel.setAttribute('aria-hidden', 'true');
                for (var d = 0; d < 20; d++) col.appendChild(el('span', null, String(d % 10)));
                reel.appendChild(col); b.appendChild(reel);
            }
            b.dataset.len = str.length;
        }
        $('.fx-sr', b).textContent = str; b.dataset.v = str;
        $$('.fx-col', b).forEach(function (col, k) {
            var to = 'translateY(-' + (10 + Number(str[k])) + 'em)';
            if (still || reduce) { col.style.transition = 'none'; col.style.transform = to; return; }
            if (fresh) { col.style.transition = 'none'; col.style.transform = 'translateY(0)'; col.getBoundingClientRect(); }
            col.style.transition = 'transform ' + (900 + k * 140) + 'ms cubic-bezier(.16,1,.3,1) ' + (k * 90) + 'ms';
            col.style.transform = to;
        });
    }
    function countTo(to) {
        $('.fx-cap', center).textContent = T('cap_fit_max', 'fit · max {cap}', { cap: CAP }); center.classList.remove('is-idle');
        $('.fx-score', center).title = T('score_cap_tip', 'Capped at {cap}: no profile is a perfect fit for a role.', { cap: CAP });
        setScore(to);
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
