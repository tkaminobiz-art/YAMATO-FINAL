import {chromium} from '/Users/takahirokamino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';

const base = process.env.STUDY_URL || 'http://127.0.0.1:4198/land-payment-study.html';
const runTag = process.env.RUN_LABEL || (process.env.STUDY_URL ? 'production' : 'local');
const executablePath = '/Users/takahirokamino/.agent-browser/browsers/chrome-149.0.7827.55/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch({executablePath});
const report = {base, checks: [], errors: [], screenshots: []};
const check = (name, value, details) => {
  report.checks.push({name, ok: Boolean(value), details});
  if (!value) throw new Error(`${name}: ${JSON.stringify(details)}`);
};

async function run(viewport, label) {
  const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
  await context.addInitScript(() => {
    localStorage.setItem('yamato-land-study:saved:v2', JSON.stringify({version: 2, items: {s21320158: {name: '佐保台西町', savedAt: '2026-09-07T00:00:00.000Z', revision: 'suumo-20260907-v1'}}}));
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push({label, type: 'pageerror', message: error.message}));
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push({label, type: 'console', message: message.text()}); });
  await page.goto(`${base}#/search?view=list`, {waitUntil: 'domcontentloaded'});
  await page.locator('#count').filter({hasText: '40件'}).waitFor();
  check(`${label}: 40 listings`, await page.locator('#list .property-card').count() === 40);
  check(`${label}: saved listing restored`, await page.locator('#saved-count').innerText() === '1');
  await page.locator('#sort').selectOption('updated');
  check(`${label}: updated sort explanation`, await page.locator('#match-note').innerText() === '情報提供日が新しい順です。');
  check(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (viewport.width >= 901) {
    check(`${label}: map visible with list`, await page.locator('#map-shell').isVisible());
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    check(`${label}: desktop map is not sticky`, await page.locator('#map-shell').evaluate((node) => node.getBoundingClientRect().bottom < 0));
    await page.evaluate(() => scrollTo(0, 0));
  } else {
    check(`${label}: list switch active`, await page.locator('#list-view').getAttribute('aria-pressed') === 'true');
  }
  const searchShot = new URL(`${label}-search.png`, out);
  await page.screenshot({path: searchShot.pathname, fullPage: false});
  report.screenshots.push(searchShot.pathname);

  await page.goto(`${base}#/property/s21320158`, {waitUntil: 'domcontentloaded'});
  await page.locator('.property-detail').waitFor();
  check(`${label}: property date is current`, (await page.locator('.source-date').innerText()).includes('2026年9月7日'));
  check(`${label}: material dates are current`, (await page.locator('#materials-section').innerText()).includes('2026年9月7日') && (await page.locator('#materials-section').innerText()).includes('2026年9月8日'));
  check(`${label}: saved property remains saved`, await page.locator('.property-buttons [data-save]').getAttribute('aria-pressed') === 'true');
  check(`${label}: TOP route preserved`, await page.locator('a[href="https://yamato-final.vercel.app/"]').count() > 0);

  await page.locator('[data-estimate="s21320158"]').first().click();
  await page.locator('[name="houseId"][value="kyo"]').check();
  await page.locator('#estimate-form [type="submit"]').click();
  await page.locator('#monthly-value').waitFor();
  check(`${label}: estimate result rendered`, /\d/.test(await page.locator('#monthly-value').innerText()));
  check(`${label}: three finance products available`, await page.locator('[data-finance]').count() === 3);
  await page.locator('[data-finance="flat-a"]').click();
  check(`${label}: finance switch works`, await page.locator('[data-finance="flat-a"]').getAttribute('aria-pressed') === 'true');
  const resultShot = new URL(`${label}-result.png`, out);
  await page.screenshot({path: resultShot.pathname, fullPage: false});
  report.screenshots.push(resultShot.pathname);
  await context.close();
}

await run({width: 1440, height: 900}, `${runTag}-pc-1440`);
await run({width: 390, height: 844}, `${runTag}-sp-390`);

const recoveryContext = await browser.newContext({viewport: {width: 390, height: 844}});
await recoveryContext.addInitScript(() => {
  sessionStorage.setItem('yamato-land-study:session:v2', JSON.stringify({
    version: 2,
    route: {page: 'result', id: 'old'},
    search: {filters: {}, selectedId: 's21320158'},
    common: {houseId: 'kyo', cashMan: '0', years: 35, financeId: 'nanto', finance: {}, destinations: ['', ''], arrival: ''},
    drafts: {old: {propertyId: 's21320158', landMan: '680', common: {houseId: 'kyo', cashMan: '0', years: 35, financeId: 'nanto', finance: {}, destinations: ['', ''], arrival: ''}, calculated: true, financeRevision: '2026-09-07-accuracy-1', revision: 'suumo-20260907-v1'}},
    inquiry: {ids: ['s21320158'], draftId: 'old'},
  }));
});
const recoveryPage = await recoveryContext.newPage();
await recoveryPage.goto(`${base}#/result/old`, {waitUntil: 'domcontentloaded'});
await recoveryPage.locator('h1').filter({hasText: '条件を確認して再計算してください'}).waitFor();
check('old state: recovery message', (await recoveryPage.locator('.status-note').innerText()).includes('物件情報が更新されています。'));
check('old state: inputs preserved', await recoveryPage.locator('[data-edit-estimate="old"]').count() === 1);
await recoveryContext.close();

check('browser: no console or page errors', report.errors.length === 0, report.errors);
await browser.close();
await writeFile(new URL(`${runTag}-browser.json`, out), JSON.stringify(report, null, 2));
console.log(JSON.stringify({checks: report.checks.length, screenshots: report.screenshots.length, errors: report.errors.length}));
