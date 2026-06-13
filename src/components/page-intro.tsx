import type { ReactNode } from "react";

/** Standard interior-page masthead: eyebrow, plate-style title, lede. */
export function PageIntro({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-[1180px] px-5 pt-16 pb-10 sm:px-8 sm:pt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display title-l mt-4 max-w-4xl">{title}</h1>
      {intro && <p className="lede mt-6 max-w-2xl">{intro}</p>}
      {children}
      <hr className="hairline mt-10" />
    </header>
  );
}
