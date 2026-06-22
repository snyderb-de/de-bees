"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTIES, hasStorefront, type County, type Keeper } from "@/lib/keepers";

/*
  A normal slippy map (Leaflet + CARTO Positron tiles — free, no API key) with
  custom hive-box markers. The state lists are county-level, so each keeper is
  pinned at its primary county's centroid with a small deterministic jitter so
  pins fan out instead of stacking.

  `explore` (the /map page) turns on the intuitive locator: county cluster
  bubbles at low zoom, a "near me" jump, county quick-jumps, and individual
  hives once you zoom in. Tapping a hive opens a preview before you commit to a
  profile. Scroll-zoom is gated behind a click everywhere so the map never
  hijacks page scrolling. `focus` centres on a single keeper for profile pages.
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
// Below this zoom the explore map shows county cluster bubbles; at or above it
// the individual hives. fitBounds(DE_BOUNDS) lands around zoom 9.
const HIVE_ZOOM = 10;

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

function servicesLine(k: Keeper): string {
  const parts: string[] = [];
  if (hasStorefront(k)) parts.push("honey for sale");
  if (k.services.swarm) parts.push("swarm removal");
  if (k.services.cutout) parts.push("cut-outs");
  return parts.join(" · ") || "registered keeper";
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

type MapApi = { jump: (c: County | "All") => void; nearMe: () => void };

export function DelawareMap({
  keepers,
  className = "",
  caption = true,
  focus = false,
  explore = false,
}: {
  keepers: Keeper[];
  className?: string;
  caption?: boolean;
  focus?: boolean;
  explore?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const apiRef = useRef<MapApi | null>(null);
  const router = useRouter();
  const [active, setActive] = useState<County | "All">("All");
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [showZoomHint, setShowZoomHint] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;

      // Scroll-zoom off by default; we enable it only while the map is engaged
      // so scrolling the page over the map never zooms it unexpectedly.
      const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true });
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

      // ---- individual hive markers (with a click-to-preview popup) ----------
      const hiveLayer = L.layerGroup();
      for (const k of keepers) {
        const name = k.business ?? k.keeper;
        const m = L.marker(coordsFor(k), { icon, title: name, keyboard: true });
        m.bindTooltip(
          `<strong>${esc(name)}</strong><br>${esc(k.counties.join(" · "))} · ${esc(servicesLine(k))}`,
          { direction: "top", className: "hive-tip", opacity: 1 },
        );

        const pop = document.createElement("div");
        pop.className = "hive-pop";
        pop.innerHTML = `<strong>${esc(name)}</strong><span class="hive-pop-sub">${esc(
          k.counties.join(" · "),
        )} · ${esc(servicesLine(k))}</span>`;
        const visit = document.createElement("button");
        visit.type = "button";
        visit.className = "hive-pop-visit";
        visit.textContent = "Visit this keeper →";
        visit.addEventListener("click", () => router.push(`/keepers/${k.slug}`));
        pop.appendChild(visit);
        m.bindPopup(pop, { className: "hive-pop-wrap", closeButton: true, offset: [0, -22] });

        m.on("keypress", (e) => {
          if ((e as { originalEvent?: KeyboardEvent }).originalEvent?.key === "Enter") m.openPopup();
        });
        m.addTo(hiveLayer);
      }

      // ---- county cluster bubbles + orientation labels (explore only) -------
      const countyLayer = L.layerGroup();
      const labelLayer = L.layerGroup();
      if (explore) {
        for (const c of COUNTIES) {
          const count = keepers.filter((k) => k.counties[0] === c).length;
          const bubble = L.divIcon({
            className: "county-cluster",
            html: `<span class="cc"><b>${count}</b><i>${esc(c)}</i></span>`,
            iconSize: [70, 70],
            iconAnchor: [35, 35],
          });
          L.marker(CENTROIDS[c], { icon: bubble, title: `${c} — ${count} keepers`, keyboard: true })
            .on("click", () => api.jump(c))
            .on("keypress", (e) => {
              if ((e as { originalEvent?: KeyboardEvent }).originalEvent?.key === "Enter") api.jump(c);
            })
            .addTo(countyLayer);

          const label = L.divIcon({
            className: "county-label",
            html: `<span>${esc(c)}</span>`,
            iconSize: [90, 16],
            iconAnchor: [45, -18],
          });
          L.marker(CENTROIDS[c], { icon: label, interactive: false, keyboard: false }).addTo(labelLayer);
        }
      }

      const syncLayers = () => {
        if (!explore) return;
        const hives = map.getZoom() >= HIVE_ZOOM;
        if (hives) {
          countyLayer.remove();
          hiveLayer.addTo(map);
          labelLayer.addTo(map);
        } else {
          hiveLayer.remove();
          labelLayer.remove();
          countyLayer.addTo(map);
        }
      };

      // ---- imperative API used by the React controls ------------------------
      const api: MapApi = {
        jump: (c) => {
          setActive(c);
          setNote(null);
          const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (c === "All") {
            if (calm) map.fitBounds(DE_BOUNDS, { padding: [24, 24] });
            else map.flyToBounds(DE_BOUNDS, { padding: [24, 24], duration: 0.6 });
          } else if (calm) {
            map.setView(CENTROIDS[c], 11);
          } else {
            map.flyTo(CENTROIDS[c], 11, { duration: 0.6 });
          }
        },
        nearMe: () => {
          if (!("geolocation" in navigator)) {
            setNote("Location isn’t available in this browser.");
            return;
          }
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocating(false);
              let best: County = "Kent";
              let bestD = Infinity;
              for (const c of COUNTIES) {
                const [la, ln] = CENTROIDS[c];
                const d = (la - pos.coords.latitude) ** 2 + (ln - pos.coords.longitude) ** 2;
                if (d < bestD) {
                  bestD = d;
                  best = c;
                }
              }
              api.jump(best);
              setNote(`Closest county: ${best}`);
            },
            () => {
              setLocating(false);
              setNote("Couldn’t get your location — pick a county instead.");
            },
            { timeout: 8000 },
          );
        },
      };
      apiRef.current = api;

      // initial view
      if (focus && keepers[0]) {
        map.setView(coordsFor(keepers[0]), 11);
        hiveLayer.addTo(map);
      } else {
        map.fitBounds(DE_BOUNDS, { padding: [18, 18] });
        if (explore) syncLayers();
        else hiveLayer.addTo(map);
      }
      map.on("zoomend", syncLayers);

      // ---- scroll-zoom gating: engage on click, release when the cursor leaves
      const el = map.getContainer();
      const engage = () => {
        map.scrollWheelZoom.enable();
        setShowZoomHint(false);
      };
      const release = () => map.scrollWheelZoom.disable();
      el.addEventListener("click", engage);
      el.addEventListener("mouseleave", release);
      map.on("focus", engage);
      map.on("blur", release);

      const fix = () => map.invalidateSize();
      setTimeout(fix, 60);
      setTimeout(fix, 360);
      window.addEventListener("resize", fix);
      map.once("remove", () => {
        window.removeEventListener("resize", fix);
        el.removeEventListener("click", engage);
        el.removeEventListener("mouseleave", release);
      });
    })();

    return () => {
      cancelled = true;
      apiRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [keepers, focus, explore, router]);

  return (
    <figure className={`dmap ${className}`}>
      {explore && (
        <div className="dmap-toolbar">
          <button
            type="button"
            className="dmap-near"
            onClick={() => apiRef.current?.nearMe()}
            disabled={locating}
          >
            <span aria-hidden>📍</span> {locating ? "Locating…" : "Near me"}
          </button>
          <div className="dmap-jump" role="group" aria-label="Jump to a county">
            {(["All", ...COUNTIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                className="dmap-jump-btn"
                aria-pressed={active === c}
                onClick={() => apiRef.current?.jump(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {note && <span className="dmap-locnote">{note}</span>}
        </div>
      )}

      <div className="dmap-wrap">
        <div ref={ref} className="lmap" role="application" aria-label="Map of Delaware's beekeepers" />
        {showZoomHint && <span className="dmap-zoomhint" aria-hidden>Click the map to zoom · scroll the page freely</span>}
      </div>

      {caption && (
        <figcaption className="dmap-legend">
          <span className="mono dmap-legend-fig">Fig. 1</span>
          <span className="dmap-legend-keys">
            <span className="dmap-key">
              <HiveGlyph /> Apiary — tap a hive to preview
            </span>
            <span className="dmap-key dmap-note">
              {explore ? "Zoom in, or use Near me / a county above" : "Pins shown by county"}
            </span>
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
