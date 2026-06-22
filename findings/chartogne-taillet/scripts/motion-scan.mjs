import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const analysisDir = path.join(rootDir, "analysis");
const screenshotDir = path.join(rootDir, "screenshots");
const targetUrl = "https://chartogne-taillet.com/en";

await mkdir(analysisDir, { recursive: true });
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

async function grabScreenshot(name) {
  const buffer = await page.screenshot({ fullPage: false });
  const file = path.join(screenshotDir, `${name}.png`);
  await writeFile(file, buffer);
  return {
    name,
    file: path.relative(rootDir, file),
    sha256_16: hashBuffer(buffer),
    bytes: buffer.length,
  };
}

async function waitForRestLoaded() {
  await page.waitForFunction(
    () =>
      document
        .querySelector("#app")
        ?.__vue__?.$children?.find((component) => component.$options?.name === "App")
        ?.$refs?.scene?.experience?.restLoaded === true,
    null,
    { timeout: 90000 },
  );
}

async function vueEval(fn, arg) {
  return page.evaluate(fn, arg);
}

async function snapshot(label) {
  return vueEval((snapshotLabel) => {
    const clean = (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value);
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    const sceneVm = app?.$refs?.scene;

    const selectors = [
      ".scene canvas",
      ".intro",
      ".intro .logo",
      ".intro .content",
      ".intro .content .letter",
      ".enter-button",
      ".enter-button .label .red .letter",
      ".enter-button .label .black .letter",
      ".enter-button .icon .red .bar-1",
      ".enter-button .icon .red .bar-2",
      ".enter-button .icon .black .bar-1",
      ".enter-button .icon .black .bar-2",
      ".navigation",
      ".main-cta",
      ".main-menu",
      ".main-menu .fade-helper",
      ".main-section",
      ".main-section a",
      ".main-section .indicator .thumb",
      ".main-section .canvas-text canvas",
      ".footer",
    ];

    const inspect = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        className: clean(element.className || ""),
        text: clean(element.textContent || "").slice(0, 100),
        rect: {
          x: Number(rect.x.toFixed(2)),
          y: Number(rect.y.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
        },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        transform: style.transform,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        transitionDelay: style.transitionDelay,
        animationName: style.animationName,
        willChange: style.willChange,
        pointerEvents: style.pointerEvents,
      };
    };

    const elements = Object.fromEntries(
      selectors.map((selector) => {
        const matches = [...document.querySelectorAll(selector)];
        return [
          selector,
          {
            count: matches.length,
            samples: matches.slice(0, 12).map(inspect),
          },
        ];
      }),
    );

    return {
      label: snapshotLabel,
      at: Number(performance.now().toFixed(2)),
      routeName: app?.$route?.name || null,
      rootMenuOpened: root?.menuOpened ?? null,
      scene: sceneVm
        ? {
            showIntro: sceneVm.showIntro,
            showLoader: sceneVm.showLoader,
            pristine: sceneVm.pristine,
            village: sceneVm.village,
            fieldIndex: sceneVm.fieldIndex,
          }
        : null,
      elements,
    };
  }, label);
}

