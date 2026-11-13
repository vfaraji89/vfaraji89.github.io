/* Broadcast reveal (see broadcast.css). Panels below the fold wait closed; as each scrolls in it
   opens from the centre, panels in the same row one after another. Chip rows pop from the middle
   out: rows inside a panel when that panel opens, other rows as they scroll in. Anything already
   on screen is left alone, so nothing visible ever blinks.
   Two things this guards against:
   - Chrome measures a target's visibility through its own clip-path, so a closed panel reports
     no visible area; panels are watched at threshold 0 (any overlap with the view counts).
   - i18n.js re-renders translated blocks from HTML it saved, which can carry these classes onto
     new elements; a mutation watcher adopts such copies (or shows them at once if on screen),
     so nothing can stay hidden.
   Opt in per page with:  <link rel="stylesheet" href="assets/brand/broadcast.css"> and this file. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PANELS = '.case-card, .about-card, .metric-card, .pub-card, .news-card, .gallery-card, .principle-card, .abacus-frame, .story-step, .recruiter-card';
  var CHIPS = '.case-tag, .bio-tag, .domain, .sb, .case-stack > span, .chip, .tag';
  var below = function (el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; };
  var seen = new WeakSet();

  function strip(el) { el.classList.remove('bc-wait', 'bc-open', 'bc-posts', 'bc-chip', 'bc-pop'); el.style.removeProperty('--bc-d'); }

  /* ---------- chips ---------- */
  function popRow(row, delay) {
    var list = [].slice.call(row.querySelectorAll(':scope > .bc-chip'));
    var mid = (list.length - 1) / 2;
    list.forEach(function (c, i) {
      var d = (delay || 0) + Math.abs(i - mid) * 55;
      c.style.setProperty('--bc-d', d + 'ms');
      c.classList.add('bc-pop');
      setTimeout(function () { strip(c); }, d + 800);
    });
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); popRow(e.target, 120); } });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  function adoptChip(c) {
    seen.add(c);
    if (c.closest('[hidden]') || !below(c)) { strip(c); return; }
    c.classList.add('bc-chip');
    var row = c.parentElement;
    if (!row.closest('.bc-wait')) cio.observe(row); // rows in a waiting panel pop when it opens
  }

  /* ---------- panels ---------- */
  var free = function (el) { var b = getComputedStyle(el, '::before').content, a = getComputedStyle(el, '::after').content; return (b === 'none' || b === 'normal') && (a === 'none' || a === 'normal'); };
  var pio = new IntersectionObserver(function (es) {
    var arriving = es.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
    arriving.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
    arriving.forEach(function (el, i) {
      pio.unobserve(el);
      var d = Math.min(i, 5) * 120;
      el.style.setProperty('--bc-d', d + 'ms');
      el.classList.add('bc-open');
      el.classList.remove('bc-wait');
      var rows = new Set(); [].forEach.call(el.querySelectorAll('.bc-chip'), function (c) { rows.add(c.parentElement); });
      rows.forEach(function (row) { popRow(row, d + 620); });
      setTimeout(function () { strip(el); }, 1700 + d); // give hover shadows and flips their full box back
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  function adoptPanel(el) {
    seen.add(el);
    if (el.closest('[hidden]') || !below(el) || el.parentElement.closest(PANELS)) { strip(el); return; }
    el.classList.add('bc-wait'); if (free(el)) el.classList.add('bc-posts');
    pio.observe(el);
  }

  [].forEach.call(document.querySelectorAll(PANELS), adoptPanel);
  [].forEach.call(document.querySelectorAll(CHIPS), adoptChip);

  // copies made by re-rendering (translations) carry the classes but nobody watches them
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      [].forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return;
        var found = [].slice.call(n.querySelectorAll('.bc-wait, .bc-chip')); if (n.matches('.bc-wait, .bc-chip')) found.push(n);
        found.forEach(function (el) {
          if (seen.has(el)) return;
          if (el.classList.contains('bc-wait')) { strip(el); adoptPanel(el); } else { strip(el); adoptChip(el); }
        });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
