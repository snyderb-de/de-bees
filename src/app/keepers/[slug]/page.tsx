import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DelawareMap } from "@/components/delaware-map";
import { ServiceBadges } from "@/components/badges";
import { getKeeper, KEEPERS, SOURCE, toRoman, plateNo } from "@/lib/keepers";

export function generateStaticParams() {
  return KEEPERS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const k = getKeeper(slug);
  if (!k) return { title: "Keeper not found" };
  const title = k.business ?? k.keeper;
  return {
    title: `${title} — ${k.counties.join(", ")}`,
    description: `${title}, a registered Delaware beekeeper serving ${k.counties.join(", ")} County. ${
      k.services.swarm ? "Swarm removal" : ""
    }${k.services.cutout ? ", structural cut-outs" : ""}.`,
  };
}

export default async function KeeperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const keeper = getKeeper(slug);
  if (!keeper) notFound();

  const n = plateNo(keeper.slug);
  const title = keeper.business ?? keeper.keeper;
  const services = [
    keeper.services.swarm && "collects honeybee swarms",
    keeper.services.cutout && "performs structural cut-outs (which may carry a fee)",
  ].filter(Boolean);

  return (
    <article className="mx-auto max-w-[1180px] px-5 pt-12 pb-20 sm:px-8">
      <Link href="/keepers" className="ink-link">
        ← The Register
      </Link>

      <header className="mt-8">
        <p className="eyebrow">
          Plate {toRoman(n)} · {keeper.counties.join(" · ")} County
        </p>
        <h1 className="display title-l mt-4">{title}</h1>
        <p className="mono mt-3 text-[0.8rem] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
          {keeper.business ? `Kept by ${keeper.keeper}` : "Registered keeper"} · Delaware
        </p>
        <div className="mt-5">
          <ServiceBadges services={keeper.services} />
        </div>
      </header>

      <hr className="hairline mt-10" />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <p className="lede">
            {title} is a beekeeper registered with the {SOURCE.agency} for{" "}
            {keeper.counties.length > 1 ? "the" : ""}{" "}
            {joinCounties(keeper.counties)}{" "}
            {keeper.counties.length > 1 ? "counties" : "County"}, and{" "}
            {services.join(" and ")}.
          </p>

          <section className="mt-12">
            <h2 className="eyebrow">What that means</h2>
            <div className="mt-4 space-y-4 text-[1.02rem] leading-[1.65] text-[color:var(--ink-soft)]">
              {keeper.services.swarm && (
                <p>
                  <strong className="text-[color:var(--ink)]">Swarm collection.</strong>{" "}
                  A swarm is a clustered ball of bees that has left a hive to find a new
                  home — gentle, temporary, and usually collected free of charge. If you
                  spot one, don&apos;t spray it; note where it is and how high, and reach a
                  keeper.
                </p>
              )}
              {keeper.services.cutout && (
                <p>
                  <strong className="text-[color:var(--ink)]">Structural cut-outs.</strong>{" "}
                  When a colony has built comb inside a wall, soffit, or tree, removing it
                  is skilled work that opens the structure and rehomes the bees.{" "}
                  {SOURCE.feeNote}
                </p>
              )}
            </div>
          </section>

          <p className="mono mt-12 border-t border-[color:var(--rule)] pt-6 text-[0.7rem] leading-[1.7] text-[color:var(--ink-faint)]">
            Listing drawn from the {SOURCE.agency}&apos;s {SOURCE.updated} registered
            beekeeper lists. Are you {title} and want this entry corrected, expanded with
            your honey and products, or removed?{" "}
            <Link href="/get-listed" className="underline">
              Get in touch
            </Link>
            .
          </p>
        </div>

        <aside className="space-y-8">
          <div className="plate-frame p-6">
            <h2 className="eyebrow mb-4">Contact</h2>
            {keeper.website || keeper.email ? (
              <div className="space-y-3">
                {keeper.website && (
                  <a
                    href={keeper.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gilt w-full justify-center"
                  >
                    Visit storefront ↗
                  </a>
                )}
                {keeper.email && (
                  <a href={`mailto:${keeper.email}`} className="ink-link block break-all">
                    {keeper.email}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[0.92rem] leading-[1.55] text-[color:var(--ink-soft)]">
                Contact details are kept on the state&apos;s official list (we publish
                business contacts only).{" "}
                <a
                  href={keeper.services.cutout ? SOURCE.cutoutListUrl : SOURCE.swarmListUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ink-link"
                >
                  Open the state list ↗
                </a>
              </p>
            )}
          </div>

          <div className="plate-frame p-6">
            <h2 className="eyebrow mb-4">At a glance</h2>
            <dl className="space-y-3 text-[0.92rem]">
              <Row k="Counties" v={keeper.counties.join(", ")} />
              <Row k="Swarm removal" v={keeper.services.swarm ? "Yes" : "—"} />
              <Row k="Cut-outs" v={keeper.services.cutout ? "Yes" : "—"} />
              <Row k="Registered" v={`✦ ${SOURCE.updated}`} />
            </dl>
          </div>

          <div>
            <h2 className="eyebrow mb-3">Where they serve</h2>
            <DelawareMap keepers={[keeper]} caption={false} focus />
          </div>
        </aside>
      </div>
    </article>
  );
}

function joinCounties(counties: string[]): string {
  if (counties.length === 1) return counties[0];
  if (counties.length === 2) return `${counties[0]} and ${counties[1]}`;
  return `${counties.slice(0, -1).join(", ")}, and ${counties[counties.length - 1]}`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[color:var(--rule-soft)] pb-3">
      <dt className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
        {k}
      </dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
