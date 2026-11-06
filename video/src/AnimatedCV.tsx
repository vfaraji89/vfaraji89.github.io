// Vahid Faraji -- a 60-second animated CV.
// A story in seven beats: who I am, languages, data and its context, models put to work,
// Tokalator, what you can count on, and a wooden abacus that spells the name.
// Same palette, type and beads as vfaraji89.github.io. Render: npm run render
import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import tone from './tone.json';
import icons from './icons.json';

export const FPS = 30;
export const TOTAL = 60 * FPS;

const C = {
  ink: '#1c1c1e', red: '#e0301e', deep: '#b4200f', mark: '#ffdcd6', paper: '#fff6f4',
  line: 'rgba(28,28,30,0.14)', muted: '#8a8a90', sec: '#55555a',
};
const SANS = '"Vahid Sora", sans-serif';
const MONO = '"Geist Mono", monospace';
const PIXEL = '"Geist Pixel Circle", monospace';

// ---- fonts: hold the render until the brand faces are in ----------------------
const FONTS: [string, string, string][] = [
  ['Vahid Sora', 'VahidSora-Regular.woff2', '400'],
  ['Vahid Sora', 'VahidSora-SemiBold.woff2', '600'],
  ['Vahid Sora', 'VahidSora-Bold.woff2', '700'],
  ['Vahid Sora', 'VahidSora-ExtraBold.woff2', '800'],
  ['Geist Mono', 'GeistMono-Variable.woff2', '100 900'],
  ['Geist Pixel Circle', 'GeistPixel-Circle.woff2', '400'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('brand fonts');
  Promise.all(FONTS.map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${staticFile('fonts/' + file)})`, { weight });
    return f.load().then((l) => { document.fonts.add(l); });
  })).then(() => continueRender(h)).catch(() => continueRender(h));
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const fadeUp = (f: number, start: number, dur = 18, dist = 24) => ({
  opacity: interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }),
  transform: `translateY(${interpolate(f, [start, start + dur], [dist, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })}px)`,
});
const fadeOut = (f: number, end: number, dur = 12) =>
  interpolate(f, [end - dur, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// ---- shared pieces ------------------------------------------------------------
const Bead: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({ size, color, style }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: color,
    backgroundImage: 'radial-gradient(circle at 34% 30%, rgba(255,255,255,0.75) 0 14%, rgba(255,255,255,0) 22%)',
    boxShadow: `inset -${size * 0.08}px -${size * 0.08}px 0 rgba(0,0,0,0.18), 0 0 0 ${Math.max(2, size * 0.07)}px ${C.ink}`,
    ...style,
  }} />
);

// ---- the abacus icon kit (same symbols as the site) -----------------------------
const AbIcon: React.FC<{ name: string; size: number; pop?: number; color?: string }> = ({ name, size, pop = 1, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', color, transform: `scale(${pop})`, overflow: 'visible' }}
    dangerouslySetInnerHTML={{ __html: (icons as Record<string, string>)[name] }} />
);
const IconTile: React.FC<{ name: string; size?: number; pop?: number; on?: boolean }> = ({ name, size = 84, pop = 1, on = true }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: '#fff', border: `2px solid ${on ? C.ink : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? '0 18px 30px -20px rgba(28,28,30,0.6)' : 'none', transform: `scale(${pop})`, opacity: Math.min(1, pop) }}>
    <AbIcon name={name} size={size * 0.62} color={on ? C.ink : C.muted} />
  </div>
);

const Mark: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="1" y="1" width="22" height="22" rx="5" stroke={C.ink} strokeWidth="1.5" />
    <path d="M5 8h14M5 12h14M5 16h14" stroke="rgba(28,28,30,0.22)" strokeWidth="1" />
    <circle cx="7.5" cy="8" r="1.9" fill={C.red} />
    <circle cx="15.5" cy="12" r="1.9" fill={C.ink} />
    <circle cx="9" cy="16" r="1.9" fill={C.ink} />
  </svg>
);

const Brand: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 56, left: 80, right: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...fadeUp(f, 0, 20, 0) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Mark />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: '-0.01em' }}>
          Vahid Faraji<span style={{ color: C.red }}>.</span>
        </span>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: '0.08em' }}>ANIMATED CV · 60 SECONDS</span>
    </div>
  );
};

// the narration, as a caption on a blush strip with a red bead
const Caption: React.FC<{ text: string; start: number; end: number }> = ({ text, start, end }) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const words = text.split(' ');
  const shown = Math.floor(interpolate(f, [start, start + Math.min(60, (end - start) * 0.55)], [0, words.length], { extrapolateRight: 'clamp' }));
  const op = Math.min(interpolate(f, [start, start + 8], [0, 1], { extrapolateRight: 'clamp' }), fadeOut(f, end, 10));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center', opacity: op }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1400, padding: '18px 30px', borderRadius: 18, background: 'rgba(255,255,255,0.92)', border: `1px solid ${C.line}`, boxShadow: '0 20px 40px -28px rgba(28,28,30,0.5)' }}>
        <Bead size={16} color={C.red} style={{ boxShadow: 'none', flex: 'none' }} />
        <span style={{ fontFamily: SANS, fontSize: 34, color: C.ink, lineHeight: 1.35 }}>
          {words.map((w, i) => (
            <span key={i} style={{ opacity: i < shown ? 1 : 0.18, transition: 'none' }}>{w} </span>
          ))}
        </span>
      </div>
    </div>
  );
};

// the timer: a small abacus that counts the seconds, tens on top, ones below.
// Counted beads sit on the left of each rail, the next one slides over as the second ticks.
const Timer: React.FC = () => {
  const f = useCurrentFrame();
  const sec = f / FPS;
  const whole = Math.floor(sec), frac = sec - whole;
  const tens = Math.floor(whole / 10), ones = whole % 10;
  const slide = Easing.bezier(0.34, 1.4, 0.5, 1)(Math.min(1, frac * 4));   // the bead lands in the first quarter second
  const W = 300, gap = 22, size = 15;
  const rail = (count: number, total: number, y: number, moving: boolean, color: (k: number) => string) => (
    <div style={{ position: 'absolute', left: 0, top: y, width: W, height: size }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: size / 2 - 1, height: 2, background: C.ink, opacity: 0.35, borderRadius: 2 }} />
      {Array.from({ length: total }).map((_, k) => {
        const counted = k < count;
        const isNext = k === count && moving;
        const leftX = k * gap, rightX = W - (total - k) * gap + (gap - size);
        const x = counted ? leftX : isNext ? rightX + (leftX - rightX) * slide : rightX;
        return <div key={k} style={{ position: 'absolute', left: x, top: 0 }}><Bead size={size} color={counted || isNext ? color(k) : '#d8d5cf'} style={{ boxShadow: 'none' }} /></div>;
      })}
    </div>
  );
  const mm = Math.floor(whole / 60), ss = String(whole % 60).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', left: 80, bottom: 40, display: 'flex', alignItems: 'center', gap: 26, padding: '14px 22px 14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.9)', border: `1px solid ${C.line}` }}>
      <div style={{ position: 'relative', width: W, height: size * 2 + 10 }}>
        {rail(tens, 6, 0, ones === 9 && frac > 0.75, () => C.red)}
        {rail(ones, 10, size + 10, true, (k) => (k === 4 ? C.deep : C.ink))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: C.ink, letterSpacing: '0.04em' }}>{mm}:{ss}<span style={{ color: C.muted }}> / 1:00</span></div>
    </div>
  );
};

