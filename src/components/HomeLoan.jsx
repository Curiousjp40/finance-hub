import { useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

function calcExtraPayoff(principal, annualRate, basePayment, extra) {
  if (principal <= 0 || extra <= 0) return null;
  const r = annualRate / 100 / 12;
  const totalPmt = basePayment + extra;
  if (totalPmt <= principal * r) return null;
  let balance = principal, month = 0, totalInterest = 0;
  while (balance > 0.01 && month < 600) {
    const interest = balance * r;
    balance = Math.max(0, balance + interest - Math.min(totalPmt, balance + interest));
    totalInterest += interest;
    month++;
  }
  return { months: month, totalInterest };
}

export default function HomeLoan() {
  const t = useT();
  const [price,     setPrice]     = useLocalState('hl-price',     400000);
  const [down,      setDown]      = useLocalState('hl-down',      80000);
  const [rate,      setRate]      = useLocalState('hl-rate',      6.8);
  const [term,      setTerm]      = useLocalState('hl-term',      360);
  const [tax,       setTax]       = useLocalState('hl-tax',       350);
  const [insurance, setInsurance] = useLocalState('hl-insurance', 150);
  const [hoa,       setHoa]       = useLocalState('hl-hoa',       0);
  const [pmi,       setPmi]       = useLocalState('hl-pmi',       0);
  const [extra,     setExtra]     = useLocalState('hl-extra',     0);
  const [showTable, setShowTable] = useLocalState('hl-table',     false);

  const principal    = Math.max(0, price - down);
  const ltv          = price > 0 ? (principal / price) * 100 : 0;
  const estimatedPmi = +(principal * 0.008 / 12).toFixed(0);
  const payment      = useMemo(() => monthlyPayment(principal, rate, term), [principal, rate, term]);
  const schedule     = useMemo(() => amortizeSchedule(principal, rate, term), [principal, rate, term]);
  const totalPITI    = payment + tax + insurance + hoa + pmi;
  const totalPaid    = payment * term;
  const totalInt     = totalPaid - principal;
  const downPct      = price > 0 ? ((down / price) * 100).toFixed(1) : 0;

  /* Auto-calculate PMI when LTV > 80% */
  useEffect(() => {
    if (ltv > 80) {
      setPmi(estimatedPmi);
    } else {
      setPmi(0);
    }
  }, [ltv]); // eslint-disable-line react-hooks/exhaustive-deps

  const basePayoffMonths = term;
  const extraResult = useMemo(
    () => calcExtraPayoff(principal, rate, payment, extra),
    [principal, rate, payment, extra]
  );
  const totalIntBase = totalInt;
  const monthsSaved  = extraResult ? basePayoffMonths - extraResult.months : 0;
  const intSaved     = extraResult ? totalIntBase - extraResult.totalInterest : 0;

  const equityKey  = t('home.equity');
  const balanceKey = t('home.balance');

  const yearlyData = [];
  for (let y = 1; y <= term / 12; y += (term <= 180 ? 1 : 5)) {
    const row = schedule[Math.min(y * 12, schedule.length) - 1];
    yearlyData.push({
      year: `Yr ${y}`,
      [equityKey]:  +(principal - row.balance + down).toFixed(0),
      [balanceKey]: +row.balance.toFixed(0),
    });
  }

  return (
    <div>
      <p className="page-sub">{t('home.sub')}</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">🏠</span> {t('home.mortgageDetails')}</div>

          <div className="field">
            <label>{t('home.homePrice')}</label>
            <input type="number" value={price || ''} min={0} step={1000}
              onChange={e => setPrice(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('home.downPayment')} — {downPct}% ({fmtUSD(down)})</label>
            <input type="range" min={0} max={price} step={1000} value={down}
              onChange={e => setDown(+e.target.value)} />
            <div className="range-labels"><span>$0</span><span>{fmtUSD(price)}</span></div>
          </div>
          <div className="field">
            <label>{t('home.interestRate')} — {rate}%</label>
            <input type="range" min={1} max={15} step={0.05} value={rate}
              onChange={e => setRate(+e.target.value)} />
            <div className="range-labels"><span>1%</span><span>15%</span></div>
          </div>
          <div className="field">
            <label>{t('home.loanTerm')}</label>
            <select value={term} onChange={e => setTerm(+e.target.value)}>
              <option value={360}>{t('home.years30')}</option>
              <option value={240}>{t('home.years20')}</option>
              <option value={180}>{t('home.years15')}</option>
              <option value={120}>{t('home.years10')}</option>
            </select>
          </div>

          <div className="divider" />

          <div className="two-col">
            <div className="field">
              <label>{t('home.propertyTax')}</label>
              <input type="number" value={tax || ''} min={0}
                onChange={e => setTax(e.target.value === '' ? 0 : +e.target.value)} />
            </div>
            <div className="field">
              <label>{t('home.insurance')}</label>
              <input type="number" value={insurance || ''} min={0}
                onChange={e => setInsurance(e.target.value === '' ? 0 : +e.target.value)} />
            </div>
            <div className="field">
              <label>{t('home.hoa')}</label>
              <input type="number" value={hoa || ''} min={0}
                onChange={e => setHoa(e.target.value === '' ? 0 : +e.target.value)} />
            </div>
            <div className="field">
              <label>
                {t('home.pmi')}
                {ltv > 80 && <span style={{ color:'var(--danger)', fontWeight:700, marginLeft:'.35rem' }}>⚠</span>}
              </label>
              <input type="number" value={pmi || ''} min={0}
                onChange={e => setPmi(e.target.value === '' ? 0 : +e.target.value)} />
              {ltv > 80 && (
                <div style={{ fontSize:'.78rem', color:'var(--accent)', marginTop:'.3rem' }}>
                  {t('home.pmiHint')}
                </div>
              )}
            </div>
          </div>

          {ltv > 80 && (
            <p style={{ fontSize:'.82rem', color:'var(--danger)', marginTop:'-.25rem' }}>
              {t('home.ltvWarning').replace('{ltv}', ltv.toFixed(1))}
            </p>
          )}

          <div className="divider" />
          <div className="field">
            <label>{t('home.extraPmt')}</label>
            <input type="number" value={extra || ''} min={0} step={50}
              onChange={e => setExtra(e.target.value === '' ? 0 : +e.target.value)} />
          </div>

          {extraResult && extra > 0 && (
            <div style={{ background:'#eafaf1', border:'1.5px solid var(--success)', borderRadius:10, padding:'1rem 1.25rem' }}>
              <div style={{ fontWeight:700, color:'var(--success)', marginBottom:'.6rem', fontSize:'.95rem' }}>
                {t('home.withExtraPayoff')} (+{fmtUSD2(extra)}/mo)
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{t('home.monthsSaved')}</div>
                  <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)' }}>{monthsSaved}</div>
                </div>
                <div>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{t('home.interestSaved')}</div>
                  <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--success)' }}>{fmtUSD2(intSaved)}</div>
                </div>
              </div>
              <div style={{ fontSize:'.8rem', color:'var(--muted)', marginTop:'.5rem' }}>
                {t('home.paysOffIn').replace('{months}', extraResult.months)}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> {t('home.paymentBreakdown')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('home.totalPITI')}</div>
                <div className="rb-value">{fmtUSD2(totalPITI)}</div>
                <div className="rb-sub">{t('home.pitiSub')}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('home.piOnly')}</div>
                <div className="rb-value">{fmtUSD2(payment)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('home.loanAmount')}</div>
                <div className="rb-value">{fmtUSD(principal)}</div>
                <div className="rb-sub">LTV {ltv.toFixed(1)}%</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('home.totalInterest')}</div>
                <div className="rb-value" style={{ color:'var(--danger)' }}>{fmtUSD(totalInt)}</div>
              </div>
            </div>

            <div style={{ marginTop:'1rem', display:'flex', flexWrap:'wrap', gap:'.5rem' }}>
              {[
                { label:'P&I',    val: payment,   color:'#1a5276' },
                { label: t('home.propertyTax').replace(' /mo',''), val: tax,       color:'#8e44ad' },
                { label: t('home.insurance').replace(' /mo',''),   val: insurance, color:'#e67e22' },
                hoa > 0 && { label:'HOA', val: hoa, color:'#16a085' },
                pmi > 0 && { label:'PMI', val: pmi, color:'#c0392b' },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ background:`${item.color}18`, border:`1px solid ${item.color}40`, borderRadius:20, padding:'.25rem .75rem', fontSize:'.78rem' }}>
                  <span style={{ color: item.color, fontWeight:700 }}>{item.label}</span>
                  <span style={{ color:'var(--text)', marginLeft:'.35rem' }}>{fmtUSD2(item.val)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📈</span> {t('home.equityGrowth')}</div>
            <div className="chart-wrap" style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData} margin={{ top:5, right:10, left:0, bottom:0 }}>
                  <XAxis dataKey="year" tick={{ fontSize:10 }} />
                  <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize:10 }} width={52} />
                  <Tooltip formatter={v => fmtUSD(v)} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Line type="monotone" dataKey={equityKey}  stroke="#1e8449" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey={balanceKey} stroke="#1a5276" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem' }}>
          <div className="card-title" style={{ marginBottom:0 }}><span className="icon">📋</span> {t('home.amortSched')}</div>
          <button className="btn btn-secondary" onClick={() => setShowTable(s => !s)}>
            {showTable ? t('home.hideTable') : t('home.showTable')}
          </button>
        </div>
        {showTable && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('home.month')}</th>
                  <th>{t('home.payment')}</th>
                  <th>{t('home.principal')}</th>
                  <th>{t('home.interest')}</th>
                  <th>{t('home.balance')}</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(r => (
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
        )}
        {!showTable && <p className="text-muted" style={{ fontSize:'.85rem' }}>{t('home.toggleHint')}</p>}
      </div>
    </div>
  );
}
