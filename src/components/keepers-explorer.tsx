"use client";

import { useMemo, useState } from "react";
import {
  ALL_OFFERINGS,
  COUNTIES,
  KEEPERS,
  type County,
  type Offering,
} from "@/lib/keepers";
import { KeeperPlate } from "@/components/keeper-plate";

type CountyFilter = County | "All";
type OfferingFilter = Offering | "All";

export function KeepersExplorer() {
  const [county, setCounty] = useState<CountyFilter>("All");
  const [offering, setOffering] = useState<OfferingFilter>("All");

  const results = useMemo(() => {
    return KEEPERS.filter(
      (k) =>
        (county === "All" || k.county === county) &&
        (offering === "All" || k.offerings.includes(offering)),
    );
  }, [county, offering]);

  return (
    <div>
      <div className="mb-10 space-y-5">
        <Filter
          label="County"
          options={["All", ...COUNTIES] as CountyFilter[]}
          value={county}
          onChange={setCounty}
        />
        <Filter
          label="Offers"
          options={["All", ...ALL_OFFERINGS] as OfferingFilter[]}
          value={offering}
          onChange={setOffering}
        />
      </div>

      <p className="mono mb-6 text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">
        {results.length} {results.length === 1 ? "keeper" : "keepers"} in the register
      </p>

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
            Loosen a filter — or if you keep bees that way,{" "}
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
