"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Random generators for dynamic noise text
function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function randomBinary(length: number): string {
  return Array.from({ length }, () => (Math.random() > 0.5 ? "1" : "0")).join("");
}

function randomBytes(n: number): string {
  return `0x${randomHex(n * 2)}`;
}

function randomHash(): string {
  return `0x${randomHex(64)}`;
}

function generateRandomTxIn(): string {
  const hash = randomHex(16);
  const index = Math.floor(Math.random() * 10);
  const scriptSig = randomHex(Math.floor(Math.random() * 40 + 20));
  return `TxIn: [${hash}...] [${index}] [${scriptSig.substring(0, 20)}...]`;
}

function generateRandomTxOut(): string {
  const value = (Math.random() * 10).toFixed(8);
  const scriptPubKey = randomHex(Math.floor(Math.random() * 40 + 20));
  return `TxOut: [${value}] [${scriptPubKey.substring(0, 16)}...]`;
}

function generateMerkleRoot(): string {
  return `Merkle: 0x${randomHex(32)}`;
}

function generateBlockHeader(): string {
  return `H(Block_Header) = 0x${randomHex(64)}`;
}

function generateTarget(): string {
  return `target: 0x${randomHex(64).replace(/0/g, "0").substring(0, 16)}...`;
}

const coreMath = [
  () => "p = \\Pr[\\text{honest finds next block}]",
  () => "q = \\Pr[\\text{attacker finds next block}]",
  () => "q^{z} = \\left(\\frac{q}{p}\\right)^{z}",
  () => "\\lambda = z \\cdot \\frac{q}{p}",
  () => "1 - \\sum_{k=0}^{z} \\frac{\\lambda^{k} e^{-\\lambda}}{k!} \\cdot \\left(1 - \\left(\\frac{q}{p}\\right)^{z-k}\\right)",
  () => "P < 10^{-z}",
];

const dynamicMath = [
  () => `λ = ${Math.floor(Math.random() * 100)}`,
  () => `P = ${(Math.random() * 0.001).toExponential(2)}`,
  () => `z = ${Math.floor(Math.random() * 20 + 1)}`,
];

const cryptoGenerators = [
  () => randomHash(),
  () => `${randomBinary(8)} ${randomBinary(8)} ${randomBinary(8)} ${randomBinary(8)}`,
  () => `SHA-256(${randomBytes(32).substring(0, 20)}...)`,
  () => generateMerkleRoot(),
  () => generateRandomTxIn(),
  () => generateRandomTxOut(),
];

const structuralNoise = ["+", "−", "||", "::", "{ }", "[ ]", "Σ", "∫", "⇒", "0x", "11", "π", "Δ"];

const extendedCryptoNoise = [
  () => "ECDSA(secp256k1)",
  () => `nBits · target ≤ 0x${randomHex(16)}...`,
  () => `nonce ∈ [0, 2^${Math.floor(Math.random() * 32 + 1)})`,
  () => `block.height = ${Math.floor(Math.random() * 900000)}`,
  () => `MTP = ${Math.floor(Math.random() * 1000 + 1600000000)}`,
  () => `TxID = ${randomHash().substring(0, 20)}...`,
  () => `UTXO[${Math.floor(Math.random() * 100)}] -> spendable`,
  () => `scriptSig = ${randomHex(20)}... || scriptPubKey = ${randomHex(20)}...`,
  () => `nLockTime >= ${Math.floor(Math.random() * 1000000)}`,
  () => `difficulty = D_0 · 2^(−${Math.floor(Math.random() * 20)})`,
  () => `merkle = H(${randomHex(8)} || ${randomHex(8)})`,
  () => `prevHash || ${randomHash().substring(0, 16)}...`,
  () => `version | time | bits | nonce = ${Math.floor(Math.random() * 4)}`,
  () => `coinbase -> ${(Math.random() * 6 + 3).toFixed(2)} + ${(Math.random() * 2).toFixed(4)}`,
  () => "satoshis = 10^8",
  () => "opcodes: DUP HASH160 EQUALVERIFY CHECKSIG",
  () => `witnessRoot = ${randomHash().substring(0, 20)}...`,
  () => `weight = base*${Math.floor(Math.random() * 5)} + total`,
];

const extendedStructuralNoise = [
  ...structuralNoise,
  "∂", "∇", "⊕", "⊗", "⊂", "⊆", "∈", "∉", "∀", "∃", "∴", "∵", "≈", "≠", "≤", "≥",
  "↦", "↔", "→", "←", "⇌", "∞", "∅", "ℤ", "ℚ", "ℝ", "ℕ", "⊢", "⊨", "⌈x⌉", "⌊x⌋",
  "log₂", "ln", "exp", "mod", "xor", "and", "or", "¬", "⟂", "∥", "⊙", "⊘", "⊓", "⊔",
  "α", "β", "γ", "δ", "ε", "η", "θ", "κ", "μ", "ν", "ρ", "σ", "τ", "φ", "χ", "ω",
];

