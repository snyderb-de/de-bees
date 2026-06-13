import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { KEEPERS } from "@/lib/keepers";

export const metadata: Metadata = {
  title: "Premiums & Honours",
  description:
    "The honours roll — premiums and best-in-show awards won by Delaware's beekeepers at the State Fair and county shows.",
};

interface Entry {
  year: number;
  place: string;
  title: string;
  body: string;
  apiary: string;
  slug: string;
}

const entries: Entry[] = KEEPERS.flatMap((k) =>
  k.awards.map((a) => ({ ...a, apiary: k.apiary, slug: k.slug })),
).sort((a, b) => b.year - a.year || a.apiary.localeCompare(b.apiary));

const years = Array.from(new Set(entries.map((e) => e.year))).sort((a, b) => b - a);

export default function AwardsPage() {
  return (
    <>
      <PageIntro
        eyebrow="The honours roll"
        title="Premiums & honours."
        intro="The ribbons of the show table. Delaware's keepers carry their honey, comb, and wax to the State Fair and county shows each summer — here is the standing record of what the judges chose."
      >
        <p className="mono mt-6 text-[0.74rem] uppercase tracking-[0.16em] text-[color:var(--oxblood)]">
          {entries.length} premiums recorded
        </p>
      </PageIntro>

      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        {years.map((year) => (
          <section key={year} className="mb-12">
            <div className="flex items-baseline gap-5">
              <h2 className="display text-[clamp(2.4rem,6vw,4rem)] leading-none text-[color:var(--ink)]">
                {year}
              </h2>
              <hr className="hairline flex-1" />
            </div>
            <ul className="mt-6">
              {entries
                .filter((e) => e.year === year)
                .map((e, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-1 gap-1 border-b border-[color:var(--rule-soft)] py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6"
                  >
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-tight">
                        <span style={{ color: "var(--oxblood)" }}>{e.place}</span>
                        {" — "}
                        {e.title}
                      </p>
                      <p className="mono mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                        {e.body}
                      </p>
                    </div>
                    <Link href={`/keepers/${e.slug}`} className="ink-link sm:text-right">
                      {e.apiary} →
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
