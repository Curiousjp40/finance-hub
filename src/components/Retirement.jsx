import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

/* ── helpers ────────────────────────────────────────────────── */
function projectSavings(currentAge, retirementAge, currentBalance, monthlyContrib, annualReturn, startAge, stopAge) {
  const months      = (retirementAge - currentAge) * 12;
  const startMonths = Math.max(0, Math.round((startAge - currentAge) * 12));
  const stopMonths  = Math.max(0, Math.round((stopAge  - currentAge) * 12));
  const r           = annualReturn / 100 / 12;
  const rows        = [];
  // If startAge > currentAge, the account doesn't exist yet — no balance, no growth until startAge.
  let balance      = startMonths === 0 ? currentBalance : 0;
  let totalContrib = startMonths === 0 ? currentBalance : 0;
  for (let m = 1; m <= months; m++) {
    // Inject the opening balance in the month the account starts
    if (startMonths > 0 && m === startMonths) {
      balance      += currentBalance;
      totalContrib += currentBalance;
    }
    if (m >= startMonths) {
      const contributing = m > startMonths && m <= stopMonths;
      balance      = balance * (1 + r) + (contributing ? monthlyContrib : 0);
      totalContrib += contributing ? monthlyContrib : 0;
    }
    if (m % 12 === 0) {
      rows.push({
        age:           +(currentAge + m / 12).toFixed(0),
        balance:       +balance.toFixed(0),
        contributions: +totalContrib.toFixed(0),
        growth:        +(balance - totalContrib).toFixed(0),
      });
    }
  }
  return { rows, finalBalance: balance, totalContributions: totalContrib };
}

function realValue(futureValue, inflationRate, years) {
  return futureValue / Math.pow(1 + inflationRate / 100, years);
}

// SS adjustment relative to FRA=67; +8%/yr delay, -~6.67%/yr early
const FRA = 67;
function ssAdjustFactor(claimAge) {
  const diff = claimAge - FRA;
  if (diff === 0) return 1;
  if (diff > 0) return 1 + diff * 0.08;
  const months = Math.abs(diff) * 12;
  const reduction = months <= 36
    ? months * (5 / 9 / 100)
    : 36 * (5 / 9 / 100) + (months - 36) * (5 / 12 / 100);
  return 1 - reduction;
}

const ACCOUNT_COLORS = ['#1a5276','#27ae60','#d4ac0d','#8e44ad','#e67e22','#c0392b','#16a085'];
const PENSION_COLORS = ['#0e6655','#1a5276','#7d3c98','#884ea0','#1f618d'];

