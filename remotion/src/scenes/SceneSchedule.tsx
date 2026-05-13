import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ScenePad, SceneTitle, Card, fadeSlide } from "./_shared";

const DAYS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
const EVENTS = [
  { day: 0, label: "U14 ვარჯ.", color: "#f97316", row: 1 },
  { day: 0, label: "U16 ვარჯ.", color: "#3b82f6", row: 2 },
  { day: 1, label: "U18 ვარჯ.", color: "#a855f7", row: 1 },
  { day: 2, label: "U14 ვარჯ.", color: "#f97316", row: 1 },
  { day: 3, label: "U16 ვარჯ.", color: "#3b82f6", row: 2 },
  { day: 4, label: "U18 ვარჯ.", color: "#a855f7", row: 1 },
  { day: 5, label: "თამაში 🏆", color: "#10b981", row: 2 },
];

export const SceneSchedule: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <ScenePad>
      <SceneTitle tag="ფუნქცია 02" title="ვარჯიშები · თამაშები · ექსკურსიები" />
      <Card delay={12} style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontFamily: "Sora, sans-serif", fontSize: 13, color: "#94a3b8", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {d}
            </div>
          ))}
          {DAYS.map((_, di) => (
            <div key={`col-${di}`} style={{ minHeight: 230, position: "relative", paddingTop: 10 }}>
              {EVENTS.filter((e) => e.day === di).map((e, ei) => {
                const delay = 24 + di * 4 + ei * 4;
                const s = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div
                    key={ei}
                    style={{
                      opacity: s,
                      transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`,
                      transformOrigin: "top left",
                      marginTop: e.row === 1 ? 0 : 86,
                      position: e.row === 1 ? "relative" : "absolute",
                      top: e.row === 1 ? 0 : 96,
                      left: 0,
                      right: 0,
                      padding: "12px 10px",
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${e.color}, ${e.color}aa)`,
                      color: "white",
                      fontFamily: "Sora, sans-serif",
                      fontWeight: 600,
                      fontSize: 12,
                      boxShadow: `0 8px 20px ${e.color}55`,
                      textAlign: "center",
                    }}
                  >
                    {e.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      <div style={{ ...fadeSlide(frame, fps, 70, 16), marginTop: 18, fontFamily: "Inter, sans-serif", color: "#cbd5e1", fontSize: 16 }}>
        კვირეული შაბლონები · მონაწილეები · მწვრთნელი ხედავს მხოლოდ თავის განრიგს
      </div>
    </ScenePad>
  );
};
