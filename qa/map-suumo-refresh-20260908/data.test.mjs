import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../../snapshots/', import.meta.url);
const previousRoot = new URL('land-payment-20260908-icon/', root);
const currentRoot = new URL('land-payment-20260908-suumo/', root);
const previous = await import(new URL('assets/land-payment-study/suumo-properties.mjs', previousRoot));
const current = await import(new URL('assets/land-payment-study/suumo-properties.mjs', currentRoot));
const catalog = await import(new URL('assets/land-payment-study/catalog.mjs', currentRoot));
const data = await import(new URL('assets/land-payment-study/data.mjs', currentRoot));
const stateModule = await import(new URL('assets/land-payment-study/state.mjs', currentRoot));
const inquiry = await import(new URL('assets/land-payment-study/inquiry-contract.mjs', currentRoot));
const estimateView = await import(new URL('assets/land-payment-study/views/estimate.mjs', currentRoot));
const {default: inquiryHandler} = await import(new URL('api/property-inquiries.mjs', currentRoot));

assert.equal(current.properties.length, 40);
assert.deepEqual(current.properties.map(({sourceUpdatedAt, ...rest}) => rest), previous.properties.map(({sourceUpdatedAt, ...rest}) => rest));

const counts = Object.groupBy(current.properties, ({sourceUpdatedAt}) => sourceUpdatedAt);
assert.equal(counts['2026-09-08']?.length, 23);
assert.equal(counts['2026-09-07']?.length, 17);
assert.deepEqual(Object.keys(counts).sort(), ['2026-09-07', '2026-09-08']);
assert.equal(catalog.catalogRevision, 'suumo-20260908-v1');
assert.equal(data.checkedAt, '2026-09-08');
assert.deepEqual(catalog.validateCatalog(), []);
assert.ok(catalog.properties.every((property) => property.plotId === null && property.availability === 'unverified' && property.precision === 'publisher-map-unverified'));

const sorted = catalog.queryCatalog({regions: []}, 'updated').map(({property}) => property);
assert.ok(sorted.slice(0, 23).every(({sourceUpdatedAt}) => sourceUpdatedAt === '2026-09-08'));
assert.ok(sorted.slice(23).every(({sourceUpdatedAt}) => sourceUpdatedAt === '2026-09-07'));
for (const date of ['2026-09-08', '2026-09-07']) {
  const ids = sorted.filter((property) => property.sourceUpdatedAt === date).map(({id}) => id);
  assert.deepEqual(ids, [...ids].sort());
}

const memoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values};
};
const savedStorage = memoryStorage({
  [stateModule.SAVED_KEY]: JSON.stringify({version: 2, items: {s21320158: {name: '佐保台西町', savedAt: '2026-09-07T00:00:00.000Z', revision: 'suumo-20260907-v1'}}}),
});
const store = stateModule.createStore(memoryStorage(), savedStorage);
assert.equal(store.has('s21320158'), true);
assert.equal(store.saved().s21320158.name, '佐保台西町');

const oldState = stateModule.normalizeState({
  version: 2,
  search: {filters: {}, selectedId: 's21320158'},
  common: {houseId: 'kyo', cashMan: '0', years: 35, financeId: 'nanto', finance: {}, destinations: ['', ''], arrival: ''},
  drafts: {old: {propertyId: 's21320158', landMan: '680', common: {houseId: 'kyo', cashMan: '0', years: 35, financeId: 'nanto', finance: {}, destinations: ['', ''], arrival: ''}, calculated: true, financeRevision: catalog.financeRevision, revision: 'suumo-20260907-v1'}},
  inquiry: {ids: ['s21320158'], draftId: 'old'},
});
const recovery = estimateView.resultView({get: () => oldState}, 'old');
assert.match(recovery, /物件情報が更新されています。/);
assert.match(recovery, /計算条件を確認する/);

const inquiryState = stateModule.normalizeState({version: 2, search: {filters: {}}, inquiry: {ids: ['s21320158']}});
const body = inquiry.buildInquiry(inquiryState);
assert.equal(body.candidates[0].dataRevision, 'suumo-20260908-v1');
assert.deepEqual(inquiry.validateInquiry(body).candidateIds, ['s21320158']);
assert.throws(() => inquiry.validateInquiry({...body, candidates: body.candidates.map((candidate) => ({...candidate, dataRevision: 'suumo-20260907-v1'}))}), /物件情報が更新されています/);
const request = async (payload) => {
  let status = 200;
  let value;
  await inquiryHandler({method: 'POST', body: payload}, {setHeader() {}, status(code) { status = code; return this; }, json(bodyValue) { value = bodyValue; return this; }});
  return {status, value};
};
const dryRun = await request({...body, dryRun: true});
assert.equal(dryRun.status, 200);
assert.equal(dryRun.value.valid, true);
assert.equal(dryRun.value.stored, false);
assert.equal(dryRun.value.sent, false);
const realSubmission = await request(body);
assert.equal(realSubmission.status, 503);
assert.equal(realSubmission.value.sent, false);

const sha256 = async (url) => createHash('sha256').update(await readFile(url)).digest('hex');
for (const relative of ['assets/land-payment-study/finance.mjs', 'assets/top-renewal/mortgage.mjs', 'api/property-inquiries.mjs']) {
  assert.equal(await sha256(new URL(relative, currentRoot)), await sha256(new URL(relative, previousRoot)), `${relative} changed unexpectedly`);
}

const searchSource = await readFile(new URL('assets/land-payment-study/views/search.mjs', currentRoot), 'utf8');
assert.match(searchSource, /情報提供日が新しい順です。/);
assert.doesNotMatch(searchSource, /情報提供日はすべて2026年9月6日です。/);
console.log('PASS data refresh: 40 listings, 23+17 dates, revision, state recovery, inquiry contract, unchanged finance/API');
