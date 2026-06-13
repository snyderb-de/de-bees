import Link from "next/link";
import { type Keeper, plateNo, toRoman } from "@/lib/keepers";
import { GradeDot } from "@/components/honey";

/** A keeper's entry as a numbered plate card in the register. */
export function KeeperPlate({ keeper }: { keeper: Keeper }) {
  const n = plateNo(keeper.slug);
  const awardCount = keeper.awards.length;
  const grades = Array.from(new Set(keeper.varietals.map((v) => v.grade)));

  return (
    <Link
      href={`/keepers/${keeper.slug}`}
      className="group relative flex flex-col bg-[color:var(--paper-2)] p-6 transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: "inset 0 0 0 1px var(--rule), inset 0 0 0 4px var(--paper-2), inset 0 0 0 5px var(--rule-soft)" }}
    >
      {/* head: plate number + county */}
      <div className="flex items-center justify-between">
        <span className="plate-no text-[1.4rem] leading-none">
          Plate {toRoman(n)}
        </span>
        <span className="mono text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--ink-faint)]">
          {keeper.county}
        </span>
      </div>

      <hr className="hairline-soft my-4" />

      <h3 className="display text-[1.7rem] leading-[1.05]">{keeper.apiary}</h3>
      <p className="mono mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
        {keeper.keeper} · {keeper.town} · est. {keeper.established}
      </p>

      <p className="mt-3 text-[0.98rem] leading-[1.5] text-[color:var(--ink-soft)]">
        {keeper.blurb}
      </p>

      <div className="mt-auto pt-5">
        {/* varietal colour dots */}
        <div className="flex items-center gap-2">
          {grades.map((g) => (
            <GradeDot key={g} grade={g} size={15} />
          ))}
          <span className="mono ml-1 text-[0.64rem] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
            {keeper.hives} hives
          </span>
          {awardCount > 0 && (
            <span className="mono ml-auto inline-flex items-center gap-1 text-[0.64rem] uppercase tracking-[0.1em] text-[color:var(--oxblood)]">
              ✦ {awardCount} premium{awardCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <hr className="hairline-soft my-4" />

        <span className="ink-link">Read the plate →</span>
      </div>
    </Link>
  );
}
