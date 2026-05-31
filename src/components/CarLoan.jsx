import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';
import {
  VEHICLES,
  DEPR_FROM_NEW,
  ANNUAL_DEPR_NEW_Y1,
  ANNUAL_DEPR_REST,
  CONDITION_FACTORS,
  INSURANCE_RANGES,
  MAINTENANCE_RANGES,
} from '../utils/vehicleData';

/* ─── helpers ───────────────────────────────────────────────── */
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

/** Return current market value for a used vehicle given MSRP, vehicle age, and condition. */
function calcMarketValue(msrp, yearsOld, condition) {
  if (msrp <= 0) return 0;
  let factor;
  if (yearsOld <= 5) {
    factor = DEPR_FROM_NEW[Math.round(yearsOld)] ?? DEPR_FROM_NEW[5];
  } else {
    factor = DEPR_FROM_NEW[5] * Math.pow(1 - ANNUAL_DEPR_REST, yearsOld - 5);
  }
  return msrp * factor * (CONDITION_FACTORS[condition] ?? 1.0);
}

/** Project value at end of loan term (termYears from now). */
function calcFutureValue(currentValue, termYears) {
  return currentValue * Math.pow(1 - ANNUAL_DEPR_REST, termYears);
}

/** Project value for a new car at end of loan term. */
function calcFutureValueNew(msrp, termYears) {
  if (termYears <= 0) return msrp;
  let val = msrp * (1 - ANNUAL_DEPR_NEW_Y1);
  for (let i = 1; i < termYears; i++) val *= (1 - ANNUAL_DEPR_REST);
  return val;
}

/* ─── static data ───────────────────────────────────────────── */
const MAKES = [...new Set(VEHICLES.map(v => v.make))].sort();
const CURRENT_YEAR = 2025;
const YEARS = Array.from({ length: 26 }, (_, i) => CURRENT_YEAR - i); // 2025–2000

const DEFAULT_VEHICLES = [
  { id: 1, name: 'Vehicle 1', price: 35000, down: 5000, tradeIn: 0, rate: 6.5, term: 60, extra: 0,
    isNew: true, make: '', model: '', trim: '', year: CURRENT_YEAR, mileage: 0, condition: 'excellent', actualInsurance: 0 },
];

