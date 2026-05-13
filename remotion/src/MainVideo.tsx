import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SceneIntro } from "./scenes/SceneIntro";
import { ScenePlayers } from "./scenes/ScenePlayers";
import { SceneSchedule } from "./scenes/SceneSchedule";
import { ScenePayments } from "./scenes/ScenePayments";
import { SceneAI } from "./scenes/SceneAI";
import { SceneOutro } from "./scenes/SceneOutro";

loadSora("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

// Persistent animated background (orbs + grid) — matches the login page aesthetic.
function PersistentBackground() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;
  const orb = (cx: number, cy: number, color: string, size: number, speed: number) => {
    const x = cx + Math.sin(t * speed) * 80;
    const y = cy + Math.cos(t * speed * 0.8) * 60;
    return (
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          filter: "blur(120px)",
          opacity: 0.55,
        }}
      />
    );
  };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)" }}>
      {orb(width * 0.2, height * 0.2, "#f97316", 520, 0.35)}
      {orb(width * 0.85, height * 0.4, "#3b82f6", 580, 0.28)}
      {orb(width * 0.55, height * 0.85, "#10b981", 500, 0.32)}
      {/* subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </AbsoluteFill>
  );
}

// Bottom progress / brand bar always visible
function BrandBar() {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Progress line */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 4, width: progress * width, background: "linear-gradient(90deg, #f97316, #fbbf24)" }} />
      {/* Brand */}
      <div
        style={{
          position: "absolute",
          left: 32,
          bottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "Sora, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#f97316,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🏆
        </div>
        My Club
      </div>
      <div
        style={{
          position: "absolute",
          right: 32,
          bottom: 28,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        my-club.live
      </div>
    </AbsoluteFill>
  );
}

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <Sequence from={0} durationInFrames={120}><SceneIntro /></Sequence>
      <Sequence from={120} durationInFrames={120}><ScenePlayers /></Sequence>
      <Sequence from={240} durationInFrames={120}><SceneSchedule /></Sequence>
      <Sequence from={360} durationInFrames={120}><ScenePayments /></Sequence>
      <Sequence from={480} durationInFrames={120}><SceneAI /></Sequence>
      <Sequence from={600} durationInFrames={120}><SceneOutro /></Sequence>
      <BrandBar />
    </AbsoluteFill>
  );
};
