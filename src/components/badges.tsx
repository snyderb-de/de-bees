import type { Offering } from "@/lib/keepers";

/** A trust/method chip — "Raw", "Treatment-free", "Registered apiary", … */
export function MethodBadge({ label }: { label: string }) {
  const isRegistered = label.toLowerCase().includes("registered");
  return (
    <span
      className="mono inline-flex items-center gap-1 border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em]"
      style={
        isRegistered
          ? { borderColor: "var(--honey)", color: "var(--ink)", background: "color-mix(in srgb, var(--honey) 16%, transparent)" }
          : { borderColor: "var(--rule)", color: "var(--ink-soft)" }
      }
    >
      {isRegistered && <span aria-hidden>✦</span>}
      {label}
    </span>
  );
}

const SERVICE_OFFERINGS: Offering[] = [
  "Pollination",
  "Swarm Removal",
  "Structural Cut-Outs",
  "Nucs & Queens",
  "Package Bees",
  "Classes & Mentoring",
];

/** An offering/service tag; services are tinted oxblood to stand apart from goods. */
export function OfferingTag({ label }: { label: Offering }) {
  const isService = SERVICE_OFFERINGS.includes(label);
  return (
    <span
      className="mono inline-block border-b px-0 py-0.5 text-[0.7rem] tracking-[0.04em]"
      style={{
        color: isService ? "var(--oxblood)" : "var(--ink-soft)",
        borderColor: isService ? "color-mix(in srgb, var(--oxblood) 40%, transparent)" : "var(--rule-soft)",
      }}
    >
      {label}
    </span>
  );
}
