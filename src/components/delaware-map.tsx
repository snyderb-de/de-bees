"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Keeper } from "@/lib/keepers";

/*
  A cozy isometric DIORAMA of Delaware — a little 3D model sitting on the
  ledger's desk. The state is an extruded land slab: a green grass top with
  layered earth strata (soil → rock) on the cut sides, a soft cast shadow,
  scattered pebbles and fluffy clouds. Trees, daisies, ponds and fields dress
  the surface; each apiary is a little Langstroth hive.

  Pan + zoom are driven by the SVG viewBox so everything stays crisp vector at
  any scale. Level-of-detail keeps the full-state view calm (clouds + hives);
  zooming in reveals trees, daisies, fields, towns and keeper labels. All text
  is counter-scaled by the zoom so labels stay a constant on-screen size.
  Hover is pure CSS — nothing re-renders under the cursor.
*/

const TILT = 0.62;
const SKEW = -0.2;
const OX = 190;
const OY = 50;
const T = 34; // slab thickness
const SIDE = 9;

const BASE = { x: 0, y: 0, w: 560, h: 500 };
const ASPECT = BASE.h / BASE.w;
const MAX_ZOOM = 5;
const MIN_W = BASE.w / MAX_ZOOM;
const DETAIL_AT = 1.5;
const LABELS_AT = 2.4;

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
const shadowT = `translate(${OX + SIDE + 12},${OY + T + 18}) matrix(1,0,${SKEW},${TILT},0,0)`;

const STATE_PATH =
  "M96,150 L96,548 L236,548 C239,470 241,408 240,392 C232,352 214,300 200,250 C196,228 195,206 196,190 C172,120 122,118 96,150 Z";
const ARC_PATH = "M196,190 C172,120 122,118 96,150";

// soil → rock strata for the cut sides, bottom-most first
const STRATA = ["#6f675b", "#7d7468", "#8a6a3e", "#7a5532", "#6b4a2c"];
const STRATA_N = STRATA.length;

const TREES: Array<{ x: number; y: number; kind: "round" | "pine" }> = [
  { x: 124, y: 184, kind: "round" }, { x: 162, y: 224, kind: "pine" },
  { x: 116, y: 276, kind: "pine" }, { x: 188, y: 286, kind: "round" },
  { x: 132, y: 356, kind: "round" }, { x: 206, y: 360, kind: "pine" },
  { x: 110, y: 432, kind: "pine" }, { x: 172, y: 420, kind: "round" },
  { x: 198, y: 470, kind: "pine" }, { x: 130, y: 502, kind: "round" },
  { x: 184, y: 512, kind: "pine" }, { x: 150, y: 168, kind: "round" },
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

const DAISIES: Array<{ x: number; y: number }> = [
  { x: 130, y: 200 }, { x: 170, y: 240 }, { x: 150, y: 300 }, { x: 200, y: 270 },
  { x: 120, y: 330 }, { x: 190, y: 360 }, { x: 160, y: 400 }, { x: 130, y: 460 },
  { x: 200, y: 460 }, { x: 150, y: 500 }, { x: 180, y: 520 }, { x: 120, y: 250 },
  { x: 210, y: 420 }, { x: 145, y: 380 },
];

const PONDS: Array<{ x: number; y: number; rx: number; ry: number }> = [
  { x: 150, y: 360, rx: 13, ry: 7 }, // Silver Lake-ish, Kent
  { x: 188, y: 506, rx: 11, ry: 6 }, // inland bay, Sussex
];

const FIELDS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 168, y: 470, w: 34, h: 22 },
  { x: 196, y: 320, w: 30, h: 20 },
  { x: 132, y: 420, w: 28, h: 18 },
];

const TOWNS: Array<{ name: string; x: number; y: number }> = [
  { name: "Wilmington", x: 150, y: 152 },
  { name: "Dover", x: 168, y: 330 },
  { name: "Georgetown", x: 158, y: 472 },
  { name: "Lewes", x: 230, y: 416 },
];

const COUNTY_LABELS: Array<{ name: string; x: number; y: number }> = [
  { name: "New Castle", x: 150, y: 212 },
  { name: "Kent", x: 165, y: 368 },
  { name: "Sussex", x: 170, y: 492 },
];