async function runtimeState(label) {
  return vueEval((stateLabel) => {
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    const sceneVm = app?.$refs?.scene;
    const exp = sceneVm?.experience;
    const village = exp?.world?.villages?.merfy || exp?.world?.villages?.all?.[0];
    const camera = village?.camera;

    const shallow = (obj) => (obj ? Object.keys(obj).filter((key) => !key.startsWith("_")).slice(0, 120) : null);
    const number = (value) => (typeof value === "number" ? Number(value.toFixed(6)) : value);
    const vector = (value) =>
      value
        ? {
            x: number(value.x),
            y: number(value.y),
            z: number(value.z),
            w: number(value.w),
          }
        : null;
    const rotation = (value) =>
      value
        ? {
            x: number(value.x),
            y: number(value.y),
            z: number(value.z),
            order: value.order,
          }
        : null;
    const clonePlain = (obj, depth = 0, seen = new Set()) => {
      if (obj == null || typeof obj !== "object") return obj;
      if (seen.has(obj) || depth > 3) return `[${obj.constructor?.name || "Object"}]`;
      seen.add(obj);
      if (typeof obj.x === "number" && typeof obj.y === "number") return vector(obj);
      if (Array.isArray(obj)) return obj.slice(0, 80).map((item) => clonePlain(item, depth + 1, seen));
      return Object.fromEntries(
        Object.keys(obj)
          .filter((key) => !key.startsWith("_"))
          .slice(0, 120)
          .map((key) => [key, clonePlain(obj[key], depth + 1, seen)]),
      );
    };

    const summarizeCamera = (cam) =>
      cam
        ? {
            active: cam.active,
            playing: cam.playing,
            mode: cam.mode,
            instanceSpeed: number(cam.instanceSpeed),
            zoom: clonePlain(cam.zoom),
            floating: clonePlain(cam.floating),
            dive: clonePlain(cam.dive),
            instance: {
              position: vector(cam.instance?.position),
              rotation: rotation(cam.instance?.rotation),
            },
            originalCamera: {
              position: vector(cam.originalCamera?.position),
              rotation: rotation(cam.originalCamera?.rotation),
              fov: cam.originalCamera?.fov,
              near: cam.originalCamera?.near,
              far: cam.originalCamera?.far,
            },
            animation: cam.animation
              ? {
                  easing: clonePlain(cam.animation.easing),
                  position: {
                    value: vector(cam.animation.position?.value),
                    targetValue: vector(cam.animation.position?.targetValue),
                  },
                  rotation: {
                    value: rotation(cam.animation.rotation?.value),
                    targetValue: rotation(cam.animation.rotation?.targetValue),
                    tilt: clonePlain(cam.animation.rotation?.tilt),
                    pan: clonePlain(cam.animation.rotation?.pan),
                  },
                  elevation: {
                    min: number(cam.animation.elevation?.min),
                    max: cam.animation.elevation?.max,
                    offset: cam.animation.elevation?.offset,
                    amplitude: cam.animation.elevation?.amplitude,
                    mapSize: cam.animation.elevation?.mapSize,
                  },
                  map: clonePlain(cam.animation.map),
                }
              : null,
          }
        : null;

    return {
      label: stateLabel,
      at: Number(performance.now().toFixed(2)),
      routeName: app?.$route?.name || null,
      appRefs: app?.$refs ? Object.keys(app.$refs) : [],
      scene: sceneVm
        ? {
            showIntro: sceneVm.showIntro,
            showLoader: sceneVm.showLoader,
            pristine: sceneVm.pristine,
            village: sceneVm.village,
            fieldIndex: sceneVm.fieldIndex,
          }
        : null,
      experienceKeys: shallow(exp),
      villageKeys: shallow(village),
      colors: clonePlain(exp?.colors),
      cameraOptions: clonePlain(village?.cameraOptions),
      fieldOptions: clonePlain(village?.fieldOptions),
      placesOptions: clonePlain(village?.placesOptions),
      camera: summarizeCamera(camera),
    };
  }, label);
}

async function forceEnter() {
  await vueEval(() => {
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    app?.$refs?.scene?.enterClick?.({ preventDefault() {} });
  });
}

async function openMenu() {
  await vueEval(() => {
    const root = document.querySelector("#app")?.__vue__;
    if (root) root.menuOpened = true;
  });
}

async function playCameraIntro() {
  await vueEval(() => {
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    const camera = app?.$refs?.scene?.experience?.world?.villages?.merfy?.camera;
    if (camera) {
      camera.active = true;
      camera.playing = true;
      camera.playIntro?.();
    }
  });
}

async function pokeFreeCamera() {
  await vueEval(() => {
    const root = document.querySelector("#app")?.__vue__;
    const app = root?.$children?.find((component) => component.$options?.name === "App");
    const camera = app?.$refs?.scene?.experience?.world?.villages?.merfy?.camera;
    if (camera) {
      camera.active = true;
      camera.playing = true;
      camera.goFree?.(0.5);
      camera.zoom.value = 0.35;
      camera.drag.delta.x = 0.08;
      camera.drag.delta.y = -0.04;
      camera.floating.target.x = 0.35;
      camera.floating.target.y = -0.25;
    }
  });
}

await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
try {
  await page.waitForLoadState("networkidle", { timeout: 12000 });
} catch {
  // The site may keep animation-related activity open.
}
await waitForRestLoaded();
await page.waitForTimeout(800);

const screenshots = [];
const snapshots = [];
const runtime = [];

runtime.push(await runtimeState("intro-ready"));
snapshots.push(await snapshot("intro-ready"));
screenshots.push(await grabScreenshot("motion-intro-ready"));

