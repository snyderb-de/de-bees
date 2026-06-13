import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { DelawareMap } from "@/components/delaware-map";
import { KEEPERS, keepersByCounty } from "@/lib/keepers";
import { COUNTY_INFO } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Map",
  description:
    "An isometric map of Delaware's apiaries — every keeper as a hive on the board, county by county, from the Twelve-Mile Circle to the Maryland line.",
};

export default function MapPage() {
  return (
    <>
      <PageIntro
        eyebrow="Figure 1 — a survey of the apiaries"
        title="The whole state, hive by hive."
        intro="A little model of Delaware. Each box is a working apiary; tap one to visit its plate. North is the Twelve-Mile Circle; south, the Transpeninsular Line and the Maryland border."
      />

      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <DelawareMap keepers={KEEPERS} />
      </div>

      {/* County rolls */}
      <div className="mx-auto max-w-[1180px] px-5 pb-20 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {COUNTY_INFO.map((c) => {
            const list = keepersByCounty(c.name);
            return (
              <section key={c.name}>
                <div className="flex items-baseline justify-between border-b border-[color:var(--rule)] pb-3">
                  <h2 className="display text-[1.8rem]">{c.name}</h2>
                  <span className="mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
                    {list.length} keepers
                  </span>
                </div>
                <p className="mt-3 text-[0.95rem] leading-[1.5] text-[color:var(--ink-soft)]">
                  {c.note}
                </p>
                <ul className="mt-5 space-y-2">
                  {list.map((k) => (
                    <li key={k.slug}>
                      <Link
                        href={`/keepers/${k.slug}`}
                        className="flex items-baseline justify-between gap-3 border-b border-[color:var(--rule-soft)] py-2 transition-colors hover:text-[color:var(--oxblood)]"
                      >
                        <span className="font-[family-name:var(--font-display)] text-[1.1rem]">
                          {k.apiary}
                        </span>
                        <span className="mono text-[0.66rem] uppercase tracking-[0.1em] text-[color:var(--ink-faint)]">
                          {k.town}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
