"use client";

import Link from "next/link";
import { useState } from "react";
import type { Keeper } from "@/lib/keepers";

/*
  A cozy isometric diorama of Delaware.

  The state is drawn flat (top-down) and the whole "board" is tilted back with a
  single affine matrix so it reads like a thick wooden cut-out on a table. The
  slab is extruded — a darker copy dropped down-and-right gives a real front +
  side wall, with a soft cast shadow on the water. Upright objects (hive boxes,
  tulip poplars, towns) are placed at the SAME projected point via `toScreen`
  but drawn standing up. A tilt-shift blur on the near/far bands makes it feel
  miniature. Each apiary is a little Langstroth stack you can click.

  Silhouette cues that read as Delaware: the Twelve-Mile Circle arc across the
  north, the dead-straight Mason–Dixon line down the west, the concave Delaware
  Bay biting into the east, and the flat Transpeninsular line across the south.
*/

const TILT = 0.62; // vertical foreshorten
const SKEW = -0.2; // lean
const OX = 190;
const OY = 52;
const T = 26; // slab thickness (front wall height, screen px)
const SIDE = 8; // slab right-wall offset

function toScreen(fx: number, fy: number) {
  return { x: OX + fx + SKEW * fy, y: OY + fy * TILT };
}
function keeperFlat(k: Keeper) {
  return { x: 104 + k.pos.x * 118, y: 150 + k.pos.y * 385 };
}

const board = `translate(${OX},${OY}) matrix(1,0,${SKEW},${TILT},0,0)`;
const wall = `translate(${OX + SIDE},${OY + T}) matrix(1,0,${SKEW},${TILT},0,0)`;
const shadow = `translate(${OX + SIDE + 10},${OY + T + 16}) matrix(1,0,${SKEW},${TILT},0,0)`;

// Delaware, flat / top-down.
const STATE_PATH =
  "M96,150 L96,545 L232,545 C238,460 244,392 238,330 C230,278 214,232 204,196 C178,120 120,118 96,150 Z";

const TREES: Array<{ x: number; y: number }> = [
  { x: 122, y: 182 }, { x: 158, y: 222 }, { x: 114, y: 272 },
  { x: 196, y: 292 }, { x: 134, y: 352 }, { x: 210, y: 360 },
  { x: 106, y: 430 }, { x: 168, y: 418 }, { x: 200, y: 470 },
  { x: 126, y: 500 }, { x: 182, y: 512 }, { x: 150, y: 250 },
  { x: 150, y: 162 }, { x: 222, y: 500 },
];

const TOWNS: Array<{ name: string; x: number; y: number }> = [
  { name: "Wilmington", x: 150, y: 156 },
  { name: "Dover", x: 166, y: 330 },
  { name: "Georgetown", x: 156, y: 470 },
  { name: "Lewes", x: 228, y: 422 },
];

const COUNTY_FILL: Record<string, string> = {
  "New Castle": "#e7dcc0",
  Kent: "#ece1c6",
  Sussex: "#e3d6b6",
};

interface MapItem {
  kind: "tree" | "town" | "hive";
  fy: number;
  fx: number;
  data?: Keeper;
  town?: string;
}

