// The Register — seed data for the Apiary Ledger of Delaware.
// Keepers are invented, but towns, counties, varietals and seasons are real to
// Delaware. Swap this file for real submissions when the directory opens.

export type County = "New Castle" | "Kent" | "Sussex";

export const COUNTIES: County[] = ["New Castle", "Kent", "Sussex"];

// USDA / Pfund honey colour grades, light to dark.
export type HoneyGrade =
  | "water-white"
  | "extra-light"
  | "light-amber"
  | "amber"
  | "dark-amber";

export const GRADE_HEX: Record<HoneyGrade, string> = {
  "water-white": "#F4E7B8",
  "extra-light": "#E9CE7B",
  "light-amber": "#DDA63A",
  amber: "#C07C1B",
  "dark-amber": "#8A4E13",
};

export const GRADE_LABEL: Record<HoneyGrade, string> = {
  "water-white": "Water White",
  "extra-light": "Extra Light",
  "light-amber": "Light Amber",
  amber: "Amber",
  "dark-amber": "Dark Amber",
};

export type Season = "Spring" | "Summer" | "Autumn";

export interface Varietal {
  name: string;
  season: Season;
  grade: HoneyGrade;
  notes: string;
}

export type Offering =
  | "Raw Honey"
  | "Comb Honey"
  | "Nucs & Queens"
  | "Package Bees"
  | "Beeswax & Candles"
  | "Soap & Balm"
  | "Pollen & Propolis"
  | "Pollination"
  | "Swarm Removal"
  | "Structural Cut-Outs"
  | "Classes & Mentoring";

export const ALL_OFFERINGS: Offering[] = [
  "Raw Honey",
  "Comb Honey",
  "Nucs & Queens",
  "Package Bees",
  "Beeswax & Candles",
  "Soap & Balm",
  "Pollen & Propolis",
  "Pollination",
  "Swarm Removal",
  "Structural Cut-Outs",
  "Classes & Mentoring",
];

export interface Award {
  year: number;
  place: string; // e.g. "First Premium"
  title: string; // what it was for
  body: string; // awarding body
}

export interface SwarmService {
  swarms: boolean; // collects loose swarms
  cutOuts: boolean; // structural removals
  area: string; // service area description
}

export interface Keeper {
  slug: string;
  apiary: string; // apiary / brand name
  keeper: string; // person's name
  town: string;
  county: County;
  established: number;
  hives: number;
  registered: boolean; // registered with the State Apiarist
  // position on the isometric map plane, 0..1 (x: west→east, y: north→south)
  pos: { x: number; y: number };
  methods: string[]; // trust badges
  blurb: string; // one line for cards
  story: string; // a short paragraph for the plate
  varietals: Varietal[];
  offerings: Offering[];
  awards: Award[];
  store?: { url: string; label: string };
  swarm?: SwarmService;
}

