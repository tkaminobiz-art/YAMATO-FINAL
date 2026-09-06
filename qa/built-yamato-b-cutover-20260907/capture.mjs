import { chromium, webkit } from "/Users/takahirokamino/.codex/toolchains/web-quality-gates/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const url = "http://127.0.0.1:4182/index.html#builtProof";
const mode = process.argv[2] === "before" ? "before" : "after";
const engines = [
  {
    name: "chromium",
    type: chromium,
    launch: { headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" },
  },
  { name: "webkit", type: webkit, launch: { headless: true } },
];

for (const engine of engines) {
  const browser = await engine.type.launch(engine.launch);
  for (const [width, height, suffix] of [
    [1440, 1000, "pc"],
    [390, 844, "sp"],
    [320, 720, "sp-320"],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const section = page.locator("#builtProof");
    await section.scrollIntoViewIfNeeded();
    for (const image of await section.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
    }
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const sectionElement = document.querySelector("#builtProof");
      const heading = document.querySelector("#builtTitle");
      const links = [...sectionElement.querySelectorAll("a")];
      const images = [...sectionElement.querySelectorAll("img")];
      return {
        pageOverflow: root.scrollWidth > root.clientWidth,
        sectionOverflow: sectionElement.scrollWidth > sectionElement.clientWidth,
        sectionHeight: Math.round(sectionElement.getBoundingClientRect().height),
        headingText: heading?.textContent.trim() ?? "",
        headingFontSize: heading ? getComputedStyle(heading).fontSize : null,
        links: links.map((link) => ({ text: link.textContent.trim(), href: link.getAttribute("href") })),
        images: images.map((img) => ({ src: img.getAttribute("src"), complete: img.complete, naturalWidth: img.naturalWidth })),
      };
    });
    const path = `${outputDir}${mode}-${engine.name}-${suffix}.png`;
    await page.screenshot({ path });
    if (mode === "after" && engine.name === "chromium") {
      await section.screenshot({ path: `${outputDir}after-section-${suffix}.png` });
    }
    console.log(JSON.stringify({ mode, browser: engine.name, width, height, ...metrics, errors }));
    await page.close();
  }
  await browser.close();
}