export function DelawareMap({
  keepers,
  className = "",
  caption = true,
}: {
  keepers: Keeper[];
  className?: string;
  caption?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);

  const items: MapItem[] = [
    ...TREES.map((t) => ({ kind: "tree" as const, fx: t.x, fy: t.y })),
    ...TOWNS.map((t) => ({ kind: "town" as const, fx: t.x, fy: t.y, town: t.name })),
    ...keepers.map((k) => {
      const f = keeperFlat(k);
      return { kind: "hive" as const, fx: f.x, fy: f.y, data: k };
    }),
  ].sort((a, b) => a.fy - b.fy); // painter's order: north (back) first

  const activeKeeper = keepers.find((k) => k.slug === active) ?? null;

  return (
    <figure className={`dmap ${className}`}>
      <div className="dmap-stage">
        <svg viewBox="0 0 560 500" className="dmap-svg" role="img" aria-label="Isometric map of Delaware's beekeepers by county">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b9c5c4" />
              <stop offset="1" stopColor="#9fb0ad" />
            </linearGradient>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9ad74" />
              <stop offset="0.5" stopColor="#a9863f" />
              <stop offset="1" stopColor="#8a6a2c" />
            </linearGradient>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <clipPath id="state-clip">
              <path d={STATE_PATH} />
            </clipPath>
          </defs>

          {/* Sea — Delaware Bay + Atlantic, to the east/south behind the slab */}
          <g transform={`matrix(1,0,${SKEW},${TILT},${OX - 30},${OY + 10})`} opacity="0.95">
            <ellipse cx="360" cy="340" rx="170" ry="210" fill="url(#sea)" />
            <g stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" fill="none">
              <path d="M300,300 q14,-7 28,0 t28,0" />
              <path d="M330,360 q14,-7 28,0 t28,0" />
              <path d="M352,250 q14,-7 28,0 t28,0" />
              <path d="M300,410 q14,-7 28,0 t28,0" />
            </g>
            <text x="318" y="250" className="dmap-water">DELAWARE BAY</text>
          </g>

          {/* Cast shadow of the slab on the water */}
          <g transform={shadow}>
            <path d={STATE_PATH} fill="rgba(31,32,28,0.22)" filter="url(#soft)" />
          </g>

          {/* Slab walls (front + right faces) — a darker copy dropped below */}
          <g transform={wall}>
            <path d={STATE_PATH} fill="url(#wall)" stroke="#5f4719" strokeWidth="1.5" strokeLinejoin="round" />
          </g>

          {/* Top face */}
          <g transform={board}>
            <g clipPath="url(#state-clip)">
              <rect x="78" y="96" width="200" height="206" fill={COUNTY_FILL["New Castle"]} />
              <rect x="78" y="302" width="200" height="130" fill={COUNTY_FILL["Kent"]} />
              <rect x="78" y="432" width="200" height="130" fill={COUNTY_FILL["Sussex"]} />

              {/* field patches */}
              <g opacity="0.5" stroke="var(--sage)" strokeWidth="0.8" fill="var(--sage)" fillOpacity="0.12">
                <rect x="150" y="206" width="40" height="26" />
                <rect x="120" y="362" width="46" height="28" />
                <rect x="176" y="438" width="44" height="30" />
                <rect x="112" y="486" width="38" height="24" />
              </g>

              {/* rivers */}
              <g stroke="#94a8a2" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85">
                <path d="M150,430 C140,470 120,510 110,545" />
                <path d="M170,300 C178,340 168,372 150,392" />
              </g>

              {/* county dividers */}
              <g stroke="var(--ink-soft)" strokeWidth="1" strokeDasharray="2 4" opacity="0.6">
                <path d="M96,302 L240,302" />
                <path d="M96,432 L214,432" />
              </g>
            </g>

            {/* crisp outline + a soft top highlight on the arc */}
            <path d={STATE_PATH} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M204,196 C178,120 120,118 96,150" fill="none" stroke="#fbf3da" strokeWidth="1.4" opacity="0.6" />
          </g>

          {/* compass */}
          <g transform="translate(58,72)" className="dmap-compass">
            <circle r="20" fill="none" stroke="var(--rule)" />
            <path d="M0,-15 L5,3 L0,-2 L-5,3 Z" fill="var(--oxblood)" stroke="none" />
            <text x="0" y="-23" textAnchor="middle" className="dmap-compass-n">N</text>
          </g>

          {/* upright sprites, projected to the board but drawn standing up */}
          <g>
            {items.map((it, i) => {
              const p = toScreen(it.fx, it.fy);
              if (it.kind === "tree") return <Tree key={`t${i}`} x={p.x} y={p.y} />;
              if (it.kind === "town") return <Town key={`w${i}`} x={p.x} y={p.y} name={it.town!} />;
              const k = it.data!;
              return (
                <Hive
                  key={k.slug}
                  x={p.x}
                  y={p.y}
                  keeper={k}
                  active={active === k.slug}
                  onEnter={() => setActive(k.slug)}
                  onLeave={() => setActive(null)}
                />
              );
            })}
          </g>

          {activeKeeper && <ActiveLabel keeper={activeKeeper} />}
        </svg>

        {/* tilt-shift blur bands + warm centre light */}
        <div className="dmap-ts dmap-ts-top" aria-hidden />
        <div className="dmap-ts dmap-ts-bottom" aria-hidden />
        <div className="dmap-glow" aria-hidden />
      </div>

      {caption && (
        <figcaption className="dmap-legend">
          <span className="mono dmap-legend-fig">Fig. 1</span>
          <span className="dmap-legend-keys">
            {(["New Castle", "Kent", "Sussex"] as const).map((c) => (
              <span key={c} className="dmap-key">
                <span className="dmap-swatch" style={{ background: COUNTY_FILL[c] }} />
                {c}
              </span>
            ))}
            <span className="dmap-key">
              <HiveGlyph /> Apiary — tap to visit
            </span>
          </span>
        </figcaption>
      )}
    </figure>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="1" rx="8" ry="2.6" fill="rgba(31,46,41,0.16)" />
      <line x1="0" y1="0" x2="0" y2="-9" stroke="var(--ink)" strokeWidth="1.4" />
      <g fill="var(--sage)" stroke="var(--ink)" strokeWidth="1" fillOpacity="0.92">
        <ellipse cx="0" cy="-20" rx="9" ry="13" />
        <ellipse cx="-5" cy="-13" rx="6" ry="8" />
        <ellipse cx="5" cy="-14" rx="6" ry="8" />
      </g>
      <line x1="-3" y1="-22" x2="3" y2="-16" stroke="var(--ink)" strokeWidth="0.6" opacity="0.5" />
    </g>
  );
}

