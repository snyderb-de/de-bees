import { COUNTIES, toRoman, type County } from "./keepers";

export type AtlasBrowseCounty = County | "All";

export type AtlasBrowsePlot = {
  slug: string;
  county: County;
};

export type AtlasBrowseState<TPlot extends AtlasBrowsePlot> = {
  county: AtlasBrowseCounty;
  plots: TPlot[];
  selected?: TPlot;
  selectedIndex: number;
  previous?: TPlot;
  next?: TPlot;
  total: number;
  countyTotals: Record<County, number>;
  pageLabel: string;
};

export function buildCountyBrowseState<TPlot extends AtlasBrowsePlot>(
  plots: TPlot[],
  county: AtlasBrowseCounty,
  selectedSlug = "",
): AtlasBrowseState<TPlot> {
  const visiblePlots =
    county === "All" ? plots : plots.filter((plot) => plot.county === county);
  const selectedIndex = Math.max(
    0,
    visiblePlots.findIndex((plot) => plot.slug === selectedSlug),
  );
  const selected = visiblePlots[selectedIndex];
  const total = visiblePlots.length;
  const previous = total > 0 ? visiblePlots[(selectedIndex - 1 + total) % total] : undefined;
  const next = total > 0 ? visiblePlots[(selectedIndex + 1) % total] : undefined;

  return {
    county,
    plots: visiblePlots,
    selected,
    selectedIndex: selected ? selectedIndex : -1,
    previous,
    next,
    total,
    countyTotals: countByCounty(plots),
    pageLabel: selected ? `${toRoman(selectedIndex + 1)} / ${toRoman(total)}` : "",
  };
}

function countByCounty(plots: AtlasBrowsePlot[]): Record<County, number> {
  return COUNTIES.reduce(
    (totals, county) => {
      totals[county] = plots.filter((plot) => plot.county === county).length;
      return totals;
    },
    {
      "New Castle": 0,
      Kent: 0,
      Sussex: 0,
    } satisfies Record<County, number>,
  );
}
