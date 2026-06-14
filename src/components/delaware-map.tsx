"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Keeper } from "@/lib/keepers";

/*
  A cozy isometric diorama of Delaware, pan + zoom + level-of-detail.

  The state is drawn flat (top-down) and the whole "board" is tilted back with a
  single affine matrix so it reads like a thick wooden cut-out on a table. Zoom
  and pan are driven by the SVG viewBox, so everything stays crisp vector at any
  scale. Level-of-detail keeps the full-state view uncluttered: trees, flower
  patches, town names and keeper labels only appear as you zoom in.

  Hover is pure CSS, so nothing re-renders or moves under the cursor.
*/

const TILT = 0.62;
const SKEW = -0.2;
const OX = 190;
const OY = 52;
const T = 26;
const SIDE = 8;

const BASE = { x: 0, y: 0, w: 560, h: 500 };
const ASPECT = BASE.h / BASE.w;
const MAX_ZOOM = 5;
const MIN_W = BASE.w / MAX_ZOOM;
const DETAIL_AT = 1.5; // zoom scalar at which trees/flowers/towns appear
const LABELS_AT = 2.6; // zoom scalar at which keeper labels stay shown

type View = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function toScreen(fx: number, fy: number) {
  return { x: OX + fx + SKEW * fy, y: OY + fy * TILT };
}

const COUNTY_BANDS: Record<string, { x0: number; x1: number; y0: number; y1: number }> = {
  "New Castle": { x0: 114, x1: 198, y0: 156, y1: 280 },
  Kent: { x0: 112, x1: 222, y0: 312, y1: 410 },
  Sussex: { x0: 116, x1: 226, y0: 444, y1: 528 },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function placeByCounty(keepers: Keeper[]): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  for (const county of Object.keys(COUNTY_BANDS)) {
    const band = COUNTY_BANDS[county];
    const list = keepers.filter((k) => (k.counties[0] ?? "Kent") === county);
    const n = list.length;
    if (!n) continue;
    const w = band.x1 - band.x0;
    const hgt = band.y1 - band.y0;
    const cols = Math.max(1, Math.round(Math.sqrt((n * w) / hgt)));
    const rows = Math.ceil(n / cols);
    list.forEach((k, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cellW = w / cols;
      const cellH = hgt / rows;
      const hv = hash(k.slug);
      const jx = ((hv % 100) / 100 - 0.5) * cellW * 0.45;
      const jy = (((hv >>> 8) % 100) / 100 - 0.5) * cellH * 0.45;
      out.set(k.slug, { x: band.x0 + (c + 0.5) * cellW + jx, y: band.y0 + (r + 0.5) * cellH + jy });
    });
  }
  return out;
}

const board = `translate(${OX},${OY}) matrix(1,0,${SKEW},${TILT},0,0)`;
const wall = `translate(${OX + SIDE},${OY + T}) matrix(1,0,${SKEW},${TILT},0,0)`;
const shadow = `translate(${OX + SIDE + 10},${OY + T + 16}) matrix(1,0,${SKEW},${TILT},0,0)`;

const STATE_PATH =
  "M96,150 L96,548 L236,548 C239,470 241,408 240,392 C232,352 214,300 200,250 C196,228 195,206 196,190 C172,120 122,118 96,150 Z";
const ARC_PATH = "M196,190 C172,120 122,118 96,150";

const TREES: Array<{ x: number; y: number }> = [
  { x: 124, y: 184 }, { x: 162, y: 224 }, { x: 116, y: 276 },
  { x: 188, y: 286 }, { x: 132, y: 356 }, { x: 206, y: 360 },
  { x: 110, y: 432 }, { x: 172, y: 420 }, { x: 198, y: 470 },
  { x: 130, y: 502 }, { x: 184, y: 512 }, { x: 150, y: 168 },
];

export const FLOWERS: Array<{ id: string; x: number; y: number }> = [
  { id: "nc-piedmont", x: 138, y: 214 },
  { id: "nc-canal", x: 184, y: 252 },
  { id: "kent-marsh", x: 142, y: 344 },
  { id: "kent-fields", x: 208, y: 332 },
  { id: "sussex-poplar", x: 138, y: 472 },
  { id: "sussex-coast", x: 206, y: 498 },
  { id: "sussex-inland", x: 162, y: 516 },
];

const TOWNS: Array<{ name: string; x: number; y: number }> = [
  { name: "Wilmington", x: 150, y: 152 },
  { name: "Dover", x: 168, y: 330 },
  { name: "Georgetown", x: 158, y: 472 },
  { name: "Lewes", x: 230, y: 416 },
];

