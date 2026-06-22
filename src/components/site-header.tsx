"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="atlas-site-header" aria-label="Site">
      <Link href="/" className="atlas-brand" aria-label={SITE.name}>
        <span className="atlas-brand-mark" aria-hidden>
          DB
        </span>
        <span>{SITE.short}</span>
      </Link>

      <nav className="atlas-nav" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