// ---- the halftone portrait ----------------------------------------------------
const N = 64;
export type Medium = 'halftone' | 'pixels' | 'lines' | 'letters' | 'network';
const GLYPHS = ' .:;ilcoaeshmHMW';
const toneRGB = (d: number) => { const v = Math.round(244 - d * 228); return `rgb(${v},${v - 3},${v - 9})`; };
const Halftone: React.FC<{ progress: number; size: number; lensX?: number; lensY?: number; medium?: Medium }> = ({ progress, size, lensX, lensY, medium = 'halftone' }) => {
  const cell = size / N;
  const dots: React.ReactNode[] = [];
  const T = tone as number[][];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const d = T[r][c];
    if (medium !== 'pixels' && d < 0.04) continue;
    const k = Math.max(0, Math.min(1, (progress * 1.7 - (r + c) / (2 * N - 2)) * 3));
    if (k <= 0) continue;
    const x = (c + 0.5) * cell, y = (r + 0.5) * cell;
    let lens = 1;
    if (lensX !== undefined && lensY !== undefined) {
      const q = Math.max(0, 1 - Math.hypot(x - lensX, y - lensY) / (size * 0.16));
      lens = 1 + 0.9 * q * q;
    }
    const key = r * N + c;
    if (medium === 'pixels') {
      const w = cell * lens * k;
      dots.push(<rect key={key} x={x - w / 2} y={y - w / 2} width={w + 0.5} height={w + 0.5} fill={toneRGB(d)} />);
    } else if (medium === 'lines') {
      const amp = cell * 0.6 * Math.pow(d, 1.2) * lens * k;
      dots.push(<line key={key} x1={x - cell / 2} y1={y + Math.sin(c * 1.1 + r * 0.7) * amp} x2={x + cell / 2} y2={y + Math.sin((c + 1) * 1.1 + r * 0.7) * amp} stroke={C.ink} strokeWidth={(0.4 + 2.4 * Math.pow(d, 1.4)) * size / 208} strokeLinecap="round" />);
    } else if (medium === 'letters') {
      const ch = GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(Math.pow(d, 0.75) * GLYPHS.length))];
      if (ch !== ' ') dots.push(<text key={key} x={x} y={y} fontFamily={MONO} fontWeight={700} fontSize={cell * 1.35 * lens} textAnchor="middle" dominantBaseline="central" fill={toneRGB(Math.min(1, 0.25 + d))} opacity={k}>{ch}</text>);
    } else if (medium === 'network') {
      if (d < 0.3) continue;
      const sw = (0.3 + 0.9 * d) * size / 208;
      if (c + 1 < N && T[r][c + 1] > 0.3) dots.push(<line key={key + 'h'} x1={x} y1={y} x2={x + cell} y2={y} stroke={C.ink} strokeWidth={sw} opacity={k} />);
      if (r + 1 < N && T[r + 1][c] > 0.3) dots.push(<line key={key + 'v'} x1={x} y1={y} x2={x} y2={y + cell} stroke={C.ink} strokeWidth={sw} opacity={k} />);
      dots.push(<circle key={key} cx={x} cy={y} r={cell * 0.32 * Math.sqrt(d) * lens * k} fill={(r * 7 + c * 13) % 53 === 0 && d > 0.45 ? C.red : C.ink} />);
    } else {
      dots.push(<circle key={key} cx={x} cy={y} r={cell * 0.6 * Math.sqrt(d) * k * lens} fill={C.ink} />);
    }
  }
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <rect width={size} height={size} fill={C.paper} rx={18} />
      {dots}
    </svg>
  );
};

const Cursor: React.FC<{ x: number; y: number; label?: string }> = ({ x, y, label = 'Vahid' }) => (
  <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
    <svg width="34" height="34" viewBox="0 0 26 26"><path d="M2 2l20 7.5-9.5 3-3 9.5z" fill={C.red} stroke={C.red} strokeWidth="2.2" strokeLinejoin="round" /></svg>
    <div style={{ position: 'absolute', left: 30, top: 30, padding: '8px 18px', borderRadius: 999, background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 24, boxShadow: '0 6px 14px rgba(28,28,30,0.25)' }}>{label}</div>
  </div>
);

// ---- scene 1: hello -------------------------------------------------------------
const Hello: React.FC = () => {
  const f = useCurrentFrame();
  const size = 560;
  const px = 1180, py = 210;
  const p = interpolate(f, [0, 75], [0, 1], { extrapolateRight: 'clamp' });
  // the cursor flies in, then hovers over the face
  const t = interpolate(f, [30, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const hx = px + 300 + Math.sin(f / 9) * 40, hy = py + 260 + Math.cos(f / 11) * 30;
  const cx = interpolate(t, [0, 1], [1850, hx]), cy = interpolate(t, [0, 1], [1000, hy]) - Math.sin(t * Math.PI) * 120;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: px, top: py, borderRadius: 18, boxShadow: '0 30px 60px -40px rgba(28,28,30,0.6)' }}>
        <Halftone progress={p} size={size} lensX={f > 60 ? cx - px : undefined} lensY={f > 60 ? cy - py : undefined} />
      </div>
      <div style={{ position: 'absolute', left: 120, top: 330, width: 900 }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep, ...fadeUp(f, 12) }}>HELLO</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, lineHeight: 1.02, letterSpacing: '-0.04em', color: C.ink, marginTop: 18, ...fadeUp(f, 22) }}>
          I&rsquo;m Vahid<span style={{ color: C.red }}>.</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 40, color: C.sec, marginTop: 30, lineHeight: 1.35, ...fadeUp(f, 40) }}>
          I build agent systems teams actually put into production.
        </div>
      </div>
      <Cursor x={cx} y={cy} />
    </AbsoluteFill>
  );
};

