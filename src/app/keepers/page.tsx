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
        intro="The full record of the apiaries we keep. Filter by county, or by what a keeper offers — honey and comb, bees and queens, classes, pollination, or a swarm call when one moves into your wall."
      />
      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <KeepersExplorer />
      </div>
    </>
  );
}
