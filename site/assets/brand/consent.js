/* Analytics consent and a few click events.
   Google Analytics is not loaded at all until the visitor says yes (the page head only
   loads it for a stored yes), so nothing reaches Google before then. The choice is
   remembered, and the "Analytics choice" link in the footer asks again; a no also clears
   any Google Analytics cookies already set. See privacy.html. */
(function () {
    var KEY = 'vf-consent';
    function grant() { if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' }); if (window.vfLoadGA) vfLoadGA(); }
    function forget() {
        if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
        document.cookie.split(';').forEach(function (c) {
            var n = c.split('=')[0].trim();
            if (!/^_ga/.test(n)) return;
            ['', '; domain=' + location.hostname, '; domain=.' + location.hostname].forEach(function (d) {
                document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
            });
        });
    }
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'yes') grant();

    function t(k, en) { return window.vfT ? vfT('common.' + k, en) : en; }
    function banner() {
        // a small pill in the corner: one bead, one line, two tiny buttons
        var bar = document.createElement('div');
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Analytics consent');
        bar.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:90;max-width:calc(100vw - 32px);' +
            'display:flex;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:999px;' +
            'background:#fff6f4;color:#1c1c1e;border:1px solid rgba(180,138,92,.45);' +
            'font:500 12.5px/1.3 inherit;opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .6s cubic-bezier(.22,1,.36,1)';
        var bead = document.createElement('span');
        bead.setAttribute('aria-hidden', 'true');
        bead.style.cssText = 'flex:none;width:14px;height:14px;border-radius:50%;' +
            'background:radial-gradient(circle at 34% 30%,#ff9d8f,#e0301e 45%,#9e1a0c)';
        var text = document.createElement('span');
        text.textContent = t('consent_ask', 'One cookie to count visits?');
        text.title = t('consent_title', 'Google Analytics, only to count visits. No ads, no tracking across sites.');
        function btn(label, primary) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.style.cssText = 'font:600 12px/1 inherit;padding:7px 12px;border-radius:999px;cursor:pointer;white-space:nowrap;flex:none;' +
                (primary ? 'background:#1c1c1e;color:#fff;border:1px solid #1c1c1e' : 'background:transparent;color:#55555a;border:1px solid transparent');
            return b;
        }
        var yes = btn(t('consent_yes', 'Sure'), true), no = btn(t('consent_no', 'No'), false);
        var more = document.createElement('a');
        more.href = (location.pathname.indexOf('/papers/') >= 0 ? '../' : '') + 'privacy.html#analytics';
        more.textContent = t('consent_more', 'Privacy');
        more.style.cssText = 'font:500 12px/1 inherit;color:#55555a;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;flex:none';
        no.setAttribute('aria-label', t('consent_no_aria', 'No, do not use an analytics cookie'));
        yes.setAttribute('aria-label', t('consent_yes_aria', 'Sure, use an analytics cookie'));
        function close(v) {
            try { localStorage.setItem(KEY, v); } catch (e) {}
            bar.style.opacity = '0'; bar.style.transform = 'translateY(10px)';
            setTimeout(function () { bar.remove(); }, 400);
        }
        yes.addEventListener('click', function () { grant(); close('yes'); });
        no.addEventListener('click', function () { forget(); close('no'); });
        bar.appendChild(bead); bar.appendChild(text); bar.appendChild(more); bar.appendChild(no); bar.appendChild(yes);
        document.body.appendChild(bar);
        requestAnimationFrame(function () { bar.style.opacity = '1'; bar.style.transform = 'none'; });
    }
    function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
    if (saved === null) ready(function () { setTimeout(banner, 1200); });
    // "Analytics choice": any element with data-consent-reset asks again
    window.vfConsentReset = function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        if (!document.querySelector('[aria-label="Analytics consent"]')) banner();
    };
    document.addEventListener('click', function (e) {
        var r = e.target.closest ? e.target.closest('[data-consent-reset]') : null;
        if (r) { e.preventDefault(); window.vfConsentReset(); }
    });

    // what matters for a portfolio: CV downloads, call bookings, installs and stars
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a, button') : null;
        if (!a || !window.gtag) return;
        var href = a.getAttribute('href') || '';
        var name = null;
        if (/vahid-faraji-cv\.pdf/.test(href)) name = 'cv_download';
        else if (/calendar\.app\.google/.test(href) || a.id === 'hire-book' || /openBooking/.test(a.getAttribute('onclick') || '')) name = 'book_call';
        else if (/marketplace\.visualstudio\.com/.test(href)) name = 'tokalator_install';
        else if (/github\.com\/vfaraji89\/(tokalator|applied-ai-simplified|awesome-applied-ai)\/?$/.test(href)) name = 'github_repo';
        else if (/^mailto:/.test(href)) name = 'email_click';
        if (name) gtag('event', name, { link_url: href, link_text: (a.textContent || '').trim().slice(0, 80), page_group: document.body.dataset.group || location.pathname });
    }, true);

    // Which sections people actually reach: one section_view per section per page view.
    if ('IntersectionObserver' in window) {
        ready(function () {
            var secs = Array.prototype.slice.call(document.querySelectorAll('main section[id], body > section[id]'));
            if (!secs.length) return;
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    io.unobserve(en.target);
                    if (window.gtag) gtag('event', 'section_view', { section: en.target.id });
                });
            }, { threshold: 0.35 });
            secs.forEach(function (s) { io.observe(s); });
        });
    }
})();
