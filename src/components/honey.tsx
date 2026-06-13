import {
  GRADE_HEX,
  GRADE_LABEL,
  type HoneyGrade,
  type Varietal,
} from "@/lib/keepers";

const ORDER: HoneyGrade[] = [
  "water-white",
  "extra-light",
  "light-amber",
  "amber",
  "dark-amber",
];

/** A small filled drop/dot of the honey at its colour grade. */
export function GradeDot({ grade, size = 16 }: { grade: HoneyGrade; size?: number }) {
  return (
    <span
      title={GRADE_LABEL[grade]}
      className="inline-block rounded-full align-middle"
      style={{
        width: size,
        height: size,
        background: GRADE_HEX[grade],
        boxShadow: "inset 0 0 0 1px rgba(31,46,41,0.3)",
      }}
    />
  );
}

/** The five-step Pfund colour scale with this varietal's grade marked. */
export function GradeScale({ grade, label = true }: { grade: HoneyGrade; label?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-3 w-32 overflow-hidden border border-[color:var(--rule)]">
        {ORDER.map((g) => (
          <span
            key={g}
            className="flex-1"
            style={{
              background: GRADE_HEX[g],
              boxShadow: g === grade ? "inset 0 0 0 2px var(--ink)" : "none",
            }}
          />
        ))}
      </div>
      {label && (
        <span className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--ink-soft)]">
          {GRADE_LABEL[grade]}
        </span>
      )}
    </div>
  );
}

/** A full varietal entry as it appears on a keeper's plate. */
export function VarietalEntry({ v }: { v: Varietal }) {
  return (
    <li className="border-t border-[color:var(--rule-soft)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="font-[family-name:var(--font-display)] text-[1.3rem]" style={{ fontVariationSettings: '"opsz" 36, "SOFT" 30' }}>
          {v.name}
        </h4>
        <span className="mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--oxblood)]">
          {v.season}
        </span>
      </div>
      <p className="mt-1 mb-3 italic text-[color:var(--ink-soft)]">{v.notes}</p>
      <GradeScale grade={v.grade} />
    </li>
  );
}
