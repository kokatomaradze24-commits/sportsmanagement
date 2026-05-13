import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ScenePad, SceneTitle, Card, fadeSlide } from "./_shared";

const PLAN = [
  { d: "ორშაბათი", title: "ფიზიკური მომზადება + დრიბლი", time: "18:00–19:30" },
  { d: "სამშაბათი", title: "ტაქტიკა · 3v3 / 5v5", time: "18:00–19:30" },
  { d: "ხუთშაბათი", title: "სროლის ტექნიკა + სტამინა", time: "18:00–19:30" },
  { d: "შაბათი", title: "სასწავლო თამაში U16", time: "11:00–12:30" },
];

export const SceneAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sparkleScale = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <ScenePad>
      <SceneTitle tag="ფუნქცია 04" title="AI ვარჯიშის გეგმა და სურათები" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card delay={14} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ transform: `scale(${sparkleScale})`, fontSize: 22 }}>✨</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "white", fontSize: 16 }}>AI გეგმა · U16 · საშუალო დონე</div>
          </div>
          {PLAN.map((p, i) => {
            const d = 24 + i * 8;
            const s = interpolate(frame, [d, d + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)`,
                  padding: "14px 20px",
                  borderBottom: i < PLAN.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 15 }}>{p.d}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.time}</div>
                </div>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>{p.title}</div>
              </div>
            );
          })}
        </Card>
        <Card delay={26} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "white", fontSize: 16 }}>🖼️ AI სურათების გენერაცია</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => {
              const d = 36 + i * 8;
              const s = interpolate(frame, [d, d + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const grads = [
                "linear-gradient(135deg,#f97316,#fbbf24)",
                "linear-gradient(135deg,#3b82f6,#06b6d4)",
                "linear-gradient(135deg,#10b981,#84cc16)",
                "linear-gradient(135deg,#a855f7,#ec4899)",
              ];
              return (
                <div
                  key={i}
                  style={{
                    height: 90,
                    borderRadius: 12,
                    background: grads[i],
                    opacity: s,
                    transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  {["🏀", "⚽", "🎾", "🏐"][i]}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 6, fontFamily: "Inter, sans-serif", fontSize: 13, color: "#94a3b8" }}>
            პოსტერები, ბანერები და სოც.ქსელის სურათები — ერთი კლიკით
          </div>
        </Card>
      </div>
      <div style={{ ...fadeSlide(frame, fps, 80, 16), marginTop: 18, fontFamily: "Inter, sans-serif", color: "#cbd5e1", fontSize: 16 }}>
        წლიური / თვიური / კვირეული გეგმები · ასაკის მიხედვით პერსონალური
      </div>
    </ScenePad>
  );
};
