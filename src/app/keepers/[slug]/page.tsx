import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DelawareMap } from "@/components/delaware-map";
import { MethodBadge, OfferingTag } from "@/components/badges";
import { VarietalEntry } from "@/components/honey";
import { getKeeper, KEEPERS, toRoman, plateNo } from "@/lib/keepers";

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
  return {
    title: `${k.apiary} — ${k.town}, ${k.county}`,
    description: k.blurb,
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

  return (
    <article className="mx-auto max-w-[1180px] px-5 pt-12 pb-20 sm:px-8">
      <Link href="/keepers" className="ink-link">
        ← The Register
      </Link>

      {/* Plate header */}
      <header className="mt-8">
        <p className="eyebrow">
          Plate {toRoman(n)} · {keeper.county} County
        </p>
        <h1 className="display title-l mt-4">{keeper.apiary}</h1>
        <p className="mono mt-3 text-[0.8rem] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
          {keeper.keeper} · {keeper.town}, Delaware · established {keeper.established}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {keeper.methods.map((m) => (
            <MethodBadge key={m} label={m} />
          ))}
        </div>
      </header>

      <hr className="hairline mt-10" />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.55fr_1fr]">
        {/* Main column */}
        <div>
          <p className="lede">{keeper.story}</p>

          {/* Honey */}
          <section className="mt-14">
            <h2 className="eyebrow">The honey</h2>
            <h3 className="display title-m mt-3">Varietals &amp; colour</h3>
            <ul className="mt-6">
              {keeper.varietals.map((v) => (
                <VarietalEntry key={v.name} v={v} />
              ))}
            </ul>
          </section>

          {/* Awards */}
          {keeper.awards.length > 0 && (
            <section className="mt-14">
              <h2 className="eyebrow">Premiums &amp; honours</h2>
              <ul className="mt-6 space-y-4">
                {keeper.awards.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-4 border-t border-[color:var(--rule-soft)] pt-4"
                  >
                    <span className="plate-no shrink-0 text-[1.1rem]">{a.year}</span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-[1.2rem]">
                        <span style={{ color: "var(--oxblood)" }}>{a.place}</span> — {a.title}
                      </p>
                      <p className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                        {a.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="plate-frame p-6">
            <h2 className="eyebrow mb-4">At a glance</h2>
            <dl className="space-y-3 text-[0.92rem]">
              <Row k="County" v={`${keeper.county}`} />
              <Row k="Home town" v={keeper.town} />
              <Row k="Established" v={`${keeper.established}`} />
              <Row k="Colonies" v={`${keeper.hives} hives`} />
              <Row k="Registered" v={keeper.registered ? "✦ With the State Apiarist" : "—"} />
            </dl>
          </div>

          <div>
            <h2 className="eyebrow mb-4">Offered here</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {keeper.offerings.map((o) => (
                <OfferingTag key={o} label={o} />
              ))}
            </div>
          </div>

          {keeper.store && (
            <a
              href={keeper.store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gilt w-full justify-center"
            >
              {keeper.store.label} ↗
            </a>
          )}

          {keeper.swarm && (
            <div className="border-l-2 border-[color:var(--oxblood)] bg-[color:var(--paper-2)] p-5">
              <h2 className="mono text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--oxblood)]">
                Swarm &amp; cut-out service
              </h2>
              <p className="mt-2 text-[0.92rem] text-[color:var(--ink-soft)]">
                {[
                  keeper.swarm.swarms && "Collects loose swarms",
                  keeper.swarm.cutOuts && "Performs structural cut-outs",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                .
              </p>
              <p className="mt-2 text-[0.92rem] text-[color:var(--ink-soft)]">
                Serves {keeper.swarm.area}.
              </p>
              <Link href="/services" className="ink-link mt-3 inline-block">
                All swarm keepers →
              </Link>
            </div>
          )}

          <div>
            <h2 className="eyebrow mb-3">Where</h2>
            <DelawareMap keepers={[keeper]} caption={false} />
          </div>
        </aside>
      </div>
    </article>
  );
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
