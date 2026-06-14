import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { EngravedBee } from "@/components/engraved-bee";
import { SOURCE } from "@/lib/keepers";
import { COUNTY_INFO } from "@/lib/site";

export const metadata: Metadata = {
  title: "About the Ledger",
  description:
    "Why this register exists — a single, beautiful place to find Delaware's beekeepers, their honey, and their services, and a plate worth being proud of.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About the ledger"
        title="A register worth being in."
        intro="The Apiary Ledger of Delaware is an independent showcase of the people who keep bees in the First State — built so good honey can be found, and so keepers have a home on the web they are proud to point to."
      />

      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6 text-[1.08rem] leading-[1.7] text-[color:var(--ink-soft)]">
            <p>
              Most beekeepers are easy to miss. They sell from a cooler at the end
              of a driveway, a table at the Saturday market, a hand-lettered sign
              on a back road. The honey is extraordinary and almost nobody knows
              it exists. This ledger is an attempt to fix that — to gather the
              state&apos;s keepers into one place that is as carefully made as the
              honey they pour.
            </p>
            <p>
              We borrowed the form of a nineteenth-century naturalist&apos;s
              register: every keeper is a numbered <em>plate</em>, drawn with the
              same care a botanist once gave a pressed flower. It is a small act of
              respect. A craft this old deserves a setting that feels like it has
              been around nearly as long.
            </p>
            <p>
              The register is free to be in, and free to use. If you keep bees in
              Delaware — two hives in the backyard or two hundred in the fields —
              there is a plate here with your name on it.
            </p>

            <h2 className="display title-m !mt-12">What you&apos;ll find</h2>
            <ul className="space-y-3 text-[1rem]">
              <Bullet>
                <strong>The Register</strong> — every keeper, filterable by county
                and by what they offer.
              </Bullet>
              <Bullet>
                <strong>The Map</strong> — an isometric survey of the apiaries,
                hive by hive.
              </Bullet>
              <Bullet>
                <strong>Swarms &amp; Services</strong> — who answers swarm calls,
                does cut-outs, and rents hives for pollination.
              </Bullet>
              <Bullet>
                <strong>Learn</strong> — clubs, registering your hive, and the
                nectar calendar for anyone starting out.
              </Bullet>
            </ul>

            <div className="!mt-10 flex flex-wrap gap-4">
              <Link href="/get-listed" className="btn-gilt">
                Get Listed
              </Link>
              <Link href="/keepers" className="btn-quiet">
                Browse the Register
              </Link>
            </div>
          </div>

          <aside className="space-y-10">
            <div className="plate-frame px-6 py-8">
              <p className="mono mb-2 text-center text-[0.62rem] uppercase tracking-[0.28em] text-[color:var(--oxblood)]">
                Plate I
              </p>
              <EngravedBee className="mx-auto h-auto w-full max-w-[200px]" />
            </div>

            <div>
              <h2 className="eyebrow mb-4">The three counties</h2>
              <ul className="space-y-4">
                {COUNTY_INFO.map((c) => (
                  <li key={c.name} className="border-t border-[color:var(--rule)] pt-3">
                    <p className="font-[family-name:var(--font-display)] text-[1.2rem]">
                      {c.name}{" "}
                      <span className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                        seat: {c.seat}
                      </span>
                    </p>
                    <p className="mt-1 text-[0.92rem] leading-[1.5] text-[color:var(--ink-soft)]">
                      {c.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <p className="mono mt-16 border-t border-[color:var(--rule)] pt-6 text-[0.7rem] leading-[1.7] text-[color:var(--ink-faint)]">
          A note on the entries: listings are drawn from the {SOURCE.agency}&apos;s{" "}
          {SOURCE.updated} registered beekeeper lists. We publish business and storefront
          contacts only — personal cell numbers and personal email addresses from the
          state lists are deliberately omitted. Keepers can correct, expand, or remove
          their entry at any time via{" "}
          <a href="/get-listed" className="underline">Get Listed</a>. This is an
          independent project and is not affiliated with the Delaware Beekeepers
          Association or the {SOURCE.agency}.
        </p>
      </div>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0" style={{ background: "var(--honey)" }} />
      <span>{children}</span>
    </li>
  );
}