await forceEnter();
for (const delay of [0, 600, 1500, 3000, 4500, 6500]) {
  if (delay) await page.waitForTimeout(delay - ([0, 600, 1500, 3000, 4500, 6500][[0, 600, 1500, 3000, 4500, 6500].indexOf(delay) - 1] || 0));
  const label = `after-enter-${delay}ms`;
  snapshots.push(await snapshot(label));
  if ([0, 1500, 4500, 6500].includes(delay)) screenshots.push(await grabScreenshot(`motion-${label}`));
}
runtime.push(await runtimeState("after-enter"));

await playCameraIntro();
for (const delay of [0, 750, 1500, 2250, 3200, 4000]) {
  if (delay) await page.waitForTimeout(delay - ([0, 750, 1500, 2250, 3200, 4000][[0, 750, 1500, 2250, 3200, 4000].indexOf(delay) - 1] || 0));
  runtime.push(await runtimeState(`camera-playIntro-${delay}ms`));
}

await pokeFreeCamera();
for (const delay of [0, 500, 1200, 2200]) {
  if (delay) await page.waitForTimeout(delay - ([0, 500, 1200, 2200][[0, 500, 1200, 2200].indexOf(delay) - 1] || 0));
  runtime.push(await runtimeState(`camera-free-poke-${delay}ms`));
}

await openMenu();
for (const delay of [0, 400, 1000, 1800, 2800]) {
  if (delay) await page.waitForTimeout(delay - ([0, 400, 1000, 1800, 2800][[0, 400, 1000, 1800, 2800].indexOf(delay) - 1] || 0));
  const label = `menu-open-${delay}ms`;
  snapshots.push(await snapshot(label));
  if ([0, 1000, 2800].includes(delay)) screenshots.push(await grabScreenshot(`motion-${label}`));
}
runtime.push(await runtimeState("menu-open"));

const staticTimings = {
  introCss: {
    vueTransitionDurationMs: { enter: 4300, leave: 4300 },
    contentLetters: "opacity transition, 2s duration, 0.2s base delay plus per-letter inline delays",
    enterRedLetters: "opacity transition with staggered delays from 2.0s to 2.4s on intro enter",
    enterIcon: "red vertical bar scaleY over 1s after 2.5s; red horizontal bar scaleX over 1s after 3.3s",
    leave: "letters/logo fade out over 0.6s with 0-0.4s stagger; bars collapse over 0.6s",
  },
  hoverCtaCss: {
    mainMenuCta: "hover swaps bottom underline scaleX with left vertical scaleY; letters translateX(50%) over 0.3s with stagger",
    enterButton: "red letters fade out and black letters fade in over 0.45s; black bars scale in after red bars scale out",
  },
  cameraSource: {
    intro: "position tween 3s from introPositionStart to introPositionEnd; rotation tween 3s power1.inOut",
    focus: "target camera position and rotation tween 2s power2.inOut; y target gets sinusoidal +0.2 arc during tween",
    free: "floating amplitude and camera easing ramp over configurable duration with power2.in",
    perFrame: "position/rotation ease toward target by easing.value * time.delta; mousemove updates floating target; drag delta pans/tilts/free-moves",
  },
  panelSource: {
    scrollPanelExtended: "bars material bounding grows from small scroll mark to full vertical panel over 2s power4.inOut; secondary progress bar follows with 1s delay",
    scrollPanelLeave: "panel collapses back over 2.5s power4.out; underline collapse uses 0.8s power4.inOut",
    shaderReveal: "uRevealProgress feeds Perlin/random grid reveal in fragment shaders for text/panels",
  },
};

const report = {
  source: {
    url: targetUrl,
    collectedAt: new Date().toISOString(),
    focus: "camera movement, text animation, menu/panel animation",
    notes: [
      "Runtime inspection uses Vue component refs exposed by the public SPA.",
      "Scene.enterClick() was invoked through Vue because the loader flag kept the DOM button hidden in headless Chromium.",
      "Camera intro/free samples were triggered against the page runtime; source timing summary is from beautified public JS/CSS.",
    ],
  },
  staticTimings,
  runtime,
  snapshots,
  screenshots,
};

await writeFile(path.join(analysisDir, "motion-runtime.json"), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();

console.log(`Wrote ${path.relative(process.cwd(), path.join(analysisDir, "motion-runtime.json"))}`);
console.log(`Motion screenshots: ${screenshots.map((shot) => shot.file).join(", ")}`);
