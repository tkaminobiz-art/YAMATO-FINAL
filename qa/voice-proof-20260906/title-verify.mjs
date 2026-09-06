import { chromium } from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base = process.argv[2] || 'http://127.0.0.1:4182';
const browser = await chromium.launch({ headless: true });
const expected = {
  reasonTitle: '土地・設計・施工の自社一貫体制',
  lineupTitle: '商品ラインナップ',
  worksTitle: '施工事例',
  voiceTitle: 'お客様の声',
  naraTitle: '奈良から大阪への通勤',
  faqTitle: 'よくある質問',
  instagramTitle: 'Instagram',
  newsTitle: '新着情報',
  visitTitle: 'モデルハウス見学',
};

const results = [];
for (const viewport of [
  { width: 1440, height: 1131, name: 'pc-1440' },
  { width: 390, height: 1131, name: 'sp-390' },
  { width: 320, height: 844, name: 'sp-320' },
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${base}/index.html?v=title-verify-20260906#voice`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const titles = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => [
    id,
    document.getElementById(id)?.textContent?.replace(/\s+/g, '') || '',
  ])), Object.keys(expected));

  const overflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  const voiceMetrics = await page.evaluate(() => {
    const section = document.getElementById('voice');
    const title = document.getElementById('voiceTitle');
    const mainQuote = document.querySelector('.voice-proof__feature blockquote');
    const supportingQuote = document.querySelector('.voice-proof__item blockquote');
    const titleStyle = getComputedStyle(title);
    const mainStyle = getComputedStyle(mainQuote);
    const supportingStyle = getComputedStyle(supportingQuote);
    return {
      sectionHeight: Math.round(section.getBoundingClientRect().height),
      titleFontSize: titleStyle.fontSize,
      titleLineHeight: titleStyle.lineHeight,
      titleFontFamily: titleStyle.fontFamily,
      mainQuoteFontSize: mainStyle.fontSize,
      mainQuoteLineHeight: mainStyle.lineHeight,
      mainQuoteFontFamily: mainStyle.fontFamily,
      supportingQuoteFontSize: supportingStyle.fontSize,
      fontsStatus: document.fonts.status,
      fontLoaded: document.fonts.check('400 16px "Zen Kaku Gothic New"', 'お客様の声'),
    };
  });

  const mismatches = Object.entries(expected).filter(([id, value]) => titles[id] !== value);
  results.push({ viewport: viewport.name, titles, overflow, voiceMetrics, mismatches });

  if (viewport.width === 1440 || viewport.width === 390) {
    const voice = page.locator('#voice');
    await voice.scrollIntoViewIfNeeded();
    const top = await voice.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((value) => window.scrollTo(0, value), top);
    await page.screenshot({
      path: `qa/voice-proof-20260906/voice-${viewport.width === 1440 ? 'pc-1440' : 'sp-390'}.jpg`,
      type: 'jpeg',
      quality: 90,
    });

    if (viewport.width === 390) {
      const bottom = await voice.evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);
      await page.evaluate(({ value, height }) => window.scrollTo(0, value - height), { value: bottom, height: viewport.height });
      await page.screenshot({
        path: 'qa/voice-proof-20260906/voice-sp-390-bottom.jpg',
        type: 'jpeg',
        quality: 90,
      });
    }
  }

  await page.close();
}

await browser.close();

const failed = results.some((result) => (
  result.mismatches.length > 0
  || result.overflow.scrollWidth !== result.overflow.innerWidth
));

console.log(JSON.stringify({ failed, results }, null, 2));
process.exitCode = failed ? 1 : 0;
