import { useState, useMemo } from 'react';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';



function readLocalArr(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function calcMonthlyExpenses() {
  const expenses = readLocalArr('budget-expenses');
  if (expenses.length === 0) return null;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthExpenses = expenses.filter(e => (e.date || '').startsWith(thisMonth));
  if (thisMonthExpenses.length === 0) {
    return expenses.reduce((s, e) => s + (e.amount || 0), 0) / 12;
  }
  return thisMonthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
}

export default function EmergencyFund() {
  const t = useT();

  const budgetExpenses = useMemo(() => calcMonthlyExpenses(), []);
  const [manualExpenses, setManualExpenses] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');

  const monthlyExpenses = manualExpenses
    ? parseFloat(manualExpenses) || 0
    : budgetExpenses || 0;

  const target3 = monthlyExpenses * 3;
  const target6 = monthlyExpenses * 6;
  const saved = parseFloat(currentSavings) || 0;
  const contrib = parseFloat(monthlyContrib) || 0;

  const pct3 = target3 > 0 ? Math.min((saved / target3) * 100, 100) : 0;
  const pct6 = target6 > 0 ? Math.min((saved / target6) * 100, 100) : 0;

  const monthsTo3 = contrib > 0 && saved < target3 ? Math.ceil((target3 - saved) / contrib) : null;
  const monthsTo6 = contrib > 0 && saved < target6 ? Math.ceil((target6 - saved) / contrib) : null;

  const dateIn = months => {
    if (!months) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('emergency.sub')}</p>

      {/* Inputs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('emergency.yourInfo')}</div>
        <div className="two-col">
          <div className="field">
            <label>{t('emergency.monthlyExpenses')}</label>
            {budgetExpenses !== null && !manualExpenses && (
              <div style={{ fontSize: '0.78rem', color: '#16a085', marginBottom: 4 }}>
                {t('emergency.fromBudget')}: {fmtUSD(budgetExpenses)}/mo
              </div>
            )}
            <input
              type="number" min="0" step="1"
              value={manualExpenses}
              onChange={e => setManualExpenses(e.target.value)}
              placeholder={budgetExpenses ? String(Math.round(budgetExpenses)) : '3000'}
            />
            {budgetExpenses !== null && (
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 3 }}>{t('emergency.manualOverride')}</div>
            )}
          </div>
          <div className="field">
            <label>{t('emergency.currentSavings')}</label>
            <input
              type="number" min="0" step="1"
              value={currentSavings}
              onChange={e => setCurrentSavings(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>{t('emergency.monthlyContrib')}</label>
            <input
              type="number" min="0" step="1"
              value={monthlyContrib}
              onChange={e => setMonthlyContrib(e.target.value)}
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {monthlyExpenses > 0 && (
        <>
          {/* Targets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: t('emergency.target3'), target: target3, pct: pct3, months: monthsTo3, color: '#16a085' },
              { label: t('emergency.target6'), target: target6, pct: pct6, months: monthsTo6, color: '#1a5276' },
            ].map(({ label, target, pct, months, color }) => {
              const reached = saved >= target;
              return (
                <div key={label} className="card" style={{ borderTop: `4px solid ${color}` }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '0.5rem' }}>
                    {fmtUSD(target)}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.5rem' }}>
                    {fmtUSD(saved)} / {fmtUSD(target)} ({Math.round(pct)}%)
                  </div>

                  {reached ? (
                    <span style={{ background: '#d5f5e3', color: '#1e8449', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                      ✅ {t('emergency.reached')}
                    </span>
                  ) : contrib > 0 && months !== null ? (
                    <div style={{ fontSize: '0.8rem', color: '#555' }}>
                      {t('emergency.timeline')}: <strong>{months} mo</strong> ({dateIn(months)})
                    </div>
                  ) : contrib === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{t('emergency.addContrib')}</div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="card" style={{ background: '#f0f9f6', border: '1px solid #a8d8c8' }}>
            <div className="card-title" style={{ color: '#16a085' }}>💡 {t('emergency.tips')}</div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#444', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <li>{t('emergency.tip1')}</li>
              <li>{t('emergency.tip2')}</li>
              <li>{t('emergency.tip3')}</li>
            </ul>
          </div>
        </>
      )}

      {monthlyExpenses === 0 && !manualExpenses && (
        <div className="card">
          <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>{t('emergency.enterExpenses')}</p>
        </div>
      )}
    </div>
  );
}
