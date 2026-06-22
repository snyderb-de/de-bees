import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Keeper } from "./keepers";
import {
  draftFromKeeper,
  keeperEditFromDraft,
  keeperEditIsEmpty,
  applyKeeperEdit,
} from "./keeper-edit";

const keeper: Keeper = {
  slug: "test-apiary",
  keeper: "Taylor Reed",
  business: "Test Apiary",
  counties: ["Kent"],
  email: "hello@test.example",
  website: "https://test.example",
  address: "10 Bee Road, Dover, DE",
  whereToBuy: ["Farm stand", "Saturday market"],
  services: { swarm: true, cutout: false },
};

describe("keeper edit drafts", () => {
  it("normalizes a draft only when Save is requested", () => {
    const draft = draftFromKeeper(keeper);
    draft.business = "  ";
    draft.phone = " 302-555-0199 ";
    draft.whereToBuyText = " Farm store \n\n  Market table  ";
    draft.cutout = true;

    const edit = keeperEditFromDraft(draft);

    assert.deepEqual(edit, {
      keeper: "Taylor Reed",
      business: null,
      phone: "302-555-0199",
      website: "https://test.example",
      email: "hello@test.example",
      address: "10 Bee Road, Dover, DE",
      whereToBuy: ["Farm store", "Market table"],
      counties: ["Kent"],
      services: { swarm: true, cutout: true },
    });
  });

  it("can detect an unchanged draft so the Save button stays quiet", () => {
    const draft = draftFromKeeper(keeper);
    const edit = keeperEditFromDraft(draft);

    assert.equal(keeperEditIsEmpty(keeper, edit), true);
  });

  it("detects service-only changes as unsaved edits", () => {
    const draft = draftFromKeeper(keeper);
    draft.cutout = true;

    const edit = keeperEditFromDraft(draft);

    assert.equal(keeperEditIsEmpty(keeper, edit), false);
  });

  it("applies a saved edit without mutating the source keeper", () => {
    const edited = applyKeeperEdit(keeper, {
      business: "Saved Apiary",
      counties: ["New Castle", "Kent"],
      services: { swarm: true, cutout: true },
    });

    assert.equal(keeper.business, "Test Apiary");
    assert.equal(edited.business, "Saved Apiary");
    assert.deepEqual(edited.counties, ["New Castle", "Kent"]);
    assert.deepEqual(edited.services, { swarm: true, cutout: true });
  });
});
