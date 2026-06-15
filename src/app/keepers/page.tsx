import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { KeepersExplorer } from "@/components/keepers-explorer";

export const metadata: Metadata = {
  title: "The Register",
  description:
    "Every beekeeper in the ledger — filter Delaware's apiaries by county and by what they offer, from raw honey and comb to nucs, queens, and swarm removal.",
};

export default function KeepersPage() {
  return (
    <>
      <PageIntro
        eyebrow="The Register"
        title="Every keeper, plate by plate."
        intro="The full record of Delaware's registered keepers. Search by name or town, or filter by county and by what a keeper offers — honey to buy, swarm collection, or a structural cut-out when bees move into a wall."
      />
      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <KeepersExplorer />
      </div>
    </>
  );
}
