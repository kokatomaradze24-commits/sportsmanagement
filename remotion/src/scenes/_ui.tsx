import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from "remotion";

// Browser chrome wrapper
export const Browser: React.FC<React.PropsWithChildren<{ url: string }>> = ({ children, url }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 40,
        borderRadius: 18,
        overflow: "hidden",
        background: "#0b1220",
        boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Browser top bar */}
      <div style={{ height: 42, background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10 }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
        </div>
        <div
          style={{
            flex: 1,
            marginLeft: 14,
            background: "#020617",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            height: 26,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            color: "#94a3b8",
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
          }}
        >
          🔒 {url}
        </div>
      </div>
      {/* Browser content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0b1220" }}>{children}</div>
    </div>
  );
};

// Cursor that moves between waypoints. Each waypoint: { f: frame, x, y, click? }
export type Waypoint = { f: number; x: number; y: number; click?: boolean };

export const Cursor: React.FC<{ path: Waypoint[] }> = ({ path }) => {
  const frame = useCurrentFrame();
  // find segment
  let i = 0;
  for (; i < path.length - 1; i++) {
    if (frame < path[i + 1].f) break;
  }
  const a = path[Math.min(i, path.length - 1)];
  const b = path[Math.min(i + 1, path.length - 1)];
  const t =
    a === b ? 1 : interpolate(frame, [a.f, b.f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;

  // Click ripple: when current waypoint is a click and we've just arrived
  const clickW = path.find((p) => p.click && Math.abs(frame - p.f) < 25);
  const clickT = clickW ? frame - clickW.f : -1;
  const showRipple = clickT >= 0 && clickT < 22;
  const rScale = showRipple ? interpolate(clickT, [0, 22], [0.2, 2.4]) : 0;
  const rOpacity = showRipple ? interpolate(clickT, [0, 22], [0.7, 0]) : 0;

  return (
    <>
      {showRipple && clickW && (
        <div
          style={{
            position: "absolute",
            left: clickW.x - 24,
            top: clickW.y - 24,
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid #f97316",
            transform: `scale(${rScale})`,
            opacity: rOpacity,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}
      <svg
        width="28"
        height="34"
        viewBox="0 0 28 34"
        style={{
          position: "absolute",
          left: x,
          top: y,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
          zIndex: 60,
          transition: "none",
        }}
      >
        <path d="M2 2 L2 24 L8 19 L12 28 L16 26 L12 17 L20 17 Z" fill="white" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </>
  );
};

// Sidebar mock used inside the app shell
export const AppShell: React.FC<React.PropsWithChildren<{ active: string }>> = ({ children, active }) => {
  const items = [
    { k: "dashboard", l: "მთავარი", i: "📊" },
    { k: "players", l: "მოთამაშეები", i: "👥" },
    { k: "coaches", l: "მწვრთნელები", i: "🧑‍🏫" },
    { k: "schedule", l: "განრიგი", i: "📅" },
    { k: "payments", l: "გადახდები", i: "💳" },
    { k: "ai", l: "AI ასისტენტი", i: "✨" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", color: "white" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0a0f1d", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "18px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 18px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#f97316,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏆</div>
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16 }}>My Club</div>
        </div>
        {items.map((it) => {
          const isActive = it.k === active;
          return (
            <div
              key={it.k}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 9,
                fontSize: 13.5,
                fontFamily: "Inter, sans-serif",
                background: isActive ? "rgba(249,115,22,0.18)" : "transparent",
                color: isActive ? "#fdba74" : "#cbd5e1",
                fontWeight: isActive ? 600 : 500,
                border: isActive ? "1px solid rgba(249,115,22,0.35)" : "1px solid transparent",
              }}
            >
              <span>{it.i}</span> {it.l}
            </div>
          );
        })}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "22px 28px", overflow: "hidden", position: "relative" }}>{children}</div>
    </div>
  );
};

// Typewriter — types text character by character
export const Typed: React.FC<{ text: string; startFrame: number; cps?: number; style?: React.CSSProperties }> = ({ text, startFrame, cps = 22, style }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor((elapsed / 30) * cps));
  return <span style={style}>{text.slice(0, chars)}{chars < text.length && Math.floor(frame / 8) % 2 === 0 ? "▏" : ""}</span>;
};

export function appearAt(frame: number, fps: number, at: number) {
  const s = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 160 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px) scale(${interpolate(s, [0, 1], [0.98, 1])})` };
}
