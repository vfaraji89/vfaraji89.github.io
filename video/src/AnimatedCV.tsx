// Vahid Faraji -- a 60-second animated CV.
// A story in seven beats: who I am, languages, data and its context, models put to work,
// Tokalator, what you can count on, and a wooden abacus that spells the name.
// Same palette, type and beads as vfaraji89.github.io. Render: npm run render
import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import tone from './tone.json';
import ms from './msicons.json';
import land from './land.json';
import icons from './icons.json';

export const FPS = 30;
export const TOTAL = 90 * FPS;

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
      <span style={{ fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: '0.08em' }}>ANIMATED CV · 90 SECONDS</span>
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

const Cursor: React.FC<{ x: number; y: number; label?: string; press?: boolean }> = ({ x, y, label = 'Vahid', press = false }) => (
  <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', transform: `scale(${press ? 0.86 : 1})`, transformOrigin: '0 0' }}>
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

const KICK_ICON: Record<string, string> = {
  HELLO: 'abacus', LANGUAGES: 'globe', 'DATA &amp; CONTEXT': 'bars', 'PROBLEM &amp; SOLUTION': 'check',
  'CONTEXT DESIGN · TOKALATOR': 'window', 'ANALYTICAL THINKING · PROJECTLENS': 'calc', 'WHAT IT CHANGED': 'bars', ROOTS: 'cap', 'TALKING TO AGENTS': 'agents', 'PROBLEM → DATA → SOLUTION': 'flow', 'AI AT WORK': 'agents', 'YAPAY ZEKÂ İZİ · CONCEPT': 'page', 'THE SHIPPING HABIT': 'branch',
};
const Kicker: React.FC<{ f: number; text: string; at?: number }> = ({ f, text, at = 0 }) => {
  const icon = KICK_ICON[text] || KICK_ICON[text.replace(/&/g, '&amp;')];
  const pop = spring({ frame: f - at, fps: FPS, config: { damping: 10, stiffness: 150 } });
  const bob = Math.sin((f - at) / 14) * 3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...fadeUp(f, at) }}>
      {icon && <div style={{ transform: `translateY(${bob}px) rotate(${(1 - pop) * -25}deg)` }}><IconTile name={icon} size={64} pop={pop} /></div>}
      <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep }}>{text}</span>
    </div>
  );
};
const Big: React.FC<{ f: number; at?: number; size?: number; children: React.ReactNode }> = ({ f, at = 6, size = 104, children }) => (
  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.045em', color: C.ink, marginTop: 16, ...fadeUp(f, at, 20, 30) }}>{children}</div>
);
const Dot = () => <span style={{ color: C.red }}>.</span>;