function Town({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g stroke="var(--ink)" strokeWidth="1" fill="var(--paper)">
        <path d="M-9,-2 L-9,-9 L-4,-13 L1,-9 L1,-2 Z" />
        <path d="M0,-2 L0,-7 L4,-11 L8,-7 L8,-2 Z" />
      </g>
      <text x="0" y="10" textAnchor="middle" className="dmap-town">{name}</text>
    </g>
  );
}

function Hive({
  x,
  y,
  keeper,
  active,
  onEnter,
  onLeave,
}: {
  x: number;
  y: number;
  keeper: Keeper;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <Link
      href={`/keepers/${keeper.slug}`}
      aria-label={`${keeper.apiary}, ${keeper.town} — ${keeper.hives} hives`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="dmap-hive"
    >
      <g transform={`translate(${x},${y}) ${active ? "scale(1.16)" : ""}`} style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" }}>
        {active && <ellipse cx="0" cy="2" rx="24" ry="7.5" fill="var(--honey)" opacity="0.35" />}
        <ellipse cx="0" cy="2" rx="16" ry="5" fill="rgba(31,46,41,0.22)" />
        {/* two supers + a lid */}
        <HiveBox top={-14} h={14} front="#c08a2e" topf="#dcab50" side="#9c6e22" />
        <HiveBox top={-28} h={14} front="#cd9436" topf="#e6b65a" side="#a8772a" />
        {/* gabled lid */}
        <g>
          <polygon points="-16,-28 -7,-34 19,-34 10,-28" fill="#7a5320" stroke="var(--ink)" strokeWidth="0.8" />
          <polygon points="10,-28 19,-34 19,-25 10,-19" fill="#5f3f17" stroke="var(--ink)" strokeWidth="0.8" />
          <rect x="-16" y="-28" width="26" height="6" fill="#6b481b" stroke="var(--ink)" strokeWidth="0.8" />
        </g>
        {/* entrance + landing board */}
        <rect x="-7" y="-4" width="14" height="3.4" fill="#3a2710" />
        <line x1="-10" y1="0" x2="10" y2="0" stroke="#7a5320" strokeWidth="1.8" />
        {active && <circle cx="0" cy="-38" r="2.2" fill="var(--oxblood)" />}
      </g>
    </Link>
  );
}

function HiveBox({ top, h, front, topf, side }: { top: number; h: number; front: string; topf: string; side: string }) {
  return (
    <g stroke="var(--ink)" strokeWidth="0.8">
      <polygon points={`-14,${top} -5,${top - 6} 20,${top - 6} 11,${top}`} fill={topf} />
      <rect x="-14" y={top} width="25" height={h} fill={front} />
      <polygon points={`11,${top} 20,${top - 6} 20,${top - 6 + h} 11,${top + h}`} fill={side} />
    </g>
  );
}

function ActiveLabel({ keeper }: { keeper: Keeper }) {
  const f = keeperFlat(keeper);
  const p = toScreen(f.x, f.y);
  const lx = Math.min(Math.max(p.x, 78), 482);
  return (
    <g transform={`translate(${lx},${p.y - 52})`} className="dmap-flag" pointerEvents="none">
      <line x1="0" y1="2" x2="0" y2="14" stroke="var(--ink)" strokeWidth="1" />
      <g transform="translate(0,-14)">
        <rect x="-74" y="-16" width="148" height="30" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
        <text x="0" y="-2" textAnchor="middle" className="dmap-flag-name">{keeper.apiary}</text>
        <text x="0" y="9" textAnchor="middle" className="dmap-flag-sub">{keeper.town}, {keeper.county} · {keeper.hives} hives</text>
      </g>
    </g>
  );
}

function HiveGlyph() {
  return (
    <svg width="16" height="16" viewBox="-14 -34 34 38" aria-hidden style={{ verticalAlign: "-3px" }}>
      <polygon points="-14,-14 -5,-20 20,-20 11,-14" fill="#dcab50" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-14" y="-14" width="25" height="14" fill="#c08a2e" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-7" y="-4" width="14" height="3.4" fill="#3a2710" />
    </svg>
  );
}
