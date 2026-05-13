import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Browser, Cursor, AppShell } from "./_ui";

export const ScenePaymentMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // mark row index 2 paid at f=55, row index 3 paid at f=110
  const paid1 = frame > 55;
  const paid2 = frame > 110;
  const total = interpolate(frame, [0, 30], [9450, 9450], { extrapolateRight: "clamp" }) +
    (paid1 ? 200 : 0) + (paid2 ? 150 : 0);

  const path = [
    { f: 0, x: 1000, y: 600 },
    { f: 25, x: 1000, y: 380 },
    { f: 55, x: 1000, y: 380, click: true },
    { f: 90, x: 1000, y: 432 },
    { f: 110, x: 1000, y: 432, click: true },
    { f: 140, x: 380, y: 230 },
  ];

  const rows = [
    { n: "გიორგი ბერიძე", a: 200, paid: true },
    { n: "ნიკა გელაშვილი", a: 200, paid: true },
    { n: "ლუკა ჯაფარიძე", a: 200, paid: paid1 },
    { n: "სანდრო კვ.", a: 150, paid: paid2 },
    { n: "დათო ნოზაძე", a: 200, paid: true },
  ];

  return (
    <AbsoluteFill>
      <Browser url="my-club.live/payments">
        <AppShell active="payments">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>გადახდები · ნოემბერი</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", color: "#cbd5e1", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
                შემოსავალი: <b style={{ color: "white" }}>{total.toLocaleString()}₾</b>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
                ↑ +18% თვეში
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", color: "white", fontFamily: "Inter, sans-serif" }}>
            {rows.map((r, i) => (
              <div key={i} style={{ padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, background: r.paid ? "rgba(16,185,129,0.05)" : "transparent" }}>
                <div>{r.n}</div>
                <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                  <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, minWidth: 60, textAlign: "right" }}>{r.a}₾</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 999, minWidth: 90, textAlign: "center", background: r.paid ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)", color: r.paid ? "#6ee7b7" : "#fcd34d", border: `1px solid ${r.paid ? "rgba(16,185,129,0.45)" : "rgba(245,158,11,0.45)"}` }}>
                    {r.paid ? "გადახდილი ✓" : "მოლოდინში"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
            ✓ ავტომატური SMS · ✓ PDF ქვითარი · ✓ PayPal/ბარათი
          </div>
        </AppShell>
      </Browser>
      <Cursor path={path} />
    </AbsoluteFill>
  );
};
