import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcFederalTax, calcFICA, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';
import {
  ENLISTED, WARRANT, OFFICER, BAH_TIERS,
  getBasePay, getBah, getBas,
} from '../utils/militaryPay';

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

function calcMilitary({ grade, yos, bahTier, withDep, filing, state, tspPct, serviceType, drillPeriods, trainingDays }) {
  const basePay = getBasePay(grade, yos);          // monthly
  const bah     = getBah(grade, bahTier, withDep); // monthly, tax-free
  const bas     = getBas(grade);                   // monthly, tax-free

  if (serviceType === 'reserve') {
    // Reserve: only paid for drill days + AT, no BAH/BAS entitlement shown for off-duty
    const drillPayPerPeriod = basePay / 30;
    const monthlyDrill      = drillPayPerPeriod * drillPeriods;
    const annualDrill       = monthlyDrill * 12;
    const atPay             = basePay / 30 * trainingDays;
    const annualGross       = annualDrill + atPay;
    // Taxes on drill pay (base pay equivalent)
    const federal  = calcFederalTax(annualGross * (1 - tspPct / 100), filing);
    const fica     = calcFICA(annualGross);
    const stateTax = annualGross * (1 - tspPct / 100) * ((STATE_RATES[state] || 0) / 100);
    const totalTax = federal.tax + fica.total + stateTax;
    const tspDeduct = annualGross * tspPct / 100;
    const netAnnual = annualGross - totalTax - tspDeduct;
    return {
      basePay, bah: 0, bas: 0, monthlyDrill, annualDrill, atPay,
      grossAnnual: annualGross, grossMonthly: annualGross / 12,
      federal, fica, stateTax, totalTax, tspDeduct,
      netAnnual, netMonthly: netAnnual / 12,
      taxableAnnual: annualGross,
      isReserve: true,
    };
  }

  // Active duty
  const basePayAnnual = basePay * 12;
  const taxableAnnual = basePayAnnual * (1 - tspPct / 100);
  const federal  = calcFederalTax(taxableAnnual, filing);
  const fica     = calcFICA(basePayAnnual);
  const stateTax = taxableAnnual * ((STATE_RATES[state] || 0) / 100);
  const totalTax = federal.tax + fica.total + stateTax;
  const tspDeduct = basePayAnnual * tspPct / 100;
  // Net = base pay after taxes/TSP + BAH + BAS (tax-free)
  const netAnnual = basePayAnnual - totalTax - tspDeduct + (bah + bas) * 12;
  const grossMonthly = basePay + bah + bas;
  return {
    basePay, bah, bas, monthlyDrill: null, annualDrill: null, atPay: null,
    grossAnnual: grossMonthly * 12, grossMonthly,
    federal, fica, stateTax, totalTax, tspDeduct,
    netAnnual, netMonthly: netAnnual / 12,
    taxableAnnual: basePayAnnual,
    isReserve: false,
  };
}

