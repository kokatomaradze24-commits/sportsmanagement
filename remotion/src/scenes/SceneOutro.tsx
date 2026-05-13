import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from "remotion";
import { fadeSlide } from "./_shared";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const ctaScale = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22, padding: 60 }}>
      <div
        style={{
          transform: `scale(${logoScale})`,
          width: 110,
          height: 110,
          borderRadius: 28,
          background: "linear-gradient(135deg,#f97316 0%,#f59e0b 100%)",
          boxShadow: "0 25px 60px rgba(249,115,22,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
        }}
      >
        🏆
      </div>
      <h1
        style={{
          ...fadeSlide(frame, fps, 14, 24),
          fontFamily: "Sora, sans-serif",
          fontSize: 60,
          fontWeight: 800,
          margin: 0,
          textAlign: "center",
          background: "linear-gradient(180deg,#fff,#cbd5e1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -1,
          maxWidth: 900,
          lineHeight: 1.05,
        }}
      >
        დაიწყე უფასო 7-დღიანი ცდა
      </h1>
      <p
        style={{
          ...fadeSlide(frame, fps, 22, 18),
          fontFamily: "Inter, sans-serif",
          fontSize: 20,
          color: "#cbd5e1",
          margin: 0,
          textAlign: "center",
        }}
      >
        რეგისტრაცია 30 წამში · საკრედიტო ბარათის გარეშე
      </p>
      <div
        style={{
          opacity: interpolate(ctaScale, [0, 1], [0, 1]),
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.85, 1])})`,
          marginTop: 16,
          padding: "18px 38px",
          borderRadius: 14,
          background: "linear-gradient(135deg,#f97316,#f59e0b)",
          fontFamily: "Sora, sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "white",
          boxShadow: "0 20px 50px rgba(249,115,22,0.45)",
        }}
      >
        my-club.live →
      </div>
      <div
        style={{
          ...fadeSlide(frame, fps, 50, 14),
          marginTop: 12,
          display: "flex",
          gap: 22,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "#94a3b8",
        }}
      >
        <span>🌍 6 ენა</span>
        <span>⚡ 8 სპორტი</span>
        <span>🔒 უსაფრთხო ღრუბელი</span>
        <span>📱 მობილური · დესკტოპი</span>
      </div>
    </AbsoluteFill>
  );
};
