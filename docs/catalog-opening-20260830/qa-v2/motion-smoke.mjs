import { chromium } from "/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url));
const url = "http://127.0.0.1:4173/index.html?v=20260830-opening-v2-motion";
const widths = [1440, 1024, 768, 390];
const browser = await chromium.launch({ headless: true });
const results = await Promise.all(widths.map(async (width) => {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText ?? "unknown",
  }));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const early = await page.evaluate(() => {
    const video = document.querySelector(".catalog-cover__motion");
    const shell = document.querySelector(".catalog-cover");
    return {
      innerWidth,
      currentSrc: video?.currentSrc,
      currentTime: video?.currentTime,
      paused: video?.paused,
      ended: video?.ended,
      videoOpacity: video ? getComputedStyle(video).opacity : null,
      titleOpacity: getComputedStyle(document.querySelector(".catalog-cover__title")).opacity,
      classes: shell?.className,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  await page.screenshot({ path: resolve(outDir, `motion-early-${width}.png`) });

  await page.waitForTimeout(5000);
  const end = await page.evaluate(() => {
    const video = document.querySelector(".catalog-cover__motion");
    const shell = document.querySelector(".catalog-cover");
    return {
      innerWidth,
      currentSrc: video?.currentSrc,
      currentTime: video?.currentTime,
      paused: video?.paused,
      ended: video?.ended,
      videoOpacity: video ? getComputedStyle(video).opacity : null,
      titleOpacity: getComputedStyle(document.querySelector(".catalog-cover__title")).opacity,
      classes: shell?.className,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  await page.screenshot({ path: resolve(outDir, `motion-end-${width}.png`) });
  await context.close();
  return { width, early, end, consoleErrors, pageErrors, failedRequests };
}));

await browser.close();
await writeFile(resolve(outDir, "motion-smoke.json"), `${JSON.stringify({ url, results }, null, 2)}\n`);
