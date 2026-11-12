/* Analytics consent and a few click events.
   Google Analytics starts with storage denied (set in the page head), so no
   cookies are written until the visitor says yes. The choice is remembered. */
(function () {
    var KEY = 'vf-consent';
    function grant() { if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' }); }
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'yes') grant();

    function banner() {
        // a small pill in the corner: one bead, one line, two tiny buttons
        var bar = document.createElement('div');
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Analytics consent');
        bar.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:90;max-width:calc(100vw - 32px);' +
            'display:flex;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:999px;' +
            'background:#fff6f4;color:#1c1c1e;border:1px solid rgba(180,138,92,.45);box-shadow:0 12px 26px -16px rgba(60,30,10,.55);' +
            'font:500 12.5px/1.3 inherit;opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .6s cubic-bezier(.34,1.56,.64,1)';
        var bead = document.createElement('span');
        bead.setAttribute('aria-hidden', 'true');
        bead.style.cssText = 'flex:none;width:14px;height:14px;border-radius:50%;' +
            'background:radial-gradient(circle at 34% 30%,#ff9d8f,#e0301e 45%,#9e1a0c);box-shadow:0 3px 5px -2px rgba(158,26,12,.6)';
        var text = document.createElement('span');
        text.textContent = 'One cookie to count visits?';
        text.title = 'Google Analytics, only to count visits. No ads, no tracking across sites.';
        function btn(label, primary) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.style.cssText = 'font:600 12px/1 inherit;padding:7px 12px;border-radius:999px;cursor:pointer;' +
                (primary ? 'background:#1c1c1e;color:#fff;border:1px solid #1c1c1e' : 'background:transparent;color:#55555a;border:1px solid transparent');
            return b;
        }
        var yes = btn('Sure', true), no = btn('No', false);
        no.setAttribute('aria-label', 'No, do not use an analytics cookie');
        yes.setAttribute('aria-label', 'Sure, use an analytics cookie');
        function close(v) {
            try { localStorage.setItem(KEY, v); } catch (e) {}
            bar.style.opacity = '0'; bar.style.transform = 'translateY(10px)';
            setTimeout(function () { bar.remove(); }, 400);
        }
        yes.addEventListener('click', function () { grant(); close('yes'); });
        no.addEventListener('click', function () { close('no'); });
        bar.appendChild(bead); bar.appendChild(text); bar.appendChild(no); bar.appendChild(yes);
        document.body.appendChild(bar);
        requestAnimationFrame(function () { bar.style.opacity = '1'; bar.style.transform = 'none'; });
    }
    function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
    if (saved === null) ready(function () { setTimeout(banner, 1200); });

    // what matters for a portfolio: CV downloads, call bookings, installs and stars
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a, button') : null;
        if (!a || !window.gtag) return;
        var href = a.getAttribute('href') || '';
        var name = null;
        if (/vahid-faraji-cv\.pdf/.test(href)) name = 'cv_download';
        else if (/calendar\.app\.google/.test(href) || a.id === 'hire-book' || /openBooking/.test(a.getAttribute('onclick') || '')) name = 'book_call';
        else if (/marketplace\.visualstudio\.com/.test(href)) name = 'tokalator_install';
        else if (/github\.com\/vfaraji89\/(tokalator|awesome-applied-ai)\/?$/.test(href)) name = 'github_repo';
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
