import { useState, useMemo } from 'react';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';

// 2025 Military Base Pay (monthly) — indexed by [grade][yosIndex]
// YOS buckets: 0 2 3 4 6 8 10 12 14 16 18 20 22 24 26
const YOS_LABELS = ['<2','2','3','4','6','8','10','12','14','16','18','20','22','24','26+'];

const BASE_PAY = {
  'E-1':  [1833,1833,1833,1833,1833,1833,1833,1833,1833,1833,1833,1833,1833,1833,1833],
  'E-2':  [2055,2055,2055,2055,2055,2055,2055,2055,2055,2055,2055,2055,2055,2055,2055],
  'E-3':  [2161,2297,2297,2297,2297,2297,2297,2297,2297,2297,2297,2297,2297,2297,2297],
  'E-4':  [2393,2583,2682,2906,2906,2906,2906,2906,2906,2906,2906,2906,2906,2906,2906],
  'E-5':  [2610,2778,2879,2985,3161,3393,3393,3393,3393,3393,3393,3393,3393,3393,3393],
  'E-6':  [2849,3130,3228,3328,3506,3693,3852,4051,4051,4051,4051,4051,4051,4051,4051],
  'E-7':  [3294,3593,3730,3828,4006,4268,4436,4590,4779,4958,5109,5109,5109,5109,5109],
  'E-8':  [4736,4736,4887,4983,5197,5438,5664,5808,6009,6153,6342,6440,6440,6440,6440],
  'E-9':  [5473,5473,5473,5473,5793,6060,6305,6500,6712,6960,7191,7524,7812,8076,8609],
  'W-1':  [3399,3819,3961,4100,4307,4558,4747,4993,5162,5399,5471,5471,5471,5471,5471],
  'W-2':  [3906,4299,4439,4563,4770,5036,5251,5517,5702,5796,5886,5977,5977,5977,5977],
  'W-3':  [4506,4802,4946,5085,5324,5622,5886,6156,6381,6604,6770,6908,6908,6908,6908],
  'W-4':  [4846,5279,5449,5580,5844,6148,6479,6757,7021,7307,7497,7497,7497,7497,7497],
  'W-5':  [5681,5681,5681,5681,6083,6522,6863,7213,7574,7978,8383,8803,9063,9063,9063],
  'O-1':  [3637,3777,4574,4574,4574,4574,4574,4574,4574,4574,4574,4574,4574,4574,4574],
  'O-2':  [4187,4775,5476,5533,5622,5622,5622,5622,5622,5622,5622,5622,5622,5622,5622],
  'O-3':  [4856,5500,5933,6437,6683,6939,7312,7633,8044,8044,8044,8044,8044,8044,8044],
  'O-4':  [5517,6380,6806,7256,7521,7917,8325,8797,9173,9583,9718,9718,9718,9718,9718],
  'O-5':  [6390,7242,7724,8206,8460,8823,9230,9707,10228,10805,11098,11098,11098,11098,11098],
  'O-6':  [7668,8432,8985,9533,9853,10200,10636,11162,11764,12456,13029,13293,13293,13293,13293],
  'O-7':  [9668,10227,10403,10579,10857,11222,11581,12041,12507,13056,13575,14055,14055,14055,14055],
  'O-8':  [11329,11812,12090,12371,12791,13252,13709,14280,14850,15423,15995,16082,16082,16082,16082],
  'O-9':  [13230,13724,14017,14312,14743,15175,15605,16150,16705,17263,17823,18493,18493,18493,18493],
  'O-10': [16974,16974,16974,16974,16974,16974,16974,16974,16974,16974,16974,16974,16974,16974,16974],
};

const ENLISTED = ['E-1','E-2','E-3','E-4','E-5','E-6','E-7','E-8','E-9'];
const WARRANT  = ['W-1','W-2','W-3','W-4','W-5'];
const OFFICER  = ['O-1','O-2','O-3','O-4','O-5','O-6','O-7','O-8','O-9','O-10'];

// BAH 2025 — simplified monthly rates by grade category and location tier
const BAH_TIERS = {
  high: {
    label: 'High Cost (NYC/SF/DC/HI)',
    withDep:    { E: 3200, W: 3800, O3: 4200, O6: 5000, O7p: 5600 },
    withoutDep: { E: 2600, W: 3100, O3: 3500, O6: 4200, O7p: 4700 },
  },
  mid: {
    label: 'Mid Cost (Denver/Atlanta/Dallas)',
    withDep:    { E: 2100, W: 2600, O3: 2900, O6: 3500, O7p: 3900 },
    withoutDep: { E: 1700, W: 2100, O3: 2400, O6: 2900, O7p: 3300 },
  },
  low: {
    label: 'Low Cost (Rural / Small City)',
    withDep:    { E: 1400, W: 1700, O3: 2000, O6: 2400, O7p: 2700 },
    withoutDep: { E: 1100, W: 1400, O3: 1600, O6: 2000, O7p: 2300 },
  },
};

function bahCategory(grade) {
  if (grade.startsWith('E')) return 'E';
  if (grade.startsWith('W')) return 'W';
  const num = parseInt(grade.slice(1));
  if (num <= 6) return 'O3';
  if (num === 7) return 'O7p';
  return 'O7p';
}

function getBah(grade, tier, withDep) {
  const cat = bahCategory(grade);
  const row = withDep ? BAH_TIERS[tier].withDep : BAH_TIERS[tier].withoutDep;
  return row[cat] || 0;
}

// BAS 2025
const BAS = { E: 470.04, O: 335.35 };
function getBas(grade) {
  return grade.startsWith('O') ? BAS.O : BAS.E;
}

function yosToIndex(yos) {
  const breaks = [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26];
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (yos >= breaks[i]) return i + 1;
  }
  return 0;
}

function getBasePay(grade, yos) {
  const row = BASE_PAY[grade];
  if (!row) return 0;
  return row[yosToIndex(yos)] || row[0];
}

export default function MilitaryPay() {
  const t = useT();
  const [mode, setMode] = useState('active');
  const [grade, setGrade] = useState('E-5');
  const [yos, setYos] = useState(4);
  const [bahTier, setBahTier] = useState('mid');
  const [withDep, setWithDep] = useState(true);
  const [drillDays, setDrillDays] = useState(4);

  const basePay = useMemo(() => getBasePay(grade, yos), [grade, yos]);
  const bah = useMemo(() => getBah(grade, bahTier, withDep), [grade, bahTier, withDep]);
  const bas = getBas(grade);

  const totalActive = basePay + bah + bas;

  const drillPay = (basePay / 30) * drillDays;
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
              { label: t('military.bah'), value: bah, color: '#16a085' },
              { label: t('military.bas'), value: bas, color: '#8e44ad' },
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
              { label: t('military.drillPayMonth'), value: drillPay, color: '#1a5276', sub: `${drillDays} ${t('military.periods')}` },
              { label: t('military.annualDrillPay'), value: annualDrillPay, color: '#16a085', sub: t('military.perYear') },
              { label: t('military.annualTraining'), value: annualTrainingPay, color: '#8e44ad', sub: '15 days/yr' },
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
