/* Evals page: renders data/evals.json, written by tools/evals/run.mjs. */
(function () {
    'use strict';
    function $(s) { return document.querySelector(s); }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function pct(x) { return x == null ? 'n/a' : (Math.round(x * 1000) / 10) + '%'; }
    function pf(pass) { return el('span', 'pf' + (pass ? '' : ' fail'), pass ? 'pass' : 'fail'); }
    fetch('data/evals.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
        var m = d.latest.metrics, t = d.thresholds;
        var answers = d.ask.filter(function (a) { return a.kind === 'answer'; }), abst = d.ask.filter(function (a) { return a.kind === 'abstain'; });
        var held = d.ask.filter(function (a) { return a.split === 'holdout'; });
        var fitChecks = []; d.fit.forEach(function (f) { f.checks.forEach(function (c) { fitChecks.push(c); }); });
        function n(xs) { return xs.filter(function (x) { return x.pass; }).length + ' of ' + xs.length; }
        [['ask', 'Answers grounded', n(answers), t.ask], ['abstain', 'Says “no evidence”', n(abst), t.abstain],
         ['fit', 'Fit labels right', n(fitChecks), t.fit], ['holdout', 'Held-out questions', n(held), null],
         ['links', 'Evidence links live', d.evidence_items + ' items', t.links]].forEach(function (x) {
            var v = m[x[0]], ok = x[3] == null || v >= x[3];
            var tile = el('div', 'tile ' + (ok ? 'ok' : 'bad'));
            tile.appendChild(el('b', null, pct(v))); tile.appendChild(el('span', null, x[1]));
            tile.appendChild(el('em', null, x[2] + (x[3] != null ? ' · min ' + pct(x[3]) : ' · written after round 1')));
            $('#tiles').appendChild(tile);
        });
        var rl = $('#runline'); rl.textContent = '';
        rl.appendChild(document.createTextNode('Last run ' + new Date(d.latest.at).toUTCString().replace(' GMT', ' UTC') + ' · commit '));
        var a = el('a', null, d.latest.sha); a.href = 'https://github.com/vfaraji89/vfaraji89.github.io/commit/' + d.latest.sha; a.target = '_blank'; a.rel = 'noopener';
        rl.appendChild(a);
        rl.appendChild(document.createTextNode(' · ' + m.cases + ' checks · MRR ' + m.mrr + ' · ' + d.history.length + ' recorded runs'));
        // history: one line per metric, oldest left
        var svg = $('#spark'), H = d.history, W = 600, h = 56;
        if (H.length > 1) {
            ['ask', 'fit', 'abstain'].forEach(function (k, i) {
                var pts = H.map(function (r, j) { var v = r.metrics[k] == null ? 1 : r.metrics[k]; return (j / (H.length - 1) * W).toFixed(1) + ',' + (4 + (1 - v) * 4 * (h - 8)).toFixed(1); }).join(' ');
                var pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke-width', '2');
                pl.setAttribute('stroke', ['#e0301e', '#1c1c1e', 'rgba(28,28,30,0.35)'][i]); pl.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(pl);
            });
        } else { svg.style.display = 'none'; }
        var tb = $('#ask-table tbody');
        d.ask.forEach(function (r) {
            var tr = el('tr'); var c1 = el('td'); c1.appendChild(pf(r.pass)); tr.appendChild(c1);
            var q = el('td', null, r.q + ' '); q.appendChild(el('span', 'tag-split', r.kind === 'abstain' ? 'should abstain' : r.split === 'holdout' ? 'held-out' : '')); tr.appendChild(q);
            tr.appendChild(el('td', 'why', r.why)); tb.appendChild(tr);
        });
        var fb = $('#fit-table tbody');
        d.fit.forEach(function (f) { f.checks.forEach(function (c) {
            var tr = el('tr'); var c1 = el('td'); c1.appendChild(pf(c.pass)); tr.appendChild(c1);
            [f.title, c.concept, c.want, c.got].forEach(function (v) { tr.appendChild(el('td', null, v)); }); fb.appendChild(tr);
        }); });
        if (d.live) {
            $('#live-h').hidden = false;
            $('#live').appendChild(el('p', 'sec-p', d.live.model + ': ' + pct(d.live.pass_rate) + ' of questions answered correctly and grounded · average $' + (d.live.avg_cost_usd || 0).toFixed(4) + ' per answer · median ' + d.live.p50_ms + ' ms.'));
        }
    }).catch(function () { $('#runline').textContent = 'The eval results did not load.'; });
})();
