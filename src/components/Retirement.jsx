import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';

function projectSavings(currentAge, retirementAge, currentSavings, monthlyContrib, annualReturn) {
  const months = (retirementAge - currentAge) * 12;
  const r = annualReturn / 100 / 12;
  const rows = [];
  let balance = currentSavings;
  let totalContrib = currentSavings;

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + monthlyContrib;
    totalContrib += monthlyContrib;
    const age = currentAge + m / 12;
    if (m % 12 === 0) {
      rows.push({
        age:           +age.toFixed(0),
        balance:       +balance.toFixed(0),
        contributions: +totalContrib.toFixed(0),
        growth:        +(balance - totalContrib).toFixed(0),
      });
    }
  }
  return { rows, finalBalance: balance, totalContributions: totalContrib };
}

/* Rule-of-thumb: need 25× desired annual income (4% withdrawal rule) */
function savingsTarget(desiredAnnualIncome) {
  return desiredAnnualIncome * 25;
}

/* Adjust future value to today's dollars */
function realValue(futureValue, inflationRate, years) {
  return futureValue / Math.pow(1 + inflationRate / 100, years);
}

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem' }}>
      <div style={{ fontWeight:700, marginBottom:'.35rem', color:'var(--navy)' }}>{t('retirement.age')} {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom:'.15rem' }}>
          {p.name}: <strong>{fmtUSD(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Retirement() {
  const t = useT();

  const [currentAge,     setCurrentAge]     = useState(32);
  const [retirementAge,  setRetirementAge]  = useState(65);
  const [currentSavings, setCurrentSavings] = useState(25000);
  const [monthlyContrib, setMonthlyContrib] = useState(500);
  const [annualReturn,   setAnnualReturn]   = useState(7);
  const [inflationRate,  setInflationRate]  = useState(3);
  const [desiredIncome,  setDesiredIncome]  = useState(60000);

  const yearsToRetire = Math.max(0, retirementAge - currentAge);
  const retirementYears = 25; /* assumed drawdown period */

  const { rows, finalBalance, totalContributions } = useMemo(
    () => projectSavings(currentAge, retirementAge, currentSavings, monthlyContrib, annualReturn),
    [currentAge, retirementAge, currentSavings, monthlyContrib, annualReturn]
  );

  const target        = savingsTarget(desiredIncome);
  const realBalance   = realValue(finalBalance, inflationRate, yearsToRetire);
  const totalGrowth   = finalBalance - totalContributions;
  const monthlyDraw   = finalBalance / (retirementYears * 12);
  const onTrack       = realBalance >= target;
  const gap           = Math.abs(realBalance - target);

  /* milestone ages where balance crosses 25 / 50 / 75% of target */
  const milestones = [0.25, 0.5, 0.75].map(pct => {
    const row = rows.find(r => r.balance >= target * pct);
    return row ? row.age : null;
  });

  const chartData = rows.map(r => ({
    [t('retirement.age')]:          r.age,
    [t('retirement.savings')]:      r.balance,
    [t('retirement.contributions')]:r.contributions,
    [t('retirement.growth')]:       r.growth,
  }));

  const ageKey  = t('retirement.age');
  const savKey  = t('retirement.savings');
  const contKey = t('retirement.contributions');

  return (
    <div>
      <p className="page-sub">{t('retirement.sub')}</p>

      <div className="two-col">
        {/* ── LEFT: inputs ── */}
        <div className="card">
          <div className="card-title"><span className="icon">👤</span> {t('retirement.inputs')}</div>

          <div className="two-col">
            <div className="field">
              <label>{t('retirement.currentAge')}</label>
              <input type="number" value={currentAge} min={16} max={80} onChange={e => setCurrentAge(+e.target.value)} />
            </div>
            <div className="field">
              <label>{t('retirement.retirementAge')}</label>
              <input type="number" value={retirementAge} min={currentAge + 1} max={90} onChange={e => setRetirementAge(+e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>{t('retirement.currentSavings')}</label>
            <input type="number" value={currentSavings} min={0} step={1000} onChange={e => setCurrentSavings(+e.target.value)} />
          </div>

          <div className="field">
            <label>{t('retirement.monthlyContrib')}</label>
            <input type="number" value={monthlyContrib} min={0} step={50} onChange={e => setMonthlyContrib(+e.target.value)} />
          </div>

          <div className="field">
            <label>
              {t('retirement.annualReturn')} — {annualReturn}%
              <span style={{ fontWeight:400, color:'var(--muted)', marginLeft:'.4rem', fontSize:'.78rem' }}>
                {t('retirement.annualReturnSub')}
              </span>
            </label>
            <input type="range" min={1} max={15} step={0.1} value={annualReturn} onChange={e => setAnnualReturn(+e.target.value)} />
            <div className="range-labels"><span>1%</span><span>15%</span></div>
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
            <input type="number" value={desiredIncome} min={0} step={5000} onChange={e => setDesiredIncome(+e.target.value)} />
          </div>
        </div>

        {/* ── RIGHT: results ── */}
        <div>
          {/* on-track banner */}
          <div style={{
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
            background: onTrack ? 'linear-gradient(135deg,#1e8449,#27ae60)' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
            color: '#fff',
          }}>
            <div style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'.4rem' }}>
              {onTrack ? t('retirement.onTrack') : t('retirement.offTrack')}
            </div>
            <div style={{ fontSize:'.88rem', opacity:.9, lineHeight:1.6 }}>
              {onTrack
                ? t('retirement.onTrackDesc')
                    .replace('{projected}', fmtUSD(realBalance))
                    .replace('{target}',    fmtUSD(target))
                : t('retirement.offTrackDesc')
                    .replace('{gap}',    fmtUSD(gap))
                    .replace('{target}', fmtUSD(target))
              }
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('retirement.results')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('retirement.projectedSavings')}</div>
                <div className="rb-value">{fmtUSD(finalBalance)}</div>
                <div className="rb-sub">{t('retirement.atAge').replace('{age}', retirementAge)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('retirement.target')}</div>
                <div className="rb-value">{fmtUSD(target)}</div>
                <div className="rb-sub">{t('retirement.targetSub').replace('{years}', retirementYears).replace('{income}', fmtUSD(desiredIncome))}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{onTrack ? t('retirement.surplus') : t('retirement.shortfall')}</div>
                <div className="rb-value" style={{ color: onTrack ? 'var(--success)' : 'var(--danger)' }}>
                  {fmtUSD(gap)}
                </div>
                <div className="rb-sub">real ({inflationRate}% {t('retirement.inflationRate').toLowerCase()})</div>
              </div>
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
                <div className="rb-value">{fmtUSD(totalContributions)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('retirement.totalGrowth')}</div>
                <div className="rb-value" style={{ color:'var(--success)' }}>{fmtUSD(totalGrowth)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Growth chart ── */}
      <div className="card">
        <div className="card-title"><span className="icon">📈</span> {t('retirement.growthChart')}</div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top:10, right:20, left:10, bottom:0 }}>
              <defs>
                <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1a5276" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1a5276" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="contGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#27ae60" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#27ae60" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey={ageKey} tick={{ fontSize:11 }} label={{ value: t('retirement.age'), position:'insideBottom', offset:-2, fontSize:11 }} />
              <YAxis tickFormatter={v => '$' + Math.round(v / 1000) + 'k'} tick={{ fontSize:11 }} width={58} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Legend wrapperStyle={{ fontSize:11, paddingTop:'8px' }} />
              <ReferenceLine y={target} stroke="#c0392b" strokeDasharray="6 3"
                label={{ value: t('retirement.target'), position:'insideTopRight', fontSize:10, fill:'#c0392b' }} />
              <Area type="monotone" dataKey={contKey} stroke="#27ae60" fill="url(#contGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey={savKey}  stroke="#1a5276" fill="url(#savGrad)"  strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Milestones ── */}
      <div className="card">
        <div className="card-title"><span className="icon">🏁</span> {t('retirement.milestones')}</div>
        <div className="three-col">
          {[
            { pct:'25%', key: t('retirement.milestone25'), age: milestones[0] },
            { pct:'50%', key: t('retirement.milestone50'), age: milestones[1] },
            { pct:'75%', key: t('retirement.milestone75'), age: milestones[2] },
          ].map((m, i) => (
            <div key={i} style={{
              padding:'1.1rem', borderRadius:10, textAlign:'center',
              background: m.age ? '#eafaf1' : '#fdedec',
              border: `1.5px solid ${m.age ? 'var(--success)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color: m.age ? 'var(--success)' : 'var(--muted)' }}>
                {m.pct}
              </div>
              <div style={{ fontSize:'.82rem', color:'var(--muted)', margin:'.2rem 0' }}>{m.key}</div>
              <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--navy)' }}>
                {m.age
                  ? `${t('retirement.age')} ${m.age}`
                  : '—'}
              </div>
              {m.age && (
                <div style={{ fontSize:'.75rem', color:'var(--muted)', marginTop:'.15rem' }}>
                  {t('retirement.retireIn').replace('{n}', Math.max(0, retirementAge - m.age))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

