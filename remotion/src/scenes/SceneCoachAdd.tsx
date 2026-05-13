import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Browser, Cursor, Typed, AppShell, appearAt } from "./_ui";

export const SceneCoachAdd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showModal = frame > 30;
  const modalOp = interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const newRow = frame > 138;
  const path = [
    { f: 0, x: 1000, y: 600 },
    { f: 24, x: 1080, y: 165 },
    { f: 30, x: 1080, y: 165, click: true },
    { f: 58, x: 700, y: 290 },
    { f: 64, x: 700, y: 290, click: true },
    { f: 95, x: 700, y: 360 },
    { f: 101, x: 700, y: 360, click: true },
    { f: 132, x: 800, y: 510 },
    { f: 138, x: 800, y: 510, click: true },
  ];
  return (
    <AbsoluteFill>
      <Browser url="my-club.live/coaches">
        <AppShell active="coaches">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>მწვრთნელები</div>
            <div style={{ padding: "8px 14px", borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontSize: 13, fontFamily: "Sora, sans-serif", fontWeight: 600 }}>
              + მწვრთნელის დამატება
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "white", fontFamily: "Inter, sans-serif" }}>
            {[
              { n: "ალექსი მაჭარაშვილი", t: "U18 · U16", e: "alex@..." },
              { n: "ვახო თავაძე", t: "U14", e: "vakho@..." },
            ].map((c, i) => (
              <div key={i} style={{ padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1e40af)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{c.n[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.n}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.e}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>გუნდები: {c.t}</div>
              </div>
            ))}
            {newRow && (
              <div style={{ ...appearAt(frame, fps, 138), padding: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#047857)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>თ</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>თემო ბაქრაძე ✓</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>temo@my-club.live</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>გუნდები: U16</div>
              </div>
            )}
          </div>
          {showModal && frame < 138 && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.65)", display: "flex", alignItems: "center", justifyContent: "center", opacity: modalOp }}>
              <div style={{ width: 420, padding: 26, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", fontFamily: "Inter, sans-serif", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>ახალი მწვრთნელი</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>სახელი</div>
                <div style={{ height: 36, border: `1px solid ${frame > 64 && frame < 95 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 12, background: "#020617" }}>
                  <Typed text="თემო ბაქრაძე" startFrame={68} />
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>ელფოსტა</div>
                <div style={{ height: 36, border: `1px solid ${frame > 101 && frame < 132 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 16, background: "#020617" }}>
                  <Typed text="temo@my-club.live" startFrame={105} />
                </div>
                <div style={{ height: 40, borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontWeight: 700, fontFamily: "Sora, sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  დამატება და მოწვევა
                </div>
              </div>
            </div>
          )}
        </AppShell>
      </Browser>
      <Cursor path={path} />
    </AbsoluteFill>
  );
};
