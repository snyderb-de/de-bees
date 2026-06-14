"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Keeper } from "@/lib/keepers";

/*
  A cozy diorama of Delaware — a thick, recognizable Delaware "tile" seen
  slightly from the front. The state is drawn UPRIGHT (north up) so it always
  reads as Delaware; depth comes from extruding the silhouette down-and-right
  with layered earth strata (soil → rock) plus a soft cast shadow. The bay sits
  to the east and hugs the real coastline (land is painted over the water).
  Grass top, a few trees/daisies/ponds, fluffy clouds.

  Pan + zoom drive the SVG viewBox (crisp at any scale). Level-of-detail keeps
  the overview calm; zooming in adds detail. Text counter-scales so labels stay
  a constant on-screen size. Hover is pure CSS.
*/

const BASE = { x: 0, y: 0, w: 440, h: 560 };
const ASPECT = BASE.h / BASE.w;
const MAX_ZOOM = 5;
const MIN_W = BASE.w / MAX_ZOOM;
const DETAIL_AT = 1.5;
const LABELS_AT = 2.4;

// extrusion (depth toward lower-right) + strata
const EX = 3;
const EY = 6;
const NLAYERS = 6;
// deep rock → soils → grass cap (shallowest, just under the top face)
const STRATA = ["#6e665a", "#7c7468", "#8a6a3e", "#8f6f3a", "#7a5a30", "#5f8730"];

type View = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

// drawing space == viewBox space (no projection)
const COUNTY_BANDS: Record<string, { x0: number; x1: number; y0: number; y1: number }> = {
  "New Castle": { x0: 106, x1: 198, y0: 150, y1: 298 },
  Kent: { x0: 108, x1: 240, y0: 306, y1: 402 },
  Sussex: { x0: 114, x1: 246, y0: 416, y1: 508 },
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
      const jx = ((hv % 100) / 100 - 0.5) * cellW * 0.4;
      const jy = (((hv >>> 8) % 100) / 100 - 0.5) * cellH * 0.4;
      out.set(k.slug, { x: band.x0 + (c + 0.5) * cellW + jx, y: band.y0 + (r + 0.5) * cellH + jy });
    });
  }
  return out;
}

// Delaware, upright. Straight Mason–Dixon west, flat Transpeninsular south, a
// near-straight Atlantic coast bending into the concave Delaware Bay, narrowing
// up the river to the Twelve-Mile Circle arc.
const STATE_PATH =
  "M96,150 L96,512 Q96,520 104,520 L244,520 Q252,520 252,512 C256,442 259,382 258,358 C248,302 222,252 206,208 C204,194 203,184 204,180 C180,118 136,116 96,150 Z";
const ARC_PATH = "M204,180 C180,118 136,116 96,150";

const TREES: Array<{ x: number; y: number; kind: "round" | "pine" }> = [
  { x: 120, y: 180, kind: "pine" }, { x: 168, y: 230, kind: "round" },
  { x: 130, y: 340, kind: "round" }, { x: 210, y: 330, kind: "pine" },
  { x: 124, y: 440, kind: "pine" }, { x: 196, y: 452, kind: "round" },
  { x: 150, y: 500, kind: "pine" }, { x: 178, y: 392, kind: "round" },
];

export const FLOWERS: Array<{ id: string; x: number; y: number }> = [
  { id: "nc-piedmont", x: 140, y: 210 },
  { id: "kent-fields", x: 196, y: 360 },
  { id: "kent-marsh", x: 138, y: 372 },
  { id: "sussex-poplar", x: 150, y: 466 },
  { id: "sussex-coast", x: 214, y: 480 },
];

const DAISIES: Array<{ x: number; y: number }> = [
  { x: 134, y: 240 }, { x: 176, y: 200 }, { x: 150, y: 300 }, { x: 200, y: 300 },
  { x: 126, y: 410 }, { x: 168, y: 430 }, { x: 210, y: 440 }, { x: 144, y: 490 },
  { x: 188, y: 500 }, { x: 158, y: 350 },
];

