// The Register — REAL data.
//
// Source: Delaware Department of Agriculture, 2026 Registered Beekeepers
// Swarm Removal List and Honey Bee Cut Out List (State Apiarist Jennylyn
// Redner, updated 2026-02-12).
//
// PRIVACY: the state lists include personal cell numbers and personal email
// addresses. Those are deliberately NOT stored here. We keep only business /
// storefront contacts (an address on the business's own domain, or one
// registered to the business). Missing business contacts can be added later.

export type County = "New Castle" | "Kent" | "Sussex";

export const COUNTIES: County[] = ["New Castle", "Kent", "Sussex"];

export interface Services {
  swarm: boolean; // collects loose swarms
  cutout: boolean; // removes colonies from structures (may charge a fee)
}

export interface Keeper {
  slug: string;
  keeper: string; // person's name, as registered
  business?: string; // apiary / business name, if registered with one
  counties: County[]; // counties they serve
  // Business-only contact (see PRIVACY note above). Phones/sites below are the
  // ones a business publishes on its own pages, not the personal swarm-list cell.
  email?: string;
  phone?: string;
  website?: string;
  address?: string; // public farm/storefront address
  whereToBuy?: string[]; // retail partners + farmers markets
  services: Services;
}

// Ordered with named apiaries first so the register and featured plates lead
// with businesses; plate numbers follow this order.
export const KEEPERS: Keeper[] = [
  {
    slug: "douglas-bee-apiary",
    keeper: "Duane Douglas",
    business: "Douglas Bee Apiary Co.",
    counties: ["New Castle", "Kent"],
    email: "douglasbeeapiary@gmail.com",
    phone: "302-358-7218",
    website: "https://www.douglasbeeapiary.com",
    address: "1901 N DuPont Hwy, New Castle, DE",
    services: { swarm: true, cutout: true },
  },
  {
    slug: "big-joes-honey",
    keeper: "Joseph & Theresa Nicolai",
    business: "Big Joe's Honey",
    counties: ["Kent"],
    email: "bigjoeshoney@verizon.net",
    phone: "302-697-2830",
    website: "https://www.facebook.com/bigjoeshoney",
    whereToBuy: [
      "Story Hill Farm store, Felton",
      "Historic Odessa Brewfest",
      "Facebook for market dates",
    ],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "carey-apiary",
    keeper: "Patrick Carey",
    business: "The Carey Apiary and Farm, LLC",
    counties: ["New Castle", "Kent", "Sussex"],
    email: "patrick@careyapiary.com",
    phone: "302-245-9537",
    website: "https://www.careyapiary.com",
    address: "31026 Frankford School Rd, Frankford, DE",
    whereToBuy: [
      "Farm store & online shop",
      "Flutterby House",
      "Story Hill Farm",
      "Inland Bay Garden",
    ],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "gravesyard-apiary",
    keeper: "Joe & Joanne Graves",
    business: "Gravesyard Apiary",
    counties: ["New Castle"],
    email: "queenbee@gravesyardapiary.com",
    phone: "302-598-0686",
    website: "https://www.gravesyardapiary.com",
    address: "31a Meadow Rd, New Castle, DE",
    whereToBuy: [
      "Wilmington Downtown Farmers Market",
      "Brandywine Park Farmers Market",
    ],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "against-the-grain-farm",
    keeper: "Toby Hagerott",
    business: "Against the Grain Farm",
    counties: ["Kent"],
    email: "info@atg.farm",
    website: "https://www.atg.farm",
    address: "807 Frenchtown Rd E, New Castle, DE",
    whereToBuy: ["Newark Co-op Farmers Market (Sundays)"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "hopkins-bee-farms",
    keeper: "Jim Hopkins",
    business: "Hopkins Bee Farms",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "sweet-bee-apiary",
    keeper: "Emily Laird",
    business: "Sweet Bee Apiary",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "magnolia-honey",
    keeper: "Jeanette Hammon",
    business: "Magnolia Honey Co.",
    counties: ["Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "abbotts-and-oak",
    keeper: "Jeffery Peck",
    business: "Abbott's & Oak Farms, LLC",
    counties: ["Kent", "Sussex"],
    website: "https://abbottsandoak.com",
    address: "7910 Old Oak Lane, Milford, DE",
    whereToBuy: ["On-farm store & you-cut, Milford"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "ss-apiaries",
    keeper: "David & Heather Cook",
    business: "S&S Apiaries",
    counties: ["New Castle", "Kent", "Sussex"],
    website: "https://www.ssapiaries.com",
    services: { swarm: true, cutout: true },
  },
  {
    slug: "okurrrbee",
    keeper: "Mehmet Okur",
    business: "Okurrrbee",
    counties: ["New Castle", "Kent", "Sussex"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "patriot-acres-apiary",
    keeper: "Sherry Armstrong-Kerns",
    business: "Patriot Acres Apiary, LLC",
    counties: ["Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "coon-den-apiary",
    keeper: "Stephen Brittin",
    business: "Coon Den Apiary",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "clays-bees",
    keeper: "William Walton",
    business: "Clay's Bees",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "heritage-honey",
    keeper: "Sandra Clay",
    business: "Heritage Honey",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "jds-bees",
    keeper: "Ryanjo Florendo",
    business: "JD's Bees",
    counties: ["New Castle", "Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "thornes-bees-and-things",
    keeper: "Andrew Thorne",
    business: "Thorne's Bee's and Thing's",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "stewards-of-nature",
    keeper: "Elise Altergott",
    business: "Stewards of Nature",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "custom-aircraft",
    keeper: "Brooks Cooley",
    business: "Custom Aircraft, LLC",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "lawn-solutions",
    keeper: "Mitch Riley",
    business: "Lawn Solutions",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  // ---- Registered keepers without a listed business name ----
  {
    slug: "brian-trumbull",
    keeper: "Brian Trumbull",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "jamin-smith",
    keeper: "Jamin Smith",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "mark-cullen",
    keeper: "Mark Cullen",
    counties: ["New Castle"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "matthew-johns",
    keeper: "Matthew Johns",
    counties: ["New Castle", "Kent"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "meryem-dede",
    keeper: "Meryem Dede",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "michael-krzyzanowski",
    keeper: "Michael Krzyzanowski",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "michael-rodgers",
    keeper: "Michael Rodgers",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "monika-zelaya",
    keeper: "Monika Zelaya",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "philip-czerniak",
    keeper: "Philip Czerniak",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "rick-francolino",
    keeper: "Rick Francolino",
    counties: ["New Castle", "Kent"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "roseann-harkins",
    keeper: "Roseann Harkins",
    counties: ["New Castle"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "timothy-conner",
    keeper: "Timothy Conner",
    counties: ["New Castle", "Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "daniel-macklin",
    keeper: "Daniel Macklin",
    counties: ["Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "harry-downes",
    keeper: "Harry Downes",
    counties: ["Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "james-pippin",
    keeper: "James Pippin",
    counties: ["Kent"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "john-hunter",
    keeper: "John Hunter",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "melvyn-miller",
    keeper: "Melvyn Miller",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "rachel-tesoro",
    keeper: "Rachel Tesoro",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "steven-lemarble",
    keeper: "Steven Lemarble",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "william-hermstedt",
    keeper: "William Hermstedt",
    counties: ["Kent", "Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "christopher-dominic",
    keeper: "Christopher Dominic",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "dean-clark",
    keeper: "Dean Clark",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "greg-menoche",
    keeper: "Greg Menoche",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "kerry-stewart",
    keeper: "Kerry Stewart",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "pam-hepp",
    keeper: "Pam Hepp",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
  {
    slug: "thomas-babcock",
    keeper: "Thomas Babcock",
    counties: ["Sussex"],
    services: { swarm: true, cutout: true },
  },
  {
    slug: "william-hancock",
    keeper: "William Hancock",
    counties: ["Sussex"],
    services: { swarm: true, cutout: false },
  },
];

export const SOURCE = {
  apiarist: "Jennylyn Redner",
  agency: "Delaware Department of Agriculture",
  updated: "February 2026",
  feeNote: "Cut-out services may require a fee.",
  registrationUrl:
    "https://survey123.arcgis.com/share/e055e4d26b3b4b92b9d73215c77b763c",
  honeybeesUrl: "https://agriculture.delaware.gov/plant-industries/honeybees/",
  swarmListUrl:
    "https://agriculture.delaware.gov/wp-content/uploads/sites/108/2026/02/2026-Honey-Bee-Swarm-Removal-List.pdf",
  cutoutListUrl:
    "https://agriculture.delaware.gov/wp-content/uploads/sites/108/2026/02/2026-Honey-Bee-Cutout-List.pdf",
  driftwatchUrl: "https://agriculture.delaware.gov/pesticide-management/driftwatch/",
  contactPhone: "302-698-4585",
};

// ---- Derived helpers ----------------------------------------------------

export function getKeeper(slug: string): Keeper | undefined {
  return KEEPERS.find((k) => k.slug === slug);
}

/**
 * Whether you can actually buy a keeper's honey — they publish a shop, a farm
 * address, or a market. The state lists don't tag "sells honey" directly, so a
 * public storefront is the honest proxy. (True per-product tags arrive with
 * self-serve keeper submissions.)
 */
export function hasStorefront(k: Keeper): boolean {
  return Boolean(k.website || k.address || (k.whereToBuy && k.whereToBuy.length));
}

/** Case-insensitive match across a keeper's name, business, counties, and place. */
export function keeperMatches(k: Keeper, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [k.keeper, k.business ?? "", k.counties.join(" "), k.address ?? "", (k.whereToBuy ?? []).join(" ")]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function keepersInCounty(county: County): Keeper[] {
  return KEEPERS.filter((k) => k.counties.includes(county));
}

export function swarmKeepers(): Keeper[] {
  return KEEPERS.filter((k) => k.services.swarm);
}

export function cutoutKeepers(): Keeper[] {
  return KEEPERS.filter((k) => k.services.cutout);
}

/** Keepers that registered a business name — used for the map's hive pins. */
export function namedApiaries(): Keeper[] {
  return KEEPERS.filter((k) => k.business);
}

/** 1-based plate number, in register order. */
export function plateNo(slug: string): number {
  return KEEPERS.findIndex((k) => k.slug === slug) + 1;
}

const ROMAN: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
  [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
  [5, "V"], [4, "IV"], [1, "I"],
];

export function toRoman(n: number): string {
  let out = "";
  for (const [v, s] of ROMAN) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}
