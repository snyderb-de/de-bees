import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlyoverMap } from "@/components/flyover-map";
import { getKeeper, KEEPERS } from "@/lib/keepers";

export function generateStaticParams() {
  return KEEPERS.map((keeper) => ({ slug: keeper.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const keeper = getKeeper(slug);
  if (!keeper) return { title: "Keeper not found" };

  const title = keeper.business ?? keeper.keeper;
  return {
    title,
    description: `${title} serves ${keeper.counties.join(", ")} for swarm removal${
      keeper.services.cutout ? " and cut-out work" : ""
    }.`,
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

  return <FlyoverMap keepers={KEEPERS} variant="keeper" initialSlug={keeper.slug} />;
}
