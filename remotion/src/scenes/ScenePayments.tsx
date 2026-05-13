import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ScenePad, SceneTitle, Card, fadeSlide } from "./_shared";

const ROWS = [
  { name: "გიორგი ბერიძე", amount: 200, status: "გადახდილი", color: "#10b981" },
  { name: "ნიკა გელაშვილი", amount: 200, status: "გადახდილი", color: "#10b981" },
  { name: "ლუკა ჯაფარიძე", amount: 150, status: "მოლოდინში", color: "#f59e0b" },
  { name: "სანდრო კ.", amount: 200, status: "ვადაგასული", color: "#ef4444" },
  { name: "დათო ნოზაძე", amount: 150, status: "გადახდილი", color: "#10b981" },
];

export const ScenePayments: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = interpolate(frame, [10, 60], [0, 12450], { extrapolateRight: "clamp" });
  return (
    <ScenePad>
      <SceneTitle tag="ფუნქცია 03" title="გადახდები და ფინანსები" />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <Card delay={12} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 16, color: "white" }}>
            ნოემბერი 2026
          </div>
          {ROWS.map((r, i) => {
            const d = 22 + i * 6;
            const s = interpolate(frame, [d, d + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < ROWS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div style={{ fontSize: 15, color: "white", fontWeight: 500 }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "white", fontSize: 15, minWidth: 60, textAlign: "right" }}>{r.amount}₾</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: r.color,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: `${r.color}1f`,
                      border: `1px solid ${r.color}55`,
                      minWidth: 90,
                      textAlign: "center",
                    }}
                  >
                    {r.status}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card delay={20} style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>თვის შემოსავალი</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 44, fontWeight: 800, color: "white", marginTop: 6 }}>
              {Math.round(total).toLocaleString()}₾
            </div>
            <div style={{ fontSize: 13, color: "#10b981", marginTop: 4, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>↑ +18% წინა თვესთან</div>
          </Card>
          <Card delay={32} style={{ padding: 22 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>ავტო SMS / Email</div>
            <div style={{ marginTop: 10, fontFamily: "Inter, sans-serif", fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>
              ✓ შეხსენებები<br />
              ✓ ვადაგასული გადახდები<br />
              ✓ PDF ქვითრები
            </div>
          </Card>
        </div>
      </div>
      <div style={{ ...fadeSlide(frame, fps, 70, 16), marginTop: 16, fontFamily: "Inter, sans-serif", color: "#cbd5e1", fontSize: 15 }}>
        ავტომატური განრიგი · GEL / USD / EUR · PayPal გადახდები
      </div>
    </ScenePad>
  );
};
