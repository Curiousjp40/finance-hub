import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { creditCardPayoff, fmtUSD, fmtUSD2, fmt } from '../utils/finance';

export default function CreditCard() {
  const [balance, setBalance] = useState(8500);
  const [apr,     setApr]     = useState(22.99);
  const [payment, setPayment] = useState(300);
  const [extra,   setExtra]   = useState(100);

  const base    = useMemo(() => creditCardPayoff(balance, apr, payment),             [balance, apr, payment]);
  const boosted = useMemo(() => creditCardPayoff(balance, apr, payment + extra),     [balance, apr, payment, extra]);
  const minPay  = useMemo(() => creditCardPayoff(balance, apr, Math.max(25, balance * 0.02)), [balance, apr]);
  const r = apr / 100 / 12;

  function buildTimeline(monthlyPmt) {
    if (!monthlyPmt || monthlyPmt <= balance * r) return [];
    const rows = [];
    let bal = balance;
    let month = 0;
    while (bal > 0.01 && month < 600) {
      const interest = bal * r;
      bal = Math.max(0, bal - (monthlyPmt - interest));
      month++;
      if (month % 3 === 0 || bal <= 0.01) rows.push({ month, balance: +bal.toFixed(2) });
    }
    return rows;
  }

  const baseTimeline    = useMemo(() => buildTimeline(payment),         [balance, apr, payment]);
  const boostedTimeline = useMemo(() => buildTimeline(payment + extra), [balance, apr, payment, extra]);

  const chartData = baseTimeline.map((r, i) => ({
    month: r.month,
    'Base Payment':    r.balance,
    'Extra Payment':   boostedTimeline[i]?.balance ?? 0,
  }));

  const savedMonths   = base && boosted ? base.months - boosted.months : 0;
  const savedInterest = base && boosted ? base.totalInterest - boosted.totalInterest : 0;

  return (
    <div>
      <p className="page-sub">See how long it takes to pay off credit card debt and how extra payments help.</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💳</span> Card Details</div>

          <div className="field">
            <label>Current Balance</label>
            <input type="number" value={balance} min={0} step={100} onChange={e => setBalance(+e.target.value)} />
          </div>
          <div className="field">
            <label>Annual Percentage Rate (APR) — {apr}%</label>
            <input type="range" min={0} max={36} step={0.01} value={apr} onChange={e => setApr(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>36%</span></div>
          </div>
          <div className="field">
            <label>Monthly Payment</label>
            <input type="number" value={payment} min={0} step={10} onChange={e => setPayment(+e.target.value)} />
          </div>
          <div className="field">
            <label>Extra Monthly Payment</label>
            <input type="number" value={extra} min={0} step={10} onChange={e => setExtra(+e.target.value)} />
          </div>
        </div>

        <div>
          {base ? (
            <div className="card">
              <div className="card-title"><span className="icon">📅</span> Payoff Scenarios</div>

              <div className="payoff-scenario">
                <h4>Minimum Payment (~2% of balance)</h4>
                {minPay ? (
                  <div>
                    <div className="ps-row"><span>Payoff Time</span><span style={{color:'var(--danger)'}}>{Math.floor(minPay.months/12)}y {minPay.months%12}m ({minPay.months} mo)</span></div>
                    <div className="ps-row mt-1"><span>Total Interest</span><span style={{color:'var(--danger)'}}>{fmtUSD2(minPay.totalInterest)}</span></div>
                    <div className="ps-row mt-1"><span>Total Paid</span><span>{fmtUSD2(minPay.totalPaid)}</span></div>
                  </div>
                ) : <p style={{fontSize:'.83rem', color:'var(--danger)'}}>Payment doesn't cover interest!</p>}
              </div>

              <div className="payoff-scenario">
                <h4>At {fmtUSD2(payment)}/mo</h4>
                <div className="ps-row"><span>Payoff Time</span><span>{Math.floor(base.months/12)}y {base.months%12}m ({base.months} mo)</span></div>
                <div className="ps-row mt-1"><span>Total Interest</span><span style={{color:'var(--danger)'}}>{fmtUSD2(base.totalInterest)}</span></div>
                <div className="ps-row mt-1"><span>Total Paid</span><span>{fmtUSD2(base.totalPaid)}</span></div>
              </div>

              {extra > 0 && boosted && (
                <div className="payoff-scenario best">
                  <h4>✨ With +{fmtUSD2(extra)}/mo extra = {fmtUSD2(payment+extra)}/mo</h4>
                  <div className="ps-row"><span>Payoff Time</span><span style={{color:'var(--success)'}}>{Math.floor(boosted.months/12)}y {boosted.months%12}m ({boosted.months} mo)</span></div>
                  <div className="ps-row mt-1"><span>Total Interest</span><span style={{color:'var(--success)'}}>{fmtUSD2(boosted.totalInterest)}</span></div>
                  <div className="ps-row mt-1"><span>Interest Saved</span><span style={{color:'var(--success)', fontWeight:700}}>{fmtUSD2(savedInterest)}</span></div>
                  <div className="ps-row mt-1"><span>Months Saved</span><span style={{color:'var(--success)', fontWeight:700}}>{savedMonths} months</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <p style={{color:'var(--danger)'}}>⚠ Monthly payment of {fmtUSD2(payment)} doesn't cover the interest charge of {fmtUSD2(balance * r)}/mo. Increase your payment.</p>
            </div>
          )}

          <div className="card">
            <div className="card-title"><span className="icon">💰</span> Key Stats</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">Daily Interest</div>
                <div className="rb-value">{fmtUSD2(balance * apr / 100 / 365)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Monthly Interest</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD2(balance * r)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Annual Interest</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD2(balance * apr / 100)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="card-title"><span className="icon">📉</span> Balance Over Time</div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{top:5, right:20, left:0, bottom:0}}>
                <XAxis dataKey="month" tick={{fontSize:11}} label={{value:'Month', position:'insideBottom', offset:-2, fontSize:11}} />
                <YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'} tick={{fontSize:11}} width={52} />
                <Tooltip formatter={v=>fmtUSD(v)} labelFormatter={l=>`Month ${l}`} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Line type="monotone" dataKey="Base Payment" stroke="#c0392b" strokeWidth={2} dot={false} />
                {extra > 0 && <Line type="monotone" dataKey="Extra Payment" stroke="#1e8449" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
