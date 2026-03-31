"use client";

import { useEffect, useRef, useState } from "react";
import BitcoinBackground from "@/components/bitcoin-background";

function FuzzyText({
  text,
  className = "",
  scrambleSpeed = 50,
  revealDuration = 1500,
}: {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  revealDuration?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [charWidths, setCharWidths] = useState<number[]>([]);
  const isRevealedRef = useRef(false);
  const revealedIndicesRef = useRef<Set<number>>(new Set());
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Measure character widths on mount
  useEffect(() => {
    if (!measureRef.current) return;

    const widths: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === " ") {
        widths.push(0); // Spaces don't need fixed width
      } else {
        // Measure each unique character
        measureRef.current.textContent = text[i];
        const width = measureRef.current.getBoundingClientRect().width;
        widths.push(width);
      }
    }
    setCharWidths(widths);
  }, [text]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted && charWidths.length > 0) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, charWidths]);

  useEffect(() => {
    if (!hasStarted) return;

    // Reset state for fresh animation
    isRevealedRef.current = false;
    revealedIndicesRef.current.clear();
    setDisplayText("");

    setOpacity(1);

    // Get indices of non-space characters
    const charIndices: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== " ") {
        charIndices.push(i);
      }
    }

    // Shuffle the indices for random reveal order
    const shuffledIndices = [...charIndices].sort(() => Math.random() - 0.5);

    const revealStartTime = performance.now();
    let animationId: number;

    const animate = () => {
      const elapsed = performance.now() - revealStartTime;
      const progress = Math.min(elapsed / revealDuration, 1);

      // Determine how many characters to reveal based on progress
      const totalToReveal = Math.floor(progress * shuffledIndices.length);

      // Add newly revealed indices
      for (let i = revealedIndicesRef.current.size; i < totalToReveal; i++) {
        if (i < shuffledIndices.length) {
          revealedIndicesRef.current.add(shuffledIndices[i]);
        }
      }

      let result = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          result += " ";
        } else if (revealedIndicesRef.current.has(i)) {
          result += text[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      setDisplayText(result);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Ensure all characters are revealed at the end
        setDisplayText(text);
        isRevealedRef.current = true;
      }
    };

    const interval = setInterval(() => {
      if (!isRevealedRef.current) {
        animate();
      }
    }, scrambleSpeed);

    animate();

    return () => {
      clearInterval(interval);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [hasStarted, text, scrambleSpeed, revealDuration]);

  return (
    <>
      {/* Hidden measurement element */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={className}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
      <span
        ref={ref}
        className={className}
        style={{
          opacity,
          transition: "opacity 0.3s ease-out",
        }}
      >
        {(displayText || text).split("").map((char, i) => {
          const width = charWidths[i];
          if (char === " " || width === undefined || width === 0) {
            return char === " " ? " " : char;
          }
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: `${width}px`,
                textAlign: "center",
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </>
  );
}

function useAnimatedNumber(target: number, duration: number = 2000, start: boolean = false) {
  const [value, setValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(target * easeOut);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration, start]);

  return value;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  showSuffixAtTarget = false,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  showSuffixAtTarget?: boolean;
}) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const animatedValue = useAnimatedNumber(value, 2000, hasStarted);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (animatedValue >= value && hasStarted) {
      setIsComplete(true);
    }
  }, [animatedValue, value, hasStarted]);

  const formattedValue = decimals > 0 ? animatedValue.toFixed(decimals) : Math.floor(animatedValue).toString();

  return (
    <span ref={ref}>
      {prefix}
      {formattedValue}
      {showSuffixAtTarget ? (
        <span
          className="inline-block transition-opacity duration-700 ease-out"
          style={{ opacity: isComplete ? 1 : 0 }}
        >
          {suffix}
        </span>
      ) : (
        suffix
      )}
    </span>
  );
}

function AnimatedUnderline({
  children,
  className = "",
  duration = 800,
  delay = 200,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      {children}
      <span
        className="absolute bottom-0 left-0 h-[2px] bg-current"
        style={{
          width: isVisible ? "100%" : "0%",
          transition: `width ${duration}ms ease-out ${delay}ms`,
        }}
      />
    </span>
  );
}

