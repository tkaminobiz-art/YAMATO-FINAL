import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateMortgage} from '../../assets/top-renewal/mortgage.mjs';

const baseline = {principalYen:20_000_000, annualRatePercent:1.5, months:360};
const methods = ['annuity', 'equal-principal'];

// Independently re-opened 2026-09-05, JHF / Flat 35 original comparison table:
// https://www.flat35.com/loan/lineup/kinto/index.html
// month, payment, repaid principal, interest, remaining balance (all whole yen).
const official = {
  annuity: {
    total:24_848_426,
    rows:[
      [12,69_024,44_634,24_390,19_468_058],
      [60,69_024,47_392,21_632,17_258_727],
      [120,69_024,51_081,17_943,14_304_092],
      [180,69_024,55_056,13_968,11_119_489],
      [240,69_024,59_342,9_682,7_687_015],
      [300,69_024,63_960,5_064,3_987_379],
    ],
  },
  'equal-principal': {
    total:24_512_368,
    rows:[
      [12,79_791,55_555,24_236,19_333_340],
      [60,76_457,55_555,20_902,16_666_700],
      [120,72_291,55_555,16_736,13_333_400],
      [180,68_124,55_555,12_569,10_000_100],
      [240,63_957,55_555,8_402,6_666_800],
      [300,59_791,55_555,4_236,3_333_500],
    ],
  },
};

function invariants(input, result) {
  assert.equal(result.schedule.length, input.months);
  let opening = input.principalYen, paid = 0, principal = 0, interest = 0;
  const units = Math.round(input.annualRatePercent * 1000);
  for (const [index, row] of result.schedule.entries()) {
    assert.equal(row.month, index + 1);
    for (const key of ['paymentYen','principalYen','interestYen','balanceYen']) {
      assert(Number.isSafeInteger(row[key]) && row[key] >= 0, `${key} must be nonnegative safe integer`);
    }
    // Independent Number arithmetic is exact at the relevant integer boundary:
    // opening*units <= 4e13, and 1/1200000 exceeds its quotient's ULP.
    assert.equal(row.interestYen, Math.floor(opening * units / 1_200_000));
    assert.equal(row.paymentYen, row.principalYen + row.interestYen);
    assert.equal(row.balanceYen, opening - row.principalYen);
    assert(row.balanceYen <= opening);
    paid += row.paymentYen; principal += row.principalYen; interest += row.interestYen;
    opening = row.balanceYen;
  }
  assert.equal(opening, 0);
  assert.equal(principal, input.principalYen);
  assert.equal(result.totalPaymentYen, paid);
  assert.equal(result.totalInterestYen, interest);
  assert.equal(paid, principal + interest);
  assert.equal(result.firstPaymentYen, result.schedule[0].paymentYen);
  assert.equal(result.lastPaymentYen, result.schedule.at(-1).paymentYen);
  assert(Number.isSafeInteger(paid) && Number.isSafeInteger(interest));
  if ((input.method || 'annuity') === 'equal-principal') {
    assert.equal(result.regularPaymentYen, null);
    for (const row of result.schedule.slice(0, -1)) assert.equal(row.principalYen, Math.floor(input.principalYen / input.months));
  } else {
    assert(Number.isSafeInteger(result.regularPaymentYen) && result.regularPaymentYen >= 0);
    for (const row of result.schedule.slice(0, -1)) assert(row.paymentYen <= result.regularPaymentYen);
  }
  assert.doesNotThrow(() => JSON.stringify(result));
}

for (const method of methods) {
  test(`Official Flat 35 six rows and total: ${method}`, () => {
    const input = {...baseline, method}, result = calculateMortgage(input);
    assert.equal(result.totalPaymentYen, official[method].total);
    assert.equal(result.totalInterestYen, official[method].total - baseline.principalYen);
    if (method === 'annuity') assert.equal(result.regularPaymentYen, 69_024);
    for (const [month,paymentYen,principalYen,interestYen,balanceYen] of official[method].rows) {
      assert.deepEqual(result.schedule[month - 1], {month,paymentYen,principalYen,interestYen,balanceYen});
    }
    invariants(input, result);
  });
}