const PONDS: Array<{ x: number; y: number; rx: number; ry: number }> = [
  { x: 158, y: 356, rx: 11, ry: 6 },
  { x: 196, y: 498, rx: 9, ry: 5 },
];

const FIELDS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 176, y: 470, w: 30, h: 20 },
  { x: 196, y: 326, w: 26, h: 16 },
];

const TOWNS: Array<{ name: string; x: number; y: number }> = [
  { name: "Wilmington", x: 138, y: 150 },
  { name: "Dover", x: 150, y: 326 },
  { name: "Georgetown", x: 152, y: 468 },
  { name: "Lewes", x: 246, y: 402 },
];

const COUNTY_LABELS: Array<{ name: string; x: number; y: number }> = [
  { name: "New Castle", x: 138, y: 214 },
  { name: "Kent", x: 150, y: 360 },
  { name: "Sussex", x: 156, y: 482 },
];

const CLOUDS: Array<{ x: number; y: number; s: number }> = [
  { x: 70, y: 84, s: 0.9 },
  { x: 350, y: 70, s: 1.1 },
  { x: 300, y: 150, s: 0.8 },
];

const PEBBLES: Array<{ x: number; y: number; r: number }> = [
  { x: 84, y: 470, r: 4.5 }, { x: 70, y: 430, r: 3 }, { x: 300, y: 520, r: 5 },
  { x: 330, y: 488, r: 3.2 }, { x: 120, y: 545, r: 4 },
];

