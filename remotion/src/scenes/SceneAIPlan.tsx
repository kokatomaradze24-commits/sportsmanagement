import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Browser, Cursor, Typed, AppShell, appearAt } from "./_ui";

export const SceneAIPlan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const generating = frame > 75 && frame < 110;
  const showResult = frame > 110;
  const path = [
    { f: 0, x: 900, y: 600 },
    { f: 25, x: 600, y: 220 },
    { f: 30, x: 600, y: 220, click: true },
    { f: 70, x: 950, y: 360 },
    { f: 78, x: 950, y: 360, click: true },
  ];
  const blocks = [
    { t: "გახურება (15 წთ)", d: "დინამიური სტრეჩი, მსუბუქი სირბილი, კოორდინაცია" },
    { t: "ტექნიკა (30 წთ)", d: "1v1 დრიბლინგი, კონუსები, გადაცემები მცირე კვადრატში" },
    { t: "ტაქტიკა (25 წთ)", d: "5v5 პოზიციური თამაში, პრესინგი მესამე ხაზიდან" },
    { t: "გაცივება (10 წთ)", d: "სტატიკური სტრეჩი, სუნთქვა, რეფლექსია" },
  ];
  return (
    <AbsoluteFill>
      <Browser url="my-club.live/ai">
        <AppShell active="ai">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>AI ვარჯიშის გეგმა ✨</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>აღწერე მიზანი — AI შექმნის სრულ გეგმას</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${frame > 30 && frame < 70 ? "#f97316" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14, marginBottom: 12, color: "white", fontFamily: "Inter, sans-serif", fontSize: 13.5, minHeight: 70 }}>
            <Typed text="U16 გუნდი, 80 წუთიანი ვარჯიში, ფოკუსი პრესინგზე და სიჩქარეზე" startFrame={34} cps={28} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["U16", "80 წთ", "პრესინგი"].map((c, i) => (
                <div key={i} style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(249,115,22,0.12)", color: "#fdba74", fontSize: 11, fontFamily: "Inter, sans-serif", border: "1px solid rgba(249,115,22,0.3)" }}>{c}</div>
              ))}
            </div>
            <div style={{ padding: "9px 16px", borderRadius: 9, background: generating ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontSize: 13, fontFamily: "Sora, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              {generating ? <><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> გენერირება...</> : "✨ გენერირება"}
            </div>
          </div>
          {showResult && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {blocks.map((b, i) => (
                <div key={i} style={{ ...appearAt(frame, fps, 110 + i * 5), padding: 14, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 11, color: "white", fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontFamily: "Sora, sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#6ee7b7" }}>{b.t}</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{b.d}</div>
                </div>
              ))}
            </div>
          )}
        </AppShell>
      </Browser>
      <Cursor path={path} />
    </AbsoluteFill>
  );
};