const CLOUDS: Array<{ x: number; y: number; s: number }> = [
  { x: 110, y: 70, s: 1 },
  { x: 430, y: 90, s: 1.2 },
  { x: 300, y: 50, s: 0.85 },
  { x: 470, y: 200, s: 0.95 },
];

const PEBBLES: Array<{ x: number; y: number; r: number }> = [
  { x: 120, y: 420, r: 5 }, { x: 150, y: 450, r: 3.4 }, { x: 430, y: 410, r: 5.5 },
  { x: 460, y: 380, r: 3.6 }, { x: 250, y: 458, r: 4.2 }, { x: 95, y: 360, r: 3.2 },
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
        const s = toScreen(p.x, p.y);
        const w = BASE.w / 3;
        const h = w * ASPECT;
        return { x: clamp(s.x - w / 2, 0, BASE.w - w), y: clamp(s.y - h / 2 - 8, 0, BASE.h - h), w, h };
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
  const ls = view.w / BASE.w; // counter-scale for labels (constant on-screen size)
  const showDetail = z >= DETAIL_AT;
  const showAmbient = z < DETAIL_AT; // clouds/pebbles only in the calm overview

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
          aria-label="Isometric diorama map of Delaware's beekeepers by county"
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
            <radialGradient id="grass" cx="0.42" cy="0.3" r="0.95">
              <stop offset="0" stopColor="#a6c766" />
              <stop offset="0.6" stopColor="#85ab50" />
              <stop offset="1" stopColor="#688c3c" />
            </radialGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#8fc0d2" />
              <stop offset="1" stopColor="#5f97b0" />
            </linearGradient>
            <radialGradient id="sky" cx="0.5" cy="0.1" r="1">
              <stop offset="0" stopColor="#d7e6ea" />
              <stop offset="1" stopColor="#eef0e6" />
            </radialGradient>
            <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <clipPath id="state-clip">
              <path d={STATE_PATH} />
            </clipPath>
          </defs>

          {/* sky behind everything */}
          <rect x="-200" y="-200" width="960" height="900" fill="url(#sky)" />

          {/* sea — Delaware Bay + Atlantic */}
          <g transform={`matrix(1,0,${SKEW},${TILT},${OX - 26},${OY + 14})`}>
            <ellipse cx="356" cy="344" rx="174" ry="216" fill="url(#water)" opacity="0.92" />
            <g stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.6" fill="none">
              <path d="M300,300 q14,-7 28,0 t28,0" />
              <path d="M332,360 q14,-7 28,0 t28,0" />
              <path d="M352,250 q14,-7 28,0 t28,0" />
            </g>
          </g>

          {/* cast shadow grounding the slab */}
          <g transform={shadowT}>
            <path d={STATE_PATH} fill="rgba(40,44,30,0.28)" filter="url(#soft)" />
          </g>

          {/* strata sides (soil → rock), stacked copies dropped below the top */}
          {Array.from({ length: STRATA_N }).map((_, k) => {
            const off = (T * (STRATA_N - k)) / STRATA_N;
            const sx = (SIDE * (STRATA_N - k)) / STRATA_N;
            return (
              <g key={k} transform={`translate(${OX + sx},${OY + off}) matrix(1,0,${SKEW},${TILT},0,0)`}>
                <path d={STATE_PATH} fill={STRATA[k]} stroke="#4f3a1f" strokeWidth="0.6" strokeLinejoin="round" />
              </g>
            );
          })}
          {/* grass rim just under the cap */}
          <g transform={`translate(${OX + SIDE * 0.2},${OY + 3}) matrix(1,0,${SKEW},${TILT},0,0)`}>
            <path d={STATE_PATH} fill="#577a32" />
          </g>

          {/* top face: grass + surface detail */}
          <g transform={board}>
            <path d={STATE_PATH} fill="url(#grass)" stroke="#3f5c25" strokeWidth="1.6" strokeLinejoin="round" />
            <g clipPath="url(#state-clip)">
              {/* gentle shading patches for rolling ground */}
              <g fill="#5f8638" opacity="0.18">
                <ellipse cx="150" cy="230" rx="48" ry="30" />
                <ellipse cx="180" cy="360" rx="44" ry="26" />
                <ellipse cx="160" cy="490" rx="50" ry="28" />
              </g>
              {/* fields */}
              {showDetail && (
                <g>
                  {FIELDS.map((f, i) => (
                    <g key={i}>
                      <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#c9b46b" stroke="#9c8748" strokeWidth="0.6" />
                      {Array.from({ length: Math.floor(f.h / 4) }).map((_, r) => (
                        <line key={r} x1={f.x} y1={f.y + 3 + r * 4} x2={f.x + f.w} y2={f.y + 3 + r * 4} stroke="#9c8748" strokeWidth="0.4" opacity="0.7" />
                      ))}
                    </g>
                  ))}
                </g>
              )}
              {/* ponds */}
              {PONDS.map((p, i) => (
                <g key={i}>
                  <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="url(#water)" stroke="#4f86a0" strokeWidth="0.8" />
                  <ellipse cx={p.x - p.rx * 0.3} cy={p.y - p.ry * 0.3} rx={p.rx * 0.4} ry={p.ry * 0.3} fill="#ffffff" opacity="0.35" />
                </g>
              ))}
              {/* rivers */}
              <g stroke="#7fb0c4" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85">
                <path d="M150,432 C140,470 120,510 110,548" />
                <path d="M172,304 C180,340 168,372 152,360" />
              </g>
              {/* county dividers */}
              <g stroke="#3f5c25" strokeWidth="1" strokeDasharray="3 5" opacity="0.5">
                <path d="M96,304 L240,304" />
                <path d="M96,432 L214,432" />
              </g>
            </g>
            <path d={ARC_PATH} fill="none" stroke="#bce08a" strokeWidth="1.4" opacity="0.7" />
          </g>

          {/* clouds (overview only) */}
          {showAmbient && CLOUDS.map((c, i) => <Cloud key={i} x={c.x} y={c.y} s={c.s} i={i} />)}
          {/* pebbles around the base (overview only) */}
          {showAmbient && PEBBLES.map((p, i) => (
            <g key={i}>
              <ellipse cx={p.x} cy={p.y + p.r * 0.5} rx={p.r * 1.2} ry={p.r * 0.4} fill="rgba(40,44,30,0.18)" />
              <ellipse cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.8} fill="#b4ae9f" stroke="#8f8979" strokeWidth="0.5" />
            </g>
          ))}

          {/* surface sprites */}
          <g>
            {items.map((it) => {
              const p = toScreen(it.fx, it.fy);
              if (it.kind === "tree") return showDetail ? <Tree key={it.key} x={p.x} y={p.y} variant={it.treeKind!} /> : null;
              if (it.kind === "daisy") return showDetail ? <Daisy key={it.key} x={p.x} y={p.y} /> : null;
              if (it.kind === "flower") return showDetail ? <Flower key={it.key} x={p.x} y={p.y} id={it.id!} seed={it.seed!} /> : null;
              if (it.kind === "town") return showDetail ? <Town key={it.key} x={p.x} y={p.y} name={it.name!} ls={ls} /> : null;
              return <Hive key={it.key} x={p.x} y={p.y} keeper={it.data!} ls={ls} />;
            })}
          </g>

          {/* county labels — always shown, constant size */}
          {COUNTY_LABELS.map((c) => {
            const p = toScreen(c.x, c.y);
            return (
              <g key={c.name} transform={`translate(${p.x},${p.y}) scale(${ls})`} style={{ pointerEvents: "none" }}>
                <text textAnchor="middle" className="dmap-county-label">{c.name.toUpperCase()}</text>
              </g>
            );
          })}

          {/* compass — constant size */}
          <g transform={`translate(56,70) scale(${ls})`} className="dmap-compass">
            <circle r="20" fill="rgba(255,255,255,0.6)" stroke="var(--rule)" />
            <path d="M0,-15 L5,3 L0,-2 L-5,3 Z" fill="var(--oxblood)" stroke="none" />
            <text x="0" y="-23" textAnchor="middle" className="dmap-compass-n">N</text>
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
      const p = placed.get(k.slug) ?? { x: 168, y: 360 };
      return { key: k.slug, kind: "hive" as const, fx: p.x, fy: p.y, data: k };
    }),
  ];
  return items.sort((a, b) => a.fy - b.fy);
}

