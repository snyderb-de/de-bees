import Link from "next/link";
import { type Keeper, plateNo, toRoman } from "@/lib/keepers";
import { ServiceBadges } from "@/components/badges";

/** A keeper's entry as a numbered plate card in the register. */
export function KeeperPlate({ keeper }: { keeper: Keeper }) {
  const n = plateNo(keeper.slug);
  const title = keeper.business ?? keeper.keeper;
  const hasContact = Boolean(keeper.website || keeper.email);

  return (
    <Link
      href={`/keepers/${keeper.slug}`}
      className="group relative flex flex-col bg-[color:var(--paper-2)] p-6 transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: "inset 0 0 0 1px var(--rule), inset 0 0 0 4px var(--paper-2), inset 0 0 0 5px var(--rule-soft)" }}
    >
      <div className="flex items-center justify-between">
        <span className="plate-no text-[1.4rem] leading-none">Plate {toRoman(n)}</span>
        <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">
          {keeper.counties.join(" · ")}
        </span>
      </div>

      <hr className="hairline-soft my-4" />

      <h3 className="display text-[1.6rem] leading-[1.08]">{title}</h3>
      <p className="mono mt-1 text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
        {keeper.business ? keeper.keeper : "Registered keeper"}
      </p>

      <div className="mt-4">
        <ServiceBadges services={keeper.services} />
      </div>

      <div className="mt-auto pt-5">
        <hr className="hairline-soft mb-4" />
        <div className="flex items-center justify-between">
          <span className="ink-link">Read the plate →</span>
          {hasContact && (
            <span className="mono text-[0.6rem] uppercase tracking-[0.12em] text-[color:var(--honey)]">
              ✦ Storefront
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
