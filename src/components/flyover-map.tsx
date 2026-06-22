"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  buildCountyBrowseState,
  type AtlasBrowseCounty,
} from "@/lib/atlas-browse";
import {
  applyKeeperEdit,
  draftFromKeeper,
  keeperEditFromDraft,
  keeperEditIsEmpty,
  type KeeperDetailsDraft,
  type KeeperDetailsEdit,
} from "@/lib/keeper-edit";
import {
  COUNTIES,
  hasStorefront,
  type County,
  type Keeper,
} from "@/lib/keepers";

type AtlasVariant = "home" | "map" | "keeper";

type CountySpec = {
  name: County;
  x: number;
  z: number;
  width: number;
  depth: number;
  cols: number;
  color: number;
  label: [number, number];
};

type AtlasPlot = {
  slug: string;
  name: string;
  keeper: string;
  county: County;
  counties: County[];
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation: number;
  color: number;
  hatchColor: number;
  storefront: boolean;
  cutout: boolean;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  whereToBuy?: string[];
};

type CameraTarget = {
  x: number;
  z: number;
  altitude: number;
  distance: number;
  yaw: number;
};

type FlightRequest = {
  target: CameraTarget;
  duration: number;
  arc: number;
};

type CameraFlight = FlightRequest & {
  from: CameraTarget;
  startedAt: number;
};

type PlotSceneParts = {
  plot: AtlasPlot;
  group: THREE.Group;
  field: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  outline: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
};

const COUNTY_SPECS: Record<County, CountySpec> = {
  "New Castle": {
    name: "New Castle",
    x: 0.05,
    z: -3.9,
    width: 4.85,
    depth: 2.7,
    cols: 7,
    color: 0xdad4ac,
    label: [0.02, -4.88],
  },
  Kent: {
    name: "Kent",
    x: 0.32,
    z: -0.9,
    width: 4.35,
    depth: 2.85,
    cols: 4,
    color: 0xd6d0a5,
    label: [1.1, -1.55],
  },
  Sussex: {
    name: "Sussex",
    x: -0.12,
    z: 2.95,
    width: 6.55,
    depth: 4.45,
    cols: 5,
    color: 0xd8c895,
    label: [-0.72, 2.08],
  },
};

const OVERVIEW_TARGET: CameraTarget = {
  x: 0.24,
  z: 0.82,
  altitude: 3.92,
  distance: 6.34,
  yaw: -0.32,
};

const COUNTY_STORIES: Record<
  County,
  { kicker: string; title: string; body: string }
> = {
  "New Castle": {
    kicker: "Northern county",
    title: "City edge, old farm roads, fast calls.",
    body: "Dense keeper plots sit close together here. Browse it like a tight vineyard block, then drop into a single apiary.",
  },
  Kent: {
    kicker: "Central county",
    title: "Open middle ground.",
    body: "Kent is the slow middle passage. Fewer parcels, wider lanes, and easy room for comparing swarm and cut-out coverage.",
  },
  Sussex: {
    kicker: "Southern county",
    title: "Long fields and coastal towns.",
    body: "Sussex gets the broadest camera move. The keeper plots spread out so each stop has air around it.",
  },
};

const STATE_STORY = {
  kicker: "Delaware register",
  title: "Three counties, one calm field map.",
  body: "Start with the whole state, then move county by county. Each keeper is treated as a parcel you can fly to.",
};

const KEEPER_DETAILS_STORAGE_KEY = "de-bees:keeper-details:v1";

const DETAIL_TEXTURE_WIDTH = 3584;
const DETAIL_TEXTURE_HEIGHT = 5376;

const FIELD_COLORS = [
  0xb5ad79, 0xc4bb86, 0x9faa81, 0xc9b978, 0x879164, 0xc7b98f, 0x9aa775,
  0xd1c28f,
];

const STATE_OUTLINE: Array<[number, number]> = [
  [-2.82, -5.46],
  [-1.38, -5.74],
  [0.44, -5.48],
  [2.24, -5.1],
  [3.32, -4.28],
  [3.18, -3.42],
  [2.42, -2.68],
  [2.82, -1.78],
  [2.42, -0.78],
  [3.08, 0.16],
  [3.82, 1.18],
  [3.54, 2.18],
  [2.72, 3.06],
  [2.96, 4.24],
  [1.66, 5.12],
  [-0.56, 5.42],
  [-2.44, 4.72],
  [-3.22, 3.32],
  [-2.68, 2.06],
  [-3.22, 0.9],
  [-2.72, -0.2],
  [-3.18, -1.22],
  [-2.56, -2.28],
  [-3.04, -3.58],
];

const ROAD_PATHS: Array<Array<[number, number]>> = [
  [
    [1.86, -5.05],
    [1.18, -4.22],
    [0.42, -3.2],
    [-0.08, -2.02],
    [0.24, -0.88],
    [-0.34, 0.52],
    [-0.16, 1.96],
    [0.72, 3.46],
    [1.28, 4.88],
  ],
  [
    [-2.34, -4.02],
    [-1.18, -3.72],
    [0.18, -3.84],
    [1.66, -3.38],
    [2.72, -3.76],
  ],
  [
    [-2.34, -0.72],
    [-1.08, -0.48],
    [0.18, -0.7],
    [1.42, -0.24],
    [2.24, 0.34],
  ],
  [
    [-2.72, 2.32],
    [-1.4, 2.62],
    [0.08, 2.32],
    [1.36, 2.72],
    [2.44, 3.42],
  ],
];

