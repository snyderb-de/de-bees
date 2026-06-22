import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { County } from "./keepers";
import { buildCountyBrowseState, type AtlasBrowsePlot } from "./atlas-browse";

function plot(slug: string, county: County): AtlasBrowsePlot {
  return { slug, county };
}

describe("buildCountyBrowseState", () => {
  const plots = [
    plot("new-castle-a", "New Castle"),
    plot("new-castle-b", "New Castle"),
    plot("kent-a", "Kent"),
    plot("kent-b", "Kent"),
    plot("sussex-a", "Sussex"),
  ];

  it("keeps browsing inside the active county", () => {
    const state = buildCountyBrowseState(plots, "Kent", "new-castle-a");

    assert.deepEqual(
      state.plots.map((entry) => entry.slug),
      ["kent-a", "kent-b"],
    );
    assert.equal(state.selected?.slug, "kent-a");
    assert.equal(state.previous?.slug, "kent-b");
    assert.equal(state.next?.slug, "kent-b");
    assert.equal(state.pageLabel, "I / II");
  });

  it("wraps previous and next within the county list", () => {
    const state = buildCountyBrowseState(plots, "New Castle", "new-castle-b");

    assert.equal(state.selectedIndex, 1);
    assert.equal(state.previous?.slug, "new-castle-a");
    assert.equal(state.next?.slug, "new-castle-a");
    assert.equal(state.pageLabel, "II / II");
  });

  it("reports county totals for the calm overview controls", () => {
    const state = buildCountyBrowseState(plots, "All", "sussex-a");

    assert.equal(state.total, 5);
    assert.deepEqual(state.countyTotals, {
      "New Castle": 2,
      Kent: 2,
      Sussex: 1,
    });
    assert.equal(state.selected?.slug, "sussex-a");
    assert.equal(state.pageLabel, "V / V");
  });
});