export default function Home() {
  const partners = [
    { name: "Avalanche", logo: "/avalanche-avax-logo.svg" },
    { name: "Chainlink", logo: "/chainlink-link-logo.svg" },
    { name: "Base", logo: "/Base_square_blue.svg" },
    { name: "Solana", logo: "/solana-sol-logo.svg" },
    { name: "Polygon", logo: "/polygon-matic-logo.svg" },
    { name: "Uniswap", logo: "/uniswap-uni-logo.svg" },
    { name: "Arbitrum", logo: "/arbitrum-arb-logo.svg" },
    { name: "Optimism", logo: "/optimism-ethereum-op-logo.svg" },
  ];

  const travels = [
    {
      event: "Michigan Blockchain Conference",
      short: "MBC",
      note: "Built recruiting pipelines with student and industry builders.",
    },
    {
      event: "ETHDenver",
      short: "ETH Denver",
      note: "Shipped prototypes and met founders across infra + DeFi.",
    },
    {
      event: "TOKEN2049 Dubai",
      short: "TOKEN2049",
      note: "Expanded global partnerships and explored emerging markets.",
    },
  ];

  const projects = [
    {
      title: "Mainstreet Dune",
      description:
        "Analytics dashboard tracking over $40 million dollars in assets, updated daily.",
      website: "https://dune.com/jungt/mainstreet",
      repo: "https://github.com/Ungter/Mainstreet_DUNE",
    },
    {
      title: "Hokie Wallet Lab",
      description:
        "Educational wallet sandbox for onboarding students to self-custody.",
      website: "https://example.com/hokie-wallet",
      repo: "https://github.com/vt-blockchain/hokie-wallet-lab",
    },
    {
      title: "Maroon Vault",
      description:
        "Experimenting with DeFi strategy tooling for research and simulation.",
      website: "https://example.com/maroon-vault",
      repo: "https://github.com/vt-blockchain/maroon-vault",
    },
  ];

  const officers = [
    { name: "Andrew Kim", role: "Co-President, Web Development", initials: "AK" },
    { name: "Ted Sha", role: "Co-President, DeFi", initials: "TS" },
    { name: "Kyler O'Rourke", role: "Co-President, Planning & Development", initials: "KR" },
    { name: "Andrew C Monte", role: "Professional Advisor", initials: "AM" },
  ];

  return (
    <div className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(206,76,0,0.12),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(134,31,65,0.12),transparent_34%),radial-gradient(circle_at_60%_65%,rgba(124,24,44,0.09),transparent_42%)]" />

      <header className="sticky top-0 z-40 border-b border-(--line)/1 bg-transparent">
        <nav className="mx-auto flex w-full max-w-6xl items-center bg-transparent justify-between px-6 py-3 md:px-10 lg:px-14">
          <a href="#" className="nav-brand pointer-events-auto">
            VT Blockchain
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <a className="nav-link pointer-events-auto" href="#impact">
                Impact
              </a>
              <a className="nav-link pointer-events-auto" href="#travel">
                Travel
              </a>
              <a className="nav-link pointer-events-auto" href="#projects">
                Projects
              </a>
              <a className="nav-link pointer-events-auto" href="#leadership">
                Team
              </a>
            </div>
            <a href="#leadership" className="btn-brutal btn-maroon pointer-events-auto ml-2">
              Join Us
            </a>
          </div>
        </nav>
      </header>

      <section className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-transparent">
        <BitcoinBackground />
        <div className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_20%_20%,rgba(206,76,0,0.07),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(134,31,65,0.08),transparent_42%)]" />

        <div className="pointer-events-none absolute inset-0 z-2 flex -translate-y-4 flex-col items-center justify-center px-8 pb-20 pt-8 md:-translate-y-6 md:pb-18 md:pt-10">
          <div className="mx-auto w-full max-w-6xl text-center">
            <div className="mx-auto flex w-fit items-end gap-3 translate-x-2 md:gap-4 md:translate-x-6">
              <span
                aria-hidden
                className="block h-[clamp(4.5rem,11vw,9.8rem)] w-[clamp(4.5rem,11vw,9.8rem)] shrink-0 translate-y-4.5 md:translate-y-5.5"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-orange) 12%, var(--brand-maroon) 88%)",
                  WebkitMaskImage: "url('/vtlogo.svg')",
                  maskImage: "url('/vtlogo.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
              <h1 className="w-fit text-left leading-[0.95]">
                <span className="block font-[Georgia,Times,serif] text-[clamp(1rem,2.1vw,1.5rem)] font-normal tracking-[0.08em] text-[rgba(134,31,65,0.9)]">
                  <FuzzyText text="Virginia Tech" scrambleSpeed={40} revealDuration={1200} />
                </span>
                <span className="relative block text-[clamp(2.2rem,8vw,6.2rem)] font-normal tracking-tight" style={{ fontFamily: "var(--font-neco), sans-serif" }}>
                  <span className="text-(--brand-maroon)">
                    <FuzzyText text="Block" scrambleSpeed={40} revealDuration={1500} />
                  </span>
                  <span className="text-(--brand-orange)">
                    <FuzzyText text="chain" scrambleSpeed={40} revealDuration={1500} />
                  </span>
                </span>
              </h1>
            </div>
            <p className="mx-auto mb-8 mt-6 max-w-3xl text-center text-sm leading-relaxed text-black md:text-lg">
              STUDENT COLLECTIVE BUILDING A HARD PIPELINE INTO WEB3: DEVELOPMENT, DEFI, RESEARCH, AND SHIP-FAST EXPERIMENTATION.
            </p>
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4">
              <a href="#projects" className="btn-brutal btn-maroon">
                [LEARN MORE]
              </a>
              <a href="#leadership" className="btn-brutal btn-orange">
                [ABOUT US]
              </a>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-3 px-6 md:bottom-7 md:px-10 lg:px-14">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4 text-(--brand-maroon)">
            <span className="text-base md:text-lg uppercase tracking-[0.16em] font-normal">
              <FuzzyText text="[Experiences]" scrambleSpeed={30} revealDuration={800} />
            </span>
            <div className="logo-belt flex-1 bg-[rgba(255,255,255,0.62)]">
              <div className="logo-track">
                {[...partners, ...partners].map((partner, idx) => (
                  <span key={`${partner.name}-${idx}`} className="logo-chip bg-[rgba(255,255,255,0.78)]">
                    <img src={partner.logo} alt={`${partner.name} logo`} loading="lazy" decoding="async" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pt-16 md:px-10 lg:px-14">
        <section id="impact" className="section-shell relative p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="section-kicker">Impact</p>
              <h2 className="section-title">Student impact at protocol scale.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-(--muted)">
              Trading and investing through research, strategy, and student-led deployments.
            </p>
          </div>
          <div className="mt-6 border-t border-(--line) pt-6">
            <p className="text-5xl font-medium text-(--brand-maroon) md:text-6xl">
              <AnimatedNumber value={8.55} prefix="$" suffix="m+" decimals={2} />
            </p>
            <p className="mt-1 text-sm text-(--brand-maroon)/60">
              Cumulative on-chain volume
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 md:max-w-lg">
            <div className="border border-(--line) bg-background px-4 py-5">
              <p className="text-xs uppercase tracking-[0.15em] text-(--muted)">Protocols</p>
              <p className="mt-2 text-3xl font-medium">
                <AnimatedNumber value={20} suffix="+" decimals={0} showSuffixAtTarget={true} />
              </p>
            </div>
            <div className="border border-(--line) bg-background px-4 py-5">
              <p className="text-xs uppercase tracking-[0.15em] text-(--muted)">Chains Covered</p>
              <p className="mt-2 text-3xl font-medium">
                <AnimatedNumber value={10} suffix="+" decimals={0} showSuffixAtTarget={true} />
              </p>
            </div>
          </div>
        </section>

        <section id="travel" className="grid gap-4 md:grid-cols-3">
          {travels.map((stop) => (
            <article key={stop.event} className="section-shell p-6 transition hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-(--brand-orange)">{stop.short}</p>
              <h3 className="mt-2 text-xl font-medium text-[#211319]">{stop.event}</h3>
              <p className="mt-3 text-sm leading-relaxed text-(--muted)">{stop.note}</p>
            </article>
          ))}
        </section>

        <section className="section-shell border-none !bg-linear-to-r from-[rgba(134,31,65,0.94)] to-[rgba(206,76,0,0.92)] p-8 text-white md:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Our mission</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-medium leading-tight text-white md:text-4xl">
            Build the strongest student career pipeline into <span className="bg-white px-1 py-0.5 text-[var(--brand-maroon)]">web3</span>.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90">
            We mentor developers, DeFi researchers, designers, and curious newcomers. Whether you are writing smart contracts or chasing alpha as a proud degen, we turn <AnimatedUnderline className="text-white">curiosity into action</AnimatedUnderline>.
          </p>
        </section>

        <section id="projects" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--line) pb-4">
            <div>
              <p className="section-kicker">Projects</p>
              <h2 className="section-title">Data Analysis, MEV, etc.</h2>
            </div>
            <p className="max-w-sm text-sm text-(--muted)">Built by members and published for portfolio-ready <strong>PoW.</strong></p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {projects.map((project) => (
              <article key={project.title} className="section-shell flex h-full flex-col p-6">
                <h3 className="text-xl font-medium text-[#22131a]">{project.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-(--muted)">{project.description}</p>
                <div className="mt-6 flex gap-3 text-sm font-semibold">
                  <a className="btn-brutal btn-orange" href={project.website}>
                    [Website]
                  </a>
                  <a className="btn-brutal btn-ghost" href={project.repo}>
                    [GitHub]
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="leadership" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--line) pb-4">
            <div>
              <p className="section-kicker">Leadership</p>
              <h2 className="section-title">Meet the team</h2>
            </div>
            <p className="text-sm text-(--muted)">4 officers currently leading VT Blockchain.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {officers.map((officer) => (
              <article key={officer.name} className="section-shell p-5">
                <div className="mb-4 flex h-32 w-full items-center justify-center border border-(--line) bg-linear-to-br from-[rgba(134,31,65,0.16)] to-[rgba(206,76,0,0.2)] text-3xl font-medium text-(--brand-maroon)">
                  {officer.initials}
                </div>
                <h3 className="text-lg font-medium">{officer.name}</h3>
                <p className="text-sm text-(--muted)">{officer.role}</p>
              </article>
            ))}
          </div>
          <p className="text-xs text-(--muted)">
            Replace initials cards with real headshots by swapping each card with a Next `Image` component.
          </p>
        </section>
      </main>
    </div>
  );
}
