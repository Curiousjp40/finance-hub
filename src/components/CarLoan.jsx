import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

function calcEarlyPayoff(principal, rate, payment, extra) {
  if (principal <= 0 || payment + extra <= 0) return null;
  const r = rate / 100 / 12;
  if (payment + extra <= principal * r) return null;
  let balance = principal, month = 0, totalInterest = 0;
  while (balance > 0.01 && month < 600) {
    const interest = balance * r;
    const paid = Math.min(payment + extra, balance + interest);
    totalInterest += interest;
    balance = Math.max(0, balance + interest - paid);
    month++;
  }
  return { months: month, totalInterest };
}

const DEFAULT_VEHICLES = [
  { id: 1, name: 'Vehicle 1', price: 35000, down: 5000, tradeIn: 0, rate: 6.5, term: 60, extra: 0 },
];

export default function CarLoan() {
  const t = useT();
  const [vehicles,    setVehicles]    = useLocalState('cl-vehicles', DEFAULT_VEHICLES);
  const [nextId,      setNextId]      = useLocalState('cl-nextid',   2);
  const [newName,     setNewName]     = useState('');
  const [showTable,   setShowTable]   = useLocalState('cl-table',    false);
  const [expandedId,  setExpandedId]  = useLocalState('cl-expanded', 1);

  function addVehicle() {
    const name = newName.trim() || `Vehicle ${nextId}`;
    setVehicles(prev => [...prev, { id: nextId, name, price: 25000, down: 3000, tradeIn: 0, rate: 6.5, term: 60, extra: 0 }]);
    setNextId(n => n + 1);
    setNewName('');
  }

  function updateVehicle(id, field, value) {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function removeVehicle(id) {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }

  const termLabel = (n) => {
    const yrs = n / 12;
    return `${n} ${t('car.months')} (${yrs} ${yrs === 1 ? t('car.yr') : t('car.yrs')})`;
  };

  /* Compute per-vehicle results */
  const vehicleResults = useMemo(() => vehicles.map(v => {
    const principal = Math.max(0, v.price - v.down - v.tradeIn);
    const payment   = monthlyPayment(principal, v.rate, v.term);
    const schedule  = amortizeSchedule(principal, v.rate, v.term);
    const totalPaid = payment * v.term;
    const totalInt  = totalPaid - principal;
    const early     = v.extra > 0 ? calcEarlyPayoff(principal, v.rate, payment, v.extra) : null;
    const chartData = schedule
      .filter((_, i) => (i + 1) % 12 === 0 || i === schedule.length - 1)
      .map(r => ({ month: r.month, [t('car.balance')]: +r.balance.toFixed(0) }));
    return { ...v, principal, payment, schedule, totalPaid, totalInt, early, chartData };
  }), [vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const combinedMonthly = vehicleResults.reduce((s, v) => s + (v.payment || 0), 0);

  return (
    <div>
      <p className="page-sub">{t('car.sub')}</p>

      {/* Add vehicle bar */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.75rem' }}>
          <div className="card-title" style={{ marginBottom:0 }}><span className="icon">🚗</span> {t('car.vehicles')}</div>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flex:1, maxWidth:420 }}>
            <input
              type="text"
              placeholder={t('car.vehicleName')}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addVehicle()}
              style={{ flex:1, padding:'.45rem .8rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.88rem' }}
            />
            <button className="btn btn-primary" style={{ padding:'.45rem 1rem', fontSize:'.85rem', whiteSpace:'nowrap' }} onClick={addVehicle}>
              + {t('car.addVehicle')}
            </button>
          </div>
        </div>

        {vehicles.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'1.5rem', fontSize:'.9rem' }}>
            {t('car.noVehicles')}
          </div>
        )}

        {/* Combined total */}
        {vehicles.length > 1 && (
          <div style={{ marginTop:'1rem', background:'var(--navy)', color:'#fff', borderRadius:10, padding:'.85rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'.95rem' }}>{t('car.combinedMonthly')}</span>
            <span style={{ fontWeight:800, fontSize:'1.25rem' }}>{fmtUSD2(combinedMonthly)}</span>
          </div>
        )}
      </div>

      {vehicleResults.map(vr => (
        <div key={vr.id} className="card" style={{ marginBottom:'1.25rem' }}>
          {/* Vehicle header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
              <span className="icon">🚗</span>
              <input
                type="text"
                value={vr.name}
                onChange={e => updateVehicle(vr.id, 'name', e.target.value)}
                style={{ fontWeight:700, fontSize:'1rem', border:'none', background:'transparent', color:'var(--navy)', outline:'none' }}
              />
            </div>
            <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--accent)' }}>{fmtUSD2(vr.payment)}/mo</span>
              <button
                onClick={() => setExpandedId(expandedId === vr.id ? null : vr.id)}
                className="btn btn-secondary" style={{ padding:'.3rem .75rem', fontSize:'.82rem' }}
              >
                {expandedId === vr.id ? '▲' : '▼'}
              </button>
              {vehicles.length > 1 && (
                <button
                  onClick={() => removeVehicle(vr.id)}
                  style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1.1rem', padding:'0 .2rem' }}
                  title={t('car.removeVehicle')}
                >✕</button>
              )}
            </div>
          </div>

          {expandedId === vr.id && (
            <div className="two-col">
              <div>
                <div className="card-title" style={{ fontSize:'.95rem' }}><span className="icon">🔧</span> {t('car.loanDetails')}</div>
                <div className="field">
                  <label>{t('car.vehiclePrice')}</label>
                  <input type="number" value={vr.price || ''} min={0}
                    onChange={e => updateVehicle(vr.id, 'price', e.target.value === '' ? 0 : +e.target.value)} />
                </div>
                <div className="two-col">
                  <div className="field">
                    <label>{t('car.downPayment')}</label>
                    <input type="number" value={vr.down || ''} min={0}
                      onChange={e => updateVehicle(vr.id, 'down', e.target.value === '' ? 0 : +e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('car.tradeIn')}</label>
                    <input type="number" value={vr.tradeIn || ''} min={0}
                      onChange={e => updateVehicle(vr.id, 'tradeIn', e.target.value === '' ? 0 : +e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('car.interestRate')} — {vr.rate}%</label>
                  <input type="range" min={0} max={25} step={0.1} value={vr.rate}
                    onChange={e => updateVehicle(vr.id, 'rate', +e.target.value)} />
                  <div className="range-labels"><span>0%</span><span>25%</span></div>
                </div>
                <div className="field">
                  <label>{t('car.loanTerm')}</label>
                  <select value={vr.term} onChange={e => updateVehicle(vr.id, 'term', +e.target.value)}>
                    {[24,36,48,60,72,84].map(n => <option key={n} value={n}>{termLabel(n)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('car.extraPmt')}</label>
                  <input type="number" value={vr.extra || ''} min={0} step={25}
                    onChange={e => updateVehicle(vr.id, 'extra', e.target.value === '' ? 0 : +e.target.value)} />
                </div>

                {vr.early && vr.extra > 0 && (
                  <div style={{ background:'#eafaf1', border:'1.5px solid var(--success)', borderRadius:10, padding:'1rem 1.25rem' }}>
                    <div style={{ fontWeight:700, color:'var(--success)', marginBottom:'.6rem', fontSize:'.95rem' }}>
                      {t('car.earlyPayoff')} (+{fmtUSD2(vr.extra)}/mo)
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                      <div>
                        <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{t('car.monthsSaved')}</div>
                        <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)' }}>{vr.term - vr.early.months}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{t('car.interestSaved')}</div>
                        <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--success)' }}>{fmtUSD2(vr.totalInt - vr.early.totalInterest)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:'.8rem', color:'var(--muted)', marginTop:'.5rem' }}>
                      {t('car.paysOffIn').replace('{months}', vr.early.months)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="result-grid" style={{ marginTop:0 }}>
                  <div className="result-box highlight">
                    <div className="rb-label">{t('car.monthlyPayment')}</div>
                    <div className="rb-value">{fmtUSD2(vr.payment)}</div>
                    <div className="rb-sub">{t('car.forMonths').replace('{n}', vr.term)}</div>
                  </div>
                  <div className="result-box">
                    <div className="rb-label">{t('car.loanAmount')}</div>
                    <div className="rb-value">{fmtUSD(vr.principal)}</div>
                  </div>
                  <div className="result-box">
                    <div className="rb-label">{t('car.totalInterest')}</div>
                    <div className="rb-value" style={{ color:'var(--danger)' }}>{fmtUSD(vr.totalInt)}</div>
                  </div>
                  <div className="result-box">
                    <div className="rb-label">{t('car.totalCost')}</div>
                    <div className="rb-value">{fmtUSD(vr.totalPaid + vr.down + vr.tradeIn)}</div>
                    <div className="rb-sub">{t('car.includingDown')}</div>
                  </div>
                </div>

                <div className="chart-wrap" style={{ height:200, marginTop:'1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vr.chartData} margin={{ top:5, right:10, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id={`balGrad${vr.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1a5276" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1a5276" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize:11 }} label={{ value:t('car.month'), position:'insideBottom', offset:-2, fontSize:11 }} />
                      <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize:11 }} width={50} />
                      <Tooltip formatter={v => fmtUSD(v)} labelFormatter={l => `${t('car.month')} ${l}`} />
                      <Area type="monotone" dataKey={t('car.balance')} stroke="#1a5276" fill={`url(#balGrad${vr.id})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {vehicleResults.length > 0 && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem' }}>
            <div className="card-title" style={{ marginBottom:0 }}>
              <span className="icon">📋</span> {t('car.amortSched')} — {vehicleResults.find(v => v.id === expandedId)?.name || vehicleResults[0].name}
            </div>
            <button className="btn btn-secondary" onClick={() => setShowTable(s => !s)}>
              {showTable ? t('car.hideTable') : t('car.showTable')}
            </button>
          </div>
          {showTable && (() => {
            const active = vehicleResults.find(v => v.id === expandedId) || vehicleResults[0];
            return (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('car.month')}</th>
                      <th>{t('car.payment')}</th>
                      <th>{t('car.principal')}</th>
                      <th>{t('car.interest')}</th>
                      <th>{t('car.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.schedule.map(r => (
                      <tr key={r.month}>
                        <td>{r.month}</td>
                        <td>{fmtUSD2(r.payment)}</td>
                        <td>{fmtUSD2(r.principal)}</td>
                        <td style={{ color:'var(--danger)' }}>{fmtUSD2(r.interest)}</td>
                        <td>{fmtUSD2(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
          {!showTable && <p className="text-muted" style={{ fontSize:'.85rem' }}>{t('car.toggleHint')}</p>}
        </div>
      )}
    </div>
  );
}
