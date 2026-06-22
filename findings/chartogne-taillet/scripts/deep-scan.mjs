import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const analysisDir = path.join(rootDir, "analysis");
const screenshotDir = path.join(rootDir, "screenshots");
const targetUrl = "https://chartogne-taillet.com/en";

await mkdir(analysisDir, { recursive: true });
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const responses = [];

async function idle(page, ms = 2500) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 12000 });
  } catch {
    // Long-lived animation/network work is expected on this WebGL site.
  }
  await page.waitForTimeout(ms);
}

function normalizeUrl(value) {
  try {
    return new URL(value, targetUrl).href;
  } catch {
    return value;
  }
}

function extOf(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const match = pathname.match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

function count(values) {
  const map = new Map();
  for (const value of values.filter(Boolean)) {
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, hits]) => ({ value, count: hits }));
}

async function screenshot(page, name) {
  const file = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return {
    name,
    file: path.relative(rootDir, file),
    palette: await paletteFromPng(file),
  };
}

async function paletteFromPng(file) {
  const image = PNG.sync.read(readFileSync(file));
  const buckets = new Map();
  const step = Math.max(1, Math.floor(Math.min(image.width, image.height) / 150));

  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      const idx = (image.width * y + x) << 2;
      const alpha = image.data[idx + 3];
      if (alpha < 160) continue;

      const r = Math.round(image.data[idx] / 8) * 8;
      const g = Math.round(image.data[idx + 1] / 8) * 8;
      const b = Math.round(image.data[idx + 2] / 8) * 8;
      const key = `#${[r, g, b]
        .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
        .join("")}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }

  const total = [...buckets.values()].reduce((sum, hits) => sum + hits, 0);
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([color, hits]) => ({ color, count: hits, share: Number((hits / total).toFixed(4)) }));
}

async function collectState(page, name) {
  return {
    name,
    url: page.url(),
    title: await page.title(),
    viewport: page.viewportSize(),
    collectedAt: new Date().toISOString(),
    dom: await page.evaluate(() => {
      const clean = (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value);
      const isColor = (value) =>
        value &&
        value !== "rgba(0, 0, 0, 0)" &&
        value !== "transparent" &&
        value !== "initial";
      const walk = [...document.querySelectorAll("body *")].slice(0, 2500);
      const elements = walk.map((element) => {
        const style = getComputedStyle(element);
        const before = getComputedStyle(element, "::before");
        const after = getComputedStyle(element, "::after");
        const rect = element.getBoundingClientRect();

        return {
          tag: element.tagName.toLowerCase(),
          className:
            typeof element.className === "string"
              ? clean(element.className).slice(0, 160)
              : "",
          text: clean(element.textContent || "").slice(0, 120),
          size: {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            Number(style.opacity) > 0,
          colors: [
            style.color,
            style.backgroundColor,
            style.borderTopColor,
            before.color,
            before.backgroundColor,
            after.color,
            after.backgroundColor,
          ].filter(isColor),
          typography: {
            family: style.fontFamily,
            size: style.fontSize,
            weight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            transform: style.textTransform,
            style: style.fontStyle,
          },
          layout: {
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            gap: style.gap,
            radius: style.borderRadius,
            shadow: style.boxShadow,
          },
        };
      });

      const visible = elements.filter((element) => element.visible);
      const unique = (values) => [...new Set(values.filter(Boolean))];

      return {
        textSample: clean(document.body.innerText || "").slice(0, 3000),
        counts: {
          elements: elements.length,
          visibleElements: visible.length,
          canvases: document.querySelectorAll("canvas").length,
          images: document.querySelectorAll("img").length,
          links: document.querySelectorAll("a").length,
          buttons: document.querySelectorAll("button").length,
        },
        colors: unique(visible.flatMap((element) => element.colors)),
        fonts: unique(visible.map((element) => element.typography.family)),
        fontSizes: unique(visible.map((element) => element.typography.size)),
        letterSpacing: unique(visible.map((element) => element.typography.letterSpacing)),
        lineHeights: unique(visible.map((element) => element.typography.lineHeight)),
        radii: unique(visible.map((element) => element.layout.radius)).filter((value) => value !== "0px"),
        shadows: unique(visible.map((element) => element.layout.shadow)).filter((value) => value !== "none"),
        spacingValues: unique(
          visible.flatMap((element) => [
            element.layout.marginTop,
            element.layout.marginRight,
            element.layout.marginBottom,
            element.layout.marginLeft,
            element.layout.paddingTop,
            element.layout.paddingRight,
            element.layout.paddingBottom,
            element.layout.paddingLeft,
            element.layout.gap,
          ])
        ).filter((value) => value && value !== "0px" && value !== "normal"),
        links: [...document.querySelectorAll("a")]
          .slice(0, 200)
          .map((link) => ({ text: clean(link.innerText), href: link.href })),
        images: [...document.images]
          .slice(0, 200)
          .map((image) => ({
            src: image.currentSrc || image.src,
            alt: clean(image.alt || ""),
            width: image.naturalWidth,
            height: image.naturalHeight,
          })),
        canvases: [...document.querySelectorAll("canvas")].map((canvas, index) => {
          const rect = canvas.getBoundingClientRect();
          const result = {
            index,
            width: canvas.width,
            height: canvas.height,
            cssWidth: Math.round(rect.width),
            cssHeight: Math.round(rect.height),
            className: typeof canvas.className === "string" ? clean(canvas.className) : "",
            sampleColors: [],
            readPixelsError: null,
          };

          try {
            const gl =
              canvas.getContext("webgl2", { preserveDrawingBuffer: true }) ||
              canvas.getContext("webgl", { preserveDrawingBuffer: true }) ||
              canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });
            if (gl && canvas.width > 0 && canvas.height > 0) {
              const pixels = new Uint8Array(4);
              const colors = [];
              for (let y = 0; y <= 1; y += 0.2) {
                for (let x = 0; x <= 1; x += 0.2) {
                  gl.readPixels(
                    Math.min(canvas.width - 1, Math.max(0, Math.floor(canvas.width * x))),
                    Math.min(canvas.height - 1, Math.max(0, Math.floor(canvas.height * y))),
                    1,
                    1,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    pixels
                  );
                  if (pixels[3] > 0) {
                    colors.push(
                      `rgba(${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${Number((pixels[3] / 255).toFixed(2))})`
                    );
                  }
                }
              }
              result.sampleColors = [...new Set(colors)].slice(0, 24);
            }
          } catch (error) {
            result.readPixelsError = error instanceof Error ? error.message : String(error);
          }

          return result;
        }),
      };
    }),
  };
}

async function collectStaticCss(page) {
  return page.evaluate(() => {
    const colors = [];
    const fonts = [];
    const urls = [];
    const mediaQueries = [];
    const sizeValues = [];
    const selectors = [];

    const pushMatches = (text, regex, target) => {
      for (const match of text.matchAll(regex)) target.push(match[0]);
    };

    for (const sheet of [...document.styleSheets]) {
      let rules;
      try {
        rules = [...sheet.cssRules];
      } catch {
        continue;
      }

      for (const rule of rules) {
        const text = rule.cssText || "";
        if (rule.selectorText) selectors.push(rule.selectorText);
        if (rule.conditionText) mediaQueries.push(rule.conditionText);
        pushMatches(text, /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g, colors);
        pushMatches(text, /font-family:\s*([^;]+);/g, fonts);
        pushMatches(text, /url\(([^)]+)\)/g, urls);
        pushMatches(text, /-?\d*\.?\d+(?:px|rem|em|vw|vh|%)/g, sizeValues);

        if (rule.cssRules) {
          for (const nested of [...rule.cssRules]) {
            const nestedText = nested.cssText || "";
            if (nested.selectorText) selectors.push(nested.selectorText);
            pushMatches(nestedText, /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g, colors);
            pushMatches(nestedText, /font-family:\s*([^;]+);/g, fonts);
            pushMatches(nestedText, /url\(([^)]+)\)/g, urls);
            pushMatches(nestedText, /-?\d*\.?\d+(?:px|rem|em|vw|vh|%)/g, sizeValues);
          }
        }
      }
    }

    return {
      colors,
      fonts,
      urls,
      mediaQueries,
      sizeValues,
      selectors,
    };
  });
}

async function forceEnter(page) {
  await page.evaluate(() => {
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    app?.$refs?.scene?.enterClick?.({ preventDefault() {} });
  });
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on("response", async (response) => {
  const request = response.request();
  responses.push({
    url: response.url(),
    status: response.status(),
    type: request.resourceType(),
    contentType: response.headers()["content-type"] || "",
  });
});

await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await idle(page, 3500);

const screenshots = [];
const states = [];
states.push(await collectState(page, "desktop-intro"));
screenshots.push(await screenshot(page, "desktop-intro"));

const staticCss = await collectStaticCss(page);

const entered = await page.locator(".enter-button").first().count();
if (entered) {
  try {
    await page.locator(".enter-button").first().click({ timeout: 10000 });
  } catch {
    await forceEnter(page);
  }
  await idle(page, 3500);
  states.push(await collectState(page, "desktop-after-enter"));
  screenshots.push(await screenshot(page, "desktop-after-enter"));
}

const menuButton = await page.locator(".main-cta").first().count();
if (menuButton) {
  await page.locator(".main-cta").first().click({ timeout: 10000 });
  await idle(page, 2000);
  states.push(await collectState(page, "desktop-menu-open"));
  screenshots.push(await screenshot(page, "desktop-menu-open"));
}

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
});
await mobile.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await idle(mobile, 3500);
states.push(await collectState(mobile, "mobile-intro"));
screenshots.push(await screenshot(mobile, "mobile-intro"));

if (await mobile.locator(".enter-button").first().count()) {
  try {
    await mobile.locator(".enter-button").first().click({ timeout: 10000 });
  } catch {
    await forceEnter(mobile);
  }
  await idle(mobile, 2500);
  states.push(await collectState(mobile, "mobile-after-enter"));
  screenshots.push(await screenshot(mobile, "mobile-after-enter"));
}

await mobile.close();
await browser.close();

const cssSummary = {
  colors: count(staticCss.colors).slice(0, 80),
  fontDeclarations: count(staticCss.fonts).slice(0, 80),
  assetUrls: count(staticCss.urls.map((value) => normalizeUrl(value.replace(/^url\(["']?/, "").replace(/["']?\)$/, "")))).slice(0, 200),
  mediaQueries: count(staticCss.mediaQueries).slice(0, 80),
  sizeValues: count(staticCss.sizeValues).slice(0, 160),
};

const networkAssets = responses
  .filter((entry) => entry.status < 400)
  .map((entry) => ({ ...entry, extension: extOf(entry.url) }));

const networkSummary = {
  byType: count(networkAssets.map((entry) => entry.type)),
  byExtension: count(networkAssets.map((entry) => entry.extension)).slice(0, 60),
  assets: networkAssets
    .filter((entry) =>
      ["image", "font", "stylesheet", "script", "media"].includes(entry.type) ||
      ["glb", "gltf", "obj", "jpg", "jpeg", "png", "webp", "woff", "woff2", "css", "js", "pdf"].includes(entry.extension)
    )
    .sort((a, b) => a.url.localeCompare(b.url)),
};

const domSummary = {
  colors: count(states.flatMap((state) => state.dom.colors)).slice(0, 80),
  fonts: count(states.flatMap((state) => state.dom.fonts)).slice(0, 40),
  fontSizes: count(states.flatMap((state) => state.dom.fontSizes)).slice(0, 80),
  letterSpacing: count(states.flatMap((state) => state.dom.letterSpacing)).slice(0, 80),
  lineHeights: count(states.flatMap((state) => state.dom.lineHeights)).slice(0, 80),
  radii: count(states.flatMap((state) => state.dom.radii)).slice(0, 40),
  shadows: count(states.flatMap((state) => state.dom.shadows)).slice(0, 40),
  spacingValues: count(states.flatMap((state) => state.dom.spacingValues)).slice(0, 120),
};

const modelHints = networkSummary.assets.filter((asset) => ["glb", "gltf", "obj"].includes(asset.extension));

const fullReport = {
  source: {
    url: targetUrl,
    collectedAt: new Date().toISOString(),
    notes: [
      "Generated by Playwright against the public site.",
      "No app code or styles were modified.",
      "Color palettes include DOM/CSS values plus approximate screenshot buckets.",
    ],
  },
  states,
  summaries: {
    dom: domSummary,
    css: cssSummary,
    network: {
      byType: networkSummary.byType,
      byExtension: networkSummary.byExtension,
      modelHints,
    },
  },
  screenshots,
};

await writeFile(path.join(analysisDir, "deep-scan.json"), `${JSON.stringify(fullReport, null, 2)}\n`);
await writeFile(path.join(analysisDir, "style-summary.json"), `${JSON.stringify({ dom: domSummary, css: cssSummary }, null, 2)}\n`);
await writeFile(path.join(analysisDir, "network-assets.json"), `${JSON.stringify(networkSummary, null, 2)}\n`);
await writeFile(path.join(analysisDir, "screenshot-palettes.json"), `${JSON.stringify(screenshots, null, 2)}\n`);

console.log(`Wrote ${path.relative(process.cwd(), analysisDir)}`);
console.log(`Screenshots: ${screenshots.map((item) => item.file).join(", ")}`);
