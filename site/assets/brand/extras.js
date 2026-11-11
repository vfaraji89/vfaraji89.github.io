/* Four small interactive pieces. Everything runs in the browser: no model
   calls, no network, nothing a visitor types leaves the page.
   1. Role fit: paste a job description, see what on this page matches it.
   2. Playable stack: tap a tool bead to see where it was used.
   3. Case stories: a three-beat story for each case study.
   4. Tailored links: ?hire=Company&role=agentic personalises the short version. */
(function () {
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function clean(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- the cases on this page, read from the page itself ------------------
    var cases = $$('#work .case-card').map(function (card, i) {
        if (!card.id) card.id = 'case-' + (i + 1);
        var rows = {};
        $$('.case-row', card).forEach(function (r) {
            var k = clean($('.case-row-label', r).textContent).toLowerCase();
            rows[k] = clean($('.case-row-val', r).textContent);
        });
        var stat = $('.case-stats span', card);
        return {
            el: card, id: card.id,
            title: clean($('.case-title', card).textContent),
            short: clean($('.case-title', card).textContent).split(':')[0],
            text: clean(card.textContent).toLowerCase(),
            rows: rows,
            stat: stat ? { n: clean(($('strong', stat) || stat).textContent), l: clean(stat.textContent.replace(($('strong', stat) || {}).textContent || '', '')) } : null
        };
    });
    function goCase(id) {
        var c = document.getElementById(id); if (!c) return;
        c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        c.classList.remove('is-pinged'); void c.offsetWidth; c.classList.add('is-pinged');
    }

    // ---- 2. playable stack ---------------------------------------------------
    (function stack() {
        var box = $('#skills .stack-abacus'); if (!box) return;
        var beads = $$('.sb', box); if (!beads.length) return;
        var line = el('p', 'sa-used'); line.setAttribute('aria-live', 'polite');
        line.textContent = 'Tap a tool to see where I used it.';
        box.appendChild(line);
        var ctx = null;
        function note(i) {
            var on = false; try { on = localStorage.getItem('vf-sound') === '1'; } catch (e) {}
            if (!on) return;
            try {
                ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
                var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24], t = ctx.currentTime;
                var o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = 392 * Math.pow(2, scale[i % scale.length] / 12);
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
                o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.55);
            } catch (e) {}
        }
        function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
        beads.forEach(function (b, i) {
            var name = clean(($('.sb-name', b) || b).textContent);
            b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-pressed', 'false');
            function pick() {
                var was = b.classList.contains('is-picked');
                beads.forEach(function (x) { x.classList.remove('is-picked'); x.setAttribute('aria-pressed', 'false'); });
                $$('#work .case-card').forEach(function (c) { c.classList.remove('uses-tool'); });
                line.textContent = '';
                if (was) { line.textContent = 'Tap a tool to see where I used it.'; return; }
                b.classList.add('is-picked'); b.setAttribute('aria-pressed', 'true'); note(i);
                var re = new RegExp('(^|[^a-z0-9])' + esc(name.toLowerCase()) + '([^a-z0-9]|$)');
                var hits = cases.filter(function (c) { return re.test(c.text); });
                line.appendChild(el('b', null, name));
                if (!hits.length) { line.appendChild(document.createTextNode(' · in the daily stack')); return; }
                line.appendChild(document.createTextNode(' · used in '));
                hits.forEach(function (c, k) {
                    c.el.classList.add('uses-tool');
                    var a = el('a', null, c.short); a.href = '#' + c.id;
                    a.addEventListener('click', function (e) { e.preventDefault(); goCase(c.id); });
                    if (k) line.appendChild(document.createTextNode(', '));
                    line.appendChild(a);
                });
            }
            b.addEventListener('click', pick);
            b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        });
    })();

    // ---- 1. role fit ---------------------------------------------------------
    (function fit() {
        var form = $('#fit-form'); if (!form) return;
        var input = $('#fit-input'), out = $('#fit-out');
        var CONCEPTS = [
            ['Agents', /\bagent(s|ic)?\b/], ['Multi-agent', /multi[- ]agent/], ['Tool calling / MCP', /\bmcp\b|tool (calling|use)|function calling|model context protocol/],
            ['RAG / retrieval', /\brag\b|retrieval/], ['Evals', /\bevals?\b|evaluation/], ['Tracing / observability', /tracing|observability|langfuse|monitoring/],
            ['Context / prompt engineering', /context engineering|prompt (engineering|design)|prompting/], ['LLM APIs', /\bllms?\b|claude|anthropic|openai|gpt|gemini|large language model/],
            ['LangChain / LangGraph', /langchain|langgraph/], ['Vector search / embeddings', /vector|embedding/], ['Fine-tuning', /fine[- ]?tun/],
            ['Python', /\bpython\b/], ['TypeScript', /typescript|\bts\b/], ['Next.js / React', /next\.?js|\breact\b/], ['SQL', /\bsql\b/], ['Text-to-SQL', /text[- ]to[- ]sql|nl2sql/],
            ['Data pipelines', /pipeline|\betl\b|data engineering/], ['Data products / analytics', /data product|analytics|dashboard|business analysis/],
            ['Cloud (Azure / GCP)', /azure|gcp|google cloud|vertex|bigquery/], ['AWS', /\baws\b|bedrock|sagemaker/], ['Kubernetes / Docker', /kubernetes|\bk8s\b|docker/],
            ['CI/CD / DevOps', /ci\/cd|devops|deployment pipeline/], ['PyTorch / TensorFlow', /pytorch|tensorflow/], ['Computer vision', /computer vision|image model/],
            ['Voice AI', /voice|speech|elevenlabs|vapi/], ['Cost / ROI', /\broi\b|cost|budget|token (cost|budget)/], ['Security / governance', /security|governance|compliance|privacy/],
            ['Stakeholders / customers', /stakeholder|customer|client-facing|forward deployed/], ['Training / mentoring', /mentor|training|workshop|teach/],
            ['Research / publications', /research|publication|paper|peer[- ]review/], ['Full stack', /full[- ]stack|end[- ]to[- ]end/], ['Open source', /open[- ]source/],
            ['Java', /\bjava\b/], ['Go', /\bgolang\b|\bgo\b(?! to)/], ['Rust', /\brust\b/]
        ];
        var page = clean(($('main') || document.body).textContent).toLowerCase();
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var jd = clean(input.value).toLowerCase();
            out.textContent = '';
            if (jd.length < 40) { out.appendChild(el('p', 'fit-note', 'Paste a few lines of a job description first.')); return; }
            var asked = CONCEPTS.filter(function (c) { return c[1].test(jd); });
            if (!asked.length) { out.appendChild(el('p', 'fit-note', 'I could not find any skills I recognise in that text. Try pasting the requirements part.')); return; }
            var have = asked.filter(function (c) { return c[1].test(page); }), miss = asked.filter(function (c) { return !c[1].test(page); });
            var head = el('p', 'fit-score');
            head.appendChild(el('b', null, have.length + ' of ' + asked.length));
            head.appendChild(document.createTextNode(' things this role asks for are on this page.'));
            out.appendChild(head);
            var chips = el('div', 'fit-chips');
            have.forEach(function (c) { chips.appendChild(el('span', 'fit-chip on', c[0])); });
            miss.forEach(function (c) { var s = el('span', 'fit-chip', c[0]); s.title = 'Not mentioned on this page'; chips.appendChild(s); });
            out.appendChild(chips);
            var ranked = cases.map(function (c) {
                var m = asked.filter(function (k) { return k[1].test(c.text); });
                return { c: c, m: m };
            }).filter(function (x) { return x.m.length; }).sort(function (a, b) { return b.m.length - a.m.length; }).slice(0, 3);
            if (ranked.length) {
                out.appendChild(el('p', 'fit-sub', 'Closest work'));
                var ul = el('ul', 'fit-cases');
                ranked.forEach(function (x) {
                    var li = el('li'), a = el('a', null, x.c.title); a.href = '#' + x.c.id;
                    a.addEventListener('click', function (ev) { ev.preventDefault(); goCase(x.c.id); });
                    li.appendChild(a);
                    li.appendChild(el('span', null, x.m.map(function (k) { return k[0]; }).join(' · ')));
                    ul.appendChild(li);
                });
                out.appendChild(ul);
            }
            var tokens = Math.round(jd.length / 4);
            out.appendChild(el('p', 'fit-receipt', '~' + tokens.toLocaleString('en') + ' tokens read · 0 model calls · $0.00 · keyword match, run in your browser'));
            if (window.gtag) gtag('event', 'role_fit_check');
        });
    })();

    // ---- 3. case stories -----------------------------------------------------
    (function stories() {
        var withRows = cases.filter(function (c) { return c.rows.problem && c.rows.result; });
        if (!withRows.length || typeof HTMLDialogElement === 'undefined') return;
        var dlg = el('dialog', 'story-dlg'); dlg.setAttribute('aria-label', 'Case story');
        var stage = el('div', 'story-stage'), bar = el('div', 'story-bar'), close = el('button', 'story-close', 'Close');
        close.type = 'button'; dlg.appendChild(bar); dlg.appendChild(stage); dlg.appendChild(close);
        document.body.appendChild(dlg);
        var timer = 0;
        function stop() { clearTimeout(timer); }
        close.addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('close', stop);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        function play(c) {
            var beats = [
                ['The problem', c.rows.problem],
                ['What I built', c.rows.approach || ''],
                ['The result', c.rows.result, c.stat]
            ].filter(function (b) { return b[1]; });
            bar.textContent = ''; beats.forEach(function () { bar.appendChild(el('i')); });
            var i = -1;
            function next() {
                i++;
                if (i >= beats.length) { return; }
                $$('i', bar).forEach(function (d, k) { d.className = k < i ? 'done' : k === i ? 'on' : ''; });
                stage.textContent = '';
                var beat = el('div', 'story-beat');
                beat.appendChild(el('span', 'story-k', c.short + ' · ' + beats[i][0]));
                if (beats[i][2]) { var big = el('p', 'story-num'); big.appendChild(el('b', null, beats[i][2].n)); big.appendChild(document.createTextNode(' ' + beats[i][2].l)); beat.appendChild(big); }
                beat.appendChild(el('p', 'story-t', beats[i][1]));
                var nav = el('div', 'story-nav');
                if (i < beats.length - 1) { var nx = el('button', 'story-next', 'Next'); nx.type = 'button'; nx.addEventListener('click', function () { stop(); next(); }); nav.appendChild(nx); }
                else { var go = el('button', 'story-next', 'Open the case'); go.type = 'button'; go.addEventListener('click', function () { dlg.close(); goCase(c.id); }); nav.appendChild(go); }
                beat.appendChild(nav);
                stage.appendChild(beat);
                stop();
                if (!reduce && i < beats.length - 1) timer = setTimeout(next, Math.min(9000, 2600 + beats[i][1].length * 38));
            }
            dlg.showModal(); next();
            if (window.gtag) gtag('event', 'case_story');
        }
        withRows.forEach(function (c) {
            var meta = $('.case-meta', c.el); if (!meta) return;
            var b = el('button', 'case-story-btn', 'Play story'); b.type = 'button';
            b.setAttribute('aria-label', 'Play the story of ' + c.short);
            b.addEventListener('click', function () { play(c); });
            meta.appendChild(b);
        });
    })();

    // ---- 4. tailored links: ?hire=Company&role=agentic ------------------------
    (function tailored() {
        var ROLES = { applied: 'Applied AI Engineer', agentic: 'Agentic AI Engineer', platform: 'AI Platform Engineer', architect: 'AI Solutions Architect', research: 'R&D Researcher' };
        var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
        function safe(v) { return clean(String(v || '').replace(/[^A-Za-z0-9 .&'À-ɏ-]/g, '')).slice(0, 40); }
        var company = safe(q.get('hire')), role = ROLES[(q.get('role') || '').toLowerCase()];
        var eyebrow = $('#recruiter-card .rc-eyebrow');
        if (eyebrow && company) eyebrow.textContent = 'The short version · prepared for ' + company;
        if (role) {
            var dd = null;
            $$('#recruiter-card .rc-facts > div').forEach(function (d) { if (clean($('dt', d).textContent) === 'Role fit') dd = $('dd', d); });
            if (dd) {
                var rest = clean(dd.textContent).split('·').map(clean).filter(function (r) { return r && r !== role; });
                dd.textContent = '';
                dd.appendChild(el('b', null, role));
                dd.appendChild(document.createTextNode(' · ' + rest.join(' · ')));
            }
            if (role === ROLES.research) {
                var facts = $('#recruiter-card .rc-facts');
                $$('#recruiter-card .rc-facts > div').forEach(function (d) { if (clean($('dt', d).textContent) === 'Research') facts.insertBefore(d, facts.children[1] || null); });
            }
        }
        // a small builder, so a link can be made for each application
        var mk = $('#rc-make'); if (!mk) return;
        var inC = $('#rc-make-company'), inR = $('#rc-make-role'), outL = $('#rc-make-link'), copy = $('#rc-make-copy');
        function build() {
            var c = safe(inC.value), r = inR.value;
            var url = 'https://vfaraji89.github.io/?hire' + (c ? '=' + encodeURIComponent(c) : '') + (r ? '&role=' + r : '');
            outL.textContent = url; return url;
        }
        inC.addEventListener('input', build); inR.addEventListener('change', build); build();
        copy.addEventListener('click', function () {
            var url = build();
            if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1400); });
        });
    })();
})();
