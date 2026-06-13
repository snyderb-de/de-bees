"use client";

import Link from "next/link";
import { useState } from "react";
import type { Keeper } from "@/lib/keepers";

/*
  A cozy isometric diorama of Delaware.

  Rather than a literal GIS projection, the state is drawn flat (top-down) and
  the whole "board" is tilted back with a single affine matrix so it reads like
  a model on a table. Upright objects (hive boxes, tulip poplars, towns) are
  placed at the SAME projected point via `toScreen`, but drawn standing up so
  they pop off the board. A tilt-shift blur on the near/far edges makes it feel
  miniature. Each apiary is a little Langstroth stack you can click.
*/

// flat coordinate frame for the state silhouette
const TILT = 0.66; // vertical foreshorten
const SKEW = -0.16; // lean
const OX = 168;
const OY = 60;
const THICK = 15; // slab thickness

function toScreen(fx: number, fy: number) {
  return { x: OX + fx + SKEW * fy, y: OY + fy * TILT };
}
function keeperFlat(k: Keeper) {
  return { x: 72 + k.pos.x * 176, y: 112 + k.pos.y * 410 };
}

// the silhouette of Delaware, flat/top-down (Twelve-Mile arc up north,
// straight Mason–Dixon west edge, Transpeninsular line across the south)
const STATE_PATH =
  "M90,120 C88,260 88,420 92,540 L238,540 C250,470 256,398 262,330 C268,298 250,248 236,206 C224,176 214,152 206,134 C184,104 120,96 90,120 Z";

const TREES: Array<{ x: number; y: number }> = [
  { x: 120, y: 150 }, { x: 175, y: 180 }, { x: 110, y: 230 },
  { x: 205, y: 250 }, { x: 130, y: 330 }, { x: 220, y: 350 },
  { x: 100, y: 430 }, { x: 165, y: 420 }, { x: 230, y: 470 },
  { x: 120, y: 500 }, { x: 190, y: 510 }, { x: 150, y: 270 },
];

const TOWNS: Array<{ name: string; x: number; y: number }> = [
  { name: "Wilmington", x: 150, y: 116 },
  { name: "Dover", x: 168, y: 312 },
  { name: "Georgetown", x: 150, y: 470 },
  { name: "Lewes", x: 244, y: 452 },
];

const COUNTY_FILL: Record<string, string> = {
  "New Castle": "#e7dcc0",
  Kent: "#ece1c6",
  Sussex: "#e3d6b6",
};

interface MapItem {
  kind: "tree" | "town" | "hive";
  fy: number;
  data?: Keeper;
  town?: string;
  fx: number;
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
        <svg viewBox="0 0 540 500" className="dmap-svg" role="img" aria-label="Isometric map of Delaware's beekeepers by county">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#bcc6c0" />
              <stop offset="1" stopColor="#a7b3ad" />
            </linearGradient>
          </defs>

          {/* the sea / Delaware Bay sitting to the east + south, behind the slab */}
          <g opacity="0.9">
            <ellipse cx="360" cy="330" rx="150" ry="190" fill="url(#sea)" transform={`matrix(1,0,${SKEW},${TILT},${OX - 168},${OY})`} />
            <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" fill="none" transform={`matrix(1,0,${SKEW},${TILT},${OX - 168},${OY})`}>
              <path d="M300,300 q12,-6 24,0 t24,0" />
              <path d="M320,360 q12,-6 24,0 t24,0" />
              <path d="M340,250 q12,-6 24,0 t24,0" />
            </g>
          </g>

          {/* slab thickness: a darker copy of the state dropped below the top face */}
          <g transform={`translate(${OX},${OY + THICK}) matrix(1,0,${SKEW},${TILT},0,0)`}>
            <path d={STATE_PATH} fill="#c2ab78" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
          </g>

          <SkirtAndGround items={items} active={active} setActive={setActive} />

          {/* compass */}
          <g transform="translate(56,70)" className="dmap-compass">
            <circle r="20" fill="none" stroke="var(--rule)" />
            <path d="M0,-15 L5,3 L0,-2 L-5,3 Z" fill="var(--oxblood)" stroke="none" />
            <text x="0" y="-23" textAnchor="middle" className="dmap-compass-n">N</text>
          </g>

          {/* floating label for the active apiary */}
          {activeKeeper && <ActiveLabel keeper={activeKeeper} />}
        </svg>

