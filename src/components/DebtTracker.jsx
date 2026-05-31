import { useState, useMemo } from 'react';
import { useLocalState } from '../utils/useLocalState';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const DEBT_TYPES = ['credit', 'auto', 'student', 'mortgage', 'personal', 'other'];
const TYPE_COLORS = {
  credit: '#c0392b', auto: '#1a5276', student: '#8e44ad',
  mortgage: '#16a085', personal: '#d97706', other: '#7f8c8d',
};

function simulatePayoff(debts, strategy, extra = 0) {
  if (!debts.length) return null;
  let balances = debts.map(d => d.balance);
  const rates = debts.map(d => d.interestRate / 100 / 12);
  let totalInterest = 0;
  let month = 0;
  const chartData = [];
  const payoffMonths = new Array(debts.length).fill(0);
  let freedPayments = 0;

  while (balances.some(b => b > 0.01) && month < 600) {
    month++;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0.01) {
        const interest = balances[i] * rates[i];
        totalInterest += interest;
        balances[i] += interest;
      }
    }

    const sorted = balances
      .map((b, i) => ({ i, b }))
      .filter(x => x.b > 0.01)
      .sort((a, bx) => strategy === 'avalanche'
        ? debts[bx.i].interestRate - debts[a.i].interestRate
        : a.b - bx.b)
      .map(x => x.i);

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0.01) {
        const pay = Math.min(debts[i].minPayment, balances[i]);
        balances[i] = Math.max(0, balances[i] - pay);
        if (balances[i] < 0.01 && !payoffMonths[i]) {
          balances[i] = 0;
          payoffMonths[i] = month;
          freedPayments += debts[i].minPayment;
        }
      }
    }

    const totalExtra = extra + freedPayments;
    if (sorted.length > 0 && totalExtra > 0) {
      const idx = sorted[0];
      if (balances[idx] > 0.01) {
        const pay = Math.min(totalExtra, balances[idx]);
        balances[idx] = Math.max(0, balances[idx] - pay);
        if (balances[idx] < 0.01 && !payoffMonths[idx]) {
          balances[idx] = 0;
          payoffMonths[idx] = month;
          freedPayments += debts[idx].minPayment;
        }
      }
    }

    if (month % 6 === 0 || month === 1) {
      chartData.push({ month, total: Math.round(balances.reduce((s, b) => s + b, 0)) });
    }
  }

  chartData.push({ month, total: 0 });
  return { months: month, totalInterest, chartData, payoffMonths };
}

