# The Apiary Ledger of Delaware

An illustrated register of Delaware's beekeepers and honey makers — their
apiaries, varietals, awards, and services, county by county. Built as a
nineteenth-century naturalist's plate book: every keeper is a numbered *plate*,
plotted on a cozy isometric map of the state.

🐝 **Live site:** https://snyderb-de.github.io/de-bees/

## What's inside

- **The Register** — every keeper, filterable by county and by what they offer
  (honey, comb, nucs & queens, classes, pollination, swarm removal).
- **The Map** — an isometric, tilt-shift survey of the apiaries; each hive box
  links to a keeper's plate.
- **Swarms & Services** — a county-organised swarm / cut-out register and
  pollination listings.
- **Premiums** — the honours roll from the State Fair and county shows.
- **Learn** — county clubs, registering your hive with the State Apiarist, and
  the Delaware nectar calendar.
- **Get Listed** — a free submission flow for any keeper in the state.

The keeper entries shipped at launch are illustrative samples; Delaware towns,
counties, varietals, seasons, and the state figures are real. Swap
`src/lib/keepers.ts` for real submissions as keepers join.

## Design

- **Palette** — green-black printer's ink, sage, and oxblood on foxed paper,
  with honey used sparingly as gilt. (Deliberately off the cream + terracotta
  default.)
- **Type** — Fraunces (display), Newsreader (body), IBM Plex Mono (ledger data).
- **Signature** — a self-drawing engraved honeybee and the plate/figure register
  system. Motion respects `prefers-reduced-motion`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) — static export (`output: "export"`)
- React 19 · TypeScript · Tailwind CSS v4
- Zero runtime data dependencies; the map and bee are hand-built inline SVG (no
  tiles, no API keys).

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static export to ./out
```

## Deploy

Pushing to `main` builds the static export and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`. The site is served from `/de-bees`, configured
through `basePath` in `next.config.ts` (production only, so local dev stays at
the root).

## Roadmap

- Self-serve keeper accounts (claim & edit your own plate).
- Idle "roaming bee" cameo — an engraved bee that drifts in, lands, and buzzes
  off every so often.
- Reviews and "what's flowing now" live seasonal state.

---

An independent project. Not affiliated with the Delaware Beekeepers Association
or the Delaware Department of Agriculture.
