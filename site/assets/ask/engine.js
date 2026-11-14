/* Vahid’s agent + Fit brief: the engine.
   Runs the same in the browser (window.VFEngine) and in Node (require), so the
   evals in tools/evals test exactly the code visitors use.
   No model, no network: BM25 retrieval over data/evidence.json, answers built
   only from sentences in that file, and a fit score that says where the
   evidence is thin or missing. A Claude endpoint can sit on top (see worker/);
   this layer is what it is grounded on, and what it falls back to. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.VFEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var STOP = ('a an and are as at be but by can did do does for from has have how i if in into is it its me my of on or our ' +
        'so that the their them then there these they this to was we were what when where which who why will with you your ' +
        'vahid faraji he his him has had any about tell show give much many more most ever also just').split(' ');
    var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });

    function norm(s) {
        return String(s || '').toLowerCase()
            .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
            .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c').replace(/[âÂ]/g, 'a');
    }
    function stem(w) {
        if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
        if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
        if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
        if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
        return w;
    }
    function tokens(s) {
        var out = [], m = norm(s).match(/[a-z0-9][a-z0-9+#.-]*[a-z0-9+#]|[a-z0-9]/g) || [];
        for (var i = 0; i < m.length; i++) { var w = m[i]; if (!STOPSET[w] && w.length > 1) out.push(stem(w)); }
        return out;
    }
    function sentences(text) {
        return String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
    }

    function create(data) {
        var LEVELS = data.levels, CONCEPTS = data.concepts, EV = data.evidence;
        var byId = {}; EV.forEach(function (e) { byId[e.id] = e; });
        var conceptByKey = {};
        CONCEPTS.forEach(function (c) { c.re = new RegExp(c.jd, 'i'); conceptByKey[c.key] = c; });
        Object.keys(LEVELS).forEach(function (k) { if (LEVELS[k].answers) LEVELS[k].re = new RegExp(LEVELS[k].answers, 'i'); });

        // ---- BM25 index: title counts twice, concept labels once -------------
        var K1 = 1.4, B = 0.4, docs = [], df = {}, avg = 0;
        EV.forEach(function (e) {
            var labels = e.tags.map(function (t) { return conceptByKey[t] ? conceptByKey[t].label : ''; }).join(' ');
            // the proof level is indexed as words too: "in production", "published"
            var proof = (LEVELS[e.level] || {}).label || '';
            var toks = tokens(e.title + ' ' + e.title + ' ' + e.text + ' ' + labels + ' ' + proof);
            var tf = {}; toks.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
            Object.keys(tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
            var title = {}; tokens(e.title).forEach(function (t) { title[t] = 1; });
            docs.push({ e: e, tf: tf, len: toks.length, title: title }); avg += toks.length;
        });
        avg /= docs.length || 1;
        var N = docs.length;
        function idf(t) { var n = df[t] || 0; return Math.log(1 + (N - n + 0.5) / (n + 0.5)); }

        function conceptsIn(text) {
            return CONCEPTS.filter(function (c) { return c.re.test(text); });
        }

        function search(q, k) {
            var qt = tokens(q), seen = {};
            qt = qt.filter(function (t) { if (seen[t]) return false; seen[t] = 1; return true; });
            var qc = conceptsIn(q).map(function (c) { return c.key; });
            var qMass = qt.reduce(function (a, t) { return a + idf(t); }, 0) || 1;
            var recent = /\b(recent(ly)?|latest|newest|currently|right now|these days|lately)\b/i.test(q);
            var res = docs.map(function (d) {
                var s = 0, hits = 0, mass = 0;
                qt.forEach(function (t) {
                    var f = d.tf[t]; if (!f) return;
                    hits++; mass += idf(t);
                    s += idf(t) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d.len / avg));
                });
                // a question about "lately" prefers the newest evidence
                if (recent) { var y = parseInt(String(d.e.date).slice(0, 4), 10), mo = parseInt(String(d.e.date).slice(5, 7), 10) || 0; if (y >= 2026) s += 1.5 + mo * 0.25; }
                // a question that names a concept prefers evidence tagged with it
                var tagged = qc.filter(function (c) { return d.e.tags.indexOf(c) !== -1; }).length;
                s += tagged * 1.6;
                var raw = s;
                // proof strength scales the score: production, published and shipped
                // count in full; certified, taught and talks less; the stack list least
                // ...unless the question asks for exactly that kind of proof
                // ("does he teach?" is answered in full by a course he taught)
                var lv = LEVELS[d.e.level] || {};
                if (!(lv.re && lv.re.test(q))) s *= ({ 3: 1, 2: 0.6, 1: 0.45 })[lv.weight || 1];
                // a rare word that names this item (ProjectLens, Languages) anchors it
                var named = qt.some(function (t) { return d.title[t] && (df[t] || 0) <= 3; });
                return { e: d.e, score: s, raw: raw, hits: hits, tagged: tagged, coverage: mass / qMass, recent: recent, named: named };
            }).filter(function (r) { return r.score > 0; });
            res.sort(function (a, b) { return b.score - a.score; });
            return { results: res.slice(0, k || 5), qTokens: qt, qConcepts: qc };
        }

        // The sentence of an item that best answers the question.
        function bestSentences(e, qTokens, max) {
            var ss = sentences(e.text);
            var scored = ss.map(function (s, i) {
                var st = tokens(s), set = {}, sc = 0;
                st.forEach(function (t) { set[t] = 1; });
                qTokens.forEach(function (t) { if (set[t]) sc += idf(t); });
                if (/\d/.test(s)) sc += 0.4;          // numbers are evidence
                return { s: s, i: i, sc: sc - i * 0.05 };
            });
            scored.sort(function (a, b) { return b.sc - a.sc; });
            var pick = scored.slice(0, max || 1).sort(function (a, b) { return a.i - b.i; });
            return pick.map(function (p) { return p.s; }).join(' ');
        }

        var ABSTAIN_MIN = 3.2;   // tuned on the eval set: below this, say so instead of guessing
        var COVER_MIN = 0.45;

        function ask(q, opts) {
            opts = opts || {};
            var t0 = Date.now();
            var r = search(q, opts.k || 4);
            var top = r.results;
            // Answer only when the best evidence covers enough of the question
            // (by information, not word count) or carries the concept it names.
            // relevance decides whether to answer; proof strength only decides order
            var best = top.slice().sort(function (a, b) { return b.raw - a.raw; })[0];
            var confident = !!best && best.raw >= ABSTAIN_MIN &&
                (best.coverage >= COVER_MIN || best.tagged >= 1 || best.recent || best.named);
            var used = confident ? top.filter(function (x, i) { return i === 0 || x.score >= top[0].score * 0.45; }).slice(0, 3) : [];
            var sources = used.map(function (x, i) {
                return { n: i + 1, id: x.e.id, title: x.e.title, url: x.e.url, level: x.e.level,
                         levelLabel: (LEVELS[x.e.level] || {}).label, score: +x.score.toFixed(2) };
            });
            var answer = used.map(function (x, i) {
                return { text: bestSentences(x.e, r.qTokens, i === 0 ? 2 : 1), cite: i + 1 };
            });
            return {
                question: q, abstain: !confident, answer: answer, sources: sources,
                candidates: top.map(function (x) { return { id: x.e.id, score: +x.score.toFixed(2) }; }),
                concepts: r.qConcepts, ms: Date.now() - t0, mode: 'retrieval',
                tokensRead: Math.round((q.length + used.reduce(function (a, x) { return a + x.e.text.length; }, 0)) / 4)
            };
        }

        // ---- Fit brief -------------------------------------------------------
        function conceptStatus(key) {
            var ev = EV.filter(function (e) { return e.tags.indexOf(key) !== -1; });
            var best = ev.reduce(function (m, e) { return Math.max(m, (LEVELS[e.level] || {}).weight || 0); }, 0);
            var RANK = { production: 3, published: 2, shipped: 1 };   // within strong proof: in use beats published beats shipped
            ev.sort(function (a, b) { return (((LEVELS[b.level] || {}).weight || 0) - ((LEVELS[a.level] || {}).weight || 0)) || ((RANK[b.level] || 0) - (RANK[a.level] || 0)); });
            return { key: key, label: conceptByKey[key].label, status: best >= 3 ? 'strong' : best >= 1 ? 'partial' : 'gap',
                     evidence: ev.slice(0, 3).map(function (e) { return { id: e.id, title: e.title, url: e.url, level: e.level, levelLabel: (LEVELS[e.level] || {}).label }; }) };
        }

        function requirements(jd) {
            var lines = String(jd).replace(/\r/g, '').split(/\n+|•|·(?=\s)|;\s+/).map(function (l) {
                return l.replace(/^[\s\-*–—>\d.)]+/, '').replace(/\s+/g, ' ').trim();
            }).filter(function (l) { return l.length >= 6; });
            if (lines.length <= 2) {
                lines = [];
                String(jd).split(/(?<=[.!?])\s+/).forEach(function (s) { s = s.trim(); if (s.length >= 12) lines.push(s); });
            }
            return lines.slice(0, 60).map(function (l) { return l.length > 280 ? l.slice(0, 277) + '…' : l; });
        }

        // The score is honest by construction: no profile fits a role perfectly, so it never passes
        // FIT_CAP. Four things keep it from flattering:
        //  1 weight: a concept on a "must / required" line counts more than one on a "nice to have" line
        //  2 unchecked asks: requirement-like lines with no skill I can check pull the score down a little
        //  3 years: "N+ years" is compared with the years on the site (12: 8 in data products, 4 in R&D)
        //  4 few skills, little certainty: with only a couple of skills recognised the score leans to 50
        var FIT_CAP = 90, YEARS_INDUSTRY = 12;
        var MUST = /\b(must|required|requirement|minimum|essential|mandatory|need to have|you have|you bring)\b/i;
        var NICE = /\b(nice[- ]to[- ]have|preferred|bonus|a plus|is a plus|plus\b|ideally|desirable|optional|good to have)\b/i;
        var ASKS = /\b(experience|years?|degree|proficien\w*|knowledge|familiar\w*|ability|background|expertise|skills?|understanding|track record|hands[- ]on|fluent|certif\w*)\b/i;
        var CREDIT = { strong: 1, partial: 0.5, gap: 0 };
        function lineWeight(text) { return NICE.test(text) ? 0.5 : MUST.test(text) ? 1.25 : 1; }
        function yearsAsked(jd) {
            var most = 0;
            String(jd).split(/\n+/).forEach(function (line) {
                var re = /(\d{1,2})\s*\+?\s*(?:-|to|–)?\s*(?:\d{1,2}\s*)?\+?\s*years?/gi, m;
                while ((m = re.exec(line))) { var n = +m[1]; if (n > 0 && n <= 30) most = Math.max(most, n); }
            });
            if (!most) return null;
            return { asked: most, have: YEARS_INDUSTRY, status: most <= YEARS_INDUSTRY ? 'strong' : most <= YEARS_INDUSTRY + 4 ? 'partial' : 'gap' };
        }
        function scoreOf(reqs, list, jd) {
            if (!list.length) return { score: null, raw: null, capped: false, years: null, unchecked: 0, must: { asked: 0, met: 0 } };
            var w = {};
            reqs.forEach(function (r) { var lw = lineWeight(r.text); r.concepts.forEach(function (c) { w[c.key] = Math.max(w[c.key] || 0, lw); }); });
            var num = 0, den = 0;
            list.forEach(function (c) { num += w[c.key] * CREDIT[c.status]; den += w[c.key]; });
            var years = yearsAsked(jd);
            if (years) { num += 1.25 * CREDIT[years.status]; den += 1.25; }
            // requirement-like lines with nothing to check: partial credit, at most three of them
            var unchecked = reqs.filter(function (r) { return r.status === 'unscored' && ASKS.test(r.text) && !/\byears?\b/i.test(r.text); }).length;
            var u = Math.min(3, unchecked);
            num += u * 0.3; den += u;
            // shrink toward 50 when there is little to go on (a prior worth two asks)
            var raw = 100 * (num + 2 * 0.5) / (den + 2);
            var score = Math.min(FIT_CAP, Math.round(raw));
            var must = list.filter(function (c) { return w[c.key] > 1; });
            return { score: score, raw: Math.round(raw), capped: raw > FIT_CAP, years: years, unchecked: unchecked,
                     must: { asked: must.length, met: must.filter(function (c) { return c.status === 'strong'; }).length } };
        }

        function fit(jd) {
            var t0 = Date.now();
            var reqs = requirements(jd).map(function (line) {
                var cs = conceptsIn(line).map(function (c) { return conceptStatus(c.key); });
                var st = !cs.length ? 'unscored'
                    : cs.every(function (c) { return c.status === 'strong'; }) ? 'strong'
                    : cs.every(function (c) { return c.status === 'gap'; }) ? 'gap' : 'partial';
                return { text: line, status: st, concepts: cs };
            });
            var asked = {}, order = [];
            reqs.forEach(function (r) { r.concepts.forEach(function (c) { if (!asked[c.key]) { asked[c.key] = c; order.push(c.key); } }); });
            var list = order.map(function (k) { return asked[k]; });
            var count = { strong: 0, partial: 0, gap: 0 };
            list.forEach(function (c) { count[c.status]++; });
            var sc = scoreOf(reqs, list, jd);
            var score = sc.score;
            // the evidence that covers most of what was asked
            var tally = {};
            list.forEach(function (c) { c.evidence.forEach(function (e, i) { if (i > 1) return; tally[e.id] = (tally[e.id] || 0) + (LEVELS[e.level] || {}).weight; }); });
            var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; }).slice(0, 4).map(function (id) {
                var e = byId[id];
                var covers = list.filter(function (c) { return e.tags.indexOf(c.key) !== -1; }).map(function (c) { return c.label; });
                return { id: id, title: e.title, url: e.url, levelLabel: (LEVELS[e.level] || {}).label, covers: covers };
            });
            return {
                score: score, raw: sc.raw, capped: sc.capped, cap: FIT_CAP, years: sc.years, unchecked: sc.unchecked, must: sc.must, count: count, concepts: list, requirements: reqs, topEvidence: top,
                gaps: list.filter(function (c) { return c.status === 'gap'; }).map(function (c) { return c.label; }),
                thin: list.filter(function (c) { return c.status === 'partial'; }).map(function (c) { return c.label; }),
                ms: Date.now() - t0, tokensRead: Math.round(String(jd).length / 4), mode: 'rules'
            };
        }

        function briefMarkdown(b, base) {
            base = base || 'https://vfaraji89.github.io/';
            function abs(u) { return /^https?:/.test(u) ? u : base + u; }
            var o = ['# Fit brief: Vahid Faraji', '',
                'Score: ' + (b.score == null ? 'n/a' : b.score + '/100, capped at ' + b.cap + ': no profile is a perfect fit') + ' (' + b.count.strong + ' strong, ' + b.count.partial + ' partial, ' + b.count.gap + ' gaps)', ''];
            if (b.years) o.push('Years asked: ' + b.years.asked + '+, on the site: ' + b.years.have + ' years of work, 8 in data products and 4 in R&D (' + b.years.status + ')', '');
            o.push('## Strongest evidence');
            b.topEvidence.forEach(function (e) { o.push('- ' + e.title + ' (' + e.levelLabel + '): ' + abs(e.url) + (e.covers.length ? ' | covers ' + e.covers.join(', ') : '')); });
            o.push('', '## Requirement by requirement');
            b.requirements.filter(function (r) { return r.status !== 'unscored'; }).forEach(function (r) {
                o.push('- [' + r.status.toUpperCase() + '] ' + r.text);
                r.concepts.forEach(function (c) { o.push('  - ' + c.label + ': ' + (c.evidence[0] ? c.evidence[0].title + ' ' + abs(c.evidence[0].url) : 'no evidence on the site')); });
            });
            if (b.gaps.length) o.push('', '## Honest gaps', '- No evidence on the site for: ' + b.gaps.join(', '));
            o.push('', 'Generated by the fit checker on vfaraji89.github.io (rules over a public evidence file; no model).');
            return o.join('\n');
        }

        return { ask: ask, fit: fit, search: search, briefMarkdown: briefMarkdown, concepts: CONCEPTS, evidence: EV, byId: byId, levels: LEVELS, tokens: tokens };
    }

    return { create: create, tokens: tokens };
});