export default function DebtTracker() {
  const t = useT();
  const [debts, setDebts] = useLocalState('debt-tracker', []);
  const [extra, setExtra] = useLocalState('debt-tracker-extra', 0);

  const [form, setForm] = useState({
    name: '', balance: '', interestRate: '', minPayment: '', type: 'credit',
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdd = e => {
    e.preventDefault();
    if (!form.name || !form.balance || !form.interestRate || !form.minPayment) return;
    setDebts(prev => [...prev, {
      id: uid(),
      name: form.name,
      balance: parseFloat(form.balance),
      interestRate: parseFloat(form.interestRate),
      minPayment: parseFloat(form.minPayment),
      type: form.type,
    }]);
    setForm({ name: '', balance: '', interestRate: '', minPayment: '', type: 'credit' });
  };

  const handleDelete = id => setDebts(prev => prev.filter(d => d.id !== id));

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPmt = debts.reduce((s, d) => s + d.minPayment, 0);

  const avalanche = useMemo(() => simulatePayoff(debts, 'avalanche', extra), [debts, extra]);
  const snowball = useMemo(() => simulatePayoff(debts, 'snowball', extra), [debts, extra]);

  const monthsToDate = months => {
    if (!months) return '—';
    const now = new Date();
    now.setMonth(now.getMonth() + months);
    return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const chartData = useMemo(() => {
    if (!avalanche || !snowball) return [];
    const maxM = Math.max(avalanche.months, snowball.months);
    const pts = [];
    for (let m = 0; m <= maxM; m += Math.max(1, Math.floor(maxM / 40))) {
      const aIdx = avalanche.chartData.findIndex(d => d.month >= m);
      const sIdx = snowball.chartData.findIndex(d => d.month >= m);
      pts.push({
        month: m,
        avalanche: aIdx >= 0 ? avalanche.chartData[aIdx].total : 0,
        snowball: sIdx >= 0 ? snowball.chartData[sIdx].total : 0,
      });
    }
    pts.push({ month: maxM, avalanche: 0, snowball: 0 });
    return pts;
  }, [avalanche, snowball]);

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('debt.sub')}</p>

      {/* Add Debt Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('debt.addDebt')}</div>
        <form onSubmit={handleAdd}>
          <div className="two-col">
            <div className="field">
              <label>{t('debt.debtName')}</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder={t('debt.debtName')} />
            </div>
            <div className="field">
              <label>{t('debt.type')}</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {DEBT_TYPES.map(tp => (
                  <option key={tp} value={tp}>{t(`debt.type_${tp}`)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('debt.balance')}</label>
              <input name="balance" type="number" min="0" step="0.01" value={form.balance} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="field">
              <label>{t('debt.interestRate')} (%)</label>
              <input name="interestRate" type="number" min="0" step="0.01" value={form.interestRate} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="field">
              <label>{t('debt.minPayment')}</label>
              <input name="minPayment" type="number" min="0" step="0.01" value={form.minPayment} onChange={handleChange} placeholder="0.00" />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: '0.75rem' }}>
            {t('debt.add')}
          </button>
        </form>
      </div>

      {/* Extra Budget */}
      {debts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{t('debt.extraBudget')}</div>
          <div className="field" style={{ maxWidth: 260 }}>
            <label>{t('debt.extraBudget')}</label>
            <input
              type="number" min="0" step="1"
              value={extra}
              onChange={e => setExtra(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {debts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('debt.totalDebt')}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c0392b' }}>{fmtUSD(totalDebt)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('debt.minPayments')}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a5276' }}>{fmtUSD(totalMinPmt)}/mo</div>
            </div>
          </div>
        </div>
      )}

      {/* Debt List */}
      {debts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{t('debt.yourDebts')}</div>
          {debts.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: TYPE_COLORS[d.type] || '#7f8c8d', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  {t(`debt.type_${d.type}`)} · {d.interestRate}% APR · {t('debt.minPayment')}: {fmtUSD(d.minPayment)}/mo
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtUSD(d.balance)}</div>
              <button
                onClick={() => handleDelete(d.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '1.1rem', padding: '0.2rem 0.4rem' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Comparison */}
      {debts.length > 0 && avalanche && snowball && (
        <>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>{t('debt.strategyComparison')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'avalanche', result: avalanche, color: '#c0392b', label: t('debt.avalanche'), desc: t('debt.avalancheDesc') },
              { key: 'snowball', result: snowball, color: '#1a5276', label: t('debt.snowball'), desc: t('debt.snowballDesc') },
            ].map(({ key, result, color, label, desc }) => (
              <div key={key} className="card" style={{ borderTop: `4px solid ${color}` }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>{desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{t('debt.payoffDate')}</div>
                    <div style={{ fontWeight: 700, color }}>{monthsToDate(result.months)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{result.months} mo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{t('debt.totalInterest')}</div>
                    <div style={{ fontWeight: 700, color: '#c0392b' }}>{fmtUSD(result.totalInterest)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">{t('debt.payoffChart')}</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickFormatter={m => `${m}mo`} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v) => fmtUSD(v)} labelFormatter={m => `Month ${m}`} />
                  <Legend />
                  <Area type="monotone" dataKey="avalanche" name={t('debt.avalanche')} stroke="#c0392b" fill="#fde8e8" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="snowball" name={t('debt.snowball')} stroke="#1a5276" fill="#d6eaf8" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {debts.length === 0 && (
        <div className="card">
          <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>{t('debt.noDebts')}</p>
        </div>
      )}
    </div>
  );
}
