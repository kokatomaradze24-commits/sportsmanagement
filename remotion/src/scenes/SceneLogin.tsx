import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Browser, Cursor, Typed, appearAt } from "./_ui";

export const SceneLogin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const path = [
    { f: 0, x: 1100, y: 600 },
    { f: 30, x: 640, y: 280 },
    { f: 38, x: 640, y: 280, click: true },
    { f: 75, x: 640, y: 350 },
    { f: 82, x: 640, y: 350, click: true },
    { f: 120, x: 640, y: 430 },
    { f: 128, x: 640, y: 430, click: true },
  ];
  return (
    <AbsoluteFill>
      <Browser url="my-club.live/login">
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 380, padding: 32, background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, color: "white", fontFamily: "Inter, sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏆</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18 }}>My Club</div>
            </div>
            <div style={{ fontSize: 22, fontFamily: "Sora, sans-serif", fontWeight: 700, marginBottom: 4 }}>შესვლა</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 18 }}>შედი შენს კლუბის ანგარიშზე</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>ელფოსტა</div>
            <div style={{ height: 38, border: `1px solid ${frame > 38 && frame < 75 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 14, background: "rgba(2,6,23,0.6)" }}>
              <Typed text="coach@my-club.live" startFrame={42} />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>პაროლი</div>
            <div style={{ height: 38, border: `1px solid ${frame > 82 && frame < 120 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 18, background: "rgba(2,6,23,0.6)" }}>
              <Typed text="••••••••••" startFrame={86} cps={28} />
            </div>
            <div style={{ ...appearAt(frame, fps, 0), height: 42, borderRadius: 9, background: frame > 128 ? "linear-gradient(135deg,#ea580c,#d97706)" : "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontWeight: 700, fontFamily: "Sora, sans-serif", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(249,115,22,0.35)" }}>
              შესვლა →
            </div>
          </div>
        </div>
      </Browser>
      <Cursor path={path} />
    </AbsoluteFill>
  );
};
