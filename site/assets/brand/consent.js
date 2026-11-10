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
        var bar = document.createElement('div');
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Analytics consent');
        bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:90;max-width:560px;margin:0 auto;' +
            'display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 14px;border-radius:14px;' +
            'background:#fff;color:#1c1c1e;border:1px solid rgba(28,28,30,.14);box-shadow:0 18px 40px -22px rgba(28,28,30,.55);' +
            'font:400 13px/1.45 inherit';
        var text = document.createElement('span');
        text.style.cssText = 'flex:1 1 240px';
        text.textContent = 'This site counts visits with Google Analytics. No ads, no tracking across sites. OK to use an analytics cookie?';
        function btn(label, primary) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.style.cssText = 'font:600 13px/1 inherit;padding:9px 14px;border-radius:999px;cursor:pointer;' +
                (primary ? 'background:#1c1c1e;color:#fff;border:1px solid #1c1c1e' : 'background:#fff;color:#55555a;border:1px solid rgba(28,28,30,.18)');
            return b;
        }
        var yes = btn('OK', true), no = btn('No thanks', false);
        function close(v) { try { localStorage.setItem(KEY, v); } catch (e) {} bar.remove(); }
        yes.addEventListener('click', function () { grant(); close('yes'); });
        no.addEventListener('click', function () { close('no'); });
        bar.appendChild(text); bar.appendChild(no); bar.appendChild(yes);
        document.body.appendChild(bar);
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
        if (name) gtag('event', name);
    }, true);
})();
