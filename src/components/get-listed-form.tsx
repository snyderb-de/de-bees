"use client";

import { useState } from "react";
import { COUNTIES, type County } from "@/lib/keepers";
import { SITE } from "@/lib/site";

const SERVICES = [
  "Swarm removal",
  "Structural cut-outs",
  "Sell honey / products",
  "Nucs, queens or bees",
  "Pollination",
  "Classes / mentoring",
];

export function GetListedForm() {
  const [business, setBusiness] = useState("");
  const [keeper, setKeeper] = useState("");
  const [email, setEmail] = useState("");
  const [town, setTown] = useState("");
  const [county, setCounty] = useState<County>("New Castle");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [about, setAbout] = useState("");

  function toggle(s: string) {
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      `Business / apiary: ${business}`,
      `Keeper: ${keeper}`,
      `Email: ${email}`,
      `Town: ${town}`,
      `County: ${county}`,
      `Website / storefront: ${website}`,
      `Offers: ${services.join(", ")}`,
      "",
      "About the apiary:",
      about,
    ].join("\n");
    const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
      `Register my apiary — ${business || keeper || "new keeper"}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Business / apiary name">
          <input className="dgl-input" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="e.g. Gravesyard Apiary" />
        </Field>
        <Field label="Your name" required>
          <input className="dgl-input" value={keeper} onChange={(e) => setKeeper(e.target.value)} required placeholder="Who keeps the bees" />
        </Field>
        <Field label="Business email" required>
          <input type="email" className="dgl-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="hello@yourapiary.com" />
        </Field>
        <Field label="Home town" required>
          <input className="dgl-input" value={town} onChange={(e) => setTown(e.target.value)} required placeholder="e.g. Milton" />
        </Field>
        <Field label="County" required>
          <select className="dgl-input" value={county} onChange={(e) => setCounty(e.target.value as County)}>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Website / storefront (optional)">
          <input className="dgl-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
        </Field>
      </div>

      <fieldset>
        <legend className="eyebrow mb-3">What do you offer?</legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={on}
                className="mono border px-3 py-1.5 text-[0.7rem] tracking-[0.04em] transition-colors"
                style={{
                  borderColor: on ? "var(--ink)" : "var(--rule)",
                  background: on ? "var(--ink)" : "transparent",
                  color: on ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Tell us about your apiary">
        <textarea
          className="dgl-input min-h-[120px] resize-y"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Your honey, your methods, your story — a few sentences we can shape into your plate."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 border-t border-[color:var(--rule)] pt-6">
        <button type="submit" className="btn-gilt">
          Send my listing
        </button>
        <p className="mono text-[0.66rem] leading-[1.6] tracking-[0.04em] text-[color:var(--ink-faint)]">
          Opens your email to send it to the keeper of the ledger. Free, always. We only
          publish business contacts — never personal cell numbers.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">
        {label}
        {required && <span style={{ color: "var(--oxblood)" }}> *</span>}
      </span>
      {children}
    </label>
  );
}
