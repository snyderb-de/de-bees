"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

import curtis from "@/assets/plates/curtis-1839.jpg";
import clover from "@/assets/plates/clover-1905.jpg";
import snodgrassDorsal from "@/assets/plates/snodgrass-1910-dorsal.jpg";
import buckwheat from "@/assets/plates/buckwheat-1887.jpg";
import tulipPoplar from "@/assets/plates/tulip-poplar-1868.jpg";

interface Plate {
  src: StaticImageData;
  numeral: string;
  /** italic species line, e.g. "Trifolium pratense — red clover" */
  title: string;
  credit: string;
  alt: string;
}

/**
 * A small register of the bee and the blooms it works in Delaware — historical
 * plates cross-faded slowly. Bees and the nectar flowers alternate.
 */
const PLATES: Plate[] = [
  {
    src: curtis,
    numeral: "I",
    title: "Apis mellifera — the western honeybee",
    credit: "Curtis, British Entomology, 1839",
    alt: "Hand-coloured copperplate of the honeybee — worker, queen and drone with comb — Curtis, British Entomology, 1839",
  },
  {
    src: clover,
    numeral: "II",
    title: "Trifolium pratense — red clover",
    credit: "Thomé, Flora von Deutschland, 1905",
    alt: "Victorian botanical chromolithograph of red clover — Thomé, Flora von Deutschland, 1905",
  },
  {
    src: snodgrassDorsal,
    numeral: "III",
    title: "Apis mellifera — the western honeybee",
    credit: "Snodgrass, Anatomy of the Honey Bee, 1910",
    alt: "Dorsal view of the honeybee's segmented body — Snodgrass, Anatomy of the Honey Bee, 1910",
  },
  {
    src: buckwheat,
    numeral: "IV",
    title: "Fagopyrum esculentum — buckwheat",
    credit: "Millspaugh, American Medicinal Plants, 1887",
    alt: "Victorian botanical plate of buckwheat in flower — Millspaugh, American Medicinal Plants, 1887",
  },
  {
    src: tulipPoplar,
    numeral: "V",
    title: "Liriodendron tulipifera — tulip poplar",
    credit: "Witte, Flora, 1868",
    alt: "Victorian botanical chromolithograph of the tulip poplar in flower — Witte, Flora, 1868",
  },
];

const HOLD_MS = 6500;

export function PlateShow() {
  const [i, setI] = useState(0);

  useEffect(() => {
    // Calm by default, but honour a reduced-motion preference: hold on one plate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = setInterval(() => setI((n) => (n + 1) % PLATES.length), HOLD_MS);
    return () => clearInterval(t);
  }, []);

  const cur = PLATES[i];

  return (
    <>
      <p
        key={`n${i}`}
        className="mono plate-fade mb-3 text-center text-[0.66rem] uppercase tracking-[0.28em] text-[color:var(--oxblood)]"
      >
        Plate {cur.numeral}
      </p>

      <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] overflow-hidden border border-[color:var(--rule)] bg-[color:var(--paper)] shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        {PLATES.map((p, idx) => (
          <Image
            key={p.src.src}
            src={p.src}
            alt={p.alt}
            sizes="(min-width: 1024px) 300px, 80vw"
            placeholder="blur"
            priority={idx === 0}
            aria-hidden={idx !== i}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-in-out ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <p
        key={`t${i}`}
        className="plate-fade mt-3 text-center font-[family-name:var(--font-display)] italic text-[color:var(--ink-soft)]"
        style={{ fontVariationSettings: '"opsz" 30, "SOFT" 40' }}
      >
        {cur.title}
      </p>
      <p
        key={`c${i}`}
        className="mono plate-fade mt-1 text-center text-[0.6rem] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]"
      >
        {cur.credit}
      </p>
    </>
  );
}