export default function NetIncome() {
  const t = useT();

  // Mode
  const [milMode, setMilMode] = useLocalState('ni-milmode', false);

  // ── Civilian state ───────────────────────────────────────────
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

  // ── Military state ───────────────────────────────────────────
  const [milGrade,    setMilGrade]    = useLocalState('ni-mil-grade',    'E-5');
  const [milYos,      setMilYos]      = useLocalState('ni-mil-yos',      4);
  const [milFiling,   setMilFiling]   = useLocalState('ni-mil-filing',   'single');
  const [milState,    setMilState]    = useLocalState('ni-mil-state',    'TX');
  const [milBahTier,  setMilBahTier]  = useLocalState('ni-mil-bahtier',  'mid');
  const [milWithDep,  setMilWithDep]  = useLocalState('ni-mil-withdep',  true);
  const [milService,  setMilService]  = useLocalState('ni-mil-service',  'active');
  const [milTspPct,   setMilTspPct]   = useLocalState('ni-mil-tsp',      5);
  const [milDrillPer, setMilDrillPer] = useLocalState('ni-mil-drillper', 4);
  const [milATDays,   setMilATDays]   = useLocalState('ni-mil-atdays',   15);

  // ── Civilian calculations ────────────────────────────────────
  const e1 = useMemo(() => calcEarner(gross, filing, state, k401, hsa, other),
    [gross, filing, state, k401, hsa, other]);
  const e2 = useMemo(() => dualOn ? calcEarner(gross2, filing2, state2, k401b, hsa2, other2) : null,
    [dualOn, gross2, filing2, state2, k401b, hsa2, other2]);

  // ── Military calculations ────────────────────────────────────
  const mil = useMemo(() => calcMilitary({
    grade: milGrade, yos: milYos, bahTier: milBahTier, withDep: milWithDep,
    filing: milFiling, state: milState, tspPct: milTspPct,
    serviceType: milService, drillPeriods: milDrillPer, trainingDays: milATDays,
  }), [milGrade, milYos, milBahTier, milWithDep, milFiling, milState, milTspPct, milService, milDrillPer, milATDays]);

  // ── Civilian derived ─────────────────────────────────────────
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

  // ── Military breakdown chart ─────────────────────────────────
  const milBreakdownData = [
    { name: t('tax.fedTax'),   value: +mil.federal.tax.toFixed(0), color: '#c0392b' },
    { name: t('tax.socSec'),   value: +mil.fica.ss.toFixed(0),     color: '#e74c3c' },
    { name: t('tax.medicare'), value: +mil.fica.medi.toFixed(0),   color: '#e67e22' },
    { name: `${t('tax.stateTax')} (${STATE_RATES[milState]}%)`, value: +mil.stateTax.toFixed(0), color: '#f39c12' },
    { name: 'TSP',             value: +mil.tspDeduct.toFixed(0),   color: '#27ae60' },
    { name: t('tax.netTakeHome'), value: +mil.netAnnual.toFixed(0), color: '#1a5276' },
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

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      <p className="page-sub">{t('tax.sub')}</p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${!milMode ? 'btn-primary' : ''}`}
          onClick={() => setMilMode(false)}
          style={{ fontWeight: !milMode ? 700 : 400 }}
        >
          💼 {t('tax.civilianMode')}
        </button>
        <button
          className={`btn ${milMode ? 'btn-primary' : ''}`}
          onClick={() => setMilMode(true)}
          style={{ fontWeight: milMode ? 700 : 400 }}
        >
          🎖 {t('tax.militaryMode')}
        </button>
      </div>

      {/* ══════════════ CIVILIAN MODE ══════════════ */}
      {!milMode && (
        <>
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
        </>
      )}

      {/* ══════════════ MILITARY MODE ══════════════ */}
      {milMode && (
        <div className="two-col">
          {/* Left: Inputs */}
          <div>
            <div className="card">
              <div className="card-title"><span className="icon">🎖</span> {t('tax.milInputs')}</div>

              {/* Service type */}
              <div className="field">
                <label>{t('tax.serviceType')}</label>
                <div style={{ display:'flex', gap:'0.75rem', marginTop:4 }}>
                  {['active','reserve'].map(sv => (
                    <label key={sv} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontWeight: milService === sv ? 700 : 400 }}>
                      <input type="radio" name="milService" checked={milService === sv} onChange={() => setMilService(sv)} />
                      {sv === 'active' ? t('tax.activeDuty') : t('tax.guardReserve')}
                    </label>
                  ))}
                </div>
              </div>

              <div className="two-col">
                {/* Rank */}
                <div className="field">
                  <label>{t('military.rank')}</label>
                  <select value={milGrade} onChange={e => setMilGrade(e.target.value)}>
                    <optgroup label="Enlisted">{ENLISTED.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                    <optgroup label="Warrant">{WARRANT.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                    <optgroup label="Officer">{OFFICER.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                  </select>
                </div>

                {/* YOS */}
                <div className="field">
                  <label>{t('military.yos')}</label>
                  <input type="number" min={0} max={40} value={milYos}
                    onChange={e => setMilYos(parseInt(e.target.value) || 0)} />
                </div>

                {/* Filing */}
                <div className="field">
                  <label>{t('tax.filingStatus')}</label>
                  <select value={milFiling} onChange={e => setMilFiling(e.target.value)}>
                    <option value="single">{t('tax.single')}</option>
                    <option value="married">{t('tax.married')}</option>
                    <option value="hoh">{t('tax.hoh')}</option>
                  </select>
                </div>

                {/* State */}
                <div className="field">
                  <label>{t('tax.state')}</label>
                  <StateSelect value={milState} onChange={e => setMilState(e.target.value)} />
                </div>

                {/* BAH Tier */}
                <div className="field">
                  <label>{t('tax.milBahArea')}</label>
                  <select value={milBahTier} onChange={e => setMilBahTier(e.target.value)}>
                    {Object.entries(BAH_TIERS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dependents */}
                <div className="field">
                  <label>{t('military.dependents')}</label>
                  <div style={{ display:'flex', gap:'0.75rem', marginTop:4 }}>
                    {[true, false].map(v => (
                      <label key={String(v)} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontWeight: milWithDep === v ? 700 : 400 }}>
                        <input type="radio" name="milWithDep" checked={milWithDep === v} onChange={() => setMilWithDep(v)} />
                        {v ? t('military.withDep') : t('military.withoutDep')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div className="card-title" style={{ fontSize:'.95rem' }}><span className="icon">📉</span> {t('tax.milPreTax')}</div>
              <div className="field">
                <label>TSP — {milTspPct}%</label>
                <input type="range" min={0} max={23} step={0.5} value={milTspPct} onChange={e => setMilTspPct(+e.target.value)} />
                <div className="range-labels"><span>0%</span><span>23%</span></div>
              </div>

              {milService === 'reserve' && (
                <>
                  <div className="divider" />
                  <div className="card-title" style={{ fontSize:'.95rem' }}><span className="icon">🗓</span> {t('tax.drillSchedule')}</div>
                  <div className="two-col">
                    <div className="field">
                      <label>{t('military.drillDays')}</label>
                      <input type="number" min={1} max={20} value={milDrillPer}
                        onChange={e => setMilDrillPer(parseInt(e.target.value) || 4)} />
                      <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:3 }}>{t('military.drillDaysHint')}</div>
                    </div>
                    <div className="field">
                      <label>{t('tax.annualTrainingDays')}</label>
                      <input type="number" min={0} max={365} value={milATDays}
                        onChange={e => setMilATDays(parseInt(e.target.value) || 15)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {/* Gross pay breakdown */}
            <div className="card" style={{ marginBottom:'1rem' }}>
              <div className="card-title"><span className="icon">💰</span> {t('tax.milGrossPay')}</div>

              {milService === 'active' ? (
                <>
                  {[
                    { label: t('military.basePay'), value: mil.basePay,  sub: t('tax.taxableLabel'),  color:'#1a5276' },
                    { label: t('military.bah'),     value: mil.bah,      sub: t('tax.taxFreeLabel'),  color:'#16a085' },
                    { label: t('military.bas'),     value: mil.bas,      sub: t('tax.taxFreeLabel'),  color:'#8e44ad' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem', paddingBottom:'0.6rem', borderBottom:'1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{label}</div>
                        <div style={{ fontSize:'0.72rem', padding:'0.1rem 0.4rem', borderRadius:6, background: sub === t('tax.taxFreeLabel') ? '#d5f5e3' : '#fde8e8', color: sub === t('tax.taxFreeLabel') ? '#1e8449' : '#c0392b', display:'inline-block', marginTop:2 }}>
                          {sub}
                        </div>
                      </div>
                      <div style={{ fontWeight:700, color, fontSize:'1.05rem' }}>{fmtUSD(value)}/mo</div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, paddingTop:'0.4rem' }}>
                    <span>{t('tax.milTotalGross')}</span>
                    <span style={{ color:'var(--navy)', fontSize:'1.1rem' }}>{fmtUSD(mil.grossMonthly)}/mo</span>
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:4 }}>{t('tax.milTaxNote')}</div>
                </>
              ) : (
                <>
                  {[
                    { label: t('military.drillPayMonth'),  value: mil.monthlyDrill,  sub: `${milDrillPer} periods/mo` },
                    { label: t('military.annualDrillPay'), value: mil.annualDrill,   sub: 'per year' },
                    { label: t('military.annualTraining'), value: mil.atPay,         sub: `${milATDays} days AT` },
                  ].map(({ label, value, sub }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem', paddingBottom:'0.6rem', borderBottom:'1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{label}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{sub}</div>
                      </div>
                      <div style={{ fontWeight:700, color:'#1a5276', fontSize:'1.05rem' }}>{fmtUSD(value)}</div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, paddingTop:'0.4rem' }}>
                    <span>{t('tax.milAnnualGross')}</span>
                    <span style={{ color:'var(--navy)', fontSize:'1.1rem' }}>{fmtUSD(mil.grossAnnual)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Net take-home */}
            <div className="card" style={{ marginBottom:'1rem' }}>
              <div className="card-title"><span className="icon">🏦</span> {t('tax.takeHome')} — {milService === 'active' ? t('tax.activeDuty') : t('tax.guardReserve')}</div>
              <div className="result-grid">
                <div className="result-box highlight">
                  <div className="rb-label">{milService === 'active' ? t('tax.monthly') : t('tax.annualNet')}</div>
                  <div className="rb-value">{fmtUSD(milService === 'active' ? mil.netMonthly : mil.netAnnual)}</div>
                </div>
                {milService === 'active' && (
                  <div className="result-box">
                    <div className="rb-label">{t('tax.annualNet')}</div>
                    <div className="rb-value">{fmtUSD(mil.netAnnual)}</div>
                  </div>
                )}
                <div className="result-box">
                  <div className="rb-label">{t('tax.effectiveTax')}</div>
                  <div className="rb-value">{mil.taxableAnnual > 0 ? ((mil.totalTax / mil.taxableAnnual) * 100).toFixed(1) : '0.0'}%</div>
                  <div className="rb-sub">{t('tax.ofBasePay')}</div>
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontSize:'.85rem' }}>
                {[
                  [t('tax.fedTax'),   fmtUSD2(mil.federal.tax),  'danger'],
                  [t('tax.socSec'),   fmtUSD2(mil.fica.ss),      'danger'],
                  [t('tax.medicare'), fmtUSD2(mil.fica.medi),    'danger'],
                  [`${t('tax.stateTax')} (${STATE_RATES[milState]}%)`, fmtUSD2(mil.stateTax), 'danger'],
                  [`TSP (${milTspPct}%)`, `-${fmtUSD2(mil.tspDeduct)}`, 'success'],
                ].map(([label, val, color], i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem' }}>
                    <span>{label}</span>
                    <span style={{ color:`var(--${color})`, fontWeight:600 }}>{val}</span>
                  </div>
                ))}
                {milService === 'active' && (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem', color:'var(--success)' }}>
                      <span>+ {t('military.bah')} ({t('tax.taxFreeLabel')})</span>
                      <span style={{ fontWeight:600 }}>+{fmtUSD2(mil.bah * 12)}/yr</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem', color:'var(--success)' }}>
                      <span>+ {t('military.bas')} ({t('tax.taxFreeLabel')})</span>
                      <span style={{ fontWeight:600 }}>+{fmtUSD2(mil.bas * 12)}/yr</span>
                    </div>
                  </>
                )}
                <div className="divider" />
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                  <span>{t('tax.netTakeHome')}</span>
                  <span style={{ color:'var(--navy)' }}>{fmtUSD2(milService === 'active' ? mil.netMonthly : mil.netAnnual)}{milService === 'active' ? '/mo' : '/yr'}</span>
                </div>
              </div>
            </div>

            {/* Tax bracket breakdown */}
            <div className="card" style={{ marginBottom:'1rem' }}>
              <div className="card-title"><span className="icon">📊</span> {t('tax.incomeBreakdown')}</div>
              <p style={{ fontSize:'.8rem', color:'var(--muted)', marginBottom:'0.75rem' }}>{t('tax.milOnBasePay')}</p>
              <div style={{ height:160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={milBreakdownData} layout="vertical" margin={{ left:10, right:20, top:5, bottom:5 }}>
                    <XAxis type="number" tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize:10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={80} />
                    <Tooltip formatter={v => fmtUSD(v)} />
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {milBreakdownData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title"><span className="icon">🏦</span> {t('tax.brackets')}</div>
              <p style={{ fontSize:'.83rem', color:'var(--muted)', marginBottom:'1rem' }}>
                {t('tax.taxableIncome')
                  .replace('{taxable}', fmtUSD2(mil.federal.taxable))
                  .replace('{deduction}', fmtUSD2(mil.federal.deduction))}
              </p>
              {mil.federal.breakdown.map((b, i) => (
                <div key={i} className="tax-bracket">
                  <span className="bracket-rate">{b.rate}%</span>
                  <span>{fmtUSD2(b.taxed)} {t('tax.taxed')}</span>
                  <span style={{ color:'var(--danger)', fontWeight:600 }}>{fmtUSD2(b.amount)}</span>
                </div>
              ))}
              <p style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:'0.75rem' }}>{t('military.disclaimer')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
