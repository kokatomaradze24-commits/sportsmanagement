import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Browser, Cursor, Typed, AppShell, appearAt } from "./_ui";

export const ScenePlayerAdd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showModal = frame > 32;
  const modalScale = interpolate(frame, [32, 46], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const modalOp = interpolate(frame, [32, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const newRow = frame > 138;

  const path = [
    { f: 0, x: 1000, y: 600 },
    { f: 25, x: 1080, y: 165 },
    { f: 32, x: 1080, y: 165, click: true },
    { f: 60, x: 700, y: 290 },
    { f: 66, x: 700, y: 290, click: true },
    { f: 95, x: 700, y: 360 },
    { f: 101, x: 700, y: 360, click: true },
    { f: 130, x: 800, y: 510 },
    { f: 138, x: 800, y: 510, click: true },
  ];

  return (
    <AbsoluteFill>
      <Browser url="my-club.live/players">
        <AppShell active="players">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>მოთამაშეები</div>
            <div style={{ padding: "8px 14px", borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontSize: 13, fontFamily: "Sora, sans-serif", fontWeight: 600, boxShadow: "0 6px 16px rgba(249,115,22,0.35)" }}>
              + მოთამაშის დამატება
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", color: "white", fontFamily: "Inter, sans-serif" }}>
            {[
              { n: "გიორგი ბერიძე", g: "U16", t: "გუნდი A" },
              { n: "ნიკა გელაშვილი", g: "U16", t: "გუნდი A" },
              { n: "ლუკა ჯაფარიძე", g: "U14", t: "გუნდი B" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                <div>{r.n}</div>
                <div style={{ color: "#94a3b8", display: "flex", gap: 18 }}><span>{r.g}</span><span>{r.t}</span></div>
              </div>
            ))}
            {newRow && (
              <div style={{ ...appearAt(frame, fps, 138), padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 13.5, background: "rgba(16,185,129,0.12)" }}>
                <div>დავით კობახიძე ✓</div>
                <div style={{ color: "#94a3b8", display: "flex", gap: 18 }}><span>U18</span><span>გუნდი A</span></div>
              </div>
            )}
          </div>

          {showModal && frame < 138 && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.65)", display: "flex", alignItems: "center", justifyContent: "center", opacity: modalOp }}>
              <div style={{ transform: `scale(${modalScale})`, width: 420, padding: 26, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", fontFamily: "Inter, sans-serif", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>ახალი მოთამაშე</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>სახელი და გვარი</div>
                <div style={{ height: 36, border: `1px solid ${frame > 66 && frame < 95 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 12, background: "#020617" }}>
                  <Typed text="დავით კობახიძე" startFrame={70} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>ასაკობრივი ჯგუფი</div>
                    <div style={{ height: 36, border: `1px solid ${frame > 101 && frame < 130 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, background: "#020617" }}>
                      {frame > 105 ? "U18" : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>გუნდი</div>
                    <div style={{ height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, background: "#020617" }}>
                      {frame > 110 ? "გუნდი A" : ""}
                    </div>
                  </div>
                </div>
                <div style={{ height: 40, borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontWeight: 700, fontFamily: "Sora, sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  შენახვა
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
