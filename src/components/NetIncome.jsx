import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcFederalTax, calcFICA, fmtUSD, fmtUSD2, fmt } from '../utils/finance';

const STATE_RATES = {
  'AL':4,'AK':0,'AZ':2.5,'AR':4.7,'CA':9.3,'CO':4.4,'CT':5,'DE':5.55,
  'FL':0,'GA':5.49,'HI':7.9,'ID':5.8,'IL':4.95,'IN':3.05,'IA':4.4,'KS':5.7,
  'KY':4,'LA':4.25,'ME':7.15,'MD':4.75,'MA':5,'MI':4.25,'MN':7.85,'MS':4.7,
  'MO':4.95,'MT':6.5,'NE':5.84,'NV':0,'NH':0,'NJ':5.525,'NM':4.9,'NY':6.85,
  'NC':4.5,'ND':2.5,'OH':3.99,'OK':4.75,'OR':8.75,'PA':3.07,'RI':4.75,
  'SC':6.5,'SD':0,'TN':0,'TX':0,'UT':4.85,'VT':6.6,'VA':5.75,'WA':0,
  'WV':5.12,'WI':5.3,'WY':0,'DC':8.5,
};

export default function NetIncome() {
  const [gross,   setGross]   = useState(75000);
  const [filing,  setFiling]  = useState('single');
  const [state,   setState]   = useState('TX');
  const [k401,    setK401]    = useState(6);
  const [hsa,     setHsa]     = useState(0);
  const [other,   setOther]   = useState(0);

  const preDeduct = Math.max(0, gross - (gross * k401 / 100) - hsa - other);
  const federal   = useMemo(() => calcFederalTax(preDeduct, filing), [preDeduct, filing]);
  const fica      = useMemo(() => calcFICA(gross), [gross]);
  const stateTax  = preDeduct * ((STATE_RATES[state] || 0) / 100);
  const totalTax  = federal.tax + fica.total + stateTax;
  const netAnnual = gross - totalTax - (gross * k401 / 100) - hsa - other;
  const netMonthly = netAnnual / 12;
  const netBiweekly = netAnnual / 26;
  const effRate   = gross > 0 ? (totalTax / gross) * 100 : 0;

  const breakdownData = [
    { name: 'Fed Tax',   value: +federal.tax.toFixed(0),   color: '#c0392b' },
    { name: 'FICA',      value: +fica.total.toFixed(0),     color: '#e74c3c' },
    { name: 'State',     value: +stateTax.toFixed(0),       color: '#e67e22' },
    { name: '401(k)',    value: +(gross*k401/100).toFixed(0), color: '#27ae60' },
    { name: 'Take-Home', value: +netAnnual.toFixed(0),      color: '#1a5276' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <p className="page-sub">Estimate your take-home pay after federal, state, and FICA taxes for 2024.</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💼</span> Income & Filing</div>

          <div className="field">
            <label>Gross Annual Income</label>
            <input type="number" value={gross} min={0} step={1000} onChange={e => setGross(+e.target.value)} />
          </div>
          <div className="two-col">
            <div className="field">
              <label>Filing Status</label>
              <select value={filing} onChange={e => setFiling(e.target.value)}>
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
                <option value="hoh">Head of Household</option>
              </select>
            </div>
            <div className="field">
              <label>State</label>
              <select value={state} onChange={e => setState(e.target.value)}>
                {Object.keys(STATE_RATES).sort().map(s => (
                  <option key={s} value={s}>{s} ({STATE_RATES[s]}%)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider" />
          <div className="card-title" style={{fontSize:'.95rem'}}><span className="icon">📉</span> Pre-Tax Deductions</div>

          <div className="field">
            <label>401(k) Contribution — {k401}%</label>
            <input type="range" min={0} max={23} step={0.5} value={k401} onChange={e => setK401(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>23% (IRS limit guidance)</span></div>
          </div>
          <div className="two-col">
            <div className="field">
              <label>HSA Contribution</label>
              <input type="number" value={hsa} min={0} step={100} onChange={e => setHsa(+e.target.value)} />
            </div>
            <div className="field">
              <label>Other Pre-Tax</label>
              <input type="number" value={other} min={0} step={100} onChange={e => setOther(+e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> Take-Home Pay</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">Annual Net</div>
                <div className="rb-value">{fmtUSD(netAnnual)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Monthly</div>
                <div className="rb-value">{fmtUSD(netMonthly)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Bi-Weekly</div>
                <div className="rb-value">{fmtUSD(netBiweekly)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Effective Tax Rate</div>
                <div className="rb-value">{effRate.toFixed(1)}%</div>
                <div className="rb-sub">of gross income</div>
              </div>
            </div>

            <div className="divider" />
            <div style={{fontSize:'.85rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}><span>Federal Tax</span><span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(federal.tax)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}><span>Social Security ({fmtUSD2(fica.ss)})</span><span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(fica.ss)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}><span>Medicare ({fmtUSD2(fica.medi)})</span><span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(fica.medi)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}><span>State Tax ({STATE_RATES[state]}%)</span><span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(stateTax)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}><span>401(k) ({k401}%)</span><span style={{color:'var(--success)', fontWeight:600}}>-{fmtUSD2(gross*k401/100)}</span></div>
              <div className="divider" />
              <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}><span>Net Take-Home</span><span style={{color:'var(--navy)'}}>{fmtUSD2(netAnnual)}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> Income Breakdown</div>
            <div style={{height:180}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{left:10, right:20, top:5, bottom:5}}>
                  <XAxis type="number" tickFormatter={v=>'$'+Math.round(v/1000)+'k'} tick={{fontSize:10}} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={70} />
                  <Tooltip formatter={v=>fmtUSD(v)} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {breakdownData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="icon">🏦</span> Federal Tax Brackets (2024)</div>
        <p style={{fontSize:'.83rem', color:'var(--muted)', marginBottom:'1rem'}}>
          Taxable income: {fmtUSD2(federal.taxable)} (after {fmtUSD2(federal.deduction)} standard deduction)
        </p>
        {federal.breakdown.map((b, i) => (
          <div key={i} className="tax-bracket">
            <span className="bracket-rate">{b.rate}%</span>
            <span>{fmtUSD2(b.taxed)} taxed</span>
            <span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(b.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
