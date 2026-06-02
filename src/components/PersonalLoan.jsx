import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

/* ─── helpers ─────────────────────────────────────────────── */
function calcMonthly(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function loanStats(principal, annualRate, months) {
  const monthly    = calcMonthly(principal, annualRate, months);
  const totalCost  = monthly * months;
  const totalInterest = totalCost - principal;
  return { monthly, totalInterest, totalCost };
}

/* ─── Rate band config ────────────────────────────────────── */
const RATE_BANDS = [
  { rangeKey: 'personalLoan.rateRange1', labelKey: 'personalLoan.rateExcellent', color: '#1e8449', min: 0,  max: 10  },
  { rangeKey: 'personalLoan.rateRange2', labelKey: 'personalLoan.rateGood',      color: '#27ae60', min: 10, max: 15  },
  { rangeKey: 'personalLoan.rateRange3', labelKey: 'personalLoan.rateFair',      color: '#f39c12', min: 15, max: 20  },
  { rangeKey: 'personalLoan.rateRange4', labelKey: 'personalLoan.rateHigh',      color: '#e67e22', min: 20, max: 30  },
  { rangeKey: 'personalLoan.rateRange5', labelKey: 'personalLoan.ratePredatory', color: '#c0392b', min: 30, max: Infinity },
];

function getBand(rate) {
  return RATE_BANDS.findIndex(b => rate >= b.min && rate < b.max);
}

/* ─── Credit score rows ───────────────────────────────────── */
const SCORE_ROWS = [
  { range: '750–850', ratingKey: 'personalLoan.rateExcellent', apr: 7  },
  { range: '700–749', ratingKey: 'personalLoan.rateGood',      apr: 12 },
  { range: '650–699', ratingKey: 'personalLoan.rateFair',      apr: 18 },
  { range: '600–649', ratingKey: 'personalLoan.rateHigh',      apr: 25 },
  { range: '< 600',   ratingKey: 'personalLoan.ratePredatory', apr: 33 },
];

/* ─── Comparison rates ─────────────────────────────────────── */
const COMP_RATES = [10, 20, 35];
const COMP_COLORS = { 10: '#1e8449', 20: '#e67e22', 35: '#c0392b' };

/* ─── Good lenders ─────────────────────────────────────────── */
const GOOD_LENDERS = [
  { name: 'Local Credit Unions',        rates: '5–18%',        minCredit: 'Often flexible' },
  { name: 'SoFi',                        rates: '8.99–25.81%',  minCredit: '680' },
  { name: 'LightStream',                 rates: '7.49–25.49%',  minCredit: '660' },
  { name: 'Marcus by Goldman Sachs',     rates: '6.99–24.99%',  minCredit: '660' },
  { name: 'PenFed Credit Union',         rates: '7.99–17.99%',  minCredit: '580' },
];

const AVOID_LENDERS = [
  'Opportune Financial', 'OppFi', 'Check Into Cash', 'CashNetUSA',
  'Avant', 'World Finance', 'OneMain Financial', 'Mariner Finance',
];

const RED_FLAGS = [
  'No APR disclosed before signing',
  'Guaranteed approval promises',
  'Prepayment penalties',
  'Loan flipping / refinancing pressure',
  'Aggressive insurance add-on upselling',
  'Rates not clearly disclosed in the contract',
];

/* ═══════════════════════════════════════════════════════════ */
export default function PersonalLoan() {
  const t = useT();

  const [amount, setAmount] = useLocalState('pl-amount', 0);
  const [rate,   setRate]   = useLocalState('pl-rate',   0);
  const [term,   setTerm]   = useLocalState('pl-term',   36);

  /* ── main calc ── */
  const calc = useMemo(() => {
    const principal = Math.max(0, Number(amount) || 0);
    const apr       = Math.max(0, Number(rate)   || 0);
    const months    = Math.max(1, Number(term)   || 1);
    return loanStats(principal, apr, months);
  }, [amount, rate, term]);

  /* ── rate band ── */
  const activeBand = useMemo(() => getBand(Number(rate) || 0), [rate]);
  const isPredatory = (Number(rate) || 0) >= 30;

  /* ── comparison table ── */
  const compData = useMemo(() =>
    COMP_RATES.map(r => {
      const s = loanStats(10000, r, 60);
      return { rate: r, ...s };
    }),
  []);

  const compBase = compData[0]; // 10% baseline
  const comp35   = compData[2]; // 35% worst case

  /* ── credit score table ── */
  const scoreRows = useMemo(() => {
    const principal = Math.max(0, Number(amount) || 0);
    const months    = Math.max(1, Number(term)   || 1);
    return SCORE_ROWS.map(row => {
      const s = loanStats(principal, row.apr, months);
      return { ...row, ...s };
    });
  }, [amount, term]);

  const closestScoreIdx = useMemo(() => {
    const apr = Number(rate) || 0;
    let best = 0, bestDiff = Infinity;
    SCORE_ROWS.forEach((row, i) => {
      const diff = Math.abs(row.apr - apr);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });
    return best;
  }, [rate]);

  const excellentRow = scoreRows[0];
  const creditSavings = useMemo(() => {
    const apr = Number(rate) || 0;
    if (apr <= 7) return 0;
    const userStats = loanStats(Math.max(0, Number(amount) || 0), apr, Math.max(1, Number(term) || 1));
    return Math.max(0, userStats.totalInterest - excellentRow.totalInterest);
  }, [amount, rate, term, excellentRow]);

  /* ── bar chart data for comparison ── */
  const barData = useMemo(() =>
    compData.map(d => ({
      name: t('personalLoan.compAt').replace('{rate}', d.rate),
      interest: Math.round(d.totalInterest),
    })),
  [compData, t]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p className="page-sub">{t('personalLoan.sub')}</p>

      {/* ── Section 2: Calculator + Rate Check ── */}
      <div className="two-col" style={{ marginBottom: '1.5rem' }}>

        {/* Left: Loan Calculator */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">
            <span className="icon">🧮</span> {t('personalLoan.calcTitle')}
          </div>

          <div className="field">
            <label>{t('personalLoan.loanAmount')}</label>
            <input
              type="number"
              min={0}
              step={500}
              value={amount || ''}
              onChange={e => setAmount(e.target.value === '' ? 0 : +e.target.value)}
            />
          </div>

          <div className="field">
            <label>{t('personalLoan.annualRate')} — {rate}%</label>
            <input
              type="range"
              min={1}
              max={50}
              step={0.5}
              value={rate}
              onChange={e => setRate(+e.target.value)}
            />
            <div className="range-labels"><span>1%</span><span>50%</span></div>
          </div>

          <div className="field">
            <label>{t('personalLoan.termMonths')}</label>
            <select value={term} onChange={e => setTerm(+e.target.value)}>
              {[12, 24, 36, 48, 60, 72, 84].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="result-grid" style={{ marginTop: '1rem' }}>
            <div className="result-box highlight">
              <div className="rb-label">{t('personalLoan.monthly')}</div>
              <div className="rb-value">{fmtUSD2(calc.monthly)}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('personalLoan.totalInterest')}</div>
              <div className="rb-value" style={{ color: 'var(--danger)' }}>{fmtUSD(calc.totalInterest)}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('personalLoan.totalCost')}</div>
              <div className="rb-value">{fmtUSD(calc.totalCost)}</div>
            </div>
          </div>
        </div>

        {/* Right: Rate Reality Check */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">
            <span className="icon">📊</span> {t('personalLoan.rateCheckTitle')}
          </div>

          {/* Rate pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.1rem' }}>
            <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t('personalLoan.yourRate')}
            </span>
            <span style={{
              background: RATE_BANDS[activeBand]?.color || '#ccc',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1rem',
              padding: '.3rem .9rem',
              borderRadius: 99,
              letterSpacing: '.02em',
            }}>
              {rate}%
            </span>
          </div>

          {/* Band scale */}
          <div style={{ display: 'flex', gap: '.35rem', marginBottom: '1rem' }}>
            {RATE_BANDS.map((band, idx) => {
              const isActive = idx === activeBand;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    background: band.color,
                    borderRadius: 8,
                    padding: isActive ? '.75rem .4rem' : '.55rem .3rem',
                    textAlign: 'center',
                    border: isActive ? '3px solid var(--navy)' : '2px solid transparent',
                    boxShadow: isActive ? '0 0 0 2px ' + band.color + '55' : 'none',
                    transition: 'all .2s',
                    cursor: 'default',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: isActive ? '.78rem' : '.7rem', lineHeight: 1.2, marginBottom: '.2rem' }}>
                    {t(band.labelKey)}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '.65rem', fontWeight: 600 }}>
                    {t(band.rangeKey)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Predatory warning */}
          {isPredatory && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #c0392b',
              borderRadius: 8,
              padding: '1rem 1.1rem',
              marginTop: '.5rem',
            }}>
              <div style={{ fontWeight: 700, color: '#c0392b', fontSize: '.95rem', marginBottom: '.35rem' }}>
                {t('personalLoan.predatoryAlert')}
              </div>
              <div style={{ color: '#7f1d1d', fontSize: '.85rem', lineHeight: 1.55 }}>
                {t('personalLoan.predatoryDetail').replace('{rate}', rate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: $10k Comparison Table ── */}
      <div className="card">
        <div className="card-title">
          <span className="icon">📋</span> {t('personalLoan.compTitle')}
        </div>
        <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: '1.25rem', marginTop: '-.5rem' }}>
          {t('personalLoan.compSubtitle')}
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '.65rem 1rem', background: 'var(--navy)', color: '#fff', textAlign: 'left', fontWeight: 600, borderRadius: '8px 0 0 0' }}></th>
                {COMP_RATES.map((r, i) => (
                  <th
                    key={r}
                    style={{
                      padding: '.65rem 1rem',
                      background: COMP_COLORS[r],
                      color: '#fff',
                      textAlign: 'right',
                      fontWeight: 700,
                      borderRadius: i === COMP_RATES.length - 1 ? '0 8px 0 0' : 0,
                    }}
                  >
                    {t('personalLoan.compAt').replace('{rate}', r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Monthly Payment row */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.6rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('personalLoan.compMonthly')}
                </td>
                {compData.map(d => (
                  <td key={d.rate} style={{ padding: '.6rem 1rem', textAlign: 'right', fontWeight: 700, color: COMP_COLORS[d.rate], fontSize: '1rem' }}>
                    {fmtUSD2(d.monthly)}
                  </td>
                ))}
              </tr>
              {/* Total Interest row */}
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--light)' }}>
                <td style={{ padding: '.6rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('personalLoan.compTotalInterest')}
                </td>
                {compData.map(d => (
                  <td key={d.rate} style={{ padding: '.6rem 1rem', textAlign: 'right', fontWeight: 700, color: COMP_COLORS[d.rate] }}>
                    {fmtUSD(d.totalInterest)}
                  </td>
                ))}
              </tr>
              {/* Total Cost row */}
              <tr>
                <td style={{ padding: '.6rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('personalLoan.compTotalCost')}
                </td>
                {compData.map(d => (
                  <td key={d.rate} style={{ padding: '.6rem 1rem', textAlign: 'right', fontWeight: 700, color: COMP_COLORS[d.rate] }}>
                    {fmtUSD(d.totalCost)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* vs 10% savings note */}
        <div style={{
          marginTop: '1rem',
          background: '#fef2f2',
          border: '1px solid #e9c0bd',
          borderRadius: 8,
          padding: '.75rem 1rem',
          fontSize: '.86rem',
          color: '#7f1d1d',
        }}>
          {t('personalLoan.compSavings')
            .replace('{amt}', fmtUSD(comp35.totalInterest - compBase.totalInterest))}
        </div>

        {/* Bar chart */}
        <div style={{ height: 200, marginTop: '1.25rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => '$' + Math.round(v / 1000) + 'k'} tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={v => fmtUSD(v)} />
              <Bar dataKey="interest" radius={[5, 5, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={COMP_COLORS[COMP_RATES[idx]]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 4: Credit Score + Lenders ── */}
      <div className="two-col">

        {/* Left: Credit Score Impact */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">
            <span className="icon">💳</span> {t('personalLoan.scoreTitle')}
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '1rem', marginTop: '-.5rem' }}>
            {t('personalLoan.scoreSub')}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr>
                  {[
                    t('personalLoan.scoreRange'),
                    t('personalLoan.scoreRating'),
                    t('personalLoan.typicalAPR'),
                    t('personalLoan.monthlyAt').replace('{amount}', fmtUSD(Number(amount) || 10000)),
                    t('personalLoan.totalInterestAt'),
                  ].map((hdr, i) => (
                    <th key={i} style={{
                      padding: '.55rem .75rem',
                      background: 'var(--navy)',
                      color: '#fff',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontWeight: 600,
                      fontSize: '.78rem',
                      whiteSpace: 'nowrap',
                    }}>
                      {hdr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((row, idx) => {
                  const isHighlighted = idx === closestScoreIdx;
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isHighlighted ? '#eaf0fb' : idx % 2 === 0 ? '#fff' : 'var(--light)',
                        outline: isHighlighted ? '2px solid var(--accent)' : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      <td style={{ padding: '.55rem .75rem', fontWeight: isHighlighted ? 700 : 500 }}>{row.range}</td>
                      <td style={{ padding: '.55rem .75rem', textAlign: 'right', color: RATE_BANDS[getBand(row.apr)]?.color, fontWeight: 700 }}>
                        {t(row.ratingKey)}
                      </td>
                      <td style={{ padding: '.55rem .75rem', textAlign: 'right', fontWeight: 600 }}>{row.apr}%</td>
                      <td style={{ padding: '.55rem .75rem', textAlign: 'right', fontWeight: isHighlighted ? 700 : 400 }}>
                        {fmtUSD2(row.monthly)}
                      </td>
                      <td style={{ padding: '.55rem .75rem', textAlign: 'right', color: 'var(--danger)', fontWeight: isHighlighted ? 700 : 400 }}>
                        {fmtUSD(row.totalInterest)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Savings callout */}
          {creditSavings > 0 && (
            <div style={{
              marginTop: '1rem',
              background: '#eafaf1',
              border: '1.5px solid var(--success)',
              borderRadius: 8,
              padding: '.8rem 1rem',
              fontSize: '.86rem',
              color: '#145a32',
              fontWeight: 600,
            }}>
              {t('personalLoan.creditSavings').replace('{savings}', fmtUSD(creditSavings))}
            </div>
          )}
        </div>

        {/* Right: Lender Comparison */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">
            <span className="icon">🏦</span> {t('personalLoan.lendersTitle')}
          </div>

          {/* Good lenders */}
          <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '.95rem', marginBottom: '.75rem' }}>
            {t('personalLoan.goodLendersTitle')}
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            {GOOD_LENDERS.map((lender, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '.55rem .75rem',
                  borderRadius: 7,
                  background: i % 2 === 0 ? 'var(--light)' : '#fff',
                  fontSize: '.86rem',
                  gap: '.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{lender.name}</span>
                <div style={{ display: 'flex', gap: '.75rem', flexShrink: 0 }}>
                  <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>APR: <strong style={{ color: 'var(--text)' }}>{lender.rates}</strong></span>
                  <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Min: <strong style={{ color: 'var(--text)' }}>{lender.minCredit}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Lenders to avoid */}
          <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '.95rem', marginBottom: '.6rem' }}>
            {t('personalLoan.avoidTitle')}
          </div>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '.6rem' }}>
            {t('personalLoan.avoidNote')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.25rem' }}>
            {AVOID_LENDERS.map((name, i) => (
              <span
                key={i}
                style={{
                  background: '#fef2f2',
                  color: '#c0392b',
                  border: '1px solid #e9c0bd',
                  borderRadius: 6,
                  padding: '.25rem .6rem',
                  fontSize: '.8rem',
                  fontWeight: 600,
                }}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Red flags */}
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #d97706',
            borderRadius: 8,
            padding: '1rem 1.1rem',
          }}>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '.93rem', marginBottom: '.65rem' }}>
              {t('personalLoan.redFlagsTitle')}
            </div>
            <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
              {RED_FLAGS.map((flag, i) => (
                <li key={i} style={{ fontSize: '.84rem', color: '#78350f', lineHeight: 1.6 }}>{flag}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
