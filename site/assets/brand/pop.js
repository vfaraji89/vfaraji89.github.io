/* Pop: see pop.css. Adds and clears classes only; no layout, no network. */
(function () {
    if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var after = function (el, cls) {
        el.addEventListener('animationend', function end(e) {
            if (e.target !== el) return;
            el.classList.remove(cls);
            el.style.removeProperty('--pop-delay');
            el.removeEventListener('animationend', end);
        });
    };

    // 1. Header: brand and controls pop in, one after another.
    $$('.site-nav .brand, .nav-actions > *').filter(function (el) { return el.offsetParent !== null; }).forEach(function (el, i) {
        el.style.setProperty('--pop-delay', (80 + i * 70) + 'ms');
        el.classList.add('pop-head'); after(el, 'pop-head');
    });

    // 2. Cards pop up as they scroll into view, staggered with their neighbours.
    //    Elements that already have their own entrance (.reveal and friends) are left alone.
    var CARDS = '.about-card, .metric-card, .upd-card, .news-card, .principle-card, .abacus-stat, .stats-bar .stat, .tiles > *, .hero-fit';
    var cards = $$(CARDS).filter(function (el) { return !el.closest('.reveal, .case-card, .pub-card, .timeline-item, .gallery-card'); });
    if ('IntersectionObserver' in window && cards.length) {
        cards.forEach(function (el) { el.classList.add('pop-wait'); });
        var io = new IntersectionObserver(function (entries) {
            entries.filter(function (e) { return e.isIntersecting; }).forEach(function (e, i) {
                var el = e.target;
                io.unobserve(el);
                el.style.setProperty('--pop-delay', Math.min(i, 6) * 70 + 'ms');
                el.classList.remove('pop-wait'); el.classList.add('pop-in'); after(el, 'pop-in');
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        cards.forEach(function (el) { io.observe(el); });
    }

    // 3. Press and release: squash on press, spring back on release.
    var PRESS = 'button, .nav-fit, .nav-btn-ghost, .nav-btn-solid, .hero-fit, .chip, .btn, [role="button"], .rec-toggle';
    var held = null;
    document.addEventListener('pointerdown', function (e) {
        var el = e.target.closest && e.target.closest(PRESS);
        if (!el || el.disabled) return;
        held = el; el.classList.remove('pop-release'); el.classList.add('pop-pressing');
    }, { passive: true });
    var letGo = function () {
        if (!held) return;
        var el = held; held = null;
        el.classList.remove('pop-pressing'); void el.offsetWidth;
        el.classList.add('pop-release'); after(el, 'pop-release');
    };
    document.addEventListener('pointerup', letGo, { passive: true });
    document.addEventListener('pointercancel', letGo, { passive: true });

    // 4. The Fit chip nudges once per visit, after the header has settled.
    var fit = document.querySelector('.nav-fit');
    var seen = false; try { seen = sessionStorage.getItem('pop-fit') === '1'; } catch (e) {}
    if (fit && !seen && fit.getAttribute('aria-current') !== 'page') {
        setTimeout(function () {
            fit.classList.add('pop-nudge'); after(fit, 'pop-nudge');
            try { sessionStorage.setItem('pop-fit', '1'); } catch (e) {}
        }, 1600);
    }
})();
