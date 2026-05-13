import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 24 seconds at 30fps = 720 frames
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={720}
    fps={30}
    width={1280}
    height={720}
  />
);