export function FlyoverMap({
  keepers,
  variant = "map",
  initialSlug,
}: {
  keepers: Keeper[];
  variant?: AtlasVariant;
  initialSlug?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const countyLabelRefs = useRef<Record<County, HTMLSpanElement | null>>({
    "New Castle": null,
    Kent: null,
    Sussex: null,
  });
  const flightRequestRef = useRef<FlightRequest | null>(null);
  const activeCountyRef = useRef<AtlasBrowseCounty>("All");
  const selectedSlugRef = useRef("");
  const pausedRef = useRef(false);

  const [keeperEdits, setKeeperEdits] = useState<Record<string, KeeperDetailsEdit>>({});
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [detailsDraft, setDetailsDraft] = useState<KeeperDetailsDraft | null>(null);

  const displayKeepers = useMemo(
    () =>
      keepers.map((keeper) =>
        keeperEdits[keeper.slug] ? applyKeeperEdit(keeper, keeperEdits[keeper.slug]) : keeper,
      ),
    [keeperEdits, keepers],
  );
  const plots = useMemo(() => buildPlots(displayKeepers), [displayKeepers]);
  const initialPlot = useMemo(() => {
    const preferred =
      plots.find((plot) => plot.slug === initialSlug) ??
      plots.find((plot) => plot.slug === "carey-apiary") ??
      plots[0];
    return preferred;
  }, [initialSlug, plots]);

  const [selectedSlug, setSelectedSlug] = useState(initialPlot?.slug ?? "");
  const [activeCounty, setActiveCounty] = useState<AtlasBrowseCounty>(
    variant === "keeper" && initialPlot ? initialPlot.county : "All",
  );
  const [paused, setPaused] = useState(false);

  const browseState = useMemo(
    () => buildCountyBrowseState(plots, activeCounty, selectedSlug),
    [activeCounty, plots, selectedSlug],
  );
  const selected = browseState.selected ?? initialPlot;
  const visiblePlots = browseState.plots;
  const countyStory = activeCounty === "All" ? STATE_STORY : COUNTY_STORIES[activeCounty];
  const selectedKeeper = selected
    ? displayKeepers.find((keeper) => keeper.slug === selected.slug)
    : undefined;
  const sourceKeeper = selected
    ? keepers.find((keeper) => keeper.slug === selected.slug)
    : undefined;
  const isEditingDetails = Boolean(
    variant === "keeper" &&
    selected &&
    selectedKeeper &&
    editingSlug === selected.slug &&
    detailsDraft,
  );
  const draftEdit = isEditingDetails && detailsDraft ? keeperEditFromDraft(detailsDraft) : null;
  const draftIsDirty =
    Boolean(
      isEditingDetails &&
        selectedKeeper &&
        draftEdit &&
        !keeperEditIsEmpty(selectedKeeper, draftEdit),
    );
  const hasSavedDetails = Boolean(selected && keeperEdits[selected.slug]);

  useEffect(() => {
    selectedSlugRef.current = selectedSlug;
  }, [selectedSlug]);

  useEffect(() => {
    activeCountyRef.current = activeCounty;
  }, [activeCounty]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeeperEdits(readStoredKeeperEdits());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell || plots.length === 0) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xf4ecd9, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf4ecd9, 5.8, 16.2);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 90);
    const startTarget =
      variant === "keeper" && initialPlot
        ? targetForPlot(initialPlot, 1.6)
        : OVERVIEW_TARGET;
    placeCamera(camera, startTarget);

    const hemi = new THREE.HemisphereLight(0xfff9e8, 0x34483c, 2.2);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.9);
    sun.position.set(-4, 7, -5);
    scene.add(sun);

    const root = new THREE.Group();
    root.rotation.y = -0.02;
    scene.add(root);

    root.add(createPaperPlane());
    root.add(createContourLines());
    root.add(createConnectedLandmass(plots, renderer.capabilities.getMaxAnisotropy()));

    for (const county of COUNTIES) {
      const countyPlots = plots.filter((plot) => plot.county === county);
      root.add(createCountyPlate(COUNTY_SPECS[county], countyPlots));
    }
    root.add(createStateRoads());
    root.add(createTerrainDetails(plots));

    const interactive: THREE.Object3D[] = [];
    const scenePlots = new Map<string, PlotSceneParts>();
    for (const plot of plots) {
      const parts = createPlot(plot);
      scenePlots.set(plot.slug, parts);
      interactive.push(parts.field);
      root.add(parts.group);
    }

    const highlight = createHighlight();
    root.add(highlight.group);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let raf = 0;
    let hoverSlug = "";
    let auto = variant === "home" ? 0.16 : 0.08;
    let cameraTarget: CameraTarget = startTarget ?? OVERVIEW_TARGET;
    let flight: CameraFlight | null = null;
    let last = performance.now();
    let elapsed = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setSize = () => {
      const rect = shell.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(shell);
    setSize();

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = () => {
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(interactive, false);
      return hit?.object.userData.slug as string | undefined;
    };

    const onMove = (event: PointerEvent) => {
      setPointer(event);
      const slug = pick() ?? "";
      if (slug !== hoverSlug) {
        hoverSlug = slug;
        canvas.style.cursor = slug ? "pointer" : "";
      }
    };

    const onClick = (event: PointerEvent) => {
      setPointer(event);
      const slug = pick();
      const plot = plots.find((candidate) => candidate.slug === slug);
      if (!plot) return;
      setSelectedSlug(plot.slug);
      setActiveCounty(plot.county);
      flightRequestRef.current = {
        target: targetForPlot(plot, 1.62),
        duration: 2150,
        arc: 0.24,
      };
      setPaused(false);
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("click", onClick);

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const selectedNow = selectedSlugRef.current;
      const countyNow = activeCountyRef.current;
      const requestedFlight = flightRequestRef.current;
      if (requestedFlight) {
        flightRequestRef.current = null;
        flight = {
          ...requestedFlight,
          from: cameraTarget,
          startedAt: now,
          duration: reducedMotion ? 1 : requestedFlight.duration,
          arc: reducedMotion ? 0 : requestedFlight.arc,
        };
      }

      for (const parts of scenePlots.values()) {
        const isSelected = parts.plot.slug === selectedNow;
        const isVisible = countyNow === "All" || parts.plot.county === countyNow;
        parts.group.position.y = THREE.MathUtils.lerp(
          parts.group.position.y,
          isSelected ? 0.09 + Math.sin(elapsed * 3.5) * 0.018 : 0.015,
          0.08,
        );
        parts.field.material.opacity = THREE.MathUtils.lerp(
          parts.field.material.opacity,
          isSelected ? 0.24 : isVisible ? 0.075 : 0.025,
          0.08,
        );
        parts.field.material.emissiveIntensity = THREE.MathUtils.lerp(
          parts.field.material.emissiveIntensity,
          isSelected ? 0.12 : 0,
          0.1,
        );
        parts.outline.material.opacity = THREE.MathUtils.lerp(
          parts.outline.material.opacity,
          isSelected ? 0.52 : isVisible ? 0.075 : 0.025,
          0.1,
        );
      }

      const selectedParts = scenePlots.get(selectedNow);
      if (selectedParts) {
        const pulse = 1 + Math.sin(elapsed * 4.2) * 0.025;
        highlight.group.visible = true;
        highlight.group.position.set(
          selectedParts.plot.x,
          0.135 + Math.sin(elapsed * 2.4) * 0.012,
          selectedParts.plot.z,
        );
        highlight.group.rotation.y = selectedParts.plot.rotation;
        highlight.group.scale.set(
          selectedParts.plot.width * pulse,
          1,
          selectedParts.plot.depth * pulse,
        );
        highlight.wash.material.opacity = 0.18 + Math.sin(elapsed * 3.6) * 0.04;
        highlight.strokes.forEach((stroke, index) => {
          stroke.material.opacity =
            0.58 + Math.sin(elapsed * 3.6 + index * 0.7) * 0.14;
        });
      } else {
        highlight.group.visible = false;
      }

      if (flight) {
        const rawProgress = THREE.MathUtils.clamp((now - flight.startedAt) / flight.duration, 0, 1);
        const eased = easeInOutQuart(rawProgress);
        cameraTarget = interpolateTarget(flight.from, flight.target, eased);
        cameraTarget.altitude += Math.sin(eased * Math.PI) * flight.arc;
        if (rawProgress >= 1) {
          cameraTarget = flight.target;
          flight = null;
        }
      } else if (!pausedRef.current) {
        auto = (auto + dt * 0.018) % 1;
        cameraTarget =
          countyNow === "All"
            ? autoTarget(auto)
            : targetForCounty(countyNow, 2.24 + Math.sin(elapsed * 0.28) * 0.16);
      }

      const desired = cameraPositionFor(cameraTarget);
      camera.position.lerp(desired, flight ? 0.2 : 0.034);
      camera.lookAt(
        cameraTarget.x + pointer.x * 0.055,
        0,
        cameraTarget.z - pointer.y * 0.045,
      );

      updateCountyLabels(camera, shell, countyLabelRefs.current);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse(disposeObject);
    };
  }, [initialPlot, plots, variant]);

  const requestFlight = (target: CameraTarget, duration = 2150, arc = 0.24) => {
    flightRequestRef.current = { target, duration, arc };
  };

  const focusCounty = (county: AtlasBrowseCounty) => {
    setActiveCounty(county);
    setPaused(false);
    if (county === "All") {
      requestFlight(OVERVIEW_TARGET, 2600, 0.38);
      return;
    }
    const countyPlots = plots.filter((plot) => plot.county === county);
    const focusedPlot =
      countyPlots.find((plot) => plot.slug === selectedSlugRef.current) ?? countyPlots[0];
    if (focusedPlot) setSelectedSlug(focusedPlot.slug);
    requestFlight(targetForCounty(county, 2.28), 2350, 0.32);
  };

  const focusPlot = (plot: AtlasPlot, duration = 2150) => {
    setSelectedSlug(plot.slug);
    setActiveCounty(plot.county);
    setPaused(false);
    requestFlight(targetForPlot(plot, 1.6), duration, 0.24);
  };

  const persistKeeperEdits = (next: Record<string, KeeperDetailsEdit>) => {
    setKeeperEdits(next);
    writeStoredKeeperEdits(next);
  };

  const startEditingDetails = () => {
    if (!selectedKeeper || !selected) return;
    setEditingSlug(selected.slug);
    setDetailsDraft(draftFromKeeper(selectedKeeper));
  };

  const cancelEditingDetails = () => {
    setEditingSlug(null);
    setDetailsDraft(null);
  };

  function updateDetailsDraft<Key extends keyof KeeperDetailsDraft>(
    key: Key,
    value: KeeperDetailsDraft[Key],
  ) {
    setDetailsDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  const toggleDraftCounty = (county: County) => {
    setDetailsDraft((current) => {
      if (!current) return current;
      const hasCounty = current.counties.includes(county);
      const counties = hasCounty
        ? current.counties.filter((entry) => entry !== county)
        : [...current.counties, county];
      return counties.length ? { ...current, counties } : current;
    });
  };

  const saveDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !detailsDraft) return;
    const edit = keeperEditFromDraft(detailsDraft);
    const baseKeeper = sourceKeeper ?? selectedKeeper;
    if (!baseKeeper) return;

    const next = { ...keeperEdits };
    if (keeperEditIsEmpty(baseKeeper, edit)) {
      delete next[selected.slug];
    } else {
      next[selected.slug] = edit;
    }
    persistKeeperEdits(next);
    setEditingSlug(null);
    setDetailsDraft(null);
  };

  const revertSavedDetails = () => {
    if (!selected) return;
    const next = { ...keeperEdits };
    delete next[selected.slug];
    persistKeeperEdits(next);
    setEditingSlug(null);
    setDetailsDraft(null);
  };

  if (!selected) return null;

  const title =
    variant === "keeper"
      ? selected.name
      : variant === "home"
        ? "Delaware by hive and field."
        : "Three counties. Every keeper.";
  const intro =
    variant === "keeper"
      ? `${selected.keeper} serves ${formatCounties(selected.counties)}.`
      : "Explore by county, then fly to a keeper plot to see details.";

  return (
    <section
      ref={shellRef}
      className={`atlas-page atlas-page--${variant}`}
      aria-label="DE Bees keeper atlas"
    >
      <canvas ref={canvasRef} className="atlas-canvas" />
      {variant === "home" && <div className="atlas-art-plate" aria-hidden />}
      <div className="atlas-vignette" aria-hidden />

      {variant !== "keeper" && (
        <div className="atlas-title">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      )}

      <div className="atlas-county-labels" aria-hidden>
        {COUNTIES.map((county) => (
          <span
            key={county}
            ref={(node) => {
              countyLabelRefs.current[county] = node;
            }}
          >
            {county}
          </span>
        ))}
      </div>

      <aside key={activeCounty} className="atlas-county-story" aria-live="polite">
        <p>{countyStory.kicker}</p>
        <h2>{countyStory.title}</h2>
        <span>
          {visiblePlots.length} {visiblePlots.length === 1 ? "keeper parcel" : "keeper parcels"}
        </span>
        <p>{countyStory.body}</p>
      </aside>

      <aside className="atlas-register" aria-label="Keeper register">
        <div className="atlas-register-head">
          <span>{activeCounty === "All" ? "Keeper parcels" : activeCounty}</span>
          <small>{visiblePlots.length} stops</small>
          <Link href="/keepers">View all</Link>
        </div>
        <ol>
          {visiblePlots.map((plot, index) => (
            <li key={plot.slug}>
              <button
                type="button"
                onClick={() => focusPlot(plot)}
                aria-current={plot.slug === selected.slug ? "true" : undefined}
              >
                <span>{plot.name}</span>
                <small>
                  {String(index + 1).padStart(2, "0")} / {plot.county}
                </small>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <aside key={selected.slug} className="atlas-keeper-card atlas-story-panel" aria-live="polite">
        <button
          className="atlas-card-close"
          type="button"
          onClick={() => focusCounty(activeCounty === "All" ? selected.county : activeCounty)}
          aria-label="Refocus map"
        >
          ×
        </button>
        <div className="atlas-card-art" aria-hidden>
          <span />
        </div>
        <div className="atlas-card-page">
          <span>{browseState.pageLabel}</span>
          <span>{activeCounty === "All" ? "State register" : `${activeCounty} county`}</span>
        </div>
        <p className="atlas-card-location">
          {selected.county} · {selected.cutout ? "swarm + cut-out" : "swarm removal"}
        </p>
        {variant === "keeper" ? <h1>{selected.name}</h1> : <h2>{selected.name}</h2>}
        <p>{selected.keeper}</p>
        {isEditingDetails && detailsDraft ? (
          <form className="atlas-detail-editor" onSubmit={saveDetails}>
            <div className="atlas-detail-grid">
              <label>
                <span>Apiary</span>
                <input
                  value={detailsDraft.business}
                  onChange={(event) => updateDetailsDraft("business", event.target.value)}
                  placeholder="Business or apiary name"
                />
              </label>
              <label>
                <span>Keeper</span>
                <input
                  value={detailsDraft.keeper}
                  onChange={(event) => updateDetailsDraft("keeper", event.target.value)}
                  required
                  placeholder="Keeper name"
                />
              </label>
              <label>
                <span>Website</span>
                <input
                  value={detailsDraft.website}
                  onChange={(event) => updateDetailsDraft("website", event.target.value)}
                  placeholder="https://"
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={detailsDraft.email}
                  onChange={(event) => updateDetailsDraft("email", event.target.value)}
                  placeholder="Business email"
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  value={detailsDraft.phone}
                  onChange={(event) => updateDetailsDraft("phone", event.target.value)}
                  placeholder="Business phone"
                />
              </label>
              <label>
                <span>Address</span>
                <input
                  value={detailsDraft.address}
                  onChange={(event) => updateDetailsDraft("address", event.target.value)}
                  placeholder="Public storefront or farm"
                />
              </label>
            </div>

            <fieldset className="atlas-detail-checks">
              <legend>Counties</legend>
              {COUNTIES.map((county) => {
                const checked = detailsDraft.counties.includes(county);
                return (
                  <label key={county}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={checked && detailsDraft.counties.length === 1}
                      onChange={() => toggleDraftCounty(county)}
                    />
                    <span>{county}</span>
                  </label>
                );
              })}
            </fieldset>

            <fieldset className="atlas-detail-checks">
              <legend>Services</legend>
              <label>
                <input
                  type="checkbox"
                  checked={detailsDraft.swarm}
                  onChange={(event) => updateDetailsDraft("swarm", event.target.checked)}
                />
                <span>Swarm removal</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={detailsDraft.cutout}
                  onChange={(event) => updateDetailsDraft("cutout", event.target.checked)}
                />
                <span>Structural cut-outs</span>
              </label>
            </fieldset>

            <label className="atlas-detail-lines">
              <span>Where to buy</span>
              <textarea
                value={detailsDraft.whereToBuyText}
                onChange={(event) => updateDetailsDraft("whereToBuyText", event.target.value)}
                placeholder="One market, shop, or note per line"
              />
            </label>

            <div className="atlas-detail-actions">
              <button type="submit" disabled={!draftIsDirty}>
                Save details
              </button>
              <button type="button" onClick={cancelEditingDetails}>
                Cancel
              </button>
              {hasSavedDetails && (
                <button type="button" onClick={revertSavedDetails}>
                  Revert saved
                </button>
              )}
            </div>
            <p>{draftIsDirty ? "Unsaved changes" : "No changes yet"}</p>
          </form>
        ) : (
          <>
            <div className="atlas-card-tags">
              <span>{selected.storefront ? "honey source" : "registered keeper"}</span>
              <span>{formatCounties(selected.counties)}</span>
            </div>
            <div className="atlas-card-actions">
              <button type="button" onClick={() => focusPlot(selected)}>
                Fly to keeper
              </button>
              {variant === "keeper" ? (
                <button type="button" onClick={startEditingDetails}>
                  Edit details
                </button>
              ) : (
                <Link href={`/keepers/${selected.slug}`}>Open details</Link>
              )}
            </div>
            <div className="atlas-card-turns">
              <button
                type="button"
                onClick={() => browseState.previous && focusPlot(browseState.previous, 1850)}
                aria-label="Previous keeper"
              >
                Prev
              </button>
              <span>{browseState.pageLabel}</span>
              <button
                type="button"
                onClick={() => browseState.next && focusPlot(browseState.next, 1850)}
                aria-label="Next keeper"
              >
                Next
              </button>
            </div>
            {variant === "keeper" && (
              <div className="atlas-contact">
                {selected.website && (
                  <a href={selected.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
                {selected.email && <a href={`mailto:${selected.email}`}>{selected.email}</a>}
                {selected.phone && <a href={`tel:${selected.phone}`}>{selected.phone}</a>}
                {selected.address && <span>{selected.address}</span>}
                {selected.whereToBuy?.slice(0, 3).map((place) => (
                  <span key={place}>{place}</span>
                ))}
                {hasSavedDetails && <span>Saved locally in this browser</span>}
              </div>
            )}
          </>
        )}
      </aside>

      <div className="atlas-controls" aria-label="Flight controls">
        <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
          {paused ? "Resume" : "Hold"}
        </button>
        <button type="button" onClick={() => focusCounty("All")} aria-pressed={activeCounty === "All"}>
          State
        </button>
        {COUNTIES.map((county) => (
          <button
            key={county}
            type="button"
            onClick={() => focusCounty(county)}
            aria-pressed={activeCounty === county}
          >
            <span>{county}</span>
            <small>{browseState.countyTotals[county]}</small>
          </button>
        ))}
      </div>

      <div className="atlas-instructions">
        <span>1 Choose a county</span>
        <span>2 Fly to keeper</span>
        <span>3 Explore the plot</span>
      </div>
    </section>
  );
}

function buildPlots(keepers: Keeper[]): AtlasPlot[] {
  const plots: AtlasPlot[] = [];

  for (const county of COUNTIES) {
    const spec = COUNTY_SPECS[county];
    const countyKeepers = keepers.filter((keeper) => primaryCounty(keeper) === county);
    const rows = Math.ceil(countyKeepers.length / spec.cols);
    const cellX = spec.width / (spec.cols + 0.7);
    const cellZ = spec.depth / (rows + 0.55);

    countyKeepers.forEach((keeper, index) => {
      const col = index % spec.cols;
      const row = Math.floor(index / spec.cols);
      const h = hash(`${keeper.slug}:${county}`);
      const jitterX = (((h >>> 4) % 1000) / 1000 - 0.5) * cellX * 0.28;
      const jitterZ = (((h >>> 14) % 1000) / 1000 - 0.5) * cellZ * 0.24;
      const x = spec.x + (col - (spec.cols - 1) / 2) * cellX + jitterX;
      const z = spec.z + (row - (rows - 1) / 2) * cellZ + jitterZ;
      const color = FIELD_COLORS[h % FIELD_COLORS.length];

      plots.push({
        slug: keeper.slug,
        name: keeper.business ?? keeper.keeper,
        keeper: keeper.keeper,
        county: primaryCounty(keeper),
        counties: keeper.counties,
        x,
        z,
        width: cellX * (0.72 + ((h >>> 8) % 100) / 520),
        depth: cellZ * (0.68 + ((h >>> 18) % 100) / 560),
        rotation: (((h >>> 21) % 1000) / 1000 - 0.5) * 0.22,
        color,
        hatchColor: h % 2 === 0 ? 0x5f6748 : 0x766f4e,
        storefront: hasStorefront(keeper),
        cutout: keeper.services.cutout,
        website: keeper.website,
        email: keeper.email,
        phone: keeper.phone,
        address: keeper.address,
        whereToBuy: keeper.whereToBuy,
      });
    });
  }

  return plots;
}

function readStoredKeeperEdits(): Record<string, KeeperDetailsEdit> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEEPER_DETAILS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, KeeperDetailsEdit>) : {};
  } catch {
    return {};
  }
}

function writeStoredKeeperEdits(edits: Record<string, KeeperDetailsEdit>) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(edits).length === 0) {
      window.localStorage.removeItem(KEEPER_DETAILS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(KEEPER_DETAILS_STORAGE_KEY, JSON.stringify(edits));
    }
  } catch {
    // Local storage can be unavailable in private or restricted browser modes.
  }
}

