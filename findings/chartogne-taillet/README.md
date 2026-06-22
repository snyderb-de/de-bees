# Chartogne-Taillet Design-System Findings

Source: https://chartogne-taillet.com/en  
Collected: 2026-06-22

## Scope

This is extraction plus runtime inspection of one public SPA entrypoint. It is useful for design initialization, not pixel-perfect reproduction. The site is canvas/WebGL-heavy, so the base extractor under-reported colors; reviewed colors below combine extractor output, computed CSS, screenshots, and runtime Vue/Three values.

## Files

- `.extract-design-system/raw.json` - raw extractor output.
- `.extract-design-system/normalized.json` - extractor-normalized tokens. It only kept font/spacing because palette confidence was low.
- `design-system/tokens.json` and `design-system/tokens.css` - starter files from the extractor.
- `design-system/tokens.reviewed.json` and `design-system/tokens.reviewed.css` - reviewed starter tokens from the second pass.
- `analysis/style-summary.json` - DOM/CSS color, type, spacing inventory.
- `analysis/network-assets.json` - loaded images, scripts, fonts, audio, and model URLs.
- `analysis/screenshot-palettes.json` - sampled screenshot color buckets.
- `analysis/deep-scan.json` - structured page/state inspection.
- `analysis/motion-runtime.json` - camera, text, menu, and panel animation findings.
- `screenshots/` - desktop/mobile and motion keyframes.
- `scripts/` - local Playwright scan scripts used to generate findings.

## Core Primitives

Colors:

- Paper/canvas: `#fff5dd`, `#fdfcf5`, screenshot bucket `#fff8e0`, menu/mobile band `#f9f6ee`.
- Ink: `#000000`.
- Pencil neutrals from runtime: `#363832`, `#585858`, `#8c887d`, `#ded5c1`.
- Accent reds: CSS/CTA `#c23d2a`; runtime highlight `#c55656`.
- Extra runtime tones: terrain close color `#b7a768`; muted footer text `#625e54`.

Typography:

- Body: `Sabon LT Std`, fallback `Times New Roman`, `Times`, serif.
- Display/navigation: `ShipleyRegular`; italic variant `ShipleyItalic`.
- Heavy italic: `SabonNext LT BlackItalic`.
- Common behavior: uppercase display text, wide tracking from `0.15em` to `0.4em`; intro/content uses very high letter spacing (`0.25em`).

Layout:

- Full-viewport fixed WebGL canvas.
- Fixed CTAs: top left/right around `3.125rem`, mobile `1.5rem`.
- Breakpoints detected: `374px`, `767px`, `768px`, `1024px`, `1920px`.
- Desktop root font-size scales at `0.8333333333vw`, capped at `16px` at `1920px`.
- Visual language is flat: no meaningful border radius or box shadow scale. Motion, 1px rules, and canvas textures do the work.

Assets:

- Fonts load from `/assets/fonts/*.woff2` and `.woff`.
- Key imagery: `/assets/images/logo.png`, `/assets/images/logo-2x.png`, `/assets/images/grille.png`, `/assets/images/perlin-512x512.jpg`.
- Runtime loaded 7 `.glb` files, 62 images, 7 media files, 2 fonts.

## Motion Findings

Runtime stack:

- Vue SPA with Three.js/WebGL renderer.
- Runtime inspection used `#app.__vue__` -> `App.$refs.scene.experience`.
- DOM menu links often stay `opacity: 0`; visible text is painted via canvas/texture (`CanvasText`) and shader reveal.

Camera:

- Main camera: FOV `65`, near `0.0025`, far `40`, rotation order `YXZ`.
- Intro path starts at `{ x: 1, y: 0.5, z: 8 }`, ends at `{ x: 1.7, y: 0.88, z: 2.2 }`.
- Intro rotation starts `{ x: 0, y: 0 }`, ends `{ x: -0.47, y: 0.95 }`.
- Intro tween duration is `3s`; rotation ease is `power1.inOut`.
- Free camera uses per-frame easing `0.004`, map speed `2.25`, pan speed `2.25`.
- Mouse float uses target ratio from pointer position, easing `0.004`, amplitude `0.0275` to `0.11`.
- Focus movement uses `2s power2.inOut`; y target gets a sinusoidal `+0.2` arc during the tween.
- Camera bounds polygon: `(2.5,5)`, `(5,-5)`, `(-5,-1)`, `(-4,4)`.

Field focus presets:

| Field | rotY | rotX | elev |
| --- | ---: | ---: | ---: |
| Les Barres | -0.6283 | -0.08 | 0.06 |
| Les Oriseaux | -0.6283 | -0.08 | 0.05 |
| Les Beaux Sens | 1.2566 | -0.08 | 0.04 |
| Le Chemin de Reims | 1.2566 | -0.06 | 0.04 |
| Les Grands Champs | 1.2566 | -0.08 | 0.04 |
| Les Bermonts | 1.5708 | -0.10 | 0.05 |
| Les Fontaines | 3.1416 | -0.16 | 0.07 |
| Les Ricordanes | -1.5708 | -0.16 | 0.07 |
| Les Brets | -1.5708 | -0.18 | 0.08 |
| Le Closet | -1.8850 | -0.18 | 0.08 |
| Le Mont Age | -1.5708 | -0.18 | 0.08 |
| Les Alliees | -1.2566 | -0.18 | 0.08 |
| Les Couarres | -1.5708 | -0.14 | 0.06 |
| Les Heurtes Bises | -1.2566 | -0.14 | 0.06 |

Text and panels:

- Intro Vue transition duration: `4300ms` enter and leave.
- Intro content/logo letters: opacity transition, `2s`, with `0.2s` base delay and per-letter inline delays.
- Enter label red letters stagger from about `2.0s` to `2.4s`; red icon bars reveal after `2.5s` and `3.3s`.
- Enter hover swaps red/black letters over `0.45s`; bars scale out/in in staggered `0.6s` segments.
- Main menu CTA hover: underline collapses while left rule grows; letters translate `50%` over `0.3s`.
- Menu panel: full-screen `#fdfcf5`, faint grid image, canvas-rendered menu headings. At `2800ms`, headings are fully visible.
- Scroll/panel interface: `goExtended` grows a vertical bar to full panel height over `2s power4.inOut`; secondary bar follows after `1s`; leave collapses over `2.5s power4.out`.
- Shader reveals use `uRevealProgress` plus Perlin/random grid masks, so text/panels appear as textured erasure/reveal rather than plain opacity.

## Caveats

- Headless Chromium kept the site's loader flag true, so scripts invoked `Scene.enterClick()` through Vue when the visible button was unavailable.
- The first extractor reported zero normalized palette colors; rely on `tokens.reviewed.*` and `analysis/style-summary.json` for color work.
- This does not reproduce copyrighted source code or assets; it records tokens, runtime values, screenshots, and asset URLs for reference.
