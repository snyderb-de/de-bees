"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[color:var(--rule)] backdrop-blur-[2px]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--paper) 88%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8"
        style={{ height: compact ? 60 : 76, transition: "height .3s ease" }}>
        {/* wordmark */}
        <Link href="/" className="group flex items-center gap-3" aria-label={SITE.name}>
          <HexMark />
          <span className="leading-none">
            <span className="block font-[family-name:var(--font-display)] text-[1.15rem] sm:text-[1.3rem]" style={{ fontVariationSettings: '"opsz" 40, "SOFT" 30' }}>
              The Apiary Ledger
            </span>
            <span className="mono mt-[3px] block text-[0.58rem] uppercase tracking-[0.34em] text-[color:var(--ink-faint)]">
              of Delaware
            </span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="mono text-[0.72rem] uppercase tracking-[0.16em] transition-colors hover:text-[color:var(--oxblood)]"
                style={{ color: active ? "var(--oxblood)" : "var(--ink)" }}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/get-listed" className="btn-gilt !py-[0.6rem] !px-[1rem] text-[0.68rem]">
            Get Listed
          </Link>
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center border border-[color:var(--rule)]"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="mono text-base">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* mobile panel */}
      {open && (
        <nav
          className="lg:hidden border-t border-[color:var(--rule)] bg-[color:var(--paper)] px-5 py-4"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-[color:var(--rule-soft)]">
                <Link
                  href={item.href}
                  className="mono block py-3 text-[0.8rem] uppercase tracking-[0.16em]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link href="/get-listed" className="btn-gilt w-full justify-center">
                Get Listed
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function HexMark() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden className="shrink-0">
      <path
        d="M13 1.5 24 7.75v12.5L13 28.5 2 20.25V7.75z"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      <path
        d="M13 8.5c2.4 0 4 2 4 4.5s-2 5-4 6.5c-2-1.5-4-4-4-6.5s1.6-4.5 4-4.5Z"
        fill="var(--honey)"
        stroke="none"
      />
    </svg>
  );
}
