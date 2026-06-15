import Link from "next/link";
import Image from "next/image";
import beePlate from "@/assets/bee-plate.jpg";
import { DelawareMap } from "@/components/delaware-map";
import { KeeperPlate } from "@/components/keeper-plate";
import { Reveal } from "@/components/reveal";
import { getKeeper, KEEPERS, namedApiaries } from "@/lib/keepers";
import { BLOOM_CALENDAR, COUNTY_INFO, STATE_STATS } from "@/lib/site";

const FEATURED = ["douglas-bee-apiary", "big-joes-honey", "carey-apiary"]
  .map(getKeeper)
  .filter((k): k is NonNullable<typeof k> => Boolean(k));

export default function Home() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pt-12 pb-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div>
          <p className="eyebrow">An illustrated register · Vol. I</p>
          <h1 className="display title-xl mt-5">
            The honey of the
            <br />
            First State,
            <br />
            <span className="display-italic" style={{ color: "var(--oxblood)" }}>
              keeper by keeper.
            </span>
          </h1>
          <p className="lede mt-7 max-w-xl">
            A standing record of Delaware&apos;s beekeepers — their apiaries,
            their varietals, and the people who tend the hives, from the Piedmont
            woods to the coastal wildflower of Sussex.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/keepers" className="btn-gilt">
              Browse the Register
            </Link>
            <Link href="/map" className="btn-quiet">
              Open the Map
            </Link>
          </div>

          <p className="mono mt-9 text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            {STATE_STATS.colonies.toLocaleString()} colonies &nbsp;·&nbsp;{" "}
            {STATE_STATS.countiesCount} counties &nbsp;·&nbsp; keeping since{" "}
            {STATE_STATS.associationFounded}
          </p>
        </div>

        {/* the plate */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="plate-frame px-6 py-8">
            <p className="mono mb-3 text-center text-[0.66rem] uppercase tracking-[0.28em] text-[color:var(--oxblood)]">
              Plate I
            </p>
            <Image
              src={beePlate}
              alt="Hand-coloured copperplate engraving of the honeybee — worker, queen and drone with comb — from Curtis's British Entomology"
              placeholder="blur"
              sizes="(min-width: 1024px) 320px, 80vw"
              className="mx-auto block h-auto w-full max-w-[300px] border border-[color:var(--rule)] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
            />
            <p
              className="mt-3 text-center font-[family-name:var(--font-display)] italic text-[color:var(--ink-soft)]"
              style={{ fontVariationSettings: '"opsz" 30, "SOFT" 40' }}
            >
              Apis mellifera — the western honeybee
            </p>
            <p className="mono mt-1 text-center text-[0.6rem] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">
              Curtis, British Entomology, 1839
            </p>
          </div>
        </div>
      </section>

      {/* ===== Ledger of figures ===== */}
      <section className="border-y border-[color:var(--rule)] bg-[color:var(--paper-2)]">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-x divide-[color:var(--rule-soft)] px-5 sm:px-8 lg:grid-cols-4">
          <Figure value={STATE_STATS.colonies.toLocaleString()} label="Honeybee colonies in the state" />
          <Figure value={STATE_STATS.industryValue} label="Annual honey industry" />
          <Figure value={STATE_STATS.cropValue} label="Crops pollinated each year" />
          <Figure value={`${KEEPERS.length}`} label="Registered keepers in the directory" />
        </div>
      </section>

      {/* ===== The map ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Figure 1 — a survey of the apiaries</p>
              <h2 className="display title-l mt-3 max-w-2xl">
                Three counties, one long peninsula of bloom.
              </h2>
            </div>
            <Link href="/map" className="ink-link">
              The full map →
            </Link>
          </div>
        </Reveal>

        <Reveal>
          <DelawareMap keepers={namedApiaries()} />
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {COUNTY_INFO.map((c) => (
            <div key={c.name} className="border-t border-[color:var(--rule)] pt-4">
              <h3 className="mono text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--oxblood)]">
                {c.name}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-[1.5] text-[color:var(--ink-soft)]">
                {c.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== From the register ===== */}
      <section className="border-t border-[color:var(--rule)] bg-[color:var(--paper-2)]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">From the register</p>
                <h2 className="display title-l mt-3">A few of the keepers.</h2>
              </div>
              <Link href="/keepers" className="ink-link">
                All {KEEPERS.length} keepers →
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((k, i) => (
              <Reveal key={k.slug} delay={i * 90}>
                <KeeperPlate keeper={k} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Nectar calendar ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
        <Reveal>
          <p className="eyebrow">The nectar calendar</p>
          <h2 className="display title-l mt-3 max-w-2xl">
            What&apos;s in flower, and what it tastes of.
          </h2>
          <p className="lede mt-5 max-w-2xl">
            Delaware honey changes hands with the seasons. The famous dark
            tulip-poplar comes in spring; light clover in summer; bold goldenrod
            to close the year.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden border border-[color:var(--rule)] bg-[color:var(--rule)] md:grid-cols-3">
          {BLOOM_CALENDAR.map((b) => (
            <div key={b.season} className="bg-[color:var(--paper)] p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="display text-[2rem]">{b.season}</h3>
                <span className="mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
                  {b.months}
                </span>
              </div>
              <ul className="mono mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-[color:var(--oxblood)]">
                {b.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-4 text-[0.95rem] leading-[1.55] text-[color:var(--ink-soft)]">
                {b.character}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Get listed ===== */}
      <section className="border-t border-[color:var(--rule)] bg-[color:var(--ink)] text-[color:var(--paper)]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 text-center sm:px-8">
          <Reveal>
            <p className="eyebrow" style={{ color: "var(--honey-bright)" }}>
              Be inscribed
            </p>
            <h2 className="display title-l mx-auto mt-4 max-w-3xl">
              Keep bees in Delaware? Your apiary belongs in the register.
            </h2>
            <p
              className="mx-auto mt-6 max-w-xl text-[1.1rem] leading-[1.55]"
              style={{ color: "color-mix(in srgb, var(--paper) 80%, transparent)" }}
            >
              Listing is free for every keeper in the state — hobbyist or
              sideliner. A plate of your own: your story, your honey, your
              services, and a pin on the map.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/get-listed"
                className="btn-gilt"
                style={{ background: "var(--honey)", borderColor: "var(--honey)", color: "var(--ink)" }}
              >
                Get Listed
              </Link>
              <Link
                href="/about"
                className="btn-quiet"
                style={{ color: "var(--paper)", borderColor: "color-mix(in srgb, var(--paper) 40%, transparent)" }}
              >
                About the ledger
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-8 text-center sm:px-6">
      <div className="display text-[clamp(2.2rem,5vw,3.4rem)] leading-none">{value}</div>
      <div className="mono mx-auto mt-3 max-w-[18ch] text-[0.66rem] uppercase leading-[1.5] tracking-[0.12em] text-[color:var(--ink-soft)]">
        {label}
      </div>
    </div>
  );
}
