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
        <defs>
          {/* lit from top-left → rounds the body */}
          <linearGradient id="rb-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4cd76" />
            <stop offset="0.45" stopColor="#e0a838" />
            <stop offset="1" stopColor="#a9761a" />
          </linearGradient>
          <radialGradient id="rb-sheen" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff3d6" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rb-head" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#403a30" />
            <stop offset="1" stopColor="#191610" />
          </linearGradient>
          <linearGradient id="rb-wing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fdf8ec" stopOpacity="0.92" />
            <stop offset="1" stopColor="#dfe7ec" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* soft seat where the wings meet the back → depth */}
        <ellipse cx="27" cy="16" rx="13" ry="5" fill="#6b4a12" opacity="0.25" />

        {/* abdomen: rounded, gradient-lit */}
        <ellipse cx="25" cy="23" rx="17" ry="10.5" fill="url(#rb-body)" stroke="var(--ink)" strokeWidth="1.2" />
        {/* fuzzy fur halo */}
        <ellipse cx="25" cy="22.4" rx="17.6" ry="11.2" fill="none" stroke="#f0d390" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="0.6 2.1" />
        {/* under-belly shadow */}
        <ellipse cx="25" cy="27.5" rx="13.5" ry="4.8" fill="#7a4e0e" opacity="0.34" />
        {/* curved wrap stripes + sheen grooves */}
        <g strokeLinecap="round" fill="none">
          <path d="M16.5,15.5 C15,20 15,26 17.5,30.8" stroke="#41310f" strokeWidth="2.3" />
          <path d="M23,13.6 C22,22 22,27 23.2,32.2" stroke="#41310f" strokeWidth="2.4" />
          <path d="M30,14 C30.2,22 30,27 30.6,32" stroke="#41310f" strokeWidth="2.2" />
          <path d="M18,15.5 C16.6,20 16.6,26 19,30.6" stroke="#f3d488" strokeOpacity="0.5" strokeWidth="0.7" />
          <path d="M24.4,13.7 C23.4,22 23.4,27 24.6,32" stroke="#f3d488" strokeOpacity="0.5" strokeWidth="0.7" />
        </g>
        {/* specular highlight */}
        <ellipse cx="20" cy="18" rx="8.5" ry="3.2" fill="url(#rb-sheen)" transform="rotate(-12 20 18)" />
        {/* stinger */}
        <path d="M8.5,23.5 L2.5,24" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />

        {/* legs */}
        <g stroke="var(--ink)" strokeWidth="1.1" strokeLinecap="round">
          <path d="M22,32 l-3,6" />
          <path d="M28,33 l1,6" />
          <path d="M34,31.5 l4,6.5" />
        </g>

        {/* head: rounded, with a cute catch-lit eye + club antennae */}
        <circle cx="46" cy="23" r="7" fill="url(#rb-head)" stroke="var(--ink)" strokeWidth="1" />
        <circle cx="47.5" cy="22" r="2.5" fill="#f4ecd6" />
        <circle cx="48" cy="22.3" r="1.5" fill="#16130d" />
        <circle cx="48.6" cy="21.6" r="0.6" fill="#ffffff" fillOpacity="0.95" />
        <path d="M50,18 C55,12 58,11 60,9" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M50,21 C56,18 59,18 62,17" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="60" cy="9" r="1.3" fill="#e0a838" stroke="var(--ink)" strokeWidth="0.7" />
        <circle cx="62" cy="17" r="1.2" fill="#e0a838" stroke="var(--ink)" strokeWidth="0.7" />

        {/* wings: gradient + a faint vein, fluttering */}
        <g className="rb-wings">
          <ellipse className="rb-wing" cx="30" cy="9" rx="13" ry="7" fill="url(#rb-wing)" stroke="var(--ink)" strokeWidth="0.9" />
          <path className="rb-wing" d="M21,9 C25,5.8 33,5.8 40,8.2" stroke="#cdd6dd" strokeOpacity="0.7" strokeWidth="0.5" fill="none" strokeLinecap="round" />
          <ellipse className="rb-wing rb-wing-2" cx="22" cy="11" rx="10" ry="6" fill="url(#rb-wing)" stroke="var(--ink)" strokeWidth="0.9" />
        </g>
      </svg>
    </div>
  );
}
