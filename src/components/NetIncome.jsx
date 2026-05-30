import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcFederalTax, calcFICA, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

const STATE_RATES = {
  'AL':4,'AK':0,'AZ':2.5,'AR':4.7,'CA':9.3,'CO':4.4,'CT':5,'DE':5.55,
  'FL':0,'GA':5.49,'HI':7.9,'ID':5.8,'IL':4.95,'IN':3.05,'IA':4.4,'KS':5.7,
  'KY':4,'LA':4.25,'ME':7.15,'MD':4.75,'MA':5,'MI':4.25,'MN':7.85,'MS':4.7,
  'MO':4.95,'MT':6.5,'NE':5.84,'NV':0,'NH':0,'NJ':5.525,'NM':4.9,'NY':6.85,
  'NC':4.5,'ND':2.5,'OH':3.99,'OK':4.75,'OR':8.75,'PA':3.07,'RI':4.75,
  'SC':6.5,'SD':0,'TN':0,'TX':0,'UT':4.85,'VT':6.6,'VA':5.75,'WA':0,
  'WV':5.12,'WI':5.3,'WY':0,'DC':8.5,
};

function calcEarner(gross, filing, state, k401Pct, hsa, other) {
  const preDeduct = Math.max(0, gross - (gross * k401Pct / 100) - hsa - other);
  const federal   = calcFederalTax(preDeduct, filing);
  const fica      = calcFICA(gross);
  const stateTax  = preDeduct * ((STATE_RATES[state] || 0) / 100);
  const totalTax  = federal.tax + fica.total + stateTax;
  const netAnnual = gross - totalTax - (gross * k401Pct / 100) - hsa - other;
  return { federal, fica, stateTax, totalTax, netAnnual };
}

