export const fmt = (n, dec = 2) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtUSD2 = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

/* Monthly payment for an amortizing loan */
export function monthlyPayment(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/* Full amortization schedule */
export function amortizeSchedule(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  const pmt = monthlyPayment(principal, annualRate, months);
  let balance = principal;
  const rows = [];
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPaid = pmt - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month: i, payment: pmt, principal: principalPaid, interest, balance });
  }
  return rows;
}

/* 2024 US federal marginal tax brackets (single filer) */
const BRACKETS_SINGLE = [
  { rate: 10, min: 0,       max: 11600 },
  { rate: 12, min: 11600,   max: 47150 },
  { rate: 22, min: 47150,   max: 100525 },
  { rate: 24, min: 100525,  max: 191950 },
  { rate: 32, min: 191950,  max: 243725 },
  { rate: 35, min: 243725,  max: 609350 },
  { rate: 37, min: 609350,  max: Infinity },
];
const BRACKETS_MARRIED = [
  { rate: 10, min: 0,       max: 23200 },
  { rate: 12, min: 23200,   max: 94300 },
  { rate: 22, min: 94300,   max: 201050 },
  { rate: 24, min: 201050,  max: 383900 },
  { rate: 32, min: 383900,  max: 487450 },
  { rate: 35, min: 487450,  max: 731200 },
  { rate: 37, min: 731200,  max: Infinity },
];
const STD_DEDUCTIONS = { single: 14600, married: 29200, hoh: 21900 };

export function calcFederalTax(grossIncome, filingStatus) {
  const deduction = STD_DEDUCTIONS[filingStatus] || STD_DEDUCTIONS.single;
  const brackets = filingStatus === 'married' ? BRACKETS_MARRIED : BRACKETS_SINGLE;
  const taxable = Math.max(0, grossIncome - deduction);
  let tax = 0;
  const breakdown = [];
  for (const b of brackets) {
    if (taxable <= b.min) break;
    const taxed = Math.min(taxable, b.max) - b.min;
    const amount = taxed * (b.rate / 100);
    tax += amount;
    breakdown.push({ rate: b.rate, taxed, amount });
  }
  return { tax, taxable, deduction, breakdown, effectiveRate: grossIncome ? (tax / grossIncome) * 100 : 0 };
}

/* Social security + Medicare (FICA) */
export function calcFICA(grossIncome) {
  const ssWage = Math.min(grossIncome, 168600);
  const ss   = ssWage * 0.062;
  const medi = grossIncome * 0.0145;
  const addMedi = grossIncome > 200000 ? (grossIncome - 200000) * 0.009 : 0;
  return { ss, medi: medi + addMedi, total: ss + medi + addMedi };
}

/* Months to pay off credit card */
export function creditCardPayoff(balance, apr, monthlyPaymentAmt) {
  if (monthlyPaymentAmt <= 0) return null;
  const r = apr / 100 / 12;
  if (r === 0) return { months: Math.ceil(balance / monthlyPaymentAmt), totalInterest: 0, totalPaid: balance };
  const minToPaySomething = balance * r;
  if (monthlyPaymentAmt <= minToPaySomething) return null; // payment doesn't cover interest
  const months = Math.ceil(-Math.log(1 - (balance * r) / monthlyPaymentAmt) / Math.log(1 + r));
  const totalPaid = monthlyPaymentAmt * months;
  return { months, totalInterest: totalPaid - balance, totalPaid };
}