// 1 -- it started with counting
const Origin: React.FC = () => {
  const f = useCurrentFrame();
  const size = 520, px = 1240, py = 230;
  const p = interpolate(f, [0, 90], [0.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const t = interpolate(f, [70, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const hx = px + 290 + Math.sin(f / 9) * 40, hy = py + 250 + Math.cos(f / 11) * 30;
  const cx = interpolate(t, [0, 1], [1880, hx]), cy = interpolate(t, [0, 1], [1040, hy]) - Math.sin(t * Math.PI) * 120;
  const art = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 90 } });
  // the cursor redraws him, as on the site: halftone, pixels, lines, letters, network
  const MEDIA: Medium[] = ['halftone', 'pixels', 'lines', 'letters', 'network', 'halftone'];
  const mi = f < 124 ? 0 : Math.min(MEDIA.length - 1, 1 + Math.floor((f - 124) / 12));
  const medium = MEDIA[mi];
  const flash = 1;
  // each click redraws him: the new medium opens as a circle from the cursor
  const lastClick = 124 + (mi - 1) * 12;
  const reveal = mi > 0 ? interpolate(f - lastClick, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 1;
  const clickX = px + 290 + Math.sin(lastClick / 9) * 40, clickY = py + 250 + Math.cos(lastClick / 11) * 30;
  const sel = interpolate(f, [104, 116], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 230, width: 800 }}>
        <Kicker f={f} text="HELLO" />
        <Big f={f} size={124}>I&rsquo;m Vahid<Dot /></Big>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, letterSpacing: '-0.02em', color: C.ink, marginTop: 26, ...fadeUp(f, 26) }}>
          AI-native <span style={{ backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${interpolate(f, [40, 66], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}% 70%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 60%' }}>architect</span><Dot />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 30, ...fadeUp(f, 100) }}>
          <IconTile name="bars" size={60} pop={spring({ frame: f - 100, fps: FPS, config: { damping: 10, stiffness: 150 } })} />
          <span style={{ fontFamily: SANS, fontSize: 40, color: C.sec, letterSpacing: '-0.01em', lineHeight: 1.25 }}>I make <b style={{ color: C.ink }}>data-driven decisions</b> easier<Dot /></span>
        </div>
        <span style={{ display: 'none' }}>{art}</span>
      </div>
      <div style={{ position: 'absolute', left: px, top: py, width: size, height: size, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 60px -40px rgba(28,28,30,0.6)', opacity: interpolate(f, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ transform: `scale(${flash})`, transformOrigin: '50% 50%' }}>
          {mi > 0 && reveal < 1 && <div style={{ position: 'absolute', inset: 0 }}><Halftone progress={p} size={size} medium={MEDIA[mi - 1]} /></div>}
          <div style={{ position: 'relative', clipPath: mi > 0 && reveal < 1 ? `circle(${reveal * 780}px at ${clickX - px}px ${clickY - py}px)` : undefined }}>
            <Halftone progress={p} size={size} medium={medium} lensX={f > 100 ? cx - px : undefined} lensY={f > 100 ? cy - py : undefined} />
          </div>
        </div>
      </div>
      {/* a Figma-style selection: frame, corner handles, size tag */}
      <div style={{ position: 'absolute', left: px - 6, top: py - 6, width: size + 12, height: size + 12, border: `2px solid ${C.red}`, borderRadius: 4, opacity: sel, pointerEvents: 'none' }}>
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([hx2, hy2], k) => <div key={k} style={{ position: 'absolute', left: `calc(${hx2 * 100}% - 7px)`, top: `calc(${hy2 * 100}% - 7px)`, width: 12, height: 12, background: '#fff', border: `2px solid ${C.red}` }} />)}
        <div style={{ position: 'absolute', left: '50%', bottom: -40, transform: 'translateX(-50%)', padding: '3px 10px', borderRadius: 6, background: C.red, color: '#fff', fontFamily: MONO, fontSize: 18, whiteSpace: 'nowrap' }}>Portrait · {medium}</div>
      </div>
      {mi > 0 && reveal < 1 && <div style={{ position: 'absolute', left: clickX - 30 * (1 + reveal * 2), top: clickY - 30 * (1 + reveal * 2), width: 60 * (1 + reveal * 2), height: 60 * (1 + reveal * 2), borderRadius: '50%', border: `3px solid ${C.red}`, opacity: 1 - reveal, pointerEvents: 'none' }} />}
      {f > 66 && <Cursor x={cx} y={cy} press={mi > 0 && f - lastClick < 4} />}
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
  [52, 80, 520, 50, 'A live budget', 'right where people code'],
  [52, 258, 520, 182, 'Where the spend goes', '97% reused, not re-bought'],
  [52, 626, 520, 266, 'Guardrails', 'rules and checks for every agent'],
];
// tokens this year: filled in only with real numbers, otherwise nothing is shown
const TOKENS: { used: string; saved: string } = { used: '', saved: '' };
const TokalatorStory: React.FC = () => {
  const f = useCurrentFrame();
  const scale = 760 / 900, px = 1100, py = 130;
  const step = 62;
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
        <Kicker f={f} text="CONTEXT DESIGN · TOKALATOR" />
        <div style={{ fontFamily: SANS, fontSize: 46, color: C.sec, marginTop: 22, lineHeight: 1.3, ...fadeUp(f, 4) }}>AI assistants were spending blind<Dot /></div>
        <Big f={f} at={34} size={92}>So I built them<br />a live meter<Dot /></Big>
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

// languages, around the world: a dotted globe turns to each one, the greeting pops up in its own script,
// and a counter adds up the people I can talk to
const LANGS: [string, string, string, string, number, number, number][] = [
  ['Merhaba', 'Turkish', 'native', 'TR', 39, 35, 90], ['Hello', 'English', 'C1', 'EN', 52, -1, 1460],
  ['Hola', 'Spanish', 'taught it', 'ES', 40, -4, 560], ['Olá', 'Portuguese', 'basic', 'PT', -10, -50, 265],
  ['こんにちは', 'Japanese', 'learning', 'JA', 36, 138, 125],
];
const JP = `${SANS.split(',')[0]}, "WenQuanYi Zen Hei", "Noto Sans CJK JP", sans-serif`;
const Languages: React.FC = () => {
  const f = useCurrentFrame();
  const per = 22, at0 = 34;
  const i = Math.max(0, Math.min(LANGS.length - 1, Math.floor((f - at0) / per)));
  const lf = f - at0 - i * per;
  // the globe turns: towards each country in turn, then eases back to frame them all
  const lonAt = (fr: number) => {
    const keys: [number, number][] = [[0, 70], [at0, 35], ...LANGS.slice(1).map((l, k): [number, number] => [at0 + (k + 1) * per, l[5]]), [at0 + 5 * per + 30, 150], [230, 165]];
    let k = 0; while (k < keys.length - 2 && fr > keys[k + 1][0]) k++;
    const [f0, v0] = keys[k], [f1, v1] = keys[k + 1];
    return v0 + (v1 - v0) * interpolate(fr, [Math.max(f0, f1 - 14), f1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  };
  // after Japan, swing back west a little so Istanbul and Tokyo share the frame
  const lon0 = f > at0 + 5 * per ? interpolate(f, [at0 + 5 * per, 230], [138, 92], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }) : lonAt(f);
  const lat0 = 18 * Math.PI / 180;
  const gx = 1420, gy = 570, R = 300;
  const globeIn = spring({ frame: f - 4, fps: FPS, config: { damping: 16, stiffness: 90 } });
  const proj = (lat: number, lon: number) => {
    const p = lat * Math.PI / 180, l = (lon - lon0) * Math.PI / 180;
    const x = Math.cos(p) * Math.sin(l);
    const y = -(Math.cos(lat0) * Math.sin(p) - Math.sin(lat0) * Math.cos(p) * Math.cos(l));
    const z = Math.sin(lat0) * Math.sin(p) + Math.cos(lat0) * Math.cos(p) * Math.cos(l);
    return [gx + x * R * globeIn, gy + y * R * globeIn, z] as const;
  };
  // the count: people who speak the languages I work in (Japanese is still in progress)
  const target = LANGS.slice(0, Math.min(4, f < at0 ? 0 : i + 1)).reduce((a2, l) => a2 + l[6], 0);
  const prevT = LANGS.slice(0, Math.min(4, f < at0 ? 0 : i)).reduce((a2, l) => a2 + l[6], 0);
  const shown = prevT + (target - prevT) * interpolate(lf, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const big = shown >= 1000 ? `${(Math.floor(shown / 100) / 10).toFixed(1)}B` : `${Math.round(shown)}M`;
  const done = f >= at0 + 4 * per + 14;
  const [px, py, pz] = proj(LANGS[i][4], LANGS[i][5]);
  const card = f < at0 ? 0 : spring({ frame: lf, fps: FPS, config: { damping: 11, stiffness: 190 } }) * interpolate(lf, [per - 3, per + 2], [1, i === LANGS.length - 1 ? 1 : 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ist = proj(41, 29);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 860 }}>
        <Kicker f={f} text="LANGUAGES" />
        <Big f={f} size={92}>My world isn&rsquo;t<br />one language<Dot /></Big>
        <div style={{ marginTop: 34, ...fadeUp(f, at0 - 4) }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, letterSpacing: '-0.05em', color: C.red, lineHeight: 1 }}>{done ? '2.3B+' : big}</span>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.ink, lineHeight: 1.2 }}>people<br />I can talk to</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 26, alignItems: 'center' }}>
            {LANGS.map(([, name, , code], k) => {
              const on = f >= at0 + k * per;
              const pop = spring({ frame: f - at0 - k * per, fps: FPS, config: { damping: 10, stiffness: 200 } });
              return (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 999, border: `1.5px ${k === 4 ? 'dashed' : 'solid'} ${on ? (k === 0 ? C.red : C.ink) : C.line}`, background: '#fff', transform: `scale(${on ? 0.9 + 0.1 * pop : 0.9})`, opacity: on ? 1 : 0.35 }}>
                  <Bead size={16} color={on ? (k === 0 ? C.red : k === 4 ? '#fff' : C.ink) : '#e6e1da'} style={{ boxShadow: k === 4 && on ? `0 0 0 2px ${C.ink}` : 'none' }} />
                  <span style={{ fontFamily: MONO, fontSize: 21, color: C.ink }}>{code}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 21, color: C.sec, marginTop: 16, opacity: done ? 1 : 0 }}>speakers of TR, EN, ES, PT · Japanese in progress</div>
        </div>
      </div>
      {/* the globe */}
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width={1920} height={1080}>
        <circle cx={gx} cy={gy} r={R * globeIn} fill="#fff" stroke={C.line} strokeWidth={2} />
        <ellipse cx={gx} cy={gy} rx={R * globeIn} ry={R * globeIn * 0.3} fill="none" stroke="rgba(28,28,30,0.06)" strokeWidth={1.5} />
        {(land as number[][]).map(([la, lo], k) => {
          const [x, y, z] = proj(la, lo);
          if (z <= 0.02) return null;
          return <circle key={k} cx={x} cy={y} r={2.2 + 1.6 * z} fill={C.ink} opacity={0.12 + 0.5 * z} />;
        })}
        {/* arcs home: from Istanbul to every language once it has been said */}
        {LANGS.slice(1).map((l, k) => {
          const on = interpolate(f, [at0 + (k + 1) * per, at0 + (k + 1) * per + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const [x2, y2, z2] = proj(l[4], l[5]);
          if (on <= 0 || z2 < 0 || ist[2] < 0) return null;
          const mx = (ist[0] + x2) / 2, my = (ist[1] + y2) / 2 - 0.35 * Math.hypot(x2 - ist[0], y2 - ist[1]);
          return <path key={l[3]} d={`M${ist[0]},${ist[1]} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={C.red} strokeWidth={2.5} strokeDasharray="6 8" strokeOpacity={0.7} pathLength={100} strokeDashoffset={(1 - on) * 100} />;
        })}
        {LANGS.map((l, k) => {
          const [x, y, z] = proj(l[4], l[5]);
          const on = f >= at0 + k * per;
          if (z < 0 || !on) return null;
          const pulse = (f - at0 - k * per) % 40 / 40;
          return (
            <g key={l[3]}>
              <circle cx={x} cy={y} r={10 + pulse * 26} fill="none" stroke={C.red} strokeOpacity={0.5 * (1 - pulse)} strokeWidth={2} />
              <circle cx={x} cy={y} r={10} fill={k === 4 ? '#fff' : C.red} stroke={k === 4 ? C.red : '#fff'} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      {/* the greeting, in its own script, pinned to its place */}
      {f >= at0 && pz > 0 && (
        <div style={{ position: 'absolute', left: px > 1460 ? px - 22 : px + 22, top: py - 150, transform: `${px > 1460 ? 'translateX(-100%) ' : ''}scale(${card})`, transformOrigin: px > 1460 ? '100% 100%' : '0% 100%', opacity: Math.min(1, card * 1.4), padding: '18px 28px 16px', borderRadius: 20, background: '#fff', border: `2px solid ${C.ink}`, boxShadow: '0 26px 40px -26px rgba(28,28,30,0.6)', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: i === 4 ? JP : SANS, fontWeight: 800, fontSize: 64, letterSpacing: i === 4 ? '0' : '-0.04em', color: i === 0 ? C.red : C.ink, lineHeight: 1.05 }}>{LANGS[i][0]}</div>
          <div style={{ fontFamily: MONO, fontSize: 19, color: C.sec, marginTop: 6 }}>{LANGS[i][1].toUpperCase()} · {LANGS[i][2]}</div>
        </div>
      )}
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
          <span style={{ fontFamily: MONO, fontSize: 26, color: C.sec, lineHeight: 1.4 }}>records, each one<br />findable and trusted</span>
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

// the real problem: AI changes the tools, not the problem
const Words: React.FC<{ f: number; at: number; text: string; size: number; color?: string; hi?: string }> = ({ f, at, text, size, color = C.ink, hi }) => (
  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: '-0.045em', lineHeight: 1.08, color, whiteSpace: 'nowrap' }}>
    {text.split(' ').map((w, k) => {
      const q = interpolate(f, [at + k * 3, at + k * 3 + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
      const isHi = hi && w.replace(/[.,]/g, '') === hi;
      const sweep = isHi ? interpolate(f, [at + 16, at + 32], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }) : 0;
      return <span key={k} style={{ display: 'inline-block', marginRight: size * 0.24, opacity: q, transform: `translateY(${(1 - q) * size * 0.4}px)`, filter: `blur(${(1 - q) * 6}px)`, backgroundImage: isHi ? `linear-gradient(${C.mark}, ${C.mark})` : undefined, backgroundSize: `${sweep}% 36%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 86%' }}>{w}</span>;
    })}
  </div>
);
const TOOLS = ['calc', 'page', 'window', 'cloud', 'agents', 'plug'];
const Shift: React.FC = () => {
  const f = useCurrentFrame();
  const tool = TOOLS[Math.min(TOOLS.length - 1, Math.floor(Math.max(0, f - 6) / 7)) % TOOLS.length];
  const toolPop = spring({ frame: (f - 6) % 7 === 0 ? 0 : (f - 6) % 7, fps: FPS, config: { damping: 9, stiffness: 200 } });
  const lock = spring({ frame: f - 36, fps: FPS, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <Words f={f} at={2} text="AI changes the tools." size={92} />
        <div style={{ opacity: interpolate(f, [8, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}><IconTile name={tool} size={96} pop={f < 48 ? 0.85 + 0.15 * toolPop : 1} /></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 18 }}>
        <Words f={f} at={28} text="The problem stays the same." size={92} hi="same" />
        <div style={{ transform: `scale(${lock})` }}><Bead size={52} color={C.red} /></div>
      </div>
      <div style={{ marginTop: 40 }}>
        <Words f={f} at={54} text="It still needs the right analysis." size={70} color={C.red} />
      </div>
    </AbsoluteFill>
  );
};

const COUNT_ICONS = ['bars', 'agents', 'calc', 'layers', 'check', 'window', 'branch', 'badge', 'loop'];
// what you can count on: each word counted on a rod, then the solution, big
const CountOn: React.FC = () => {
  const f = useCurrentFrame();
  const W = ['Data products', 'Agents', 'Analysis', 'Architecture', 'Problem solving', 'Token-cost optimisation', 'Tracing', 'Failure detection', 'Tests'];
  const per = 12, k = Math.floor(f / per), landed = k >= W.length;
  const word = landed ? 'Enterprise solutions' : W[k];
  const lf = landed ? f - W.length * per : f - k * per;
  const inn = interpolate(lf, [0, landed ? 14 : 6], [0, 1], { extrapolateRight: 'clamp', easing: ease });
  const sweep = landed ? interpolate(lf, [8, 30], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }) : 0;
  const rodL = 150, rodR = 1500, bs = 34, gap = 46;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 140 }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 56, color: C.sec, letterSpacing: '-0.02em', ...fadeUp(f, 0) }}>You can count on</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: landed ? 160 : Math.min(150, Math.floor(2800 / word.length)), lineHeight: 1.02, letterSpacing: '-0.05em', marginTop: 10, color: landed ? C.ink : C.red, opacity: inn, transform: `translateY(${(1 - inn) * 30}px) scale(${landed ? 0.96 + 0.04 * inn : 1})`, transformOrigin: 'left center', filter: `blur(${(1 - inn) * 6}px)` }}>
        <span style={{ backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${sweep}% 32%`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 88%' }}>{landed ? <>Enterprise<br />solutions</> : word}</span>{landed && <Dot />}
      </div>
      {/* a picture for each word; when the answer lands, all of them at once */}
      {!landed && (
        <div style={{ position: 'absolute', left: 1520, top: 330, transform: `scale(${0.6 + 0.4 * inn}) rotate(${(1 - inn) * -12}deg)`, opacity: inn }}>
          <IconTile name={COUNT_ICONS[k % COUNT_ICONS.length]} size={200} />
        </div>
      )}
      {landed && (
        <div style={{ position: 'absolute', left: 1420, top: 250, display: 'grid', gridTemplateColumns: 'repeat(3, 110px)', gap: 18 }}>
          {COUNT_ICONS.map((ic, q) => {
            const pq = spring({ frame: lf - q * 3, fps: FPS, config: { damping: 11, stiffness: 190 } });
            return <div key={q} style={{ transform: `scale(${pq})` }}><IconTile name={ic} size={110} on={q % 4 !== 3} /></div>;
          })}
        </div>
      )}
      {/* the count: one bead slides home per word */}
      <div style={{ position: 'absolute', left: rodL, width: rodR - rodL, top: 838, height: 6, borderRadius: 999, background: 'linear-gradient(180deg, #e9d8bd, #d2b48d 70%, #b8946a)', ...fadeUp(f, 0, 14, 0) }} />
      {W.map((_, b) => {
        const go = interpolate(f, [b * per, b * per + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 1.3, 0.5, 1) });
        const x = (rodR - (W.length - b) * gap) + ((rodL + b * gap) - (rodR - (W.length - b) * gap)) * go;
        const glow = landed ? interpolate(lf, [b * 2, b * 2 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
        return <div key={b} style={{ position: 'absolute', left: x, top: 841 - bs / 2 }}><Bead size={bs} color={glow > 0.5 ? C.red : go > 0.5 ? C.ink : '#e6e1da'} style={{ boxShadow: 'none' }} /></div>;
      })}
    </AbsoluteFill>
  );
};

// the close: a wooden abacus, two rods, and the name inside it
const AbacusName: React.FC = () => {
  const f = useCurrentFrame();
  const L = 260, R = 1660, top = 210, bottom = 900;
  const posts = spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 90 } });
  const rods = interpolate(f, [10, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const word = interpolate(f, [50, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
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
        const slide = interpolate(f, [84 + i * 4, 104 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
        const home = L + 34 + 62 + bi * 116, away = R - 34 - 62 - (row.beads.length - 1 - bi) * 116;
        const x = home + (away - home) * slide * (row.beads.length === 3 && bi < 1 ? 0 : 1);
        const [b1, b2, b3] = tone[t];
        return <div key={i} style={{ position: 'absolute', left: x - 58, top: row.y - 58 - (1 - drop) * 300, width: 116, height: 116, borderRadius: '50%', opacity: Math.min(1, drop * 1.5), background: `radial-gradient(circle at 34% 28%, ${b1} 0%, ${b2} 38%, ${b3} 100%)`, boxShadow: 'inset -8px -10px 18px -6px rgba(0,0,0,0.16), 0 18px 22px -14px rgba(40,20,10,0.4)', zIndex: 3 }} />;
      }))}
      <div style={{ position: 'absolute', left: L + 110, top: 250, fontFamily: PIXEL, fontSize: 300, lineHeight: 0.8, color: C.ink, opacity: word, transform: `translateY(${(1 - word) * 30}px)`, letterSpacing: '-0.02em', zIndex: 2 }}>
        vahid<span style={{ display: 'inline-block', width: 52, height: 52, marginLeft: 10, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%, #ff9d8f 0%, #e0301e 42%, #a81a0b 100%)', transform: `scale(${spring({ frame: f - 78, fps: FPS, config: { damping: 8, stiffness: 160 } })})` }} />
      </div>
    </AbsoluteFill>
  );
};

// the close: the real photo in a wooden frame, who he is again, the skills around him
const ORBIT: [string, string, string, number][] = [
  ['agents', 'Applied AI', '2 yrs in production', -158], ['bars', 'Data products', '300M+ datapoints', -112], ['calc', 'Analysis', '95% on 14K+ titles', -68],
  ['window', 'Context design', '500+ installs', -22], ['branch', 'Shipping', '1,250+ commits', 22], ['globe', 'Languages', '2.3B+ people', 158],
];
const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 960, cy = 440, ph = 340;
  const photo = spring({ frame: f - 4, fps: FPS, config: { damping: 15, stiffness: 100 } });
  const dowel = 'linear-gradient(90deg, #b48a5c 0%, #d8bb94 24%, #f1e3cc 48%, #dcc29e 70%, #ad8455 100%)';
  return (
    <AbsoluteFill>
      {ORBIT.map(([ic, label, val, deg], k) => {
        const pop = spring({ frame: f - 22 - k * 6, fps: FPS, config: { damping: 12, stiffness: 140 } });
        const a = ((deg + Math.sin((f + k * 20) / 40) * 4) * Math.PI) / 180;
        const r = 0.6 + 0.4 * pop;
        const x = cx + Math.cos(a) * 560 * r, y = cy + Math.sin(a) * 250 * r;
        return (
          <React.Fragment key={label}>
            <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width="1" height="1"><line x1={cx} y1={cy} x2={x} y2={y} stroke={C.ink} strokeOpacity={0.12 * pop} strokeWidth={2} strokeDasharray="4 8" /></svg>
            <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${pop})`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px 12px 14px', borderRadius: 999, background: '#fff', border: `1.5px solid ${k === 0 ? C.red : C.line}`, boxShadow: '0 18px 30px -22px rgba(28,28,30,0.55)', whiteSpace: 'nowrap' }}>
              <AbIcon name={ic} size={34} color={k === 0 ? C.red : C.ink} />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 27, color: C.ink }}>{label}</span>
                <span style={{ fontFamily: MONO, fontSize: 19, color: k === 0 ? C.red : C.sec }}>{val}</span>
              </span>
            </div>
          </React.Fragment>
        );
      })}
      {/* the photo, in a minimal wooden frame */}
      <div style={{ position: 'absolute', left: cx - ph / 2 - 30, top: cy - ph / 2, width: ph + 60, height: ph, opacity: photo, transform: `scale(${0.85 + 0.15 * photo})` }}>
        <div style={{ position: 'absolute', left: 0, top: -14, width: 22, height: ph + 28, borderRadius: 999, background: dowel }} />
        <div style={{ position: 'absolute', right: 0, top: -14, width: 22, height: ph + 28, borderRadius: 999, background: dowel }} />
        <div style={{ position: 'absolute', left: 30, top: 0, width: ph, height: ph, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 60px -36px rgba(28,28,30,0.7)' }}>
          <Img src={staticFile('img/vahid.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - 0.08 * photo})` }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 742, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, letterSpacing: '-0.045em', color: C.ink, ...fadeUp(f, 30) }}>Vahid Faraji<Dot /></div>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.sec, marginTop: 6, ...fadeUp(f, 42) }}>AI-native architect · I make <b style={{ color: C.ink }}>data-driven decisions</b> easier · <b style={{ color: C.red }}>12 years</b></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, marginTop: 22, fontFamily: MONO, fontSize: 24, color: C.deep, ...fadeUp(f, 60) }}>
          <span>vfaraji89.github.io</span><span style={{ color: C.muted }}>·</span><span>linkedin.com/in/vahid-faraji-jobehdar</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// roots: economics and management before AI, as a rod you can count along
const STATIONS2: [string, string][] = [
  ['2013', 'Business administration'], ['2015', 'Research, 4 years'], ['2019', 'Co-founder, Defaro.io'], ['2019', 'M.A. Economics'],
  ['2021', 'Business analyst'], ['2022', 'Product manager, Data'], ['2025', 'Senior applied AI'],
];
const ROOT_STATS: [string, string][] = [['12 yrs', '8 industry · 4 research'], ['1', 'startup co-founded'], ['400+', 'people trained']];
const Roots: React.FC = () => {
  const f = useCurrentFrame();
  const L = 170, Rr = 1750, y = 880, step = (Rr - L) / (STATIONS2.length - 1);
  const run = interpolate(f, [40, 40 + 28 * (STATIONS2.length - 1)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 980 }}>
        <Kicker f={f} text="ROOTS" />
        <Big f={f} size={84}>Economist by training.<br /><span style={{ color: C.red }}>Builder</span> by habit<Dot /></Big>
        <div style={{ fontFamily: SANS, fontSize: 34, color: C.sec, marginTop: 22, ...fadeUp(f, 30) }}>Thesis: <b style={{ color: C.ink }}>real-time labour market analysis</b></div>
      </div>
      <div style={{ position: 'absolute', left: 1100, top: 200, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ROOT_STATS.map(([n, l], k) => {
          const pop = spring({ frame: f - 60 - k * 24, fps: FPS, config: { damping: 12, stiffness: 140 } });
          return (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 20, opacity: pop, transform: `translateX(${(1 - pop) * 40}px)` }}>
              <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, letterSpacing: '-0.045em', color: k === 0 ? C.red : C.ink, minWidth: 250, textAlign: 'right' }}>{n}</span>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.ink }}>{l}</span>
            </div>
          );
        })}
      </div>
      {/* the rod: a bead travels from business school to applied AI */}
      <div style={{ position: 'absolute', left: L - 40, width: (Rr - L + 80) * interpolate(f, [16, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }), top: y - 5, height: 10, borderRadius: 999, background: 'linear-gradient(180deg, #e9d8bd, #d2b48d 70%, #b8946a)' }} />
      {STATIONS2.map(([yr, role], k) => {
        const x = L + k * step;
        const on = interpolate(f, [40 + k * 28 - 4, 40 + k * 28 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
        const up = k % 2 === 0;
        return (
          <React.Fragment key={k}>
            <div style={{ position: 'absolute', left: x - 14, top: y - 14 }}><Bead size={28} color={on > 0.5 ? (k === STATIONS2.length - 1 ? C.red : C.ink) : '#e6e1da'} style={{ boxShadow: 'none' }} /></div>
            <div style={{ position: 'absolute', left: x - 130, width: 260, top: up ? y - 112 : y + 30, textAlign: 'center', opacity: on, transform: `translateY(${(1 - on) * (up ? 14 : -14)}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.deep }}>{yr}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 25, color: C.ink, lineHeight: 1.15, marginTop: 4 }}>{role}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', left: L + (Rr - L) * run - 20, top: y - 20, opacity: run > 0 && run < 1 ? 1 : 0 }}><Bead size={40} color={C.red} /></div>
    </AbsoluteFill>
  );
};

// AI at work: the enterprise platform, its users, what it took off people's desks
const AiAtWork: React.FC = () => {
  const f = useCurrentFrame();
  const n60 = interpolate(f, [70, 120], [0, 60], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cols = 20, rows = 10, gap = 34;
  const lit = interpolate(f, [30, 150], [0, cols * rows], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const caps: [string, string][] = [['flow', 'Text-to-SQL'], ['page', 'Report automation'], ['loop', 'AI feedback loops']];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 860 }}>
        <Kicker f={f} text="AI AT WORK" />
        <Big f={f} size={96}>Then AI went<br />to work<Dot /></Big>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 34, ...fadeUp(f, 64) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, color: C.red, letterSpacing: '-0.045em' }}>{Math.round(n60)}%</span>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ink, lineHeight: 1.2 }}>less workload<br /><span style={{ fontFamily: MONO, fontSize: 21, color: C.sec, fontWeight: 400 }}>enterprise AI platform · group-wide standard</span></span>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
          {caps.map(([ic, t], k) => {
            const pop = spring({ frame: f - 110 - k * 10, fps: FPS, config: { damping: 12, stiffness: 160 } });
            return <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 10px 12px', borderRadius: 999, border: `1.5px solid ${C.ink}`, background: '#fff', transform: `scale(${pop})`, opacity: pop, whiteSpace: 'nowrap' }}><AbIcon name={ic} size={30} /><span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24 }}>{t}</span></div>;
          })}
        </div>
      </div>
      {/* every bead a person using it */}
      <div style={{ position: 'absolute', left: 1130, top: 270, width: cols * gap, height: rows * gap }}>
        {Array.from({ length: cols * rows }).map((_, k) => {
          const on = k < lit, r = Math.floor(k / cols), c = k % cols;
          return <div key={k} style={{ position: 'absolute', left: c * gap, top: r * gap, transform: `scale(${on ? 1 : 0.55})` }}><Bead size={20} color={on ? ((k * 37) % 23 === 0 ? C.red : C.ink) : '#ebe7e1'} style={{ boxShadow: 'none' }} /></div>;
        })}
        <div style={{ position: 'absolute', left: 0, top: rows * gap + 22, display: 'flex', alignItems: 'baseline', gap: 14, ...fadeUp(f, 140) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', color: C.ink }}>200+</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: C.sec }}>people use it · one bead each</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Yapay Zekâ İzi: a concept. The ad and its sentences are a mock, not real data.
const YZ_LINES: [string, string, string][] = [
  ['Üretken yapay zekâ ile içerik üretimi', 'GENERATIVE AI', C.red],
  ['Makine öğrenmesi modellerinin geliştirilmesi', 'CLASSIC AI · ML', C.ink],
  ['ChatGPT ve Copilot deneyimi', 'TOOLS · ChatGPT, Copilot', C.deep],
];
const YZ_STEPS: [string, string][] = [['page', 'Read every sentence'], ['branch', 'GenAI vs classic ML'], ['check', 'Normalise tool names'], ['bars', 'By period, tool, sector']];
const Yzi: React.FC = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [20, 90], [0, 1.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cardIn = spring({ frame: f - 24, fps: FPS, config: { damping: 15, stiffness: 110 } });
  const scanY = interpolate(f, [56, 140], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 860 }}>
        <Kicker f={f} text="YAPAY ZEKÂ İZİ · CONCEPT" />
        <Big f={f} size={80}>When did AI show up<br />in job ads<span style={{ color: C.red }}>?</span></Big>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 30, ...fadeUp(f, 18) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 112, color: C.red, letterSpacing: '-0.045em' }}>{n.toFixed(1)}M</span>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ink, lineHeight: 1.2 }}>job ads<br /><span style={{ fontFamily: MONO, fontSize: 22, color: C.sec, fontWeight: 400 }}>2022, the GPT moment → 2026 H1</span></span>
        </div>
      </div>
      {/* a mock ad, read sentence by sentence */}
      <div style={{ position: 'absolute', left: 1080, top: 200, width: 720, padding: '28px 32px', borderRadius: 22, background: '#fff', border: `1.5px solid ${C.line}`, boxShadow: '0 30px 60px -40px rgba(28,28,30,0.6)', opacity: cardIn, transform: `translateY(${(1 - cardIn) * 40}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 19, color: C.muted, letterSpacing: '0.08em' }}>JOB AD · SAMPLE</span>
          <span style={{ fontFamily: MONO, fontSize: 17, color: C.red, border: `1.5px solid ${C.red}`, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.08em' }}>CONFIDENTIAL · CONCEPT</span>
        </div>
        {YZ_LINES.map(([t, tag, col], k) => {
          const hit = interpolate(scanY, [k + 0.2, k + 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={t} style={{ marginTop: 22 }}>
              <div style={{ fontFamily: SANS, fontSize: 30, color: C.ink, display: 'inline', backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundSize: `${hit * 100}% 100%`, backgroundRepeat: 'no-repeat', padding: '2px 4px', borderRadius: 4 }}>{t}</div>
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${col}`, fontFamily: MONO, fontSize: 18, color: col, opacity: hit, transform: `scale(${0.8 + 0.2 * hit})`, transformOrigin: 'left center', marginLeft: 0, display: 'flex', width: 'fit-content' } as React.CSSProperties}>
                <Bead size={12} color={col} style={{ boxShadow: 'none' }} />{tag}
              </div>
            </div>
          );
        })}
      </div>
      {/* the pipeline */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 800, display: 'flex', alignItems: 'center', gap: 18 }}>
        {YZ_STEPS.map(([ic, t], k) => {
          const pop = spring({ frame: f - 140 - k * 12, fps: FPS, config: { damping: 12, stiffness: 160 } });
          return (
            <React.Fragment key={t}>
              {k > 0 && <div style={{ flex: 1, height: 3, background: C.ink, opacity: 0.2 + 0.6 * pop, transform: `scaleX(${pop})`, transformOrigin: 'left' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px 14px 14px', borderRadius: 18, background: '#fff', border: `2px solid ${k === 3 ? C.red : C.ink}`, transform: `scale(${pop})`, opacity: pop, whiteSpace: 'nowrap' }}>
                <AbIcon name={ic} size={34} color={k === 3 ? C.red : C.ink} /><span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 27 }}>{t}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// the shipping habit: public commits, counted in beads of ten
const COMMITS = 1258, RECENT = 1127;
const Shipping: React.FC = () => {
  const f = useCurrentFrame();
  const beads = Math.ceil(COMMITS / 10), cols = 14, gap = 40;
  const n = interpolate(f, [24, 130], [0, COMMITS], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const lit = Math.ceil(n / 10);
  const facts: [string, string][] = [['3', 'papers in 2026'], ['1', 'patent pending'], ['18h', 'applied AI course'], ['Mentor', 'TEV Foundation']];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 900 }}>
        <Kicker f={f} text="THE SHIPPING HABIT" />
        <Big f={f} size={96}>I ship<br />in public<Dot /></Big>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 30, ...fadeUp(f, 20) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 116, color: C.red, letterSpacing: '-0.045em' }}>{Math.round(n).toLocaleString('en-US')}</span>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ink, lineHeight: 1.2 }}>public commits<br /><span style={{ fontFamily: MONO, fontSize: 22, color: C.sec, fontWeight: 400 }}>{RECENT.toLocaleString('en-US')} in the last 12 months</span></span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: '0.12em', color: C.deep, marginTop: 30, ...fadeUp(f, 112) }}>2026 SO FAR</div>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          {facts.map(([big, l], k) => (
            <div key={l} style={{ ...fadeUp(f, 120 + k * 12) }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: '-0.03em', color: C.ink }}>{big}</div>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.sec }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1180, top: 250, width: cols * gap }}>
        {Array.from({ length: beads }).map((_, k) => {
          const on = k < lit, r = Math.floor(k / cols), c = k % cols;
          const recent = k >= beads - Math.ceil(RECENT / 10);
          return <div key={k} style={{ position: 'absolute', left: c * gap, top: r * gap, transform: `scale(${on ? 1 : 0.5})` }}><Bead size={26} color={on ? (recent ? C.red : C.ink) : '#ebe7e1'} style={{ boxShadow: 'none' }} /></div>;
        })}
        <div style={{ position: 'absolute', left: 0, top: Math.ceil(beads / cols) * gap + 16, display: 'flex', gap: 22, fontFamily: MONO, fontSize: 20, color: C.sec, whiteSpace: 'nowrap', ...fadeUp(f, 100) }}>
          <span>one bead = 10 commits</span><span style={{ color: C.red }}>● last 12 months</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// the opening: the tools keep changing. Abacus, calculator, Mac, agent; then the abacus drops into the story
const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const xs = [360, 760, 1160, 1560], y = 560;
  const T0 = [8, 46, 84, 122];                    // when each tool arrives
  const active = f < T0[1] ? 0 : f < T0[2] ? 1 : f < T0[3] ? 2 : 3;
  const drop = interpolate(f, [160, 196], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const others = 1 - interpolate(f, [150, 172], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pop = (k: number) => spring({ frame: f - T0[k], fps: FPS, config: { damping: 12, stiffness: 150 } });
  const hl = (k: number) => (k === active && f < 150 ? 1 : 0);
  const labels = ['Abacus', 'Calculator', 'Mac', 'Agent'];
  const dowel = 'linear-gradient(90deg, #b48a5c, #f1e3cc 50%, #ad8455)';
  // 1. abacus: three rods, beads counting
  const abacus = (
    <div style={{ position: 'relative', width: 250, height: 190 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 190, borderRadius: 999, background: dowel }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: 16, height: 190, borderRadius: 999, background: dowel }} />
      {[0, 1, 2].map((r) => (
        <React.Fragment key={r}>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 42 + r * 52, height: 6, borderRadius: 9, background: 'linear-gradient(180deg, #e9d8bd, #b8946a)' }} />
          {[0, 1, 2].map((b) => {
            const moved = interpolate(f, [T0[0] + 6 + (r * 3 + b) * 3, T0[0] + 12 + (r * 3 + b) * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 1.4, 0.5, 1) });
            const x = 120 + b * 34 - moved * 96;
            return <div key={b} style={{ position: 'absolute', left: x, top: 30 + r * 52, width: 30, height: 30, borderRadius: '50%', background: `radial-gradient(circle at 34% 28%, ${r === 1 ? '#ff8f80, #e0301e 45%, #9e1a0c' : '#fff, #f1ede8 45%, #d6cfc7'})`, boxShadow: '0 6px 8px -5px rgba(40,20,10,0.4)' }} />;
          })}
        </React.Fragment>
      ))}
    </div>
  );
  // 2. calculator: keys pressed in time, the display counting
  const ck = Math.max(0, Math.floor((f - T0[1] - 6) / 4));
  const digits = f < T0[1] + 6 ? '0' : ['1', '12', '12+', '12+30', '12+30=', '42'][Math.min(5, ck)];
  const calc = (
    <div style={{ width: 170, height: 230, borderRadius: 22, background: C.ink, padding: 14, boxShadow: '0 20px 30px -18px rgba(28,28,30,0.7)' }}>
      <div style={{ height: 50, borderRadius: 10, background: '#f4efe9', fontFamily: MONO, fontSize: 30, color: C.ink, textAlign: 'right', padding: '6px 12px' }}>{digits}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginTop: 12 }}>
        {Array.from({ length: 16 }).map((_, k) => {
          const on = f >= T0[1] + 6 && ck % 16 === (k * 5) % 16 && f < T0[1] + 32;
          return <div key={k} style={{ height: 28, borderRadius: 7, background: k % 4 === 3 ? C.red : on ? '#fff' : '#3a3a3e', transform: `scale(${on ? 0.86 : 1})` }} />;
        })}
      </div>
    </div>
  );
  // 3. Mac: code typing on the screen
  const typed = interpolate(f, [T0[2] + 4, T0[2] + 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mac = (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 280, height: 180, borderRadius: 14, background: C.ink, padding: 10 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 6, background: '#fff', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[0.7, 0.45, 0.85, 0.35, 0.6].map((w, k) => (
            <div key={k} style={{ height: 9, borderRadius: 5, width: `${Math.max(0, Math.min(1, typed * 5 - k)) * w * 100}%`, background: k === 2 ? C.red : 'rgba(28,28,30,0.55)', marginLeft: k % 2 ? 18 : 0 }} />
          ))}
        </div>
      </div>
      <div style={{ width: 320, height: 14, borderRadius: '0 0 12px 12px', background: 'linear-gradient(180deg, #d9d6d2, #b9b5b0)' }} />
    </div>
  );
  // 4. agent: a prompt bubble, thinking dots, then three helpers spawning
  const think = f >= T0[3] + 4 && f < T0[3] + 22;
  const spawn = (k: number) => spring({ frame: f - T0[3] - 22 - k * 5, fps: FPS, config: { damping: 11, stiffness: 180 } });
  const agent = (
    <div style={{ position: 'relative', width: 260, height: 210 }}>
      <div style={{ position: 'absolute', left: 60, top: 10, width: 140, height: 120, borderRadius: 28, background: '#fff', border: `3px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {think ? <div style={{ display: 'flex', gap: 8 }}>{[0, 1, 2].map((d) => <div key={d} style={{ width: 14, height: 14, borderRadius: '50%', background: C.ink, opacity: 0.3 + 0.7 * Math.abs(Math.sin((f - d * 4) / 5)) }} />)}</div> : <AbIcon name="agents" size={70} color={f >= T0[3] + 22 ? C.red : C.ink} />}
      </div>
      {[0, 1, 2].map((k) => {
        const sp = spawn(k), x = 40 + k * 90, yy = 185;
        return (
          <React.Fragment key={k}>
            <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width="1" height="1"><line x1={130} y1={130} x2={x + 16} y2={yy} stroke={C.ink} strokeOpacity={0.35 * sp} strokeWidth={2} /></svg>
            <div style={{ position: 'absolute', left: x, top: yy - 16, transform: `scale(${sp})` }}><Bead size={32} color={k === 1 ? C.red : C.ink} style={{ boxShadow: 'none' }} /></div>
          </React.Fragment>
        );
      })}
    </div>
  );
  const items = [abacus, calc, mac, agent];
  const run = interpolate(f, [T0[0], T0[3]], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', opacity: others }}>
        <Words f={f} at={4} text="The tools keep changing." size={64} />
      </div>
      {/* the rod they sit on, and a bead walking along it */}
      <div style={{ position: 'absolute', left: xs[0], width: (xs[3] - xs[0]) * interpolate(f, [4, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), top: 806, height: 6, borderRadius: 9, background: 'linear-gradient(180deg, #e9d8bd, #b8946a)', opacity: others }} />
      <div style={{ position: 'absolute', left: xs[0] + (xs[3] - xs[0]) * (run / 3) - 14, top: 795, opacity: others }}><Bead size={28} color={C.red} style={{ boxShadow: 'none' }} /></div>
      {items.map((el, k) => {
        const p0 = pop(k);
        const isAb = k === 0;
        const x = isAb ? xs[0] + (960 - xs[0]) * drop : xs[k];
        const yy = isAb ? y + (540 - y) * drop : y;
        const sc = (0.9 + 0.1 * p0) * 1.3 * (1 + 0.08 * hl(k)) * (isAb ? 1 + 0.7 * drop : 1);
        return (
          <React.Fragment key={k}>
            <div style={{ position: 'absolute', left: x, top: yy, transform: `translate(-50%, -50%) scale(${sc}) translateY(${(1 - p0) * 40}px)`, opacity: Math.min(1, p0 * 1.4) * (isAb ? 1 : others) }}>{el}</div>
            <div style={{ position: 'absolute', left: xs[k] - 120, width: 240, top: 735, textAlign: 'center', opacity: Math.min(1, p0) * others }}>
              <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.1em', color: hl(k) ? C.red : C.sec, borderBottom: hl(k) ? `3px solid ${C.red}` : '3px solid transparent', paddingBottom: 6 }}>{labels[k].toUpperCase()}</span>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// talking to agents: a prompt typed, a plan back, helpers spawned, the answer checked
const PROMPT = 'Map 14K job titles to a standard. Check every answer.';
const PLAN: [string, string][] = [['branch', 'Plan'], ['globe', 'Search'], ['page', 'Extract'], ['check', 'Evaluate']];
const Agents: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(interpolate(f, [24, 84], [0, PROMPT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const reply = spring({ frame: f - 96, fps: FPS, config: { damping: 13, stiffness: 140 } });
  const done = spring({ frame: f - 150, fps: FPS, config: { damping: 10, stiffness: 160 } });
  const wx = 1010, wy = 210, ww = 800;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 220, width: 820 }}>
        <Kicker f={f} text="TALKING TO AGENTS" />
        <Big f={f} size={100}>I speak<br />agent, too<Dot /></Big>
        <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
          {[['window', 'Context'], ['plug', 'Tools · MCP'], ['check', 'Evals']].map(([ic, t], k) => {
            const pp = spring({ frame: f - 40 - k * 10, fps: FPS, config: { damping: 12, stiffness: 160 } });
            return <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 10px 12px', borderRadius: 999, border: `1.5px solid ${C.ink}`, background: '#fff', transform: `scale(${pp})`, opacity: pp, whiteSpace: 'nowrap' }}><AbIcon name={ic} size={30} /><span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26 }}>{t}</span></div>;
          })}
        </div>
      </div>
      {/* the conversation */}
      <div style={{ position: 'absolute', left: wx, top: wy, width: ww, height: 640, borderRadius: 24, background: '#fff', border: `1.5px solid ${C.line}`, boxShadow: '0 40px 70px -46px rgba(28,28,30,0.65)', ...fadeUp(f, 6, 20, 40) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 24px', borderBottom: `1px solid ${C.line}` }}>
          {[C.red, '#e6e1da', '#e6e1da'].map((c, k) => <div key={k} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />)}
          <span style={{ fontFamily: MONO, fontSize: 19, color: C.muted, marginLeft: 10 }}>agent · session</span>
        </div>
        <div style={{ padding: 26 }}>
          <div style={{ marginLeft: 'auto', maxWidth: 560, padding: '16px 20px', borderRadius: '18px 18px 4px 18px', background: C.ink, color: '#fff', fontFamily: SANS, fontSize: 28, lineHeight: 1.35, opacity: f >= 20 ? 1 : 0 }}>
            {PROMPT.slice(0, chars)}<span style={{ opacity: chars < PROMPT.length && Math.floor(f / 6) % 2 ? 1 : 0 }}>|</span>
          </div>
          <div style={{ marginTop: 22, maxWidth: 640, padding: '16px 20px', borderRadius: '18px 18px 18px 4px', background: C.paper, border: '1px solid rgba(224,48,30,0.18)', opacity: reply, transform: `translateY(${(1 - reply) * 20}px)` }}>
            <div style={{ fontFamily: SANS, fontSize: 26, color: C.ink }}>On it. Four helpers, one job each:</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              {PLAN.map(([ic, t], k) => {
                const pp = spring({ frame: f - 108 - k * 8, fps: FPS, config: { damping: 11, stiffness: 180 } });
                return <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 12, background: '#fff', border: `1.5px solid ${k === 3 ? C.red : C.ink}`, transform: `scale(${pp})`, opacity: pp }}><AbIcon name={ic} size={26} color={k === 3 ? C.red : C.ink} /><span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 23 }}>{t}</span></div>;
              })}
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, opacity: done, transform: `scale(${0.9 + 0.1 * done})`, transformOrigin: 'left center' }}>
            <IconTile name="check" size={56} pop={done} />
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.ink, letterSpacing: '-0.02em' }}>95% right<span style={{ fontFamily: MONO, fontWeight: 400, fontSize: 21, color: C.sec, marginLeft: 12 }}>checked, then shipped</span></span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// problem → data → solution: noisy titles, read in order, turned into one standard with people and pay data joined
const NOISY = ['Sr. Data Analyst', 'Kıdemli Veri Analisti', 'data analist (jr)', 'Veri Analizi Uzmanı', 'DATA ANALYST!!!', 'Raporlama & Veri Uzm.'];
const ProblemData: React.FC = () => {
  const f = useCurrentFrame();
  const merge = interpolate(f, [128, 166], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const card = spring({ frame: f - 160, fps: FPS, config: { damping: 12, stiffness: 120 } });
  const n95 = interpolate(f, [190, 226], [0, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const lx = 1080, ly = 230, rowH = 74, cx = 1400, cy = 520;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 860 }}>
        <Kicker f={f} text="PROBLEM → DATA → SOLUTION" />
        <Big f={f} size={88}>Noisy job titles.<br /><span style={{ color: C.red }}>One clear answer</span><Dot /></Big>
        <div style={{ fontFamily: SANS, fontSize: 32, color: C.sec, marginTop: 24, lineHeight: 1.35, ...fadeUp(f, 24) }}>
          Years of <b style={{ color: C.ink }}>text data</b>: job titles, <b style={{ color: C.ink }}>people data</b> and <b style={{ color: C.ink }}>salaries</b>.
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 30, ...fadeUp(f, 186) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, color: C.red, letterSpacing: '-0.04em' }}>{Math.round(n95)}%</span>
          <span style={{ fontFamily: MONO, fontSize: 23, color: C.sec, lineHeight: 1.4 }}>right on 14K+ real job titles<br />peer-reviewed, ACM CAIS ’26</span>
        </div>
      </div>
      {/* step 1: the problem, in order */}
      <div style={{ position: 'absolute', left: lx, top: ly - 50, fontFamily: MONO, fontSize: 21, letterSpacing: '0.1em', color: C.deep, opacity: 1 - merge }}>1 · THE PROBLEM: ONE JOB, MANY NAMES</div>
      {NOISY.map((t, i) => {
        const pp = spring({ frame: f - 30 - i * 14, fps: FPS, config: { damping: 13, stiffness: 150 } });
        const x0 = lx, y0 = ly + i * rowH;
        const x = x0 + (cx - 200 - x0) * merge, yy = y0 + (cy - 30 - y0) * merge;
        return (
          <div key={t} style={{ position: 'absolute', left: x, top: yy, display: 'flex', alignItems: 'center', gap: 14, opacity: pp * (1 - merge), transform: `translateX(${(1 - pp) * 40}px) scale(${1 - merge * 0.4})` }}>
            <span style={{ fontFamily: MONO, fontSize: 19, color: C.muted, width: 26 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ padding: '10px 18px', borderRadius: 12, background: '#fff', border: `1.5px dashed ${i % 3 === 0 ? C.red : 'rgba(28,28,30,0.3)'}`, fontFamily: MONO, fontSize: 26, color: C.ink, whiteSpace: 'nowrap' }}>{t}</span>
          </div>
        );
      })}
      {/* step 2 and 3: data, then the solution */}
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * card})`, opacity: card, width: 620, padding: '30px 34px', borderRadius: 24, background: C.ink, color: '#fff', boxShadow: '0 40px 60px -30px rgba(28,28,30,0.7)' }}>
        <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: '0.1em', color: '#ff9d8f' }}>2 · DATA → 3 · SOLUTION</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, letterSpacing: '-0.02em', marginTop: 8 }}>Data Analyst</div>
        {['Standard occupation (O*NET, ESCO)', 'Skills linked', 'People and salary data joined'].map((t, k) => {
          const pp = interpolate(f, [178 + k * 10, 190 + k * 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, opacity: pp, transform: `translateX(${(1 - pp) * 20}px)` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: k === 2 ? C.red : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AbIcon name="check" size={22} color={k === 2 ? '#fff' : C.ink} /></div>
              <span style={{ fontFamily: SANS, fontSize: 27 }}>{t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ================= camera, new scenes and transitions =================

// A camera inside each scene: keyframes of [frame, scale, x, y] (x, y = the
// point to look at), eased between, with a touch of blur while it moves fast.
type Key = [number, number, number, number];
const Camera: React.FC<{ keys: Key[]; children: React.ReactNode }> = ({ keys, children }) => {
  const f = useCurrentFrame();
  const at = (fr: number) => {
    const fs = keys.map((k) => k[0]);
    const o = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.bezier(0.65, 0, 0.35, 1) };
    // piecewise: ease each segment on its own
    let i = 0; while (i < keys.length - 2 && fr > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const k = a[0] === b[0] ? 1 : interpolate(fr, [a[0], b[0]], [0, 1], o);
    return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
  };
  const [z, x, y] = at(f), [z0, x0, y0] = at(f - 1);
  const speed = Math.abs(z - z0) * 220 + Math.hypot(x - x0, y - y0) * 0.06;
  const blur = Math.min(3, speed);
  // the focus point is brought to the centre of the frame (keys use the centre when not zoomed)
  const tx = 960 - x, ty = 540 - y;
  return (
    <AbsoluteFill style={{ transform: `scale(${z}) translate(${tx}px, ${ty}px)`, transformOrigin: '50% 50%', filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// know the problem: the same job, written a dozen ways, converges to one answer
const MESSY: [string, number, number, number][] = [
  ['Sr. Data Analyst', 1080, 240, -6], ['Kıdemli Veri Analisti', 1380, 300, 4], ['data analist (jr)', 1120, 400, 3],
  ['Veri Analizi Uzmanı', 1460, 470, -5], ['Analyst, Data – BI', 1060, 560, -2], ['DATA ANALYST!!!', 1400, 640, 6],
  ['Analista de datos', 1150, 720, -4], ['Raporlama & Veri Uzm.', 1480, 780, 2],
];
const ProblemSolution: React.FC = () => {
  const f = useCurrentFrame();
  const merge = interpolate(f, [130, 175], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const answer = spring({ frame: f - 168, fps: FPS, config: { damping: 12, stiffness: 120 } });
  const n95 = interpolate(f, [196, 232], [0, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cx = 1290, cy = 500;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 220, width: 800 }}>
        <Kicker f={f} text="PROBLEM &amp; SOLUTION" />
        <Big f={f} size={100}>Know the<br />problem<Dot /></Big>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: '-0.03em', color: C.red, marginTop: 24, ...fadeUp(f, 172) }}>Then the solution.</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 30, ...fadeUp(f, 196) }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: C.ink, letterSpacing: '-0.03em' }}>{Math.round(n95)}%</span>
          <span style={{ fontFamily: MONO, fontSize: 24, color: C.sec, lineHeight: 1.4 }}>right on 14K+ real job titles<br />peer-reviewed, ACM CAIS ’26</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1290, top: 104, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap', opacity: interpolate(f, [6, 20, 124, 140], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <Bead size={18} color={C.red} style={{ boxShadow: 'none' }} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.ink, letterSpacing: '-0.02em' }}>One job. Eight ways to write it.</span>
      </div>
      {MESSY.map(([t, x, y, rot], i) => {
        const pop = spring({ frame: f - 12 - i * 7, fps: FPS, config: { damping: 12, stiffness: 140 } });
        const jitter = Math.sin((f + i * 13) / 9) * 6 * (1 - merge);
        const px = x + (cx - x) * merge, py = y + (cy - y) * merge + jitter;
        return (
          <div key={t} style={{ position: 'absolute', left: px, top: py, transform: `translate(-50%, -50%) rotate(${rot * (1 - merge)}deg) scale(${pop * (1 - merge * 0.6)})`, opacity: pop * (1 - merge), padding: '12px 22px', borderRadius: 12, background: '#fff', border: `1.5px dashed ${i % 3 === 0 ? C.red : 'rgba(28,28,30,0.3)'}`, fontFamily: MONO, fontSize: 26, color: C.ink, whiteSpace: 'nowrap', boxShadow: '0 16px 26px -20px rgba(28,28,30,0.6)' }}>{t}</div>
        );
      })}
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * answer})`, opacity: answer, padding: '30px 40px', borderRadius: 22, background: C.ink, color: '#fff', boxShadow: '0 40px 60px -30px rgba(28,28,30,0.7)', minWidth: 520 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: '0.1em', color: '#ff9d8f' }}>ONE STANDARD OCCUPATION</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: '-0.02em', marginTop: 8 }}>Data Analyst</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {['O*NET', 'ESCO', 'skills linked'].map((tag) => <span key={tag} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', fontFamily: MONO, fontSize: 19 }}>{tag}</span>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// analytical thinking, shown on ProjectLens: the old sprawl, then before and after
const MsIcon: React.FC<{ kind: 'excel' | 'word' | 'outlook'; size: number }> = ({ kind, size }) => {
  const i = (ms as Record<string, { vb: string; body: string }>)[kind];
  return <svg width={size} height={size} viewBox={i.vb} dangerouslySetInnerHTML={{ __html: i.body }} />;
};
const SPRAWL: ['excel' | 'word' | 'outlook', string, number, number, number][] = [
  ['outlook', 'Approval? (3rd reminder)', 1000, 250, -4], ['word', 'effort_estimate.docx', 1380, 210, 3], ['excel', 'quote_v2_final2.xlsx', 1660, 300, -2],
  ['outlook', 'RE: RE: Price?', 1080, 410, 2], ['excel', 'quote_FINAL_v7.xlsx', 1420, 400, -5], ['outlook', 'RE: Revised quote', 1700, 470, 4],
  ['outlook', 'Urgent: latest price?', 1020, 590, -3], ['word', 'quote_text_final2.docx', 1340, 610, 2], ['excel', 'price_list_old.xlsx', 1640, 650, -4],
  ['word', 'scope_v3.docx', 1180, 760, 5], ['outlook', 'Who approved this?', 1520, 800, -2],
];
const GAINS: [string, string, string][] = [
  ['Pricing a project', '2 hours', '10 minutes'],
  ['Collecting a request', '30 minutes', '5 minutes'],
  ['Arithmetic and copy errors', 'Yes', 'Designed out'],
  ['Waiting in an approval queue', 'Yes', 'No'],
  ['Cycle time, conversion, margin', 'Not measured', 'Measured'],
];
const Analytical: React.FC = () => {
  const f = useCurrentFrame();
  const gather = interpolate(f, [78, 106], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const lens = spring({ frame: f - 98, fps: FPS, config: { damping: 12, stiffness: 130 } });
  const table = interpolate(f, [146, 166], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cx = 1360, cy = 520;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 760 }}>
        <div style={{ opacity: interpolate(f, [112, 134], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <Kicker f={f} text="ANALYTICAL THINKING · PROJECTLENS" />
          <Big f={f} size={92}>Quotes lived in<br />Excel and e-mail<Dot /></Big>
        </div>
      </div>
      {/* the sprawl: real file and mail cards drifting, then pulled into one tool */}
      {SPRAWL.map(([k, t, x, y, rot], i) => {
        const pop = spring({ frame: f - 6 - i * 5, fps: FPS, config: { damping: 12, stiffness: 140 } });
        const drift = Math.sin((f + i * 17) / 14) * 8 * (1 - gather);
        const px = x + (cx - x) * gather, py = y + (cy - y) * gather + drift;
        const label = k === 'excel' ? 'EXCEL' : k === 'word' ? 'WORD' : 'OUTLOOK';
        return (
          <div key={t} style={{ position: 'absolute', left: px, top: py, transform: `translate(-50%, -50%) rotate(${rot * (1 - gather)}deg) scale(${pop * (1 - gather * 0.7)})`, opacity: pop * (1 - gather), padding: '14px 20px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.94)', border: `1px solid ${C.line}`, boxShadow: '0 18px 30px -22px rgba(28,28,30,0.55)', minWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MsIcon kind={k} size={34} />
              <span style={{ fontFamily: MONO, fontSize: 18, letterSpacing: '0.1em', color: C.muted }}>{label}</span>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.ink, marginTop: 8, whiteSpace: 'nowrap' }}>{t}</div>
          </div>
        );
      })}
      {/* one tool */}
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${lens * (1 - table * 0.25)}) translateY(${-table * 600}px)`, opacity: lens * (1 - table), padding: '26px 40px', borderRadius: 22, background: '#fff', border: `2px solid ${C.ink}`, boxShadow: '0 40px 60px -30px rgba(28,28,30,0.6)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="7.5" fill="#6a1b9a" /><path d="M10.5 7.25v6.5M7.25 10.5h6.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" /><path d="M16 16l4.75 4.75" stroke="#6a1b9a" strokeWidth="2.6" strokeLinecap="round" /></svg>
        <div><div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, color: C.ink, letterSpacing: '-0.02em' }}>ProjectLens</div><div style={{ fontFamily: MONO, fontSize: 20, color: C.sec }}>one flow · request to approval</div></div>
      </div>
      {/* before and after */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 200, opacity: table }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: C.deep }}>WHAT IT CHANGED</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', color: C.ink, marginTop: 10 }}>Measure, then decide<Dot /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 1fr', marginTop: 30, fontFamily: MONO, fontSize: 20, letterSpacing: '0.12em', color: C.muted }}>
          <span>WORK</span><span>BEFORE</span><span style={{ color: C.deep }}>AFTER</span>
        </div>
        {GAINS.map(([w, before, after], i) => {
          const k = interpolate(f, [158 + i * 11, 174 + i * 11], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          const strike = interpolate(f, [166 + i * 11, 182 + i * 11], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={w} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 1fr', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${C.line}`, opacity: k, transform: `translateY(${(1 - k) * 16}px)` }}>
              <span style={{ fontFamily: SANS, fontSize: 34, color: C.ink }}>{w}</span>
              <span style={{ fontFamily: SANS, fontSize: 30, color: C.muted, backgroundImage: `linear-gradient(${C.muted}, ${C.muted})`, backgroundSize: `${strike}% 2px`, backgroundPosition: 'left 55%', backgroundRepeat: 'no-repeat', justifySelf: 'start' }}>{before}</span>
              <span style={{ justifySelf: 'start', padding: '8px 20px', borderRadius: 12, background: C.paper, border: '1px solid rgba(224,48,30,0.25)', fontFamily: SANS, fontWeight: 800, fontSize: 36, color: C.red, transform: `scale(${0.9 + 0.1 * k})` }}>{after}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// a zoom-through transition: the old scene rushes towards you, the new one settles in
type ZoomProps = Record<string, never>;
const ZoomThroughView: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  const style: React.CSSProperties = presentationDirection === 'exiting'
    ? { transform: `scale(${1 + p * 0.9})`, opacity: 1 - p, filter: `blur(${p * 10}px)` }
    : { transform: `scale(${0.82 + 0.18 * p})`, opacity: p, filter: `blur(${(1 - p) * 8}px)` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
const zoomThrough = (): TransitionPresentation<ZoomProps> => ({ component: ZoomThroughView, props: {} });

// the red rod sweeps down and the abacus rolls in behind it
const RodView: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  if (presentationDirection === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${(1 - p) * 100}% 0)` }}>{children}</AbsoluteFill>
      {p < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, height: 6, marginTop: -3, background: C.red }} />}
    </AbsoluteFill>
  );
};
const rod = (): TransitionPresentation<ZoomProps> => ({ component: RodView, props: {} });

// ---- cold open: an abacus counts three, the name lands, we dive through ------
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 64) return null;
  const out = interpolate(f, [44, 62], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const posts = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 120 } });
  const word = interpolate(f, [20, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const dowel = 'linear-gradient(90deg, #b48a5c 0%, #d8bb94 24%, #f1e3cc 48%, #dcc29e 70%, #ad8455 100%)';
  return (
    <AbsoluteFill style={{ background: C.paper, opacity: 1 - out, transform: `scale(${1 + out * 1.8})`, filter: `blur(${out * 8}px)` }}>
      <div style={{ position: 'absolute', left: 660, top: 330, width: 600, height: 300 }}>
        {[0, 1].map((k) => <div key={k} style={{ position: 'absolute', left: k ? 560 : 0, top: (1 - posts) * -120, width: 40, height: 300, borderRadius: 999, background: dowel, opacity: posts }} />)}
        <div style={{ position: 'absolute', left: 20, right: 20, top: 222, height: 10, borderRadius: 999, background: 'linear-gradient(180deg, #e9d8bd, #b8946a)' }} />
        {[0, 1, 2].map((i) => {
          const slide = interpolate(f, [6 + i * 5, 16 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6)) });
          const x = 60 + i * 70 + slide * 240;
          return <div key={i} style={{ position: 'absolute', left: x, top: 196, width: 62, height: 62, borderRadius: '50%', background: `radial-gradient(circle at 34% 28%, ${i === 2 ? '#ff8f80' : '#ffffff'} 0%, ${i === 2 ? '#e0301e' : '#f1ede9'} 40%, ${i === 2 ? '#9e1a0c' : '#d6cfc8'} 100%)`, boxShadow: '0 12px 16px -10px rgba(40,20,10,0.45)' }} />;
        })}
        <div style={{ position: 'absolute', left: 70, top: 30, fontFamily: PIXEL, fontSize: 170, lineHeight: 0.8, color: C.ink, opacity: word, transform: `translateY(${(1 - word) * 20}px)` }}>vahid<span style={{ color: C.red }}>.</span></div>
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

// ---- the cut: eight scenes, seven transitions, 60 seconds -----------------
const T = 20; // transition length in frames
const scene = (Scene: React.FC, keys: Key[], tint = '#ffffff', corner = '100% 0%') => () => (
  <AbsoluteFill>
    <Paper tint={tint} corner={corner} />
    <Camera keys={keys}><Scene /></Camera>
  </AbsoluteFill>
);
// [duration, scene, transition into the next]
const CUT: [number, React.FC, (() => TransitionPresentation<any>) | null][] = [
  // the opening: the tools keep changing; the abacus drops into the story
  [200, scene(Opening, [[0, 1.06, 960, 540], [150, 1, 960, 540], [200, 1.25, 960, 540]], C.paper, '50% 0%'), zoomThrough],
  [170, scene(Origin, [[0, 1.6, 1500, 470], [50, 1.6, 1500, 470], [96, 1, 960, 540], [170, 1.04, 920, 540]]), () => slide({ direction: 'from-right' })],
  [210, scene(Languages, [[0, 1, 960, 540], [210, 1.03, 960, 540]], '#ffffff', '0% 100%'), () => wipe({ direction: 'from-left' })],
  // talking to agents
  [190, scene(Agents, [[0, 1, 960, 540], [190, 1.04, 1000, 540]], '#fffaf8', '100% 0%'), zoomThrough],
  // problem → data → solution
  [250, scene(ProblemData, [[0, 1, 960, 540], [250, 1.04, 960, 540]], '#ffffff', '0% 0%'), () => slide({ direction: 'from-bottom' })],
  [210, scene(Roots, [[0, 1.04, 960, 520], [210, 1, 960, 540]], C.paper, '0% 0%'), () => wipe({ direction: 'from-left' })],
  [190, scene(AiAtWork, [[0, 1, 960, 540], [190, 1.04, 1000, 540]], '#ffffff', '0% 100%'), () => slide({ direction: 'from-right' })],
  [230, scene(TokalatorStory, [[0, 1, 960, 540], [230, 1.06, 1000, 540]], '#fffaf8', '100% 0%'), () => clockWipe({ width: 1920, height: 1080 })],
  [260, scene(Analytical, [[0, 1, 960, 540], [90, 1.05, 960, 540], [140, 1, 960, 540], [260, 1.02, 960, 540]], '#ffffff', '0% 100%'), zoomThrough],
  [230, scene(Yzi, [[0, 1, 960, 540], [230, 1.03, 960, 540]], '#fffaf8', '100% 100%'), () => slide({ direction: 'from-right' })],
  [200, scene(Shipping, [[0, 1.03, 960, 540], [200, 1, 960, 540]], '#ffffff', '0% 0%'), rod],
  [140, scene(Shift, [[0, 1.04, 960, 540], [140, 1, 960, 540]], C.paper, '0% 0%'), () => wipe({ direction: 'from-bottom' })],
  [190, scene(CountOn, [[0, 1, 960, 540], [190, 1.04, 960, 540]]), rod],
  [130, scene(AbacusName, [[0, 1.12, 960, 540], [130, 1, 960, 540]], C.paper, '100% 0%'), zoomThrough],
  [180, scene(Closing, [[0, 1.12, 960, 470], [180, 1, 960, 540]], '#ffffff', '0% 100%'), null],
];
const START = CUT.reduce<number[]>((acc, [d], i) => (i === 0 ? [0] : [...acc, acc[i - 1] + CUT[i - 1][0] - T]), []);

export const AnimatedCV: React.FC = () => (
  <AbsoluteFill style={{ background: '#ffffff' }}>
    <Audio src={staticFile('soundtrack.wav')} />
    <TransitionSeries>
      {CUT.map(([d, Scene, tr], i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={d}><Scene /></TransitionSeries.Sequence>
          {tr && <TransitionSeries.Transition presentation={tr()} timing={i % 2 ? springTiming({ config: { damping: 200 }, durationInFrames: T }) : linearTiming({ durationInFrames: T })} />}
        </React.Fragment>
      ))}
    </TransitionSeries>
    <Brand />
  </AbsoluteFill>
);