function primaryCounty(keeper: Keeper): County {
  const place = `${keeper.address ?? ""} ${(keeper.whereToBuy ?? []).join(" ")}`.toLowerCase();

  if (
    keeper.counties.includes("Sussex") &&
    /\b(frankford|georgetown|lewes|milton|millsboro|seaford|selbyville|dagsboro)\b/.test(place)
  ) {
    return "Sussex";
  }

  if (
    keeper.counties.includes("Kent") &&
    /\b(dover|felton|camden|harrington|milford|magnolia|odessa)\b/.test(place)
  ) {
    return "Kent";
  }

  if (
    keeper.counties.includes("New Castle") &&
    /\b(new castle|wilmington|newark|middletown|hockessin)\b/.test(place)
  ) {
    return "New Castle";
  }

  return keeper.counties[0];
}

function createPaperPlane() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xf2ead5,
      roughness: 0.97,
      metalness: 0,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.24;
  return mesh;
}

function createContourLines() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x282820,
    transparent: true,
    opacity: 0.065,
  });

  for (let ring = 0; ring < 16; ring++) {
    const points: THREE.Vector3[] = [];
    const radiusX = 2.6 + ring * 0.46;
    const radiusZ = 1.2 + ring * 0.32;
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const wobble = Math.sin(t * 4 + ring) * 0.05 + Math.cos(t * 7) * 0.025;
      points.push(
        new THREE.Vector3(
          Math.cos(t) * (radiusX + wobble) - 0.3,
          -0.215,
          Math.sin(t) * (radiusZ + wobble) + 0.85,
        ),
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return group;
}

function applyPlanarUv(geometry: THREE.BufferGeometry, outline: Array<[number, number]>) {
  const bounds = boundsFor(outline);
  const positions = geometry.getAttribute("position");
  const uvs: number[] = [];

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    uvs.push(
      (x - bounds.minX) / (bounds.maxX - bounds.minX),
      1 - (z - bounds.minZ) / (bounds.maxZ - bounds.minZ),
    );
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

function createIllustratedMapTexture(plots: AtlasPlot[]) {
  const canvas = document.createElement("canvas");
  canvas.width = DETAIL_TEXTURE_WIDTH;
  canvas.height = DETAIL_TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  const bounds = boundsFor(STATE_OUTLINE);
  const padX = (bounds.maxX - bounds.minX) * 0.085;
  const padZ = (bounds.maxZ - bounds.minZ) * 0.055;
  const projection = {
    minX: bounds.minX - padX,
    maxX: bounds.maxX + padX,
    minZ: bounds.minZ - padZ,
    maxZ: bounds.maxZ + padZ,
  };
  const toCanvas = ([x, z]: [number, number]) => ({
    x: ((x - projection.minX) / (projection.maxX - projection.minX)) * canvas.width,
    y: ((z - projection.minZ) / (projection.maxZ - projection.minZ)) * canvas.height,
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#cfc48c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPaperGrain(ctx, canvas.width, canvas.height);
  clipWorldPolygon(ctx, STATE_OUTLINE, toCanvas);
  drawCountyBase(ctx, toCanvas);
  drawIllustratedTopography(ctx, toCanvas);
  drawIllustratedFields(ctx, toCanvas);
  drawIllustratedKeeperPlots(ctx, toCanvas, plots);
  drawIllustratedRoads(ctx, toCanvas);
  drawIllustratedWater(ctx, toCanvas);
  drawIllustratedSettlements(ctx, toCanvas);
  drawIllustratedOrchards(ctx, toCanvas);
  drawIllustratedHives(ctx, toCanvas);
  drawIllustratedCliffRim(ctx, toCanvas);
  burnishIllustration(ctx, canvas.width, canvas.height);
  drawMapInk(ctx, toCanvas);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function drawPaperGrain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 5200; i++) {
    const h = hash(`grain:${i}`);
    const x = ((h >>> 3) % width);
    const y = ((h >>> 15) % height);
    const r = 0.8 + ((h >>> 25) % 100) / 42;
    ctx.fillStyle = (h & 1) === 0 ? "#6b624a" : "#f6efd8";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function clipWorldPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Array<[number, number]>,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ctx.save();
  ctx.beginPath();
  polygon.forEach((point, index) => {
    const { x, y } = toCanvas(point);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
}

function drawCountyBase(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  for (const county of COUNTIES) {
    const spec = COUNTY_SPECS[county];
    const outline = countyOutline(spec).map(([x, z]) => [x + spec.x, z + spec.z] as [number, number]);
    ctx.save();
    ctx.globalAlpha = county === "Sussex" ? 0.5 : county === "Kent" ? 0.38 : 0.34;
    fillWorldPolygon(ctx, outline, toCanvas, county === "Sussex" ? "#c8bd80" : "#d7cc95");
    ctx.restore();
  }
}

function drawIllustratedTopography(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ctx.save();
  for (let i = 0; i < 220; i++) {
    const h = hash(`topography:${i}`);
    const baseX = -3.05 + (((h >>> 3) % 1000) / 1000) * 6.2;
    const baseZ = -5.22 + (((h >>> 14) % 1000) / 1000) * 10.28;
    const length = 0.28 + (((h >>> 22) % 1000) / 1000) * 0.88;
    const angle = -0.18 + edgeJitter(h, 5) * 0.72;
    const points: Array<[number, number]> = [];

    for (let j = 0; j < 9; j++) {
      const t = j / 8 - 0.5;
      const wave = Math.sin(t * Math.PI * 2 + i * 0.37) * 0.055;
      const x = baseX + Math.cos(angle) * length * t - Math.sin(angle) * wave;
      const z = baseZ + Math.sin(angle) * length * t + Math.cos(angle) * wave;
      if (pointInPolygon(x, z, STATE_OUTLINE)) points.push([x, z]);
    }

    if (points.length > 2) {
      drawWorldPath(
        ctx,
        points,
        toCanvas,
        (h & 3) === 0 ? "rgba(42,61,75,0.15)" : "rgba(56,50,38,0.16)",
        2.1 + ((h >>> 9) % 100) / 70,
      );
    }
  }
  ctx.restore();
}

function drawIllustratedFields(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  for (const county of COUNTIES) {
    const spec = COUNTY_SPECS[county];
    const cols = county === "New Castle" ? 19 : county === "Sussex" ? 17 : 12;
    const rows = county === "New Castle" ? 11 : county === "Sussex" ? 17 : 10;
    const cellX = spec.width / cols;
    const cellZ = spec.depth / rows;
    const localOutline = countyOutline(spec);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const h = hash(`paint-field:${county}:${row}:${col}`);
        if (county === "Kent" && (h & 4) === 0) continue;
        if (county === "New Castle" && row < 3 && col > cols - 6 && (h & 1) === 0) continue;

        const lx = -spec.width / 2 + cellX * (col + 0.5) + edgeJitter(h, 1) * cellX * 0.28;
        const lz = -spec.depth / 2 + cellZ * (row + 0.5) + edgeJitter(h, 2) * cellZ * 0.25;
        if (!pointInPolygon(lx, lz, localOutline)) continue;

        const w = cellX * (0.62 + ((h >>> 8) % 100) / 260);
        const d = cellZ * (0.58 + ((h >>> 18) % 100) / 280);
        const world = parcelOutline(w, d, h).map(
          ([x, z]) => [x + spec.x + lx, z + spec.z + lz] as [number, number],
        );
        const palette = county === "Sussex"
          ? ["#9ba36d", "#b9ad73", "#8e9b69", "#c8b779", "#a7ad82"]
          : county === "Kent"
            ? ["#b5ad79", "#c2b886", "#9ca478", "#d0c18f"]
            : ["#a3aa7a", "#b6b07c", "#c4bc8b", "#9a9d73"];
        fillWorldPolygon(ctx, world, toCanvas, palette[h % palette.length]);
        strokeWorldPolygon(ctx, world, toCanvas, "rgba(45,42,31,0.52)", 2.65);

        ctx.save();
        ctx.strokeStyle = (h & 1) === 0 ? "rgba(48,57,35,0.42)" : "rgba(72,62,39,0.38)";
        ctx.lineWidth = 1.85;
        const hatchCount = 6 + (h % 7);
        for (let i = 0; i < hatchCount; i++) {
          const t = (i + 1) / (hatchCount + 1);
          const start = toCanvas([spec.x + lx - w * 0.38, spec.z + lz - d * 0.36 + d * 0.72 * t]);
          const end = toCanvas([spec.x + lx + w * 0.38, spec.z + lz - d * 0.32 + d * 0.68 * t]);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
}

function drawIllustratedKeeperPlots(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
  plots: AtlasPlot[],
) {
  for (const plot of plots) {
    const h = hash(`keeper-texture:${plot.slug}`);
    const outline = rotatedParcelOutline(plot, plot.width * 1.02, plot.depth * 1.02, h);
    const fill =
      plot.county === "Sussex"
        ? "rgba(155,159,96,0.48)"
        : plot.county === "Kent"
          ? "rgba(196,184,122,0.46)"
          : "rgba(172,171,113,0.43)";

    fillWorldPolygon(ctx, outline, toCanvas, fill);
    strokeWorldPolygon(ctx, outline, toCanvas, "rgba(41,37,27,0.58)", 3.15);

    const hatchCount = plot.storefront ? 9 : 6;
    for (let i = 0; i < hatchCount; i++) {
      const t = (i + 1) / (hatchCount + 1);
      const localZ = -plot.depth * 0.42 + t * plot.depth * 0.84;
      const start = rotatePlotPoint(plot, -plot.width * 0.38, localZ + edgeJitter(h, i) * 0.018);
      const end = rotatePlotPoint(plot, plot.width * 0.38, localZ + edgeJitter(h, i + 12) * 0.018);
      drawWorldPath(ctx, [start, end], toCanvas, "rgba(48,55,35,0.5)", 2.05);
    }

    ctx.save();
    const hiveCount = plot.storefront ? 5 : 2 + (h % 3);
    for (let i = 0; i < hiveCount; i++) {
      const spread = Math.min(0.38, hiveCount * 0.045);
      const localX = -spread / 2 + (i / Math.max(1, hiveCount - 1)) * spread;
      const localZ = (((h >>> (i + 2)) % 100) / 100 - 0.5) * 0.18;
      const p = toCanvas(rotatePlotPoint(plot, localX, localZ));
      const s = 11 + (plot.storefront ? 2 : 0);
      ctx.fillStyle = "rgba(246,239,213,0.92)";
      ctx.strokeStyle = "rgba(36,34,28,0.46)";
      ctx.lineWidth = 1.75;
      ctx.fillRect(p.x - s * 0.45, p.y - s * 0.5, s * 0.9, s);
      ctx.strokeRect(p.x - s * 0.45, p.y - s * 0.5, s * 0.9, s);
      ctx.beginPath();
      ctx.moveTo(p.x - s * 0.55, p.y - s * 0.5);
      ctx.lineTo(p.x + s * 0.55, p.y - s * 0.5);
      ctx.stroke();
    }

    if (plot.storefront) {
      const p = toCanvas(rotatePlotPoint(plot, plot.width * 0.28, plot.depth * 0.12));
      ctx.translate(p.x, p.y);
      ctx.rotate(plot.rotation + edgeJitter(h, 7) * 0.26);
      ctx.fillStyle = "rgba(53,50,42,0.7)";
      ctx.fillRect(-17, -13, 34, 24);
      ctx.fillStyle = "rgba(31,29,24,0.78)";
      ctx.beginPath();
      ctx.moveTo(-21, -13);
      ctx.lineTo(0, -28);
      ctx.lineTo(21, -13);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawIllustratedRoads(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ROAD_PATHS.forEach((path, index) => {
    drawWorldPath(ctx, path, toCanvas, "rgba(62,58,42,0.26)", 13 + (index === 0 ? 5 : 0));
    drawWorldPath(ctx, path, toCanvas, "rgba(245,236,210,0.88)", 7 + (index === 0 ? 3 : 0));
  });

  for (let i = 0; i < 48; i++) {
    const h = hash(`lane:${i}`);
    const z = -4.8 + ((h >>> 4) % 1000) / 1000 * 9.4;
    const x = -2.5 + ((h >>> 15) % 1000) / 1000 * 4.8;
    const path: Array<[number, number]> = [
      [x - 0.48, z - 0.42],
      [x - 0.12, z - 0.08],
      [x + 0.38, z + 0.12],
      [x + 0.62, z + 0.46],
    ];
    drawWorldPath(ctx, path, toCanvas, "rgba(64,57,41,0.13)", 5.2);
    drawWorldPath(ctx, path, toCanvas, "rgba(245,236,210,0.58)", 3.1);
  }
}

function drawIllustratedWater(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  const streams: Array<Array<[number, number]>> = [
    [[-2.1, -4.92], [-1.12, -4.34], [-0.46, -3.52], [-0.72, -2.56], [0.08, -1.72]],
    [[2.42, -2.18], [2.76, -1.28], [2.18, -0.26], [1.34, 0.64], [1.72, 1.62]],
    [[-2.72, 1.7], [-1.72, 2.24], [-1.2, 3.12], [-1.54, 4.06], [-0.56, 4.78]],
  ];
  streams.forEach((stream) => {
    drawWorldPath(ctx, stream, toCanvas, "rgba(91,128,154,0.24)", 9);
    drawWorldPath(ctx, stream, toCanvas, "rgba(202,224,226,0.72)", 4.2);
  });
}

function drawIllustratedSettlements(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ctx.save();
  ctx.fillStyle = "rgba(62,62,55,0.78)";
  ctx.strokeStyle = "rgba(39,37,29,0.52)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 12; col++) {
      const h = hash(`paint-city:${row}:${col}`);
      if ((h & 6) === 0) continue;
      const p = toCanvas([1.06 + col * 0.17 + edgeJitter(h, 1) * 0.035, -4.58 + row * 0.15]);
      const w = 18 + ((h >>> 8) % 26);
      const hh = 18 + ((h >>> 16) % 52);
      ctx.globalAlpha = 0.45 + ((h >>> 22) % 100) / 300;
      ctx.fillRect(p.x - w / 2, p.y - hh, w, hh);
      ctx.strokeRect(p.x - w / 2, p.y - hh, w, hh);
    }
  }
  ctx.restore();

  for (let i = 0; i < 84; i++) {
    const h = hash(`paint-farm:${i}`);
    const x = -2.6 + ((h >>> 4) % 1000) / 1000 * 5.4;
    const z = -2.6 + ((h >>> 14) % 1000) / 1000 * 7.8;
    if (!pointInPolygon(x, z, STATE_OUTLINE)) continue;
    const p = toCanvas([x, z]);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(edgeJitter(h, 1) * 0.8);
    ctx.fillStyle = "rgba(74,70,58,0.68)";
    ctx.strokeStyle = "rgba(38,35,28,0.46)";
    ctx.lineWidth = 1.65;
    ctx.fillRect(-11, -9, 22, 18);
    ctx.strokeRect(-11, -9, 22, 18);
    ctx.fillStyle = "rgba(38,37,31,0.78)";
    ctx.beginPath();
    ctx.moveTo(-14, -9);
    ctx.lineTo(0, -22);
    ctx.lineTo(14, -9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawIllustratedOrchards(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ctx.save();
  for (let i = 0; i < 560; i++) {
    const h = hash(`paint-tree:${i}`);
    const x = -2.85 + ((h >>> 3) % 1000) / 1000 * 6.3;
    const z = -5.15 + ((h >>> 13) % 1000) / 1000 * 10.3;
    if (z < -3.55 && x > 0.76 && (h & 3) !== 0) continue;
    if (!pointInPolygon(x, z, STATE_OUTLINE)) continue;
    const p = toCanvas([x, z]);
    const r = (z > 1 ? 5.4 : 4.1) + ((h >>> 23) % 100) / 28;
    ctx.globalAlpha = 0.42 + ((h >>> 20) % 100) / 240;
    ctx.fillStyle = (h & 1) === 0 ? "#405033" : "#5c6840";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * 1.9);
    ctx.lineTo(p.x - r * 0.92, p.y + r * 0.56);
    ctx.lineTo(p.x + r * 0.92, p.y + r * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(67,49,31,0.48)";
    ctx.fillRect(p.x - r * 0.16, p.y + r * 0.45, r * 0.32, r * 0.95);
  }
  ctx.restore();
}

function drawIllustratedHives(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  ctx.save();
  ctx.fillStyle = "rgba(245,239,217,0.88)";
  ctx.strokeStyle = "rgba(52,48,37,0.35)";
  for (let i = 0; i < 160; i++) {
    const h = hash(`paint-hive:${i}`);
    const x = -2.34 + ((h >>> 3) % 1000) / 1000 * 5.0;
    const z = 1.45 + ((h >>> 13) % 1000) / 1000 * 3.75;
    if (!pointInPolygon(x, z, STATE_OUTLINE)) continue;
    const p = toCanvas([x, z]);
    const s = 8 + ((h >>> 24) % 100) / 24;
    ctx.fillRect(p.x - s * 0.5, p.y - s * 0.55, s, s);
    ctx.strokeRect(p.x - s * 0.5, p.y - s * 0.55, s, s);
  }
  ctx.restore();
}

function drawIllustratedCliffRim(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  const center = STATE_OUTLINE.reduce(
    (acc, [x, z]) => ({ x: acc.x + x / STATE_OUTLINE.length, z: acc.z + z / STATE_OUTLINE.length }),
    { x: 0, z: 0 },
  );

  ctx.save();
  STATE_OUTLINE.forEach(([x1, z1], index) => {
    const [x2, z2] = STATE_OUTLINE[(index + 1) % STATE_OUTLINE.length];
    const length = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.max(3, Math.floor(length / 0.14));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.35) / count;
      const h = hash(`texture-cliff:${index}:${i}`);
      const edgeX = THREE.MathUtils.lerp(x1, x2, t) + edgeJitter(h, 1) * 0.035;
      const edgeZ = THREE.MathUtils.lerp(z1, z2, t) + edgeJitter(h, 2) * 0.035;
      const pull = 0.1 + ((h >>> 7) % 100) / 340;
      const inner: [number, number] = [
        edgeX + (center.x - edgeX) * pull + edgeJitter(h, 3) * 0.035,
        edgeZ + (center.z - edgeZ) * pull + edgeJitter(h, 4) * 0.035,
      ];
      const edge = toCanvas([edgeX, edgeZ]);
      const inside = toCanvas(inner);
      ctx.strokeStyle = (h & 1) === 0 ? "rgba(39,35,27,0.38)" : "rgba(246,239,216,0.25)";
      ctx.lineWidth = 2.25 + ((h >>> 15) % 100) / 55;
      ctx.beginPath();
      ctx.moveTo(edge.x, edge.y);
      ctx.lineTo(inside.x, inside.y);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function burnishIllustration(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(111, 91, 41, 0.12)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(248, 240, 214, 0.08)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawMapInk(
  ctx: CanvasRenderingContext2D,
  toCanvas: (point: [number, number]) => { x: number; y: number },
) {
  strokeWorldPolygon(ctx, STATE_OUTLINE, toCanvas, "rgba(31,29,23,0.68)", 6.6);
  strokeWorldPolygon(ctx, STATE_OUTLINE, toCanvas, "rgba(245,237,213,0.58)", 2.2);

  for (let pass = 0; pass < 5; pass++) {
    const offset = 0.045 * (pass + 1);
    const center = STATE_OUTLINE.reduce(
      (acc, [x, z]) => ({ x: acc.x + x / STATE_OUTLINE.length, z: acc.z + z / STATE_OUTLINE.length }),
      { x: 0, z: 0 },
    );
    const echo = STATE_OUTLINE.map(([x, z], index) => {
      const dx = x - center.x;
      const dz = z - center.z;
      return [
        x + dx * offset + edgeJitter(hash(`paint-echo:${pass}`), index) * 0.04,
        z + dz * offset + edgeJitter(hash(`paint-echo-z:${pass}`), index) * 0.04,
      ] as [number, number];
    });
    strokeWorldPolygon(ctx, echo, toCanvas, "rgba(38,36,29,0.1)", 2);
  }

  for (const county of COUNTIES) {
    const spec = COUNTY_SPECS[county];
    const outline = countyOutline(spec).map(([x, z]) => [x + spec.x, z + spec.z] as [number, number]);
    strokeWorldPolygon(ctx, outline, toCanvas, "rgba(34,32,26,0.38)", 2.05);
  }
}

function fillWorldPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Array<[number, number]>,
  toCanvas: (point: [number, number]) => { x: number; y: number },
  fill: string,
) {
  ctx.save();
  ctx.fillStyle = fill;
  polygon.forEach((point, index) => {
    const { x, y } = toCanvas(point);
    if (index === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function rotatedParcelOutline(plot: AtlasPlot, width: number, depth: number, h: number) {
  return parcelOutline(width, depth, h).map(([x, z]) => rotatePlotPoint(plot, x, z));
}

function rotatePlotPoint(plot: AtlasPlot, x: number, z: number): [number, number] {
  const cos = Math.cos(plot.rotation);
  const sin = Math.sin(plot.rotation);
  return [plot.x + x * cos - z * sin, plot.z + x * sin + z * cos];
}

function strokeWorldPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Array<[number, number]>,
  toCanvas: (point: [number, number]) => { x: number; y: number },
  stroke: string,
  width: number,
) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  polygon.forEach((point, index) => {
    const { x, y } = toCanvas(point);
    if (index === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawWorldPath(
  ctx: CanvasRenderingContext2D,
  path: Array<[number, number]>,
  toCanvas: (point: [number, number]) => { x: number; y: number },
  stroke: string,
  width: number,
) {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const first = toCanvas(path[0]);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < path.length; i++) {
    const previous = toCanvas(path[i - 1]);
    const current = toCanvas(path[i]);
    ctx.quadraticCurveTo(previous.x, previous.y, (previous.x + current.x) / 2, (previous.y + current.y) / 2);
  }
  const last = toCanvas(path[path.length - 1]);
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function createConnectedLandmass(plots: AtlasPlot[], anisotropy = 1) {
  const group = new THREE.Group();
  const shape = shapeFromPoints(STATE_OUTLINE);
  const topGeometry = new THREE.ShapeGeometry(shape, 48);
  topGeometry.rotateX(Math.PI / 2);
  applyPlanarUv(topGeometry, STATE_OUTLINE);
  const atlasTexture = createIllustratedMapTexture(plots);
  atlasTexture.anisotropy = anisotropy;

  const shadow = new THREE.Mesh(
    topGeometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0x3a3328,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  shadow.position.set(0.22, -0.14, 0.28);
  group.add(shadow);

  const top = new THREE.Mesh(
    topGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: atlasTexture,
      side: THREE.DoubleSide,
    }),
  );
  top.position.y = -0.046;
  group.add(top);

  const side = new THREE.Mesh(
    sideGeometry(STATE_OUTLINE, 0.58),
    new THREE.MeshStandardMaterial({
      color: 0x8a7f63,
      roughness: 0.98,
      metalness: 0,
      transparent: true,
      opacity: 0.74,
      side: THREE.DoubleSide,
    }),
  );
  side.position.y = -0.046;
  group.add(side);

  const rimPoints = STATE_OUTLINE.map(([x, z]) => new THREE.Vector3(x, 0.032, z));
  rimPoints.push(rimPoints[0].clone());
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(rimPoints),
      new THREE.LineBasicMaterial({
        color: 0x24241f,
        transparent: true,
        opacity: 0.42,
      }),
    ),
  );

  group.add(createStateHatching());
  group.add(createStateWater());
  group.add(createCliffInk(STATE_OUTLINE, 0.58));
  group.add(createOutlineEchoes(STATE_OUTLINE));

  return group;
}

function createCountyPlate(spec: CountySpec, plots: AtlasPlot[]) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const outline = countyOutline(spec);
  const shape = shapeFromPoints(outline);
  const topGeometry = new THREE.ShapeGeometry(shape, 24);
  topGeometry.rotateX(Math.PI / 2);

  const top = new THREE.Mesh(
    topGeometry,
    new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  top.position.y = 0.002;
  group.add(top);

  const rimPoints = outline.map(([x, z]) => new THREE.Vector3(x, 0.034, z));
  rimPoints.push(rimPoints[0].clone());
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(rimPoints),
      new THREE.LineBasicMaterial({
        color: 0x23231d,
        transparent: true,
        opacity: 0.2,
      }),
    ),
  );

  group.add(createFieldTexture(spec));
  group.add(createParcelNetwork(spec));
  group.add(createCountyRoads(spec));
  group.add(createWindStrokes(spec));

  for (const plot of plots) {
    const trace = new THREE.Mesh(
      new THREE.PlaneGeometry(plot.width * 1.06, plot.depth * 1.05),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
      }),
    );
    trace.position.set(plot.x - spec.x, 0.014, plot.z - spec.z);
    trace.rotation.x = -Math.PI / 2;
    trace.rotation.z = -plot.rotation;
    group.add(trace);
  }

  return group;
}

function createStateHatching() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x3f3a2f,
    transparent: true,
    opacity: 0.105,
  });
  const crossMaterial = new THREE.LineBasicMaterial({
    color: 0x2d4f79,
    transparent: true,
    opacity: 0.045,
  });

  for (let i = 0; i < 68; i++) {
    const x = -5.35 + i * 0.2;
    appendClippedLine(group, [x - 1.1, -3.16], [x + 1.15, 4.22], 84, material, 0.026);
  }

  for (let i = 0; i < 38; i++) {
    const z = -3.1 + i * 0.23;
    appendClippedLine(
      group,
      [-5.16, z + Math.sin(i) * 0.08],
      [4.44, z + Math.cos(i * 1.4) * 0.08],
      90,
      crossMaterial,
      0.027,
    );
  }

  return group;
}

function createCliffInk(outline: Array<[number, number]>, depth: number) {
  const group = new THREE.Group();
  const faceMaterial = new THREE.LineBasicMaterial({
    color: 0x2f2b22,
    transparent: true,
    opacity: 0.56,
  });
  const ledgeMaterial = new THREE.LineBasicMaterial({
    color: 0x191812,
    transparent: true,
    opacity: 0.28,
  });

  outline.forEach(([x1, z1], index) => {
    const [x2, z2] = outline[(index + 1) % outline.length];
    const length = Math.hypot(x2 - x1, z2 - z1);
    const strokes = Math.max(2, Math.floor(length / 0.18));
    for (let i = 0; i <= strokes; i++) {
      const t = i / strokes;
      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const h = hash(`cliff:${index}:${i}`);
      const drop = depth * (0.36 + ((h >>> 4) % 100) / 210);
      const sway = edgeJitter(h, i) * 0.075;
      const points = [
        new THREE.Vector3(x, 0.028, z),
        new THREE.Vector3(x + sway, -drop, z + edgeJitter(h, i + 9) * 0.06),
      ];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), faceMaterial));
    }

    for (let band = 0; band < 3; band++) {
      const y = -0.15 - band * 0.12;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= strokes; i++) {
        const t = i / strokes;
        const x = THREE.MathUtils.lerp(x1, x2, t);
        const z = THREE.MathUtils.lerp(z1, z2, t);
        points.push(
          new THREE.Vector3(
            x + Math.sin(t * Math.PI * 2 + band) * 0.025,
            y,
            z + Math.cos(t * Math.PI * 2 + band) * 0.025,
          ),
        );
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ledgeMaterial));
    }
  });

  return group;
}

function createOutlineEchoes(outline: Array<[number, number]>) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x343127,
    transparent: true,
    opacity: 0.065,
  });
  const center = outline.reduce(
    (acc, [x, z]) => ({ x: acc.x + x / outline.length, z: acc.z + z / outline.length }),
    { x: 0, z: 0 },
  );

  for (let ring = 1; ring <= 6; ring++) {
    const points = outline.map(([x, z], index) => {
      const dx = x - center.x;
      const dz = z - center.z;
      const amount = 0.035 * ring;
      return new THREE.Vector3(
        x + dx * amount + edgeJitter(hash(`echo:${ring}`), index) * 0.05,
        -0.212,
        z + dz * amount + edgeJitter(hash(`echoz:${ring}`), index) * 0.05,
      );
    });
    points.push(points[0].clone());
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return group;
}

function createStateWater() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0x6d9cc8,
    transparent: true,
    opacity: 0.3,
  });

  const streams: Array<Array<[number, number]>> = [
    [
      [-2.1, -4.92],
      [-1.12, -4.34],
      [-0.46, -3.52],
      [-0.72, -2.56],
      [0.08, -1.72],
    ],
    [
      [2.42, -2.18],
      [2.76, -1.28],
      [2.18, -0.26],
      [1.34, 0.64],
      [1.72, 1.62],
    ],
    [
      [-2.72, 1.7],
      [-1.72, 2.24],
      [-1.2, 3.12],
      [-1.54, 4.06],
      [-0.56, 4.78],
    ],
  ];

  streams.forEach((stream) => {
    group.add(createTubePath(stream, 0.014, material, 0.042));
  });

  return group;
}

