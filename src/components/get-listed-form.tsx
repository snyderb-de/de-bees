"use client";

import { useState } from "react";
import { ALL_OFFERINGS, COUNTIES, type County, type Offering } from "@/lib/keepers";
import { SITE } from "@/lib/site";

export function GetListedForm() {
  const [apiary, setApiary] = useState("");
  const [keeper, setKeeper] = useState("");
  const [email, setEmail] = useState("");
  const [town, setTown] = useState("");
  const [county, setCounty] = useState<County>("New Castle");
  const [hives, setHives] = useState("");
  const [store, setStore] = useState("");
  const [offerings, setOfferings] = useState<Offering[]>(["Raw Honey"]);
  const [about, setAbout] = useState("");

  function toggle(o: Offering) {
    setOfferings((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      `Apiary: ${apiary}`,
      `Keeper: ${keeper}`,
      `Email: ${email}`,
      `Town: ${town}`,
      `County: ${county}`,
      `Hives: ${hives}`,
      `Store / link: ${store}`,
      `Offers: ${offerings.join(", ")}`,
      "",
      "About the apiary:",
      about,
    ].join("\n");
    const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
      `Register my apiary — ${apiary || "new keeper"}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Apiary name" required>
          <input className="dgl-input" value={apiary} onChange={(e) => setApiary(e.target.value)} required placeholder="e.g. Cypress Branch Bees" />
        </Field>
        <Field label="Your name" required>
          <input className="dgl-input" value={keeper} onChange={(e) => setKeeper(e.target.value)} required placeholder="Who keeps the bees" />
        </Field>
        <Field label="Email" required>
          <input type="email" className="dgl-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
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
        <Field label="Number of hives">
          <input className="dgl-input" value={hives} onChange={(e) => setHives(e.target.value)} inputMode="numeric" placeholder="e.g. 24" />
        </Field>
      </div>

      <Field label="Store or website (optional)">
        <input className="dgl-input" value={store} onChange={(e) => setStore(e.target.value)} placeholder="https://…" />
      </Field>

      <fieldset>
        <legend className="eyebrow mb-3">What do you offer?</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_OFFERINGS.map((o) => {
            const on = offerings.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                aria-pressed={on}
                className="mono border px-3 py-1.5 text-[0.7rem] tracking-[0.04em] transition-colors"
                style={{
                  borderColor: on ? "var(--ink)" : "var(--rule)",
                  background: on ? "var(--ink)" : "transparent",
                  color: on ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {o}
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
          Opens your email to send it to the keeper of the ledger. Free, always.
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
