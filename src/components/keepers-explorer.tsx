"use client";

import { useMemo, useState } from "react";
import { COUNTIES, hasStorefront, keeperMatches, KEEPERS, type County } from "@/lib/keepers";
import { KeeperPlate } from "@/components/keeper-plate";

type CountyFilter = County | "All";
type OfferFilter = "All" | "Buy honey" | "Swarm removal" | "Cut-outs";

export function KeepersExplorer() {
  const [county, setCounty] = useState<CountyFilter>("All");
  const [offer, setOffer] = useState<OfferFilter>("All");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return KEEPERS.filter((k) => {
      if (county !== "All" && !k.counties.includes(county)) return false;
      if (offer === "Buy honey" && !hasStorefront(k)) return false;
      if (offer === "Swarm removal" && !k.services.swarm) return false;
      if (offer === "Cut-outs" && !k.services.cutout) return false;
      if (!keeperMatches(k, query)) return false;
      return true;
    });
  }, [county, offer, query]);

  const reset = () => {
    setCounty("All");
    setOffer("All");
    setQuery("");
  };
  const filtered = county !== "All" || offer !== "All" || query.trim() !== "";

  return (
    <div>
      <div className="mb-8 space-y-5">
        <label className="relative block">
          <span className="sr-only">Search keepers by name or town</span>
          <SearchGlyph />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keeper, apiary, or town…"
            className="dgl-input !pl-10"
            autoComplete="off"
          />
        </label>

        <Filter
          label="County"
          options={["All", ...COUNTIES] as CountyFilter[]}
          value={county}
          onChange={setCounty}
        />
        <Filter
          label="Offers"
          options={["All", "Buy honey", "Swarm removal", "Cut-outs"] as OfferFilter[]}
          value={offer}
          onChange={setOffer}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="mono text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
          {results.length} {results.length === 1 ? "keeper" : "keepers"} in the register
        </p>
        {filtered && (
          <button type="button" onClick={reset} className="ink-link">
            Clear filters ✕
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((k) => (
            <KeeperPlate key={k.slug} keeper={k} />
          ))}
        </div>
      ) : (
        <div className="border border-[color:var(--rule)] bg-[color:var(--paper-2)] p-10 text-center">
          <p className="display text-[1.5rem]">No keepers match that yet.</p>
          <p className="mt-2 text-[color:var(--ink-soft)]">
            <button type="button" onClick={reset} className="ink-link">
              Clear the filters
            </button>{" "}
            — or if you keep bees in Delaware,{" "}
            <a href="/get-listed" className="ink-link">get listed</a>.
          </p>
        </div>
      )}
    </div>
  );
}

function Filter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
      <span className="eyebrow shrink-0 pt-1">{label}</span>
      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
        {options.map((opt) => {
          const on = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={on}
              className="mono border px-3 py-1.5 text-[0.7rem] tracking-[0.06em] transition-colors"
              style={{
                borderColor: on ? "var(--ink)" : "var(--rule)",
                background: on ? "var(--ink)" : "transparent",
                color: on ? "var(--paper)" : "var(--ink-soft)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)]"
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 11 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