function createStateRoads() {
  const group = new THREE.Group();
  const roadMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4ead0,
    transparent: true,
    opacity: 0.42,
  });
  const inkMaterial = new THREE.MeshBasicMaterial({
    color: 0x24241f,
    transparent: true,
    opacity: 0.055,
  });

  ROAD_PATHS.forEach((path) => {
    group.add(createTubePath(path, 0.038, inkMaterial, 0.04));
    group.add(createTubePath(path, 0.022, roadMaterial, 0.061));
  });

  return group;
}

function createFieldTexture(spec: CountySpec) {
  const group = new THREE.Group();
  const cols = spec.name === "New Castle" ? spec.cols + 5 : spec.name === "Sussex" ? spec.cols + 4 : spec.cols + 2;
  const rows = spec.name === "New Castle" ? 5 : spec.name === "Sussex" ? 8 : 5;
  const cellX = spec.width / cols;
  const cellZ = spec.depth / rows;
  const outline = countyOutline(spec);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4b4935,
    transparent: true,
    opacity: 0.055,
  });

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const h = hash(`field:${spec.name}:${row}:${col}`);
      if (spec.name === "Kent" && (h & 5) === 0) continue;
      if (spec.name === "New Castle" && row < 2 && col > cols - 5 && (h & 1) === 0) continue;
      if (spec.name !== "New Castle" && (h & 7) === 0) continue;
      const x = -spec.width / 2 + cellX * (col + 0.5) + edgeJitter(h, 1) * cellX * 0.24;
      const z = -spec.depth / 2 + cellZ * (row + 0.5) + edgeJitter(h, 2) * cellZ * 0.22;
      if (!pointInPolygon(x, z, outline)) continue;

      const width = cellX * (0.56 + ((h >>> 8) % 100) / 360);
      const depth = cellZ * (0.5 + ((h >>> 16) % 100) / 370);
      const shape = makeParcelShape(width, depth, h);
      const geometry = new THREE.ShapeGeometry(shape, 6);
      geometry.rotateX(Math.PI / 2);
      const patch = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: FIELD_COLORS[h % FIELD_COLORS.length],
          roughness: 0.96,
          metalness: 0,
          transparent: true,
          opacity: 0.028,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      patch.position.set(x, 0.018 + row * 0.0005, z);
      patch.rotation.y = edgeJitter(h, 3) * 0.18;
      group.add(patch);

      const hatchCount = 3 + (h % 3);
      for (let i = 0; i < hatchCount; i++) {
        const t = (i + 1) / (hatchCount + 1);
        const hz = z - depth * 0.34 + t * depth * 0.68;
        const points = [
          new THREE.Vector3(x - width * 0.34, 0.037, hz + edgeJitter(h, i + 4) * 0.018),
          new THREE.Vector3(x + width * 0.34, 0.037, hz + edgeJitter(h, i + 9) * 0.018),
        ];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
      }
    }
  }

  return group;
}