        {/* tilt-shift blur bands */}
        <div className="dmap-ts dmap-ts-top" aria-hidden />
        <div className="dmap-ts dmap-ts-bottom" aria-hidden />
        {/* warm centre light */}
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

/* Ground = the state top surface, counties, fields, rivers, then upright sprites. */
function SkirtAndGround({
  items,
  active,
  setActive,
}: {
  items: MapItem[];
  active: string | null;
  setActive: (s: string | null) => void;
}) {
  const board = `translate(${OX},${OY}) matrix(1,0,${SKEW},${TILT},0,0)`;
  return (
    <>
      <g transform={board}>
        <defs>
          <clipPath id="state-clip">
            <path d={STATE_PATH} />
          </clipPath>
        </defs>

        {/* county bands (clipped to the state) */}
        <g clipPath="url(#state-clip)">
          <rect x="80" y="90" width="200" height="162" fill={COUNTY_FILL["New Castle"]} />
          <rect x="80" y="252" width="200" height="144" fill={COUNTY_FILL["Kent"]} />
          <rect x="80" y="396" width="200" height="160" fill={COUNTY_FILL["Sussex"]} />

          {/* field patches */}
          <g opacity="0.5" stroke="var(--sage)" strokeWidth="0.8" fill="var(--sage)" fillOpacity="0.12">
            <rect x="150" y="200" width="40" height="26" />
            <rect x="120" y="360" width="46" height="28" />
            <rect x="180" y="430" width="44" height="30" />
            <rect x="110" y="470" width="38" height="24" />
          </g>

          {/* rivers */}
          <g stroke="#9fb0a8" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8">
            <path d="M150,396 C140,440 120,500 110,540" />
            <path d="M168,252 C176,300 168,340 150,360" />
          </g>

          {/* county dividers */}
          <g stroke="var(--ink-soft)" strokeWidth="1" strokeDasharray="2 4" opacity="0.6">
            <path d="M88,252 L262,252" />
            <path d="M90,396 L252,396" />
          </g>
        </g>

        {/* state outline drawn last so it sits crisp on top */}
        <path d={STATE_PATH} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
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
    </>
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
        {/* glow + shadow */}
        {active && <ellipse cx="0" cy="2" rx="22" ry="7" fill="var(--honey)" opacity="0.35" />}
        <ellipse cx="0" cy="2" rx="15" ry="4.5" fill="rgba(31,46,41,0.22)" />
        {/* two supers + a lid */}
        <HiveBox top={-13} h={13} front="#c08a2e" topf="#dcab50" side="#9c6e22" />
        <HiveBox top={-26} h={13} front="#cd9436" topf="#e6b65a" side="#a8772a" />
        {/* lid */}
        <g>
          <polygon points="-15,-26 -7,-31 17,-31 9,-26" fill="#7a5320" stroke="var(--ink)" strokeWidth="0.8" />
          <polygon points="9,-26 17,-31 17,-23 9,-18" fill="#5f3f17" stroke="var(--ink)" strokeWidth="0.8" />
          <rect x="-15" y="-26" width="24" height="6" fill="#6b481b" stroke="var(--ink)" strokeWidth="0.8" />
        </g>
        {/* entrance + landing board */}
        <rect x="-6" y="-3" width="12" height="3" fill="#3a2710" />
        <line x1="-9" y1="0" x2="9" y2="0" stroke="#7a5320" strokeWidth="1.6" />
        {active && <circle cx="0" cy="-34" r="2" fill="var(--oxblood)" />}
      </g>
    </Link>
  );
}

function HiveBox({ top, h, front, topf, side }: { top: number; h: number; front: string; topf: string; side: string }) {
  return (
    <g stroke="var(--ink)" strokeWidth="0.8">
      <polygon points={`-13,${top} -5,${top - 5} 19,${top - 5} 11,${top}`} fill={topf} />
      <rect x="-13" y={top} width="24" height={h} fill={front} />
      <polygon points={`11,${top} 19,${top - 5} 19,${top - 5 + h} 11,${top + h}`} fill={side} />
    </g>
  );
}

function ActiveLabel({ keeper }: { keeper: Keeper }) {
  const f = keeperFlat(keeper);
  const p = toScreen(f.x, f.y);
  const lx = Math.min(Math.max(p.x, 70), 470);
  return (
    <g transform={`translate(${lx},${p.y - 48})`} className="dmap-flag" pointerEvents="none">
      <line x1="0" y1="2" x2="0" y2="12" stroke="var(--ink)" strokeWidth="1" />
      <g transform="translate(0,-14)">
        <rect x="-72" y="-16" width="144" height="30" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
        <text x="0" y="-2" textAnchor="middle" className="dmap-flag-name">{keeper.apiary}</text>
        <text x="0" y="9" textAnchor="middle" className="dmap-flag-sub">{keeper.town}, {keeper.county} · {keeper.hives} hives</text>
      </g>
    </g>
  );
}

function HiveGlyph() {
  return (
    <svg width="16" height="16" viewBox="-13 -32 32 36" aria-hidden style={{ verticalAlign: "-3px" }}>
      <polygon points="-13,-13 -5,-18 19,-18 11,-13" fill="#dcab50" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-13" y="-13" width="24" height="13" fill="#c08a2e" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-6" y="-3" width="12" height="3" fill="#3a2710" />
    </svg>
  );
}
