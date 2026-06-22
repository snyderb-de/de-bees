// Site-level facts and constants. Delaware specifics are real; figures are
// drawn from the Delaware Dept. of Agriculture's honeybee program.

import type { County } from "./keepers";

export const SITE = {
  name: "DE Bees",
  short: "DE Bees",
  tagline: "Delaware beekeepers, county by county.",
  // Contact for the "Get Listed" form (mailto). Replace with the real inbox.
  contactEmail: "register@apiaryledger.example",
};

// Headline statistics for the State of Delaware (Dept. of Agriculture).
export const STATE_STATS = {
  colonies: 7200,
  industryValue: "$2.5M",
  cropValue: "$30M",
  countiesCount: 3,
  associationFounded: 1936,
};

export interface CountyInfo {
  name: County;
  seat: string;
  note: string;
}

export const COUNTY_INFO: CountyInfo[] = [
  {
    name: "New Castle",
    seat: "Wilmington",
    note: "Wooded Piedmont in the north — tulip poplar, suburban apiaries, and the association's oldest branch.",
  },
  {
    name: "Kent",
    seat: "Dover",
    note: "The marshy middle — river bottoms, the capital's backyard hives, and birding country at Bombay Hook.",
  },
  {
    name: "Sussex",
    seat: "Georgetown",
    note: "The agricultural south — the bulk of the state's colonies, pollination contracts, and coastal wildflower.",
  },
];

// What's flowing, by season — the Delaware nectar calendar.
export interface Bloom {
  season: "Spring" | "Summer" | "Autumn";
  months: string;
  sources: string[];
  character: string;
}

export const BLOOM_CALENDAR: Bloom[] = [
  {
    season: "Spring",
    months: "Apr – Jun",
    sources: ["Tulip poplar", "Black locust", "Holly", "Fruit blossom"],
    character: "The big flow. Dark, mineral tulip-poplar honey defines the Delaware spring.",
  },
  {
    season: "Summer",
    months: "Jun – Aug",
    sources: ["Clover", "Wildflower", "Soybean", "Salt-marsh herbs"],
    character: "Lighter, floral honeys — and the busy season for pollination contracts.",
  },
  {
    season: "Autumn",
    months: "Sep – Oct",
    sources: ["Goldenrod", "Aster", "Knotweed"],
    character: "The last, assertive flow. Dark goldenrod honey and the smell of the closing hive.",
  },
];

export interface Club {
  branch: string;
  county: County;
  meets: string;
}

export const CLUBS: Club[] = [
  {
    branch: "New Castle County Branch",
    county: "New Castle",
    meets: "Monthly · DSP Troop 2, Newark",
  },
  {
    branch: "Kent County Branch",
    county: "Kent",
    meets: "Monthly · State Police Troop 3, Camden",
  },
  {
    branch: "Sussex County Branch",
    county: "Sussex",
    meets: "Monthly · Georgetown area",
  },
];

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/keepers", label: "Register" },
  { href: "/services", label: "Services" },
];
