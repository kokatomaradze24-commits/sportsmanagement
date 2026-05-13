import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fadeSlide } from "./_shared";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const ringScale = interpolate(frame, [0, 80], [0.4, 2.4], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [10, 80], [0.6, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Pulse rings */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(249,115,22,0.5)", transform: `scale(${ringScale})`, opacity: ringOpacity }} />
        <div
          style={{
            transform: `scale(${logoScale})`,
            width: 140,
            height: 140,
            borderRadius: 36,
            background: "linear-gradient(135deg,#f97316 0%,#f59e0b 100%)",
            boxShadow: "0 30px 80px rgba(249,115,22,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
          }}
        >
          🏆
        </div>
      </div>
      <h1
        style={{
          ...fadeSlide(frame, fps, 14, 24),
          fontFamily: "Sora, sans-serif",
          fontSize: 72,
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(180deg,#fff,#cbd5e1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -1,
        }}
      >
        My Club
      </h1>
      <p
        style={{
          ...fadeSlide(frame, fps, 22, 18),
          fontFamily: "Inter, sans-serif",
          fontSize: 22,
          color: "#94a3b8",
          margin: 0,
          maxWidth: 720,
          textAlign: "center",
        }}
      >
        სპორტული კლუბის მართვის #1 პლატფორმა
      </p>
    </AbsoluteFill>
  );
};
