/* Ask my work + Fit brief: the page.
   Retrieval runs in the browser on every question. If the page names a Claude
   endpoint (<meta name="vf-ask-endpoint">), answers are written by Claude from
   the same evidence; if that endpoint is missing, slow, over budget or down,
   the page answers from retrieval and says so. Every answer shows a receipt. */
(function () {
    'use strict';
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function track(name, p) { try { if (window.gtag) gtag('event', name, p || {}); } catch (e) {} }
    var meta = $('meta[name="vf-ask-endpoint"]');
    var ENDPOINT = meta ? (meta.getAttribute('content') || '').trim().replace(/\/$/, '') : '';
    var eng = null, ready;

    ready = fetch('data/evidence.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
        eng = VFEngine.create(d);
        var n = $('#ev-count'); if (n) n.textContent = d.evidence.length;
        return eng;
    });

    function remote(path, body) {
        if (!ENDPOINT) return Promise.reject(new Error('no endpoint'));
        var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
        return fetch(ENDPOINT + path, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
        }).then(function (r) {
            clearTimeout(timer);
            return r.json().then(function (j) { if (!r.ok || j.fallback || j.error) throw new Error(j.error || ('http ' + r.status)); return j; });
        }, function (e) { clearTimeout(timer); throw e; });
    }

    function money(x) { return x == null ? 'n/a' : x < 0.01 ? '$' + x.toFixed(4) : '$' + x.toFixed(2); }
    function receipt(parts, note) {
        var p = el('p', 'receipt');
        parts.forEach(function (t, i) { if (i) p.appendChild(el('i', null, '·')); p.appendChild(el('span', null, t)); });
        if (note) p.appendChild(el('em', null, note));
        return p;
    }
    function levelBadge(label, level) { return el('span', 'lvl lvl-' + level, label); }
    function link(href, text, cls) {
        var a = el('a', cls, text); a.href = href;
        if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        return a;
    }

    // ---- tabs ----------------------------------------------------------------
    var tabs = $$('[role="tab"]');
    function show(id, focus) {
        tabs.forEach(function (t) {
            var on = t.getAttribute('aria-controls') === id;
            t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
            $('#' + t.getAttribute('aria-controls')).hidden = !on;
            if (on && focus) t.focus();
        });
    }
    tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); history.replaceState(null, '', t.getAttribute('aria-controls') === 'panel-fit' ? '#fit' : location.pathname + location.search); });
        t.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
            show(n.getAttribute('aria-controls'), true);
        });
    });

    // ---- Ask -----------------------------------------------------------------
    var askForm = $('#ask-form'), askIn = $('#ask-input'), askOut = $('#ask-out');

    function renderAsk(r, how, note) {
        askOut.textContent = '';
        var card = el('div', 'answer' + (r.abstain ? ' is-abstain' : ''));
        card.appendChild(el('p', 'answer-q', r.question));
        if (r.abstain) {
            card.appendChild(el('p', 'answer-none', 'The evidence on this site doesn’t cover that.'));
            var why = el('p', 'answer-why');
            why.appendChild(document.createTextNode('That’s on purpose: when nothing here backs an answer, it says so instead of guessing. '));
            why.appendChild(link('https://calendar.app.google/KWQg6gBjXetC4ofp9', 'Ask me directly →'));
            card.appendChild(why);
        } else {
            card.appendChild(el('p', 'answer-k', how === 'claude' ? 'Written by Claude from the sources below' : 'Quoted from the evidence, no model'));
            var body = el('div', 'answer-body' + (how === 'claude' ? '' : ' is-quoted'));
            r.answer.forEach(function (a) {
                var span = el('span', 'answer-s', a.text);
                (a.cites || (a.cite ? [a.cite] : [])).forEach(function (n) {
                    var s = r.sources[n - 1]; if (!s) return;
                    var c = link('#src-' + n, String(n), 'cite-n'); c.setAttribute('aria-label', 'Source ' + n + ': ' + s.title);
                    span.appendChild(c);
                });
                body.appendChild(span); body.appendChild(document.createTextNode(' '));
            });
            card.appendChild(body);
            var ol = el('ol', 'sources');
            r.sources.forEach(function (s) {
                var li = el('li'); li.id = 'src-' + s.n;
                li.appendChild(el('span', 'src-n', String(s.n)));
                var t = el('span', 'src-t'); t.appendChild(link(s.url, s.title));
                li.appendChild(t);
                li.appendChild(levelBadge(s.levelLabel || (eng && eng.levels[s.level] || {}).label || s.level, s.level));
                ol.appendChild(li);
            });
            card.appendChild(ol);
        }
        if (how === 'claude' && r.receipt) {
            var rc = r.receipt;
            card.appendChild(receipt([rc.model + (rc.fallback_model ? ' (fallback)' : ''), rc.input_tokens.toLocaleString('en') + ' in / ' + rc.output_tokens.toLocaleString('en') + ' out', money(rc.cost_usd), (rc.ms / 1000).toFixed(1) + ' s', r.sources.length + ' cited'], note));
        } else {
            card.appendChild(receipt(['$0.00', r.ms + ' ms', r.sources.length + ' sources'], note));
        }
        askOut.appendChild(card);
    }

    function runAsk(q) {
        q = (q || '').trim(); if (q.length < 3) { askIn.focus(); return; }
        askIn.value = q;
        try { history.replaceState(null, '', '?q=' + encodeURIComponent(q)); } catch (e) {}
        askOut.textContent = ''; askOut.appendChild(el('p', 'thinking', ENDPOINT ? 'Reading the evidence and writing an answer…' : 'Reading the evidence…'));
        askForm.classList.add('is-busy');
        ready.then(function () {
            var local = eng.ask(q);
            if (!ENDPOINT || local.abstain) { renderAsk(local, 'retrieval', ENDPOINT && local.abstain ? 'Nothing relevant was found, so no model was called.' : ''); return; }
            return remote('/ask', { q: q }).then(function (j) {
                j.question = q;
                if (j.mode !== 'claude') { renderAsk(local, 'retrieval'); return; }
                renderAsk(j, 'claude');
            }, function () { renderAsk(local, 'retrieval', 'Claude is unavailable right now, so this is the retrieval answer.'); });
        }).catch(function () {
            askOut.textContent = ''; askOut.appendChild(el('p', 'answer-none', 'The evidence file did not load. Try again in a moment.'));
        }).then(function () { askForm.classList.remove('is-busy'); track('ask_my_work', { mode: ENDPOINT ? 'claude' : 'retrieval' }); });
    }
    if (askForm) {
        askForm.addEventListener('submit', function (e) { e.preventDefault(); runAsk(askIn.value); });
        $$('.ask-chip').forEach(function (b) { b.addEventListener('click', function () { runAsk(b.textContent); }); });
    }

    // ---- Fit -----------------------------------------------------------------
    var fitForm = $('#fit-form'), fitIn = $('#fit-input'), fitOut = $('#fit-out');
    var SAMPLES = {
        agents: 'Applied AI Engineer\n- Build and ship LLM agents with tool calling (MCP) to production\n- Design evals and tracing for agent systems\n- Strong Python; TypeScript a plus\n- Work with business stakeholders end to end\n- Experience with Kubernetes',
        architect: 'AI Solutions Architect\n- Lead customer-facing discovery and turn workflows into AI systems\n- Design RAG and multi-agent architectures on Azure or Google Cloud\n- Set governance, security and guardrails\n- Enable teams through workshops\n- Measure ROI and token cost',
        ml: 'Machine Learning Engineer\n- Fine-tune LLMs with LoRA and RLHF\n- PyTorch at scale on GPU clusters\n- Computer vision experience\n- Publications at top venues'
    };
    var DOTS = { strong: 3, partial: 2, gap: 0 };

    function beads(status) {
        var s = el('span', 'beads beads-' + status); s.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 3; i++) s.appendChild(el('i', i < DOTS[status] ? 'on' : ''));
        return s;
    }
    var STATUS = { strong: 'Strong', partial: 'Partial', gap: 'Gap', unscored: 'Not a skill I can check' };

    function renderFit(b, ai, note) {
        fitOut.textContent = '';
        var head = el('div', 'fit-head');
        var sc = el('div', 'fit-score');
        sc.appendChild(el('b', null, b.score == null ? '–' : String(b.score)));
        sc.appendChild(el('span', null, '/100'));
        if (b.cap) sc.title = 'Capped at ' + b.cap + ': no profile is a perfect fit for a role.';
        head.appendChild(sc);
        var sum = el('div', 'fit-sum');
        sum.appendChild(el('p', 'fit-headline', ai && ai.headline ? ai.headline :
            b.score == null ? 'I couldn’t find skills I can check in that text.' :
            b.count.strong + ' of ' + b.concepts.length + ' things this role asks for have strong proof' + (b.count.gap ? ', and ' + b.count.gap + (b.count.gap === 1 ? ' is a gap.' : ' are gaps.') : '.')));
        var counts = el('p', 'fit-counts');
        ['strong', 'partial', 'gap'].forEach(function (k) { var c = el('span', 'fc fc-' + k); c.appendChild(beads(k)); c.appendChild(document.createTextNode(b.count[k] + ' ' + STATUS[k].toLowerCase())); counts.appendChild(c); });
        sum.appendChild(counts);
        head.appendChild(sum);
        fitOut.appendChild(head);

        if (b.topEvidence.length) {
            fitOut.appendChild(el('h3', 'fit-h', 'Strongest evidence for this role'));
            var grid = el('div', 'fit-ev');
            b.topEvidence.forEach(function (e) {
                var a = link(e.url, '', 'ev-card');
                a.appendChild(el('span', 'ev-lvl', e.levelLabel));
                a.appendChild(el('b', null, e.title));
                if (e.covers.length) a.appendChild(el('span', 'ev-covers', e.covers.join(' · ')));
                grid.appendChild(a);
            });
            fitOut.appendChild(grid);
        }

        if (ai && ai.strengths && ai.strengths.length) {
            fitOut.appendChild(el('h3', 'fit-h', 'In plain words'));
            var ul = el('ul', 'fit-ai');
            ai.strengths.forEach(function (s) {
                var li = el('li', null, s.claim + ' ');
                s.evidence_ids.forEach(function (id) { var e = eng.byId[id]; if (e) li.appendChild(link(e.url, e.title, 'ai-ev')); });
                ul.appendChild(li);
            });
            fitOut.appendChild(ul);
        }

        fitOut.appendChild(el('h3', 'fit-h', 'Requirement by requirement'));
        var tbl = el('ul', 'fit-reqs');
        b.requirements.forEach(function (r) {
            var li = el('li', 'req req-' + r.status);
            if (r.status !== 'unscored') li.appendChild(beads(r.status)); else li.appendChild(el('span', 'beads beads-none'));
            var main = el('div', 'req-main');
            main.appendChild(el('p', 'req-t', r.text));
            if (r.concepts.length) {
                var cs = el('p', 'req-c');
                r.concepts.forEach(function (c) {
                    var chip = el('span', 'cchip cchip-' + c.status);
                    chip.appendChild(el('b', null, c.label));
                    if (c.evidence[0]) chip.appendChild(link(c.evidence[0].url, c.evidence[0].title));
                    else chip.appendChild(el('em', null, 'no evidence on this site'));
                    cs.appendChild(chip);
                });
                main.appendChild(cs);
            }
            li.appendChild(main);
            li.appendChild(el('span', 'req-s', STATUS[r.status]));
            tbl.appendChild(li);
        });
        fitOut.appendChild(tbl);

        var gaps = (ai && ai.gaps && ai.gaps.length) ? ai.gaps.map(function (g) { return g.requirement + ': ' + g.note; }) : b.gaps.map(function (g) { return g + ': no evidence on this site.'; });
        if (gaps.length) {
            var box = el('div', 'fit-gaps');
            box.appendChild(el('h3', 'fit-h', 'Honest gaps'));
            var gl = el('ul'); gaps.forEach(function (g) { gl.appendChild(el('li', null, g)); }); box.appendChild(gl);
            box.appendChild(el('p', 'fit-gaps-note', 'Listed on purpose. A brief that hides gaps is not worth reading.'));
            fitOut.appendChild(box);
        }
        if (ai && ai.interview_questions && ai.interview_questions.length) {
            fitOut.appendChild(el('h3', 'fit-h', 'Questions worth asking me'));
            var ql = el('ul', 'fit-q'); ai.interview_questions.forEach(function (q) { ql.appendChild(el('li', null, q)); }); fitOut.appendChild(ql);
        }

        var md = eng.briefMarkdown(b);
        var acts = el('div', 'fit-acts');
        var copy = el('button', 'btn-ghost', 'Copy brief'); copy.type = 'button';
        copy.addEventListener('click', function () {
            (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(function () { copy.textContent = 'Copied'; }, function () { copy.textContent = 'Copy failed'; });
            setTimeout(function () { copy.textContent = 'Copy brief'; }, 1800); track('fit_brief_copy');
        });
        var dl = el('a', 'btn-ghost', 'Download .md'); dl.download = 'vahid-faraji-fit-brief.md';
        dl.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
        acts.appendChild(copy); acts.appendChild(dl);
        acts.appendChild(link('https://calendar.app.google/KWQg6gBjXetC4ofp9', 'Book a call →', 'btn-solid'));
        fitOut.appendChild(acts);

        if (ai && ai.receipt) {
            var rc = ai.receipt;
            fitOut.appendChild(receipt([rc.model, rc.input_tokens.toLocaleString('en') + ' in / ' + rc.output_tokens.toLocaleString('en') + ' out', money(rc.cost_usd), (rc.ms / 1000).toFixed(1) + ' s', (ai.grounding ? ai.grounding.invented_ids_dropped : 0) + ' invented sources dropped'], note));
        } else {
            fitOut.appendChild(receipt(['$0.00', b.ms + ' ms'], note));
        }
    }

    function runFit() {
        var jd = fitIn.value.trim();
        if (jd.length < 40) { fitOut.textContent = ''; fitOut.appendChild(el('p', 'answer-none', 'Paste a few lines of a job description first.')); fitIn.focus(); return; }
        fitOut.textContent = ''; fitOut.appendChild(el('p', 'thinking', 'Checking each requirement against the evidence…'));
        fitForm.classList.add('is-busy');
        ready.then(function () {
            var b = eng.fit(jd);
            if (!ENDPOINT || b.score == null) { renderFit(b); return; }
            return remote('/fit', { jd: jd }).then(function (j) {
                if (!j.brief) { renderFit(b, null, 'Claude could not write this one, so here is the rule-based brief.'); return; }
                var ai = j.brief; ai.receipt = j.receipt; ai.grounding = j.grounding;
                renderFit(b, ai);
            }, function () { renderFit(b, null, 'Claude is unavailable right now, so this is the rule-based brief.'); });
        }).then(function () { fitForm.classList.remove('is-busy'); fitOut.scrollIntoView({ behavior: 'smooth', block: 'start' }); track('fit_brief', { mode: ENDPOINT ? 'claude' : 'rules' }); });
    }
    if (fitForm) {
        fitForm.addEventListener('submit', function (e) { e.preventDefault(); runFit(); });
        $$('[data-sample]').forEach(function (b) { b.addEventListener('click', function () { fitIn.value = SAMPLES[b.getAttribute('data-sample')]; runFit(); }); });
    }

    // ---- deep links: ?q=… asks; #fit opens the brief -------------------------
    var q = null; try { q = new URLSearchParams(location.search).get('q'); } catch (e) {}
    if (location.hash === '#fit') show('panel-fit');
    // the navbar's "Check fit" button on this page: switch tabs without a reload
    window.addEventListener('hashchange', function () { if (location.hash === '#fit') { show('panel-fit'); fitIn.focus(); } });
    var navFit = $('.nav-fit');
    if (navFit) navFit.addEventListener('click', function (e) { e.preventDefault(); show('panel-fit'); history.replaceState(null, '', '#fit'); fitIn.focus(); });
    if (q && askForm) { show('panel-ask'); runAsk(q); }
    else if (q && window.vfAsk) window.vfAsk(q);
    var mode = $('#mode-line');
    if (mode) mode.textContent = askForm
        ? (ENDPOINT ? 'Written by Claude from the evidence, with sources.' : 'Quoted from the evidence, with sources.')
        : (ENDPOINT ? 'Scored against the evidence, with a written brief.' : 'Scored against the evidence.');
})();
