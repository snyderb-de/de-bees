"use client";

import { useEffect, useRef, useState } from "react";

interface EngravedBeeProps {
  className?: string;
  /** start drawing as soon as it mounts instead of waiting for scroll */
  immediate?: boolean;
  title?: string;
}

/**
 * A dorsal-view honeybee rendered as engraving line-art. On first view the
 * strokes draw themselves in (see `.draw` in globals.css). The right half of
 * the wings, legs, eyes and antennae is the mirror of the left, so the plate
 * stays perfectly symmetrical.
 */
export function EngravedBee({ className = "", immediate = false, title = "Apis mellifera" }: EngravedBeeProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (immediate) {
      const t = setTimeout(() => setDrawn(true), 120);
      return () => clearTimeout(t);
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDrawn(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <svg
      ref={ref}
      className={`draw ${drawn ? "is-drawn" : ""} ${className}`}
      viewBox="0 0 400 600"
      role="img"
      aria-label={`Engraving of a honeybee, ${title}`}
      fill="none"
      stroke="var(--ink)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ ["--len" as string]: 1600 }}
    >
      {/* centred body parts ------------------------------------------------ */}
      {/* antennae */}
      <g>
        <path d="M188,58 C172,40 158,28 150,14" />
        <path d="M212,58 C228,40 242,28 250,14" />
        <circle cx="150" cy="13" r="3.2" fill="var(--ink)" stroke="none" />
        <circle cx="250" cy="13" r="3.2" fill="var(--ink)" stroke="none" />
      </g>

      {/* head */}
      <ellipse cx="200" cy="80" rx="40" ry="34" />
      {/* compound eyes (mirrored) */}
      <g>
        <ellipse cx="176" cy="74" rx="11" ry="15" />
        <ellipse cx="224" cy="74" rx="11" ry="15" />
      </g>

      {/* thorax with engraver's hatching */}
      <ellipse cx="200" cy="186" rx="66" ry="60" />
      <g stroke="var(--ink-soft)" strokeWidth={1}>
        <path d="M156,168 C176,176 224,176 244,168" />
        <path d="M150,188 C176,198 224,198 250,188" />
        <path d="M156,208 C176,216 224,216 244,208" />
      </g>

      {/* abdomen — symmetric outline + stripe bands */}
      <path d="M200,248 C146,252 130,300 146,364 C158,422 184,476 200,486 C216,476 242,422 254,364 C270,300 254,252 200,248 Z" />
      <g stroke="var(--ink)" strokeWidth={1.4}>
        <path d="M152,298 Q200,312 248,298" />
        <path d="M150,332 Q200,348 250,332" />
        <path d="M156,368 Q200,384 244,368" />
        <path d="M166,406 Q200,420 234,406" />
        <path d="M180,442 Q200,452 220,442" />
      </g>
      {/* stinger */}
      <path d="M200,486 L200,502" />

      {/* mirrored apparatus: forewing, hindwing, three legs.
          Drawn on the left, the group is duplicated and flipped for the right. */}
      <g>
        <BeeSide />
        <g transform="translate(400,0) scale(-1,1)">
          <BeeSide />
        </g>
      </g>
    </svg>
  );
}

/** The left-hand wings and legs; mirrored by the parent for the right side. */
function BeeSide() {
  return (
    <g>
      {/* forewing */}
      <path d="M182,150 C120,96 56,84 30,118 C16,150 60,196 150,200 C170,200 180,176 182,150 Z" />
      <g stroke="var(--ink-soft)" strokeWidth={0.9}>
        <path d="M168,164 C120,150 78,142 52,138" />
        <path d="M170,178 C128,176 92,178 66,166" />
        <path d="M120,150 C116,166 116,180 122,192" />
        <path d="M86,142 C82,158 82,172 88,184" />
      </g>
      {/* hindwing */}
      <path d="M176,206 C132,188 84,188 66,212 C56,234 96,250 158,242 C170,238 176,222 176,206 Z" />
      <g stroke="var(--ink-soft)" strokeWidth={0.9}>
        <path d="M160,216 C124,210 96,212 78,214" />
        <path d="M120,206 C116,220 118,232 124,238" />
      </g>
      {/* legs */}
      <g>
        <polyline points="170,222 122,244 96,292 86,316" />
        <polyline points="172,250 114,284 90,338 96,366" />
        <polyline points="176,278 124,318 106,366 118,398" />
      </g>
    </g>
  );
}