test('Default is annuity; equal-principal has no fixed monthly payment', () => {
  assert.deepEqual(calculateMortgage(baseline), calculateMortgage({...baseline,method:'annuity'}));
  const result = calculateMortgage({...baseline,method:'equal-principal'});
  assert.equal(result.regularPaymentYen, null);
  assert(result.firstPaymentYen > result.lastPaymentYen);
});

test('Zero principal: exactly months all-zero rows for both methods', () => {
  for (const method of methods) for (const annualRatePercent of [0,0.001,1.001,1.5,20]) for (const months of [12,360,600]) {
    const input={principalYen:0,annualRatePercent,months,method}, result=calculateMortgage(input);
    invariants(input,result);
    assert.equal(result.totalPaymentYen,0); assert.equal(result.totalInterestYen,0);
    assert(result.schedule.every(row=>row.paymentYen===0 && row.principalYen===0 && row.interestYen===0 && row.balanceYen===0));
  }
});

test('Zero interest: exact principal sum and final remainder, no division by zero', () => {
  for (const method of methods) for (const principalYen of [1,11,12,13,599,600,601,1_000_001,2_000_000_000]) for (const months of [12,13,360,600]) {
    const input={principalYen,annualRatePercent:0,months,method},result=calculateMortgage(input);
    invariants(input,result);assert.equal(result.totalPaymentYen,principalYen);
    assert.equal(result.totalInterestYen,0);
    assert.equal(result.lastPaymentYen,principalYen-Math.floor(principalYen/months)*(months-1));
  }
});

test('Tiny principal: explicit zero regular installments and final settlement', () => {
  for (const method of methods) {
    const result=calculateMortgage({principalYen:1,annualRatePercent:20,months:600,method});
    assert(result.schedule.slice(0,-1).every(row=>row.paymentYen===0 && row.balanceYen===1));
    assert.equal(result.lastPaymentYen,1);assert.equal(result.totalPaymentYen,1);
  }
});

test('Full allowed boundary matrix: integers, no overflow, exact final zero', () => {
  for (const method of methods) for (const principalYen of [0,1,11,12,599,600,601,1_000,123_457,20_000_000,1_999_999_999,2_000_000_000])
    for (const annualRatePercent of [0,0.001,0.009,0.1,0.3,1.001,1.5,19.999,20]) for (const months of [12,13,359,360,599,600]) {
      const input={principalYen,annualRatePercent,months,method};invariants(input,calculateMortgage(input));
    }
});

test('Reject type coercion, non-finite, unsupported method and invalid ranges', () => {
  for(const argument of [undefined,null,[],42,'input',true]) assert.throws(()=>calculateMortgage(argument),TypeError);
  for(const field of ['principalYen','annualRatePercent','months']) {
    for(const value of ['1',null,undefined,true,1n,new Number(1)]) assert.throws(()=>calculateMortgage({...baseline,[field]:value}),TypeError);
    for(const value of [NaN,Infinity,-Infinity]) assert.throws(()=>calculateMortgage({...baseline,[field]:value}),RangeError);
  }
  for(const principalYen of [-1,0.1,2_000_000_001,Number.MAX_SAFE_INTEGER]) assert.throws(()=>calculateMortgage({...baseline,principalYen}),RangeError);
  for(const annualRatePercent of [-0.001,20.001,0.0001,1.0001,1.0000000000000002,0.1+0.2]) assert.throws(()=>calculateMortgage({...baseline,annualRatePercent}),RangeError);
  for(const months of [0,11,601,12.1]) assert.throws(()=>calculateMortgage({...baseline,months}),RangeError);
  for(const method of ['',null,'equal','Annuity',0]) assert.throws(()=>calculateMortgage({...baseline,method}),RangeError);
});