function Cloud({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g className="dmap-cloud" style={{ animationDelay: `${i * -7}s` }}>
        <g fill="#9fb0b4" opacity="0.35" transform="translate(2,4)">
          <ellipse cx="0" cy="0" rx="20" ry="11" />
          <ellipse cx="16" cy="2" rx="14" ry="9" />
          <ellipse cx="-15" cy="3" rx="12" ry="8" />
        </g>
        <g fill="#fcfdff">
          <ellipse cx="0" cy="0" rx="20" ry="11" />
          <ellipse cx="16" cy="2" rx="14" ry="9" />
          <ellipse cx="-15" cy="3" rx="12" ry="8" />
          <ellipse cx="4" cy="-6" rx="12" ry="9" />
        </g>
      </g>
    </g>
  );
}

function Tree({ x, y, variant }: { x: number; y: number; variant: "round" | "pine" }) {
  if (variant === "pine") {
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="1" rx="8" ry="2.6" fill="rgba(40,44,30,0.18)" />
        <line x1="0" y1="0" x2="0" y2="-7" stroke="#6b4a2c" strokeWidth="2" />
        <g stroke="#2f5326" strokeWidth="0.6">
          <path d="M-9,-7 L0,-26 L9,-7 Z" fill="#4f7a3e" />
          <path d="M-7,-15 L0,-30 L7,-15 Z" fill="#5a8a46" />
          <path d="M-5,-22 L0,-34 L5,-22 Z" fill="#659a4e" />
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="1" rx="9" ry="2.8" fill="rgba(40,44,30,0.18)" />
      <line x1="0" y1="0" x2="0" y2="-8" stroke="#6b4a2c" strokeWidth="2" />
      <g stroke="#3f6b30" strokeWidth="0.6">
        <circle cx="0" cy="-20" r="12" fill="#5d8c39" />
        <circle cx="-5" cy="-22" r="7" fill="#6fa047" />
        <circle cx="4" cy="-24" r="6" fill="#7cae52" />
      </g>
    </g>
  );
}

