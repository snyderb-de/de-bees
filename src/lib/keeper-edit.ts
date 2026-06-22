import type { County, Keeper } from "./keepers";

export type KeeperDetailsDraft = {
  keeper: string;
  business: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  whereToBuyText: string;
  counties: County[];
  swarm: boolean;
  cutout: boolean;
};

export type KeeperDetailsEdit = {
  keeper?: string;
  business?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  whereToBuy?: string[] | null;
  counties?: County[];
  services?: Keeper["services"];
};

export function draftFromKeeper(keeper: Keeper): KeeperDetailsDraft {
  return {
    keeper: keeper.keeper,
    business: keeper.business ?? "",
    email: keeper.email ?? "",
    phone: keeper.phone ?? "",
    website: keeper.website ?? "",
    address: keeper.address ?? "",
    whereToBuyText: (keeper.whereToBuy ?? []).join("\n"),
    counties: keeper.counties,
    swarm: keeper.services.swarm,
    cutout: keeper.services.cutout,
  };
}

export function keeperEditFromDraft(draft: KeeperDetailsDraft): KeeperDetailsEdit {
  const whereToBuy = draft.whereToBuyText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return removeUndefined({
    keeper: trimOrUndefined(draft.keeper),
    business: trimOrNull(draft.business),
    email: trimOrNull(draft.email),
    phone: trimOrNull(draft.phone),
    website: trimOrNull(draft.website),
    address: trimOrNull(draft.address),
    whereToBuy: whereToBuy.length ? whereToBuy : null,
    counties: draft.counties.length ? draft.counties : undefined,
    services: {
      swarm: draft.swarm,
      cutout: draft.cutout,
    },
  });
}

export function applyKeeperEdit(keeper: Keeper, edit: KeeperDetailsEdit): Keeper {
  return {
    ...keeper,
    keeper: edit.keeper ?? keeper.keeper,
    business: edit.business === null ? undefined : edit.business ?? keeper.business,
    email: edit.email === null ? undefined : edit.email ?? keeper.email,
    phone: edit.phone === null ? undefined : edit.phone ?? keeper.phone,
    website: edit.website === null ? undefined : edit.website ?? keeper.website,
    address: edit.address === null ? undefined : edit.address ?? keeper.address,
    whereToBuy: edit.whereToBuy === null ? undefined : edit.whereToBuy ?? keeper.whereToBuy,
    counties: edit.counties ?? keeper.counties,
    services: edit.services ?? keeper.services,
  };
}

export function keeperEditIsEmpty(keeper: Keeper, edit: KeeperDetailsEdit) {
  return (
    JSON.stringify(comparableKeeper(applyKeeperEdit(keeper, edit))) ===
    JSON.stringify(comparableKeeper(keeper))
  );
}

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function removeUndefined(edit: KeeperDetailsEdit): KeeperDetailsEdit {
  return Object.fromEntries(
    Object.entries(edit).filter(([, value]) => value !== undefined),
  ) as KeeperDetailsEdit;
}

function comparableKeeper(keeper: Keeper) {
  return {
    slug: keeper.slug,
    keeper: keeper.keeper,
    business: keeper.business ?? "",
    counties: keeper.counties,
    email: keeper.email ?? "",
    phone: keeper.phone ?? "",
    website: keeper.website ?? "",
    address: keeper.address ?? "",
    whereToBuy: keeper.whereToBuy ?? [],
    services: {
      swarm: keeper.services.swarm,
      cutout: keeper.services.cutout,
    },
  };
}
