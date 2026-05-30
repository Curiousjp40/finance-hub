import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

function projectSavings(currentAge, retirementAge, currentBalance, monthlyContrib, annualReturn, stopAge) {
  const months     = (retirementAge - currentAge) * 12;
  const stopMonths = Math.max(0, (stopAge - currentAge) * 12);
  const r          = annualReturn / 100 / 12;
  const rows       = [];
  let balance      = currentBalance;
  let totalContrib = currentBalance;

  for (let m = 1; m <= months; m++) {
    const contrib = m <= stopMonths ? monthlyContrib : 0;
    balance       = balance * (1 + r) + contrib;
    totalContrib  += contrib;
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

function savingsTarget(desiredAnnualIncome) {
  return desiredAnnualIncome * 25;
}

function realValue(futureValue, inflationRate, years) {
  return futureValue / Math.pow(1 + inflationRate / 100, years);
}

const ACCOUNT_COLORS = ['#1a5276','#27ae60','#d4ac0d','#8e44ad','#e67e22','#c0392b','#16a085'];

const DEFAULT_ACCOUNTS = [
  { id: 1, name: 'TSP',      balance: 15000, monthlyContrib: 300, annualReturn: 7, stopAge: 65 },
  { id: 2, name: 'Roth IRA', balance: 10000, monthlyContrib: 200, annualReturn: 7, stopAge: 65 },
];

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

export default function Retirement() {
  const t = useT();
  const [newAccountName, setNewAccountName] = useState('');

  const [currentAge,    setCurrentAge]    = useLocalState('ret-age',      32);
  const [retirementAge, setRetirementAge] = useLocalState('ret-retage',   65);
  const [inflationRate, setInflationRate] = useLocalState('ret-inflation', 3);
  const [desiredIncome, setDesiredIncome] = useLocalState('ret-income',   60000);
  const [ssMonthly,     setSsMonthly]     = useLocalState('ret-ss',       0);
  const [accounts,      setAccounts]      = useLocalState('ret-accounts', DEFAULT_ACCOUNTS);
  const [nextId,        setNextId]        = useLocalState('ret-nextid', () => {
    try {
      const stored = localStorage.getItem('ret-accounts');
      if (stored) return Math.max(...JSON.parse(stored).map(a => a.id), 0) + 1;
    } catch {}
    return 3;
  });

  const yearsToRetire   = Math.max(0, retirementAge - currentAge);
  const retirementYears = 25;
  const ssAnnual        = ssMonthly * 12;
  const incomeFromSavings = Math.max(0, desiredIncome - ssAnnual);
  const target          = savingsTarget(incomeFromSavings);

  const accountProjections = useMemo(
    () => accounts.map(acc => ({
      ...acc,
      ...projectSavings(
        currentAge, retirementAge,
        acc.balance, acc.monthlyContrib, acc.annualReturn,
        acc.stopAge ?? retirementAge
      ),
    })),
    [accounts, currentAge, retirementAge]
  );

  const combinedFinalBalance  = accountProjections.reduce((s, ap) => s + ap.finalBalance, 0);
  const combinedContributions = accountProjections.reduce((s, ap) => s + ap.totalContributions, 0);
  const combinedGrowth        = combinedFinalBalance - combinedContributions;
  const realBalance           = realValue(combinedFinalBalance, inflationRate, yearsToRetire);
  const onTrack               = target === 0 ? true : realBalance >= target;
  const gap                   = Math.abs(realBalance - target);
  const monthlyDraw           = combinedFinalBalance / (retirementYears * 12);

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
      ap.rows.forEach(row => {
        map[row.age] = (map[row.age] || 0) + row.balance;
      });
    });
    return Object.entries(map)
      .map(([age, balance]) => ({ age: +age, balance }))
      .sort((a, b) => a.age - b.age);
  }, [accountProjections]);

  const milestones = target > 0
    ? [0.25, 0.5, 0.75].map(pct => {
        const row = combinedRows.find(r => r.balance >= target * pct);
        return row ? row.age : null;
      })
    : [null, null, null];

  function addAccount() {
    const name = newAccountName.trim() || `Account ${nextId}`;
    setAccounts(prev => [...prev, { id: nextId, name, balance: 0, monthlyContrib: 0, annualReturn: 7, stopAge: retirementAge }]);
    setNextId(n => n + 1);
    setNewAccountName('');
  }

  function updateAccount(id, field, value) {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  }

  function removeAccount(id) {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }

  return (
    <div>
      <p className="page-sub">{t('retirement.sub')}</p>

      {/* Global settings */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><span className="icon">⚙️</span> {t('retirement.globalSettings')}</div>
        <div className="two-col">
          <div className="field">
            <label>{t('retirement.currentAge')}</label>
            <input type="number" value={currentAge || ''} min={16} max={80}
              onChange={e => setCurrentAge(e.target.value === '' ? 16 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('retirement.retirementAge')}</label>
            <input type="number" value={retirementAge || ''} min={currentAge + 1} max={90}
              onChange={e => setRetirementAge(e.target.value === '' ? 65 : +e.target.value)} />
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
              {t('retirement.socialSecurity')}
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>
                {t('retirement.socialSecuritySub')}
              </span>
            </label>
            <input type="number" value={ssMonthly || ''} min={0} step={50}
              onChange={e => setSsMonthly(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
        </div>
        {ssMonthly > 0 && (
          <div style={{ background:'#eafaf1', border:'1px solid var(--success)', borderRadius:8, padding:'.6rem 1rem', marginTop:'-.25rem', fontSize:'.85rem', color:'var(--success)', fontWeight:600 }}>
            SS reduces your required portfolio by {fmtUSD(ssAnnual * 25)} (saves {fmtUSD(ssAnnual)}/yr from savings)
          </div>
        )}
        {target === 0 && (
          <div style={{ background:'#eafaf1', border:'1px solid var(--success)', borderRadius:8, padding:'.6rem 1rem', marginTop:'.5rem', fontSize:'.85rem', color:'var(--success)', fontWeight:700 }}>
            ✅ Your SS benefits cover your full retirement income goal! Any savings is a bonus.
          </div>
        )}
      </div>

      {/* Accounts */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
          <span><span className="icon">🏦</span> {t('retirement.accounts')}</span>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
            <input
              type="text"
              placeholder={t('retirement.newAccountName')}
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAccount()}
              style={{ padding:'.4rem .75rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.85rem', width:220 }}
            />
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
                  <input
                    type="text"
                    value={ap.name}
                    onChange={e => updateAccount(ap.id, 'name', e.target.value)}
                    style={{ flex:1, fontWeight:700, fontSize:'1rem', border:'none', background:'transparent', color:'var(--navy)', outline:'none' }}
                  />
                  <button
                    onClick={() => removeAccount(ap.id)}
                    style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1.1rem', padding:'0 .2rem', lineHeight:1 }}
                    title={t('retirement.removeAccount')}
                  >✕</button>
                </div>

                <div className="field" style={{ marginBottom:'.55rem' }}>
                  <label style={{ fontSize:'.78rem' }}>{t('retirement.accountBalance')}</label>
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
                <div className="field" style={{ marginBottom:'.8rem' }}>
                  <label style={{ fontSize:'.78rem' }}>
                    {t('retirement.stopAge')}
                    <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem' }}>({t('retirement.stopAgeHint')})</span>
                  </label>
                  <input type="number" value={ap.stopAge ?? retirementAge} min={currentAge} max={retirementAge}
                    onChange={e => updateAccount(ap.id, 'stopAge', e.target.value === '' ? retirementAge : Math.min(retirementAge, +e.target.value))} />
                </div>

                <div style={{ background:`${color}18`, borderRadius:8, padding:'.6rem .75rem', borderLeft:`3px solid ${color}` }}>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>
                    {t('retirement.projectedAt').replace('{age}', retirementAge)}
                  </div>
                  <div style={{ fontSize:'1.25rem', fontWeight:800, color, marginTop:'.15rem' }}>
                    {fmtUSD(ap.finalBalance)}
                  </div>
                  {(ap.stopAge ?? retirementAge) < retirementAge && (
                    <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.15rem' }}>
                      Contributions stop at age {ap.stopAge}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* On-track banner + summary */}
      <div className="two-col">
        <div>
          <div style={{
            borderRadius:12, padding:'1.25rem 1.5rem', marginBottom:'1.25rem',
            background: onTrack ? 'linear-gradient(135deg,#1e8449,#27ae60)' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
            color:'#fff',
          }}>
            <div style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'.4rem' }}>
              {onTrack ? t('retirement.onTrack') : t('retirement.offTrack')}
            </div>
            <div style={{ fontSize:'.88rem', opacity:.9, lineHeight:1.6 }}>
              {onTrack
                ? t('retirement.onTrackDesc').replace('{projected}', fmtUSD(realBalance)).replace('{target}', fmtUSD(target || desiredIncome * 25))
                : t('retirement.offTrackDesc').replace('{gap}', fmtUSD(gap)).replace('{target}', fmtUSD(target))
              }
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('retirement.results')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('retirement.combinedTotal')}</div>
                <div className="rb-value">{fmtUSD(combinedFinalBalance)}</div>
                <div className="rb-sub">{t('retirement.atAge').replace('{age}', retirementAge)}</div>
              </div>
              {target > 0 && (
                <div className="result-box">
                  <div className="rb-label">{t('retirement.target')}</div>
                  <div className="rb-value">{fmtUSD(target)}</div>
                  <div className="rb-sub">{t('retirement.targetSub').replace('{years}', retirementYears).replace('{income}', fmtUSD(incomeFromSavings))}</div>
                </div>
              )}
              {target > 0 && (
                <div className="result-box">
                  <div className="rb-label">{onTrack ? t('retirement.surplus') : t('retirement.shortfall')}</div>
                  <div className="rb-value" style={{ color: onTrack ? 'var(--success)' : 'var(--danger)' }}>{fmtUSD(gap)}</div>
                  <div className="rb-sub">real ({inflationRate}% inflation)</div>
                </div>
              )}
              <div className="result-box">
                <div className="rb-label">{t('retirement.monthlyInRetirement')}</div>
                <div className="rb-value">{fmtUSD(monthlyDraw)}</div>
                <div className="rb-sub">{t('retirement.monthlyInRetirementSub').replace('{years}', retirementYears)}</div>
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
        </div>

        <div className="card">
          <div className="card-title"><span className="icon">🗂</span> {t('retirement.accountsSummary')}</div>
          {accountProjections.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'.9rem' }}>
              {t('retirement.noAccounts')}
            </div>
          ) : (
            <>
              {accountProjections.map((ap, idx) => {
                const color = ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length];
                const pct = combinedFinalBalance > 0 ? (ap.finalBalance / combinedFinalBalance) * 100 : 0;
                return (
                  <div key={ap.id} style={{ marginBottom:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.3rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
                        <span style={{ fontWeight:600, fontSize:'.9rem', color:'var(--navy)' }}>{ap.name}</span>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:700, color, fontSize:'.9rem' }}>{fmtUSD(ap.finalBalance)}</div>
                        <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'#e9ecef', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width .3s' }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop:'1.5px solid var(--border)', paddingTop:'.75rem', marginTop:'.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:'var(--navy)' }}>{t('retirement.combinedTotal')}</span>
                <span style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)' }}>{fmtUSD(combinedFinalBalance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Growth chart */}
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
                {target > 0 && (
                  <ReferenceLine y={target} stroke="#c0392b" strokeDasharray="6 3"
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

      {/* Milestones */}
      <div className="card">
        <div className="card-title"><span className="icon">🏁</span> {t('retirement.milestones')}</div>
        {target === 0 ? (
          <div style={{ textAlign:'center', color:'var(--success)', padding:'1.5rem', fontSize:'.9rem', fontWeight:600 }}>
            ✅ SS covers your retirement — any savings is already beyond target!
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
                <div style={{ fontSize:'1.6rem', fontWeight:800, color: m.age ? 'var(--success)' : 'var(--muted)' }}>
                  {m.pct}
                </div>
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
