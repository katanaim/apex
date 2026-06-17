const Easing = {
  linear: (t) => t,
  // Quad
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // Quart
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  // Expo
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  // Sine
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  // Elastic
  easeOutElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}
const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });
const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);
const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
const useSprite = () => React.useContext(SpriteContext);
function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value = { localTime, progress, duration, visible };
  return /* @__PURE__ */ React.createElement(SpriteContext.Provider, { value }, typeof children === "function" ? children(value) : children);
}
function TextSprite({
  text,
  x = 0,
  y = 0,
  size = 48,
  color = "#111",
  font = "Inter, system-ui, sans-serif",
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = "left",
  letterSpacing = "-0.01em"
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let ty = 0;
  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }
  const translateX = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    transform: `translate(${translateX}, ${ty}px)`,
    opacity,
    fontFamily: font,
    fontSize: size,
    fontWeight: weight,
    color,
    letterSpacing,
    whiteSpace: "pre",
    lineHeight: 1.1,
    willChange: "transform, opacity"
  } }, text);
}
function ImageSprite({
  src,
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = "cover",
  placeholder = null
  // {label: string} for striped placeholder
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }
  const content = placeholder ? /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)",
    color: "#6b6458",
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
    fontSize: 13,
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  } }, placeholder.label || "image") : /* @__PURE__ */ React.createElement("img", { src, alt: "", style: { width: "100%", height: "100%", objectFit: fit, display: "block" } });
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width,
    height,
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: "center",
    borderRadius: radius,
    overflow: "hidden",
    willChange: "transform, opacity"
  } }, content);
}
function RectSprite({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color = "#111",
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render
  // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const { localTime, duration } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }
  const overrides = render ? render(spriteCtx) : {};
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width,
    height,
    background: color,
    borderRadius: radius,
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: "center",
    willChange: "transform, opacity",
    ...overrides
  } });
}
function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = "#f6f4ef",
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = "animstage",
  children
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ":t") || "0");
      return 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(true);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ":t", String(time));
    } catch {
    }
  }, [time, persistKey]);
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 0;
      const s = Math.min(
        el.clientWidth / width,
        (el.clientHeight - barH) / height
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1e3;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (true) next = next % duration;
          else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") {
        setTime((t) => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === "ArrowRight") {
        setTime((t) => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === "0" || e.code === "Home") {
        setTime(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration]);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing, setTime, setPlaying }),
    [displayTime, duration, playing]
  );
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: stageRef,
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#000000",
        fontFamily: "Inter, system-ui, sans-serif"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      minHeight: 0
    } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: canvasRef,
        style: {
          width,
          height,
          background,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          flexShrink: 0,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement(TimelineContext.Provider, { value: ctxValue }, children)
    )),
    false
  );
}
function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };
  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };
  const onTrackDown = (e) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? time / duration * 100 : 0;
  const fmt = (t) => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor(total * 100 % 100);
    return `${String(m).padStart(1, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  const mono = "JetBrains Mono, ui-monospace, SFMono-Regular, monospace";
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 16px",
    background: "rgba(20,20,20,0.92)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    borderRadius: 8,
    color: "#f6f4ef",
    fontFamily: "Inter, system-ui, sans-serif",
    userSelect: "none",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement(IconButton, { onClick: onReset, title: "Return to start (0)" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M3 2v10M12 2L5 7l7 5V2z", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round", strokeLinecap: "round" }))), /* @__PURE__ */ React.createElement(IconButton, { onClick: onPlayPause, title: "Play/pause (space)" }, playing ? /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "2", width: "3", height: "10", fill: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "8", y: "2", width: "3", height: "10", fill: "currentColor" })) : /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M3 2l9 5-9 5V2z", fill: "currentColor" }))), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: mono,
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    width: 64,
    textAlign: "right",
    color: "#f6f4ef"
  } }, fmt(time)), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: trackRef,
      onMouseMove: onTrackMove,
      onMouseLeave: onTrackLeave,
      onMouseDown: onTrackDown,
      style: {
        flex: 1,
        height: 22,
        position: "relative",
        cursor: "pointer",
        display: "flex",
        alignItems: "center"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 4,
      background: "rgba(255,255,255,0.12)",
      borderRadius: 2
    } }),
    /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 0,
      width: `${pct}%`,
      height: 4,
      background: "oklch(72% 0.12 250)",
      borderRadius: 2
    } }),
    /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: `${pct}%`,
      top: "50%",
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      background: "#fff",
      borderRadius: 6,
      boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
    } })
  ), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: mono,
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    width: 64,
    textAlign: "left",
    color: "rgba(246,244,239,0.55)"
  } }, fmt(duration)));
}
function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      title,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        color: "#f6f4ef",
        cursor: "pointer",
        padding: 0,
        transition: "background 120ms"
      }
    },
    children
  );
}
Object.assign(window, {
  Easing,
  interpolate,
  animate,
  clamp,
  TimelineContext,
  useTime,
  useTimeline,
  Sprite,
  SpriteContext,
  useSprite,
  TextSprite,
  ImageSprite,
  RectSprite,
  Stage,
  PlaybackBar
});
const SIG = {
  W: 1080,
  H: 1080,
  WOMEN_X: 178,
  MEN_X: 902,
  ROW_TOP: 130,
  ROW_GAP: 66,
  ROWS: 10,
  RED: "#FF4B4B",
  GREEN: "#1ED760",
  GREEN_DIM: "#5A5A60",
  MUTED: "#7D7D83",
  FAINT: "#3A3A3E",
  LINE: "#222227",
  DISPLAY: "'Archivo', system-ui, sans-serif",
  UI: "'Inter', system-ui, sans-serif",
  // which man (top-4 index) each of the 10 women points at — heavy convergence on #0
  TARGETS: [0, 1, 0, 2, 0, 1, 3, 0, 2, 1],
  // entrance timing
  W_START: 0.25,
  M_START: 0.45,
  ENTER_DUR: 0.32,
  ENTER_STAGGER: 0.04,
  // line draw timing
  LINE_START0: 1.05,
  LINE_STAGGER: 0.125,
  LINE_DUR: 0.4,
  // camera / focus window
  CAM_FOCAL_X: 902,
  CAM_FOCAL_Y: 218
};
const sigLerp = (a, b, t) => a + (b - a) * t;
const sigRowY = (i) => SIG.ROW_TOP + i * SIG.ROW_GAP;
function SigPerson({ x, y, kind, color, opacity, scale, tx = 0, glow = 0, size = 52 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    transform: `translate(calc(-50% + ${tx}px), -50%) scale(${scale})`,
    transformOrigin: "center",
    opacity,
    color,
    fontSize: size,
    lineHeight: 1,
    textShadow: glow > 0 ? `0 0 ${glow}px ${color}, 0 0 ${glow * 2.2}px ${color}` : "none",
    willChange: "transform, opacity"
  } }, /* @__PURE__ */ React.createElement("i", { className: kind === "woman" ? "fa-solid fa-person-dress" : "fa-solid fa-person" }));
}
function SigCaption({ speed = 1 }) {
  const { localTime } = useSprite();
  const lt = localTime * speed;
  const rv = (d, dur) => clamp((lt - d) / dur, 0, 1);
  const r80 = rv(0, 0.45);
  const rWomen = rv(0.4, 0.45);
  const rArrow = rv(0.75, 0.35);
  const r20 = rv(1, 0.45);
  const rMen = rv(1.35, 0.45);
  const pop = (r) => sigLerp(1.32, 1, Easing.easeOutBack(r));
  const big = {
    fontFamily: SIG.DISPLAY,
    fontWeight: 900,
    fontSize: 76,
    lineHeight: 1.05,
    letterSpacing: "-0.5px",
    display: "inline-block",
    whiteSpace: "nowrap",
    textTransform: "uppercase"
  };
  const small = {
    fontFamily: SIG.UI,
    fontWeight: 600,
    fontSize: 19,
    letterSpacing: "1.5px",
    color: SIG.MUTED,
    textTransform: "uppercase",
    display: "inline-block",
    whiteSpace: "nowrap"
  };
  return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 0, right: 0, top: 804, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 18 } }, /* @__PURE__ */ React.createElement("span", { style: {
    ...big,
    color: SIG.RED,
    opacity: r80,
    transform: `scale(${pop(r80)})`,
    transformOrigin: "center bottom",
    textShadow: `0 0 ${18 * r80}px ${SIG.RED}`
  } }, "80%"), /* @__PURE__ */ React.createElement("span", { style: { ...small, opacity: rWomen, transform: `translateY(${(1 - rWomen) * 8}px)` } }, "of women's attention")), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    margin: "14px 0",
    opacity: rArrow
  } }, /* @__PURE__ */ React.createElement("div", { style: { width: sigLerp(0, 70, rArrow), height: 1, background: SIG.LINE } }), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: SIG.UI, fontSize: 22, color: SIG.MUTED } }, "\u2193"), /* @__PURE__ */ React.createElement("div", { style: { width: sigLerp(0, 70, rArrow), height: 1, background: SIG.LINE } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 18 } }, /* @__PURE__ */ React.createElement("span", { style: {
    ...big,
    color: SIG.GREEN,
    opacity: r20,
    transform: `scale(${pop(r20)})`,
    transformOrigin: "center bottom",
    textShadow: `0 0 ${20 * r20}px ${SIG.GREEN}`
  } }, "TOP 20%"), /* @__PURE__ */ React.createElement("span", { style: { ...small, opacity: rMen, transform: `translateY(${(1 - rMen) * 8}px)` } }, "of men")));
}
function SigmaScene(props) {
  const spd = props.speed ?? 1;
  const gi = props.intensity ?? 1;
  const conc = props.concentration ?? 0.5;
  const t = useTime() * spd;
  const ease = Easing;
  const bias = (conc - 0.5) * 2;
  const targetRow = (base) => bias >= 0 ? Math.round(sigLerp(base, 0, bias)) : Math.round(sigLerp(base, 3, -bias));
  const sCam = 1;
  const focus = interpolate([2.6, 3.2, 6.4, 6.9], [0, 1, 1, 0], ease.easeInOutQuad)(t);
  const dimMul = 1 - 0.66 * focus;
  const women = [];
  for (let i = 0; i < SIG.ROWS; i++) {
    const st = SIG.W_START + i * SIG.ENTER_STAGGER;
    const p = clamp((t - st) / SIG.ENTER_DUR, 0, 1);
    const e = ease.easeOutBack(p);
    women.push(
      /* @__PURE__ */ React.createElement(
        SigPerson,
        {
          key: "w" + i,
          x: SIG.WOMEN_X,
          y: sigRowY(i),
          kind: "woman",
          color: SIG.RED,
          opacity: p * dimMul,
          scale: 0.45 + 0.55 * e,
          tx: (1 - e) * -16,
          glow: p > 0.9 ? 5 * gi : 0
        }
      )
    );
  }
  const men = [];
  for (let i = 0; i < SIG.ROWS; i++) {
    const st = SIG.M_START + i * SIG.ENTER_STAGGER;
    const p = clamp((t - st) / SIG.ENTER_DUR, 0, 1);
    const e = ease.easeOutBack(p);
    const isTop = i < 4;
    let glow = 0, opacity = p, color = SIG.GREEN_DIM;
    if (isTop) {
      color = SIG.GREEN;
      const ramp = clamp((t - 1.5) / 1.1, 0, 1);
      const pulse = (0.5 + 0.5 * Math.sin(t * 3.4 + i * 0.7)) * 6 * ramp;
      glow = (11 * ramp + pulse + 16 * focus) * gi;
      opacity = p;
    } else {
      opacity = p * dimMul;
    }
    men.push(
      /* @__PURE__ */ React.createElement(
        SigPerson,
        {
          key: "m" + i,
          x: SIG.MEN_X,
          y: sigRowY(i),
          kind: "man",
          color,
          opacity,
          scale: 0.45 + 0.55 * e,
          tx: (1 - e) * 16,
          glow
        }
      )
    );
  }
  const lines = [];
  for (let i = 0; i < SIG.ROWS; i++) {
    const ls = SIG.LINE_START0 + i * SIG.LINE_STAGGER;
    const dp = clamp((t - ls) / SIG.LINE_DUR, 0, 1);
    const e = ease.easeInOutCubic(dp);
    const x0 = SIG.WOMEN_X + 26, y0 = sigRowY(i);
    const x1 = SIG.MEN_X - 30, y1 = sigRowY(targetRow(SIG.TARGETS[i]));
    const cx = sigLerp(x0, x1, e), cy = sigLerp(y0, y1, e);
    const op = clamp((t - ls) / 0.18, 0, 1) * (1 - 0.32 * focus);
    lines.push(
      /* @__PURE__ */ React.createElement(
        "line",
        {
          key: "l" + i,
          x1: x0,
          y1: y0,
          x2: cx,
          y2: cy,
          stroke: "rgba(255,255,255,0.32)",
          strokeWidth: 1.5,
          strokeDasharray: "6 7",
          markerEnd: dp > 0.04 ? "url(#sig-arrow)" : void 0,
          style: { opacity: op }
        }
      )
    );
  }
  const labelOp = clamp((t - 0.2) / 0.45, 0, 1) * (1 - 0.55 * clamp((t - 6.6) / 0.5, 0, 1));
  return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "hidden", fontFamily: SIG.UI, background: "#000000" } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "radial-gradient(125% 95% at 68% 22%, rgba(14,14,16,0) 0%, rgba(0,0,0,0.55) 64%, rgba(0,0,0,0.95) 100%)"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    transformOrigin: `${SIG.CAM_FOCAL_X}px ${SIG.CAM_FOCAL_Y}px`,
    transform: `scale(${sCam})`,
    willChange: "transform"
  } }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: SIG.W,
      height: SIG.H,
      viewBox: `0 0 ${SIG.W} ${SIG.H}`,
      style: { position: "absolute", inset: 0, overflow: "visible" }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement(
      "marker",
      {
        id: "sig-arrow",
        markerWidth: "7",
        markerHeight: "7",
        refX: "5.5",
        refY: "3.5",
        orient: "auto",
        markerUnits: "userSpaceOnUse"
      },
      /* @__PURE__ */ React.createElement("path", { d: "M0,0 L7,3.5 L0,7 Z", fill: "rgba(255,255,255,0.5)" })
    )),
    lines
  ), women, men), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: SIG.UI,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "2px",
    color: SIG.MUTED,
    textTransform: "uppercase",
    opacity: labelOp
  } }, "Attention\xA0\xA0Distribution"), /* @__PURE__ */ React.createElement(Sprite, { start: 3.5 / spd, end: 7.5 / spd, keepMounted: false }, /* @__PURE__ */ React.createElement(SigCaption, { speed: spd }))));
}
function SigmaApp(props) {
  const spd = props.speed ?? 1;
  return /* @__PURE__ */ React.createElement(Stage, { width: SIG.W, height: SIG.H, duration: 7.5 / spd, background: "#000000", persistKey: "sigma-anim" }, /* @__PURE__ */ React.createElement(SigmaScene, { speed: spd, intensity: props.intensity, concentration: props.concentration }));
}
window.SigmaApp = SigmaApp;
if (typeof module !== "undefined") {
  module.exports = Object.assign(module.exports || {}, { SigmaApp });
}
const GU = {
  W: 1080,
  H: 1080,
  GREEN: "#1ED760",
  WHITE: "#FFFFFF",
  MUTED: "#7D7D83",
  FAINT: "#3A3A3E",
  LINE: "#222227",
  DISPLAY: "'Archivo', system-ui, sans-serif",
  UI: "'Inter', system-ui, sans-serif",
  // plot geometry (left margin reserved for horizontal Y-axis labels)
  PX0: 268,
  PX1: 1004,
  PY_TOP: 210,
  PY_BASE: 880,
  START_X: 290,
  START_Y: 842,
  END_X: 980,
  END_Y: 290,
  GRID_XS: [268, 370, 472, 574, 676, 778, 880, 982]
};
const GU_PTS = [
  [290, 842],
  [329, 851],
  [369, 822],
  [414, 834],
  [460, 792],
  [508, 806],
  [555, 742],
  [606, 766],
  [657, 676],
  [710, 700],
  [763, 590],
  [815, 612],
  [864, 486],
  [913, 392],
  [980, 290]
];
function guCatmullRom(pts) {
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const GU_CURVE_D = guCatmullRom(GU_PTS);
const GU_CORE = GU_CURVE_D.replace(/^M [^C]*/, " ");
const GU_AREA_D = `M ${GU.START_X},${GU.PY_BASE} L ${GU.START_X},${GU.START_Y}` + GU_CORE + ` L ${GU.END_X},${GU.PY_BASE} Z`;
function GUPill({ text, color = "#FFFFFF", textColor = "#000000", pointer = "left", font, opacity = 1, scale = 1, originX = "0%" }) {
  const tri = {
    position: "absolute",
    bottom: -8,
    width: 0,
    height: 0,
    borderLeft: "9px solid transparent",
    borderRight: "9px solid transparent",
    borderTop: `10px solid ${color}`,
    ...pointer === "left" ? { left: 18 } : { right: 18 }
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    display: "inline-block",
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: `${originX} bottom`,
    willChange: "transform, opacity"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: color,
    color: textColor,
    borderRadius: 16,
    padding: "13px 20px",
    fontFamily: font,
    fontWeight: 700,
    fontSize: 27,
    lineHeight: 1.18,
    letterSpacing: "-0.2px",
    whiteSpace: "pre-line",
    textAlign: "left",
    boxShadow: "0 10px 34px rgba(0,0,0,0.55)"
  } }, text), /* @__PURE__ */ React.createElement("div", { style: tri }));
}
function GlowUpScene(props) {
  const spd = props.speed ?? 1;
  const accent = props.accent || GU.GREEN;
  const t = useTime() * spd;
  const ease = Easing;
  const pathRef = React.useRef(null);
  const [pathLen, setPathLen] = React.useState(0);
  React.useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
  }, []);
  const ck = (a, b) => clamp((t - a) / (b - a), 0, 1);
  const titleOp = ck(0.1, 0.55);
  const gridP = (i) => ck(0.25 + i * 0.04, 0.65 + i * 0.04);
  const baseP = ck(0.3, 0.95);
  const labelOp = ck(0.65, 1.05);
  const startOp = ck(0.9, 1.15);
  const drawP = ease.easeInOutCubic(ck(1.15, 2.45));
  const areaOp = ck(1.35, 2.55);
  const tip1In = ck(1.25, 1.55);
  const tip1Out = ck(2.4, 2.68);
  const tip1Op = tip1In * (1 - tip1Out);
  const travelP = ease.easeInOutCubic(ck(2.7, 4.15));
  const tip2In = ck(4.25, 4.65);
  let dotX = GU.START_X, dotY = GU.START_Y;
  if (pathLen && pathRef.current) {
    const pt = pathRef.current.getPointAtLength(travelP * pathLen);
    dotX = pt.x;
    dotY = pt.y;
  }
  const atTop = travelP > 0.985;
  const dotPulse = atTop ? (0.5 + 0.5 * Math.sin(t * 4)) * 10 : 0;
  const dotGlow = 8 + 18 * travelP + dotPulse;
  const lineColor = "rgba(255,255,255,0.10)";
  return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "hidden", fontFamily: GU.UI, background: "#000000" } }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: GU.W,
      height: GU.H,
      viewBox: `0 0 ${GU.W} ${GU.H}`,
      style: { position: "absolute", inset: 0, overflow: "visible" }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "gu-area", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: accent, stopOpacity: "0.42" }), /* @__PURE__ */ React.createElement("stop", { offset: "55%", stopColor: accent, stopOpacity: "0.14" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: accent, stopOpacity: "0" }))),
    GU.GRID_XS.map((x, i) => {
      const p = gridP(i);
      const y2 = GU.PY_BASE - (GU.PY_BASE - GU.PY_TOP) * p;
      return /* @__PURE__ */ React.createElement(
        "line",
        {
          key: "g" + i,
          x1: x,
          y1: GU.PY_BASE,
          x2: x,
          y2,
          stroke: GU.LINE,
          strokeWidth: 1.5,
          style: { opacity: 0.9 }
        }
      );
    }),
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: GU.PX0,
        y1: GU.PY_BASE,
        x2: GU.PX0 + (GU.PX1 - GU.PX0) * baseP,
        y2: GU.PY_BASE,
        stroke: GU.MUTED,
        strokeWidth: 2,
        style: { opacity: 0.6 }
      }
    ),
    /* @__PURE__ */ React.createElement("path", { d: GU_AREA_D, fill: "url(#gu-area)", style: { opacity: areaOp } }),
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: GU.START_X,
        y1: GU.START_Y + 6,
        x2: GU.START_X,
        y2: GU.PY_BASE,
        stroke: "rgba(255,255,255,0.55)",
        strokeWidth: 2,
        strokeDasharray: "3 7",
        style: { opacity: startOp }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "path",
      {
        ref: pathRef,
        d: GU_CURVE_D,
        fill: "none",
        stroke: accent,
        strokeWidth: 6.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeDasharray: pathLen || 1,
        strokeDashoffset: pathLen ? pathLen * (1 - drawP) : pathLen || 1,
        style: { filter: `drop-shadow(0 0 10px ${accent}aa)`, opacity: pathLen ? 1 : 0 }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: dotX,
        cy: dotY,
        r: "13",
        fill: "#FFFFFF",
        style: { opacity: startOp, filter: `drop-shadow(0 0 ${dotGlow}px ${accent})` }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: dotX,
        cy: dotY,
        r: "13",
        fill: "none",
        stroke: accent,
        strokeWidth: "3",
        style: { opacity: startOp * (0.4 + 0.6 * travelP) }
      }
    )
  ), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 64,
    top: 92,
    right: 80,
    fontFamily: GU.UI,
    fontWeight: 600,
    fontSize: 33,
    letterSpacing: "-0.2px",
    color: "#D6D6DA",
    opacity: titleOp
  } }, "Following your APEX plan"), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: GU.PX0,
    top: GU.PY_BASE + 18,
    fontFamily: GU.UI,
    fontWeight: 600,
    fontSize: 24,
    color: GU.MUTED,
    opacity: labelOp
  } }, "Now"), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 64,
    top: GU.PY_BASE + 18,
    fontFamily: GU.UI,
    fontWeight: 600,
    fontSize: 24,
    color: GU.MUTED,
    opacity: labelOp,
    textAlign: "right"
  } }, "by Sep 13"), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 0,
    width: GU.PX0 - 20,
    top: GU.END_Y,
    transform: "translateY(-50%)",
    textAlign: "right",
    pointerEvents: "none",
    fontFamily: GU.UI,
    fontWeight: 600,
    fontSize: 24,
    color: GU.MUTED,
    opacity: labelOp
  } }, "Up to +14", /* @__PURE__ */ React.createElement("br", null), "points"), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 0,
    width: GU.PX0 - 20,
    top: GU.START_Y,
    transform: "translateY(-50%)",
    textAlign: "right",
    pointerEvents: "none",
    fontFamily: GU.UI,
    fontWeight: 600,
    fontSize: 24,
    color: GU.MUTED,
    opacity: labelOp
  } }, "your current", /* @__PURE__ */ React.createElement("br", null), "67"), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: GU.START_X - 12, top: GU.START_Y - 118, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement(
    GUPill,
    {
      text: props.startLabel || "Start of your\nglow up journey",
      pointer: "left",
      font: GU.UI,
      opacity: tip1Op,
      scale: sigLerp(0.7, 1, Easing.easeOutBack(tip1In)) * (1 - 0.15 * tip1Out),
      originX: "14%"
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: dotX - 252, top: dotY - 116, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement(
    GUPill,
    {
      text: props.endLabel || "You in 3 months",
      pointer: "right",
      font: GU.UI,
      color: accent,
      textColor: "#04140B",
      opacity: tip2In,
      scale: sigLerp(0.7, 1, Easing.easeOutBack(tip2In)),
      originX: "86%"
    }
  )));
}
function GlowUpApp(props) {
  const spd = props.speed ?? 1;
  return /* @__PURE__ */ React.createElement(Stage, { width: GU.W, height: GU.H, duration: 5.6 / spd, background: "#000000", persistKey: "glowup-anim" }, /* @__PURE__ */ React.createElement(GlowUpScene, { speed: spd, accent: props.accent, startLabel: props.startLabel, endLabel: props.endLabel }));
}
window.GlowUpApp = GlowUpApp;
if (typeof module !== "undefined") {
  module.exports = Object.assign(module.exports || {}, { GlowUpApp });
}
