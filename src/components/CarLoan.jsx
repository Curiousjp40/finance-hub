import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';

export default function CarLoan() {
  const t = useT();
  const [price,     setPrice]     = useState(35000);
  const [down,      setDown]      = useState(5000);
  const [rate,      setRate]      = useState(6.5);
  const [term,      setTerm]      = useState(60);
  const [tradeIn,   setTradeIn]   = useState(0);
  const [showTable, setShowTable] = useState(false);

  const principal = Math.max(0, price - down - tradeIn);
  const payment   = useMemo(() => monthlyPayment(principal, rate, term), [principal, rate, term]);
  const schedule  = useMemo(() => amortizeSchedule(principal, rate, term), [principal, rate, term]);
  const totalPaid = payment * term;
  const totalInt  = totalPaid - principal;

  const chartData = schedule
    .filter((_, i) => i % 3 === 0 || i === schedule.length - 1)
    .map(r => ({
      month: r.month,
      [t('car.balance')]: +r.balance.toFixed(0),
    }));

  const termLabel = (n) => {
    const yrs = n / 12;
    const yrWord = yrs === 1 ? t('car.yr') : t('car.yrs');
    return `${n} ${t('car.months')} (${yrs} ${yrWord})`;
  };

  return (
    <div>
      <p className="page-sub">{t('car.sub')}</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">🚗</span> {t('car.loanDetails')}</div>

          <div className="field">
            <label>{t('car.vehiclePrice')}</label>
            <input type="number" value={price} min={0} onChange={e => setPrice(+e.target.value)} />
          </div>
          <div className="two-col">
            <div className="field">
              <label>{t('car.downPayment')}</label>
              <input type="number" value={down} min={0} onChange={e => setDown(+e.target.value)} />
            </div>
            <div className="field">
              <label>{t('car.tradeIn')}</label>
              <input type="number" value={tradeIn} min={0} onChange={e => setTradeIn(+e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>{t('car.interestRate')} — {rate}%</label>
            <input type="range" min={0} max={25} step={0.1} value={rate} onChange={e => setRate(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>25%</span></div>
          </div>
          <div className="field">
            <label>{t('car.loanTerm')}</label>
            <select value={term} onChange={e => setTerm(+e.target.value)}>
              {[24,36,48,60,72,84].map(n => (
                <option key={n} value={n}>{termLabel(n)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> {t('car.paymentSummary')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('car.monthlyPayment')}</div>
                <div className="rb-value">{fmtUSD2(payment)}</div>
                <div className="rb-sub">{t('car.forMonths').replace('{n}', term)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('car.loanAmount')}</div>
                <div className="rb-value">{fmtUSD(principal)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('car.totalInterest')}</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD(totalInt)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('car.totalCost')}</div>
                <div className="rb-value">{fmtUSD(totalPaid + down + tradeIn)}</div>
                <div className="rb-sub">{t('car.includingDown')}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('car.balanceOverTime')}</div>
            <div className="chart-wrap" style={{height: 200}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:5, right:10, left:0, bottom:0}}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a5276" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1a5276" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{fontSize:11}} label={{value: t('car.month'), position:'insideBottom', offset:-2, fontSize:11}} />
                  <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{fontSize:11}} width={50} />
                  <Tooltip formatter={(v) => fmtUSD(v)} labelFormatter={l => `${t('car.month')} ${l}`} />
                  <Area type="monotone" dataKey={t('car.balance')} stroke="#1a5276" fill="url(#balGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem'}}>
          <div className="card-title" style={{marginBottom:0}}><span className="icon">📋</span> {t('car.amortSched')}</div>
          <button className="btn btn-secondary" onClick={() => setShowTable(s => !s)}>
            {showTable ? t('car.hideTable') : t('car.showTable')}
          </button>
        </div>
        {showTable && (
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
                {schedule.map(r => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{fmtUSD2(r.payment)}</td>
                    <td>{fmtUSD2(r.principal)}</td>
                    <td style={{color:'var(--danger)'}}>{fmtUSD2(r.interest)}</td>
                    <td>{fmtUSD2(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!showTable && <p className="text-muted" style={{fontSize:'.85rem'}}>{t('car.toggleHint')}</p>}
      </div>
    </div>
  );
}