// ---- scene 2: who ---------------------------------------------------------------
const PHRASES: [string, string][] = [
  ['is an', 'AI-native architect'], ['is fluent in', 'data'], ['loves', 'creative data products'],
  ['is proficient in', 'MCP'], ['builds', 'agent harnesses'], ['ships with', 'evals'],
];
const Who: React.FC = () => {
  const f = useCurrentFrame();
  const per = 34;
  const i = Math.min(PHRASES.length - 1, Math.floor(f / per));
  const lf = f - i * per;
  const sweep = interpolate(lf, [4, 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const wordIn = interpolate(lf, [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: ease });
  const headStart = PHRASES.length * per - 10;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 160 }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 84, letterSpacing: '-0.03em', color: C.ink, opacity: fadeOut(f, headStart + 6) }}>
        <span style={{ color: C.red }}>Vahid</span>{' '}
        <span style={{ display: 'inline-block', opacity: wordIn, transform: `translateY(${(1 - wordIn) * 30}px)`, filter: `blur(${(1 - wordIn) * 6}px)` }}>
          {PHRASES[i][0]}{' '}
          <span style={{ backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${sweep}% 72%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', padding: '0 0.12em' }}>{PHRASES[i][1]}</span>.
        </span>
      </div>
      <div style={{ position: 'absolute', left: 160, top: 400, fontFamily: SANS, fontWeight: 800, fontSize: 150, lineHeight: 1, letterSpacing: '-0.045em', color: C.ink, ...fadeUp(f, headStart + 4, 20, 40) }}>
        Agents you can<br />count on<span style={{ color: C.red }}>.</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- scene 3: from the abacus to agents ----------------------------------------
const STATIONS = [
  { verb: 'Count', sub: 'Economics, evidence', sk: 'M.A. Economics · Econometrics' },
  { verb: 'Compute', sub: 'Data that answers', sk: 'SQL · BigQuery · Synapse' },
  { verb: 'Build', sub: 'Software, end to end', sk: 'TypeScript 7 · Python · Next.js' },
  { verb: 'Scale', sub: 'Platforms, governance', sk: 'Vercel · Azure · DataHub' },
  { verb: 'Orchestrate', sub: 'Agents in production', sk: 'Claude Agent SDK · MCP · Langfuse' },
];
const Journey: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = 56;
  const at = Math.min(STATIONS.length - 1, Math.floor((f - 20) / per));
  const left = 160, width = 1600, step = width / (STATIONS.length - 1);
  const target = Math.max(0, at) * step;
  const sp = spring({ frame: f - 20 - Math.max(0, at) * per, fps, config: { damping: 11, stiffness: 120 } });
  const prev = Math.max(0, at - 1) * step;
  const bx = at <= 0 ? interpolate(f, [10, 30], [-40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : prev + (target - prev) * sp;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left, top: 200, ...fadeUp(f, 0) }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep }}>THROUGH THE TOOLS</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', color: C.ink, marginTop: 10 }}>From the abacus to agents<span style={{ color: C.red }}>.</span></div>
      </div>
      <div style={{ position: 'absolute', left: left - 40, width: width + 80, top: 560, height: 3, background: C.ink, opacity: 0.85, borderRadius: 3 }} />
      {STATIONS.map((s, i) => {
        const on = i <= at && f >= 20;
        const appear = fadeUp(f, 8 + i * 6, 16, 18);
        return (
          <div key={s.verb} style={{ position: 'absolute', left: left + i * step - 150, top: 440, width: 300, textAlign: 'center', ...appear }}>
            <div style={{ width: 84, height: 84, margin: '0 auto', borderRadius: 22, border: `2px solid ${on ? C.ink : C.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? '0 18px 30px -20px rgba(28,28,30,0.6)' : 'none' }}>
              <span style={{ fontFamily: MONO, fontSize: 28, color: on ? C.red : C.muted }}>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div style={{ marginTop: 92, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: on ? C.ink : C.muted, letterSpacing: '-0.02em' }}>{s.verb}</div>
            <div style={{ fontFamily: SANS, fontSize: 24, color: C.sec, marginTop: 6 }}>{s.sub}</div>
            <div style={{ fontFamily: MONO, fontSize: 19, color: on ? C.sec : C.muted, marginTop: 12, lineHeight: 1.45 }}>{s.sk}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: left + bx - 22, top: 539 }}><Bead size={44} color={C.red} /></div>
    </AbsoluteFill>
  );
};

// ---- scene 4: the work ------------------------------------------------------------
type Work = { tag: string; name: string; line: string; stats: [number, string, string][]; img: string; fit: 'contain' | 'cover' };
const WORKS: Work[] = [
  { tag: 'OPEN SOURCE · TOKALATOR.AI', name: 'Tokalator', line: 'Context engineering toolkit for AI coding assistants.', stats: [[500, '+', 'installs'], [17, '', 'models'], [1, '', 'arXiv paper']], img: 'img/tokalator-vscode.png', fit: 'cover' },
  { tag: 'RESEARCH · ACM CAIS ’26', name: 'Multi-agent classification', line: 'MCP agents that map free-text job titles to O*NET / ESCO.', stats: [[95, '%', 'accuracy'], [14, 'K+', 'positions'], [72.5, '%', 'faster']], img: 'img/pms-dashboard.png', fit: 'cover' },
  { tag: 'IN PRODUCTION · KARIYER.NET', name: 'ProjectLens', line: 'Pricing, end to end: request, effort, price, proposal.', stats: [[91, '%', 'effort removed'], [59, 'h', 'freed'], [31, '', 'spreadsheets retired']], img: 'img/projectlens-login.jpg', fit: 'cover' },
  { tag: 'OPEN SOURCE · MAP', name: 'awesome-applied-ai', line: 'A working map of applied AI for the enterprise.', stats: [[6, '', 'layers'], [1, '', 'live tool index'], [0, '', '']], img: '', fit: 'cover' },
];
const Layers: React.FC<{ f: number }> = ({ f }) => {
  const names = ['Guardrails & Governance', 'Evaluation & Observability', 'Orchestration', 'Caching', 'Memory', 'Retrieval'];
  return (
    <div style={{ width: '100%', height: '100%', background: C.paper, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '0 70px' }}>
      {names.map((n, i) => {
        const k = interpolate(f, [12 + i * 6, 30 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1, position: 'relative', height: 3, background: 'rgba(28,28,30,0.25)' }}>
              <div style={{ position: 'absolute', top: -13, left: `${k * 70}%` }}><Bead size={28} color={i === 0 ? C.red : i % 2 ? C.deep : C.mark} /></div>
            </div>
            <span style={{ width: 380, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.ink }}>{n}</span>
          </div>
        );
      })}
    </div>
  );
};
const WorkCard: React.FC<{ w: Work; index: number }> = ({ w, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 14, stiffness: 110 } });
  const out = fadeOut(f, 150, 12);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: 'absolute', left: 120, top: 220, width: 760 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: '0.1em', color: C.deep, ...fadeUp(f, 4) }}>{String(index + 1).padStart(2, '0')} / 04 · {w.tag}</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 86, letterSpacing: '-0.04em', lineHeight: 1.02, color: C.ink, marginTop: 16, ...fadeUp(f, 8) }}>{w.name}<span style={{ color: C.red }}>.</span></div>
        <div style={{ fontFamily: SANS, fontSize: 34, color: C.sec, marginTop: 22, lineHeight: 1.35, ...fadeUp(f, 14) }}>{w.line}</div>
        <div style={{ display: 'flex', gap: 22, marginTop: 50 }}>
          {w.stats.filter((s) => s[2]).map(([n, suf, label], i) => {
            const v = interpolate(f, [18 + i * 8, 58 + i * 8], [0, n], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
            const txt = n % 1 ? v.toFixed(1) : Math.round(v).toString();
            return (
              <div key={label} style={{ flex: 1, padding: '22px 24px', borderRadius: 18, background: C.paper, border: '1px solid rgba(224,48,30,0.15)', ...fadeUp(f, 16 + i * 6) }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, color: C.red, letterSpacing: '-0.03em' }}>{txt}{suf}</div>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.sec, marginTop: 6 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 960, top: 190, width: 840, height: 640, borderRadius: 26, overflow: 'hidden', border: `1px solid ${C.line}`, background: '#fff', boxShadow: '0 40px 70px -45px rgba(28,28,30,0.6)', transform: `translateY(${(1 - pop) * 60}px) scale(${0.94 + 0.06 * pop})`, opacity: pop }}>
        {w.img ? <Img src={staticFile(w.img)} style={{ width: '100%', height: '100%', objectFit: w.fit, objectPosition: 'top center' }} /> : <Layers f={f} />}
      </div>
    </AbsoluteFill>
  );
};

// ---- scene 5: through-line ------------------------------------------------------------
const STAGES = [['2013–15', 'Business administration'], ['2015–18', 'Research'], ['2019–21', 'Defaro.io, co-founder'], ['2019–23', 'M.A. Economics'], ['2022–25', 'Kariyer.net, data products'], ['2025–', 'Applied AI']];
const STAGE_ICONS = ['abacus', 'page', 'branch', 'cap', 'bars', 'agents'];
const Through: React.FC = () => {
  const f = useCurrentFrame();
  const rod = interpolate(f, [0, 40], [0, 1], { extrapolateRight: 'clamp', easing: ease });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 160, top: 260, ...fadeUp(f, 0) }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep }}>THROUGH-LINE</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 160, letterSpacing: '-0.05em', color: C.ink, lineHeight: 1, marginTop: 14 }}>8 + 4</div>
        <div style={{ fontFamily: SANS, fontSize: 40, color: C.sec, marginTop: 18 }}>years in industry + years in research</div>
      </div>
      <div style={{ position: 'absolute', left: 1080, top: 175, height: 580 * rod, width: 4, background: C.ink, borderRadius: 4 }} />
      {STAGES.map(([y, t], i) => {
        const a = fadeUp(f, 10 + i * 7, 14, 12);
        const now = i === STAGES.length - 1;
        return (
          <div key={y} style={{ position: 'absolute', left: 1062, top: 165 + i * 108, display: 'flex', alignItems: 'center', gap: 34, ...a }}>
            <Bead size={40} color={now ? C.red : i % 2 ? C.deep : C.mark} />
            <span style={{ fontFamily: MONO, fontSize: 26, color: C.sec, width: 150 }}>{y}</span>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: now ? C.red : C.ink }}>{t}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- scene 6: call to action --------------------------------------------------------
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 120, top: 230, ...fadeUp(f, 0) }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, letterSpacing: '-0.045em', color: C.ink, lineHeight: 1 }}>Agents you can count on<span style={{ color: C.red }}>.</span></div>
        <div style={{ display: 'flex', gap: 22, marginTop: 50 }}>
          <div style={{ padding: '22px 36px', borderRadius: 14, background: C.ink, color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 36, display: 'flex', alignItems: 'center', gap: 16 }}><Bead size={18} color={C.red} style={{ boxShadow: 'none' }} />Book a call</div>
          <div style={{ padding: '22px 36px', borderRadius: 14, border: `2px solid ${C.line}`, background: '#fff', color: C.ink, fontFamily: SANS, fontWeight: 600, fontSize: 36 }}>vfaraji89.github.io</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 90, right: 0, bottom: 150, fontFamily: PIXEL, fontSize: 330, lineHeight: 0.8, color: C.ink, ...fadeUp(f, 10, 24, 40) }}>vahid<span style={{ color: C.red }}>.</span></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 160, height: 3, background: C.ink, opacity: 0.85 }} />
      {[0.08, 0.2, 0.33, 0.46, 0.58, 0.71, 0.84, 0.93].map((x, i) => {
        const drop = spring({ frame: f - 14 - i * 3, fps, config: { damping: 9, stiffness: 140 } });
        return <div key={i} style={{ position: 'absolute', left: `${x * 100}%`, bottom: 140, transform: `translateY(${(1 - drop) * -300}px)`, opacity: drop }}><Bead size={i % 3 === 0 ? 44 : 32} color={i % 3 === 0 ? C.red : i % 3 === 1 ? C.mark : C.deep} /></div>;
      })}
    </AbsoluteFill>
  );
};

// ================= the story =================
// One arc, abacus to agents: counting, scale, the harness, Tokalator, production,
// the through-line, the invitation.

const Kicker: React.FC<{ f: number; text: string; at?: number }> = ({ f, text, at = 0 }) => (
  <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep, ...fadeUp(f, at) }}>{text}</div>
);
const Big: React.FC<{ f: number; at?: number; size?: number; children: React.ReactNode }> = ({ f, at = 6, size = 104, children }) => (
  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.045em', color: C.ink, marginTop: 16, ...fadeUp(f, at, 20, 30) }}>{children}</div>
);
const Dot = () => <span style={{ color: C.red }}>.</span>;

// 1 -- it started with counting
const Origin: React.FC = () => {
  const f = useCurrentFrame();
  const size = 520, px = 1240, py = 230;
  const p = interpolate(f, [30, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const t = interpolate(f, [70, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const hx = px + 290 + Math.sin(f / 9) * 40, hy = py + 250 + Math.cos(f / 11) * 30;
  const cx = interpolate(t, [0, 1], [1880, hx]), cy = interpolate(t, [0, 1], [1040, hy]) - Math.sin(t * Math.PI) * 120;
  const art = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 90 } });
  // the cursor redraws him, as on the site: halftone, pixels, lines, letters, network
  const MEDIA: Medium[] = ['halftone', 'pixels', 'lines', 'letters', 'network', 'halftone'];
  const mi = f < 124 ? 0 : Math.min(MEDIA.length - 1, 1 + Math.floor((f - 124) / 16));
  const medium = MEDIA[mi];
  const flash = f >= 124 && mi < MEDIA.length - 1 ? interpolate((f - 124) % 16, [0, 5], [0.85, 1], { extrapolateRight: 'clamp' }) : 1;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 230, width: 800 }}>
        <Kicker f={f} text="HELLO" />
        <Big f={f} size={124}>I&rsquo;m Vahid<Dot /></Big>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, letterSpacing: '-0.02em', color: C.ink, marginTop: 26, ...fadeUp(f, 26) }}>
          AI-native <span style={{ backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${interpolate(f, [40, 66], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}% 70%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 60%' }}>architect</span><Dot />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.sec, marginTop: 20, lineHeight: 1.4, maxWidth: 820, ...fadeUp(f, 46) }}>
          I build AI that people trust and teams actually use.
        </div>
        <span style={{ display: 'none' }}>{art}</span>
      </div>
      <div style={{ position: 'absolute', left: px, top: py, borderRadius: 18, boxShadow: '0 30px 60px -40px rgba(28,28,30,0.6)', opacity: interpolate(f, [24, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ transform: `scale(${flash})`, transformOrigin: '50% 50%' }}>
          <Halftone progress={p} size={size} medium={medium} lensX={f > 100 ? cx - px : undefined} lensY={f > 100 ? cy - py : undefined} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: px, top: py + size + 22, width: size, display: 'flex', justifyContent: 'center', gap: 10, opacity: interpolate(f, [118, 128], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        {MEDIA.slice(0, 5).map((m, k) => (
          <span key={m} style={{ fontFamily: MONO, fontSize: 19, padding: '6px 12px', borderRadius: 8, border: `1px solid ${m === medium ? C.red : C.line}`, color: m === medium ? C.red : C.muted, background: '#fff' }}>{m}</span>
        ))}
      </div>
      {f > 66 && <Cursor x={cx} y={cy} />}
    </AbsoluteFill>
  );
};

// 2 -- then the numbers got bigger
const Scale: React.FC = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [20, 150], [0, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const cols = 34, rows = 16, gap = 22;
  const lit = interpolate(f, [20, 170], [0, cols * rows], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 230, width: 820 }}>
        <Kicker f={f} text="02 · DATA" />
        <Big f={f}>Then the numbers<br />got bigger<Dot /></Big>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 40, ...fadeUp(f, 18) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, color: C.red, letterSpacing: '-0.04em' }}>{Math.round(n)}M+</span>
          <span style={{ fontFamily: MONO, fontSize: 26, color: C.sec, lineHeight: 1.4 }}>assets under<br />one metadata layer</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1040, top: 250, width: cols * gap, height: rows * gap }}>
        {Array.from({ length: cols * rows }).map((_, k) => {
          const on = k < lit;
          const r = Math.floor(k / cols), c = k % cols;
          return <div key={k} style={{ position: 'absolute', left: c * gap, top: r * gap, width: 10, height: 10, borderRadius: '50%', background: on ? (k % 41 === 0 ? C.red : C.ink) : 'rgba(28,28,30,0.1)', transform: `scale(${on ? 1 : 0.6})` }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

// 3 -- then models learned to read: the harness, drawn
const Harness: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 1340, cy = 520, R = 230;
  const parts = ['Loop', 'Tools', 'Context', 'Memory'];
  const partIcons = ['loop', 'plug', 'window', 'layers'];
  const ring = interpolate(f, [10, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const evals = interpolate(f, [150, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const orbit = f / 36;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 230, width: 820 }}>
        <Kicker f={f} text="03 · AGENTS" />
        <Big f={f}>Then models<br />learned to read<Dot /></Big>
        <div style={{ fontFamily: SANS, fontSize: 38, color: C.sec, marginTop: 34, lineHeight: 1.4, ...fadeUp(f, 30) }}>I design the harness around them.</div>
      </div>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.ink} strokeOpacity={0.85} strokeWidth={3} strokeDasharray={2 * Math.PI * R} strokeDashoffset={(1 - ring) * 2 * Math.PI * R} />
        <circle cx={cx} cy={cy} r={R + 90} fill="none" stroke={C.red} strokeOpacity={0.55 * evals} strokeWidth={2} strokeDasharray="4 14" />
      </svg>
      <div style={{ position: 'absolute', left: cx - 120, top: cy - 50, width: 240, height: 100, borderRadius: 20, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 30, letterSpacing: '0.1em', ...fadeUp(f, 4) }}>MODEL</div>
      {parts.map((name, i) => {
        const a = (i / parts.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const show = interpolate(f, [40 + i * 18, 58 + i * 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
        const lx = cx + Math.cos(a) * (R + (Math.abs(Math.cos(a)) > 0.5 ? 125 : 52)), ly = cy + Math.sin(a) * (R + 52);
        return (
          <React.Fragment key={name}>
            <div style={{ position: 'absolute', left: x - 36, top: y - 36 }}><IconTile name={partIcons[i]} size={72} pop={show} /></div>
            <div style={{ position: 'absolute', left: lx - 100, top: ly - 22, width: 200, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: C.ink, opacity: show }}>{name}</div>
          </React.Fragment>
        );
      })}
      {/* a red bead runs the loop: one turn of the agent */}
      <div style={{ position: 'absolute', left: cx + Math.cos(orbit) * R - 16, top: cy + Math.sin(orbit) * R - 16, opacity: ring }}><Bead size={32} color={C.red} /></div>
      <div style={{ position: 'absolute', left: cx + R + 20, top: cy - R - 120, display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 26, color: C.red, opacity: evals }}><AbIcon name="check" size={40} color={C.ink} pop={evals} />EVALS</div>
    </AbsoluteFill>
  );
};

// 4 -- agents were burning tokens blind: Tokalator, in its own UI
const TOK_REGIONS: [number, number, number, number, string, string][] = [
  [52, 80, 520, 50, 'Live context budget', 'in the editor'],
  [52, 258, 520, 182, 'Turn analytics', '97% from cache'],
  [52, 626, 520, 266, 'Workspace tools', 'skills · maps · checks'],
];
const TokalatorStory: React.FC = () => {
  const f = useCurrentFrame();
  const scale = 760 / 900, px = 1100, py = 130;
  const step = 78;
  const i = Math.min(TOK_REGIONS.length - 1, Math.max(0, Math.floor((f - 70) / step)));
  const lf = f - 70 - i * step;
  const prev = TOK_REGIONS[Math.max(0, i - 1)], cur = TOK_REGIONS[i];
  const m = i === 0 ? 1 : interpolate(lf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const box = [0, 1, 2, 3].map((k) => (prev[k] as number) + ((cur[k] as number) - (prev[k] as number)) * m);
  const frameOn = interpolate(f, [60, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const panelIn = spring({ frame: f - 30, fps: FPS, config: { damping: 15, stiffness: 100 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 140, width: 840 }}>
        <Kicker f={f} text="OPEN SOURCE · TOKALATOR" />
        <div style={{ fontFamily: SANS, fontSize: 46, color: C.sec, marginTop: 22, lineHeight: 1.3, ...fadeUp(f, 4) }}>Agents burned tokens blind<Dot /></div>
        <Big f={f} at={34} size={96}>So I built Tokalator<Dot /></Big>
        {TOK_REGIONS.map(([, , , , t, d], k) => (
          <div key={t} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: k === 0 ? 34 : 16, opacity: f >= 70 + k * step ? 1 : 0.22, transform: `translateX(${f >= 70 + k * step ? 0 : -8}px)` }}>
            <Bead size={20} color={k === i ? C.red : C.mark} style={{ marginTop: 10 }} />
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.ink }}>{t}</div>
              <div style={{ fontFamily: MONO, fontSize: 21, color: C.sec, marginTop: 4 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      {/* a fixed window; the panel inside zooms to whichever part is being told */}
      <div style={{ position: 'absolute', left: px, top: py, width: 579 * scale, height: 900 * scale, borderRadius: 16, overflow: 'hidden', background: '#000', boxShadow: '0 40px 80px -40px rgba(28,28,30,0.7)', transform: `translateY(${(1 - panelIn) * 80}px)`, opacity: panelIn }}>
        {(() => {
          const zoom = interpolate(f, [60, 90], [1, 1.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          const ccx = (box[0] + box[2] / 2) * scale, ccy = (box[1] + box[3] / 2) * scale;
          const W = 579 * scale, H = 900 * scale;
          // keep the focused region centred, but never show past the panel's edges
          const tx = Math.min(0, Math.max(W - W * zoom, W / 2 - ccx * zoom));
          const ty = Math.min(0, Math.max(H - H * zoom, H / 2 - ccy * zoom));
          return (
            <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${zoom})` }}>
              <Img src={staticFile('img/tokalator-panel.png')} style={{ width: '100%', height: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,15,16,0.55)', opacity: frameOn, clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${box[0] * scale}px ${box[1] * scale}px, ${box[0] * scale}px ${(box[1] + box[3]) * scale}px, ${(box[0] + box[2]) * scale}px ${(box[1] + box[3]) * scale}px, ${(box[0] + box[2]) * scale}px ${box[1] * scale}px, ${box[0] * scale}px ${box[1] * scale}px)` }} />
              <div style={{ position: 'absolute', left: box[0] * scale - 5, top: box[1] * scale - 5, width: box[2] * scale + 10, height: box[3] * scale + 10, border: `${3 / zoom}px solid ${C.red}`, borderRadius: 10, opacity: frameOn }} />
            </div>
          );
        })()}
      </div>
      <div style={{ position: 'absolute', left: px + 579 * scale + 26, top: py + 30, padding: '16px 22px', borderRadius: 16, background: C.paper, border: '1px solid rgba(224,48,30,0.2)', ...fadeUp(f, 240, 18) }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.red }}>500+</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.sec }}>installs</div>
      </div>
    </AbsoluteFill>
  );
};

