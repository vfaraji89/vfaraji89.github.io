/* Broadcast numbers, shared with Applied AI, Simplified: when a headline number scrolls into view,
   each digit rolls on its own reel and the last one lands last, like a mechanical counter. Once it
   lands the plain text comes back, so anything that rewrites the number later (the metric cards
   flip) keeps working. Symbols and letters stay still. Reduced motion: nothing moves. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.metric-num, .proof-strip li > b';
  function roll(el) {
    var text = el.textContent;
    if (!/\d/.test(text) || el.dataset.odo) return;
    el.dataset.odo = '1';
    var html = '', k = 0, longest = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (!/\d/.test(ch)) { html += '<span class="odo-sym">' + ch.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; continue; }
      var col = '';
      for (var d = 0; d < 20; d++) col += '<span>' + (d % 10) + '</span>';
      var dur = 1000 + k * 120, del = 120 + k * 90;
      longest = Math.max(longest, dur + del);
      html += '<span class="odo-reel"><span class="odo-col" data-to="' + (10 + Number(ch)) + '" style="transition-duration:' + dur + 'ms;transition-delay:' + del + 'ms">' + col + '</span></span>';
      k++;
    }
    el.setAttribute('aria-label', text);
    el.innerHTML = '<span class="odo">' + html + '</span>';
    void el.offsetWidth;
    requestAnimationFrame(function () {
      el.querySelectorAll('.odo-col').forEach(function (c) { c.style.transform = 'translateY(-' + c.dataset.to + 'em)'; });
    });
    // restore only if nothing rewrote the number meanwhile (a hover can flip a metric card mid-roll)
    setTimeout(function () { if (el.querySelector('.odo')) el.textContent = text; el.removeAttribute('aria-label'); }, longest + 150);
  }
  function start() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); roll(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll(SEL).forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
