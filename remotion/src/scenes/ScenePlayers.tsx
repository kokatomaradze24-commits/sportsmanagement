import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ScenePad, SceneTitle, Card, fadeSlide } from "./_shared";

const PLAYERS = [
  { n: "გიორგი ბერიძე", num: 7, age: "U16", color: "#f97316" },
  { n: "ნიკა გელაშვილი", num: 23, age: "U16", color: "#3b82f6" },
  { n: "ლუკა ჯაფარიძე", num: 11, age: "U14", color: "#10b981" },
  { n: "სანდრო კვარაცხელია", num: 4, age: "U18", color: "#a855f7" },
  { n: "დათო ნოზაძე", num: 9, age: "U14", color: "#ec4899" },
  { n: "გიორგი ჭანტურია", num: 15, age: "U18", color: "#06b6d4" },
];

export const ScenePlayers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <ScenePad>
      <SceneTitle tag="ფუნქცია 01" title="მოთამაშეების და გუნდების ბაზა" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 10 }}>
        {PLAYERS.map((p, i) => (
          <Card key={i} delay={14 + i * 5}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "white",
                }}
              >
                {p.num}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 17, lineHeight: 1.2, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{p.n}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>ჯგუფი {p.age} · აქტიური</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ ...fadeSlide(frame, fps, 60, 16), marginTop: 22, fontFamily: "Inter, sans-serif", color: "#cbd5e1", fontSize: 16 }}>
        სრული პროფილები · მშობლის კონტაქტი · ასაკობრივი ჯგუფები · გუნდები
      </div>
    </ScenePad>
  );
};
