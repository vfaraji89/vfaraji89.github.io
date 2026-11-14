// Animated favicon: from the abacus to agents.
// The tab icon counts on an abacus, then its beads lift off the rails and
// regroup as a small agent network around a red lead, then settle back.
// Static icon (assets/icons/favicon.svg) stays for browsers without canvas
// and for anyone who prefers reduced motion.
(function () {
  var INK = '#1c1c1e', RED = '#e0301e', S = 64, U = S / 48, LOOP = 6400;

  // six beads: [x, y] on the abacus (rest), counted across, and as agents
  var REST = [[15.5, 16.5], [22.5, 16.5], [15.5, 24], [22.5, 24], [29.5, 24], [32.5, 31.5]];
  var COUNT = [[26, 16.5], [33, 16.5], [19, 24], [26, 24], [33, 24], [15.5, 31.5]];
  var ORDER = [1, 0, 4, 3, 2, 5];
  var lead = [24, 24], ring = [];
  for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; ring.push([24 + Math.cos(a) * 11.5, 24 + Math.sin(a) * 11.5]); }
  var AGENT = [lead, ring[0], ring[1], ring[2], ring[3], ring[4]];

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
  function seg(t, a, b) { return ease((t - a) / (b - a)); }

  // t in [0, 1): 0-.12 rest, .12-.4 count, .4-.56 regroup, .56-.84 agents, .84-1 settle back
  function frame(g, t) {
    g.clearRect(0, 0, S, S);
    g.save(); g.scale(U, U);
    // frame
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3.5;
    rr(g, 4.75, 4.75, 38.5, 38.5, 10); g.fill(); g.stroke();
    var toAgents = seg(t, 0.4, 0.56) * (1 - seg(t, 0.84, 0.98));
    // rails fade as the beads leave them
    g.globalAlpha = 0.3 * (1 - toAgents); g.lineWidth = 1.6; g.lineCap = 'round';
    [16.5, 24, 31.5].forEach(function (y) { g.beginPath(); g.moveTo(11, y); g.lineTo(37, y); g.stroke(); });
    g.globalAlpha = 1;
    // bead positions
    var pos = REST.map(function (r, i) {
      var o = ORDER[i], c = seg(t, 0.12 + o * 0.04, 0.24 + o * 0.04);   // counted one by one, rightmost first
      var back = seg(t, 0.86, 1);
      var p = mix(r, COUNT[i], c * (1 - back));
      return mix(p, AGENT[i], toAgents);
    });
    // edges draw in once the beads are agents
    var edges = seg(t, 0.5, 0.62) * (1 - seg(t, 0.82, 0.9));
    if (edges > 0) {
      g.strokeStyle = INK; g.globalAlpha = 0.55 * edges; g.lineWidth = 1.5;
      for (var i = 1; i < 6; i++) { g.beginPath(); g.moveTo(pos[0][0], pos[0][1]); g.lineTo(pos[0][0] + (pos[i][0] - pos[0][0]) * edges, pos[0][1] + (pos[i][1] - pos[0][1]) * edges); g.stroke(); }
      g.globalAlpha = 1;
      // a message travels from the lead to one agent and back
      var m = (t - 0.6) / 0.22;
      if (m > 0 && m < 1) {
        var j = 1 + Math.floor(m * 5) % 5, f = (m * 5) % 1, q = mix(pos[0], pos[j], f < 0.5 ? f * 2 : 2 - f * 2);
        g.fillStyle = RED; g.beginPath(); g.arc(q[0], q[1], 1.5, 0, 7); g.fill();
      }
    }
    // beads: the first one is the red lead
    pos.forEach(function (p, i) {
      var r = 3.4 + (i === 0 ? 0.9 * toAgents + 0.5 * toAgents * Math.sin(t * Math.PI * 18) : 0);
      // a bead, not a dot: lit from the top left, darker at the rim (the site's bead gradient)
      var hl = g.createRadialGradient(p[0] - r * 0.32, p[1] - r * 0.4, 0, p[0], p[1], r);
      if (i === 0) { hl.addColorStop(0, '#ffb3a8'); hl.addColorStop(0.12, '#ff8f80'); hl.addColorStop(0.5, RED); hl.addColorStop(1, '#9e1a0c'); }
      else { hl.addColorStop(0, '#8a8a90'); hl.addColorStop(0.2, '#4a4a50'); hl.addColorStop(0.6, INK); hl.addColorStop(1, '#000'); }
      g.fillStyle = hl;
      g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
    });
    g.restore();
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  window.vfFaviconFrame = frame;

  if (typeof document === 'undefined' || !document.createElement('canvas').getContext) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var link = document.querySelector('link[rel~="icon"]');
  if (!link) return;
  var cv = document.createElement('canvas'); cv.width = cv.height = S;
  var g = cv.getContext('2d'), t0 = performance.now(), last = -1;
  function tick() {
    var t = ((performance.now() - t0) % LOOP) / LOOP;
    var step = Math.floor(t * 64);                       // ~10 fps is plenty for a tab icon
    if (step !== last) {
      last = step; frame(g, t);
      var fresh = link.cloneNode(); fresh.type = 'image/png'; fresh.href = cv.toDataURL('image/png');
      link.parentNode.replaceChild(fresh, link); link = fresh;
    }
    setTimeout(tick, 100);
  }
  // start after the page has settled
  setTimeout(tick, 1200);
})();
