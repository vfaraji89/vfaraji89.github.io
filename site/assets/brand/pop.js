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

    // 1. Header: brand and controls glide in, one after another.
    $$('.site-nav .brand, .nav-actions > *').filter(function (el) { return el.offsetParent !== null; }).forEach(function (el, i) {
        el.style.setProperty('--pop-delay', (80 + i * 70) + 'ms');
        el.classList.add('pop-head'); after(el, 'pop-head');
    });

    // 2. Cards glide up and settle as they scroll into view, staggered with their neighbours.
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

    // 3. Press and release: a quiet dip on press, settling back on release.
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
        el.classList.add('pop-release'); el.classList.remove('pop-pressing');
        setTimeout(function () { el.classList.remove('pop-release'); }, 450);
    };
    document.addEventListener('pointerup', letGo, { passive: true });
    document.addEventListener('pointercancel', letGo, { passive: true });

    // 4. Once per visit the Fit chip's beads slide across, after the header has settled.
    var fit = document.querySelector('.nav-fit');
    var seen = false; try { seen = sessionStorage.getItem('pop-fit') === '1'; } catch (e) {}
    if (fit && !seen && fit.getAttribute('aria-current') !== 'page') {
        setTimeout(function () {
            fit.classList.add('pop-nudge'); after(fit, 'pop-nudge');
            try { sessionStorage.setItem('pop-fit', '1'); } catch (e) {}
        }, 1600);
    }

    // 5. The scroll rod: a bead under the bar that glides with reading progress.
    //    It eases toward the scroll position each frame, so it never jumps.
    var header = document.querySelector('.site-header');
    if (header) {
        var rod = document.createElement('div');
        rod.className = 'bead-rod'; rod.setAttribute('aria-hidden', 'true');
        rod.appendChild(document.createElement('i'));
        if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
        header.appendChild(rod);
        var cur = 0, goal = 0, ticking = false;
        var measure = function () {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            goal = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            rod.classList.toggle('on', window.scrollY > 40 && max > window.innerHeight * 0.5);
            if (!ticking) { ticking = true; requestAnimationFrame(step); }
        };
        var step = function () {
            cur += (goal - cur) * 0.14;
            if (Math.abs(goal - cur) < 0.0005) cur = goal;
            rod.style.setProperty('--p', cur.toFixed(4));
            if (cur !== goal) requestAnimationFrame(step); else ticking = false;
        };
        window.addEventListener('scroll', measure, { passive: true });
        window.addEventListener('resize', measure);
        measure();
    }
})();
