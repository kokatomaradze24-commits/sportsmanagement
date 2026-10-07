import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { AtmosphereBackground } from "./AtmosphereBackground";

export function usePublicPresentation(mode: "signin" | "registration") {
  useEffect(() => {
    const previous = document.documentElement.getAttribute("data-public-ui");
    document.documentElement.setAttribute("data-public-ui", mode);
    return () => { if (previous === null) document.documentElement.removeAttribute("data-public-ui"); else document.documentElement.setAttribute("data-public-ui", previous); };
  }, [mode]);
}
const ease = [0.23, 1, 0.32, 1] as const;
export function PublicReveal({ children, className, delay = 0, scroll = false }: { children: ReactNode; className?: string; delay?: number; scroll?: boolean }) {
  const reduce = useReducedMotion();
  const initial = { opacity: 0, y: reduce ? 0 : scroll ? 16 : 12, filter: reduce ? "blur(0px)" : "blur(4px)" };
  const final = { opacity: 1, y: 0, filter: "blur(0px)" };
  return <motion.div className={className} initial={initial} animate={scroll ? undefined : final} whileInView={scroll ? final : undefined} viewport={{ once: true, amount: 0.12 }} transition={{ duration: scroll ? .45 : .5, delay, ease }}>{children}</motion.div>;
}
export function SignInScene({ children }: { children: ReactNode }) {
  usePublicPresentation("signin");
  const reduce = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 70, damping: 25 }), sy = useSpring(y, { stiffness: 70, damping: 25 });
  const rx = useTransform(sy, [-10, 10], [2, -2]), ry = useTransform(sx, [-10, 10], [-2, 2]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node || reduce || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    const move = (event: PointerEvent) => { x.set((event.clientX / window.innerWidth - .5) * 20); y.set((event.clientY / window.innerHeight - .5) * 20); };
    const reset = () => { x.set(0); y.set(0); };
    node.addEventListener("pointermove", move); node.addEventListener("pointerleave", reset);
    return () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", reset); };
  }, [reduce, x, y]);
  return <div ref={root} className="signin-page public-page">
    <motion.div className="signin-background" style={{ x: sx, y: sy }}><AtmosphereBackground /></motion.div>
    <motion.div className="signin-content" style={{ "--card-rotate-x": rx, "--card-rotate-y": ry } as never}>{children}</motion.div>
  </div>;
}
export function RegistrationHeader({ logo, club, title, subtitle }: { logo: ReactNode; club: string; title: string; subtitle: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [30, 140], [0, 1]);
  const titleOpacity = useTransform(scrollY, [0, 140], [1, reduce ? 1 : 0]);
  const scale = useTransform(scrollY, [0, 140], [1, reduce ? 1 : .88]);
  return <><motion.div className="registration-nav" style={{ opacity }}><span>{title}</span></motion.div>
    <motion.header ref={ref} className="registration-header" style={{ opacity: titleOpacity, scale }}>
      <div className="registration-logo">{logo}</div><p>{club}</p><h1>{title}</h1><p className="text-muted-foreground">{subtitle}</p>
    </motion.header></>;
}