function createParcelNetwork(spec: CountySpec) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x433d2b,
    transparent: true,
    opacity: 0.08,
  });
  const hedgeMaterial = new THREE.LineBasicMaterial({
    color: 0x53613b,
    transparent: true,
    opacity: 0.12,
  });

  for (let col = 1; col <= spec.cols + 2; col++) {
    const x = -spec.width / 2 + (col / (spec.cols + 3)) * spec.width;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) {
      const p = i / 18;
      const z = -spec.depth * 0.43 + p * spec.depth * 0.86;
      points.push(
        new THREE.Vector3(x + Math.sin(p * Math.PI * 3 + col) * 0.045, 0.044, z),
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  for (let row = 1; row <= 6; row++) {
    const z = -spec.depth / 2 + (row / 7) * spec.depth;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 22; i++) {
      const p = i / 22;
      const x = -spec.width * 0.45 + p * spec.width * 0.9;
      points.push(
        new THREE.Vector3(x, 0.048, z + Math.cos(p * Math.PI * 4 + row) * 0.04),
      );
    }
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        row % 2 === 0 ? hedgeMaterial : material,
      ),
    );
  }

  return group;
}

function createTerrainDetails(plots: AtlasPlot[]) {
  const group = new THREE.Group();
  const positions: Array<[number, number, number]> = [];

  for (let i = 0; i < 520; i++) {
    const h = hash(`terrain:${i}`);
    const x = -3.12 + (((h >>> 3) % 1000) / 1000) * 6.82;
    const z = -5.34 + (((h >>> 13) % 1000) / 1000) * 10.46;
    const ruralBias = z > 0.9 ? 0.16 : z < -3.3 && x > 0.8 ? -0.12 : 0;
    const scale = 0.42 + ruralBias + (((h >>> 22) % 1000) / 1000) * 0.78;
    if (z < -3.35 && x > 0.82 && (h & 3) !== 0) continue;
    if (!pointInPolygon(x, z, STATE_OUTLINE) || isNearPlot(x, z, plots)) continue;
    positions.push([x, z, scale]);
  }

  const trunk = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.028, 0.08, 0.028),
    new THREE.MeshStandardMaterial({
      color: 0x5b4932,
      roughness: 0.9,
      transparent: true,
      opacity: 0.18,
    }),
    positions.length,
  );
  const canopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.06, 0.12, 5),
    new THREE.MeshStandardMaterial({
      color: 0x4f5e38,
      roughness: 0.94,
      transparent: true,
      opacity: 0.22,
    }),
    positions.length,
  );
  const dummy = new THREE.Object3D();

  positions.forEach(([x, z, scale], index) => {
    dummy.position.set(x, 0.076, z);
    dummy.rotation.y = scale * 0.8;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunk.setMatrixAt(index, dummy.matrix);

    dummy.position.set(x, 0.164, z);
    dummy.rotation.y = scale * 1.3;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    canopy.setMatrixAt(index, dummy.matrix);
  });

  trunk.instanceMatrix.needsUpdate = true;
  canopy.instanceMatrix.needsUpdate = true;
  group.add(trunk, canopy);
  group.add(createCityCluster());
  group.add(createSussexRuralRows());
  group.add(createMapLandmarks());

  return group;
}

