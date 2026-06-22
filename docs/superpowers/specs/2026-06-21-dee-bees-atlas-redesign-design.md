# DE Bees Atlas Redesign

## Direction

DE Bees becomes an immersive, hand-drawn atlas of Delaware beekeepers. The experience borrows the reference site's full-screen WebGL flyover, paper texture, sketch lines, parcel reveal, and quiet editorial chrome, but uses blue as the active accent and keeps the geography fictional.

## Surface

- Home: opens directly into the atlas, with three large terrain plates for New Castle, Kent, and Sussex.
- Map: same atlas surface, tuned for browsing all keepers.
- Keeper detail: starts on a focused plot for that keeper, with a spacious register panel for services, counties, contacts, and where-to-buy data.

## Interaction

- County controls fly the camera from state overview into one county plate.
- Keeper rows and terrain parcels fly the camera to a selected plot.
- Each keeper receives a generous parcel footprint, not a cramped pin. Multi-county keepers are placed in their first registered county, with their additional counties shown in UI.
- The selected parcel draws a blue brush outline, raises slightly, and exposes a keeper detail panel.

## Visual System

- Background: foxed paper and parchment, close to `#f5edda`.
- Ink: charcoal `#25251f`, with faint pencil lines and low-opacity edge strokes.
- Accent: deep blue `#174f9f`, with lighter reveal glow `#79adff`.
- Terrain: muted field greens, straw, clay, and slate shadow tones.
- Type: existing Fraunces for display, Newsreader for body, IBM Plex Mono for controls.

## Implementation

- Use a single client-side Three.js atlas component fed by the existing `KEEPERS` data.
- Generate procedural terrain in code: county plates, cliffs, roads, fields, hives, sheds, contour lines, labels, and parcel meshes.
- Keep UI text code-native. Do not use the concept image as UI.
- Preserve privacy rules in `src/lib/keepers.ts`; no new personal contact data.

## Verification

- Run lint, TypeScript, and production build through Nix.
- Verify `/`, `/map/`, and one `/keepers/[slug]/` page in-browser.
- Capture desktop screenshots for the home, map, and keeper detail surfaces.
