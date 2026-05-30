import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { monthlyPayment, amortizeSchedule, fmtUSD, fmtUSD2 } from '../utils/finance';

export default function HomeLoan() {
  const [price,       setPrice]      = useState(400000);
  const [down,        setDown]       = useState(80000);
  const [rate,        setRate]       = useState(6.8);
  const [term,        setTerm]       = useState(360);
  const [tax,         setTax]        = useState(350);
  const [insurance,   setInsurance]  = useState(150);
  const [pmi,         setPmi]        = useState(0);
  const [showTable,   setShowTable]  = useState(false);

  const principal   = Math.max(0, price - down);
  const ltv         = price > 0 ? (principal / price) * 100 : 0;
  const payment     = useMemo(() => monthlyPayment(principal, rate, term), [principal, rate, term]);
  const schedule    = useMemo(() => amortizeSchedule(principal, rate, term), [principal, rate, term]);
  const totalPITI   = payment + tax + insurance + pmi;
  const totalPaid   = payment * term;
  const totalInt    = totalPaid - principal;

  const yearlyData = [];
  for (let y = 1; y <= term / 12; y += (term <= 180 ? 1 : 5)) {
    const row = schedule[Math.min(y * 12, schedule.length) - 1];
    yearlyData.push({
      year: `Yr ${y}`,
      Balance:   +row.balance.toFixed(0),
      Equity:    +(principal - row.balance + down).toFixed(0),
    });
  }

  const downPct = price > 0 ? ((down / price) * 100).toFixed(1) : 0;

  return (
    <div>
      <p className="page-sub">Model your mortgage payment including taxes, insurance, and PMI.</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">🏠</span> Mortgage Details</div>

          <div className="field">
            <label>Home Price</label>
            <input type="number" value={price} min={0} step={1000} onChange={e => setPrice(+e.target.value)} />
          </div>
          <div className="field">
            <label>Down Payment — {downPct}% ({fmtUSD(down)})</label>
            <input type="range" min={0} max={price} step={1000} value={down} onChange={e => setDown(+e.target.value)} />
            <div className="range-labels"><span>$0</span><span>{fmtUSD(price)}</span></div>
          </div>
          <div className="field">
            <label>Interest Rate — {rate}%</label>
            <input type="range" min={1} max={15} step={0.05} value={rate} onChange={e => setRate(+e.target.value)} />
            <div className="range-labels"><span>1%</span><span>15%</span></div>
          </div>
          <div className="field">
            <label>Loan Term</label>
            <select value={term} onChange={e => setTerm(+e.target.value)}>
              <option value={360}>30 Years</option>
              <option value={240}>20 Years</option>
              <option value={180}>15 Years</option>
              <option value={120}>10 Years</option>
            </select>
          </div>
          <div className="divider" />
          <div className="three-col">
            <div className="field">
              <label>Property Tax /mo</label>
              <input type="number" value={tax} min={0} onChange={e => setTax(+e.target.value)} />
            </div>
            <div className="field">
              <label>Insurance /mo</label>
              <input type="number" value={insurance} min={0} onChange={e => setInsurance(+e.target.value)} />
            </div>
            <div className="field">
              <label>PMI /mo {ltv > 80 && <span style={{color:'var(--danger)',fontWeight:700}}>⚠</span>}</label>
              <input type="number" value={pmi} min={0} onChange={e => setPmi(+e.target.value)} />
            </div>
          </div>
          {ltv > 80 && (
            <p style={{fontSize:'.82rem', color:'var(--danger)', marginTop:'-.5rem'}}>
              LTV is {ltv.toFixed(1)}% — lenders typically require PMI above 80% LTV.
            </p>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> Monthly Payment Breakdown</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">Total PITI /mo</div>
                <div className="rb-value">{fmtUSD2(totalPITI)}</div>
                <div className="rb-sub">principal + interest + escrow</div>
              </div>
              <div className="result-box">
                <div className="rb-label">P&amp;I Only</div>
                <div className="rb-value">{fmtUSD2(payment)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Loan Amount</div>
                <div className="rb-value">{fmtUSD(principal)}</div>
                <div className="rb-sub">LTV {ltv.toFixed(1)}%</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Total Interest</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD(totalInt)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📈</span> Equity Growth</div>
            <div className="chart-wrap" style={{height: 200}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{top:5, right:10, left:0, bottom:0}}>
                  <XAxis dataKey="year" tick={{fontSize:10}} />
                  <YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'} tick={{fontSize:10}} width={52} />
                  <Tooltip formatter={v=>fmtUSD(v)} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Equity"  fill="#1e8449" radius={[4,4,0,0]} />
                  <Bar dataKey="Balance" fill="#1a5276" radius={[4,4,0,0]} />
                </BarChart>
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