function createMapLandmarks() {
  const group = new THREE.Group();
  const landmarks: Array<{
    x: number;
    z: number;
    scale: number;
    rotation: number;
    type: "barn" | "tower" | "windmill";
  }> = [
    { x: -1.86, z: -4.72, scale: 1.08, rotation: -0.2, type: "tower" },
    { x: -0.74, z: -4.18, scale: 0.82, rotation: 0.4, type: "barn" },
    { x: 1.84, z: -3.84, scale: 0.9, rotation: -0.3, type: "tower" },
    { x: -1.78, z: -1.34, scale: 0.82, rotation: 0.18, type: "barn" },
    { x: 1.68, z: -0.28, scale: 0.78, rotation: -0.5, type: "barn" },
    { x: 0.54, z: 0.54, scale: 0.8, rotation: 0.5, type: "tower" },
    { x: -2.18, z: 1.72, scale: 0.86, rotation: -0.12, type: "barn" },
    { x: -0.62, z: 2.86, scale: 1.04, rotation: 0.2, type: "windmill" },
    { x: 1.18, z: 4.28, scale: 0.86, rotation: -0.34, type: "barn" },
  ];

  landmarks.forEach((landmark) => {
    if (!pointInPolygon(landmark.x, landmark.z, STATE_OUTLINE)) return;
    const object =
      landmark.type === "tower"
        ? createTinyTower(landmark.scale)
        : landmark.type === "windmill"
          ? createTinyWindmill(landmark.scale)
          : createTinyBarn(landmark.scale);
    object.position.set(landmark.x, 0.072, landmark.z);
    object.rotation.y = landmark.rotation;
    group.add(object);
  });

  return group;
}

