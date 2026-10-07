import { useEffect, useRef, useState } from "react";
import arenaDesktop from "@/assets/backgrounds/arena-desktop.webp";
import arenaMobile from "@/assets/backgrounds/arena-mobile.webp";
import arenaPlaceholder from "@/assets/backgrounds/arena-placeholder.webp";
import basketballDesktop from "@/assets/backgrounds/basketball-desktop.webp";
import basketballMobile from "@/assets/backgrounds/basketball-mobile.webp";
import basketballPlaceholder from "@/assets/backgrounds/basketball-placeholder.webp";
import footballDesktop from "@/assets/backgrounds/football-desktop.webp";
import footballMobile from "@/assets/backgrounds/football-mobile.webp";
import footballPlaceholder from "@/assets/backgrounds/football-placeholder.webp";

const images = {
  arena: { desktop: arenaDesktop, mobile: arenaMobile, placeholder: arenaPlaceholder },
  basketball: { desktop: basketballDesktop, mobile: basketballMobile, placeholder: basketballPlaceholder },
  football: { desktop: footballDesktop, mobile: footballMobile, placeholder: footballPlaceholder },
};
export function AtmosphereBackground({ sport = "arena", variant = "hero" }: { sport?: string; variant?: "hero" | "dashboard" | "registration" }) {
  const image = images[sport === "basketball" || sport === "football" ? sport : "arena"];
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setLoaded(Boolean(imgRef.current?.complete && imgRef.current?.naturalWidth));
    const link = document.createElement("link");
    link.rel = "preload"; link.as = "image";
    link.href = window.matchMedia("(max-width: 639px)").matches ? image.mobile : image.desktop;
    document.head.appendChild(link);
    return () => link.remove();
  }, [image]);
  return <div className={`atmosphere atmosphere-${variant}`} aria-hidden="true">
    <div className="atmosphere-drift">
      <img className="atmosphere-placeholder" src={image.placeholder} alt="" width={40} height={24} />
      <picture><source media="(max-width: 639px)" srcSet={image.mobile} /><img ref={imgRef} data-loaded={loaded} src={image.desktop} onLoad={() => setLoaded(true)} alt="" width={2400} height={1360} fetchPriority="high" /></picture>
    </div>
    <div className="atmosphere-scrim" />
    {variant === "hero" && <><div className="arena-light arena-light-one" /><div className="arena-light arena-light-two" /></>}
  </div>;
}