export const KEEPERS: Keeper[] = [
  {
    slug: "hockessin-hollow",
    apiary: "Hockessin Hollow Apiary",
    keeper: "Marguerite Vance",
    town: "Hockessin",
    county: "New Castle",
    established: 2009,
    hives: 42,
    registered: true,
    pos: { x: 0.22, y: 0.07 },
    methods: ["Raw", "Unfiltered", "Treatment-free", "Registered apiary"],
    blurb: "Treatment-free tulip poplar honey from the wooded Piedmont hills.",
    story:
      "Tucked into the rolling Piedmont above the Brandywine, Hockessin Hollow works survivor-stock colonies through the spring tulip-poplar flow. Marguerite extracts in small batches, never heats above hive temperature, and bottles the dark spring honey unfiltered so it keeps its pollen.",
    varietals: [
      {
        name: "Tulip Poplar",
        season: "Spring",
        grade: "dark-amber",
        notes: "Molasses and stewed plum, a faintly smoky finish.",
      },
      {
        name: "Brandywine Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Bergamot and clover, rounded and floral.",
      },
    ],
    offerings: [
      "Raw Honey",
      "Comb Honey",
      "Beeswax & Candles",
      "Classes & Mentoring",
    ],
    awards: [
      {
        year: 2023,
        place: "First Premium",
        title: "Dark Extracted Honey",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/hockessin-hollow", label: "Farm store & pickup" },
  },
  {
    slug: "white-clay-bees",
    apiary: "White Clay Bee Co.",
    keeper: "Desmond Okafor",
    town: "Newark",
    county: "New Castle",
    established: 2016,
    hives: 60,
    registered: true,
    pos: { x: 0.12, y: 0.14 },
    methods: ["Raw", "Small-batch", "Registered apiary"],
    blurb: "Queens, nucs, and classes near White Clay Creek — a teaching apiary.",
    story:
      "Desmond runs a teaching apiary at the edge of White Clay Creek and overwinters local-survivor queens for the regional market. Spring brings nucs and mentoring; the association's Newark branch meets nearby, and many first-year keepers start their hives with White Clay stock.",
    varietals: [
      {
        name: "Spring Blossom",
        season: "Spring",
        grade: "light-amber",
        notes: "Apple and black locust, bright and clean.",
      },
    ],
    offerings: [
      "Raw Honey",
      "Nucs & Queens",
      "Package Bees",
      "Classes & Mentoring",
    ],
    awards: [],
    store: { url: "https://example.com/white-clay", label: "Order nucs & queens" },
    swarm: {
      swarms: true,
      cutOuts: false,
      area: "Newark, Pike Creek & northern New Castle County",
    },
  },
  {
    slug: "augustine-marsh",
    apiary: "Augustine Marsh Honey",
    keeper: "Lottie Remington",
    town: "Middletown",
    county: "New Castle",
    established: 2013,
    hives: 88,
    registered: true,
    pos: { x: 0.34, y: 0.27 },
    methods: ["Raw", "Unfiltered"],
    blurb: "Pollination contracts and marshland wildflower honey south of the canal.",
    story:
      "Below the C&D Canal, Augustine Marsh keeps bees on the brackish edge of the Delaware River. Lottie's hives travel to apple and melon growers in spring and summer, and the leftover surplus is a complex tidal-meadow wildflower prized by the Middletown market crowd.",
    varietals: [
      {
        name: "Tidal Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Salt-marsh herbs, ripe peach, a long mineral finish.",
      },
      {
        name: "Goldenrod",
        season: "Autumn",
        grade: "dark-amber",
        notes: "Bold and resinous, faintly waxy — a true fall honey.",
      },
    ],
    offerings: ["Raw Honey", "Pollination", "Beeswax & Candles"],
    awards: [
      {
        year: 2022,
        place: "Second Premium",
        title: "Light Extracted Honey",
        body: "Delaware State Fair",
      },
    ],
  },
  {
    slug: "dover-commons",
    apiary: "Dover Commons Bees",
    keeper: "Theo Whitlock",
    town: "Dover",
    county: "Kent",
    established: 2018,
    hives: 24,
    registered: true,
    pos: { x: 0.46, y: 0.45 },
    methods: ["Raw", "Treatment-free", "Registered apiary"],
    blurb: "Backyard-scale clover honey and beeswax goods from the capital.",
    story:
      "A capital-city apiary on a half-acre near Silver Lake, Dover Commons proves you can keep bees in town. Theo sells clover honey, hand-poured candles, and balm at the Wednesday Dover market, and hosts beginners for hive-side open days each May.",
    varietals: [
      {
        name: "Dutch Clover",
        season: "Summer",
        grade: "extra-light",
        notes: "Mild, buttery, vanilla — the honey kids ask for.",
      },
    ],
    offerings: ["Raw Honey", "Beeswax & Candles", "Soap & Balm", "Classes & Mentoring"],
    awards: [],
    store: { url: "https://example.com/dover-commons", label: "Market stand & online" },
  },
  {
    slug: "murderkill-river",
    apiary: "Murderkill River Apiaries",
    keeper: "Junior Satterfield",
    town: "Frederica",
    county: "Kent",
    established: 2004,
    hives: 130,
    registered: true,
    pos: { x: 0.52, y: 0.55 },
    methods: ["Raw", "Unfiltered", "Registered apiary"],
    blurb: "Three-generation outfit: pollination, swarm calls, and river-bottom honey.",
    story:
      "The Satterfields have kept bees along the Murderkill since Junior's grandfather started with two skeps. Today it's a full-time outfit — pollination for Kent County vegetable growers, swarm and cut-out calls answered same-day, and a deep river-bottom wildflower honey that sells out by autumn.",
    varietals: [
      {
        name: "River-Bottom Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Brambleberry and wild mint, jammy and dark.",
      },
      {
        name: "Tulip Poplar",
        season: "Spring",
        grade: "dark-amber",
        notes: "Deep, malty, a backbone of cocoa.",
      },
    ],
    offerings: [
      "Raw Honey",
      "Pollination",
      "Swarm Removal",
      "Structural Cut-Outs",
      "Nucs & Queens",
    ],
    awards: [
      {
        year: 2021,
        place: "Best in Show",
        title: "Black Jar Honey Tasting",
        body: "Kent County Fair",
      },
      {
        year: 2024,
        place: "First Premium",
        title: "Dark Extracted Honey",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/murderkill", label: "Roadside stand, Rt 12" },
    swarm: {
      swarms: true,
      cutOuts: true,
      area: "All of Kent County and northern Sussex",
    },
  },
  {
    slug: "bombay-hook",
    apiary: "Bombay Hook Honey",
    keeper: "Ada Pennewell",
    town: "Smyrna",
    county: "Kent",
    established: 2015,
    hives: 36,
    registered: true,
    pos: { x: 0.58, y: 0.38 },
    methods: ["Raw", "Unfiltered", "Chemical-free"],
    blurb: "Salt-meadow honey beside the great migratory bird refuge.",
    story:
      "Beside the Bombay Hook refuge, Ada's bees forage the salt meadows and the surrounding soybean and wildflower edges. The honey shifts with the tides and the season; she labels every jar with its month so regulars can chase their favourite flow.",
    varietals: [
      {
        name: "Salt-Meadow Wildflower",
        season: "Summer",
        grade: "light-amber",
        notes: "Sea-air minerality, chamomile, light and bright.",
      },
      {
        name: "Goldenrod",
        season: "Autumn",
        grade: "dark-amber",
        notes: "Pungent and warm, ripe with the smell of the fall hive.",
      },
    ],
    offerings: ["Raw Honey", "Comb Honey", "Pollen & Propolis"],
    awards: [],
    store: { url: "https://example.com/bombay-hook", label: "CSA honey share" },
  },
  {
    slug: "tulip-poplar-farm",
    apiary: "Tulip Poplar Farm",
    keeper: "Cornelius Boggs",
    town: "Greenwood",
    county: "Sussex",
    established: 2001,
    hives: 240,
    registered: true,
    pos: { x: 0.4, y: 0.7 },
    methods: ["Raw", "Unfiltered", "Registered apiary"],
    blurb: "Delaware's signature tulip-poplar honey, at scale, from the heart of Sussex.",
    story:
      "If one honey says Delaware, it's tulip poplar — and Cornelius has built a life around it. Two hundred-plus colonies work the great spring bloom across Sussex's woodlots, producing a dark, mineral honey shipped to bakers and chefs up and down the coast.",
    varietals: [
      {
        name: "Tulip Poplar",
        season: "Spring",
        grade: "dark-amber",
        notes: "The benchmark: molasses, fig, a savoury depth.",
      },
      {
        name: "Soybean & Clover",
        season: "Summer",
        grade: "extra-light",
        notes: "Pale, delicate, almost floral water — the opposite twin.",
      },
    ],
    offerings: ["Raw Honey", "Pollination", "Beeswax & Candles", "Nucs & Queens"],
    awards: [
      {
        year: 2019,
        place: "Grand Champion",
        title: "Honey Show, Overall",
        body: "Delaware State Fair",
      },
      {
        year: 2023,
        place: "First Premium",
        title: "Varietal Honey — Tulip Poplar",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/tulip-poplar", label: "Wholesale & online" },
  },
  {
    slug: "cypress-branch",
    apiary: "Cypress Branch Bees",
    keeper: "Wren Calloway",
    town: "Milton",
    county: "Sussex",
    established: 2017,
    hives: 54,
    registered: true,
    pos: { x: 0.62, y: 0.78 },
    methods: ["Raw", "Treatment-free", "Small-batch"],
    blurb: "Cypress-swamp wildflower, mead honey, and queen rearing near the Broadkill.",
    story:
      "On the cypress edge near the Broadkill headwaters, Wren rears treatment-free queens and presses a dark swamp wildflower honey. A portion goes to a local meadery; the rest she sells at the Milton and Lewes markets alongside propolis tincture and lip balm.",
    varietals: [
      {
        name: "Cypress Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Sweetbay magnolia and dark berry, woodsy and round.",
      },
    ],
    offerings: [
      "Raw Honey",
      "Nucs & Queens",
      "Soap & Balm",
      "Pollen & Propolis",
      "Classes & Mentoring",
    ],
    awards: [
      {
        year: 2024,
        place: "First Premium",
        title: "Beeswax Block",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/cypress-branch", label: "Market & online" },
    swarm: {
      swarms: true,
      cutOuts: false,
      area: "Milton, Lewes, and the Cape region",
    },
  },
  {
    slug: "inland-bays",
    apiary: "Inland Bays Apiary",
    keeper: "Sol Marengo",
    town: "Frankford",
    county: "Sussex",
    established: 2012,
    hives: 75,
    registered: true,
    pos: { x: 0.72, y: 0.88 },
    methods: ["Raw", "Unfiltered", "Registered apiary"],
    blurb: "Coastal holly & wildflower honey and watermelon pollination near the bays.",
    story:
      "Between the inland bays and the truck farms of southern Sussex, Sol runs bees hard through pollination season — watermelon, cucumber, cantaloupe — then lets them gather the coastal holly and wildflower bloom. The honey is a buyer favourite at Bethany and Fenwick stands.",
    varietals: [
      {
        name: "Coastal Holly & Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Honeysuckle and sea spray, a clean herbal lift.",
      },
    ],
    offerings: ["Raw Honey", "Pollination", "Package Bees"],
    awards: [
      {
        year: 2022,
        place: "First Premium",
        title: "Chunk / Comb Honey",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/inland-bays", label: "Coastal farm stands" },
    swarm: {
      swarms: true,
      cutOuts: true,
      area: "Southern Sussex and the coastal towns",
    },
  },
  {
    slug: "nanticoke-honey",
    apiary: "Nanticoke Honey Works",
    keeper: "Verna Tull",
    town: "Seaford",
    county: "Sussex",
    established: 2008,
    hives: 110,
    registered: true,
    pos: { x: 0.3, y: 0.86 },
    methods: ["Raw", "Unfiltered", "Chemical-free", "Registered apiary"],
    blurb: "River-valley wildflower and creamed honey, plus a busy cut-out service.",
    story:
      "Along the Nanticoke, Verna built a honey house that hums all summer. She's known for silky creamed honey and a deep river wildflower, and for answering the call when bees move into a wall — her cut-out work has rehomed hundreds of colonies across western Sussex.",
    varietals: [
      {
        name: "Nanticoke Wildflower",
        season: "Summer",
        grade: "amber",
        notes: "Blackberry and wild aster, jammy with a tannic edge.",
      },
      {
        name: "Creamed Spring Honey",
        season: "Spring",
        grade: "light-amber",
        notes: "Whipped to a spoonable silk, mild and buttery.",
      },
    ],
    offerings: [
      "Raw Honey",
      "Swarm Removal",
      "Structural Cut-Outs",
      "Beeswax & Candles",
      "Classes & Mentoring",
    ],
    awards: [
      {
        year: 2020,
        place: "First Premium",
        title: "Creamed Honey",
        body: "Delaware State Fair",
      },
      {
        year: 2023,
        place: "Second Premium",
        title: "Creamed Honey",
        body: "Delaware State Fair",
      },
    ],
    store: { url: "https://example.com/nanticoke", label: "Honey house, by appt." },
    swarm: {
      swarms: true,
      cutOuts: true,
      area: "Seaford, Laurel, Bridgeville & western Sussex",
    },
  },
  {
    slug: "redden-forest",
    apiary: "Redden Forest Bees",
    keeper: "Phaedra Lynch",
    town: "Georgetown",
    county: "Sussex",
    established: 2019,
    hives: 30,
    registered: true,
    pos: { x: 0.52, y: 0.82 },
    methods: ["Raw", "Treatment-free", "Small-batch"],
    blurb: "Deep-woods varietal honeys from the state forest, in tiny lots.",
    story:
      "Working hives inside the Redden State Forest, Phaedra chases single-source flows — holly, sourwood-edge, late goldenrod — and bottles them in numbered small lots. Each label notes the week it was pulled, a practice borrowed from natural-wine vintners.",
    varietals: [
      {
        name: "Forest Holly",
        season: "Spring",
        grade: "light-amber",
        notes: "Green and herbal, a whisper of pine.",
      },
      {
        name: "Late Goldenrod",
        season: "Autumn",
        grade: "dark-amber",
        notes: "Caramelised and bold, the last honey of the year.",
      },
    ],
    offerings: ["Raw Honey", "Comb Honey", "Classes & Mentoring"],
    awards: [],
    store: { url: "https://example.com/redden-forest", label: "Numbered lots online" },
  },
];

// ---- Derived helpers ----------------------------------------------------

export function getKeeper(slug: string): Keeper | undefined {
  return KEEPERS.find((k) => k.slug === slug);
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

export function keepersByCounty(county: County): Keeper[] {
  return KEEPERS.filter((k) => k.county === county);
}

export function swarmKeepers(): Keeper[] {
  return KEEPERS.filter((k) => k.swarm && (k.swarm.swarms || k.swarm.cutOuts));
}

export function totalHives(): number {
  return KEEPERS.reduce((sum, k) => sum + k.hives, 0);
}

export function offeringCount(offering: Offering): number {
  return KEEPERS.filter((k) => k.offerings.includes(offering)).length;
}