test('All 20,001 supported rate literals pass validation; no artificial epsilon', () => {
  for(let units=0;units<=20_000;units++) {
    const result=calculateMortgage({principalYen:1,annualRatePercent:units/1000,months:12});
    assert.equal(result.totalPaymentYen,1);
  }
});

let seed=0x09052026;
function randomInt(max) {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed % max;}

test('2,000 deterministic randomized schedules and conservation checks', () => {
  for(let i=0;i<2_000;i++) {
    const input={principalYen:randomInt(2_000_000_001),annualRatePercent:randomInt(20_001)/1000,months:12+randomInt(589),method:methods[i%2]};
    invariants(input,calculateMortgage(input));
  }
});

test('Independent stable floating formula agrees away from integer boundaries', () => {
  let verified=0;
  for(let i=0;i<500;i++) {
    const input={principalYen:1_000_000+randomInt(1_999_000_001),annualRatePercent:(1+randomInt(20_000))/1000,months:12+randomInt(589)};
    const rate=input.annualRatePercent/1200;
    const oracle=input.principalYen*rate / -Math.expm1(-input.months*Math.log1p(rate));
    // This oracle is deliberately independent and floating, not production's
    // exact rational exponentiation. Do not let oracle rounding judge a boundary.
    if(Math.abs(oracle-Math.round(oracle))<1e-6) continue;
    assert.equal(calculateMortgage(input).regularPaymentYen,Math.floor(oracle));verified++;
  }
  assert(verified>450);
});

test('Loan-scale comparison: longer term lowers regular payment, increases interest', () => {
  for(const principalYen of [1_000_000,20_000_000,200_000_000,2_000_000_000]) for(const annualRatePercent of [0.1,1.5,5,20]) {
    let previous=null;
    for(const months of [12,120,240,360,480,600]) {
      const result=calculateMortgage({principalYen,annualRatePercent,months});
      if(previous){assert(result.regularPaymentYen<=previous.regularPaymentYen);assert(result.totalInterestYen>=previous.totalInterestYen);}
      previous=result;
    }
  }
});

test('Loan-scale comparison: rate/principal increases and repayment methods', () => {
  for(const method of methods) for(const principalYen of [1_000_000,20_000_000,2_000_000_000]) for(const months of [12,360,600]) {
    let previous=null;
    for(const annualRatePercent of [0,0.1,0.5,1,1.5,3,10,20]) {
      const result=calculateMortgage({principalYen,annualRatePercent,months,method});
      if(previous){assert(result.firstPaymentYen>=previous.firstPaymentYen);assert(result.totalInterestYen>=previous.totalInterestYen);}
      previous=result;
    }
  }
  for(const method of methods) for(const annualRatePercent of [0,1.5,20]) for(const months of [12,360,600]) {
    let previous=null;
    for(const principalYen of [1_000_000,2_000_000,20_000_000,200_000_000,2_000_000_000]) {
      const result=calculateMortgage({principalYen,annualRatePercent,months,method});
      if(previous){assert(result.firstPaymentYen>=previous.firstPaymentYen);assert(result.totalPaymentYen>=previous.totalPaymentYen);}
      previous=result;
    }
  }
  const annuity=calculateMortgage(baseline),equal=calculateMortgage({...baseline,method:'equal-principal'});
  assert(equal.firstPaymentYen>annuity.firstPaymentYen);
  assert(equal.totalInterestYen<annuity.totalInterestYen);
  assert.equal(annuity.totalPaymentYen-equal.totalPaymentYen,336_058);
});

test('No mutation or shared arrays between calls; JSON contains numbers, no BigInt', () => {
  const input=Object.freeze({...baseline});const a=calculateMortgage(input),b=calculateMortgage(input);
  a.schedule[0].balanceYen=0;
  assert.notEqual(a.schedule[0].balanceYen,b.schedule[0].balanceYen);
  assert.deepEqual(input,baseline);assert.deepEqual(JSON.parse(JSON.stringify(b)),b);
});