// 5 -- then I took it to production
const Production: React.FC = () => {
  const f = useCurrentFrame();
  const n91 = interpolate(f, [40, 100], [0, 91], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const n95 = interpolate(f, [120, 180], [0, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const card = (k: number, img: string, title: string, big: string, line: string, at: number) => {
    const pop = spring({ frame: f - at, fps: FPS, config: { damping: 14, stiffness: 110 } });
    return (
      <div style={{ position: 'absolute', left: 120 + k * 860, top: 330, width: 820, opacity: pop, transform: `translateY(${(1 - pop) * 50}px)` }}>
        <div style={{ height: 300, borderRadius: 22, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 30px 60px -40px rgba(28,28,30,0.6)' }}>
          <Img src={staticFile(img)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', transformOrigin: k ? '30% 30%' : '20% 40%', transform: `scale(${interpolate(f, [at, at + 220], [1, 1.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 24 }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, color: C.red, letterSpacing: '-0.04em' }}>{big}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontWeight: 700, fontSize: 32, color: C.ink }}><AbIcon name={k ? 'agents' : 'calc'} size={36} pop={pop} />{title}</div>
            <div style={{ fontFamily: MONO, fontSize: 21, color: C.sec, marginTop: 4 }}>{line}</div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 150 }}>
        <Kicker f={f} text="05 · IN PRODUCTION" />
        <Big f={f} size={92}>Then I took it to production<Dot /></Big>
      </div>
      {card(0, 'img/projectlens-login.jpg', 'ProjectLens', `${Math.round(n91)}%`, '31 spreadsheets → 1 tool', 22)}
      {card(1, 'img/pms-dashboard.png', 'Multi-agent classifier', `${Math.round(n95)}%`, '14K+ job titles · ACM CAIS ’26', 100)}
    </AbsoluteFill>
  );
};

// 6 -- twelve years, one problem
const Twelve: React.FC = () => {
  const f = useCurrentFrame();
  const rod = interpolate(f, [0, 40], [0, 1], { extrapolateRight: 'clamp', easing: ease });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 250, width: 860 }}>
        <Kicker f={f} text="06 · THE THROUGH-LINE" />
        <Big f={f} size={112}>Twelve years.<br />One problem<Dot /></Big>
        <div style={{ fontFamily: SANS, fontSize: 42, color: C.sec, marginTop: 30, ...fadeUp(f, 30) }}>Messy text in, decisions out.</div>
      </div>
      <div style={{ position: 'absolute', left: 1180, top: 175, height: 580 * rod, width: 4, background: C.ink, borderRadius: 4 }} />
      {STAGES.map(([y, t], i) => {
        const now = i === STAGES.length - 1;
        return (
          <div key={y} style={{ position: 'absolute', left: 1162, top: 165 + i * 108, display: 'flex', alignItems: 'center', gap: 30, ...fadeUp(f, 10 + i * 7, 14, 12) }}>
            <div style={{ position: 'relative' }}><Bead size={40} color={now ? C.red : i % 2 ? C.deep : C.mark} /></div>
            <span style={{ fontFamily: MONO, fontSize: 24, color: C.sec, width: 130 }}>{y}</span>
            <AbIcon name={STAGE_ICONS[i]} size={38} color={now ? C.red : C.ink} />
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: now ? C.red : C.ink }}>{t}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 7 -- the invitation
const Invite: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 120, top: 170, ...fadeUp(f, 0) }}>
        {(() => {
          // the subject cycles through what he delivers, then lands on the promise
          const W = ['Data products', 'Agents', 'Analysis', 'Design', 'Architecture', 'Problem solving', 'Token-cost optimisation', 'Tracing', 'Failure detection', 'Tests'];
          const per = 11, k = Math.floor(f / per);
          const word = k < W.length ? W[k] : 'Enterprise solutions';
          const landed = k >= W.length;
          const lf = landed ? f - W.length * per : f - k * per;
          const inn = interpolate(lf, [0, landed ? 12 : 5], [0, 1], { extrapolateRight: 'clamp', easing: ease });
          const sweep = landed ? interpolate(lf, [6, 26], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }) : 0;
          return (
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 104, letterSpacing: '-0.045em', color: C.ink, lineHeight: 1.04 }}>
              <span style={{ display: 'inline-block', opacity: inn, transform: `translateY(${(1 - inn) * 24}px)`, color: landed ? C.ink : C.red, backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${sweep}% 70%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 60%', padding: '0 0.08em' }}>{word}</span>
              <br />you can count on<Dot />
            </div>
          );
        })()}
        <div style={{ display: 'flex', gap: 22, marginTop: 44 }}>
          <div style={{ padding: '22px 36px', borderRadius: 14, background: C.ink, color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 36, display: 'flex', alignItems: 'center', gap: 16 }}><Bead size={18} color={C.red} style={{ boxShadow: 'none' }} />Book a call</div>
          <div style={{ padding: '22px 36px', borderRadius: 14, border: `2px solid ${C.line}`, background: '#fff', color: C.ink, fontFamily: SANS, fontWeight: 600, fontSize: 36 }}>vfaraji89.github.io</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 90, bottom: 150, fontFamily: PIXEL, fontSize: 250, lineHeight: 0.8, color: C.ink, ...fadeUp(f, 10, 24, 40) }}>vahid<span style={{ color: C.red }}>.</span></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 160, height: 3, background: C.ink, opacity: 0.85 }} />
      {[0.08, 0.2, 0.33, 0.46, 0.58, 0.71, 0.84, 0.93].map((x, i) => {
        const drop = spring({ frame: f - 14 - i * 3, fps, config: { damping: 9, stiffness: 140 } });
        return <div key={i} style={{ position: 'absolute', left: `${x * 100}%`, bottom: 140, transform: `translateY(${(1 - drop) * -300}px)`, opacity: drop }}><Bead size={i % 3 === 0 ? 44 : 32} color={i % 3 === 0 ? C.red : i % 3 === 1 ? C.mark : C.deep} /></div>;
      })}
    </AbsoluteFill>
  );
};


