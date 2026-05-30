import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcFederalTax, calcFICA, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';

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
  const t = useT();
  const [gross,  setGross]  = useState(75000);
  const [filing, setFiling] = useState('single');
  const [state,  setState]  = useState('TX');
  const [k401,   setK401]   = useState(6);
  const [hsa,    setHsa]    = useState(0);
  const [other,  setOther]  = useState(0);

  const preDeduct  = Math.max(0, gross - (gross * k401 / 100) - hsa - other);
  const federal    = useMemo(() => calcFederalTax(preDeduct, filing), [preDeduct, filing]);
  const fica       = useMemo(() => calcFICA(gross), [gross]);
  const stateTax   = preDeduct * ((STATE_RATES[state] || 0) / 100);
  const totalTax   = federal.tax + fica.total + stateTax;
  const netAnnual  = gross - totalTax - (gross * k401 / 100) - hsa - other;
  const netMonthly = netAnnual / 12;
  const netBiweekly= netAnnual / 26;
  const effRate    = gross > 0 ? (totalTax / gross) * 100 : 0;

  const breakdownData = [
    { name: t('tax.fedTax'),      value: +federal.tax.toFixed(0),       color: '#c0392b' },
    { name: t('tax.socSec'),      value: +fica.ss.toFixed(0),           color: '#e74c3c' },
    { name: t('tax.medicare'),    value: +fica.medi.toFixed(0),         color: '#e67e22' },
    { name: t('tax.stateTax'),    value: +stateTax.toFixed(0),          color: '#f39c12' },
    { name: '401(k)',             value: +(gross*k401/100).toFixed(0),  color: '#27ae60' },
    { name: t('tax.netTakeHome'), value: +netAnnual.toFixed(0),         color: '#1a5276' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <p className="page-sub">{t('tax.sub')}</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💼</span> {t('tax.incomeAndFiling')}</div>

          <div className="field">
            <label>{t('tax.grossIncome')}</label>
            <input type="number" value={gross} min={0} step={1000} onChange={e => setGross(+e.target.value)} />
          </div>
          <div className="two-col">
            <div className="field">
              <label>{t('tax.filingStatus')}</label>
              <select value={filing} onChange={e => setFiling(e.target.value)}>
                <option value="single">{t('tax.single')}</option>
                <option value="married">{t('tax.married')}</option>
                <option value="hoh">{t('tax.hoh')}</option>
              </select>
            </div>
            <div className="field">
              <label>{t('tax.state')}</label>
              <select value={state} onChange={e => setState(e.target.value)}>
                {Object.keys(STATE_RATES).sort().map(s => (
                  <option key={s} value={s}>{s} ({STATE_RATES[s]}%)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider" />
          <div className="card-title" style={{fontSize:'.95rem'}}><span className="icon">📉</span> {t('tax.preTaxDed')}</div>

          <div className="field">
            <label>{t('tax.k401')} — {k401}%</label>
            <input type="range" min={0} max={23} step={0.5} value={k401} onChange={e => setK401(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>23%</span></div>
          </div>
          <div className="two-col">
            <div className="field">
              <label>{t('tax.hsa')}</label>
              <input type="number" value={hsa} min={0} step={100} onChange={e => setHsa(+e.target.value)} />
            </div>
            <div className="field">
              <label>{t('tax.otherPreTax')}</label>
              <input type="number" value={other} min={0} step={100} onChange={e => setOther(+e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">💰</span> {t('tax.takeHome')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('tax.annualNet')}</div>
                <div className="rb-value">{fmtUSD(netAnnual)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('tax.monthly')}</div>
                <div className="rb-value">{fmtUSD(netMonthly)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('tax.biWeekly')}</div>
                <div className="rb-value">{fmtUSD(netBiweekly)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('tax.effectiveTax')}</div>
                <div className="rb-value">{effRate.toFixed(1)}%</div>
                <div className="rb-sub">{t('tax.ofGross')}</div>
              </div>
            </div>

            <div className="divider" />
            <div style={{fontSize:'.85rem'}}>
              {[
                [t('tax.fedTax'),   fmtUSD2(federal.tax),         'danger'],
                [t('tax.socSec'),   fmtUSD2(fica.ss),             'danger'],
                [t('tax.medicare'), fmtUSD2(fica.medi),           'danger'],
                [`${t('tax.stateTax')} (${STATE_RATES[state]}%)`, fmtUSD2(stateTax), 'danger'],
                [`401(k) (${k401}%)`, `-${fmtUSD2(gross*k401/100)}`, 'success'],
              ].map(([label, val, color], i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'.3rem'}}>
                  <span>{label}</span>
                  <span style={{color:`var(--${color})`, fontWeight:600}}>{val}</span>
                </div>
              ))}
              <div className="divider" />
              <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}>
                <span>{t('tax.netTakeHome')}</span>
                <span style={{color:'var(--navy)'}}>{fmtUSD2(netAnnual)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('tax.incomeBreakdown')}</div>
            <div style={{height:180}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{left:10, right:20, top:5, bottom:5}}>
                  <XAxis type="number" tickFormatter={v=>'$'+Math.round(v/1000)+'k'} tick={{fontSize:10}} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={80} />
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
        <div className="card-title"><span className="icon">🏦</span> {t('tax.brackets')}</div>
        <p style={{fontSize:'.83rem', color:'var(--muted)', marginBottom:'1rem'}}>
          {t('tax.taxableIncome')
            .replace('{taxable}', fmtUSD2(federal.taxable))
            .replace('{deduction}', fmtUSD2(federal.deduction))}
        </p>
        {federal.breakdown.map((b, i) => (
          <div key={i} className="tax-bracket">
            <span className="bracket-rate">{b.rate}%</span>
            <span>{fmtUSD2(b.taxed)} {t('tax.taxed')}</span>
            <span style={{color:'var(--danger)', fontWeight:600}}>{fmtUSD2(b.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
