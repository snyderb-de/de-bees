import type { Keeper } from "@/lib/keepers";

/** Swarm / cut-out service chips, tinted oxblood. */
export function ServiceBadges({ services }: { services: Keeper["services"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {services.swarm && <ServiceChip label="Swarm collection" />}
      {services.cutout && <ServiceChip label="Structural cut-outs" />}
    </div>
  );
}

export function ServiceChip({ label }: { label: string }) {
  return (
    <span className="mono inline-flex items-center gap-1 border border-[color:var(--oxblood)] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[color:var(--oxblood)]">
      {label}
    </span>
  );
}

/** A neutral county chip. */
export function CountyChip({ label }: { label: string }) {
  return (
    <span className="mono inline-flex items-center border border-[color:var(--rule)] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
      {label}
    </span>
  );
}
