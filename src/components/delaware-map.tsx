"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { County, Keeper } from "@/lib/keepers";

/*
  A normal slippy map (Leaflet + CARTO Positron tiles — free, no API key) with
  custom hive-box markers. The state lists are county-level, so each keeper is
  pinned at its primary county's centroid with a small deterministic jitter so
  pins fan out instead of stacking. Hover shows the apiary; click opens its
  plate. `focus` centres on a single keeper for profile pages.
*/

const CENTROIDS: Record<County, [number, number]> = {
  "New Castle": [39.57, -75.63],
  Kent: [39.1, -75.5],
  Sussex: [38.69, -75.36],
};
const DE_BOUNDS: [[number, number], [number, number]] = [
  [38.42, -75.8],
  [39.86, -75.04],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function coordsFor(k: Keeper): [number, number] {
  const [lat, lng] = CENTROIDS[k.counties[0]] ?? CENTROIDS.Kent;
  const h = hash(k.slug);
  const jLat = ((h % 1000) / 1000 - 0.5) * 0.26;
  const jLng = (((h >>> 10) % 1000) / 1000 - 0.5) * 0.26;
  return [lat + jLat, lng + jLng];
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}

const HIVE_HTML = `<svg width="34" height="38" viewBox="0 0 34 38" aria-hidden>
  <ellipse cx="17" cy="34" rx="9" ry="2.8" fill="rgba(31,32,28,0.28)"/>
  <g stroke="#3a2710" stroke-width="1" stroke-linejoin="round">
    <polygon points="4,21 8,17 30,17 26,21" fill="#dcab50"/>
    <rect x="4" y="21" width="22" height="11" fill="#c08a2e"/>
    <polygon points="26,21 30,17 30,28 26,32" fill="#9c6e22"/>
    <polygon points="2,15 7,11 32,11 27,15" fill="#7a5320"/>
    <rect x="2" y="15" width="25" height="4" fill="#6b481b"/>
    <polygon points="27,15 32,11 32,15 27,19" fill="#5f3f17"/>
  </g>
  <rect x="12" y="28" width="8" height="3" fill="#3a2710"/>
</svg>`;

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
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;

      const map = L.map(ref.current, { scrollWheelZoom: true, attributionControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: "hive-pin",
        html: HIVE_HTML,
        iconSize: [34, 38],
        iconAnchor: [17, 32],
        tooltipAnchor: [0, -28],
      });

      for (const k of keepers) {
        const m = L.marker(coordsFor(k), { icon, title: k.business ?? k.keeper, keyboard: true }).addTo(map);
        m.bindTooltip(
          `<strong>${esc(k.business ?? k.keeper)}</strong><br>${esc(k.counties.join(" · "))} · ${
            k.services.cutout ? "swarms + cut-outs" : "swarms"
          }`,
          { direction: "top", className: "hive-tip", opacity: 1 },
        );
        m.on("click", () => router.push(`/keepers/${k.slug}`));
        m.on("keypress", (e) => {
          if ((e as { originalEvent?: KeyboardEvent }).originalEvent?.key === "Enter") {
            router.push(`/keepers/${k.slug}`);
          }
        });
      }

      if (focus && keepers[0]) map.setView(coordsFor(keepers[0]), 11);
      else map.fitBounds(DE_BOUNDS, { padding: [18, 18] });

      const fix = () => map.invalidateSize();
      setTimeout(fix, 60);
      setTimeout(fix, 360);
      window.addEventListener("resize", fix);
      map.once("remove", () => window.removeEventListener("resize", fix));
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [keepers, focus, router]);

  return (
    <figure className={`dmap ${className}`}>
      <div ref={ref} className="lmap" role="application" aria-label="Map of Delaware's beekeepers" />
      {caption && (
        <figcaption className="dmap-legend">
          <span className="mono dmap-legend-fig">Fig. 1</span>
          <span className="dmap-legend-keys">
            <span className="dmap-key">
              <HiveGlyph /> Apiary — tap a hive to visit
            </span>
            <span className="dmap-key dmap-note">Pins shown by county</span>
          </span>
        </figcaption>
      )}
    </figure>
  );
}

function HiveGlyph() {
  return (
    <svg width="20" height="22" viewBox="0 0 34 38" aria-hidden style={{ verticalAlign: "-5px" }}>
      <g stroke="#3a2710" strokeWidth="1" strokeLinejoin="round">
        <polygon points="4,21 8,17 30,17 26,21" fill="#dcab50" />
        <rect x="4" y="21" width="22" height="11" fill="#c08a2e" />
        <polygon points="26,21 30,17 30,28 26,32" fill="#9c6e22" />
        <polygon points="2,15 7,11 32,11 27,15" fill="#7a5320" />
        <rect x="2" y="15" width="25" height="4" fill="#6b481b" />
        <polygon points="27,15 32,11 32,15 27,19" fill="#5f3f17" />
      </g>
      <rect x="12" y="28" width="8" height="3" fill="#3a2710" />
    </svg>
  );
}