function Daisy({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g fill="#fbfdff">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} cx="0" cy="-3" rx="1.3" ry="2.6" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle cx="0" cy="0" r="1.7" fill="#f1c33c" />
    </g>
  );
}

function Flower({ x, y, id, seed }: { x: number; y: number; id: string; seed: number }) {
  const tops = ["#e0a82e", "#c8861e", "#a87fc0", "#f0e3c4"];
  const stems = [-6, -1, 4, 9].map((dx, i) => ({ dx, h: 9 + ((seed + i) % 3) * 2, c: tops[(seed + i) % tops.length] }));
  return (
    <g transform={`translate(${x},${y})`} data-flower={id}>
      <ellipse cx="1" cy="1" rx="9" ry="2.6" fill="rgba(40,44,30,0.14)" />
      {stems.map((s, i) => (
        <g key={i}>
          <line x1={s.dx} y1="0" x2={s.dx} y2={-s.h} stroke="#3f6b30" strokeWidth="1" />
          <circle cx={s.dx} cy={-s.h} r="2.6" fill={s.c} stroke="#4f3a1f" strokeWidth="0.4" />
        </g>
      ))}
    </g>
  );
}

function Town({ x, y, name, ls }: { x: number; y: number; name: string; ls: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g stroke="#5a4a32" strokeWidth="1" fill="#efe7d3">
        <path d="M-9,-2 L-9,-9 L-4,-13 L1,-9 L1,-2 Z" />
        <path d="M0,-2 L0,-7 L4,-11 L8,-7 L8,-2 Z" />
        <path d="M-9,-9 L-4,-13 L1,-9 Z" fill="#a8451f" />
      </g>
      <g transform={`scale(${ls})`} style={{ pointerEvents: "none" }}>
        <text x="0" y="16" textAnchor="middle" className="dmap-town">{name}</text>
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
      <rect x={x - 19} y={y - 40} width={38} height={46} fill="#000" fillOpacity="0" style={{ pointerEvents: "all" }} />
      <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
        <g className="dmap-hive-art">
          <ellipse className="dmap-hive-glow" cx="0" cy="2" rx="22" ry="7" fill="var(--honey)" />
          <ellipse cx="0" cy="2" rx="15" ry="4.6" fill="rgba(40,44,30,0.26)" />
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
        <line x1="0" y1="-36" x2="0" y2="-30" stroke="var(--ink)" strokeWidth="1" />
        <g transform="translate(0,-52)">
          <rect x="-74" y="0" width="148" height="30" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
          <text x="0" y="13" textAnchor="middle" className="dmap-flag-name">{label}</text>
          <text x="0" y="24" textAnchor="middle" className="dmap-flag-sub">{sub}</text>
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
