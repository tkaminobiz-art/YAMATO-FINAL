/**
 * Fixed-rate monthly mortgage estimate, not a lender's repayment quotation.
 *
 * Assumptions: one constant annual nominal rate, monthly rate = annual / 12,
 * monthly payments in arrears, no bonus payments, fees, insurance, taxes,
 * daily accrual, rate changes, holidays, subsidies, or prepayments.
 *
 * Rounding contract:
 * - Input annual percentage has at most three decimal places.
 * - Each month's interest is floored to whole yen on its opening balance.
 * - Annuity: floor the mathematically exact regular payment to whole yen.
 * - Equal principal: floor original principal / months for regular principal.
 * - Cap principal repayment at the remaining balance. Settle all remaining
 *   principal plus that month's interest in the final scheduled month.
 * - Return exactly `months` rows, including zero rows after any early payoff.
 * - Tiny loans can have zero regular principal/payment due to rounding; the
 *   final installment then settles the remaining principal. No hidden minimum.
 *
 * All rounding-critical arithmetic uses integer BigInt ratios internally.
 * The bounded public results are safe integer Numbers, suitable for JSON.
 */

const MAX_PRINCIPAL_YEN = 2_000_000_000;
const PERCENT_SCALE = 1_000;
// Annual percentage * 1,000 divided by (100 * 1,000 * 12).
const MONTHLY_RATE_DENOMINATOR = 1_200_000n;

function finiteNumber(value, name) {
  if (typeof value !== 'number') throw new TypeError(`${name} must be a number`);
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function annuityPayment(principal, rateNumerator, rateDenominator, months) {
  if (rateNumerator === 0n) return principal / BigInt(months);
  // P*r/(1-(1+r)^-n), expressed as an exact ratio; no floating-point pow,
  // subtraction cancellation, epsilon correction, or near-integer ambiguity.
  const growth = (rateDenominator + rateNumerator) ** BigInt(months);
  const discount = rateDenominator ** BigInt(months);
  return (principal * rateNumerator * growth)
    / (rateDenominator * (growth - discount));
}

/**
 * @param {{principalYen:number, annualRatePercent:number, months:number,
 * method?:'annuity'|'equal-principal'}} options
 * @returns {{regularPaymentYen:number|null, firstPaymentYen:number,
 * lastPaymentYen:number, totalPaymentYen:number, totalInterestYen:number,
 * schedule:Array<{month:number,paymentYen:number,principalYen:number,
 * interestYen:number,balanceYen:number}>}}
 * `regularPaymentYen` is null for equal-principal (payments vary).
 * `lastPaymentYen` is the payment at the requested final month, even if zero
 * after early payoff. Schedule principalYen means principal REPAID that month.
 * @throws {TypeError|RangeError} Invalid input; numeric strings are not coerced.
 */
export function calculateMortgage(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Mortgage options must be an object');
  }
  const {principalYen, annualRatePercent, months, method = 'annuity'} = options;
  finiteNumber(principalYen, 'principalYen');
  finiteNumber(annualRatePercent, 'annualRatePercent');
  finiteNumber(months, 'months');
  if (!Number.isInteger(principalYen) || principalYen < 0 || principalYen > MAX_PRINCIPAL_YEN) {
    throw new RangeError('principalYen must be an integer from 0 to 2000000000');
  }
  if (annualRatePercent < 0 || annualRatePercent > 20) {
    throw new RangeError('annualRatePercent must be from 0 to 20');
  }
  const rateUnits = Math.round(annualRatePercent * PERCENT_SCALE);
  // Division round-trip accepts ordinary literals such as 1.001, despite the
  // binary product 1.001*1000. It does not silently round genuine extra digits.
  if (rateUnits / PERCENT_SCALE !== annualRatePercent) {
    throw new RangeError('annualRatePercent must have at most three decimal places');
  }
  if (!Number.isInteger(months) || months < 12 || months > 600) {
    throw new RangeError('months must be an integer from 12 to 600');
  }
  if (method !== 'annuity' && method !== 'equal-principal') {
    throw new RangeError('method must be annuity or equal-principal');
  }

  const principal = BigInt(principalYen);
  const rawRate = BigInt(rateUnits);
  const divisor = gcd(rawRate, MONTHLY_RATE_DENOMINATOR);
  const rateNumerator = rawRate / divisor;
  const rateDenominator = MONTHLY_RATE_DENOMINATOR / divisor;
  const regular = method === 'annuity'
    ? annuityPayment(principal, rateNumerator, rateDenominator, months)
    : null;
  const regularPrincipal = principal / BigInt(months);
  let balance = principal, totalPayment = 0n, totalInterest = 0n;
  const schedule = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = (balance * rateNumerator) / rateDenominator;
    let repaidPrincipal;
    if (month === months) {
      repaidPrincipal = balance;
    } else if (method === 'equal-principal') {
      repaidPrincipal = regularPrincipal < balance ? regularPrincipal : balance;
    } else {
      const duePrincipal = regular - interest;
      // The annuity formula ensures regular >= floored opening interest.
      // Fail closed if a future change ever violates this invariant.
      if (duePrincipal < 0n) throw new RangeError('Repayment would increase the principal balance');
      repaidPrincipal = duePrincipal < balance ? duePrincipal : balance;
    }
    const payment = repaidPrincipal + interest;
    balance -= repaidPrincipal;
    totalPayment += payment;
    totalInterest += interest;
    schedule.push({month, paymentYen:Number(payment), principalYen:Number(repaidPrincipal),
      interestYen:Number(interest), balanceYen:Number(balance)});
  }

  return {
    regularPaymentYen: regular === null ? null : Number(regular),
    firstPaymentYen: schedule[0].paymentYen,
    lastPaymentYen: schedule.at(-1).paymentYen,
    totalPaymentYen: Number(totalPayment),
    totalInterestYen: Number(totalInterest),
    schedule,
  };
}