const COUNTY_FILL: Record<string, string> = {
  "New Castle": "#e8dcbb",
  Kent: "#eee2c4",
  Sussex: "#e4d6b1",
};

export function DelawareMap({
  keepers,
  className = "",
  caption = true,
  focus = false,
}: {
  keepers: Keeper[];
  className?: string;
  caption?: boolean;
  /** open pre-zoomed onto the (single) keeper passed in */
  focus?: boolean;
}) {
  const placed = placeByCounty(keepers);

  const initial = (): View => {
    if (focus && keepers[0]) {
      const p = placed.get(keepers[0].slug);
      if (p) {
        const s = toScreen(p.x, p.y);
        const w = BASE.w / 3;
        const h = w * ASPECT;
        return {
          x: clamp(s.x - w / 2, 0, BASE.w - w),
          y: clamp(s.y - h / 2 - 8, 0, BASE.h - h),
          w,
          h,
        };
      }
    }
    return { ...BASE };
  };

  const [view, setView] = useState<View>(initial);
  const viewRef = useRef(view);
  viewRef.current = view;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist = useRef<number | null>(null);
  const moved = useRef(false);

  const z = BASE.w / view.w;
  const showDetail = z >= DETAIL_AT;

  // viewBox coords for a client point
  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const el = svgRef.current!;
    const r = el.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: v.x + ((clientX - r.left) / r.width) * v.w,
      y: v.y + ((clientY - r.top) / r.height) * v.h,
    };
  }, []);

  const zoomAround = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => {
      const w = clamp(v.w * factor, MIN_W, BASE.w);
      const h = w * ASPECT;
      const ratio = w / v.w;
      let x = cx - (cx - v.x) * ratio;
      let y = cy - (cy - v.y) * ratio;
      x = clamp(x, 0, BASE.w - w);
      y = clamp(y, 0, BASE.h - h);
      return { x, y, w, h };
    });
  }, []);

  // wheel zoom (non-passive so we can preventDefault page scroll)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toViewBox(e.clientX, e.clientY);
      zoomAround(p.x, p.y, e.deltaY < 0 ? 0.86 : 1.16);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [toViewBox, zoomAround]);

  const panBy = useCallback((dxClient: number, dyClient: number) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setView((v) => {
      const x = clamp(v.x - (dxClient / r.width) * v.w, 0, BASE.w - v.w);
      const y = clamp(v.y - (dyClient / r.height) * v.h, 0, BASE.h - v.h);
      return { ...v, x, y };
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2 && pinchDist.current != null) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAround(mid.x, mid.y, pinchDist.current / dist);
      pinchDist.current = dist;
      moved.current = true;
      return;
    }

    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    panBy(dx, dy);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  };

  // suppress link navigation if the gesture was a drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const items = buildItems(keepers, placed);

  return (
    <figure className={`dmap ${className}`}>
      <div className="dmap-stage">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className={`dmap-svg ${z >= LABELS_AT ? "dmap--labels" : ""}`}
          style={{ touchAction: "none", cursor: z > 1.01 ? "grab" : "default" }}
          role="img"
          aria-label="Isometric map of Delaware's beekeepers by county"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
          onDoubleClick={(e) => {
            const p = toViewBox(e.clientX, e.clientY);
            zoomAround(p.x, p.y, 0.6);
          }}
        >
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#aebfc0" />
              <stop offset="1" stopColor="#8fa3a3" />
            </linearGradient>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#cdb079" />
              <stop offset="0.5" stopColor="#a9863f" />
              <stop offset="1" stopColor="#84642a" />
            </linearGradient>
            <radialGradient id="landlight" cx="0.45" cy="0.32" r="0.85">
              <stop offset="0" stopColor="#f3ead0" />
              <stop offset="1" stopColor="#ddcc9f" />
            </radialGradient>
            <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <clipPath id="state-clip">
              <path d={STATE_PATH} />
            </clipPath>
          </defs>

          <g transform={`matrix(1,0,${SKEW},${TILT},${OX - 28},${OY + 12})`} opacity="0.95">
            <ellipse cx="356" cy="344" rx="172" ry="214" fill="url(#sea)" />
            <g stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.5" fill="none">
              <path d="M298,300 q14,-7 28,0 t28,0" />
              <path d="M330,360 q14,-7 28,0 t28,0" />
              <path d="M350,250 q14,-7 28,0 t28,0" />
              <path d="M300,412 q14,-7 28,0 t28,0" />
            </g>
            <text x="312" y="250" className="dmap-water">DELAWARE BAY</text>
          </g>

          <g transform={shadow}>
            <path d={STATE_PATH} fill="rgba(28,30,26,0.26)" filter="url(#soft)" />
          </g>

          <g transform={wall}>
            <path d={STATE_PATH} fill="url(#wall)" stroke="#5f4719" strokeWidth="1.5" strokeLinejoin="round" />
          </g>

          <g transform={board}>
            <path d={STATE_PATH} fill="url(#landlight)" />
            <g clipPath="url(#state-clip)">
              <rect x="78" y="96" width="200" height="208" fill={COUNTY_FILL["New Castle"]} opacity="0.62" />
              <rect x="78" y="304" width="200" height="128" fill={COUNTY_FILL["Kent"]} opacity="0.62" />
              <rect x="78" y="432" width="200" height="130" fill={COUNTY_FILL["Sussex"]} opacity="0.62" />
              <g stroke="#93a7a1" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8">
                <path d="M150,432 C140,470 120,510 110,548" />
                <path d="M172,304 C180,340 168,372 150,392" />
              </g>
              <g stroke="var(--ink-soft)" strokeWidth="1" strokeDasharray="2 4" opacity="0.55">
                <path d="M96,304 L240,304" />
                <path d="M96,432 L214,432" />
              </g>
            </g>
            <path d={STATE_PATH} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
            <path d={ARC_PATH} fill="none" stroke="#fbf3da" strokeWidth="1.4" opacity="0.6" />
          </g>

          <g transform="translate(58,72)" className="dmap-compass">
            <circle r="20" fill="none" stroke="var(--rule)" />
            <path d="M0,-15 L5,3 L0,-2 L-5,3 Z" fill="var(--oxblood)" stroke="none" />
            <text x="0" y="-23" textAnchor="middle" className="dmap-compass-n">N</text>
          </g>

          <g>
            {items.map((it) => {
              const p = toScreen(it.fx, it.fy);
              if (it.kind === "tree") return showDetail ? <Tree key={it.key} x={p.x} y={p.y} /> : null;
              if (it.kind === "flower") return showDetail ? <Flower key={it.key} x={p.x} y={p.y} id={it.id!} seed={it.seed!} /> : null;
              if (it.kind === "town") return showDetail ? <Town key={it.key} x={p.x} y={p.y} name={it.name!} /> : null;
              return <Hive key={it.key} x={p.x} y={p.y} keeper={it.data!} />;
            })}
          </g>
        </svg>

        {/* zoom controls */}
        <div className="dmap-zoom" aria-hidden>
          <button type="button" onClick={() => zoomAround(view.x + view.w / 2, view.y + view.h / 2, 0.7)} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomAround(view.x + view.w / 2, view.y + view.h / 2, 1.43)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setView({ ...BASE })} aria-label="Reset view" className="dmap-zoom-reset">⌂</button>
        </div>

        <div className="dmap-ts dmap-ts-top" aria-hidden />
        <div className="dmap-ts dmap-ts-bottom" aria-hidden />
        <div className="dmap-glow" aria-hidden />
        <span className="dmap-hint" aria-hidden>scroll to zoom · drag to pan</span>
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
              <HiveGlyph /> Apiary — zoom in for detail, tap to visit
            </span>
          </span>
        </figcaption>
      )}
    </figure>
  );
}

