import { useState } from 'react';
import { useLocalState } from '../utils/useLocalState';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const CATEGORIES = ['housing', 'utilities', 'insurance', 'subscriptions', 'loans', 'other'];
const CAT_COLORS = {
  housing: '#1a5276',
  utilities: '#d4ac0d',
  insurance: '#8e44ad',
  subscriptions: '#16a085',
  loans: '#c0392b',
  other: '#7f8c8d',
};
const FREQUENCIES = ['monthly', 'weekly', 'yearly', 'quarterly'];

function toMonthly(amount, frequency) {
  switch (frequency) {
    case 'monthly': return amount;
    case 'weekly': return amount * 52 / 12;
    case 'yearly': return amount / 12;
    case 'quarterly': return amount / 3;
    default: return amount;
  }
}

function getDayOfMonth(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  return parseInt(parts[2], 10);
}

function getMonthYear(dateStr) {
  if (!dateStr) return { month: null, year: null };
  const parts = dateStr.split('-');
  return { month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
}

function billsDueOnDay(bills, day, year, month) {
  return bills.filter((bill) => {
    if (!bill.dueDate) return false;
    const dueDom = getDayOfMonth(bill.dueDate);
    const { month: dueMonth, year: dueYear } = getMonthYear(bill.dueDate);
    const billDate = new Date(dueYear, dueMonth - 1, dueDom);

    if (bill.frequency === 'monthly') {
      return dueDom === day;
    }
    if (bill.frequency === 'weekly') {
      const calDay = new Date(year, month - 1, day);
      const diff = Math.round((calDay - billDate) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff % 7 === 0;
    }
    if (bill.frequency === 'yearly') {
      return dueMonth === month && dueDom === day;
    }
    if (bill.frequency === 'quarterly') {
      const monthsApart = (year - dueYear) * 12 + (month - dueMonth);
      return monthsApart >= 0 && monthsApart % 3 === 0 && dueDom === day;
    }
    return false;
  });
}

export default function BillTracker() {
  const t = useT();
  const [bills, setBills] = useLocalState('bill-tracker', []);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    category: 'housing',
  });

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const [calYear, setCalYear] = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth);

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.dueDate) return;
    setBills((prev) => [
      ...prev,
      {
        id: uid(),
        name: form.name,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        frequency: form.frequency,
        category: form.category,
      },
    ]);
    setForm({ name: '', amount: '', dueDate: '', frequency: 'monthly', category: 'housing' });
  };

  const handleDelete = (id) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const monthlyTotal = bills.reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);
  const annualTotal = monthlyTotal * 12;

  // Bills due within 7 days (monthly bills: check day-of-month)
  const dueSoonBills = bills.filter((bill) => {
    if (bill.frequency !== 'monthly') return false;
    const dom = getDayOfMonth(bill.dueDate);
    if (dom === null) return false;
    const diff = dom - todayDay;
    return diff >= 0 && diff <= 7;
  });

  // Calendar
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const calMonthName = new Date(calYear, calMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const calCells = [];
  for (let i = 0; i < firstDow; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const isDueSoon = (day) => {
    if (calMonth !== todayMonth || calYear !== todayYear) return false;
    const diff = day - todayDay;
    return diff >= 0 && diff <= 7 && billsDueOnDay(bills, day, calYear, calMonth).length > 0;
  };

  const isToday = (day) =>
    day === todayDay && calMonth === todayMonth && calYear === todayYear;

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('bills.sub')}</p>

      {/* Due Soon Alert */}
      {dueSoonBills.length > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>{t('bills.dueSoon')}</strong>
            <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem' }}>
              {dueSoonBills.map((b) => (
                <li key={b.id}>
                  {b.name} — {t('bills.dueDateLabel')} {getDayOfMonth(b.dueDate)} ({fmtUSD(b.amount)})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Bill Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('bills.addBill')}</div>
        <form onSubmit={handleAdd}>
          <div className="two-col">
            <div className="field">
              <label>{t('bills.billName')}</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder={t('bills.billNamePh')}
              />
            </div>
            <div className="field">
              <label>{t('bills.amount')}</label>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>{t('bills.dueDate')}</label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="field">
              <label>{t('bills.frequency')}</label>
              <select name="frequency" value={form.frequency} onChange={handleFormChange}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{t(`bills.freq_${f}`)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('bills.category')}</label>
              <select name="category" value={form.category} onChange={handleFormChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`bills.cat_${c}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: '0.75rem' }}>
            {t('bills.add')}
          </button>
        </form>
      </div>

      {/* Monthly Total Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('bills.monthlyTotal')}</div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('bills.monthlyTotal')}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a5276' }}>{fmtUSD(monthlyTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('bills.annualTotal')}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7f8c8d' }}>{fmtUSD(annualTotal)}</div>
          </div>
        </div>
      </div>

      {/* Bill List */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('bills.yourBills')}</div>
        {bills.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>{t('bills.noBills')}</p>
        ) : (
          <div>
            {bills.map((bill) => {
              const monthly = toMonthly(bill.amount, bill.frequency);
              const color = CAT_COLORS[bill.category] || '#7f8c8d';
              return (
                <div key={bill.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{bill.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {t(`bills.cat_${bill.category}`)} · {t(`bills.freq_${bill.frequency}`)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{fmtUSD(bill.amount)}</div>
                    {bill.frequency !== 'monthly' && (
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        {fmtUSD(monthly)}/mo
                      </div>
                    )}
                  </div>
                  <button
                    className="btn ber-del"
                    onClick={() => handleDelete(bill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#c0392b',
                      fontSize: '1.1rem',
                      padding: '0.2rem 0.4rem',
                    }}
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="budget-cal-header">
          <button className="btn" onClick={prevMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: '0.2rem 0.6rem' }}>‹</button>
          <div className="card-title" style={{ margin: 0 }}>{t('bills.calTitle')} — {calMonthName}</div>
          <button className="btn" onClick={nextMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: '0.2rem 0.6rem' }}>›</button>
        </div>

        <div className="budget-cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '0.75rem' }}>
          {DOW_LABELS.map((d) => (
            <div key={d} className="bcal-dow" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#888', padding: '0.25rem 0' }}>{d}</div>
          ))}
          {calCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bcal-empty" />;
            }
            const dayBills = billsDueOnDay(bills, day, calYear, calMonth);
            const dueSoonDay = isDueSoon(day);
            const todayDay_ = isToday(day);
            const dayTotal = dayBills.reduce((s, b) => s + b.amount, 0);

            return (
              <div
                key={day}
                className={`bcal-day${todayDay_ ? ' today' : ''}${dueSoonDay ? ' has-exp' : ''}`}
                style={{
                  minHeight: 56,
                  borderRadius: 6,
                  padding: '0.25rem',
                  background: todayDay_ ? '#1a5276' : dueSoonDay ? '#fff3cd' : '#fafafa',
                  border: todayDay_ ? '2px solid #1a5276' : '1px solid #eee',
                  position: 'relative',
                }}
              >
                <div className="bcal-num" style={{
                  fontSize: '0.8rem',
                  fontWeight: todayDay_ ? 700 : 400,
                  color: todayDay_ ? '#fff' : '#333',
                  textAlign: 'right',
                }}>
                  {day}
                </div>
                {dayBills.length > 0 && (
                  <>
                    <div className="bcal-dot-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                      {dayBills.slice(0, 4).map((b) => (
                        <div
                          key={b.id}
                          className="bcal-dot"
                          title={b.name}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: CAT_COLORS[b.category] || '#7f8c8d',
                          }}
                        />
                      ))}
                    </div>
                    <div className="bcal-total" style={{
                      fontSize: '0.65rem',
                      color: todayDay_ ? '#fff' : '#555',
                      textAlign: 'center',
                      marginTop: 2,
                    }}>
                      {fmtUSD(dayTotal)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
          {CATEGORIES.map((cat) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat] }} />
              <span style={{ color: '#555' }}>{t(`bills.cat_${cat}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
