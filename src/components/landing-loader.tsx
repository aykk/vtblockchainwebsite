"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LandingLoaderProps = {
  onComplete: () => void;
};

export function LandingLoader({ onComplete }: LandingLoaderProps) {
  const [phase, setPhase] = useState<"loading" | "exit">("loading");

  useEffect(() => {
    const minDisplayMs = 700;
    const start = performance.now();

    const finish = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, minDisplayMs - elapsed);
      window.setTimeout(() => setPhase("exit"), wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => window.removeEventListener("load", finish);
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    const timer = window.setTimeout(onComplete, 520);
    return () => window.clearTimeout(timer);
  }, [phase, onComplete]);

  return (
    <div
      className={`landing-loader${phase === "exit" ? " landing-loader--exit" : ""}`}
      aria-hidden={phase === "exit"}
      aria-label="Loading"
    >
      <div className="landing-loader-inner">
        <Image
          src="/vtblogo-transparent.webp"
          alt=""
          width={56}
          height={56}
          className="landing-loader-logo"
          priority
        />
        <span className="landing-loader-bar" />
      </div>
    </div>
  );
}
