// @ds-adherence-ignore -- APEX motion graphics (specimen-locked raw hex/px by design)
// APEX — 9 play-once stat animations. 390×420 phone-stat area, black bg.
// Plays once on mount, then holds the final frame. Click to replay.
// Specimen lock: Archivo 900 UPPERCASE headlines + big numbers; Inter for labels.

const COL = {
  BG: '#000000', SURFACE: '#0E0E10', LINE: '#222227', TEXT: '#FFFFFF',
  MUTED: '#7D7D83', FAINT: '#3A3A3E', GREEN: '#1ED760', RED: '#FF4B4B', AMBER: '#F0A52A',
  TRACK: '#161618',
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const INTER = "'Inter', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const CANVAS = { W: 390, H: 420 };

// ── easing ── default ease-out cubic-bezier(.22,.61,.36,1)
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) { const e = sx(t) - x; const d = dx(t) || 1e-6; t -= e / d; }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const EASE = cubicBezier(.22, .61, .36, 1);     // default ease-out
const EASE_IN = cubicBezier(.55, .06, .68, .19); // accelerate
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const mix = (a, b, p) => a + (b - a) * p;
const eo = (t, a, b) => EASE(prog(t, a, b));
const backOut = (p) => { const c = 1.70158; const u = p - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
function lerpHex(h1, h2, p) {
  const n = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = n(h1), b = n(h2);
  const c = a.map((v, i) => Math.round(mix(v, b[i], clamp(p, 0, 1))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ── play-once clock (holds final frame); returns [t, replay] ──
function useClock(duration) {
  const frozen = (typeof localStorage !== 'undefined' && localStorage.getItem('apex-freeze') === '1');
  const [t, setT] = React.useState(frozen ? duration : 0);
  const [run, setRun] = React.useState(0);
  React.useEffect(() => {
    if (frozen) { setT(duration); return; }
    let raf, start = null;
    const tick = (now) => {
      if (start == null) start = now;
      const el = (now - start) / 1000;
      if (el >= duration) { setT(duration); return; }
      setT(el); raf = requestAnimationFrame(tick);
    };
    setT(0); raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [duration, run]);
  return [t, () => setRun((r) => r + 1)];
}

function Frame({ replay, children, w = CANVAS.W, h = CANVAS.H, pad = 24 }) {
  return (
    <div onClick={replay} style={{
      position: 'relative', width: w, height: h, background: COL.BG, overflow: 'hidden',
      fontFamily: INTER, color: COL.TEXT, boxSizing: 'border-box', padding: pad, cursor: 'pointer',
      WebkitFontSmoothing: 'antialiased',
    }}>{children}</div>
  );
}
const HEAD = (size) => ({
  fontFamily: ARCHIVO, fontWeight: 900, fontSize: size, lineHeight: 1.02,
  letterSpacing: '-0.5px', textTransform: 'uppercase', margin: 0,
});

// ═══════════════════════════════ 1 · HALO — Your face opens doors ═══════════════════════════════
function A1_Halo() {
  const DUR = 2.3;
  const [t, replay] = useClock(DUR);
  const rows = [
    ['Dating & relationships', 80], ['Trust & likability', 65],
    ['Hiring & promotions', 35], ['Income', 30],
  ];
  return (
    <Frame replay={replay}>
      <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: COL.MUTED, opacity: eo(t, 0, 0.3) }}>
        The looks advantage
      </div>
      <h1 style={{ ...HEAD(28), marginTop: 8, color: COL.TEXT, opacity: eo(t, 0.05, 0.4), transform: `translateY(${(1 - eo(t, 0.05, 0.4)) * 8}px)` }}>
        Your face<br />opens doors
      </h1>
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {rows.map(([label, val], i) => {
          const ls = 0.1 + i * 0.08;
          const lblOp = eo(t, ls, ls + 0.3);
          const bs = 0.35 + i * 0.15, be = bs + 0.62;
          const grow = eo(t, bs, be);
          const num = Math.round(mix(0, val, grow));
          const glint = i === 0 ? prog(t, 1.7, 2.2) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: lblOp, transform: `translateY(${(1 - lblOp) * 8}px)` }}>
              <div style={{ width: 122, fontFamily: INTER, fontWeight: 600, fontSize: 13.5, color: COL.TEXT, lineHeight: 1.15 }}>{label}</div>
              <div style={{ position: 'relative', flex: 1, height: 18, background: COL.TRACK, borderRadius: 9, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${val}%`, background: COL.GREEN, borderRadius: 9, transform: `scaleX(${grow})`, transformOrigin: 'left' }}></div>
                {i === 0 && glint > 0 && glint < 1 && (
                  <div style={{ position: 'absolute', top: 0, bottom: 0, width: 26, left: `${glint * 100}%`, transform: 'translateX(-50%)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)' }}></div>
                )}
              </div>
              <div style={{ width: 42, textAlign: 'right', ...HEAD(16), color: COL.TEXT }}>{num}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22, fontFamily: INTER, fontWeight: 600, fontSize: 13, color: COL.TEXT, opacity: eo(t, 1.6, 2.0) }}>
        Attractive people get picked first — in love and at work.
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 2 · DATING REALITY ═══════════════════════════════
function A2_Dating() {
  const DUR = 2.4;
  const [t, replay] = useClock(DUR);
  const vals = [0, 0, 0, 0, 0, 1, 4, 8, 17, 39];
  const xl = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
  const maxV = 39, chartH = 176;
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(24), color: COL.TEXT, opacity: eo(t, 0, 0.32) }}>The match gap</h1>
      <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 11.5, color: COL.MUTED, marginTop: 7, opacity: eo(t, 0.1, 0.45) }}>
        Avg dating-app likes per week, by looks tier.
      </div>
      <div style={{ position: 'relative', height: chartH + 6, marginTop: 22 }}>
        {/* gridlines */}
        {[0, 1, 2, 3, 4].map((g) => (
          <div key={g} style={{ position: 'absolute', left: 0, right: 0, top: (chartH / 4) * g, height: 1, background: COL.LINE, opacity: eo(t, 0, 0.4) }}></div>
        ))}
        {/* bars */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: chartH, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {vals.map((v, i) => {
            const bs = 0.4 + i * 0.11, be = bs + 0.5;
            const grow = eo(t, bs, be);
            const h = Math.max(3, (v / maxV) * chartH) * grow;
            const num = Math.round(mix(0, v, grow));
            const isTop = i === vals.length - 1;
            const pulse = isTop ? 1 + 0.04 * Math.sin(prog(t, be, DUR) * Math.PI) : 1;
            return (
              <div key={i} style={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ ...HEAD(13.5), color: isTop ? COL.GREEN : COL.TEXT, marginBottom: 5, opacity: grow > 0.15 ? 1 : 0 }}>{num}</div>
                <div style={{
                  width: '100%', height: Math.max(3, h), borderRadius: 4,
                  background: isTop ? COL.GREEN : COL.TEXT, transform: `scaleY(${pulse})`, transformOrigin: 'bottom',
                  boxShadow: isTop ? `0 0 ${10 + 14 * prog(t, be, DUR)}px ${COL.GREEN}` : 'none',
                }}></div>
              </div>
            );
          })}
        </div>
        {/* tag */}
        <div style={{ position: 'absolute', right: 30, top: 22, fontFamily: INTER, fontWeight: 600, fontSize: 11.5, color: COL.GREEN, opacity: eo(t, 1.9, 2.3), whiteSpace: 'nowrap' }}>
          Top 10% ↑
        </div>
      </div>
      {/* x-axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, opacity: eo(t, 0.1, 0.45) }}>
        {xl.map((x, i) => (
          <div key={i} style={{ width: 24, textAlign: 'center', fontFamily: MONO, fontWeight: 400, fontSize: 9.5, color: i === xl.length - 1 ? COL.GREEN : COL.MUTED }}>{x}</div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 4, fontFamily: MONO, fontWeight: 400, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: COL.FAINT, opacity: eo(t, 0.2, 0.5) }}>
        ← less attractive · more attractive →
      </div>
      <div style={{ marginTop: 14, fontFamily: INTER, fontWeight: 600, fontSize: 13.5, color: COL.TEXT, opacity: eo(t, 1.9, 2.4) }}>
        The top 10% get it all. The bottom half get ignored.
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 4 · HOW COUPLES MEET TODAY ═══════════════════════════════
function A4_Couples() {
  const DUR = 2.2;
  const [t, replay] = useClock(DUR);
  const rows = [
    ['Dating apps', 61.2], ['Via friends', 13.9], ['At work', 8.5], ['At a bar', 4.9],
    ['Via family', 4.5], ['At school', 3.3], ['In church', 2.1], ['In college', 0.7],
  ];
  const maxV = 61.2;
  return (
    <Frame replay={replay} pad={22}>
      <h1 style={{ ...HEAD(23), color: COL.TEXT, opacity: eo(t, 0, 0.35) }}>How couples meet today</h1>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(([label, val], i) => {
          const ls = 0.05 + i * 0.05;
          const lblOp = eo(t, ls, ls + 0.28);
          const bs = 0.3 + i * 0.09, be = bs + 0.6;
          const grow = eo(t, bs, be);
          const num = (mix(0, val, grow)).toFixed(1);
          const isTop = i === 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: lblOp, transform: `translateY(${(1 - lblOp) * 6}px)` }}>
              <div style={{ width: 96, fontFamily: INTER, fontWeight: 600, fontSize: 13, color: isTop ? COL.GREEN : COL.TEXT }}>{label}</div>
              <div style={{ position: 'relative', flex: 1, height: 13 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(val / maxV) * 100}%`, background: isTop ? COL.GREEN : COL.TEXT, borderRadius: 7, transform: `scaleX(${grow})`, transformOrigin: 'left', boxShadow: isTop ? `0 0 ${8 + 10 * prog(t, be, DUR)}px ${COL.GREEN}66` : 'none' }}></div>
              </div>
              <div style={{ width: 46, textAlign: 'right', ...HEAD(14.5), color: COL.TEXT }}>{num}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, fontFamily: INTER, fontWeight: 400, fontSize: 11.5, color: COL.MUTED, opacity: eo(t, 1.5, 2.0) }}>
        61% meet on apps now — where your photo is everything.
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 7 · LOOKS PAY ═══════════════════════════════
function A7_LooksPay() {
  const DUR = 2.4;
  const [t, replay] = useClock(DUR);
  const tiers = [
    ['Bottom 50%', 48, false], ['Average', 54, false], ['Above avg', 59, false],
    ['Top 20%', 66, true], ['Top 10%', 71, true],
  ];
  const maxV = 71, chartH = 196, baseTop = 138;
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(26), color: COL.TEXT, opacity: eo(t, 0, 0.35) }}>Looks pay</h1>
      <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 12, color: COL.MUTED, marginTop: 6, opacity: eo(t, 0.1, 0.4) }}>Median earnings by looks tier — the “beauty premium.”</div>
      {/* bracket + total */}
      <div style={{ position: 'relative', textAlign: 'center', marginTop: 18, height: 22, ...HEAD(18), color: COL.GREEN, textShadow: '0 0 16px rgba(30,215,96,.45)', opacity: eo(t, 1.7, 2.1) }}>
        +${Math.round(mix(0, 230, eo(t, 1.7, 2.35)))}k over a career
      </div>
      <div style={{ position: 'relative', height: chartH, marginTop: 8 }}>
        {/* bracket spanning bottom→top bar */}
        <svg width="100%" height={chartH} viewBox={`0 0 342 ${chartH}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: eo(t, 1.55, 1.95) }}>
          <path d={`M 24,118 L 24,104 L 318,104 L 318,40`} fill="none" stroke={COL.GREEN} strokeWidth="1.5" strokeDasharray="3 4" />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, height: chartH - 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {tiers.map(([label, val, premium], i) => {
            const bs = 0.35 + i * 0.16, be = bs + 0.55;
            const grow = eo(t, bs, be);
            const frac = 0.42 + 0.58 * (val - 48) / (71 - 48); const h = frac * (chartH - 78) * grow;
            const dollars = Math.round(mix(0, val, grow));
            return (
              <div key={i} style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ ...HEAD(15), color: premium ? COL.GREEN : COL.TEXT, marginBottom: 5, opacity: grow > 0.12 ? 1 : 0 }}>${dollars}k</div>
                <div style={{ width: '100%', height: Math.max(2, h), borderRadius: 5, background: premium ? COL.GREEN : COL.MUTED, boxShadow: premium ? `0 0 12px ${COL.GREEN}55` : 'none' }}></div>
                <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 8.5, letterSpacing: '0.5px', color: COL.MUTED, marginTop: 8, textAlign: 'center', opacity: eo(t, 0.1, 0.4), lineHeight: 1.15 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 3 · MOST OF IT IS FIXABLE ═══════════════════════════════
// Face line-art with controllable zones lighting up + 80% "in your control" donut.
function FaceContour({ draw, color = COL.TEXT, sw = 2, mouth = true }) {
  // viewBox 0 0 120 150 — front face contour
  const len = 540;
  const off = len * (1 - draw);
  return (
    <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={len} strokeDashoffset={off}>
      <path d="M60,12 C45,12 34,21 31,38 C29,50 30,63 33,77 C37,97 48,116 60,122 C72,116 83,97 87,77 C90,63 91,50 89,38 C86,21 75,12 60,12 Z" />
      <path d="M39,45 C44,42 50,42 55,45" /><path d="M65,45 C70,42 76,42 81,45" />
      <path d="M40,53 C45,49.5 51,49.5 56,53 C51,56.5 45,56.5 40,53 Z" /><path d="M64,53 C69,49.5 75,49.5 80,53 C75,56.5 69,56.5 64,53 Z" />
      <path d="M60,57 C59,65 57,71 55,74 C58,77 62,77 65,74" />
      {mouth && <path d="M51,90 C56,93 64,93 69,90" />}
    </g>
  );
}
function A3_Fixable() {
  const DUR = 2.5;
  const [t, replay] = useClock(DUR);
  const levers = ['Skin', 'Hair & hairline', 'Body fat & jaw', 'Brows & grooming', 'Style & posture'];
  const R = 30, C = 2 * Math.PI * R;
  const dp = eo(t, 1.6, 2.35);
  const donutPct = Math.round(mix(0, 80, dp));
  const zones = [
    { x: 34, y: 64, w: 22, h: 16, rx: 6 },
    { x: 33, y: 30, w: 54, h: 14, rx: 8 },
    { x: 40, y: 96, w: 40, h: 16, rx: 8 },
    { x: 33, y: 38, w: 54, h: 8, rx: 4 },
    { x: 50, y: 118, w: 20, h: 12, rx: 5 },
  ];
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(26), color: COL.TEXT, opacity: eo(t, 0, 0.32) }}>Most of it<br />is fixable</h1>
      <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
        <svg width="112" height="140" viewBox="0 0 120 150" style={{ flex: 'none' }}>
          {zones.map((z, i) => {
            const zs = 0.3 + i * 0.2;
            const zp = eo(t, zs, zs + 0.3);
            return <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx} fill={COL.GREEN} opacity={0.18 * zp} />;
          })}
          <FaceContour draw={eo(t, 0, 0.32)} />
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {levers.map((l, i) => {
              const cs = 0.3 + i * 0.2;
              const cp = eo(t, cs, cs + 0.28);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: eo(t, cs - 0.1, cs + 0.2) }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: `${COL.GREEN}22`, display: 'grid', placeItems: 'center', transform: `scale(${0.6 + 0.4 * backOut(cp)})` }}>
                    <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2.5,6.5 L5,9 L9.5,3.5" fill="none" stroke={COL.GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12" strokeDashoffset={12 * (1 - cp)} /></svg>
                  </div>
                  <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 13, color: COL.TEXT, whiteSpace: 'nowrap' }}>{l}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 13, color: COL.MUTED, opacity: eo(t, 0.4, 0.9), maxWidth: 130, lineHeight: 1.3 }}>
          Bone structure — fixed
        </div>
        <div style={{ position: 'relative', width: 86, height: 86 }}>
          <svg width="86" height="86" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={R} fill="none" stroke={COL.LINE} strokeWidth="7" />
            <circle cx="40" cy="40" r={R} fill="none" stroke={COL.GREEN} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - 0.8 * dp)} transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...HEAD(24), color: COL.GREEN }}>{donutPct}%</div>
            <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 7.5, letterSpacing: '1px', color: COL.MUTED, marginTop: 1 }}>IN YOUR CONTROL</div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 5 · THE LONELIEST GENERATION ═══════════════════════════════
function A5_Loneliest() {
  const DUR = 2.7;
  const [t, replay] = useClock(DUR);
  const pathRef = React.useRef(null);
  const [len, setLen] = React.useState(0);
  React.useEffect(() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()); }, []);
  const PX0 = 44, PX1 = 350, PY0 = 96, PY1 = 268;
  const yMax = 30;
  const Y = (v) => PY1 - (v / yMax) * (PY1 - PY0);
  const data = [[1989, 7], [1994, 8.5], [1998, 7.5], [2002, 10], [2006, 9], [2010, 13], [2014, 17], [2018, 27]];
  const X = (yr) => PX0 + ((yr - 1989) / (2018 - 1989)) * (PX1 - PX0);
  const pts = data.map(([yr, v]) => [X(yr), Y(v)]);
  const dPath = 'M ' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ');
  const draw = EASE_IN(prog(t, 0.4, 2.1));
  const peakP = eo(t, 2.1, 2.6);
  const peakNum = Math.round(mix(0, 27, peakP));
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(22), color: COL.TEXT, opacity: eo(t, 0, 0.35) }}>The loneliest<br />generation</h1>
      <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 11.5, color: COL.MUTED, marginTop: 7, opacity: eo(t, 0.1, 0.45), maxWidth: 300 }}>
        Share of men under 30 with zero dating in the past year.
      </div>
      <svg width="100%" height="240" viewBox="0 0 390 290" style={{ marginTop: 4, overflow: 'visible' }}>
        {[0, 10, 20, 30].map((v) => (
          <g key={v} opacity={eo(t, 0.1, 0.5)}>
            <line x1={PX0} y1={Y(v)} x2={PX1} y2={Y(v)} stroke={COL.LINE} strokeWidth="1" />
            <text x={PX0 - 8} y={Y(v) + 4} textAnchor="end" fontFamily={MONO} fontSize="10" fill={COL.MUTED}>{v}</text>
          </g>
        ))}
        {[1989, 2008, 2018].map((yr) => (
          <text key={yr} x={X(yr)} y={PY1 + 18} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={COL.MUTED} opacity={eo(t, 0.1, 0.5)}>{yr}</text>
        ))}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={48} fill={COL.RED} opacity={0.07 * prog(t, 1.5, 2.3)} />
        <path ref={pathRef} d={dPath} fill="none" stroke={COL.RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={len || 1} strokeDashoffset={len ? len * (1 - draw) : (len || 1)} style={{ opacity: len ? 1 : 0 }} />
        {pts.map((p, i) => {
          const passed = draw >= (i / (pts.length - 1));
          return passed ? <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4.5 : 2.8} fill={COL.RED} /> : null;
        })}
        <text x={pts[0][0] - 2} y={pts[0][1] - 10} fontFamily={ARCHIVO} fontWeight="900" fontSize="14" fill={COL.RED} opacity={eo(t, 0.6, 1.0)}>7%</text>
      </svg>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 13.5, color: COL.TEXT, marginTop: 10, opacity: eo(t, 2.3, 2.65) }}>More than 1 in 4 young men now go a year with zero dates — and almost none of it is bone.</div>
      <div style={{ position: 'absolute', right: 26, top: 150, ...HEAD(24), color: COL.RED, opacity: eo(t, 2.0, 2.3) }}>{peakNum}%</div>
    </Frame>
  );
}

// ═══════════════════════════════ 6 · THE HALO EFFECT (faces) ═══════════════════════════════
function A6_HaloFaces() {
  const DUR = 2.5;
  const [t, replay] = useClock(DUR);
  const items = ['Intelligent', 'Kind', 'Trustworthy'];
  const faceDraw = eo(t, 0.3, 0.85);
  const accentDraw = eo(t, 0.6, 1.0);
  const haloPulse = 1 + 0.06 * Math.sin(prog(t, 2.0, DUR) * Math.PI);
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(26), color: COL.TEXT, opacity: eo(t, 0, 0.32) }}>The halo effect</h1>
      <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 11.5, color: COL.MUTED, marginTop: 7, opacity: eo(t, 0.1, 0.45) }}>
        We judge your character by your face — in 0.1s.
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
        {[0, 1].map((side) => {
          const good = side === 0;
          const accent = good ? COL.GREEN : COL.RED;
          return (
            <div key={side} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="120" height="138" viewBox="0 0 120 150" style={{ overflow: 'visible' }}>
                {good ? (
                  <ellipse cx="60" cy="6" rx="30" ry="8" fill="none" stroke={accent} strokeWidth="3"
                    strokeDasharray="120" strokeDashoffset={120 * (1 - accentDraw)} style={{ transform: `scale(${haloPulse})`, transformOrigin: '60px 6px' }} />
                ) : (
                  <g fill={accent} opacity={accentDraw}>
                    <path d="M34,18 L30,4 L42,16 Z" />
                    <path d="M86,18 L90,4 L78,16 Z" />
                  </g>
                )}
                <FaceContour draw={faceDraw} mouth={false} />
                <path d={good ? 'M50,89 C56,95 64,95 70,89' : 'M50,95 C56,89 64,89 70,95'} fill="none" stroke={COL.TEXT} strokeWidth="2" strokeLinecap="round" opacity={faceDraw} />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, width: '100%' }}>
                {items.map((it, i) => {
                  const rs = 0.9 + (i * 2 + side) * 0.11;
                  const rp = eo(t, rs, rs + 0.3);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: rp, transform: `translateY(${(1 - rp) * 6}px)`, justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flex: 'none' }}>
                        {good
                          ? <path d="M3,7.5 L6,10.5 L11,4" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          : <path d="M4,4 L10,10 M10,4 L4,10" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />}
                      </svg>
                      <div style={{ width: 78, textAlign: 'left', fontFamily: INTER, fontWeight: 500, fontSize: 13, color: COL.TEXT }}>{it}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 8 · 1% BETTER EVERY DAY ═══════════════════════════════
function A8_Compound() {
  const DUR = 2.5;
  const [t, replay] = useClock(DUR);
  const curveRef = React.useRef(null);
  const [len, setLen] = React.useState(0);
  React.useEffect(() => { if (curveRef.current) setLen(curveRef.current.getTotalLength()); }, []);
  const PX0 = 40, PX1 = 350, PY0 = 92, PY1 = 286;
  const N = 40;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    const val = Math.pow(37.8, x);
    const yv = (val - 1) / (37.8 - 1);
    pts.push([PX0 + x * (PX1 - PX0), PY1 - yv * (PY1 - PY0)]);
  }
  const dCurve = 'M ' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ');
  const dArea = dCurve + ` L ${PX1},${PY1} L ${PX0},${PY1} Z`;
  const draw = EASE_IN(prog(t, 0.3, 1.9));
  const mult = (mix(1, 37.8, EASE_IN(prog(t, 0.3, 1.9)))).toFixed(2);
  const refDraw = eo(t, 0.1, 0.7);
  return (
    <Frame replay={replay}>
      <h1 style={{ ...HEAD(26), color: COL.TEXT, opacity: eo(t, 0, 0.32) }}>1% better<br />every day</h1>
      <div style={{ position: 'absolute', right: 24, top: 26, ...HEAD(22), color: COL.GREEN, textShadow: '0 0 16px rgba(30,215,96,.45)', opacity: eo(t, 0.3, 0.7) }}>{mult}×</div>
      <svg width="100%" height="232" viewBox="0 0 390 300" style={{ marginTop: 6, overflow: 'visible' }}>
        <defs>
          <linearGradient id="a8area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COL.GREEN} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COL.GREEN} stopOpacity="0" />
          </linearGradient>
          <clipPath id="a8clip"><rect x={PX0} y="0" width={(PX1 - PX0) * draw} height="300" /></clipPath>
        </defs>
        <line x1={PX0} y1={PY1} x2={PX1} y2={PY1 - 0.28 * (PY1 - PY0)} stroke={COL.FAINT} strokeWidth="1.5" strokeDasharray="4 5"
          style={{ opacity: refDraw }} strokeDashoffset={400 * (1 - refDraw)} />
        <g clipPath="url(#a8clip)">
          <path d={dArea} fill="url(#a8area)" />
          <path ref={curveRef} d={dCurve} fill="none" stroke={COL.GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {draw > 0.02 && (() => {
          const idx = Math.min(N, Math.round(draw * N));
          const p = pts[idx];
          const pulse = draw > 0.98 ? 4.5 + 2 * Math.abs(Math.sin(prog(t, 1.9, DUR) * Math.PI)) : 4;
          return <circle cx={p[0]} cy={p[1]} r={pulse} fill={COL.GREEN} style={{ filter: `drop-shadow(0 0 5px ${COL.GREEN})` }} />;
        })()}
        <circle cx={pts[0][0]} cy={pts[0][1]} r="4" fill={COL.TEXT} opacity={eo(t, 0.3, 0.6)} />
        <text x={pts[0][0] + 8} y={pts[0][1] + 4} fontFamily={MONO} fontWeight="400" fontSize="10.5" fill={COL.TEXT} opacity={eo(t, 0.4, 0.7)}>you</text>
        <text x={PX0} y={PY1 + 18} textAnchor="start" fontFamily={MONO} fontSize="10" fill={COL.MUTED} opacity={eo(t, 0.1, 0.5)}>Day 1</text>
        <text x={PX1} y={PY1 + 18} textAnchor="end" fontFamily={MONO} fontSize="10" fill={COL.MUTED} opacity={eo(t, 0.1, 0.5)}>1 year</text>
      </svg>
      <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 12, color: COL.MUTED, opacity: eo(t, 1.9, 2.4), textAlign: 'center' }}>
        Small daily wins compound.
      </div>
    </Frame>
  );
}

// ═══════════════════════════════ 9 · BEFORE / AFTER MORPH ═══════════════════════════════
function A9_BeforeAfter() {
  const DUR = 2.3;
  const [t, replay] = useClock(DUR);
  const wipe = eo(t, 0.3, 1.6);
  const score = Math.round(mix(67, 81, eo(t, 0.3, 1.6)));
  const scoreCol = lerpHex(COL.AMBER, COL.GREEN, eo(t, 0.3, 1.6));
  const after = wipe > 0.5;
  const badge = backOut(eo(t, 1.6, 2.1));
  const CW = 300, CH = 360;
  return (
    <Frame replay={replay} pad={0}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ position: 'relative', width: CW, height: CH, borderRadius: 16, overflow: 'hidden', background: COL.SURFACE }}>
          <img src="../reviews/g1-before.jpg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
            <img src="../reviews/g1-after.jpg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {wipe > 0.01 && wipe < 0.99 && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 2, background: COL.GREEN, boxShadow: `0 0 12px ${COL.GREEN}` }}></div>
          )}
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ ...HEAD(40), color: scoreCol, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{score}</div>
            <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 9.5, letterSpacing: '1.5px', color: '#FFFFFFcc', textTransform: 'uppercase' }}>Looks score</div>
          </div>
          <div style={{ position: 'absolute', left: 14, bottom: 14, padding: '6px 12px', borderRadius: 999, background: after ? COL.GREEN : COL.SURFACE, color: after ? '#04240F' : COL.MUTED, fontFamily: INTER, fontWeight: 600, fontSize: 10, letterSpacing: '1px' }}>
            {after ? 'AFTER' : 'BEFORE'}
          </div>
          {badge > 0 && (
            <div style={{ position: 'absolute', right: 14, bottom: 12, ...HEAD(18), color: COL.GREEN, textShadow: `0 0 14px ${COL.GREEN}`, transform: `scale(${badge})`, transformOrigin: 'bottom right' }}>+14</div>
          )}
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, { A1_Halo, A2_Dating, A3_Fixable, A4_Couples, A5_Loneliest, A6_HaloFaces, A7_LooksPay, A8_Compound, A9_BeforeAfter });