export default function NetIncome() {
  const t = useT();

  const [gross,   setGross]   = useLocalState('ni-gross',   75000);
  const [filing,  setFiling]  = useLocalState('ni-filing',  'single');
  const [state,   setState]   = useLocalState('ni-state',   'TX');
  const [k401,    setK401]    = useLocalState('ni-k401',    6);
  const [hsa,     setHsa]     = useLocalState('ni-hsa',     0);
  const [other,   setOther]   = useLocalState('ni-other',   0);
  const [dualOn,  setDualOn]  = useLocalState('ni-dual',    false);
  const [gross2,  setGross2]  = useLocalState('ni-gross2',  65000);
  const [filing2, setFiling2] = useLocalState('ni-filing2', 'single');
  const [state2,  setState2]  = useLocalState('ni-state2',  'TX');
  const [k401b,   setK401b]   = useLocalState('ni-k401b',   6);
  const [hsa2,    setHsa2]    = useLocalState('ni-hsa2',    0);
  const [other2,  setOther2]  = useLocalState('ni-other2',  0);

  const e1 = useMemo(() => calcEarner(gross, filing, state, k401, hsa, other),
    [gross, filing, state, k401, hsa, other]);
  const e2 = useMemo(() => dualOn ? calcEarner(gross2, filing2, state2, k401b, hsa2, other2) : null,
    [dualOn, gross2, filing2, state2, k401b, hsa2, other2]);

  const netMonthly  = e1.netAnnual / 12;
  const netBiweekly = e1.netAnnual / 26;
  const effRate     = gross > 0 ? (e1.totalTax / gross) * 100 : 0;
  const combinedNet = dualOn && e2 ? e1.netAnnual + e2.netAnnual : e1.netAnnual;

  const breakdownData = [
    { name: t('tax.fedTax'),      value: +e1.federal.tax.toFixed(0),  color: '#c0392b' },
    { name: t('tax.socSec'),      value: +e1.fica.ss.toFixed(0),      color: '#e74c3c' },
    { name: t('tax.medicare'),    value: +e1.fica.medi.toFixed(0),    color: '#e67e22' },
    { name: t('tax.stateTax'),    value: +e1.stateTax.toFixed(0),     color: '#f39c12' },
    { name: '401(k)',             value: +(gross*k401/100).toFixed(0), color: '#27ae60' },
    { name: t('tax.netTakeHome'), value: +e1.netAnnual.toFixed(0),    color: '#1a5276' },
  ].filter(d => d.value > 0);

  function StateSelect({ value, onChange }) {
    return (
      <select value={value} onChange={onChange}>
        {Object.keys(STATE_RATES).sort().map(s => (
          <option key={s} value={s}>{s} ({STATE_RATES[s]}%)</option>
        ))}
      </select>
    );
  }

  function EarnerForm({ label, g, sg, f, sf, st, sst, k, sk, h, sh, o, so }) {
    return (
      <div className="card">
        <div className="card-title"><span className="icon">💼</span> {label}</div>
        <div className="field">
          <label>{t('tax.grossIncome')}</label>
          <input type="number" value={g || ''} min={0} step={1000}
            onChange={e => sg(e.target.value === '' ? 0 : +e.target.value)} />
        </div>
        <div className="two-col">
          <div className="field">
            <label>{t('tax.filingStatus')}</label>
            <select value={f} onChange={e => sf(e.target.value)}>
              <option value="single">{t('tax.single')}</option>
              <option value="married">{t('tax.married')}</option>
              <option value="hoh">{t('tax.hoh')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('tax.state')}</label>
            <StateSelect value={st} onChange={e => sst(e.target.value)} />
          </div>
        </div>
        <div className="divider" />
        <div className="card-title" style={{ fontSize:'.95rem' }}><span className="icon">📉</span> {t('tax.preTaxDed')}</div>
        <div className="field">
          <label>{t('tax.k401')} — {k}%</label>
          <input type="range" min={0} max={23} step={0.5} value={k} onChange={e => sk(+e.target.value)} />
          <div className="range-labels"><span>0%</span><span>23%</span></div>
        </div>
        <div className="two-col">
          <div className="field">
            <label>{t('tax.hsa')}</label>
            <input type="number" value={h || ''} min={0} step={100}
              onChange={e => sh(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
          <div className="field">
            <label>{t('tax.otherPreTax')}</label>
            <input type="number" value={o || ''} min={0} step={100}
              onChange={e => so(e.target.value === '' ? 0 : +e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="page-sub">{t('tax.sub')}</p>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
        <button
          className={`btn ${dualOn ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setDualOn(d => !d)}
        >
          {dualOn ? '✓ ' : '+ '}{t('tax.dualIncome')}
        </button>
      </div>

      <div className={dualOn ? 'two-col' : ''}>
        <EarnerForm
          label={dualOn ? t('tax.earner1') : t('tax.incomeAndFiling')}
          g={gross}   sg={setGross}
          f={filing}  sf={setFiling}
          st={state}  sst={setState}
          k={k401}    sk={setK401}
          h={hsa}     sh={setHsa}
          o={other}   so={setOther}
        />
        {dualOn && (
          <EarnerForm
            label={t('tax.earner2')}
            g={gross2}   sg={setGross2}
            f={filing2}  sf={setFiling2}
            st={state2}  sst={setState2}
            k={k401b}    sk={setK401b}
            h={hsa2}     sh={setHsa2}
            o={other2}   so={setOther2}
          />
        )}
      </div>

      {dualOn && e2 && (
        <div className="card" style={{ background:'linear-gradient(135deg,var(--navy),#1a5276)', color:'#fff', marginBottom:'1.5rem' }}>
          <div className="card-title" style={{ color:'rgba(255,255,255,.85)' }}><span className="icon">👨‍👩‍👧</span> {t('tax.householdTotal')}</div>
          <div className="result-grid">
            {[
              [t('tax.combinedNet') + ' /yr', fmtUSD(combinedNet)],
              [t('tax.combinedNet') + ' /mo', fmtUSD(combinedNet / 12)],
              [t('tax.earner1') + ' net',     fmtUSD(e1.netAnnual)],
              [t('tax.earner2') + ' net',     fmtUSD(e2.netAnnual)],
            ].map(([lbl, val], i) => (
              <div key={i} className="result-box highlight">
                <div className="rb-label">{lbl}</div>
                <div className="rb-value">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="card">
            <div className="card-title">
              <span className="icon">💰</span> {t('tax.takeHome')}
              {dualOn && <span style={{ fontSize:'.8rem', fontWeight:400, color:'var(--muted)', marginLeft:'.5rem' }}>({t('tax.earner1')})</span>}
            </div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('tax.annualNet')}</div>
                <div className="rb-value">{fmtUSD(e1.netAnnual)}</div>
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
            <div style={{ fontSize:'.85rem' }}>
              {[
                [t('tax.fedTax'),   fmtUSD2(e1.federal.tax),       'danger'],
                [t('tax.socSec'),   fmtUSD2(e1.fica.ss),           'danger'],
                [t('tax.medicare'), fmtUSD2(e1.fica.medi),         'danger'],
                [`${t('tax.stateTax')} (${STATE_RATES[state]}%)`, fmtUSD2(e1.stateTax), 'danger'],
                [`401(k) (${k401}%)`, `-${fmtUSD2(gross*k401/100)}`, 'success'],
              ].map(([label, val, color], i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem' }}>
                  <span>{label}</span>
                  <span style={{ color:`var(--${color})`, fontWeight:600 }}>{val}</span>
                </div>
              ))}
              <div className="divider" />
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                <span>{t('tax.netTakeHome')}</span>
                <span style={{ color:'var(--navy)' }}>{fmtUSD2(e1.netAnnual)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">📊</span> {t('tax.incomeBreakdown')}</div>
            <div style={{ height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{ left:10, right:20, top:5, bottom:5 }}>
                  <XAxis type="number" tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={80} />
                  <Tooltip formatter={v => fmtUSD(v)} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {breakdownData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">🏦</span> {t('tax.brackets')}{dualOn ? ` — ${t('tax.earner1')}` : ''}</div>
            <p style={{ fontSize:'.83rem', color:'var(--muted)', marginBottom:'1rem' }}>
              {t('tax.taxableIncome')
                .replace('{taxable}', fmtUSD2(e1.federal.taxable))
                .replace('{deduction}', fmtUSD2(e1.federal.deduction))}
            </p>
            {e1.federal.breakdown.map((b, i) => (
              <div key={i} className="tax-bracket">
                <span className="bracket-rate">{b.rate}%</span>
                <span>{fmtUSD2(b.taxed)} {t('tax.taxed')}</span>
                <span style={{ color:'var(--danger)', fontWeight:600 }}>{fmtUSD2(b.amount)}</span>
              </div>
            ))}
          </div>

          {dualOn && e2 && (
            <div className="card">
              <div className="card-title"><span className="icon">🏦</span> {t('tax.brackets')} — {t('tax.earner2')}</div>
              <p style={{ fontSize:'.83rem', color:'var(--muted)', marginBottom:'1rem' }}>
                {t('tax.taxableIncome')
                  .replace('{taxable}', fmtUSD2(e2.federal.taxable))
                  .replace('{deduction}', fmtUSD2(e2.federal.deduction))}
              </p>
              {e2.federal.breakdown.map((b, i) => (
                <div key={i} className="tax-bracket">
                  <span className="bracket-rate">{b.rate}%</span>
                  <span>{fmtUSD2(b.taxed)} {t('tax.taxed')}</span>
                  <span style={{ color:'var(--danger)', fontWeight:600 }}>{fmtUSD2(b.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