// ================= the story, for every audience =================
// who I am, the languages I live in, data and its context, models put to work,
// Tokalator, what you can count on, and an abacus that spells the name.

// languages: read people first
const LANGS: [string, string, string][] = [
  ['Merhaba', 'Turkish', 'native'], ['Hello', 'English', 'C1'], ['Hola', 'Spanish', 'taught it'],
  ['Olá', 'Portuguese', 'basic'], ['Konnichiwa', 'Japanese', 'learning'],
];
const Languages: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 210, width: 820 }}>
        <Kicker f={f} text="LANGUAGES" />
        <Big f={f} size={104}>I read people<br />first<Dot /></Big>
        <div style={{ fontFamily: SANS, fontSize: 38, color: C.sec, marginTop: 30, lineHeight: 1.4, ...fadeUp(f, 150) }}>
          Five languages taught me that <span style={{ color: C.ink, fontWeight: 600 }}>meaning lives in context</span>, not in words.
        </div>
      </div>
      {LANGS.map(([hi, name, lvl], i) => {
        const pop = spring({ frame: f - 20 - i * 16, fps: FPS, config: { damping: 13, stiffness: 120 } });
        const col = i % 2, row = Math.floor(i / 2);
        const x = 1060 + col * 380 + (i === 4 ? 190 : 0), y = 200 + row * 200;
        return (
          <div key={hi} style={{ position: 'absolute', left: x, top: y, width: 340, padding: '26px 30px', borderRadius: 22, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 30px 50px -40px rgba(28,28,30,0.6)', opacity: pop, transform: `translateY(${(1 - pop) * 40}px) scale(${0.92 + 0.08 * pop})` }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 50, letterSpacing: '-0.03em', color: i === 0 ? C.red : C.ink }}>{hi}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <Bead size={14} color={i < 3 ? C.red : C.mark} style={{ boxShadow: 'none' }} />
              <span style={{ fontFamily: MONO, fontSize: 22, color: C.sec }}>{name} · {lvl}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// data and its context
const DataContext: React.FC = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [24, 150], [0, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const cols = 30, rows = 14, gap = 24;
  const lit = interpolate(f, [20, 170], [0, cols * rows], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const link = interpolate(f, [150, 220], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const tags = ['owner', 'source', 'lineage', 'meaning'];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 210, width: 820 }}>
        <Kicker f={f} text="DATA &amp; CONTEXT" />
        <Big f={f} size={100}>Then I gave data<br />its context<Dot /></Big>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 40, ...fadeUp(f, 18) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 116, color: C.red, letterSpacing: '-0.04em' }}>{Math.round(n)}M+</span>
          <span style={{ fontFamily: MONO, fontSize: 26, color: C.sec, lineHeight: 1.4 }}>assets, each with<br />a clear trail</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1060, top: 230, width: cols * gap, height: rows * gap }}>
        {Array.from({ length: cols * rows }).map((_, k) => {
          const on = k < lit, r = Math.floor(k / cols), c = k % cols;
          return <div key={k} style={{ position: 'absolute', left: c * gap, top: r * gap, width: 10, height: 10, borderRadius: '50%', background: on ? (k === 187 ? C.red : C.ink) : 'rgba(28,28,30,0.1)', transform: `scale(${k === 187 ? 1 + link * 1.4 : on ? 1 : 0.6})` }} />;
        })}
        {/* one asset, opened: who owns it, where it came from, what it means */}
        {tags.map((t, i) => {
          const a = (i / tags.length) * Math.PI * 2 - Math.PI / 3, cx = 7 * gap + 5, cy = 6 * gap + 5;
          const x = cx + Math.cos(a) * 190 * link, y = cy + Math.sin(a) * 120 * link;
          return (
            <React.Fragment key={t}>
              <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width="1" height="1"><line x1={cx} y1={cy} x2={x} y2={y} stroke={C.red} strokeWidth={2} strokeOpacity={0.6 * link} /></svg>
              <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', padding: '8px 16px', borderRadius: 999, background: '#fff', border: `1.5px solid ${C.red}`, fontFamily: MONO, fontSize: 21, color: C.deep, opacity: link }}>{t}</div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// models put to work, said plainly
const STEPS: [string, string, string][] = [
  ['page', 'It reads', 'messy text: CVs, job ads, documents'],
  ['check', 'It checks', 'every answer is tested before anyone sees it'],
  ['agents', 'It ships', 'into tools teams use every day'],
];
const ModelShip: React.FC = () => {
  const f = useCurrentFrame();
  const x0 = 140, w = 1640, step = w / 3;
  const run = interpolate(f, [70, 190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const n91 = interpolate(f, [210, 260], [0, 91], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const n95 = interpolate(f, [225, 275], [0, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 170 }}>
        <Kicker f={f} text="APPLIED AI" />
        <Big f={f} size={96}>Then I put AI to work<Dot /></Big>
      </div>
      <div style={{ position: 'absolute', left: x0 + step / 2, width: step * 2, top: 438, height: 4, borderRadius: 4, background: 'rgba(28,28,30,0.12)' }} />
      <div style={{ position: 'absolute', left: x0 + step / 2, width: step * 2 * run, top: 438, height: 4, borderRadius: 4, background: C.ink }} />
      <div style={{ position: 'absolute', left: x0 + step / 2 + step * 2 * run - 16, top: 424, opacity: run > 0 && run < 1 ? 1 : 0 }}><Bead size={32} color={C.red} /></div>
      {STEPS.map(([ic, t, d], i) => {
        const pop = spring({ frame: f - 24 - i * 22, fps: FPS, config: { damping: 13, stiffness: 120 } });
        const on = run >= i / 2 - 0.001;
        return (
          <div key={t} style={{ position: 'absolute', left: x0 + i * step, top: 390, width: step, textAlign: 'center', opacity: pop, transform: `translateY(${(1 - pop) * 30}px)` }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><IconTile name={ic} size={100} on={on} /></div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, letterSpacing: '-0.02em', color: on ? C.ink : C.muted, marginTop: 22 }}>{t}</div>
            <div style={{ fontFamily: SANS, fontSize: 28, color: C.sec, marginTop: 8, lineHeight: 1.35, padding: '0 40px' }}>{d}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', justifyContent: 'center', gap: 40, ...fadeUp(f, 205) }}>
        {[[`${Math.round(n91)}%`, 'less manual work', 'ProjectLens'], [`${Math.round(n95)}%`, 'accuracy on 14K+ job titles', 'peer-reviewed, ACM CAIS ’26']].map(([big, l, src]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 18, padding: '18px 30px', borderRadius: 18, background: C.paper, border: '1px solid rgba(224,48,30,0.15)' }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.red, letterSpacing: '-0.03em' }}>{big}</span>
            <span><span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.ink }}>{l}</span><br /><span style={{ fontFamily: MONO, fontSize: 20, color: C.sec }}>{src}</span></span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// what you can count on: the solution, big
const CountOn: React.FC = () => {
  const f = useCurrentFrame();
  const W = ['Data products', 'Agents', 'Analysis', 'Architecture', 'Problem solving', 'Token-cost optimisation', 'Tracing', 'Failure detection', 'Tests'];
  const per = 13, k = Math.floor(f / per), landed = k >= W.length;
  const word = landed ? 'Enterprise solutions' : W[k];
  const lf = landed ? f - W.length * per : f - k * per;
  const inn = interpolate(lf, [0, landed ? 14 : 6], [0, 1], { extrapolateRight: 'clamp', easing: ease });
  const sweep = landed ? interpolate(lf, [8, 30], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }) : 0;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 140 }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 56, color: C.sec, letterSpacing: '-0.02em', ...fadeUp(f, 0) }}>You can count on</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: landed ? 176 : 150, lineHeight: 1.02, letterSpacing: '-0.05em', marginTop: 10, color: landed ? C.ink : C.red, opacity: inn, transform: `translateY(${(1 - inn) * 30}px)`, filter: `blur(${(1 - inn) * 6}px)` }}>
        <span style={{ backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${sweep}% 32%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 88%' }}>{word}</span>{landed && <Dot />}
      </div>
    </AbsoluteFill>
  );
};

// the close: a wooden abacus, two rods, and the name inside it
const AbacusName: React.FC = () => {
  const f = useCurrentFrame();
  const L = 260, R = 1660, top = 210, bottom = 900;
  const posts = spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 90 } });
  const rods = interpolate(f, [10, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const word = interpolate(f, [66, 96], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const dowel = 'linear-gradient(90deg, #b48a5c 0%, #d8bb94 24%, #f1e3cc 48%, #dcc29e 70%, #ad8455 100%)';
  const rodBg = 'linear-gradient(180deg, #e9d8bd 0%, #f4eadb 35%, #d2b48d 75%, #b8946a 100%)';
  const rows: { y: number; beads: string[] }[] = [{ y: 640, beads: ['white', 'white'] }, { y: 790, beads: ['red', 'red', 'red'] }];
  const tone: Record<string, [string, string, string]> = { white: ['#ffffff', '#f4f1ee', '#d9d3cd'], red: ['#ff8f80', '#e0301e', '#9e1a0c'] };
  let k = 0;
  return (
    <AbsoluteFill>
      {[L, R].map((x, i) => (
        <div key={i} style={{ position: 'absolute', left: x - 34, top: top + (1 - posts) * -200, width: 68, height: bottom - top, borderRadius: 999, background: dowel, boxShadow: '0 30px 40px -24px rgba(60,40,20,0.45)', opacity: posts, zIndex: 2 }} />
      ))}
      {rows.map((row, ri) => (
        <div key={ri} style={{ position: 'absolute', left: L, width: (R - L) * rods, top: row.y - 8, height: 16, borderRadius: 999, background: rodBg, boxShadow: '0 6px 10px -6px rgba(80,50,20,0.35)', zIndex: 1 }} />
      ))}
      {rows.map((row) => row.beads.map((t, bi) => {
        const i = k++;
        const drop = spring({ frame: f - 24 - i * 6, fps: FPS, config: { damping: 11, stiffness: 140 } });
        // the beads slide across to count, then settle back home on the left
        const slide = interpolate(f, [104 + i * 5, 130 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
        const home = L + 34 + 62 + bi * 116, away = R - 34 - 62 - (row.beads.length - 1 - bi) * 116;
        const x = home + (away - home) * slide * (row.beads.length === 3 && bi < 1 ? 0 : 1);
        const [b1, b2, b3] = tone[t];
        return <div key={i} style={{ position: 'absolute', left: x - 58, top: row.y - 58 - (1 - drop) * 300, width: 116, height: 116, borderRadius: '50%', opacity: Math.min(1, drop * 1.5), background: `radial-gradient(circle at 34% 28%, ${b1} 0%, ${b2} 38%, ${b3} 100%)`, boxShadow: 'inset -8px -10px 18px -6px rgba(0,0,0,0.16), 0 18px 22px -14px rgba(40,20,10,0.4)', zIndex: 3 }} />;
      }))}
      <div style={{ position: 'absolute', left: L + 110, top: 250, fontFamily: PIXEL, fontSize: 300, lineHeight: 0.8, color: C.ink, opacity: word, transform: `translateY(${(1 - word) * 30}px)`, letterSpacing: '-0.02em', zIndex: 2 }}>
        vahid<span style={{ display: 'inline-block', width: 52, height: 52, marginLeft: 10, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%, #ff9d8f 0%, #e0301e 42%, #a81a0b 100%)', transform: `scale(${spring({ frame: f - 96, fps: FPS, config: { damping: 8, stiffness: 160 } })})` }} />
      </div>
    </AbsoluteFill>
  );
};

const Push: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1, 1.035], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: '45% 45%' }}>{children}</AbsoluteFill>;
};
const s = (sec: number) => Math.round(sec * FPS);

// ---- scene paper: a light ground with a slow drifting bead field -------------
const Paper: React.FC<{ tint?: string; corner?: string }> = ({ tint = '#ffffff', corner = '100% 0%' }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: tint }}>
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(224,48,30,0.16) 1.6px, transparent 2.2px)', backgroundSize: '26px 26px',
        backgroundPosition: `${f * 0.25}px ${f * 0.12}px`,
        WebkitMaskImage: `radial-gradient(60% 55% at ${corner}, #000, transparent 70%)`, maskImage: `radial-gradient(60% 55% at ${corner}, #000, transparent 70%)`,
      }} />
    </AbsoluteFill>
  );
};

// ---- transitions: each chapter enters its own way, landing on the cut --------
type Kind = 'rise' | 'zoom' | 'wipe' | 'iris' | 'slide' | 'rod';
const OV = 16; // frames of overlap before the cut
const Enter: React.FC<{ kind: Kind; dur?: number; children: React.ReactNode }> = ({ kind, dur, children }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, OV], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.25, 1) });
  // fades dip through the paper: the old chapter leaves before the new one lands
  const late = interpolate(k, [0.4, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let style: React.CSSProperties = {};
  let extra: React.ReactNode = null;
  if (kind === 'rise') style = { opacity: late, transform: `translateY(${(1 - k) * 90}px)`, filter: `blur(${(1 - k) * 10}px)` };
  if (kind === 'zoom') style = { opacity: late, transform: `scale(${1.18 - 0.18 * k})`, filter: `blur(${(1 - k) * 8}px)` };
  if (kind === 'wipe') style = { clipPath: `inset(0 0 0 ${(1 - k) * 100}%)` };
  if (kind === 'iris') style = { clipPath: `circle(${k * 120}% at 70% 45%)` };
  if (kind === 'slide') style = { transform: `translateX(${(1 - k) * 100}%)` };
  if (kind === 'rod') {
    // a red rod sweeps down, and the chapter rolls in behind it
    style = { clipPath: `inset(0 0 ${(1 - k) * 100}% 0)` };
    extra = k < 1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: `${k * 100}%`, height: 6, marginTop: -3, background: C.red, boxShadow: '0 0 0 1px rgba(224,48,30,0.2)' }} /> : null;
  }
  // the edge of a wipe carries a thin ink rod, like the abacus frame
  if (kind === 'wipe' && k < 1) extra = <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(1 - k) * 100}%`, width: 5, marginLeft: -2, background: C.ink }} />;
  const out = dur ? interpolate(f, [dur - 2 * OV, dur - OV - 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {extra}
    </AbsoluteFill>
  );
};

const SCENES: [number, number, Kind, React.FC, string, string][] = [
  [0, 7, 'rise', () => <Origin />, '#ffffff', '100% 0%'],
  [7, 15, 'zoom', () => <Languages />, '#ffffff', '0% 100%'],
  [15, 24, 'wipe', () => <DataContext />, '#ffffff', '100% 100%'],
  [24, 35, 'iris', () => <ModelShip />, '#ffffff', '0% 0%'],
  [35, 45, 'slide', () => <TokalatorStory />, '#fffaf8', '100% 0%'],
  [45, 53, 'rise', () => <CountOn />, '#ffffff', '0% 100%'],
];

export const AnimatedCV: React.FC = () => (
  <AbsoluteFill style={{ background: '#ffffff' }}>
    <Audio src={staticFile('soundtrack.wav')} />
    {SCENES.map(([a, b, kind, Scene, tint, corner], i) => {
      const from = i === 0 ? 0 : s(a) - OV;
      const dur = s(b) - from + (i === SCENES.length - 1 ? OV : OV);
      return (
        <Sequence key={a} from={from} durationInFrames={dur}>
          <Enter kind={i === 0 ? 'rise' : kind} dur={['rise', 'zoom'].includes(SCENES[i + 1]?.[2] ?? '') ? dur : undefined}>
            <Paper tint={tint} corner={corner} />
            <Push dur={dur}><Scene /></Push>
          </Enter>
        </Sequence>
      );
    })}
    <Sequence from={s(53) - OV} durationInFrames={s(7) + OV}>
      <Enter kind="rod"><Paper tint={C.paper} corner="100% 0%" /><AbacusName /></Enter>
    </Sequence>
    <Brand />
    <Caption text="Hi, I'm Vahid. I build AI people trust." start={s(1.2)} end={s(6.6)} />
    <Caption text="Five languages taught me context." start={s(8)} end={s(14.6)} />
    <Caption text="Data is only useful when you know its story." start={s(16)} end={s(23.6)} />
    <Caption text="Models that read, checks that prove it, tools that ship." start={s(25)} end={s(34.6)} />
    <Caption text="A live context budget, inside VS Code." start={s(36)} end={s(44.6)} />
    <Timer />
  </AbsoluteFill>
);