interface RenderItem {
  key: string;
  kind: "tree" | "flower" | "town" | "hive";
  fx: number;
  fy: number;
  id?: string;
  seed?: number;
  name?: string;
  data?: Keeper;
}

function buildItems(keepers: Keeper[], placed: Map<string, { x: number; y: number }>): RenderItem[] {
  const items: RenderItem[] = [
    ...TREES.map((t, i) => ({ key: `t${i}`, kind: "tree" as const, fx: t.x, fy: t.y })),
    ...FLOWERS.map((f, i) => ({ key: f.id, kind: "flower" as const, fx: f.x, fy: f.y, id: f.id, seed: i })),
    ...TOWNS.map((t, i) => ({ key: `w${i}`, kind: "town" as const, fx: t.x, fy: t.y, name: t.name })),
    ...keepers.map((k) => {
      const p = placed.get(k.slug) ?? { x: 168, y: 360 };
      return { key: k.slug, kind: "hive" as const, fx: p.x, fy: p.y, data: k };
    }),
  ];
  return items.sort((a, b) => a.fy - b.fy);
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
    </g>
  );
}

function Flower({ x, y, id, seed }: { x: number; y: number; id: string; seed: number }) {
  const tops = ["#dd9e2c", "#c8861e", "#9c7bb0", "#f3ead0"];
  const stems = [-6, -1, 4, 9].map((dx, i) => ({ dx, h: 9 + ((seed + i) % 3) * 2, c: tops[(seed + i) % tops.length] }));
  return (
    <g transform={`translate(${x},${y})`} data-flower={id}>
      <ellipse cx="1" cy="1" rx="9" ry="2.6" fill="rgba(31,46,41,0.12)" />
      {stems.map((s, i) => (
        <g key={i}>
          <line x1={s.dx} y1="0" x2={s.dx} y2={-s.h} stroke="var(--sage)" strokeWidth="1" />
          <circle cx={s.dx} cy={-s.h} r="2.4" fill={s.c} stroke="var(--ink)" strokeWidth="0.5" />
        </g>
      ))}
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

function Hive({ x, y, keeper }: { x: number; y: number; keeper: Keeper }) {
  const label = keeper.business ?? keeper.keeper;
  const sub = `${keeper.counties.join(" · ")} · ${keeper.services.cutout ? "swarms + cut-outs" : "swarms"}`;
  const lx = Math.min(Math.max(x, 80), 480);
  return (
    <Link
      href={`/keepers/${keeper.slug}`}
      aria-label={`${label} — ${keeper.counties.join(", ")} County`}
      className="dmap-hive"
    >
      <rect x={x - 19} y={y - 40} width={38} height={46} fill="#000" fillOpacity="0" style={{ pointerEvents: "all" }} />
      <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
        <g className="dmap-hive-art">
          <ellipse className="dmap-hive-glow" cx="0" cy="2" rx="22" ry="7" fill="var(--honey)" />
          <ellipse cx="0" cy="2" rx="15" ry="4.6" fill="rgba(31,46,41,0.22)" />
          <HiveBox top={-13} h={13} front="#c08a2e" topf="#dcab50" side="#9c6e22" />
          <HiveBox top={-26} h={13} front="#cd9436" topf="#e6b65a" side="#a8772a" />
          <g>
            <polygon points="-15,-26 -7,-31 18,-31 10,-26" fill="#7a5320" stroke="var(--ink)" strokeWidth="0.8" />
            <polygon points="10,-26 18,-31 18,-23 10,-18" fill="#5f3f17" stroke="var(--ink)" strokeWidth="0.8" />
            <rect x="-15" y="-26" width="25" height="5.5" fill="#6b481b" stroke="var(--ink)" strokeWidth="0.8" />
          </g>
          <rect x="-6" y="-3.6" width="13" height="3.2" fill="#3a2710" />
          <line x1="-9" y1="0" x2="9" y2="0" stroke="#7a5320" strokeWidth="1.6" />
        </g>
      </g>
      <g className="dmap-hive-flag" transform={`translate(${lx},${y})`} style={{ pointerEvents: "none" }}>
        <line x1="0" y1="-36" x2="0" y2="-30" stroke="var(--ink)" strokeWidth="1" />
        <g transform="translate(0,-52)">
          <rect x="-74" y="0" width="148" height="30" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
          <text x="0" y="13" textAnchor="middle" className="dmap-flag-name">{label}</text>
          <text x="0" y="24" textAnchor="middle" className="dmap-flag-sub">{sub}</text>
        </g>
      </g>
    </Link>
  );
}

function HiveBox({ top, h, front, topf, side }: { top: number; h: number; front: string; topf: string; side: string }) {
  return (
    <g stroke="var(--ink)" strokeWidth="0.8">
      <polygon points={`-14,${top} -5,${top - 6} 19,${top - 6} 10,${top}`} fill={topf} />
      <rect x="-14" y={top} width="24" height={h} fill={front} />
      <polygon points={`10,${top} 19,${top - 6} 19,${top - 6 + h} 10,${top + h}`} fill={side} />
    </g>
  );
}

function HiveGlyph() {
  return (
    <svg width="16" height="16" viewBox="-14 -32 34 38" aria-hidden style={{ verticalAlign: "-3px" }}>
      <polygon points="-14,-13 -5,-19 19,-19 10,-13" fill="#dcab50" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-14" y="-13" width="24" height="13" fill="#c08a2e" stroke="var(--ink)" strokeWidth="0.8" />
      <rect x="-6" y="-3.6" width="13" height="3.2" fill="#3a2710" />
    </svg>
  );
}
