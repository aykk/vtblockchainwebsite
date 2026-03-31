"use client";

import { useEffect, useState } from "react";

type NoiseElement = {
  text: string;
  top: string;
  left: string;
  fontSize: string;
  opacity: number;
  fontWeight: "normal" | "bold";
  zIndex: number;
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
  "p = Pr[honest finds next block]",
  "q = Pr[attacker finds next block]",
  "qᶻ = (q/p)ᶻ",
  "λ = z · (q/p)",
  "1 − Σ(k=0→z) ((λᵏ e⁻ˡ) / k!) · (1 − (q/p)ᶻ⁻ᵏ)",
  "P < 10⁻³",
];

const cryptoNoise = [
  "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
  "01101001 01101110 01110000 01110101 01110100",
  "SHA-256(SHA-256(Block_Header))",
  "Merkle Root",
  "TxIn: [Previous_Tx_Hash] [Index] [ScriptSig]",
  "TxOut: [Value] [ScriptPubKey]",
];

const structuralNoise = ["+", "−", "||", "::", "{ }", "[ ]", "Σ", "∫", "⇒", "0x", "11", "π", "Δ"];
const BACKGROUND_UPSHIFT_PERCENT = 6;

const extendedCryptoNoise = [
  ...cryptoNoise,
  "ECDSA(secp256k1)",
  "nBits · target ≤ hash",
  "nonce ∈ [0, 2^32)",
  "block.height + 1",
  "MTP = median(time[11])",
  "TxID = H(H(tx))",
  "UTXO[i] -> spendable",
  "scriptSig || scriptPubKey",
  "nLockTime >= height",
  "difficulty = D_0 · 2^(−n)",
  "merkle = H(left || right)",
  "prevHash || merkleRoot",
  "version | time | bits | nonce",
  "coinbase -> subsidy + fees",
  "satoshis = 10^8",
  "opcodes: DUP HASH160 EQUALVERIFY CHECKSIG",
  "witnessRoot",
  "weight = base*3 + total",
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

function generateNoiseElements() {
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

  const macroTerms = shuffledUnique(coreMath).slice(0, 3);
  for (const text of macroTerms) {
    if (usedText.has(text)) continue;
    const fontSize = `${Math.floor(Math.random() * 34) + 52}px`;
    const pos = placeWithoutOverlap(placed, forbidden, text, fontSize, 220);
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
    });
  }

  for (const mathStr of shuffledUnique(coreMath)) {
    if (usedText.has(mathStr)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, mathStr, "16px", 260);
    if (!pos) continue;
    usedText.add(mathStr);
    generatedElements.push({
      text: mathStr,
      top: pos.top,
      left: pos.left,
      fontSize: "16px",
      opacity: 0.67,
      fontWeight: "normal",
      zIndex: 3,
    });
  }

  const cryptoTerms = shuffledUnique(extendedCryptoNoise).slice(0, 20);
  for (const text of cryptoTerms) {
    if (usedText.has(text)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, text, "11px", 180);
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
    });
  }

  const symbolTerms = shuffledUnique(extendedStructuralNoise).slice(0, 36);
  for (const text of symbolTerms) {
    if (usedText.has(text)) continue;
    const pos = placeWithoutOverlap(placed, forbidden, text, "10px", 120);
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
    });
  }

  return generatedElements;
}

export default function BitcoinBackground() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [elements, setElements] = useState<NoiseElement[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

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
