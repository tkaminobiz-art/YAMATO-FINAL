import { chromium, webkit } from "/Users/takahirokamino/.codex/toolchains/web-quality-gates/node_modules/playwright/index.mjs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("./section-results.json", import.meta.url));
const url = "http://127.0.0.1:4182/index.html#builtProof";
const widths = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
const engines = [
  {
    name: "chromium",
    type: chromium,
    launch: { headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" },
  },
  { name: "webkit", type: webkit, launch: { headless: true } },
];
const results = [];

for (const engine of engines) {
  const browser = await engine.type.launch(engine.launch);
  for (const width of widths) {
    const height = width < 768 ? 844 : 1000;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const section = page.locator("#builtProof");
    for (const image of await section.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
    }
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const sectionElement = document.querySelector("#builtProof");
      const heading = document.querySelector("#builtTitle");
      const titleUnit = heading.querySelector(".yamato-evidence__title-unit");
      const titleUnitStyle = getComputedStyle(titleUnit);
      const directProse = [...sectionElement.querySelectorAll("p, blockquote")]
        .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 1))
        .map((element) => ({ text: element.textContent.trim().slice(0, 24), size: Number.parseFloat(getComputedStyle(element).fontSize) }));
      const labels = [...sectionElement.querySelectorAll(".yamato-evidence__date, .yamato-evidence__kicker, .yamato-evidence__label")]
        .map((element) => ({ text: element.textContent.trim(), size: Number.parseFloat(getComputedStyle(element).fontSize) }));
      const itemHeadings = [...sectionElement.querySelectorAll(".yamato-evidence__item h3")]
        .map((element) => {
          const style = getComputedStyle(element);
          return { text: element.textContent.trim(), lines: Math.round(element.getBoundingClientRect().height / Number.parseFloat(style.lineHeight)) };
        });
      const cta = sectionElement.querySelector(".yamato-evidence__action");
      const ctaRect = cta.getBoundingClientRect();
      return {
        pageOverflow: root.scrollWidth > root.clientWidth,
        sectionOverflow: sectionElement.scrollWidth > sectionElement.clientWidth,
        headingText: heading.textContent.trim(),
        titleUnitLines: Math.round(titleUnit.getBoundingClientRect().height / Number.parseFloat(titleUnitStyle.lineHeight)),
        proseBelow15: directProse.filter((item) => item.size < 15),
        labelsBelow12: labels.filter((item) => item.size < 12),
        itemHeadingOrphans: itemHeadings.filter((item) => item.lines > 1),
        imagesReady: [...sectionElement.querySelectorAll("img")].every((image) => image.complete && image.naturalWidth > 0),
        cta: { href: cta.getAttribute("href"), width: Math.round(ctaRect.width), height: Math.round(ctaRect.height) },
        howWeBuildPresent: Boolean(document.querySelector("#howWeBuild")),
      };
    });
    const passed = !metrics.pageOverflow
      && !metrics.sectionOverflow
      && metrics.headingText === "770棟を支えた、3つの仕事"
      && metrics.titleUnitLines === 1
      && metrics.proseBelow15.length === 0
      && metrics.labelsBelow12.length === 0
      && metrics.itemHeadingOrphans.length === 0
      && metrics.imagesReady
      && metrics.cta.href === "works.html"
      && metrics.cta.height >= 44
      && metrics.howWeBuildPresent
      && errors.length === 0;
    results.push({ browser: engine.name, width, height, passed, ...metrics, errors });
    await page.close();
  }
  await browser.close();
}

await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
const failures = results.filter((result) => !result.passed);
console.log(JSON.stringify({ conditions: results.length, passed: results.length - failures.length, failed: failures.length, failures }));
if (failures.length) process.exitCode = 1;