const DEFAULT_ACCOUNTS = [];
const DEFAULT_PENSIONS  = [];

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', maxWidth:220 }}>
      <div style={{ fontWeight:700, marginBottom:'.35rem', color:'var(--navy)' }}>{t('retirement.age')} {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, marginBottom:'.15rem' }}>
          {p.name}: <strong>{fmtUSD(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── stat chip helper ───────────────────────────────────────── */
function IncomeLine({ label, amount, color, sub, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.55rem 0', borderBottom:'1px solid #f1f4f8' }}>
      <span style={{ fontSize:'.88rem', color: bold ? 'var(--navy)' : 'var(--muted)', fontWeight: bold ? 800 : 500 }}>{label}</span>
      <div style={{ textAlign:'right' }}>
        <span style={{ fontWeight: bold ? 800 : 700, color: color || 'var(--navy)', fontSize: bold ? '1.05rem' : '.9rem' }}>
          {fmtUSD(amount)}<span style={{ fontWeight:400, color:'var(--muted)', fontSize:'.78rem' }}>/mo</span>
        </span>
        {sub && <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Retirement() {
  const t = useT();

  /* ── investment accounts ───────────────────────────────────── */
  const [newAccountName, setNewAccountName] = useState('');
  const [currentAge,    setCurrentAge]    = useLocalState('ret-age',      0);
  const [retirementAge, setRetirementAge] = useLocalState('ret-retage',   0);
  const [inflationRate, setInflationRate] = useLocalState('ret-inflation', 0);
  const [desiredIncome, setDesiredIncome] = useLocalState('ret-income',   0);
  const [accounts,      setAccounts]      = useLocalState('ret-accounts', DEFAULT_ACCOUNTS);
  const [nextId,        setNextId]        = useLocalState('ret-nextid', 1);
  const [withdrawalRate, setWithdrawalRate] = useLocalState('ret-wr', 4);

  /* ── social security ───────────────────────────────────────── */
  const [ssFRA,       setSsFRA]       = useLocalState('ret-ss-fra',    0);   // estimated benefit at FRA
  const [ssClaimAge,  setSsClaimAge]  = useLocalState('ret-ss-age',    67);

  /* ── pensions ──────────────────────────────────────────────── */
  const [pensions,      setPensions]      = useLocalState('ret-pensions',        DEFAULT_PENSIONS);
  const [nextPensionId, setNextPensionId] = useLocalState('ret-pension-nextid',  1);
  const [newPensionName, setNewPensionName] = useState('');

  /* ── other income ──────────────────────────────────────────── */
  const [rentalMonthly,   setRentalMonthly]   = useLocalState('ret-rental',   0);
  const [partTimeMonthly, setPartTimeMonthly] = useLocalState('ret-parttime', 0);
  const [annuityMonthly,  setAnnuityMonthly]  = useLocalState('ret-annuity',  0);
  const [otherMonthlyAmt, setOtherMonthlyAmt] = useLocalState('ret-other',    0);

  /* ── derived: investment projections ───────────────────────── */
  const yearsToRetire = Math.max(0, retirementAge - currentAge);

  const accountProjections = useMemo(
    () => accounts.map(acc => ({
      ...acc,
      ...projectSavings(
        currentAge, retirementAge,
        acc.balance, acc.monthlyContrib, acc.annualReturn,
        acc.startAge ?? currentAge,
        acc.stopAge  ?? retirementAge
      ),
    })),
    [accounts, currentAge, retirementAge]
  );

  const combinedFinalBalance  = accountProjections.reduce((s, ap) => s + ap.finalBalance, 0);
  const combinedContributions = accountProjections.reduce((s, ap) => s + ap.totalContributions, 0);
  const combinedGrowth        = combinedFinalBalance - combinedContributions;
  const realPortfolio         = realValue(combinedFinalBalance, inflationRate, yearsToRetire);

  /* ── derived: all income sources ───────────────────────────── */
  const adjustedSS          = ssFRA * ssAdjustFactor(ssClaimAge);
  const totalPensionMonthly = pensions.reduce((s, p) => s + (p.monthlyAmount || 0), 0);
  const otherTotal          = (rentalMonthly || 0) + (partTimeMonthly || 0) + (annuityMonthly || 0) + (otherMonthlyAmt || 0);
  const portfolioMonthly    = combinedFinalBalance * (withdrawalRate / 100) / 12;
  const totalMonthlyIncome  = portfolioMonthly + adjustedSS + totalPensionMonthly + otherTotal;
  const monthlyTarget       = (desiredIncome || 0) / 12;
  const monthlyGap          = totalMonthlyIncome - monthlyTarget;
  const totalOnTrack        = monthlyTarget === 0 || totalMonthlyIncome >= monthlyTarget;

  // Portfolio target: how much portfolio needed to cover remaining income after all other sources
  const nonPortfolioMonthly = adjustedSS + totalPensionMonthly + otherTotal;
  const portfolioNeeded     = Math.max(0, monthlyTarget - nonPortfolioMonthly) * 12 / (withdrawalRate / 100);
  const portfolioOnTrack    = portfolioNeeded === 0 || realPortfolio >= portfolioNeeded;

  const ageKey   = t('retirement.age');
  const totalKey = t('retirement.total');

  const chartData = useMemo(() => {
    if (accountProjections.length === 0) return [];
    const maxLen = Math.max(...accountProjections.map(ap => ap.rows.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point = {};
      let total = 0;
      accountProjections.forEach(ap => {
        const row = ap.rows[i];
        if (row) {
          point[ap.name] = row.balance;
          total += row.balance;
          if (!point[ageKey]) point[ageKey] = row.age;
        }
      });
      point[totalKey] = total;
      return point;
    });
  }, [accountProjections, ageKey, totalKey]);

  const combinedRows = useMemo(() => {
    if (accountProjections.length === 0) return [];
    const map = {};
    accountProjections.forEach(ap => {
      ap.rows.forEach(row => { map[row.age] = (map[row.age] || 0) + row.balance; });
    });
    return Object.entries(map)
      .map(([age, balance]) => ({ age: +age, balance }))
      .sort((a, b) => a.age - b.age);
  }, [accountProjections]);

  const milestones = portfolioNeeded > 0
    ? [0.25, 0.5, 0.75].map(pct => {
        const row = combinedRows.find(r => r.balance >= portfolioNeeded * pct);
        return row ? row.age : null;
      })
    : [null, null, null];

  /* ── account handlers ───────────────────────────────────────── */
  function addAccount() {
    if (!newAccountName.trim()) return;
    setAccounts(prev => [...prev, { id: nextId, name: newAccountName.trim(), balance: 0, monthlyContrib: 0, annualReturn: 0, startAge: currentAge, stopAge: retirementAge }]);
    setNextId(n => n + 1);
    setNewAccountName('');
  }
  function updateAccount(id, field, value) {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  }
  function removeAccount(id) {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }

  /* ── pension handlers ───────────────────────────────────────── */
  function addPension() {
    if (!newPensionName.trim()) return;
    setPensions(prev => [...prev, {
      id: nextPensionId,
      name: newPensionName.trim(),
      monthlyAmount: 0,
      startAge: retirementAge || 65,
      cola: 0,
      survivorPct: 0,
    }]);
    setNextPensionId(n => n + 1);
    setNewPensionName('');
  }
  function updatePension(id, field, value) {
    setPensions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }
  function removePension(id) {
    setPensions(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div>
      <p className="page-sub">{t('retirement.sub')}</p>

      {/* ── Global Settings ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><span className="icon">⚙️</span> {t('retirement.globalSettings')}</div>
        <div className="two-col">
          <div className="field">
            <label>{t('retirement.currentAge')}</label>
            <input type="number" value={currentAge || ''} min={16} max={80}
              onChange={e => setCurrentAge(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.retirementAge')}</label>
            <input type="number" value={retirementAge || ''} min={currentAge + 1} max={90}
              onChange={e => setRetirementAge(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>
              {t('retirement.desiredIncome')}
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>
                {t('retirement.desiredIncomeSub')}
              </span>
            </label>
            <input type="number" value={desiredIncome || ''} min={0} step={5000}
              onChange={e => setDesiredIncome(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>
              {t('retirement.inflationRate')} — {inflationRate}%
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>
                {t('retirement.inflationSub')}
              </span>
            </label>
            <input type="range" min={0} max={8} step={0.1} value={inflationRate} onChange={e => setInflationRate(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>8%</span></div>
          </div>
          <div className="field">
            <label>
              {t('retirement.withdrawalRate')} — {withdrawalRate}%
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>
                {t('retirement.withdrawalRateSub')}
              </span>
            </label>
            <input type="range" min={2} max={8} step={0.1} value={withdrawalRate} onChange={e => setWithdrawalRate(+e.target.value)} />
            <div className="range-labels"><span>2%</span><span>8%</span></div>
          </div>
        </div>
      </div>

      {/* ── Investment Accounts ──────────────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
          <span><span className="icon">🏦</span> {t('retirement.accounts')}</span>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flex:1, maxWidth:420 }}>
            <input type="text" placeholder={t('retirement.newAccountName')} value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAccount()}
              style={{ flex:1, minWidth:0, padding:'.4rem .75rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.85rem' }} />
            <button className="btn" style={{ padding:'.45rem 1rem', fontSize:'.85rem', whiteSpace:'nowrap' }} onClick={addAccount}>
              + {t('retirement.addAccount')}
            </button>
          </div>
        </div>

        {accounts.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'.9rem' }}>
            {t('retirement.noAccounts')}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem', marginTop: accounts.length ? '.75rem' : 0 }}>
          {accountProjections.map((ap, idx) => {
            const color = ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length];
            return (
              <div key={ap.id} style={{ border:`2px solid ${color}`, borderRadius:10, padding:'1rem', background:'#fafbfc' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <input type="text" value={ap.name} onChange={e => updateAccount(ap.id, 'name', e.target.value)}
                    style={{ flex:1, fontWeight:700, fontSize:'1rem', border:'none', background:'transparent', color:'var(--navy)', outline:'none' }} />
                  <button onClick={() => removeAccount(ap.id)}
                    style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1.1rem', padding:'0 .2rem', lineHeight:1 }}
                    title={t('retirement.removeAccount')}>✕</button>
                </div>
                <div className="field" style={{ marginBottom:'.55rem' }}>
                  <label style={{ fontSize:'.78rem' }}>
                    {(ap.startAge ?? currentAge) > currentAge
                      ? t('retirement.accountBalanceFuture').replace('{age}', ap.startAge ?? currentAge)
                      : t('retirement.accountBalance')}
                  </label>
                  <input type="number" value={ap.balance || ''} min={0} step={500}
                    onChange={e => updateAccount(ap.id, 'balance', e.target.value === '' ? 0 : +e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom:'.55rem' }}>
                  <label style={{ fontSize:'.78rem' }}>{t('retirement.accountContrib')}</label>
                  <input type="number" value={ap.monthlyContrib || ''} min={0} step={50}
                    onChange={e => updateAccount(ap.id, 'monthlyContrib', e.target.value === '' ? 0 : +e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom:'.55rem' }}>
                  <label style={{ fontSize:'.78rem' }}>{t('retirement.accountReturn')} — {ap.annualReturn}%</label>
                  <input type="range" min={1} max={15} step={0.1} value={ap.annualReturn}
                    onChange={e => updateAccount(ap.id, 'annualReturn', +e.target.value)} />
                  <div className="range-labels"><span>1%</span><span>15%</span></div>
                </div>
                <div className="two-col" style={{ gap:'.5rem', marginBottom:'.8rem' }}>
                  <div className="field" style={{ marginBottom:0 }}>
                    <label style={{ fontSize:'.78rem' }}>
                      {t('retirement.startAge')}
                      <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem' }}>({t('retirement.startAgeHint')})</span>
                    </label>
                    <input type="number" value={ap.startAge ?? currentAge} min={currentAge} max={ap.stopAge ?? retirementAge}
                      onChange={e => updateAccount(ap.id, 'startAge', e.target.value === '' ? currentAge : Math.max(currentAge, +e.target.value))} />
                  </div>
                  <div className="field" style={{ marginBottom:0 }}>
                    <label style={{ fontSize:'.78rem' }}>
                      {t('retirement.stopAge')}
                      <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem' }}>({t('retirement.stopAgeHint')})</span>
                    </label>
                    <input type="number" value={ap.stopAge ?? retirementAge} min={ap.startAge ?? currentAge} max={retirementAge}
                      onChange={e => updateAccount(ap.id, 'stopAge', e.target.value === '' ? retirementAge : Math.min(retirementAge, +e.target.value))} />
                  </div>
                </div>
                <div style={{ background:`${color}18`, borderRadius:8, padding:'.6rem .75rem', borderLeft:`3px solid ${color}` }}>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>
                    {t('retirement.projectedAt').replace('{age}', retirementAge)}
                  </div>
                  <div style={{ fontSize:'1.25rem', fontWeight:800, color, marginTop:'.15rem' }}>{fmtUSD(ap.finalBalance)}</div>
                  {(ap.startAge ?? currentAge) > currentAge && (
                    <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.15rem' }}>
                      {t('retirement.accountOpensAt').replace('{age}', ap.startAge ?? currentAge)}
                    </div>
                  )}
                  {(ap.stopAge ?? retirementAge) < retirementAge && (
                    <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.15rem' }}>
                      {t('retirement.contribsStopAt').replace('{age}', ap.stopAge)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Social Security ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><span className="icon">🏛️</span> {t('retirement.ssTitle')}</div>
        <p style={{ fontSize:'.85rem', color:'var(--muted)', marginBottom:'1rem', lineHeight:1.6 }}>
          {t('retirement.ssInstructions')}
        </p>
        <div className="two-col">
          <div className="field">
            <label>
              {t('retirement.ssFRALabel')}
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>({t('retirement.ssFRASub')})</span>
            </label>
            <input type="number" value={ssFRA || ''} min={0} step={50}
              onChange={e => setSsFRA(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.ssClaimAge')}</label>
            <select value={ssClaimAge} onChange={e => setSsClaimAge(+e.target.value)}>
              {[62,63,64,65,66,67,68,69,70].map(age => (
                <option key={age} value={age}>
                  {t('retirement.age')} {age}
                  {age < FRA ? ` (${((1 - ssAdjustFactor(age)) * 100).toFixed(1)}% ${t('retirement.reduced')})` : ''}
                  {age === FRA ? ` (${t('retirement.fullBenefit')})` : ''}
                  {age > FRA ? ` (+${((ssAdjustFactor(age) - 1) * 100).toFixed(1)}% ${t('retirement.bonus')})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        {ssFRA > 0 && (
          <div style={{ background:'#eafaf1', border:'1px solid var(--success)', borderRadius:8, padding:'.75rem 1rem', marginTop:'.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
              <span style={{ fontSize:'.88rem', color:'var(--success)', fontWeight:700 }}>
                {t('retirement.ssAdjustedLabel')} ({t('retirement.age')} {ssClaimAge})
              </span>
              <span style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--success)' }}>
                {fmtUSD(adjustedSS)}/mo · {fmtUSD(adjustedSS * 12)}/yr
              </span>
            </div>
            {ssClaimAge !== FRA && (
              <div style={{ fontSize:'.78rem', color:'var(--muted)', marginTop:'.3rem' }}>
                {ssClaimAge < FRA
                  ? t('retirement.ssEarlyNote').replace('{pct}', ((1 - ssAdjustFactor(ssClaimAge)) * 100).toFixed(1)).replace('{fra}', FRA)
                  : t('retirement.ssDelayNote').replace('{pct}', ((ssAdjustFactor(ssClaimAge) - 1) * 100).toFixed(1)).replace('{fra}', FRA)
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pensions ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
          <span><span className="icon">🏢</span> {t('retirement.pensionsTitle')}</span>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flex:1, maxWidth:420 }}>
            <input type="text" placeholder={t('retirement.newPensionName')} value={newPensionName}
              onChange={e => setNewPensionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPension()}
              style={{ flex:1, minWidth:0, padding:'.4rem .75rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.85rem' }} />
            <button className="btn" style={{ padding:'.45rem 1rem', fontSize:'.85rem', whiteSpace:'nowrap' }} onClick={addPension}>
              + {t('retirement.addPension')}
            </button>
          </div>
        </div>

        {pensions.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'.9rem' }}>
            {t('retirement.noPensions')}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem', marginTop: pensions.length ? '.75rem' : 0 }}>
          {pensions.map((p, idx) => {
            const color = PENSION_COLORS[idx % PENSION_COLORS.length];
            const survivorAmt = p.monthlyAmount * (p.survivorPct / 100);
            return (
              <div key={p.id} style={{ border:`2px solid ${color}`, borderRadius:10, padding:'1rem', background:'#fafbfc' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <input type="text" value={p.name} onChange={e => updatePension(p.id, 'name', e.target.value)}
                    style={{ flex:1, fontWeight:700, fontSize:'1rem', border:'none', background:'transparent', color:'var(--navy)', outline:'none' }} />
                  <button onClick={() => removePension(p.id)}
                    style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1.1rem', padding:'0 .2rem', lineHeight:1 }}
                    title={t('retirement.removePension')}>✕</button>
                </div>
                <div className="field" style={{ marginBottom:'.55rem' }}>
                  <label style={{ fontSize:'.78rem' }}>{t('retirement.pensionMonthly')}</label>
                  <input type="number" value={p.monthlyAmount || ''} min={0} step={100}
                    onChange={e => updatePension(p.id, 'monthlyAmount', e.target.value === '' ? 0 : +e.target.value)} />
                </div>
                <div className="two-col" style={{ gap:'.5rem' }}>
                  <div className="field" style={{ marginBottom:'.55rem' }}>
                    <label style={{ fontSize:'.78rem' }}>{t('retirement.pensionStartAge')}</label>
                    <input type="number" value={p.startAge || ''} min={40} max={80}
                      onChange={e => updatePension(p.id, 'startAge', e.target.value === '' ? 65 : +e.target.value)} />
                  </div>
                  <div className="field" style={{ marginBottom:'.55rem' }}>
                    <label style={{ fontSize:'.78rem' }}>{t('retirement.pensionCola')} — {p.cola}%</label>
                    <input type="range" min={0} max={5} step={0.1} value={p.cola}
                      onChange={e => updatePension(p.id, 'cola', +e.target.value)} />
                    <div className="range-labels"><span>0%</span><span>5%</span></div>
                  </div>
                </div>
                <div className="field" style={{ marginBottom:'.8rem' }}>
                  <label style={{ fontSize:'.78rem' }}>{t('retirement.pensionSurvivor')} — {p.survivorPct}%</label>
                  <input type="range" min={0} max={100} step={5} value={p.survivorPct}
                    onChange={e => updatePension(p.id, 'survivorPct', +e.target.value)} />
                  <div className="range-labels"><span>0%</span><span>100%</span></div>
                </div>

                <div style={{ background:`${color}18`, borderRadius:8, padding:'.65rem .75rem', borderLeft:`3px solid ${color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>
                        {t('retirement.pensionAtRetirement')}
                      </div>
                      <div style={{ fontSize:'1.2rem', fontWeight:800, color, marginTop:'.1rem' }}>
                        {fmtUSD(p.monthlyAmount)}/mo
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>
                        {t('retirement.annualPension')}
                      </div>
                      <div style={{ fontSize:'.95rem', fontWeight:700, color:'var(--navy)', marginTop:'.1rem' }}>
                        {fmtUSD(p.monthlyAmount * 12)}/yr
                      </div>
                    </div>
                  </div>
                  {p.cola > 0 && (
                    <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.3rem' }}>
                      {t('retirement.pensionColaNote').replace('{pct}', p.cola)}
                    </div>
                  )}
                  {p.survivorPct > 0 && (
                    <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.15rem' }}>
                      {t('retirement.pensionSurvivorNote').replace('{pct}', p.survivorPct).replace('{amt}', fmtUSD(survivorAmt))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Other Income ─────────────────────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><span className="icon">💵</span> {t('retirement.otherIncomeTitle')}</div>
        <p style={{ fontSize:'.85rem', color:'var(--muted)', marginBottom:'1rem', lineHeight:1.6 }}>
          {t('retirement.otherIncomeSub')}
        </p>
        <div className="two-col">
          <div className="field">
            <label>{t('retirement.rentalIncome')}</label>
            <input type="number" value={rentalMonthly || ''} min={0} step={100}
              onChange={e => setRentalMonthly(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.partTimeIncome')}</label>
            <input type="number" value={partTimeMonthly || ''} min={0} step={100}
              onChange={e => setPartTimeMonthly(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.annuityIncome')}</label>
            <input type="number" value={annuityMonthly || ''} min={0} step={100}
              onChange={e => setAnnuityMonthly(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.otherIncome')}</label>
            <input type="number" value={otherMonthlyAmt || ''} min={0} step={100}
              onChange={e => setOtherMonthlyAmt(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Retirement Income Projection ─────────────────────── */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><span className="icon">💰</span> {t('retirement.incomeProjection').replace('{age}', retirementAge || '—')}</div>

        {/* 4% rule explainer */}
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'.75rem 1rem', marginBottom:'1.25rem' }}>
          <div style={{ fontWeight:700, color:'#1e40af', fontSize:'.88rem', marginBottom:'.4rem' }}>
            📐 {t('retirement.fourPctExplainer')}
          </div>
          <div style={{ fontSize:'.82rem', color:'#1e3a8a', lineHeight:1.6 }}>
            {t('retirement.fourPctDesc')}
          </div>
          <div style={{ display:'flex', gap:'1rem', marginTop:'.75rem', flexWrap:'wrap' }}>
            {[3, 3.5, 4, 4.5, 5].map(rate => (
              <div key={rate} style={{
                padding:'.35rem .75rem', borderRadius:6,
                background: withdrawalRate === rate ? '#1e40af' : '#dbeafe',
                color: withdrawalRate === rate ? '#fff' : '#1e40af',
                fontWeight: 700, fontSize:'.82rem', cursor:'pointer',
                border: `1.5px solid ${withdrawalRate === rate ? '#1e40af' : '#bfdbfe'}`,
              }} onClick={() => setWithdrawalRate(rate)}>
                {rate}% → {fmtUSD(combinedFinalBalance * rate / 100 / 12)}/mo
              </div>
            ))}
          </div>
        </div>

        {/* Income breakdown */}
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.75rem', fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>
            {t('retirement.monthlyIncomeBreakdown')}
          </div>

          {/* Portfolio */}
          <IncomeLine
            label={`📈 ${t('retirement.portfolioIncome').replace('{pct}', withdrawalRate)}`}
            amount={portfolioMonthly}
            sub={`${fmtUSD(combinedFinalBalance)} × ${withdrawalRate}% ÷ 12`}
          />

          {/* Social Security */}
          {adjustedSS > 0 && (
            <IncomeLine
              label={`🏛️ ${t('retirement.ssIncomeLine')} (${t('retirement.age')} ${ssClaimAge})`}
              amount={adjustedSS}
              color="#16a34a"
            />
          )}

          {/* Pensions */}
          {pensions.map(p => p.monthlyAmount > 0 && (
            <IncomeLine
              key={p.id}
              label={`🏢 ${p.name}`}
              amount={p.monthlyAmount}
              color="#7c3aed"
              sub={p.cola > 0 ? `+${p.cola}% COLA/yr` : undefined}
            />
          ))}

          {/* Other income lines */}
          {rentalMonthly > 0 && <IncomeLine label={`🏠 ${t('retirement.rentalIncome')}`} amount={rentalMonthly} color="#0891b2" />}
          {partTimeMonthly > 0 && <IncomeLine label={`💼 ${t('retirement.partTimeIncome')}`} amount={partTimeMonthly} color="#0891b2" />}
          {annuityMonthly > 0 && <IncomeLine label={`📜 ${t('retirement.annuityIncome')}`} amount={annuityMonthly} color="#0891b2" />}
          {otherMonthlyAmt > 0 && <IncomeLine label={`💵 ${t('retirement.otherIncome')}`} amount={otherMonthlyAmt} color="#0891b2" />}

          {/* Divider + Total */}
          <div style={{ borderTop:'2px solid var(--border)', marginTop:'.35rem' }} />
          <IncomeLine
            label={t('retirement.totalMonthlyIncome')}
            amount={totalMonthlyIncome}
            bold
          />
          {monthlyTarget > 0 && (
            <IncomeLine
              label={t('retirement.monthlyTarget')}
              amount={monthlyTarget}
              color="var(--muted)"
            />
          )}
        </div>

        {/* Surplus / Shortfall */}
        {monthlyTarget > 0 && (
          <div style={{
            borderRadius:10, padding:'1rem 1.25rem',
            background: totalOnTrack ? 'linear-gradient(135deg,#1e8449,#27ae60)' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
            color:'#fff',
          }}>
            <div style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'.3rem' }}>
              {totalOnTrack ? `✅ ${t('retirement.onTrack')}` : `⚠ ${t('retirement.offTrack')}`}
            </div>
            <div style={{ fontSize:'.9rem', opacity:.9 }}>
              {totalOnTrack
                ? t('retirement.incomeSurplusDesc').replace('{surplus}', fmtUSD(monthlyGap)).replace('{total}', fmtUSD(totalMonthlyIncome)).replace('{target}', fmtUSD(monthlyTarget))
                : t('retirement.incomeShortfallDesc').replace('{gap}', fmtUSD(Math.abs(monthlyGap))).replace('{total}', fmtUSD(totalMonthlyIncome)).replace('{target}', fmtUSD(monthlyTarget))
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Portfolio Results + Account Breakdown ────────────── */}
      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">📊</span> {t('retirement.results')}</div>
          <div className="result-grid">
            <div className="result-box highlight">
              <div className="rb-label">{t('retirement.portfolioAtRetirement')}</div>
              <div className="rb-value">{fmtUSD(combinedFinalBalance)}</div>
              <div className="rb-sub">{t('retirement.atAge').replace('{age}', retirementAge)}</div>
            </div>
            {portfolioNeeded > 0 && (
              <div className="result-box">
                <div className="rb-label">{t('retirement.portfolioTarget')}</div>
                <div className="rb-value">{fmtUSD(portfolioNeeded)}</div>
                <div className="rb-sub">{t('retirement.portfolioTargetSub').replace('{pct}', withdrawalRate)}</div>
              </div>
            )}
            {portfolioNeeded > 0 && (
              <div className="result-box">
                <div className="rb-label">{portfolioOnTrack ? t('retirement.surplus') : t('retirement.shortfall')}</div>
                <div className="rb-value" style={{ color: portfolioOnTrack ? 'var(--success)' : 'var(--danger)' }}>
                  {fmtUSD(Math.abs(realPortfolio - portfolioNeeded))}
                </div>
                <div className="rb-sub">real ({inflationRate}% inflation)</div>
              </div>
            )}
            <div className="result-box">
              <div className="rb-label">{t('retirement.portfolioMonthly').replace('{pct}', withdrawalRate)}</div>
              <div className="rb-value">{fmtUSD(portfolioMonthly)}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('retirement.yearsToRetire')}</div>
              <div className="rb-value">{yearsToRetire}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('retirement.totalContribs')}</div>
              <div className="rb-value">{fmtUSD(combinedContributions)}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('retirement.totalGrowth')}</div>
              <div className="rb-value" style={{ color:'var(--success)' }}>{fmtUSD(combinedGrowth)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="icon">🗂</span> {t('retirement.accountsSummary')}</div>
          {accountProjections.length === 0 && pensions.length === 0 && adjustedSS === 0 && otherTotal === 0 ? (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'.9rem' }}>
              {t('retirement.noAccounts')}
            </div>
          ) : (
            <>
              {/* Investment accounts */}
              {accountProjections.length > 0 && (
                <div style={{ marginBottom:'.5rem' }}>
                  <div style={{ fontSize:'.7rem', fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>
                    {t('retirement.accounts')}
                  </div>
                  {accountProjections.map((ap, idx) => {
                    const color = ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length];
                    const pct = combinedFinalBalance > 0 ? (ap.finalBalance / combinedFinalBalance) * 100 : 0;
                    return (
                      <div key={ap.id} style={{ marginBottom:'.85rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.3rem' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
                            <span style={{ fontWeight:600, fontSize:'.88rem', color:'var(--navy)' }}>{ap.name}</span>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:700, color, fontSize:'.88rem' }}>{fmtUSD(ap.finalBalance)}</div>
                            <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div style={{ height:5, borderRadius:3, background:'#e9ecef', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width .3s' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', fontWeight:700, color:'var(--navy)', borderTop:'1.5px solid var(--border)', paddingTop:'.5rem', marginBottom:'1rem' }}>
                    <span>{t('retirement.combinedTotal')}</span>
                    <span>{fmtUSD(combinedFinalBalance)}</span>
                  </div>
                </div>
              )}

              {/* Monthly income sources */}
              {(adjustedSS > 0 || totalPensionMonthly > 0 || otherTotal > 0) && (
                <div>
                  <div style={{ fontSize:'.7rem', fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>
                    {t('retirement.monthlyIncomeBreakdown')}
                  </div>
                  {adjustedSS > 0 && (
                    <BreakdownRow icon="🏛️" label={t('retirement.ssIncomeLine')} value={`${fmtUSD(adjustedSS)}/mo`} color="#16a34a" />
                  )}
                  {pensions.map(p => p.monthlyAmount > 0 && (
                    <BreakdownRow key={p.id} icon="🏢" label={p.name} value={`${fmtUSD(p.monthlyAmount)}/mo`} color="#7c3aed" />
                  ))}
                  {rentalMonthly > 0 && <BreakdownRow icon="🏠" label={t('retirement.rentalIncome')} value={`${fmtUSD(rentalMonthly)}/mo`} color="#0891b2" />}
                  {partTimeMonthly > 0 && <BreakdownRow icon="💼" label={t('retirement.partTimeIncome')} value={`${fmtUSD(partTimeMonthly)}/mo`} color="#0891b2" />}
                  {annuityMonthly > 0 && <BreakdownRow icon="📜" label={t('retirement.annuityIncome')} value={`${fmtUSD(annuityMonthly)}/mo`} color="#0891b2" />}
                  {otherMonthlyAmt > 0 && <BreakdownRow icon="💵" label={t('retirement.otherIncome')} value={`${fmtUSD(otherMonthlyAmt)}/mo`} color="#0891b2" />}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Growth Chart ─────────────────────────────────────── */}
      <div className="card">
        <div className="card-title"><span className="icon">📈</span> {t('retirement.growthChart')}</div>
        {chartData.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'.9rem' }}>
            {t('retirement.noAccounts')}
          </div>
        ) : (
          <div style={{ height:320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top:10, right:20, left:10, bottom:0 }}>
                <XAxis dataKey={ageKey} tick={{ fontSize:11 }} label={{ value:t('retirement.age'), position:'insideBottom', offset:-2, fontSize:11 }} />
                <YAxis tickFormatter={v => '$' + Math.round(v / 1000) + 'k'} tick={{ fontSize:11 }} width={62} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Legend wrapperStyle={{ fontSize:11, paddingTop:'8px' }} />
                {portfolioNeeded > 0 && (
                  <ReferenceLine y={portfolioNeeded} stroke="#c0392b" strokeDasharray="6 3"
                    label={{ value:t('retirement.target'), position:'insideTopRight', fontSize:10, fill:'#c0392b' }} />
                )}
                {accountProjections.map((ap, idx) => (
                  <Line key={ap.id} type="monotone" dataKey={ap.name}
                    stroke={ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r:4 }} />
                ))}
                {accountProjections.length > 1 && (
                  <Line type="monotone" dataKey={totalKey} stroke="#0a2342" strokeWidth={2.5} strokeDasharray="5 3" dot={false} activeDot={{ r:4 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Milestones ───────────────────────────────────────── */}
      <div className="card">
        <div className="card-title"><span className="icon">🏁</span> {t('retirement.milestones')}</div>
        {portfolioNeeded === 0 ? (
          <div style={{ textAlign:'center', color:'var(--success)', padding:'1.5rem', fontSize:'.9rem', fontWeight:600 }}>
            ✅ {t('retirement.portfolioNotNeeded')}
          </div>
        ) : (
          <div className="three-col">
            {[
              { pct:'25%', key:t('retirement.milestone25'), age:milestones[0] },
              { pct:'50%', key:t('retirement.milestone50'), age:milestones[1] },
              { pct:'75%', key:t('retirement.milestone75'), age:milestones[2] },
            ].map((m, i) => (
              <div key={i} style={{
                padding:'1.1rem', borderRadius:10, textAlign:'center',
                background: m.age ? '#eafaf1' : '#fdedec',
                border:`1.5px solid ${m.age ? 'var(--success)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize:'1.6rem', fontWeight:800, color: m.age ? 'var(--success)' : 'var(--muted)' }}>{m.pct}</div>
                <div style={{ fontSize:'.82rem', color:'var(--muted)', margin:'.2rem 0' }}>{m.key}</div>
                <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--navy)' }}>
                  {m.age ? `${t('retirement.age')} ${m.age}` : '—'}
                </div>
                {m.age && (
                  <div style={{ fontSize:'.75rem', color:'var(--muted)', marginTop:'.15rem' }}>
                    {t('retirement.retireIn').replace('{n}', Math.max(0, retirementAge - m.age))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── small helpers ──────────────────────────────────────────── */
function BreakdownRow({ icon, label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.4rem 0', borderBottom:'1px solid #f1f4f8' }}>
      <span style={{ fontSize:'.85rem', color:'var(--muted)' }}>{icon} {label}</span>
      <span style={{ fontWeight:700, color: color || 'var(--navy)', fontSize:'.85rem' }}>{value}</span>
    </div>
  );
}
