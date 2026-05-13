import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Browser, Cursor, Typed, AppShell, appearAt } from "./_ui";

const DAYS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

export const SceneScheduleAdd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showModal = frame > 30 && frame < 130;
  const modalOp = interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const newEvent = frame > 130;
  const path = [
    { f: 0, x: 1000, y: 600 },
    { f: 25, x: 470, y: 380 },
    { f: 30, x: 470, y: 380, click: true },
    { f: 55, x: 700, y: 290 },
    { f: 61, x: 700, y: 290, click: true },
    { f: 95, x: 700, y: 360 },
    { f: 100, x: 700, y: 360, click: true },
    { f: 125, x: 800, y: 510 },
    { f: 130, x: 800, y: 510, click: true },
  ];
  const existing = [
    { d: 0, r: 0, l: "U16 ვარჯიში", c: "#3b82f6" },
    { d: 1, r: 1, l: "U14 ვარჯიში", c: "#f97316" },
    { d: 4, r: 0, l: "U18 ვარჯიში", c: "#a855f7" },
    { d: 5, r: 1, l: "თამაში 🏆", c: "#10b981" },
  ];
  return (
    <AbsoluteFill>
      <Browser url="my-club.live/schedule">
        <AppShell active="schedule">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>კვირის განრიგი</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>ნოემბერი 16–22, 2026</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {DAYS.map((d, di) => (
              <div key={di} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, minHeight: 320, padding: 8, position: "relative" }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 8 }}>{d}</div>
                {existing.filter((e) => e.d === di).map((e, ei) => (
                  <div key={ei} style={{ marginTop: e.r === 1 ? 60 : 0, padding: "8px 6px", borderRadius: 7, background: `linear-gradient(135deg,${e.c},${e.c}aa)`, color: "white", fontSize: 11, fontFamily: "Sora, sans-serif", fontWeight: 600, textAlign: "center", marginBottom: 6 }}>
                    {e.l}
                  </div>
                ))}
                {di === 2 && newEvent && (
                  <div style={{ ...appearAt(frame, fps, 130), padding: "8px 6px", borderRadius: 7, background: "linear-gradient(135deg,#10b981,#047857)", color: "white", fontSize: 11, fontFamily: "Sora, sans-serif", fontWeight: 600, textAlign: "center", marginTop: 0, boxShadow: "0 6px 14px rgba(16,185,129,0.4)" }}>
                    U16 ტაქტიკა
                  </div>
                )}
              </div>
            ))}
          </div>
          {showModal && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.65)", display: "flex", alignItems: "center", justifyContent: "center", opacity: modalOp }}>
              <div style={{ width: 440, padding: 26, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", fontFamily: "Inter, sans-serif", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>ახალი ვარჯიში · ოთხშაბათი</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>დასახელება</div>
                <div style={{ height: 36, border: `1px solid ${frame > 61 && frame < 95 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, marginBottom: 12, background: "#020617" }}>
                  <Typed text="U16 ტაქტიკა" startFrame={65} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>გუნდი</div>
                    <div style={{ height: 36, border: `1px solid ${frame > 100 && frame < 125 ? "#f97316" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, background: "#020617" }}>{frame > 104 ? "U16 გუნდი A" : ""}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>დრო</div>
                    <div style={{ height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 13, background: "#020617" }}>18:00 – 19:30</div>
                  </div>
                </div>
                <div style={{ height: 40, borderRadius: 9, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", fontWeight: 700, fontFamily: "Sora, sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  დამატება განრიგში
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
