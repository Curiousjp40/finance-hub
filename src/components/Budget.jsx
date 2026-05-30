import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT, useLang } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

const COLORS = ['#1a5276','#2e86c1','#1e8449','#d4ac0d','#c0392b','#8e44ad','#16a085','#e67e22','#7f8c8d','#2c3e50'];
const CAT_TYPES = ['need','need','need','need','want','need','want','save','want','want'];
const DEFAULT_AMOUNTS = [1500, 400, 350, 150, 200, 100, 150, 500, 100, 200];

export default function Budget() {
  const t    = useT();
  useLang(); // triggers re-render on language change so defaultNames update

  const [income,      setIncome]     = useLocalState('budget-income',   5000);
  const [catAmounts,  setCatAmounts] = useLocalState('budget-amounts',  DEFAULT_AMOUNTS);
  const [customCats,  setCustomCats] = useLocalState('budget-custom',   []);
  const [newCat,      setNewCat]     = useState('');

  /* Merge default (translated) categories with persisted amounts — memoized to avoid stale deps */
  const defaultNames = t('budget.defaultCats');
  const categories = useMemo(() => [
    ...defaultNames.map((name, i) => ({ name, amount: catAmounts[i] ?? DEFAULT_AMOUNTS[i], type: CAT_TYPES[i], isDefault: true, idx: i })),
    ...customCats.map((c, i) => ({ ...c, isDefault: false, idx: i })),
  ], [catAmounts, customCats, defaultNames]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalExpenses = useMemo(() => categories.reduce((s, c) => s + (c.amount || 0), 0), [categories]);
  const remaining     = income - totalExpenses;

  const savingsAmt  = categories.filter(c => c.type === 'save').reduce((s, c) => s + c.amount, 0);
  const savingsRate = income > 0 ? (savingsAmt / income * 100) : 0;

  const needs      = categories.filter(c => c.type === 'need').reduce((s, c) => s + c.amount, 0);
  const wants      = categories.filter(c => c.type === 'want').reduce((s, c) => s + c.amount, 0);
  const saves      = savingsAmt;
  const needTarget = income * 0.5;
  const wantTarget = income * 0.3;
  const saveTarget = income * 0.2;

  function updateAmount(cat, val) {
    const n = +val || 0;
    if (cat.isDefault) {
      setCatAmounts(prev => prev.map((a, i) => i === cat.idx ? n : a));
    } else {
      setCustomCats(prev => prev.map((c, i) => i === cat.idx ? { ...c, amount: n } : c));
    }
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    setCustomCats(prev => [...prev, { name, amount: 0, type: 'want' }]);
    setNewCat('');
  }

  function removeCategory(cat) {
    if (cat.isDefault) {
      setCatAmounts(prev => prev.map((a, i) => i === cat.idx ? 0 : a));
    } else {
      setCustomCats(prev => prev.filter((_, i) => i !== cat.idx));
    }
  }

  const pieData    = categories.filter(c => c.amount > 0).map(c => ({ name: c.name, value: c.amount }));
  const statusColor = remaining >= 0 ? 'var(--success)' : 'var(--danger)';

  const rule2030Rows = [
    { label: t('budget.needs'), hint: t('budget.needsHint'),   actual: needs, target: needTarget, color:'#1a5276', higherIsBetter: false },
    { label: t('budget.wants'), hint: t('budget.wantsHint'),   actual: wants, target: wantTarget, color:'#8e44ad', higherIsBetter: false },
    { label: t('budget.saves'), hint: t('budget.savingsHint'), actual: saves, target: saveTarget, color:'#1e8449', higherIsBetter: true  },
  ];

  return (
    <div>
      <p className="page-sub">{t('budget.sub')}</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💵</span> {t('budget.monthlyIncome')}</div>
          <div className="field">
            <label>{t('budget.takeHome')}</label>
            <input type="number" value={income || ''} min={0}
              onChange={e => setIncome(e.target.value === '' ? 0 : +e.target.value)} />
          </div>

          <div className="divider" />
          <div className="card-title"><span className="icon">📝</span> {t('budget.expenses')}</div>

          {categories.map((c, i) => {
            const pct   = income > 0 ? (c.amount / income) * 100 : 0;
            const color = COLORS[i % COLORS.length];
            return (
              <div key={`${c.isDefault ? 'd' : 'c'}-${c.idx}`} className="budget-row">
                <span className="cat-label">{c.name}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: Math.min(100, pct) + '%', background: color }} />
                </div>
                <span style={{ fontSize:'.78rem', color:'var(--muted)', width:38, textAlign:'right', flexShrink:0 }}>
                  {pct.toFixed(0)}%
                </span>
                <input
                  type="number" min={0} value={c.amount || ''}
                  onChange={e => updateAmount(c, e.target.value)}
                  style={{ width:82, textAlign:'right' }}
                />
                <button
                  onClick={() => removeCategory(c)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'1rem', padding:'0 .2rem' }}
                  title={t('budget.remove')}
                >✕</button>
              </div>
            );
          })}

          <div style={{ display:'flex', gap:'.5rem', marginTop:'.75rem' }}>
            <input
              type="text" placeholder={t('budget.addPlaceholder')} value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              style={{ flex:1, padding:'.55rem .8rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.9rem' }}
            />
            <button className="btn btn-primary" onClick={addCategory}>{t('budget.add')}</button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('budget.summary')}</div>
            <div className="result-grid">
              <div className="result-box">
                <div className="rb-label">{t('budget.monthlyIncome')}</div>
                <div className="rb-value">{fmtUSD(income)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('budget.totalExpenses')}</div>
                <div className="rb-value" style={{ color:'var(--danger)' }}>{fmtUSD(totalExpenses)}</div>
              </div>
              <div className="result-box" style={{ background: remaining >= 0 ? '#eafaf1' : '#fdedec', borderColor: statusColor }}>
                <div className="rb-label" style={{ color:'var(--muted)' }}>{remaining >= 0 ? t('budget.surplus') : t('budget.deficit')}</div>
                <div className="rb-value" style={{ color: statusColor }}>{fmtUSD2(Math.abs(remaining))}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('budget.savingsRate')}</div>
                <div className="rb-value" style={{ color: savingsRate >= 20 ? 'var(--success)' : savingsRate >= 10 ? 'var(--gold)' : 'var(--danger)' }}>
                  {savingsRate.toFixed(1)}%
                </div>
                <div className="rb-sub">{t('budget.savingsTarget')}</div>
              </div>
            </div>

            {remaining < 0 && (
              <div style={{ marginTop:'1rem', padding:'.85rem', background:'#fdedec', borderRadius:8, fontSize:'.85rem', color:'var(--danger)' }}>
                ⚠ {t('budget.overspend').replace('{amt}', fmtUSD2(Math.abs(remaining)))}
              </div>
            )}

            {income > 0 && (
              <div style={{ marginTop:'1.25rem', paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--navy)', marginBottom:'.85rem' }}>
                  {t('budget.rule2030')}
                </div>
                {rule2030Rows.map((row, i) => {
                  const filledPct = row.target > 0 ? Math.min(120, (row.actual / row.target) * 100) : 0;
                  const isGood    = row.higherIsBetter ? row.actual >= row.target : row.actual <= row.target;
                  const overPct   = row.target > 0 ? ((row.actual - row.target) / row.target) * 100 : 0;
                  return (
                    <div key={i} style={{ marginBottom:'1rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'.3rem' }}>
                        <div>
                          <span style={{ fontWeight:700, fontSize:'.88rem', color: isGood ? 'var(--navy)' : 'var(--danger)' }}>{row.label}</span>
                          <span style={{ fontSize:'.78rem', color:'var(--muted)', marginLeft:'.5rem' }}>(target {fmtUSD(row.target)})</span>
                        </div>
                        <span style={{ fontWeight:700, fontSize:'.88rem', color: isGood ? 'var(--success)' : 'var(--danger)' }}>
                          {fmtUSD(row.actual)}
                        </span>
                      </div>
                      <div style={{ height:8, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:99, transition:'width .3s',
                          width:`${Math.min(100, filledPct)}%`,
                          background: isGood ? row.color : 'var(--danger)',
                        }} />
                      </div>
                      {!isGood && !row.higherIsBetter && overPct > 0 && (
                        <div style={{ fontSize:'.73rem', color:'var(--danger)', marginTop:'.2rem', fontWeight:600 }}>
                          ⚠ {overPct.toFixed(0)}% over target — {fmtUSD(row.actual - row.target)} excess
                        </div>
                      )}
                      {!isGood && row.higherIsBetter && (
                        <div style={{ fontSize:'.73rem', color:'var(--danger)', marginTop:'.2rem', fontWeight:600 }}>
                          ⚠ {fmtUSD(row.target - row.actual)} below savings target
                        </div>
                      )}
                      {isGood && (
                        <div style={{ fontSize:'.73rem', color:'var(--muted)', marginTop:'.2rem' }}>{row.hint}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">🥧</span> {t('budget.breakdown')}</div>
            <div style={{ height:320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" outerRadius={85} dataKey="value" label={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtUSD(v)} />
                  <Legend
                    formatter={value => <span style={{ fontSize:'.78rem', color:'var(--text)' }}>{value}</span>}
                    wrapperStyle={{ fontSize:'.78rem', paddingTop:'6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
