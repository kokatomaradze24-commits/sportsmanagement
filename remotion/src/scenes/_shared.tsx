import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

export function fadeSlide(frame: number, fps: number, delay = 0, distance = 30) {
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [distance, 0]);
  return { opacity, transform: `translateY(${y}px)` };
}

export function exitFade(frame: number, durationInFrames: number) {
  return interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export function SceneTitle({ tag, title }: { tag: string; title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, marginBottom: 30 }}>
      <div
        style={{
          ...fadeSlide(frame, fps, 0, 16),
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#fdba74",
          padding: "6px 14px",
          borderRadius: 999,
          background: "rgba(249,115,22,0.12)",
          border: "1px solid rgba(251,146,60,0.35)",
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        ● {tag}
      </div>
      <h1
        style={{
          ...fadeSlide(frame, fps, 6, 24),
          fontFamily: "Sora, sans-serif",
          fontSize: 56,
          fontWeight: 800,
          color: "white",
          margin: 0,
          lineHeight: 1.05,
          background: "linear-gradient(180deg, #fff 0%, #cbd5e1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          maxWidth: 720,
        }}
      >
        {title}
      </h1>
    </div>
  );
}

export const Card: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties; delay?: number }>> = ({ children, style, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...fadeSlide(frame, fps, delay, 22),
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        backdropFilter: "blur(0px)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
        padding: 20,
        color: "white",
        fontFamily: "Inter, sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const ScenePad: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AbsoluteFill style={{ padding: "72px 80px" }}>{children}</AbsoluteFill>
);
