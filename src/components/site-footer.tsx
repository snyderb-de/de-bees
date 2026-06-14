import Link from "next/link";
import { NAV, SITE, STATE_STATS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--rule)] bg-[color:var(--paper-2)]">
      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2 className="display title-m">The Apiary Ledger of Delaware</h2>
            <p className="lede mt-3 max-w-sm text-[1.02rem]">
              A standing register of the keepers and honey of the First State —
              kept so that good honey, and the people who make it, can be found.
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="eyebrow mb-4">The Register</h3>
            <ul className="space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ink-link !text-[0.72rem]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow mb-4">Be Inscribed</h3>
            <p className="mb-4 text-[0.95rem] text-[color:var(--ink-soft)]">
              Keep bees in Delaware? Add your apiary to the register — free for
              every keeper in the state.
            </p>
            <Link href="/get-listed" className="btn-gilt">
              Get Listed
            </Link>
          </div>
        </div>

        <hr className="hairline-soft my-10" />

        <div className="flex flex-col gap-3 text-[0.72rem] text-[color:var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p className="mono">
            Set in Fraunces, Newsreader &amp; IBM Plex Mono · Printed for the
            keepers of the First State
          </p>
          <p className="mono">
            {STATE_STATS.colonies.toLocaleString()} colonies · {STATE_STATS.countiesCount}{" "}
            counties · est. {STATE_STATS.associationFounded}
          </p>
        </div>
        <p className="mono mt-4 text-[0.66rem] text-[color:var(--ink-faint)]">
          An independent showcase. Listings drawn from the Delaware Dept. of
          Agriculture&apos;s 2026 registered beekeeper lists; business contacts
          only. Not affiliated with the Dept. of Agriculture. ·{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline">
            {SITE.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
