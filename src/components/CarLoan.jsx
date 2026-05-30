import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2, fmt } from '../utils/finance';

export default function CarLoan() {
  const [price,      setPrice]      = useState(35000);
  const [down,       setDown]       = useState(5000);
  const [rate,       setRate]       = useState(6.5);
  const [term,       setTerm]       = useState(60);
  const [tradeIn,    setTradeIn]    = useState(0);
  const [showTable,  setShowTable]  = useState(false);

  const principal = Math.max(0, price - down - tradeIn);
  const payment   = useMemo(() => monthlyPayment(principal, rate, term), [principal, rate, term]);
  const schedule  = useMemo(() => amortizeSchedule(principal, rate, term), [principal, rate, term]);
  const totalPaid = payment * term;
  const totalInt  = totalPaid - principal;

  const chartData = schedule
    .filter((_, i) => i % 3 === 0 || i === schedule.length - 1)
    .map(r => ({
      month: r.month,
      Balance: +r.balance.toFixed(0),
      Principal: +(schedule.slice(0, r.month).reduce((s, x) => s + x.principal, 0)).toFixed(0),
      Interest:  +(schedule.slice(0, r.month).reduce((s, x) => s + x.interest, 0)).toFixed(0),
    }));

  return (
    <div>
      <p className="page-sub">Calculate your monthly payment and total cost for a vehicle purchase.</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">🚗</span> Loan Details</div>

          <div className="field">
            <label>Vehicle Price</label>
            <input type="number" value={price} min={0} onChange={e => setPrice(+e.target.value)} />
          </div>
          <div className="two-col">
            <div className="field">
              <label>Down Payment</label>
              <input type="number" value={down} min={0} onChange={e => setDown(+e.target.value)} />
            </div>
            <div className="field">
              <label>Trade-In Value</label>
              <input type="number" value={tradeIn} min={0} onChange={e => setTradeIn(+e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Interest Rate — {rate}%</label>
            <input type="range" min={0} max={25} step={0.1} value={rate} onChange={e => setRate(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>25%</span></div>
          </div>
          <div className="field">
            <label>Loan Term</label>
            <select value={term} onChange={e => setTerm(+e.target.value)}>
              {[24,36,48,60,72,84].map(t => <option key={t} value={t}>{t} months ({t/12} yr{t/12>1?'s':''})</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> Payment Summary</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">Monthly Payment</div>
                <div className="rb-value">{fmtUSD2(payment)}</div>
                <div className="rb-sub">for {term} months</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Loan Amount</div>
                <div className="rb-value">{fmtUSD(principal)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Total Interest</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD(totalInt)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Total Cost</div>
                <div className="rb-value">{fmtUSD(totalPaid + down + tradeIn)}</div>
                <div className="rb-sub">including down</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> Balance Over Time</div>
            <div className="chart-wrap" style={{height: 200}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:5, right:10, left:0, bottom:0}}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a5276" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1a5276" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{fontSize:11}} label={{value:'Month', position:'insideBottom', offset:-2, fontSize:11}} />
                  <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{fontSize:11}} width={50} />
                  <Tooltip formatter={(v) => fmtUSD(v)} labelFormatter={l=>`Month ${l}`} />
                  <Area type="monotone" dataKey="Balance" stroke="#1a5276" fill="url(#balGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem'}}>
          <div className="card-title" style={{marginBottom:0}}><span className="icon">📋</span> Amortization Schedule</div>
          <button className="btn btn-secondary" onClick={() => setShowTable(t => !t)}>
            {showTable ? 'Hide' : 'Show'} Table
          </button>
        </div>
        {showTable && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
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
        {!showTable && <p className="text-muted" style={{fontSize:'.85rem'}}>Toggle the table to see full month-by-month breakdown.</p>}
      </div>
    </div>
  );
}
