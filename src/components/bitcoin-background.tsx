"use client";

import { useEffect, useState, useRef } from "react";

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

type NoiseElement = {
  text: string;
  top: string;
  left: string;
  fontSize: string;
  opacity: number;
  fontWeight: "normal" | "bold";
  zIndex: number;
  isDynamic: boolean;
  generator?: () => string;
};

type PlacementBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ForbiddenZone = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const coreMath = [
  () => "p = Pr[honest finds next block]",
  () => "q = Pr[attacker finds next block]",
  () => `qᶻ = (${(Math.random() * 0.5).toFixed(2)}/${(Math.random() * 0.5 + 0.5).toFixed(2)})ᶻ`,
  () => `λ = ${Math.floor(Math.random() * 100)} · (q/p)`,
  () => `1 − Σ(k=0→${Math.floor(Math.random() * 10 + 5)}) ((λᵏ e⁻ˡ) / k!) · (1 − (q/p)ᶻ⁻ᵏ)`,
  () => `P < 10⁻${Math.floor(Math.random() * 5 + 1)}`,
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
const BACKGROUND_UPSHIFT_PERCENT = 2;

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

function estimateBox(text: string, fontSize: string): { width: number; height: number } {
  const fontPx = Number.parseInt(fontSize, 10);
  const width = Math.min(38, Math.max(3, text.length * fontPx * 0.03));
  const height = Math.max(2.4, fontPx * 0.17);
  return { width, height };
}

function overlaps(a: PlacementBox, b: PlacementBox, gap = 1.4) {
  return !(
    a.left + a.width + gap < b.left ||
    b.left + b.width + gap < a.left ||
    a.top + a.height + gap < b.top ||
    b.top + b.height + gap < a.top
  );
}

function intersectsZone(box: PlacementBox, zone: ForbiddenZone) {
  return !(
    box.left + box.width < zone.left ||
    zone.left + zone.width < box.left ||
    box.top + box.height < zone.top ||
    zone.top + zone.height < box.top
  );
}

function getScatteredBiasedPosition(width: number, height: number) {
  const r = Math.random();

  // More random global scatter, with light side preference.
  if (r < 0.25) {
    return {
      top: 4 + Math.random() * Math.max(1, 90 - height),
      left: 1 + Math.random() * Math.max(1, 26 - width),
    };
  }
  if (r < 0.5) {
    return {
      top: 4 + Math.random() * Math.max(1, 90 - height),
      left: 73 + Math.random() * Math.max(1, 26 - width),
    };
  }
  if (r < 0.75) {
    return {
      top: 4 + Math.random() * Math.max(1, 90 - height),
      left: 2 + Math.random() * Math.max(1, 94 - width),
    };
  }
  if (r < 0.875) {
    return {
      top: 1 + Math.random() * Math.max(1, 16 - height),
      left: 2 + Math.random() * Math.max(1, 94 - width),
    };
  }
  return {
    top: 82 + Math.random() * Math.max(1, 16 - height),
    left: 2 + Math.random() * Math.max(1, 94 - width),
  };
}

function shuffledUnique<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function placeWithoutOverlap(
  placed: PlacementBox[],
  forbidden: ForbiddenZone[],
  text: string,
  fontSize: string,
  tries = 120,
): { top: string; left: string } | null {
  const { width, height } = estimateBox(text, fontSize);

  for (let i = 0; i < tries; i += 1) {
    const pos = getScatteredBiasedPosition(width, height);
    const box: PlacementBox = { top: pos.top, left: pos.left, width, height };
    const blockedByZone = forbidden.some((zone) => intersectsZone(box, zone));
    if (blockedByZone) continue;
    const isBlocked = placed.some((existing) => overlaps(existing, box));
    if (!isBlocked) {
      placed.push(box);
      return { top: `${pos.top}%`, left: `${pos.left}%` };
    }
  }

  // If dense, still keep it on sides and away from center.
  const fallback = getScatteredBiasedPosition(width, height);
  const fallbackBox: PlacementBox = { top: fallback.top, left: fallback.left, width, height };
  const fallbackBlocked = forbidden.some((zone) => intersectsZone(fallbackBox, zone));
  const fallbackOverlap = placed.some((existing) => overlaps(existing, fallbackBox));
  if (!fallbackBlocked && !fallbackOverlap) {
    placed.push(fallbackBox);
    return { top: `${fallback.top}%`, left: `${fallback.left}%` };
  }

  return null;
}

function generateNoiseElements(): NoiseElement[] {
  const generatedElements: NoiseElement[] = [];
  const placed: PlacementBox[] = [];
  const usedText = new Set<string>();
  const forbidden: ForbiddenZone[] = [
    // Navbar zone
    { top: 0 + BACKGROUND_UPSHIFT_PERCENT, left: 0, width: 100, height: 18 },
    // Main hero content safe area
    { top: 26 + BACKGROUND_UPSHIFT_PERCENT, left: 20, width: 60, height: 44 },
    // Backed-by belt zone
    { top: 80 + BACKGROUND_UPSHIFT_PERCENT, left: 0, width: 100, height: 20 },
  ];

  const macroTerms = shuffledUnique(coreMath).slice(0, 5);
  for (const generator of macroTerms) {
    const text = generator();
    if (usedText.has(text)) continue;
    const fontSize = `${Math.floor(Math.random() * 34) + 52}px`;
    const pos = placeWithoutOverlap(placed, forbidden, text, fontSize, 280);
    if (!pos) continue;
    usedText.add(text);
    generatedElements.push({
      text,
      top: pos.top,
      left: pos.left,
      fontSize,
      opacity: 0.047,
      fontWeight: "bold",
      zIndex: 1,
      isDynamic: true,
      generator,
    });
  }

  for (const generator of shuffledUnique(coreMath)) {
    const text = generator();
    if (usedText.has(text)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, text, "16px", 320);
    if (!pos) continue;
    usedText.add(text);
    generatedElements.push({
      text,
      top: pos.top,
      left: pos.left,
      fontSize: "16px",
      opacity: 0.67,
      fontWeight: "normal",
      zIndex: 3,
      isDynamic: true,
      generator,
    });
  }

  const cryptoTerms = shuffledUnique([...cryptoGenerators, ...extendedCryptoNoise]).slice(0, 35);
  for (const generator of cryptoTerms) {
    const text = generator();
    if (usedText.has(text)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, text, "11px", 240);
    if (!pos) continue;
    usedText.add(text);
    generatedElements.push({
      text,
      top: pos.top,
      left: pos.left,
      fontSize: "11px",
      opacity: 0.27 + Math.random() * 0.2,
      fontWeight: "normal",
      zIndex: 2,
      isDynamic: true,
      generator,
    });
  }

  const symbolTerms = shuffledUnique(extendedStructuralNoise).slice(0, 55);
  for (const text of symbolTerms) {
    if (usedText.has(text)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, text, "10px", 180);
    if (!pos) continue;
    usedText.add(text);
    generatedElements.push({
      text,
      top: pos.top,
      left: pos.left,
      fontSize: "10px",
      opacity: 0.17 + Math.random() * 0.14,
      fontWeight: "normal",
      zIndex: 2,
      isDynamic: false,
    });
  }

  return generatedElements;
}

export default function BitcoinBackground() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [elements, setElements] = useState<NoiseElement[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const elementsRef = useRef<NoiseElement[]>([]);
  const divRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    elementsRef.current = elements;
    // Update refs array size
    divRefs.current = divRefs.current.slice(0, elements.length);
  }, [elements]);

  useEffect(() => {
    const syncFromViewport = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setElements(generateNoiseElements());
    };
    const frameId = window.requestAnimationFrame(syncFromViewport);

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setElements(generateNoiseElements());
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

    // Update dynamic elements every 0.3 seconds using direct DOM manipulation
    const updateInterval = setInterval(() => {
      elementsRef.current.forEach((el, index) => {
        if (el.isDynamic && el.generator && divRefs.current[index]) {
          divRefs.current[index]!.textContent = el.generator();
        }
      });
    }, 300);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", resetParallax);
    window.addEventListener("blur", resetParallax);
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(frameId);
      clearInterval(updateInterval);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetParallax);
      window.removeEventListener("blur", resetParallax);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const colors = ["rgba(206,76,0,0.86)", "rgba(134,31,65,0.84)"];

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
        transform: `translateY(-${BACKGROUND_UPSHIFT_PERCENT}%)`,
      }}
    >
      {elements.map((el, index) => (
        <div
          key={index}
          ref={(node) => { divRefs.current[index] = node; }}
          style={{
            position: "absolute",
            top: el.top,
            left: el.left,
            whiteSpace: "nowrap",
            fontSize: el.fontSize,
            letterSpacing: "0.05em",
            opacity: el.opacity,
            fontWeight: el.fontWeight,
            zIndex: el.zIndex,
            color: colors[index % colors.length],
            pointerEvents: "none",
            userSelect: "none",
            transform: `translate(${(parallax.x * (2.4 + el.zIndex * 2.7)).toFixed(2)}px, ${(parallax.y * (2.4 + el.zIndex * 2.7)).toFixed(2)}px)`,
            transition: "transform 120ms ease-out",
            willChange: "transform",
          }}
        >
          {el.text}
        </div>
      ))}
    </div>
  );
}
