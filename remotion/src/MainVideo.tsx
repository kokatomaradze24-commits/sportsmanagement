import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneLogin } from "./scenes/SceneLogin";
import { ScenePlayerAdd } from "./scenes/ScenePlayerAdd";
import { SceneCoachAdd } from "./scenes/SceneCoachAdd";
import { SceneScheduleAdd } from "./scenes/SceneScheduleAdd";
import { ScenePaymentMark } from "./scenes/ScenePaymentMark";
import { SceneAIPlan } from "./scenes/SceneAIPlan";
import { SceneOutro } from "./scenes/SceneOutro";

loadSora("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

function PersistentBackground() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;
  const orb = (cx: number, cy: number, color: string, size: number, speed: number) => {
    const x = cx + Math.sin(t * speed) * 80;
    const y = cy + Math.cos(t * speed * 0.8) * 60;
    return (
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: color, filter: "blur(120px)", opacity: 0.45 }} />
    );
  };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)" }}>
      {orb(width * 0.2, height * 0.2, "#f97316", 520, 0.35)}
      {orb(width * 0.85, height * 0.4, "#3b82f6", 580, 0.28)}
      {orb(width * 0.55, height * 0.85, "#10b981", 500, 0.32)}
    </AbsoluteFill>
  );
}

function BrandBar() {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 4, width: progress * width, background: "linear-gradient(90deg, #f97316, #fbbf24)" }} />
    </AbsoluteFill>
  );
}

const SCENES: Array<{ C: React.FC; d: number }> = [
  { C: SceneIntro, d: 90 },
  { C: SceneLogin, d: 150 },
  { C: ScenePlayerAdd, d: 165 },
  { C: SceneCoachAdd, d: 165 },
  { C: SceneScheduleAdd, d: 165 },
  { C: ScenePaymentMark, d: 165 },
  { C: SceneAIPlan, d: 180 },
  { C: SceneOutro, d: 90 },
];

export const TOTAL = SCENES.reduce((s, x) => s + x.d, 0);

export const MainVideo: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill>
      <PersistentBackground />
      {SCENES.map(({ C, d }, i) => {
        const from = cursor;
        cursor += d;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <C />
          </Sequence>
        );
      })}
      <BrandBar />
    </AbsoluteFill>
  );
};
