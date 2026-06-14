import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { GetListedForm } from "@/components/get-listed-form";

export const metadata: Metadata = {
  title: "Get Listed",
  description:
    "Add your Delaware apiary to the register — free for every keeper in the state. Tell us your story, your honey, and your services, and we'll draw your plate.",
};

export default function GetListedPage() {
  return (
    <>
      <PageIntro
        eyebrow="Be inscribed"
        title="Add your apiary to the register."
        intro="Free for every keeper in Delaware. Send us the essentials and we'll draw your plate — your story, your varietals, your services, and a pin on the map."
      />

      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <GetListedForm />

          <aside className="space-y-8 lg:border-l lg:border-[color:var(--rule)] lg:pl-12">
            <div>
              <h2 className="eyebrow mb-3">What a plate holds</h2>
              <ul className="space-y-2 text-[0.96rem] text-[color:var(--ink-soft)]">
                <li>— Your apiary&apos;s name and the counties you serve</li>
                <li>— What you offer — swarm calls, cut-outs, honey &amp; products</li>
                <li>— A link to your storefront, and a hive on the map</li>
                <li>— Business contact only — never your personal cell</li>
                <li>— Room to grow: your story and honey as the ledger fills out</li>
              </ul>
            </div>

            <div className="border-l-2 border-[color:var(--honey)] bg-[color:var(--paper-2)] p-5">
              <h2 className="mono text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--oxblood)]">
                One thing first
              </h2>
              <p className="mt-2 text-[0.92rem] leading-[1.55] text-[color:var(--ink-soft)]">
                Delaware asks keepers to register their hives with the State
                Apiarist — it&apos;s free and quick. Being in this ledger is
                separate, but we&apos;ll point new keepers toward registering too.
              </p>
            </div>

            <p className="mono text-[0.66rem] leading-[1.7] text-[color:var(--ink-faint)]">
              Listings are reviewed before they go up. We&apos;ll be in touch if we
              need a photo or a detail to finish your plate.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