function createCityCluster() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x4d4d45,
    roughness: 0.92,
    transparent: true,
    opacity: 0.28,
  });
  const count = 64;
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 1, 0.15), material, count);
  const dummy = new THREE.Object3D();
  let index = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      if (index >= count) continue;
      const h = hash(`city:${row}:${col}`);
      if ((h & 9) === 0) continue;
      const height = 0.14 + ((h >>> 8) % 100) / 250;
      const x = 1.18 + col * 0.2 + edgeJitter(h, 1) * 0.035;
      const z = -4.46 + row * 0.19 + edgeJitter(h, 2) * 0.032;
      if (!pointInPolygon(x, z, STATE_OUTLINE)) continue;
      dummy.position.set(x, 0.066 + height / 2, z);
      dummy.rotation.y = edgeJitter(h, 3) * 0.12;
      dummy.scale.set(0.8 + edgeJitter(h, 4) * 0.22, height, 0.8 + edgeJitter(h, 5) * 0.22);
      dummy.updateMatrix();
      buildings.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  }

  buildings.count = index;
  buildings.instanceMatrix.needsUpdate = true;
  group.add(buildings);

  const roadMaterial = new THREE.LineBasicMaterial({
    color: 0xf5edda,
    transparent: true,
    opacity: 0.88,
  });
  for (let row = 0; row < 4; row++) {
    const z = -4.36 + row * 0.2;
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(1.08, 0.071, z),
          new THREE.Vector3(2.84, 0.071, z + Math.sin(row) * 0.025),
        ]),
        roadMaterial,
      ),
    );
  }
  for (let col = 0; col < 4; col++) {
    const x = 1.28 + col * 0.36;
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0.072, -4.58),
          new THREE.Vector3(x + Math.cos(col) * 0.018, 0.072, -3.68),
        ]),
        roadMaterial,
      ),
    );
  }

  return group;
}

function createSussexRuralRows() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xe7e0c8,
    roughness: 0.9,
    transparent: true,
    opacity: 0.3,
  });
  const count = 84;
  const stacks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 8), material, count);
  const dummy = new THREE.Object3D();
  let index = 0;

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 12; col++) {
      const h = hash(`sussex-row:${row}:${col}`);
      const x = -2.36 + col * 0.42 + edgeJitter(h, 1) * 0.08;
      const z = 2.12 + row * 0.42 + edgeJitter(h, 2) * 0.08;
      if (!pointInPolygon(x, z, STATE_OUTLINE) || index >= count) continue;
      dummy.position.set(x, 0.075, z);
      dummy.rotation.y = edgeJitter(h, 3) * 0.4;
      dummy.scale.setScalar(0.78 + ((h >>> 10) % 100) / 330);
      dummy.updateMatrix();
      stacks.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  }

  stacks.count = index;
  stacks.instanceMatrix.needsUpdate = true;
  group.add(stacks);
  return group;
}

function createTinyBarn(scale: number) {
  const barn = new THREE.Group();
  barn.scale.setScalar(scale);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.13, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0x6d6958,
      roughness: 0.92,
      transparent: true,
      opacity: 0.46,
    }),
  );
  base.position.y = 0.065;
  barn.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.085, 4),
    new THREE.MeshStandardMaterial({
      color: 0x282820,
      roughness: 0.9,
      transparent: true,
      opacity: 0.5,
    }),
  );
  roof.position.y = 0.158;
  roof.rotation.y = Math.PI / 4;
  barn.add(roof);
  return barn;
}

function createTinyTower(scale: number) {
  const tower = new THREE.Group();
  tower.scale.setScalar(scale);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 0.32, 8),
    new THREE.MeshStandardMaterial({
      color: 0xd8d0bc,
      roughness: 0.93,
      transparent: true,
      opacity: 0.5,
    }),
  );
  shaft.position.y = 0.16;
  tower.add(shaft);

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.09, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2d2b25,
      roughness: 0.88,
      transparent: true,
      opacity: 0.52,
    }),
  );
  cap.position.y = 0.36;
  tower.add(cap);
  return tower;
}

function createTinyWindmill(scale: number) {
  const windmill = createTinyTower(scale);
  const material = new THREE.LineBasicMaterial({
    color: 0x2d2b25,
    transparent: true,
    opacity: 0.44,
  });
  const blades = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.12, 0.34, 0.01),
      new THREE.Vector3(0.12, 0.34, 0.01),
      new THREE.Vector3(0, 0.22, 0.01),
      new THREE.Vector3(0, 0.46, 0.01),
    ]),
    material,
  );
  windmill.add(blades);
  return windmill;
}

function createCountyRoads(spec: CountySpec) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xf3eddd,
    transparent: true,
    opacity: 0.26,
  });
  const ink = new THREE.LineBasicMaterial({
    color: 0x34342c,
    transparent: true,
    opacity: 0.06,
  });

  for (let road = 0; road < 4; road++) {
    const points: THREE.Vector3[] = [];
    const startZ = -spec.depth * 0.38 + road * spec.depth * 0.24;
    for (let i = 0; i < 26; i++) {
      const p = i / 25;
      const x = -spec.width * 0.43 + p * spec.width * 0.86;
      const z =
        startZ +
        Math.sin(p * Math.PI * 2 + road) * 0.14 +
        Math.cos(p * Math.PI * 3 + spec.x) * 0.08;
      points.push(new THREE.Vector3(x, 0.05, z));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    const inkLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ink);
    inkLine.position.y = 0.006;
    group.add(inkLine);
  }

  return group;
}

function createWindStrokes(spec: CountySpec) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x25251f,
    transparent: true,
    opacity: 0.08,
  });

  for (let i = 0; i < 12; i++) {
    const points: THREE.Vector3[] = [];
    const baseX = -spec.width * 0.5 + (i % 4) * spec.width * 0.34;
    const baseZ = -spec.depth * 0.48 + Math.floor(i / 4) * spec.depth * 0.42;
    for (let j = 0; j < 20; j++) {
      const p = j / 19;
      points.push(
        new THREE.Vector3(
          baseX + p * 0.78,
          0.045,
          baseZ + Math.sin(p * Math.PI * 2 + i) * 0.035,
        ),
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return group;
}

function createPlot(plot: AtlasPlot): PlotSceneParts {
  const group = new THREE.Group();
  group.position.set(plot.x, 0.015, plot.z);
  group.rotation.y = plot.rotation;

  const shape = makeParcelShape(plot.width, plot.depth, hash(plot.slug));
  const geometry = new THREE.ShapeGeometry(shape, 10);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: plot.color,
    roughness: 0.86,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
    emissive: 0x174f9f,
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
  });
  const field = new THREE.Mesh(geometry, material);
  field.name = "keeper-field";
  field.userData.slug = plot.slug;
  group.add(field);

  const outlinePoints = parcelOutline(plot.width, plot.depth, hash(plot.slug)).map(
    ([x, z]) => new THREE.Vector3(x, 0.024, z),
  );
  outlinePoints.push(outlinePoints[0].clone());
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePoints),
    new THREE.LineBasicMaterial({
      color: 0x24241f,
      transparent: true,
    opacity: 0.16,
    }),
  );
  group.add(outline);

  const hatch = createParcelHatch(plot);
  group.add(hatch);

  const h = hash(`hives:${plot.slug}`);
  const hiveCount = plot.storefront ? 5 : 2 + (h % 3);
  for (let i = 0; i < hiveCount; i++) {
    group.add(createHive(i, hiveCount, h));
  }
  if (plot.storefront) group.add(createShed(h));

  return { plot, group, field, outline };
}

