import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { KEEPERS, swarmKeepers, type Keeper } from "@/lib/keepers";

export const metadata: Metadata = {
  title: "Swarms & Services",
  description:
    "Delaware beekeepers who collect swarms, perform structural cut-outs, and rent hives for pollination — organised by county. Found a swarm? Don't spray; call a keeper.",
};

const pollinators = KEEPERS.filter((k) => k.offerings.includes("Pollination"));

export default function ServicesPage() {
  const swarmers = swarmKeepers();

  return (
    <>
      <PageIntro
        eyebrow="Swarms · Cut-outs · Pollination"
        title="When the bees need a keeper — or a grower does."
        intro="Honey is only half the trade. These keepers answer swarm calls, cut colonies out of walls and soffits, and truck hives to the orchards and melon fields each season."
      />

      {/* Swarm guidance */}
      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <div className="border-l-2 border-[color:var(--oxblood)] bg-[color:var(--paper-2)] p-6 sm:p-8">
          <h2 className="display title-m">Found a swarm? Don&apos;t spray it.</h2>
          <p className="mt-3 max-w-3xl text-[1.02rem] leading-[1.6] text-[color:var(--ink-soft)]">
            A clustered swarm is gentle and looking for a home — a keeper will
            usually collect it free. A colony already living inside a structure
            needs a <em>cut-out</em>, which is skilled work. Note the location and
            height, keep people back, and call a keeper below. For registration
            and guidance, the Delaware Dept. of Agriculture&apos;s Plant Industries
            line is <span className="mono">302-698-4585</span>.
          </p>
        </div>
      </section>

      {/* Swarm & cut-out register */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--rule)] pb-4">
          <h2 className="display title-l">The Swarm &amp; Cut-Out Register</h2>
          <span className="mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            {swarmers.length} keepers on call
          </span>
        </div>

        <ul className="grid gap-5 md:grid-cols-2">
          {swarmers.map((k) => (
            <ServiceRow key={k.slug} keeper={k} />
          ))}
        </ul>
      </section>

      {/* Pollination */}
      <section className="border-t border-[color:var(--rule)] bg-[color:var(--paper-2)]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8">
          <h2 className="display title-l">Pollination contracts</h2>
          <p className="lede mt-4 max-w-2xl">
            Delaware&apos;s fruit and vegetable growers depend on rented hives —
            apple and melon, cucumber and squash. These keepers run colonies for
            hire through the season.
          </p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {pollinators.map((k) => (
              <li
                key={k.slug}
                className="flex items-baseline justify-between gap-4 border-b border-[color:var(--rule)] pb-4"
              >
                <div>
                  <Link
                    href={`/keepers/${k.slug}`}
                    className="font-[family-name:var(--font-display)] text-[1.4rem] hover:text-[color:var(--oxblood)]"
                  >
                    {k.apiary}
                  </Link>
                  <p className="mono mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                    {k.town}, {k.county} · {k.hives} hives
                  </p>
                </div>
                <Link href={`/keepers/${k.slug}`} className="ink-link shrink-0">
                  Visit →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function ServiceRow({ keeper }: { keeper: Keeper }) {
  const s = keeper.swarm!;
  return (
    <li className="flex flex-col bg-[color:var(--paper-2)] p-6" style={{ boxShadow: "inset 0 0 0 1px var(--rule)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/keepers/${keeper.slug}`}
          className="font-[family-name:var(--font-display)] text-[1.5rem] hover:text-[color:var(--oxblood)]"
        >
          {keeper.apiary}
        </Link>
        <span className="mono text-[0.64rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
          {keeper.county}
        </span>
      </div>
      <p className="mono mt-1 text-[0.66rem] uppercase tracking-[0.12em] text-[color:var(--ink-soft)]">
        {keeper.keeper} · {keeper.town}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {s.swarms && (
          <span className="mono border border-[color:var(--oxblood)] px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-[color:var(--oxblood)]">
            Swarm collection
          </span>
        )}
        {s.cutOuts && (
          <span className="mono border border-[color:var(--oxblood)] px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-[color:var(--oxblood)]">
            Structural cut-outs
          </span>
        )}
      </div>
      <p className="mt-4 text-[0.92rem] text-[color:var(--ink-soft)]">Serves {s.area}.</p>
    </li>
  );
}