const allGenerators = [
  ...coreMath,
  ...dynamicMath,
  ...cryptoGenerators,
  ...extendedCryptoNoise,
];

const allStaticTexts = [...extendedStructuralNoise];

type OrbitalElement = {
  id: string;
  text: string;
  radius: number; // distance from center (in vw/vh units)
  angle: number; // current angle in radians
  orbitSpeed: number; // radians per frame
  fontSize: string;
  opacity: number;
  targetOpacity: number;
  fontWeight: "normal" | "bold";
  zIndex: number;
  isGenerator: boolean;
  generator?: () => string;
  state: "fading-in" | "orbiting" | "fading-out" | "gone";
  fadeProgress: number; // 0-1 for fades, countdown for orbiting
  timeUntilFadeOut: number; // ms remaining before fade out starts
  orbitDirection: 1 | -1;
  width: number;
  height: number;
};

const CENTER_X = 50; // center of screen in percentage
const CENTER_Y = 45; // slightly above true center where title sits
const MIN_RADIUS = 15; // minimum orbit radius (% of viewport)
const MAX_RADIUS = 48; // maximum orbit radius (% of viewport)
const FADE_DURATION = 2000; // ms to fade in/out
const ORBIT_SPEED_BASE = 0.0002; // base rotation speed
const ELEMENT_LIFETIME = 8000; // ms before element starts fading out