export default function CarLoan() {
  const t = useT();
  const [vehicles,   setVehicles]   = useLocalState('cl-vehicles', DEFAULT_VEHICLES);
  const [nextId,     setNextId]     = useLocalState('cl-nextid',   2);
  const [newName,    setNewName]    = useState('');
  const [showTable,  setShowTable]  = useLocalState('cl-table',    false);
  const [expandedId, setExpandedId] = useLocalState('cl-expanded', 1);

  function addVehicle() {
    const name = newName.trim() || `Vehicle ${nextId}`;
    setVehicles(prev => [...prev, {
      id: nextId, name, price: 25000, down: 3000, tradeIn: 0, rate: 6.5, term: 60, extra: 0,
      isNew: true, make: '', model: '', trim: '', year: CURRENT_YEAR, mileage: 0, condition: 'excellent', actualInsurance: 0,
    }]);
    setNextId(n => n + 1);
    setNewName('');
  }

  function updateVehicle(id, field, value) {
    setVehicles(prev => prev.map(v => {
      if (v.id !== id) return v;
      const updated = { ...v, [field]: value };
      // cascade: reset model/trim when make changes
      if (field === 'make') { updated.model = ''; updated.trim = ''; }
      // cascade: reset trim when model changes
      if (field === 'model') { updated.trim = ''; }
      // auto-populate MSRP when trim is selected
      if (field === 'trim' && value) {
        const veh = VEHICLES.find(x => x.make === updated.make && x.model === updated.model);
        const trimObj = veh?.trims.find(x => x.name === value);
        if (trimObj) updated.price = trimObj.msrp;
      }
      return updated;
    }));
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

    /* ── vehicle lookup data ── */
    const vehMeta  = VEHICLES.find(x => x.make === v.make && x.model === v.model);
    const termYears = v.term / 12;

    let marketValue = 0, futureValue = 0;
    if (vehMeta && v.trim) {
      const trimObj = vehMeta.trims.find(x => x.name === v.trim);
      const msrp    = trimObj?.msrp ?? v.price;
      if (v.isNew) {
        marketValue = msrp;
        futureValue = calcFutureValueNew(msrp, termYears);
      } else {
        const yearsOld = CURRENT_YEAR - (v.year || CURRENT_YEAR);
        marketValue = calcMarketValue(msrp, yearsOld, v.condition);
        futureValue = calcFutureValue(marketValue, termYears);
      }
    }
    const deprecDuring = Math.max(0, marketValue - futureValue);

    const insRange  = vehMeta ? INSURANCE_RANGES[vehMeta.insuranceTier]    : null;
    const mntRange  = vehMeta ? MAINTENANCE_RANGES[vehMeta.maintenanceTier] : null;
    const insAnnual  = insRange  ? (insRange[0]  + insRange[1])  / 2 : 0;
    const mntAnnual  = mntRange  ? (mntRange[0]  + mntRange[1])  / 2 : 0;

    const actualInsMonthly = v.actualInsurance > 0 ? v.actualInsurance : null;
    const tcoLoan        = totalPaid;
    const tcoInsurance   = actualInsMonthly != null ? actualInsMonthly * v.term : insAnnual * termYears;
    const tcoMaintenance = mntAnnual  * termYears;
    const tcoDeprec      = deprecDuring;
    const tcoTotal       = tcoLoan + tcoInsurance + tcoMaintenance + tcoDeprec;
    const isActualIns    = actualInsMonthly != null;

    const isUpsideDown = marketValue > 0 && principal > marketValue;

    return {
      ...v, principal, payment, schedule, totalPaid, totalInt, early, chartData,
      vehMeta, marketValue, futureValue, deprecDuring,
      insRange, mntRange, insAnnual, mntAnnual,
      tcoLoan, tcoInsurance, tcoMaintenance, tcoDeprec, tcoTotal,
      isUpsideDown, isActualIns,
    };
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

        {vehicles.length > 1 && (
          <div style={{ marginTop:'1rem', background:'var(--navy)', color:'#fff', borderRadius:10, padding:'.85rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'.95rem' }}>{t('car.combinedMonthly')}</span>
            <span style={{ fontWeight:800, fontSize:'1.25rem' }}>{fmtUSD2(combinedMonthly)}</span>
          </div>
        )}
      </div>

      {vehicleResults.map(vr => {
        const models = vr.make ? VEHICLES.filter(x => x.make === vr.make).map(x => x.model) : [];
        const trims  = vr.make && vr.model ? (VEHICLES.find(x => x.make === vr.make && x.model === vr.model)?.trims ?? []) : [];

        return (
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
              <div>
                {/* ── Vehicle Lookup section ── */}
                <div style={{ background:'var(--light)', border:'1.5px solid var(--border)', borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
                  <div style={{ fontWeight:700, fontSize:'.92rem', color:'var(--navy)', marginBottom:'.85rem' }}>
                    🔍 {t('car.lookupTitle')} <span style={{ fontWeight:400, color:'var(--muted)', fontSize:'.82rem' }}>{t('car.lookupOptional')}</span>
                  </div>

                  {/* New / Used toggle */}
                  <div style={{ display:'flex', gap:'.5rem', marginBottom:'.85rem' }}>
                    {[true, false].map(isNew => (
                      <button
                        key={String(isNew)}
                        onClick={() => updateVehicle(vr.id, 'isNew', isNew)}
                        style={{
                          padding:'.35rem .9rem', borderRadius:7, border:'1.5px solid',
                          borderColor: vr.isNew === isNew ? 'var(--accent)' : 'var(--border)',
                          background: vr.isNew === isNew ? 'var(--accent)' : '#fff',
                          color: vr.isNew === isNew ? '#fff' : 'var(--text)',
                          fontWeight:600, fontSize:'.85rem', cursor:'pointer',
                        }}
                      >
                        {isNew ? t('car.newVehicle') : t('car.usedVehicle')}
                      </button>
                    ))}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'.65rem' }}>
                    {/* Make */}
                    <div className="field" style={{ margin:0 }}>
                      <label style={{ fontSize:'.78rem' }}>{t('car.make')}</label>
                      <select value={vr.make} onChange={e => updateVehicle(vr.id, 'make', e.target.value)}>
                        <option value="">{t('car.selectMake')}</option>
                        {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {/* Model */}
                    <div className="field" style={{ margin:0 }}>
                      <label style={{ fontSize:'.78rem' }}>{t('car.model')}</label>
                      <select value={vr.model} onChange={e => updateVehicle(vr.id, 'model', e.target.value)} disabled={!vr.make}>
                        <option value="">{t('car.selectModel')}</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {/* Trim */}
                    <div className="field" style={{ margin:0 }}>
                      <label style={{ fontSize:'.78rem' }}>{t('car.trim')}</label>
                      <select value={vr.trim} onChange={e => updateVehicle(vr.id, 'trim', e.target.value)} disabled={!vr.model}>
                        <option value="">{t('car.selectTrim')}</option>
                        {trims.map(tr => <option key={tr.name} value={tr.name}>{tr.name} — {fmtUSD(tr.msrp)}</option>)}
                      </select>
                    </div>
                    {/* Year (used only) */}
                    {!vr.isNew && (
                      <div className="field" style={{ margin:0 }}>
                        <label style={{ fontSize:'.78rem' }}>{t('car.year')}</label>
                        <select value={vr.year} onChange={e => updateVehicle(vr.id, 'year', +e.target.value)}>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    )}
                    {/* Mileage (used only) */}
                    {!vr.isNew && (
                      <div className="field" style={{ margin:0 }}>
                        <label style={{ fontSize:'.78rem' }}>{t('car.mileage')}</label>
                        <input type="number" min={0} step={1000} value={vr.mileage || ''}
                          onChange={e => updateVehicle(vr.id, 'mileage', e.target.value === '' ? 0 : +e.target.value)} />
                      </div>
                    )}
                    {/* Condition (used only) */}
                    {!vr.isNew && (
                      <div className="field" style={{ margin:0 }}>
                        <label style={{ fontSize:'.78rem' }}>{t('car.condition')}</label>
                        <select value={vr.condition} onChange={e => updateVehicle(vr.id, 'condition', e.target.value)}>
                          {['excellent','good','fair','poor'].map(c => (
                            <option key={c} value={c}>{t(`car.cond${c.charAt(0).toUpperCase() + c.slice(1)}`)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Vehicle value stats — shown when trim is selected */}
                  {vr.vehMeta && vr.trim && (
                    <div style={{ marginTop:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'.6rem' }}>
                      <ValueStat label={t('car.msrpBase')} value={fmtUSD(vr.vehMeta.trims.find(x=>x.name===vr.trim)?.msrp ?? vr.price)} />
                      <ValueStat label={t('car.marketValue')} value={fmtUSD(vr.marketValue)} color="var(--accent)" />
                      <ValueStat label={t('car.futureValue')} value={fmtUSD(vr.futureValue)} />
                      <ValueStat label={t('car.depreciationDuring')} value={fmtUSD(vr.deprecDuring)} color="var(--danger)" />
                      {vr.insRange && (
                        <ValueStat
                          label={t('car.insuranceEst')}
                          value={`${fmtUSD(vr.insRange[0])}–${fmtUSD(vr.insRange[1])}`}
                          sub={t('car.perYear')}
                        />
                      )}
                      {vr.mntRange && (
                        <ValueStat label={t('car.maintenanceEst')} value={`${fmtUSD(vr.mntRange[0])}–${fmtUSD(vr.mntRange[1])}`} sub={t('car.perYear')} />
                      )}
                    </div>
                  )}

                  {/* Actual insurance input */}
                  {vr.vehMeta && vr.trim && (
                    <div style={{ marginTop:'.85rem', display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                      <label style={{ fontSize:'.82rem', color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap' }}>
                        {t('car.actualInsuranceLabel')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        placeholder={t('car.actualInsurancePlaceholder')}
                        value={vr.actualInsurance || ''}
                        onChange={e => updateVehicle(vr.id, 'actualInsurance', e.target.value === '' ? 0 : +e.target.value)}
                        style={{ width:130, padding:'.35rem .65rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.85rem' }}
                      />
                      {vr.actualInsurance > 0 && (
                        <span style={{ fontSize:'.78rem', color:'var(--success)', fontWeight:600 }}>
                          ✓ {t('car.actualInsuranceUsed')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Upside-down warning */}
                  {vr.isUpsideDown && (
                    <div style={{ marginTop:'1rem', background:'#fef2f2', border:'1.5px solid var(--danger)', borderRadius:8, padding:'.85rem 1rem' }}>
                      <div style={{ fontWeight:700, color:'var(--danger)', fontSize:'.92rem', marginBottom:'.3rem' }}>{t('car.upsideDown')}</div>
                      <div style={{ fontSize:'.83rem', color:'#7f1d1d', lineHeight:1.5 }}>
                        {t('car.upsideDownDesc')
                          .replace('{loan}', fmtUSD(vr.principal))
                          .replace('{value}', fmtUSD(vr.marketValue))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Loan inputs + results ── */}
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

                {/* ── TCO Summary ── */}
                {vr.vehMeta && vr.trim && (
                  <div style={{ marginTop:'1.25rem', background:'var(--light)', border:'1.5px solid var(--border)', borderRadius:10, padding:'1rem 1.25rem' }}>
                    <div style={{ fontWeight:700, color:'var(--navy)', fontSize:'.95rem', marginBottom:'.85rem' }}>
                      💰 {t('car.tcoTitle')}
                      <span style={{ fontWeight:400, color:'var(--muted)', fontSize:'.82rem', marginLeft:'.5rem' }}>
                        {t('car.tcoOver').replace('{n}', vr.term)}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'flex-start' }}>
                      {/* Row breakdown */}
                      <div style={{ flex:'1', minWidth:200, display:'grid', gap:'.6rem' }}>
                        <TCORow label={t('car.tcoLoanCost')}    value={fmtUSD(vr.tcoLoan)} />
                        <TCORow
                          label={vr.isActualIns ? t('car.tcoInsuranceActual') : t('car.tcoInsurance')}
                          value={fmtUSD(vr.tcoInsurance)}
                          highlight={vr.isActualIns}
                        />
                        <TCORow label={t('car.tcoMaintenance')} value={fmtUSD(vr.tcoMaintenance)} />
                        <TCORow label={t('car.tcoDeprec')}      value={fmtUSD(vr.tcoDeprec)} color="var(--danger)" />
                        <TCORow label={t('car.tcoGrandTotal')}  value={fmtUSD(vr.tcoTotal)} bold color="var(--navy)" />
                      </div>
                      {/* Pie chart */}
                      {vr.tcoTotal > 0 && (
                        <div style={{ flex:'0 0 220px', height:180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: t('car.tcoLoanCost'),    value: Math.round(vr.tcoLoan) },
                                  { name: vr.isActualIns ? t('car.tcoInsuranceActual') : t('car.tcoInsurance'), value: Math.round(vr.tcoInsurance) },
                                  { name: t('car.tcoMaintenance'), value: Math.round(vr.tcoMaintenance) },
                                  { name: t('car.tcoDeprec'),      value: Math.round(vr.tcoDeprec) },
                                ].filter(d => d.value > 0)}
                                cx="50%" cy="50%"
                                innerRadius={45} outerRadius={72}
                                dataKey="value"
                                paddingAngle={2}
                              >
                                {['#1a5276','#2e86c1','#27ae60','#c0392b'].map((color, i) => (
                                  <Cell key={i} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={v => fmtUSD(v)} />
                              <Legend iconSize={10} wrapperStyle={{ fontSize:'.72rem' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

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

/* ─── small display helpers ─────────────────────────────────── */
function ValueStat({ label, value, sub, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'.6rem .8rem' }}>
      <div style={{ fontSize:'.7rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:'.2rem' }}>{label}</div>
      <div style={{ fontWeight:700, fontSize:'.95rem', color: color || 'var(--navy)' }}>{value}</div>
      {sub && <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

function TCORow({ label, value, color, bold, highlight }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      background: highlight ? '#eafaf1' : '#fff',
      border: `1px solid ${highlight ? 'var(--success)' : 'var(--border)'}`,
      borderRadius:8, padding:'.55rem .8rem',
    }}>
      <span style={{ fontSize:'.82rem', color: highlight ? 'var(--success)' : 'var(--muted)', fontWeight: bold ? 700 : 500 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, fontSize: bold ? '1rem' : '.9rem', color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
