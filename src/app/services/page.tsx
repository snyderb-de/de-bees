import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { KeeperPlate } from "@/components/keeper-plate";
import {
  COUNTIES,
  cutoutKeepers,
  keepersInCounty,
  SOURCE,
  swarmKeepers,
} from "@/lib/keepers";

export const metadata: Metadata = {
  title: "Swarms & Services",
  description:
    "Delaware beekeepers who collect swarms and perform structural cut-outs, by county, from the state's 2026 registered lists. Found a swarm? Don't spray it — call a keeper.",
};

export default function ServicesPage() {
  const cutouts = cutoutKeepers();
  const swarmers = swarmKeepers();

  return (
    <>
      <PageIntro
        eyebrow="Swarms · Cut-outs"
        title="When the bees need a keeper."
        intro="These keepers answer swarm calls and cut colonies out of walls and soffits, drawn from the Delaware Department of Agriculture's 2026 registered lists."
      />

      {/* Guidance */}
      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <div className="border-l-2 border-[color:var(--oxblood)] bg-[color:var(--paper-2)] p-6 sm:p-8">
          <h2 className="display title-m">Found a swarm? Don&apos;t spray it.</h2>
          <p className="mt-3 max-w-3xl text-[1.02rem] leading-[1.6] text-[color:var(--ink-soft)]">
            A clustered swarm is gentle and looking for a home — a keeper will usually
            collect it free. A colony already living inside a structure needs a{" "}
            <em>cut-out</em>, which is skilled work and {SOURCE.feeNote.toLowerCase()} Note
            the location and height, keep people back, and reach a keeper below. For
            guidance, the {SOURCE.agency}&apos;s Plant Industries line is{" "}
            <span className="mono">{SOURCE.contactPhone}</span>.
          </p>
        </div>
      </section>

      {/* Cut-out specialists */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--rule)] pb-4">
          <h2 className="display title-l">Structural cut-outs</h2>
          <span className="mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            {cutouts.length} keepers · may charge a fee
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cutouts.map((k) => (
            <KeeperPlate key={k.slug} keeper={k} />
          ))}
        </div>
      </section>

      {/* Swarm removal, by county */}
      <section className="border-t border-[color:var(--rule)] bg-[color:var(--paper-2)]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <h2 className="display title-l">Swarm collection</h2>
            <span className="mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
              {swarmers.length} keepers on call
            </span>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {COUNTIES.map((county) => {
              const list = keepersInCounty(county).filter((k) => k.services.swarm);
              return (
                <div key={county}>
                  <h3 className="mono text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--oxblood)]">
                    {county} · {list.length}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {list.map((k) => (
                      <li key={k.slug}>
                        <Link
                          href={`/keepers/${k.slug}`}
                          className="flex items-baseline justify-between gap-3 border-b border-[color:var(--rule-soft)] py-2 hover:text-[color:var(--oxblood)]"
                        >
                          <span className="font-[family-name:var(--font-display)] text-[1.05rem]">
                            {k.business ?? k.keeper}
                          </span>
                          {k.services.cutout && (
                            <span className="mono text-[0.58rem] uppercase tracking-[0.1em] text-[color:var(--ink-faint)]">
                              + cut-out
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="mono mt-10 text-[0.7rem] leading-[1.7] text-[color:var(--ink-faint)]">
            Source: {SOURCE.agency}, {SOURCE.updated} registered beekeeper lists ·{" "}
            <a href={SOURCE.swarmListUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Swarm list (with contacts) ↗
            </a>{" "}
            ·{" "}
            <a href={SOURCE.cutoutListUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Cut-out list ↗
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
