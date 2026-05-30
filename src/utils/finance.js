export const fmt = (n, dec = 2) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtUSD2 = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function monthlyPayment(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

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

/* 2025 US federal marginal tax brackets */
const BRACKETS_SINGLE = [
  { rate: 10, min: 0,       max: 11925 },
  { rate: 12, min: 11925,   max: 48475 },
  { rate: 22, min: 48475,   max: 103350 },
  { rate: 24, min: 103350,  max: 197300 },
  { rate: 32, min: 197300,  max: 250525 },
  { rate: 35, min: 250525,  max: 626350 },
  { rate: 37, min: 626350,  max: Infinity },
];
const BRACKETS_MARRIED = [
  { rate: 10, min: 0,       max: 23850 },
  { rate: 12, min: 23850,   max: 96950 },
  { rate: 22, min: 96950,   max: 206700 },
  { rate: 24, min: 206700,  max: 394600 },
  { rate: 32, min: 394600,  max: 501050 },
  { rate: 35, min: 501050,  max: 751600 },
  { rate: 37, min: 751600,  max: Infinity },
];
const BRACKETS_HOH = [
  { rate: 10, min: 0,       max: 17000 },
  { rate: 12, min: 17000,   max: 64850 },
  { rate: 22, min: 64850,   max: 103350 },
  { rate: 24, min: 103350,  max: 197300 },
  { rate: 32, min: 197300,  max: 250500 },
  { rate: 35, min: 250500,  max: 626350 },
  { rate: 37, min: 626350,  max: Infinity },
];
const STD_DEDUCTIONS = { single: 15000, married: 30000, hoh: 22500 };

export function calcFederalTax(grossIncome, filingStatus) {
  const deduction = STD_DEDUCTIONS[filingStatus] || STD_DEDUCTIONS.single;
  const brackets  = filingStatus === 'married' ? BRACKETS_MARRIED
                  : filingStatus === 'hoh'     ? BRACKETS_HOH
                  : BRACKETS_SINGLE;
  const taxable = Math.max(0, grossIncome - deduction);
  let tax = 0;
  const breakdown = [];
  for (const b of brackets) {
    if (taxable <= b.min) break;
    const taxed  = Math.min(taxable, b.max) - b.min;
    const amount = taxed * (b.rate / 100);
    tax += amount;
    breakdown.push({ rate: b.rate, taxed, amount });
  }
  return { tax, taxable, deduction, breakdown, effectiveRate: grossIncome ? (tax / grossIncome) * 100 : 0 };
}

/* Social Security + Medicare (FICA) — 2025 SS wage base $176,100 */
export function calcFICA(grossIncome) {
  const ssWage  = Math.min(grossIncome, 176100);
  const ss      = ssWage * 0.062;
  const medi    = grossIncome * 0.0145;
  const addMedi = grossIncome > 200000 ? (grossIncome - 200000) * 0.009 : 0;
  return { ss, medi: medi + addMedi, total: ss + medi + addMedi };
}

export function creditCardPayoff(balance, apr, monthlyPaymentAmt) {
  if (monthlyPaymentAmt <= 0) return null;
  const r = apr / 100 / 12;
  if (r === 0) return { months: Math.ceil(balance / monthlyPaymentAmt), totalInterest: 0, totalPaid: balance };
  const minToPaySomething = balance * r;
  if (monthlyPaymentAmt <= minToPaySomething) return null;
  const months   = Math.ceil(-Math.log(1 - (balance * r) / monthlyPaymentAmt) / Math.log(1 + r));
  const totalPaid = monthlyPaymentAmt * months;
  return { months, totalInterest: totalPaid - balance, totalPaid };
}

/* Simulate debt payoff with rollover (avalanche or snowball) */
export function simulateDebtPayoff(cards, extraBudget, strategy) {
  if (!cards.length) return null;
  const rates    = cards.map(c => c.apr / 100 / 12);
  let balances   = [...cards.map(c => c.balance)];
  const payoffMonths = new Array(cards.length).fill(0);
  let totalInterest = 0, month = 0, freedPayments = 0;

  for (let i = 0; i < cards.length; i++) {
    if (balances[i] > 0 && cards[i].payment <= balances[i] * rates[i]) return null;
  }

  while (balances.some(b => b > 0.01) && month < 600) {
    month++;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0) {
        const interest = balances[i] * rates[i];
        totalInterest += interest;
        balances[i] += interest;
      }
    }

    const sorted = balances
      .map((b, i) => ({ i, b }))
      .filter(x => x.b > 0.01)
      .sort((a, b) => strategy === 'avalanche'
        ? cards[b.i].apr - cards[a.i].apr
        : a.b - b.b)
      .map(x => x.i);

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0.01) {
        const pay = Math.min(cards[i].payment, balances[i]);
        balances[i] = Math.max(0, balances[i] - pay);
        if (balances[i] < 0.01 && !payoffMonths[i]) {
          balances[i] = 0;
          payoffMonths[i] = month;
          freedPayments += cards[i].payment;
        }
      }
    }

    const totalExtra = extraBudget + freedPayments;
    if (sorted.length > 0 && totalExtra > 0) {
      const idx = sorted[0];
      if (balances[idx] > 0.01) {
        const pay = Math.min(totalExtra, balances[idx]);
        balances[idx] = Math.max(0, balances[idx] - pay);
        if (balances[idx] < 0.01 && !payoffMonths[idx]) {
          balances[idx] = 0;
          payoffMonths[idx] = month;
          freedPayments += cards[idx].payment;
        }
      }
    }
  }

  return { months: month, totalInterest, payoffMonths };
}
