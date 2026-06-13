import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { KEEPERS } from "@/lib/keepers";
import { BLOOM_CALENDAR, CLUBS, STATE_STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn & Begin",
  description:
    "Starting beekeeping in Delaware — county clubs and meetings, registering your hive with the State Apiarist, the nectar calendar, and keepers who teach.",
};

const mentors = KEEPERS.filter((k) => k.offerings.includes("Classes & Mentoring"));

export default function LearnPage() {
  return (
    <>
      <PageIntro
        eyebrow="Learn & begin"
        title="Want to keep bees? Start here."
        intro="Beekeeping in Delaware is a small, friendly world. The association has run since 1936; clubs meet monthly in each county; and most keepers were taught hive-side by someone who was taught the same way."
      />

      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        {/* Clubs */}
        <section>
          <h2 className="display title-l">County clubs &amp; meetings</h2>
          <p className="lede mt-4 max-w-2xl">
            The Delaware Beekeepers Association meets by county. Newcomers are
            welcome at any meeting — bring questions, leave with a mentor.
          </p>
          <ul className="mt-10 grid gap-px overflow-hidden border border-[color:var(--rule)] bg-[color:var(--rule)] md:grid-cols-3">
            {CLUBS.map((c) => (
              <li key={c.branch} className="bg-[color:var(--paper)] p-6">
                <h3 className="display text-[1.5rem]">{c.county}</h3>
                <p className="mt-2 text-[0.95rem] text-[color:var(--ink-soft)]">{c.branch}</p>
                <p className="mono mt-3 text-[0.7rem] uppercase tracking-[0.1em] text-[color:var(--oxblood)]">
                  {c.meets}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Register your hive */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="display title-l">Register your hive</h2>
            <p className="mt-5 text-[1.05rem] leading-[1.65] text-[color:var(--ink-soft)]">
              Delaware law asks every beekeeper to register with the State
              Apiarist — within ten days of getting bees, and once a year by the
              end of January. It is free, it covers any number of hives, and it
              lets the state&apos;s inspectors help you keep healthy colonies and
              warn pesticide applicators near your bees.
            </p>
            <ul className="mt-6 space-y-3">
              <Step n="01" t="Register online" d="Use the state's apiary registration form when you acquire bees." />
              <Step n="02" t="Get inspected" d="The State Apiarist checks colonies for mites and disease, free of charge." />
              <Step n="03" t="Add to DriftWatch" d="Voluntarily map your apiary so sprayers know to steer clear." />
            </ul>
            <a
              href="https://agriculture.delaware.gov/plant-industries/honeybees/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet mt-8"
            >
              Delaware Dept. of Agriculture ↗
            </a>
          </div>

          <aside className="plate-frame self-start p-6">
            <h3 className="eyebrow mb-4">The state, in brief</h3>
            <dl className="space-y-3 text-[0.95rem]">
              <Stat k="Colonies statewide" v={STATE_STATS.colonies.toLocaleString()} />
              <Stat k="Honey industry" v={STATE_STATS.industryValue} />
              <Stat k="Crops pollinated" v={STATE_STATS.cropValue} />
              <Stat k="Association since" v={`${STATE_STATS.associationFounded}`} />
            </dl>
          </aside>
        </section>

        {/* Nectar calendar */}
        <section className="mt-20">
          <h2 className="display title-l">Know the flow</h2>
          <p className="lede mt-4 max-w-2xl">
            When you keep bees you start to read the year by what&apos;s blooming.
            Delaware&apos;s calendar runs roughly like this.
          </p>
          <div className="mt-8 divide-y divide-[color:var(--rule-soft)] border-y border-[color:var(--rule)]">
            {BLOOM_CALENDAR.map((b) => (
              <div key={b.season} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[160px_1fr] sm:gap-8">
                <div>
                  <p className="display text-[1.5rem]">{b.season}</p>
                  <p className="mono text-[0.66rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                    {b.months}
                  </p>
                </div>
                <div>
                  <p className="mono text-[0.74rem] tracking-[0.04em] text-[color:var(--oxblood)]">
                    {b.sources.join(" · ")}
                  </p>
                  <p className="mt-2 text-[0.98rem] text-[color:var(--ink-soft)]">{b.character}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mentors */}
        <section className="mt-20">
          <h2 className="display title-l">Keepers who teach</h2>
          <p className="lede mt-4 max-w-2xl">
            These keepers in the register offer classes, open-hive days, or
            one-on-one mentoring.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((k) => (
              <li key={k.slug}>
                <Link
                  href={`/keepers/${k.slug}`}
                  className="flex items-baseline justify-between gap-3 border-b border-[color:var(--rule)] py-3 hover:text-[color:var(--oxblood)]"
                >
                  <span className="font-[family-name:var(--font-display)] text-[1.2rem]">
                    {k.apiary}
                  </span>
                  <span className="mono text-[0.64rem] uppercase tracking-[0.1em] text-[color:var(--ink-faint)]">
                    {k.town}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <li className="flex gap-4 border-t border-[color:var(--rule-soft)] pt-3">
      <span className="plate-no text-[1rem]">{n}</span>
      <div>
        <p className="font-[family-name:var(--font-display)] text-[1.15rem]">{t}</p>
        <p className="text-[0.92rem] text-[color:var(--ink-soft)]">{d}</p>
      </div>
    </li>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[color:var(--rule-soft)] pb-3">
      <dt className="mono text-[0.66rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
        {k}
      </dt>
      <dd className="display text-[1.3rem]">{v}</dd>
    </div>
  );
}
