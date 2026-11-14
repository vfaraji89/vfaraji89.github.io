/* Case stories: each case study plays as a short story, one beat at a time:
   Problem, then Approach, then Result, along a bead rod.
   The text is the card's own (already translated) rows; this only stages them.
   It plays once when the card comes into view; the beads and the play button replay or jump.
   Without JavaScript, or with reduced motion, the rows stay as a plain list (reduced motion still gets the steps, no autoplay). */
(function () {
  var DWELL = 5200;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bodies = Array.prototype.slice.call(document.querySelectorAll('.case-card .case-body'));
  if (!bodies.length) return;

  function label(row) { var l = row.querySelector('.case-row-label'); return l ? l.textContent.trim() : ''; }

  var stories = bodies.map(function (body, n) {
    var rows = Array.prototype.slice.call(body.querySelectorAll(':scope > .case-row'));
    if (rows.length < 2) return null;
    var card = body.closest('.case-card');
    var det = body.closest('details'); if (det) { det.open = true; det.classList.add('is-story'); }
    body.classList.add('cs-stage');
    rows.forEach(function (r, i) { r.classList.add('beat', 'beat-' + i); r.setAttribute('role', 'tabpanel'); r.id = r.id || ('st-' + n + '-' + i); });

    var bar = document.createElement('div'); bar.className = 'cs-bar';
    var play = document.createElement('button'); play.type = 'button'; play.className = 'cs-play';
    play.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-play" d="M5 3.2v9.6L12.6 8z"/><path class="i-pause" d="M4.6 3.4h2.4v9.2H4.6zM9 3.4h2.4v9.2H9z"/></svg>';
    var rail = document.createElement('div'); rail.className = 'cs-rail'; rail.setAttribute('role', 'tablist');
    var rod = document.createElement('span'); rod.className = 'cs-rod'; rod.innerHTML = '<i></i>'; rail.appendChild(rod);
    var stops = rows.map(function (r, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cs-stop'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', r.id);
      b.style.setProperty('--x', rows.length > 1 ? (i / (rows.length - 1)) : 0);
      b.innerHTML = '<span class="cs-bead" aria-hidden="true"></span><span class="cs-lab"></span>';
      rail.appendChild(b); return b;
    });
    bar.appendChild(play); bar.appendChild(rail);
    body.parentNode.insertBefore(bar, body);

    var s = { card: card, body: body, rows: rows, stops: stops, play: play, rod: rod.firstChild, i: 0, playing: false, t: 0, done: false };
    stops.forEach(function (b, i) { b.addEventListener('click', function () { s.done = true; stop(s); go(s, i); }); });
    play.addEventListener('click', function () {
      s.done = true;
      if (s.playing) return stop(s);
      if (s.i >= s.rows.length - 1) go(s, 0);
      start(s);
    });
    go(s, 0);
    return s;
  }).filter(Boolean);

  function paint(s) {
    s.stops.forEach(function (b, i) {
      b.querySelector('.cs-lab').textContent = label(s.rows[i]);
      b.classList.toggle('is-on', i === s.i); b.classList.toggle('is-past', i < s.i);
      b.setAttribute('aria-selected', i === s.i ? 'true' : 'false'); b.tabIndex = i === s.i ? 0 : -1;
    });
    s.rows.forEach(function (r, i) { r.classList.toggle('is-on', i === s.i); r.classList.toggle('is-past', i < s.i); r.setAttribute('aria-hidden', i === s.i ? 'false' : 'true'); });
    s.body.setAttribute('data-beat', s.i);
    s.play.classList.toggle('is-playing', s.playing);
    s.play.setAttribute('aria-label', s.playing ? 'Pause the story' : (s.i >= s.rows.length - 1 ? 'Replay the story' : 'Play the story'));
  }
  function fill(s, k) { var n = s.rows.length - 1; s.rod.style.transform = 'scaleX(' + Math.min(1, (s.i + k) / n) + ')'; }
  function go(s, i) { s.i = Math.max(0, Math.min(s.rows.length - 1, i)); fill(s, 0); paint(s); }
  function start(s) { s.playing = true; s.t = performance.now(); paint(s); }
  function stop(s) { s.playing = false; fill(s, 0); paint(s); }

  // keyboard: arrows move along the rod
  stories.forEach(function (s) {
    s.stops.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); s.done = true; stop(s); go(s, i + d); s.stops[s.i].focus();
      });
    });
  });

  // the clock: one loop for every story; the playing one advances, its rod fills as the beat runs
  function tick(now) {
    requestAnimationFrame(tick);
    stories.forEach(function (s) {
      if (!s.playing) return;
      var k = (now - s.t) / DWELL;
      if (k >= 1) {
        if (s.i >= s.rows.length - 1) { s.done = true; stop(s); return; }
        go(s, s.i + 1); s.t = now; k = 0;
      }
      fill(s, s.i >= s.rows.length - 1 ? 0 : k);
    });
  }
  requestAnimationFrame(tick);

  // plays when most of the card is on screen (a scroll check: it works on iPhone Safari too)
  if (still) return;
  function check() {
    var vh = window.innerHeight;
    stories.forEach(function (s) {
      var r = s.body.getBoundingClientRect();
      var seen = r.top < vh * 0.78 && r.bottom > vh * 0.2;
      // plays on its own until it finishes or is touched; scrolling away pauses it, coming back resumes
      if (seen && !s.done && !s.playing) start(s);
      else if (!seen && s.playing) stop(s);
    });
  }
  // capture, so it also hears a scrolling element other than the window (the phone layout scrolls the body)
  document.addEventListener('scroll', check, { passive: true, capture: true });
  window.addEventListener('resize', check);
  setInterval(check, 700);
})();
