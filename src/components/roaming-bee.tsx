"use client";

import { useEffect, useRef } from "react";

/*
  An idle cameo. Every ~10 minutes an engraved bee flies in along a randomized,
  wandering path, lands near a corner or edge, rests with a little bob, then
  buzzes off-screen. Purely decorative: pointer-events are off so it never
  blocks the page, and the whole thing is skipped under prefers-reduced-motion.
*/

const BW = 64;
const BH = 40;

type Pt = { x: number; y: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function offscreen(vw: number, vh: number): Pt {
  switch (pick(["top", "bottom", "left", "right"])) {
    case "top":
      return { x: rand(60, vw - 60), y: -70 };
    case "bottom":
      return { x: rand(60, vw - 60), y: vh + 70 };
    case "left":
      return { x: -70, y: rand(60, vh - 60) };
    default:
      return { x: vw + 70, y: rand(60, vh - 60) };
  }
}

function restSpot(vw: number, vh: number): Pt {
  return pick([
    { x: 36, y: vh - 100 },
    { x: vw - 80, y: vh - 120 },
    { x: vw - 86, y: 104 },
    { x: 52, y: 128 },
    { x: vw * 0.5, y: 96 },
    { x: vw - 96, y: vh * 0.5 },
  ]);
}

const heading = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

function tf(p: Pt, rot: number) {
  // bee art faces right; flip vertically when heading left so it stays belly-down
  const flip = Math.cos((rot * Math.PI) / 180) < 0 ? -1 : 1;
  return `translate(${p.x - BW / 2}px, ${p.y - BH / 2}px) rotate(${rot}deg) scale(1, ${flip})`;
}

function pathFrames(pts: Pt[], fadeIn: boolean, fadeOut: boolean): Keyframe[] {
  const last = pts.length - 1;
  return pts.map((p, i) => {
    const next = pts[Math.min(i + 1, last)];
    let opacity = 1;
    if (fadeIn && i === 0) opacity = 0;
    if (fadeOut && i === last) opacity = 0;
    return {
      transform: tf(p, heading(p, next)),
      opacity,
      offset: i / last,
    } as Keyframe;
  });
}

export function RoamingBee() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function flyOnce() {
      const el = ref.current;
      if (!el) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const entry = offscreen(vw, vh);
      const land = restSpot(vw, vh);
      const wander: Pt[] = [
        { x: rand(vw * 0.2, vw * 0.8), y: rand(vh * 0.18, vh * 0.7) },
        { x: rand(vw * 0.2, vw * 0.8), y: rand(vh * 0.18, vh * 0.7) },
      ];

      el.style.opacity = "1";
      await el.animate(pathFrames([entry, ...wander, land], true, false), {
        duration: rand(4000, 5400),
        easing: "ease-in-out",
        fill: "forwards",
      }).finished;

      // rest with a gentle bob
      await el.animate(
        [
          { transform: tf(land, 0) },
          { transform: tf({ x: land.x, y: land.y - 3 }, 0) },
          { transform: tf(land, 0) },
        ],
        { duration: 1500, iterations: Math.round(rand(2, 4)), easing: "ease-in-out", fill: "forwards" },
      ).finished;

      // buzz away
      const exit = offscreen(vw, vh);
      await el.animate(
        pathFrames([land, { x: rand(vw * 0.2, vw * 0.8), y: rand(vh * 0.15, vh * 0.7) }, exit], false, true),
        { duration: rand(2600, 3400), easing: "ease-in", fill: "forwards" },
      ).finished;

      el.style.opacity = "0";
    }

    const run = async () => {
      if (cancelled) return;
      try {
        await flyOnce();
      } catch {
        /* animation cancelled on unmount */
      }
      if (cancelled) return;
      timer = setTimeout(run, rand(8 * 60_000, 12 * 60_000));
    };

    // first appearance soon enough to be noticed, then ~every 10 min
    timer = setTimeout(run, rand(18_000, 45_000));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="roaming-bee" aria-hidden>
      <svg width={BW} height={BH} viewBox="0 0 64 40" fill="none">
        {/* abdomen + stripes */}
        <ellipse cx="25" cy="23" rx="17" ry="10.5" fill="#caa24a" stroke="var(--ink)" strokeWidth="1.4" />
        <g stroke="var(--ink)" strokeWidth="1.4">
          <line x1="17" y1="15" x2="15" y2="31" />
          <line x1="24" y1="13.5" x2="23" y2="32.5" />
          <line x1="31" y1="14" x2="31" y2="32" />
        </g>
        {/* stinger */}
        <path d="M8,23 L2,23" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
        {/* head + eye + antennae */}
        <circle cx="46" cy="23" r="7" fill="#2a2620" stroke="var(--ink)" strokeWidth="1.2" />
        <circle cx="48" cy="21" r="1.6" fill="#efe7d3" />
        <path d="M50,18 C55,12 58,11 60,9" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M50,21 C56,18 59,18 62,17" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
        {/* legs */}
        <g stroke="var(--ink)" strokeWidth="1" strokeLinecap="round">
          <path d="M22,32 l-3,6" />
          <path d="M28,33 l1,6" />
          <path d="M34,32 l4,6" />
        </g>
        {/* wings (flutter) */}
        <g className="rb-wings">
          <ellipse className="rb-wing" cx="30" cy="9" rx="13" ry="7" fill="#fbf5e6" fillOpacity="0.78" stroke="var(--ink)" strokeWidth="1" />
          <ellipse className="rb-wing rb-wing-2" cx="22" cy="11" rx="10" ry="6" fill="#fbf5e6" fillOpacity="0.68" stroke="var(--ink)" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