const COUNTY_SWATCH: Record<string, string> = {
  "New Castle": "#8fae57",
  Kent: "#9bb863",
  Sussex: "#86a64f",
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
  focus?: boolean;
}) {
  const placed = placeByCounty(keepers);

  const initial = (): View => {
    if (focus && keepers[0]) {
      const p = placed.get(keepers[0].slug);
      if (p) {
        const w = BASE.w / 2.6;
        const h = w * ASPECT;
        return { x: clamp(p.x - w / 2, 0, BASE.w - w), y: clamp(p.y - h / 2 - 10, 0, BASE.h - h), w, h };
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
  const ls = view.w / BASE.w;
  const showDetail = z >= DETAIL_AT;
  const showAmbient = z < DETAIL_AT;

  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const el = svgRef.current!;
    const r = el.getBoundingClientRect();
    const v = viewRef.current;
    return { x: v.x + ((clientX - r.left) / r.width) * v.w, y: v.y + ((clientY - r.top) / r.height) * v.h };
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
    setView((v) => ({
      ...v,
      x: clamp(v.x - (dxClient / r.width) * v.w, 0, BASE.w - v.w),
      y: clamp(v.y - (dyClient / r.height) * v.h, 0, BASE.h - v.h),
    }));
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
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
          aria-label="Map of Delaware's beekeepers by county"
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
            <radialGradient id="grass" cx="0.4" cy="0.28" r="1">
              <stop offset="0" stopColor="#a9c86a" />
              <stop offset="0.6" stopColor="#86ac52" />
              <stop offset="1" stopColor="#688c3c" />
            </radialGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#90c2d4" />
              <stop offset="1" stopColor="#5e96af" />
            </linearGradient>
            <radialGradient id="sky" cx="0.5" cy="0.05" r="1.1">
              <stop offset="0" stopColor="#dbe8ec" />
              <stop offset="1" stopColor="#eef0e6" />
            </radialGradient>
            <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <clipPath id="state-clip">
              <path d={STATE_PATH} />
            </clipPath>
          </defs>

          <rect x="-300" y="-300" width="1100" height="1200" fill="url(#sky)" />

          {/* sea hugging the east coast (land is painted over it) */}
          <g>
            <path d="M196,158 L432,158 L432,520 L196,520 Z" fill="url(#water)" opacity="0.95" />
            <g stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.6" fill="none">
              <path d="M312,250 q12,-6 24,0 t24,0" />
              <path d="M326,320 q12,-6 24,0 t24,0" />
              <path d="M332,396 q12,-6 24,0 t24,0" />
            </g>
            <g transform={`translate(360,300) scale(${ls})`}>
              <text textAnchor="middle" className="dmap-water">DELAWARE BAY</text>
            </g>
          </g>

          {/* cast shadow */}
          <g transform={`translate(${EX * NLAYERS + 8},${EY * NLAYERS + 10})`}>
            <path d={STATE_PATH} fill="rgba(40,44,30,0.26)" filter="url(#soft)" />
          </g>

          {/* extruded strata sides (deep → shallow), offset down-right */}
          {Array.from({ length: NLAYERS }).map((_, idx) => {
            const k = NLAYERS - idx; // N..1
            return (
              <g key={idx} transform={`translate(${EX * k},${EY * k})`}>
                <path d={STATE_PATH} fill={STRATA[idx]} stroke="#4a3618" strokeWidth="0.6" strokeLinejoin="round" />
              </g>
            );
          })}

          {/* top face */}
          <path d={STATE_PATH} fill="url(#grass)" stroke="#3f5c25" strokeWidth="1.6" strokeLinejoin="round" />
          <g clipPath="url(#state-clip)">
            {/* sun highlight (top-left) + soft inner-shadow rim = domed grass */}
            <ellipse cx="138" cy="208" rx="120" ry="160" fill="#c4dd86" opacity="0.3" />
            <path d={STATE_PATH} fill="none" stroke="#2f4a1c" strokeWidth="16" opacity="0.22" filter="url(#soft)" />
            <g fill="#5f8638" opacity="0.16">
              <ellipse cx="150" cy="220" rx="46" ry="30" />
              <ellipse cx="170" cy="360" rx="44" ry="26" />
              <ellipse cx="165" cy="480" rx="46" ry="26" />
            </g>
            {showDetail &&
              FIELDS.map((f, i) => (
                <g key={i}>
                  <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#c9b46b" stroke="#9c8748" strokeWidth="0.6" />
                  {Array.from({ length: Math.floor(f.h / 4) }).map((_, r) => (
                    <line key={r} x1={f.x} y1={f.y + 3 + r * 4} x2={f.x + f.w} y2={f.y + 3 + r * 4} stroke="#9c8748" strokeWidth="0.4" opacity="0.7" />
                  ))}
                </g>
              ))}
            {PONDS.map((p, i) => (
              <g key={i}>
                <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="url(#water)" stroke="#4f86a0" strokeWidth="0.8" />
                <ellipse cx={p.x - p.rx * 0.3} cy={p.y - p.ry * 0.3} rx={p.rx * 0.4} ry={p.ry * 0.3} fill="#fff" opacity="0.35" />
              </g>
            ))}
            <g stroke="#7fb0c4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8">
              <path d="M150,420 C140,460 122,500 112,520" />
              <path d="M170,300 C178,332 168,360 154,372" />
            </g>
            <g stroke="#3f5c25" strokeWidth="1" strokeDasharray="3 5" opacity="0.5">
              <path d="M96,300 L256,300" />
              <path d="M96,408 L240,408" />
            </g>
          </g>
          <path d={ARC_PATH} fill="none" stroke="#bce08a" strokeWidth="1.6" opacity="0.75" />
          <path d="M96,156 L96,420" fill="none" stroke="#bce08a" strokeWidth="1.4" opacity="0.5" />

          {/* clouds + pebbles in the calm overview */}
          {showAmbient && CLOUDS.map((c, i) => <Cloud key={i} x={c.x} y={c.y} s={c.s} i={i} />)}
          {showAmbient &&
            PEBBLES.map((p, i) => (
              <g key={i}>
                <ellipse cx={p.x} cy={p.y + p.r * 0.5} rx={p.r * 1.2} ry={p.r * 0.4} fill="rgba(40,44,30,0.18)" />
                <ellipse cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.8} fill="#b4ae9f" stroke="#8f8979" strokeWidth="0.5" />
              </g>
            ))}

          {/* surface sprites */}
          <g>
            {items.map((it) => {
              if (it.kind === "tree") return showDetail ? <Tree key={it.key} x={it.fx} y={it.fy} variant={it.treeKind!} /> : null;
              if (it.kind === "daisy") return showDetail ? <Daisy key={it.key} x={it.fx} y={it.fy} /> : null;
              if (it.kind === "flower") return showDetail ? <Flower key={it.key} x={it.fx} y={it.fy} id={it.id!} seed={it.seed!} /> : null;
              if (it.kind === "town") return showDetail ? <Town key={it.key} x={it.fx} y={it.fy} name={it.name!} ls={ls} /> : null;
              return <Hive key={it.key} x={it.fx} y={it.fy} keeper={it.data!} ls={ls} />;
            })}
          </g>

          {/* county labels — always shown, constant size */}
          {COUNTY_LABELS.map((c) => (
            <g key={c.name} transform={`translate(${c.x},${c.y}) scale(${ls})`} style={{ pointerEvents: "none" }}>
              <text textAnchor="middle" className="dmap-county-label">{c.name.toUpperCase()}</text>
            </g>
          ))}

          {/* compass */}
          <g transform={`translate(46,80) scale(${ls})`} className="dmap-compass">
            <circle r="18" fill="rgba(255,255,255,0.6)" stroke="var(--rule)" />
            <path d="M0,-13 L4,3 L0,-1 L-4,3 Z" fill="var(--oxblood)" stroke="none" />
            <text x="0" y="-21" textAnchor="middle" className="dmap-compass-n">N</text>
          </g>
        </svg>

        <div className="dmap-zoom" aria-hidden>
          <button type="button" onClick={() => zoomAround(view.x + view.w / 2, view.y + view.h / 2, 0.7)} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomAround(view.x + view.w / 2, view.y + view.h / 2, 1.43)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setView({ ...BASE })} aria-label="Reset view" className="dmap-zoom-reset">⌂</button>
        </div>

        <div className="dmap-ts dmap-ts-top" aria-hidden />
        <div className="dmap-ts dmap-ts-bottom" aria-hidden />
        <span className="dmap-hint" aria-hidden>scroll to zoom · drag to pan</span>
      </div>

      {caption && (
        <figcaption className="dmap-legend">
          <span className="mono dmap-legend-fig">Fig. 1</span>
          <span className="dmap-legend-keys">
            {(["New Castle", "Kent", "Sussex"] as const).map((c) => (
              <span key={c} className="dmap-key">
                <span className="dmap-swatch" style={{ background: COUNTY_SWATCH[c] }} />
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
  kind: "tree" | "daisy" | "flower" | "town" | "hive";
  fx: number;
  fy: number;
  id?: string;
  seed?: number;
  name?: string;
  treeKind?: "round" | "pine";
  data?: Keeper;
}

function buildItems(keepers: Keeper[], placed: Map<string, { x: number; y: number }>): RenderItem[] {
  const items: RenderItem[] = [
    ...TREES.map((t, i) => ({ key: `t${i}`, kind: "tree" as const, fx: t.x, fy: t.y, treeKind: t.kind })),
    ...DAISIES.map((d, i) => ({ key: `d${i}`, kind: "daisy" as const, fx: d.x, fy: d.y })),
    ...FLOWERS.map((f, i) => ({ key: f.id, kind: "flower" as const, fx: f.x, fy: f.y, id: f.id, seed: i })),
    ...TOWNS.map((t, i) => ({ key: `w${i}`, kind: "town" as const, fx: t.x, fy: t.y, name: t.name })),
    ...keepers.map((k) => {
      const p = placed.get(k.slug) ?? { x: 170, y: 360 };
      return { key: k.slug, kind: "hive" as const, fx: p.x, fy: p.y, data: k };
    }),
  ];
  return items.sort((a, b) => a.fy - b.fy);
}

function Cloud({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g className="dmap-cloud" style={{ animationDelay: `${i * -7}s` }}>
        <g fill="#9fb0b4" opacity="0.3" transform="translate(2,4)">
          <ellipse cx="0" cy="0" rx="18" ry="10" />
          <ellipse cx="14" cy="2" rx="12" ry="8" />
          <ellipse cx="-13" cy="3" rx="11" ry="7" />
        </g>
        <g fill="#fcfdff">
          <ellipse cx="0" cy="0" rx="18" ry="10" />
          <ellipse cx="14" cy="2" rx="12" ry="8" />
          <ellipse cx="-13" cy="3" rx="11" ry="7" />
          <ellipse cx="3" cy="-5" rx="11" ry="8" />
        </g>
      </g>
    </g>
  );
}

function Tree({ x, y, variant }: { x: number; y: number; variant: "round" | "pine" }) {
  if (variant === "pine") {
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="1" rx="7" ry="2.2" fill="rgba(40,44,30,0.18)" />
        <line x1="0" y1="0" x2="0" y2="-6" stroke="#6b4a2c" strokeWidth="1.8" />
        <g stroke="#2f5326" strokeWidth="0.5">
          <path d="M-8,-6 L0,-22 L8,-6 Z" fill="#4f7a3e" />
          <path d="M-6,-13 L0,-26 L6,-13 Z" fill="#5a8a46" />
          <path d="M-4,-19 L0,-29 L4,-19 Z" fill="#659a4e" />
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="1" rx="8" ry="2.4" fill="rgba(40,44,30,0.18)" />
      <line x1="0" y1="0" x2="0" y2="-7" stroke="#6b4a2c" strokeWidth="1.8" />
      <g stroke="#3f6b30" strokeWidth="0.5">
        <circle cx="0" cy="-17" r="10" fill="#5d8c39" />
        <circle cx="-4" cy="-19" r="6" fill="#6fa047" />
        <circle cx="4" cy="-20" r="5" fill="#7cae52" />
      </g>
    </g>
  );
}

function Daisy({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g fill="#fbfdff">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-2.6" rx="1.1" ry="2.2" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle cx="0" cy="0" r="1.4" fill="#f1c33c" />
    </g>
  );
}

function Flower({ x, y, id, seed }: { x: number; y: number; id: string; seed: number }) {
  const tops = ["#e0a82e", "#c8861e", "#a87fc0", "#f0e3c4"];
  const stems = [-5, 0, 5].map((dx, i) => ({ dx, h: 8 + ((seed + i) % 3) * 2, c: tops[(seed + i) % tops.length] }));
  return (
    <g transform={`translate(${x},${y})`} data-flower={id}>
      <ellipse cx="0" cy="1" rx="7" ry="2.2" fill="rgba(40,44,30,0.14)" />
      {stems.map((s, i) => (
        <g key={i}>
          <line x1={s.dx} y1="0" x2={s.dx} y2={-s.h} stroke="#3f6b30" strokeWidth="0.9" />
          <circle cx={s.dx} cy={-s.h} r="2.2" fill={s.c} stroke="#4f3a1f" strokeWidth="0.4" />
        </g>
      ))}
    </g>
  );
}

function Town({ x, y, name, ls }: { x: number; y: number; name: string; ls: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g stroke="#5a4a32" strokeWidth="0.9" fill="#efe7d3">
        <path d="M-8,-2 L-8,-8 L-3.5,-11.5 L1,-8 L1,-2 Z" />
        <path d="M-8,-8 L-3.5,-11.5 L1,-8 Z" fill="#a8451f" />
      </g>
      <g transform={`scale(${ls})`} style={{ pointerEvents: "none" }}>
        <text x="0" y="14" textAnchor="middle" className="dmap-town">{name}</text>
      </g>
    </g>
  );
}

function Hive({ x, y, keeper, ls }: { x: number; y: number; keeper: Keeper; ls: number }) {
  const label = keeper.business ?? keeper.keeper;
  const sub = `${keeper.counties.join(" · ")} · ${keeper.services.cutout ? "swarms + cut-outs" : "swarms"}`;
  return (
    <Link
      href={`/keepers/${keeper.slug}`}
      aria-label={`${label} — ${keeper.counties.join(", ")} County`}
      className="dmap-hive"
    >
      <rect x={x - 12} y={y - 26} width={24} height={32} fill="#000" fillOpacity="0" style={{ pointerEvents: "all" }} />
      <g transform={`translate(${x},${y}) scale(0.6)`} style={{ pointerEvents: "none" }}>
        <g className="dmap-hive-art">
          <ellipse className="dmap-hive-glow" cx="0" cy="2" rx="22" ry="7" fill="var(--honey)" />
          <ellipse cx="0" cy="2" rx="14" ry="4.4" fill="rgba(40,44,30,0.28)" />
          <HiveBox top={-13} h={13} front="#c08a2e" topf="#dcab50" side="#9c6e22" />
          <HiveBox top={-26} h={13} front="#cd9436" topf="#e6b65a" side="#a8772a" />
          <g>
            <polygon points="-15,-26 -7,-31 18,-31 10,-26" fill="#7a5320" stroke="#3a2710" strokeWidth="0.8" />
            <polygon points="10,-26 18,-31 18,-23 10,-18" fill="#5f3f17" stroke="#3a2710" strokeWidth="0.8" />
            <rect x="-15" y="-26" width="25" height="5.5" fill="#6b481b" stroke="#3a2710" strokeWidth="0.8" />
          </g>
          <rect x="-6" y="-3.6" width="13" height="3.2" fill="#3a2710" />
          <line x1="-9" y1="0" x2="9" y2="0" stroke="#7a5320" strokeWidth="1.6" />
        </g>
      </g>
      <g className="dmap-hive-flag" transform={`translate(${x},${y}) scale(${ls})`} style={{ pointerEvents: "none" }}>
        <line x1="0" y1="-28" x2="0" y2="-22" stroke="var(--ink)" strokeWidth="1" />
        <g transform="translate(0,-44)">
          <rect x="-72" y="0" width="144" height="29" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
          <text x="0" y="12" textAnchor="middle" className="dmap-flag-name">{label}</text>
          <text x="0" y="23" textAnchor="middle" className="dmap-flag-sub">{sub}</text>
        </g>
      </g>
    </Link>
  );
}

function HiveBox({ top, h, front, topf, side }: { top: number; h: number; front: string; topf: string; side: string }) {
  return (
    <g stroke="#3a2710" strokeWidth="0.8">
      <polygon points={`-14,${top} -5,${top - 6} 19,${top - 6} 10,${top}`} fill={topf} />
      <rect x="-14" y={top} width="24" height={h} fill={front} />
      <polygon points={`10,${top} 19,${top - 6} 19,${top - 6 + h} 10,${top + h}`} fill={side} />
    </g>
  );
}

function HiveGlyph() {
  return (
    <svg width="16" height="16" viewBox="-14 -32 34 38" aria-hidden style={{ verticalAlign: "-3px" }}>
      <polygon points="-14,-13 -5,-19 19,-19 10,-13" fill="#dcab50" stroke="#3a2710" strokeWidth="0.8" />
      <rect x="-14" y="-13" width="24" height="13" fill="#c08a2e" stroke="#3a2710" strokeWidth="0.8" />
      <rect x="-6" y="-3.6" width="13" height="3.2" fill="#3a2710" />
    </svg>
  );
}