function createParcelHatch(plot: AtlasPlot) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: plot.hatchColor,
    transparent: true,
    opacity: 0.08,
  });
  const lines = 5;
  for (let i = 0; i < lines; i++) {
    const t = (i + 1) / (lines + 1);
    const z = -plot.depth * 0.4 + t * plot.depth * 0.8;
    const points = [
      new THREE.Vector3(-plot.width * 0.4, 0.028, z - 0.015),
      new THREE.Vector3(plot.width * 0.4, 0.028, z + 0.018),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  return group;
}

function createHive(index: number, count: number, h: number) {
  const hive = new THREE.Group();
  const spread = Math.min(0.38, count * 0.045);
  const x = -spread / 2 + (index / Math.max(1, count - 1)) * spread;
  const z = (((h >>> (index + 2)) % 100) / 100 - 0.5) * 0.18;
  hive.position.set(x, 0.068, z);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.07, 0.055),
    new THREE.MeshStandardMaterial({
      color: 0xf0ead8,
      roughness: 0.88,
      metalness: 0,
      transparent: true,
      opacity: 0.38,
    }),
  );
  hive.add(box);

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.012, 0.07),
    new THREE.MeshStandardMaterial({
      color: 0x545044,
      roughness: 0.8,
      metalness: 0,
      transparent: true,
      opacity: 0.4,
    }),
  );
  lid.position.y = 0.043;
  hive.add(lid);

  return hive;
}

function createShed(h: number) {
  const shed = new THREE.Group();
  shed.position.set(0.28, 0.075, 0.11);
  shed.rotation.y = ((h % 100) / 100 - 0.5) * 0.4;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.12, 0.14),
    new THREE.MeshStandardMaterial({
      color: 0x6f6b5c,
      roughness: 0.9,
      transparent: true,
      opacity: 0.42,
    }),
  );
  shed.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.07, 4),
    new THREE.MeshStandardMaterial({
      color: 0x2c2c25,
      roughness: 0.86,
      transparent: true,
      opacity: 0.44,
    }),
  );
  roof.position.y = 0.095;
  roof.rotation.y = Math.PI / 4;
  shed.add(roof);

  return shed;
}

function createHighlight() {
  const group = new THREE.Group();
  group.visible = false;

  const brushPoints: Array<[number, number]> = [
    [-0.58, -0.36],
    [-0.24, -0.52],
    [0.48, -0.44],
    [0.64, -0.02],
    [0.46, 0.42],
    [-0.12, 0.54],
    [-0.56, 0.3],
  ];

  const washGeometry = new THREE.ShapeGeometry(shapeFromPoints(brushPoints), 12);
  washGeometry.rotateX(Math.PI / 2);
  const wash = new THREE.Mesh(
    washGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x3f8fec,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  wash.name = "selected-plot-wash";
  group.add(wash);

  const strokes: Array<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>> = [];
  [0.92, 0.96, 1, 1.04, 1.08].forEach((scale, strokeIndex) => {
    const points = brushPoints.map(([x, z], pointIndex) => {
      const wobble = edgeJitter(hash(`brush:${strokeIndex}`), pointIndex) * 0.035;
      return new THREE.Vector3((x + wobble) * scale, 0.034 + strokeIndex * 0.004, z * scale);
    });
    const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.42);
    const stroke = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 84, 0.014 + strokeIndex * 0.002, 6, true),
      new THREE.MeshBasicMaterial({
        color: strokeIndex % 2 === 0 ? 0x0f55b8 : 0x4ea4ff,
        transparent: true,
        opacity: 0.64,
        depthWrite: false,
      }),
    );
    stroke.name = "selected-brush-stroke";
    strokes.push(stroke);
    group.add(stroke);
  });

  return { group, wash, strokes };
}

function countyOutline(spec: CountySpec): Array<[number, number]> {
  const w = spec.width / 2;
  const d = spec.depth / 2;
  const h = hash(spec.name);
  const points: Array<[number, number]> = [];
  const steps = 9;

  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    points.push([-w + p * spec.width, -d + edgeJitter(h, i) * 0.18]);
  }
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    points.push([w + edgeJitter(h, i + 11) * 0.16, -d + p * spec.depth]);
  }
  for (let i = steps - 1; i >= 0; i--) {
    const p = i / steps;
    points.push([-w + p * spec.width, d + edgeJitter(h, i + 23) * 0.18]);
  }
  for (let i = steps - 1; i > 0; i--) {
    const p = i / steps;
    points.push([-w + edgeJitter(h, i + 37) * 0.16, -d + p * spec.depth]);
  }

  return points;
}

function makeParcelShape(width: number, depth: number, h: number) {
  return shapeFromPoints(parcelOutline(width, depth, h));
}

function parcelOutline(width: number, depth: number, h: number): Array<[number, number]> {
  const w = width / 2;
  const d = depth / 2;
  return [
    [-w + edgeJitter(h, 1) * 0.025, -d + edgeJitter(h, 2) * 0.02],
    [-w * 0.08 + edgeJitter(h, 3) * 0.035, -d + edgeJitter(h, 4) * 0.02],
    [w + edgeJitter(h, 5) * 0.025, -d * 0.72 + edgeJitter(h, 6) * 0.025],
    [w + edgeJitter(h, 7) * 0.025, d + edgeJitter(h, 8) * 0.02],
    [-w * 0.2 + edgeJitter(h, 9) * 0.035, d + edgeJitter(h, 10) * 0.02],
    [-w + edgeJitter(h, 11) * 0.025, d * 0.66 + edgeJitter(h, 12) * 0.025],
  ];
}

function shapeFromPoints(points: Array<[number, number]>) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

function boundsFor(points: Array<[number, number]>) {
  return points.reduce(
    (bounds, [x, z]) => ({
      minX: Math.min(bounds.minX, x),
      maxX: Math.max(bounds.maxX, x),
      minZ: Math.min(bounds.minZ, z),
      maxZ: Math.max(bounds.maxZ, z),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    },
  );
}

function sideGeometry(points: Array<[number, number]>, depth: number) {
  const vertices: number[] = [];
  const indices: number[] = [];

  points.forEach(([x, z]) => {
    vertices.push(x, 0, z, x, -depth, z);
  });

  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    const a = i * 2;
    const b = next * 2;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTubePath(
  points: Array<[number, number]>,
  radius: number,
  material: THREE.Material,
  y: number,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, y, z)),
    false,
    "catmullrom",
    0.38,
  );
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(28, points.length * 12), radius, 7, false),
    material,
  );
}

function appendClippedLine(
  group: THREE.Group,
  start: [number, number],
  end: [number, number],
  steps: number,
  material: THREE.LineBasicMaterial,
  y: number,
) {
  let current: THREE.Vector3[] = [];
  const flush = () => {
    if (current.length > 1) {
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(current), material));
    }
    current = [];
  };

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = THREE.MathUtils.lerp(start[0], end[0], t);
    const z = THREE.MathUtils.lerp(start[1], end[1], t);
    if (pointInPolygon(x, z, STATE_OUTLINE)) {
      current.push(new THREE.Vector3(x, y, z));
    } else {
      flush();
    }
  }
  flush();
}

function pointInPolygon(x: number, z: number, polygon: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    const intersects = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isNearPlot(x: number, z: number, plots: AtlasPlot[]) {
  return plots.some((plot) => {
    const paddingX = plot.width * 0.42;
    const paddingZ = plot.depth * 0.42;
    return Math.abs(x - plot.x) < paddingX && Math.abs(z - plot.z) < paddingZ;
  });
}

function targetForCounty(county: County, altitude: number): CameraTarget {
  const spec = COUNTY_SPECS[county];
  return {
    x: spec.x,
    z: spec.z,
    altitude,
    distance: county === "Sussex" ? 3.56 : 3.34,
    yaw: county === "Kent" ? -0.7 : county === "Sussex" ? -0.32 : -0.58,
  };
}

function targetForPlot(plot: AtlasPlot, altitude: number): CameraTarget {
  return {
    x: plot.x,
    z: plot.z,
    altitude,
    distance: 2.04,
    yaw: plot.county === "Kent" ? -0.64 : plot.county === "Sussex" ? -0.44 : -0.58,
  };
}

function autoTarget(t: number): CameraTarget {
  const circle = t * Math.PI * 2;
  return {
    x: 0.24 + Math.sin(circle) * 0.17,
    z: 0.82 + Math.cos(circle * 0.8) * 0.28,
    altitude: 3.9 + Math.sin(circle * 0.7) * 0.14,
    distance: 6.32,
    yaw: -0.32 + Math.sin(circle) * 0.045,
  };
}

function interpolateTarget(from: CameraTarget, to: CameraTarget, t: number): CameraTarget {
  return {
    x: THREE.MathUtils.lerp(from.x, to.x, t),
    z: THREE.MathUtils.lerp(from.z, to.z, t),
    altitude: THREE.MathUtils.lerp(from.altitude, to.altitude, t),
    distance: THREE.MathUtils.lerp(from.distance, to.distance, t),
    yaw: THREE.MathUtils.lerp(from.yaw, to.yaw, t),
  };
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function cameraPositionFor(target: CameraTarget) {
  return new THREE.Vector3(
    target.x + Math.sin(target.yaw) * target.distance,
    target.altitude,
    target.z + Math.cos(target.yaw) * target.distance,
  );
}

function placeCamera(camera: THREE.PerspectiveCamera, target: CameraTarget) {
  const position = cameraPositionFor(target);
  camera.position.copy(position);
  if (target) camera.lookAt(target.x, 0, target.z);
}

function updateCountyLabels(
  camera: THREE.Camera,
  shell: HTMLDivElement,
  refs: Record<County, HTMLSpanElement | null>,
) {
  const rect = shell.getBoundingClientRect();
  for (const county of COUNTIES) {
    const node = refs[county];
    if (!node) continue;
    const [x, z] = COUNTY_SPECS[county].label;
    const point = new THREE.Vector3(x, 0.42, z).project(camera);
    const px = ((point.x + 1) / 2) * rect.width;
    const py = ((-point.y + 1) / 2) * rect.height;
    const visible = point.z < 1 && py > 118;
    node.style.opacity = visible ? "1" : "0";
    node.style.transform = `translate(${px}px, ${py}px)`;
  }
}

function disposeObject(object: THREE.Object3D) {
  const mesh = object as THREE.Mesh;
  if (mesh.geometry) mesh.geometry.dispose();
  const material = mesh.material;
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
  } else if (material) {
    material.dispose();
  }
}

function formatCounties(counties: County[]) {
  if (counties.length === 1) return counties[0];
  if (counties.length === 2) return `${counties[0]} + ${counties[1]}`;
  return "all counties";
}

function edgeJitter(seed: number, step: number) {
  const value = Math.sin((seed + step * 92821) * 0.00017) * 43758.5453;
  return value - Math.floor(value) - 0.5;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
