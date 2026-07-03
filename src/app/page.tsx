"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LandingLoader } from "@/components/landing-loader";

function DiscordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function SocialIcon({ type, className = "h-4 w-4" }: { type: "x" | "linkedin"; className?: string }) {
  if (type === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FuzzyText({
  text,
  className = "",
  scrambleSpeed = 50,
  revealDuration = 1500,
  scrambleInterval = 10, // Only scramble every N frames to reduce letter changes
}: {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  revealDuration?: number;
  scrambleInterval?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [charWidths, setCharWidths] = useState<number[]>([]);
  const isRevealedRef = useRef(false);
  const revealedIndicesRef = useRef<Set<number>>(new Set());
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const chars = "abvcdefghijklmnopqrstuvwxyz0123456789`";
  const frameCounterRef = useRef(0);

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
      frameCounterRef.current++;
      // Only scramble every N frames to reduce letter changes
      if (frameCounterRef.current % scrambleInterval !== 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

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

function HeroDecryptTitle({
  text,
  active,
}: {
  text: string;
  active: boolean;
}) {
  const decryptChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*0123456789";
  const hasRunRef = useRef(false);
  const [displayText, setDisplayText] = useState(text);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!active || hasRunRef.current) return;
    hasRunRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text);
      setRevealed(true);
      return;
    }

    const charIndices: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== " ") {
        charIndices.push(i);
      }
    }

    const shuffledIndices = [...charIndices].sort(() => Math.random() - 0.5);
    const revealDuration = 1400;
    const revealStartTime = performance.now();
    let animationId = 0;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - revealStartTime) / revealDuration, 1);
      const totalToReveal = Math.floor(progress * shuffledIndices.length);
      const revealedIndices = new Set(shuffledIndices.slice(0, totalToReveal));

      let result = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          result += " ";
        } else if (revealedIndices.has(i) || progress >= 1) {
          result += text[i];
        } else {
          result += decryptChars[Math.floor(Math.random() * decryptChars.length)];
        }
      }

      setDisplayText(result);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
        setRevealed(true);
      }
    };

    setDisplayText(
      text
        .split("")
        .map((char) => (char === " " ? " " : decryptChars[Math.floor(Math.random() * decryptChars.length)]))
        .join("")
    );

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, text]);

  return (
    <span className={revealed ? "flat-hero-title-text flat-hero-title-text--revealed" : "flat-hero-title-text"}>
      {displayText}
    </span>
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

function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { href: "#impact", label: "Impact" },
    { href: "#travel", label: "Travel" },
    { href: "#projects", label: "Projects" },
    { href: "#leadership", label: "Team" },
  ];

  useEffect(() => {
    if (!sidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

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
      title: "Aerostrategy",
      description:
        "veAERO accumulator engine",
      website: "https://www.aerostrategy.finance/",
      repo: "https://aerostrategy.gitbook.io/docs/getting-started/technical-documentation/contracts",
    },
    {
      title: "MEV Uniswap Fee Extractor",
      description:
        "Atomic extraction of Uniswap pool fees on ETH using flashloans.",
      website: "https://github.com/Ungter/UniswapUNIGulper",
      repo: "https://github.com/Ungter/UniswapUNIGulper",
    },
  ];

  const officers = [
    {
      name: "Ted Sha",
      role: "Co-President, DeFi",
      image: "/ted.webp",
      imagePosition: "50% 52%",
      x: "https://x.com/TedSha7",
      linkedin: "",
    },
    {
      name: "Kyler O'Rourke",
      role: "Co-President, Planning & Development",
      image: "/kyler.webp",
      imagePosition: "50% 40%",
      x: "https://x.com/typetwoeng",
      linkedin: "https://www.linkedin.com/in/kyler-o-rourke-31061b21b/",
    },
    {
      name: "Andrew Kim",
      role: "Co-President, Web Development",
      image: "/andrewk.webp",
      imagePosition: "50% 45%",
      x: "https://x.com/tanpoporamen",
      linkedin: "https://www.linkedin.com/in/jungmink623/",
    },
    {
      name: "Andrew C Monte",
      role: "Professional Advisor",
      image: "/andrewc.webp",
      imagePosition: "50% 62%",
      x: "https://x.com/andrewcmonte",
      linkedin: "https://www.linkedin.com/in/andrewcmonte/",
    },
  ];

  return (
    <>
      {showLoader && (
        <LandingLoader
          onComplete={() => {
            setShowLoader(false);
            setHeroReady(true);
          }}
        />
      )}

      <div className={`page-shell relative overflow-x-clip${heroReady ? " page-entered" : ""}`}>
      <div className="page-atmosphere" aria-hidden="true" />
      <div className="page-lens-wrap">
      <section className={`flat-hero${heroReady ? " flat-hero--ready" : ""}`}>
        <header className="flat-topbar">
          <div className="flat-topbar-social">
            <a
              href="https://discord.gg/mHC2nbT2me"
              target="_blank"
              rel="noopener noreferrer"
              className="flat-social-link"
              aria-label="Join our Discord"
            >
              <DiscordIcon className="" />
            </a>
            <a
              href="https://x.com/vtblockchain"
              target="_blank"
              rel="noopener noreferrer"
              className="flat-social-link"
              aria-label="Follow us on X"
            >
              <SocialIcon type="x" className="" />
            </a>
          </div>

          <a href="/" className="flat-topbar-brand" aria-label="Virginia Tech Blockchain home">
            <Image
              src="/vtblogo-transparent.webp"
              alt=""
              width={112}
              height={112}
              className="flat-brand-logo"
              priority
            />
          </a>

          <nav className="flat-topbar-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="flat-topbar-menu-btn"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            aria-controls="flat-sidebar-panel"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <MenuIcon className="flat-menu-icon" />
          </button>
        </header>

        <h1 className="flat-hero-title">
          [<HeroDecryptTitle text="VT BLOCKCHAIN" active={heroReady} />]
        </h1>

        <div className="flat-hero-hokie">
          <Image
            src="/pudgyhokie-transparent.png?v=13"
            alt="Virginia Tech Hokie mascot"
            width={1020}
            height={1020}
            className="flat-hokie-img"
            priority
            unoptimized
          />
        </div>

        <div className="flat-hero-scroll" aria-hidden="true">
          <span className="flat-scroll-line" />
          SCROLL
        </div>
      </section>

      <section className="flat-section flat-section--mission-statement" aria-label="Mission statement">
        <div className="flat-section-inner flat-mission-statement-wrap">
          <p className="flat-mission-statement">
            Building the next generation of{" "}
            <strong>founders, developers, and degens</strong> on the blockchain at
            Virginia Tech.
          </p>
        </div>
      </section>

      <section id="impact" className="flat-section flat-section--white">
        <div className="flat-section-inner space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="section-kicker">Impact</p>
              <h2 className="section-title" style={{ fontFamily: "var(--font-neco), sans-serif" }}>Student impact at protocol scale.</h2>
            </div>
            <p className="flat-muted max-w-md text-sm leading-relaxed">
              Trading and investing through research, strategy, and student-led deployments.
            </p>
          </div>
          <div className="flat-divider pt-5">
            <p className="flat-stat text-5xl font-medium md:text-6xl">
              <AnimatedNumber value={8.55} prefix="$" suffix="m+" decimals={2} />
            </p>
            <p className="flat-stat-caption mt-1 text-sm">
              Cumulative personal on-chain volume
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:max-w-lg">
            <div className="stat-cell px-4 py-4">
              <p className="flat-stat-label text-xs font-semibold tracking-wide">Protocols</p>
              <p className="mt-2 text-3xl font-medium">
                <AnimatedNumber value={20} suffix="+" decimals={0} showSuffixAtTarget={true} />
              </p>
            </div>
            <div className="stat-cell px-4 py-4">
              <p className="flat-stat-label text-xs font-semibold tracking-wide">Chains Covered</p>
              <p className="mt-2 text-3xl font-medium">
                <AnimatedNumber value={10} suffix="+" decimals={0} showSuffixAtTarget={true} />
              </p>
            </div>
          </div>
          <div className="flat-divider pt-5">
            <p className="flat-stat text-5xl font-medium md:text-6xl">
              <AnimatedNumber value={10} prefix="$" suffix="b+" decimals={0} />
            </p>
            <p className="flat-stat-caption mt-1 text-sm">
              Volume routed through our contracts
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-10 md:gap-12">
              <img src="/kwenta.svg" alt="Kwenta" className="flat-partner-logo h-8 w-auto" />
              <img src="/aerostrat.svg" alt="Aerostrategy" className="flat-partner-logo h-8 w-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="flat-section flat-section--belt">
        <div className="hero-belt">
          <div className="hero-belt-inner">
            <span className="hero-belt-label">[Active on]</span>
            <div className="logo-belt flex-1">
              <div className="logo-track">
                {[...partners, ...partners].map((partner, idx) => (
                  <span key={`${partner.name}-${idx}`} className="logo-chip">
                    <img src={partner.logo} alt={`${partner.name} logo`} loading="lazy" decoding="async" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="travel" className="flat-section flat-section--white">
        <div className="flat-section-inner space-y-4">
          <div className="section-divider flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Travel</p>
              <h2 className="section-title" style={{ fontFamily: "var(--font-neco), sans-serif" }}>Conferences Attended</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {travels.map((stop) => (
              <article key={stop.event} className="flat-card p-5 transition-shadow hover:shadow-[0_10px_28px_rgba(232,85,29,0.12)]">
                <p className="text-xs font-semibold tracking-wide text-(--brand-orange)">{stop.short}</p>
                <h3 className="flat-card-title mt-2 text-xl font-medium">{stop.event}</h3>
                <p className="flat-muted mt-3 text-sm leading-relaxed">{stop.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="flat-section flat-section--maroon">
        <div className="flat-section-inner">
          <p className="section-kicker">Our mission</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-medium leading-tight md:text-4xl">
            Build the strongest student career pipeline into <span className="flat-mission-pill">web3</span>.
          </h2>
          <p className="flat-muted mt-4 max-w-3xl text-base leading-relaxed">
            Our goal is to collect developers, DeFi researchers, designers, and curious newcomers at Virginia Tech. Whether you are writing smart contracts or chasing alpha as a proud degen, we want to turn <AnimatedUnderline>curiosity into action</AnimatedUnderline>, and open up opportunities for students who are interested in the Web3 space.
          </p>
        </div>
      </section>

      <section id="projects" className="flat-section flat-section--white">
        <div className="flat-section-inner space-y-4">
          <div className="section-divider flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Projects</p>
              <h2 className="section-title" style={{ fontFamily: "var(--font-neco), sans-serif" }}>Data Analysis, MEV, etc.</h2>
            </div>
            <p className="flat-muted max-w-sm text-sm">Built by members and published for portfolio-ready <strong>PoW.</strong></p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.title}
                className={`flat-card flex h-full flex-col p-5 group ${project.title === "Mainstreet Dune" ? "mainstreet-hover" : ""
                  } ${project.title === "Aerostrategy" ? "aerostrategy-hover" : ""} ${project.title === "MEV Uniswap Fee Extractor" ? "mev-hover" : ""
                  }`}
              >
                <h3 className="flat-card-title text-xl font-medium">{project.title}</h3>
                <p className="flat-muted mt-3 flex-1 text-sm leading-relaxed">{project.description}</p>
                <div className="mt-6 flex gap-2.5">
                  <a
                    className={`btn btn-accent ${project.title === "Mainstreet Dune" ? "group-hover:bg-[#2bfb48] group-hover:border-[#2bfb48] transition-colors duration-500" : ""}`}
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </a>
                  <a
                    className={`btn btn-outline ${project.title === "Mainstreet Dune" ? "group-hover:bg-[#2bbcfb] group-hover:text-white group-hover:border-[#2bbcfb] transition-colors duration-500" : ""}`}
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="leadership" className="flat-section flat-section--maroon">
        <div className="flat-section-inner space-y-4">
          <div className="section-divider flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Leadership</p>
              <h2 className="section-title" style={{ fontFamily: "var(--font-neco), sans-serif" }}>Meet the team</h2>
            </div>
            <p className="flat-muted text-sm">4 officers currently leading VT Blockchain.</p>
          </div>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {officers.map((officer) => (
              <article key={officer.name} className="flat-card flex h-full flex-col overflow-hidden p-5">
                <div className="flat-team-photo flat-team-photo--light relative mb-4 aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={officer.image}
                    alt={officer.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: officer.imagePosition }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <h3 className="text-lg font-medium">{officer.name}</h3>
                  <p className="flat-muted mt-1 flex-1 text-sm leading-relaxed">{officer.role}</p>
                  <div className="team-socials">
                    {officer.x ? (
                      <a
                        href={officer.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="team-social-link"
                        aria-label={`${officer.name} on X`}
                      >
                        <SocialIcon type="x" />
                      </a>
                    ) : (
                      <span className="team-social-link team-social-link--pending" aria-label={`${officer.name} on X, link coming soon`}>
                        <SocialIcon type="x" />
                      </span>
                    )}
                    {officer.linkedin ? (
                      <a
                        href={officer.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="team-social-link"
                        aria-label={`${officer.name} on LinkedIn`}
                      >
                        <SocialIcon type="linkedin" />
                      </a>
                    ) : (
                      <span className="team-social-link team-social-link--pending" aria-label={`${officer.name} on LinkedIn, link coming soon`}>
                        <SocialIcon type="linkedin" />
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>

    <div className={`flat-sidebar${sidebarOpen ? " flat-sidebar--open" : ""}`} aria-hidden={!sidebarOpen}>
      <button
        type="button"
        className="flat-sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        id="flat-sidebar-panel"
        className="flat-sidebar-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="flat-sidebar-header">
          <span className="flat-sidebar-label">Menu</span>
          <button
            type="button"
            className="flat-sidebar-close"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon className="flat-menu-icon" />
          </button>
        </div>
        <nav className="flat-sidebar-nav" aria-label="Mobile primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
    </>
  );
}