// Exclusion zone for hero content (title, description, buttons)
// Defined as percentage of viewport (x, y, width, height)
const EXCLUSION_ZONE = {
  x: 10,      // 10% from left
  y: 30,      // 30% from top
  width: 80,  // 80% width (10% to 90%)
  height: 35, // 35% height (30% to 65%)
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function isInExclusionZone(x: number, y: number): boolean {
  return (
    x >= EXCLUSION_ZONE.x &&
    x <= EXCLUSION_ZONE.x + EXCLUSION_ZONE.width &&
    y >= EXCLUSION_ZONE.y &&
    y <= EXCLUSION_ZONE.y + EXCLUSION_ZONE.height
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createNewElement(): OrbitalElement {
  const isGenerator = Math.random() > 0.3;
  let text: string;
  let generator: (() => string) | undefined;

  if (isGenerator) {
    generator = allGenerators[Math.floor(Math.random() * allGenerators.length)];
    text = generator();
  } else {
    text = allStaticTexts[Math.floor(Math.random() * allStaticTexts.length)];
  }

  // Largest font size reduced by 20%: 20-38 becomes 16-30.4 (16-30)
  const fontSizeNum = Math.random() > 0.7 ? randomRange(16, 30) : randomRange(8, 16);
  const fontSize = `${fontSizeNum}px`;

  // Estimate dimensions based on text length and font size
  const width = Math.min(30, Math.max(3, text.length * fontSizeNum * 0.03));
  const height = Math.max(2, fontSizeNum * 0.15);

  return {
    id: generateId(),
    text,
    radius: randomRange(MIN_RADIUS, MAX_RADIUS),
    angle: randomRange(0, Math.PI * 2),
    orbitSpeed: randomRange(ORBIT_SPEED_BASE * 0.5, ORBIT_SPEED_BASE * 2),
    fontSize,
    opacity: 0,
    targetOpacity: randomRange(0.15, 0.6),
    fontWeight: Math.random() > 0.8 ? "bold" : "normal",
    zIndex: Math.floor(randomRange(1, 4)),
    isGenerator,
    generator,
    state: "fading-in",
    fadeProgress: 0,
    timeUntilFadeOut: ELEMENT_LIFETIME + Math.random() * 5000,
    orbitDirection: Math.random() > 0.5 ? 1 : -1,
    width,
    height,
  };
}

export default function BitcoinBackground() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [elements, setElements] = useState<OrbitalElement[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elementsRef = useRef<OrbitalElement[]>([]);
  const spawnTimerRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const spawnElement = useCallback(() => {
    const newElement = createNewElement();
    setElements(prev => [...prev, newElement]);
  }, []);

  // Animation loop - throttled for performance
  useEffect(() => {
    let frameSkip = 0;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Skip every other frame for performance (30fps instead of 60fps)
      frameSkip++;
      if (frameSkip % 2 === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      setElements(prevElements => {
        const updated: OrbitalElement[] = [];

        for (const el of prevElements) {
          const newEl = { ...el };

          // Handle fade states
          if (newEl.state === "fading-in") {
            newEl.fadeProgress += deltaTime / FADE_DURATION;
            if (newEl.fadeProgress >= 1) {
              newEl.fadeProgress = 1;
              newEl.state = "orbiting";
            }
            newEl.opacity = newEl.targetOpacity * easeOutCubic(newEl.fadeProgress);
          } else if (newEl.state === "orbiting") {
            newEl.timeUntilFadeOut -= deltaTime;
            if (newEl.timeUntilFadeOut <= 0) {
              newEl.state = "fading-out";
              newEl.fadeProgress = 1;
            }
            newEl.opacity = newEl.targetOpacity;
          } else if (newEl.state === "fading-out") {
            newEl.fadeProgress -= deltaTime / FADE_DURATION;
            if (newEl.fadeProgress <= 0) {
              newEl.state = "gone";
              newEl.opacity = 0;
            } else {
              newEl.opacity = newEl.targetOpacity * newEl.fadeProgress;
            }
          }

          // Skip gone elements
          if (newEl.state === "gone") continue;

          // Update orbit
          newEl.angle += newEl.orbitSpeed * deltaTime * newEl.orbitDirection;

          // Occasionally update text if it's a generator (reduced frequency)
          if (newEl.isGenerator && newEl.generator && Math.random() < 0.09) {
            newEl.text = newEl.generator();
          }

          updated.push(newEl);
        }

        return updated;
      });

      // Spawn new elements periodically (slower rate)
      spawnTimerRef.current += deltaTime;
      const targetElementCount = 20; // Reduced from 25
      const currentCount = elementsRef.current.filter(e => e.state !== "gone").length;

      if (currentCount < targetElementCount && spawnTimerRef.current > 1200) {
        spawnElement();
        spawnTimerRef.current = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spawnElement]);

  // Initial spawn and resize handling
  useEffect(() => {
    const initElements = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      // Spawn initial batch (reduced count)
      const initial: OrbitalElement[] = [];
      for (let i = 0; i < 15; i++) {
        initial.push(createNewElement());
      }
      setElements(initial);
    };

    const frameId = window.requestAnimationFrame(initElements);

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const shouldAnimateParallax = !prefersReducedMotion && !isCoarsePointer;

    const handlePointerMove = (event: PointerEvent) => {
      if (!shouldAnimateParallax) return;
      const normX = (event.clientX / window.innerWidth - 0.5) * 2;
      const normY = (event.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x: normX, y: normY });
    };

    const resetParallax = () => setParallax({ x: 0, y: 0 });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", resetParallax);
    window.addEventListener("blur", resetParallax);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetParallax);
      window.removeEventListener("blur", resetParallax);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const colors = ["rgba(206,76,0,0.86)", "rgba(134,31,65,0.84)"];

  const renderContent = (text: string) => {
    const isLatex = text.includes("\\") || text.includes("^{") || text.includes("_{") || text.includes("\\frac");
    if (isLatex) {
      return { __html: katex.renderToString(text, { throwOnError: false, output: "html", displayMode: true }) };
    }
    return undefined;
  };

  return (
    <div
      aria-hidden
      style={{
        backgroundColor: "#ffffff",
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        fontFamily: '"SF Mono", "Roboto Mono", Menlo, monospace',
      }}
    >
      {elements.map((el) => {
        // Calculate position based on orbit
        const x = CENTER_X + Math.cos(el.angle) * el.radius;
        const y = CENTER_Y + Math.sin(el.angle) * el.radius * 0.6; // 0.6 to account for aspect ratio

        // Check if element is in exclusion zone (hero content area)
        // and set opacity to 0 if it is
        const isInZone = isInExclusionZone(x, y);
        const effectiveOpacity = isInZone ? 0 : el.opacity;

        const html = renderContent(el.text);
        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) translate(${(parallax.x * (1 + el.zIndex)).toFixed(2)}px, ${(parallax.y * (1 + el.zIndex)).toFixed(2)}px)`,
              whiteSpace: "nowrap",
              fontSize: el.fontSize,
              letterSpacing: "0.05em",
              opacity: effectiveOpacity,
              fontWeight: el.fontWeight,
              zIndex: el.zIndex,
              color: colors[parseInt(el.id, 36) % colors.length],
              pointerEvents: "none",
              userSelect: "none",
              transition: "opacity 100ms ease-out",
              willChange: "transform, opacity",
            }}
            dangerouslySetInnerHTML={html}
          >
            {html ? undefined : el.text}
          </div>
        );
      })}
    </div>
  );
}
