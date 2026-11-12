/* Languages: English (the page itself), Türkçe, Español, Nederlands, 日本語.
   Strings live in site/i18n/<lang>/<file>.json (see i18n/STYLE.md for the grammar rules
   each language follows). English is never fetched: it is the HTML, so a missing key
   always falls back to English rather than to a blank.

   Markup:
     data-i18n="file.key"            replaces the text
     data-i18n-html="file.key"       replaces the inner HTML (only for our own trusted strings)
     data-i18n-attr="attr:file.key;attr2:file.key2"
   Script API: vfT(key, fallback, vars) and the 'vf:lang' event, for text built in JS. */
(function () {
    var LANGS = [
        { id: 'en', glyph: 'a', name: 'English' },
        { id: 'tr', glyph: 'ğ', name: 'Türkçe' },
        { id: 'es', glyph: 'ñ', name: 'Español' },
        { id: 'nl', glyph: 'ĳ', name: 'Nederlands' },
        { id: 'ja', glyph: 'あ', name: '日本語' }
    ];
    var KEY = 'vf-lang';
    var me = document.currentScript;
    var base = new URL('../../i18n/', me ? me.src : location.href).href;
    var dict = {}, current = 'en';
    var byId = {}; LANGS.forEach(function (l) { byId[l.id] = l; });

    function pick() {
        var q = null; try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
        if (q && byId[q]) return q;
        var s = null; try { s = localStorage.getItem(KEY); } catch (e) {}
        if (s && byId[s]) return s;
        var nav = (navigator.languages || [navigator.language || 'en']);
        for (var i = 0; i < nav.length; i++) { var c = String(nav[i]).slice(0, 2).toLowerCase(); if (byId[c]) return c; }
        return 'en';
    }
    function get(key) { var v = dict[key]; return typeof v === 'string' ? v : null; }
    function fill(s, vars) { return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s; }
    window.vfT = function (key, fallback, vars) { return fill(get(key) || fallback, vars); };
    window.vfLang = function () { return current; };

    function remember(el, prop) { var k = 'i18nEn' + prop; if (el.dataset[k] == null) el.dataset[k] = prop === 'Html' ? el.innerHTML : el.textContent; return el.dataset[k]; }
    function apply() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var en = remember(el, 'Text'), v = get(el.getAttribute('data-i18n'));
            el.textContent = v != null ? v : en;
        });
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var en = remember(el, 'Html'), v = get(el.getAttribute('data-i18n-html'));
            el.innerHTML = v != null ? v : en;
        });
        document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
                var p = pair.split(':'), attr = p[0].trim(), key = (p[1] || '').trim();
                if (!attr || !key) return;
                var store = 'i18nEnAttr' + attr.replace(/[^a-z]/gi, '');
                if (el.dataset[store] == null) el.dataset[store] = el.getAttribute(attr) || '';
                var v = get(key); el.setAttribute(attr, v != null ? v : el.dataset[store]);
            });
        });
        document.documentElement.lang = current;
        document.querySelectorAll('.mt-lang, .lang-glyph').forEach(function (b) {
            if (b.textContent !== byId[current].glyph) { b.textContent = byId[current].glyph; b.classList.remove('is-swap'); void b.offsetWidth; b.classList.add('is-swap'); }
        });
        document.querySelectorAll('.lang-bead').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === current ? 'true' : 'false'); });
        document.querySelectorAll('.lang-note').forEach(function (n) { n.hidden = current === 'en'; });
        document.dispatchEvent(new CustomEvent('vf:lang', { detail: { lang: current } }));
        bar();
    }

    /* Keep the Fit check chip whole (both words) in every language: when the bar runs
       out of room, the name beside the logo steps aside first, then the chip's icon. */
    function bar() {
        var nav = document.querySelector('.site-nav'), acts = nav && nav.querySelector('.nav-actions');
        if (!acts) return;
        var steps = ['bar-tight', 'bar-tighter'];
        steps.forEach(function (c) { nav.classList.remove(c); });
        var edge = function () { var r = nav.getBoundingClientRect(); return r.right - parseFloat(getComputedStyle(nav).paddingRight || 0) + 1; };
        for (var i = 0; i < steps.length && acts.getBoundingClientRect().right > edge(); i++) nav.classList.add(steps[i]);
    }
    function load(lang) {
        if (lang === 'en') return Promise.resolve({});
        var files = ['common'].concat((document.documentElement.getAttribute('data-i18n-files') || '').split(/\s+/).filter(Boolean));
        return Promise.all(files.map(function (f) {
            return fetch(base + lang + '/' + f + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
                .then(function (j) { var o = {}; Object.keys(j).forEach(function (k) { if (k.charAt(0) !== '_') o[f + '.' + k] = j[k]; }); return o; });
        })).then(function (parts) { return Object.assign.apply(null, [{}].concat(parts)); });
    }
    function set(lang, save) {
        if (!byId[lang]) lang = 'en';
        return load(lang).then(function (d) {
            dict = d; current = lang; apply();
            if (save) { try { localStorage.setItem(KEY, lang); } catch (e) {} if (window.gtag) gtag('event', 'language_change', { language: lang }); }
        });
    }
    window.vfSetLang = function (lang) { return set(lang, true); };

    // the language beads, wherever a page has a [data-lang-switch] slot
    function beads() {
        document.querySelectorAll('[data-lang-switch]').forEach(function (slot) {
            if (slot.childElementCount) return;
            LANGS.forEach(function (l) {
                var b = document.createElement('button');
                b.type = 'button'; b.className = 'lang-bead'; b.dataset.lang = l.id; b.lang = l.id;
                b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', l.name);
                var i = document.createElement('i'); i.textContent = l.glyph; i.setAttribute('aria-hidden', 'true');
                b.appendChild(i); b.appendChild(document.createTextNode(l.name));
                b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); set(l.id, true); });
                slot.appendChild(b);
            });
        });
    }
    function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
    // The phone menu: size the sheet to the screen under the bar, and hold the page still behind it.
    function sheet() {
        var header = document.querySelector('.site-header'), box = document.getElementById('nav-sheet');
        if (!header || !box) return;
        function fit() {
            var open = header.classList.contains('menu-open') && window.innerWidth <= 1200;
            document.documentElement.classList.toggle('menu-lock', open);
            if (open) box.style.setProperty('--sheet-h', Math.max(240, (window.visualViewport ? window.visualViewport.height : window.innerHeight) - header.getBoundingClientRect().bottom) + 'px');
        }
        new MutationObserver(fit).observe(header, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', fit);
    }
    // The language button: its own control in the bar, a small popover of beads under it.
    function picker() {
        document.querySelectorAll('.lang-pick').forEach(function (box) {
            var btn = box.querySelector('.lang-btn'), pop = box.querySelector('.lang-pop');
            if (!btn || !pop) return;
            function place() {   // keep the popover inside the screen on narrow phones
                pop.style.right = '0px';
                var vw = document.documentElement.clientWidth, w = Math.min(320, vw - 32), r = btn.getBoundingClientRect().right;
                pop.style.width = w + 'px';
                var left = r - w;
                if (left < 16) pop.style.right = (left - 16) + 'px';
            }
            function show(open) {
                pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (open) place();
            }
            btn.addEventListener('click', function (e) { e.stopPropagation(); show(pop.hidden); });
            pop.addEventListener('click', function (e) { if (e.target.closest('.lang-bead')) setTimeout(function () { show(false); }, 220); }, true);
            pop.addEventListener('click', function (e) { e.stopPropagation(); });
            document.addEventListener('click', function () { if (!pop.hidden) show(false); });
            document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { show(false); btn.focus(); } });
            window.addEventListener('resize', function () { if (!pop.hidden) place(); });
        });
    }
    ready(function () {
        beads(); sheet(); picker(); set(pick(), false);
        var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(bar, 120); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(bar);
    });
})();
