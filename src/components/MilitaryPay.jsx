import { useState, useMemo } from 'react';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';
import {
  YOS_LABELS, BASE_PAY, ENLISTED, WARRANT, OFFICER,
  BAH_TIERS, getBasePay, getBah, getBas, yosToIndex,
} from '../utils/militaryPay';

export default function MilitaryPay() {
  const t = useT();
  const [mode, setMode] = useState('active');
  const [grade, setGrade] = useState('E-5');
  const [yos, setYos] = useState(4);
  const [bahTier, setBahTier] = useState('mid');
  const [withDep, setWithDep] = useState(true);
  const [drillDays, setDrillDays] = useState(4);

  const basePay = useMemo(() => getBasePay(grade, yos), [grade, yos]);
  const bah     = useMemo(() => getBah(grade, bahTier, withDep), [grade, bahTier, withDep]);
  const bas     = getBas(grade);

  const totalActive    = basePay + bah + bas;
  const drillPay       = (basePay / 30) * drillDays;
  const annualDrillPay = drillPay * 12;
  const annualTrainingPay = basePay * 15 / 30 * 12;

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('military.sub')}</p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['active', 'reserve'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`btn ${mode === m ? 'btn-primary' : ''}`}
            style={{ fontWeight: mode === m ? 700 : 400 }}
          >
            {t(`military.${m}Tab`)}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('military.yourInfo')}</div>
        <div className="two-col">
          <div className="field">
            <label>{t('military.rank')}</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              <optgroup label="Enlisted">{ENLISTED.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
              <optgroup label="Warrant Officer">{WARRANT.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
              <optgroup label="Officer">{OFFICER.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
            </select>
          </div>
          <div className="field">
            <label>{t('military.yos')}</label>
            <input type="number" min="0" max="40" value={yos} onChange={e => setYos(parseInt(e.target.value) || 0)} />
          </div>
          <div className="field">
            <label>{t('military.location')}</label>
            <select value={bahTier} onChange={e => setBahTier(e.target.value)}>
              {Object.entries(BAH_TIERS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('military.dependents')}</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: 6 }}>
              {[true, false].map(v => (
                <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: withDep === v ? 700 : 400 }}>
                  <input type="radio" name="withDep" checked={withDep === v} onChange={() => setWithDep(v)} />
                  {v ? t('military.withDep') : t('military.withoutDep')}
                </label>
              ))}
            </div>
          </div>
          {mode === 'reserve' && (
            <div className="field">
              <label>{t('military.drillDays')}</label>
              <input type="number" min="1" max="30" value={drillDays} onChange={e => setDrillDays(parseInt(e.target.value) || 4)} />
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 3 }}>{t('military.drillDaysHint')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Active Duty Results */}
      {mode === 'active' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{t('military.results')} — {grade}, {yos} {t('military.yosLabel')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { label: t('military.basePay'), value: basePay, color: '#1a5276' },
              { label: t('military.bah'),     value: bah,     color: '#16a085' },
              { label: t('military.bas'),     value: bas,     color: '#8e44ad' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{fmtUSD(value)}</div>
                <div style={{ fontSize: '0.72rem', color: '#aaa' }}>/mo</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--navy, #1a2b4b)', color: '#fff', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('military.totalComp')}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{fmtUSD(totalActive)}/mo</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{fmtUSD(totalActive * 12)}/{t('military.year')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', opacity: 0.6 }}>{t('military.taxNote')}</div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>{t('military.disclaimer')}</p>
        </div>
      )}

      {/* Reserve/Guard Results */}
      {mode === 'reserve' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{t('military.reserveResults')} — {grade}, {yos} {t('military.yosLabel')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { label: t('military.drillPayMonth'),  value: drillPay,            color: '#1a5276', sub: `${drillDays} ${t('military.periods')}` },
              { label: t('military.annualDrillPay'), value: annualDrillPay,      color: '#16a085', sub: t('military.perYear') },
              { label: t('military.annualTraining'), value: annualTrainingPay,   color: '#8e44ad', sub: '15 days/yr' },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{fmtUSD(value)}</div>
                <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#1a2b4b', color: '#fff', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('military.totalAnnualReserve')}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{fmtUSD(annualDrillPay + annualTrainingPay)}/{t('military.year')}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>{t('military.excludesBah')}</div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>{t('military.disclaimer')}</p>
        </div>
      )}

      {/* Pay table for current grade */}
      <div className="card">
        <div className="card-title">{t('military.payTable')} — {grade}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>{t('military.yos')}</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>{t('military.basePay')}/mo</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>{t('military.annual')}</th>
              </tr>
            </thead>
            <tbody>
              {YOS_LABELS.map((label, i) => {
                const pay = (BASE_PAY[grade] || [])[i] || 0;
                const isCurrentYos = i === yosToIndex(yos);
                return (
                  <tr key={label} style={{ background: isCurrentYos ? '#e8f4fd' : 'transparent', fontWeight: isCurrentYos ? 700 : 400 }}>
                    <td style={{ padding: '0.35rem 0.6rem' }}>{label}</td>
                    <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right' }}>{fmtUSD(pay)}</td>
                    <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: '#888' }}>{fmtUSD(pay * 12)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
