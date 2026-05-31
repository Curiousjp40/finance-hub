import { useState } from 'react';
import { useLocalState } from '../utils/useLocalState';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const COLORS = ['#1a5276', '#1e8449', '#8e44ad', '#c0392b', '#d97706', '#16a085'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function monthsUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  const months =
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth()) +
    (target.getDate() >= today.getDate() ? 0 : -1);
  return months;
}

export default function SavingsGoals() {
  const t = useT();
  const [goals, setGoals] = useLocalState('savings-goals', []);

  const [form, setForm] = useState({
    name: '',
    icon: '🎯',
    target: '',
    current: '',
    targetDate: '',
    color: COLORS[0],
  });

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.target) return;
    setGoals((prev) => [
      ...prev,
      {
        id: uid(),
        name: form.name,
        icon: form.icon || '🎯',
        target: parseFloat(form.target),
        current: parseFloat(form.current) || 0,
        targetDate: form.targetDate,
        color: form.color,
      },
    ]);
    setForm({ name: '', icon: '🎯', target: '', current: '', targetDate: '', color: COLORS[0] });
  };

  const handleDelete = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleEditStart = (goal) => {
    setEditingId(goal.id);
    setEditValue(String(goal.current));
  };

  const handleEditSave = (id) => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, current: val } : g))
      );
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') handleEditSave(id);
    if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
  };

  const totalSaved = goals.reduce((s, g) => s + (g.current || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.target || 0), 0);

  const getStatus = (goal) => {
    const days = daysUntil(goal.targetDate);
    const months = monthsUntil(goal.targetDate);
    const remaining = goal.target - goal.current;

    if (goal.current >= goal.target) return { label: t('savings.complete'), badge: 'complete', monthly: null };
    if (days !== null && days < 0) return { label: t('savings.overdue'), badge: 'overdue', monthly: null };

    const monthsLeft = months !== null ? Math.max(months, 1) : null;
    const monthlyNeeded = monthsLeft !== null ? remaining / monthsLeft : null;

    // On-track: compare progress % vs time elapsed %
    let badge = 'ontrack';
    if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const startDate = new Date(targetDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      const today = new Date();
      const totalDays = (targetDate - startDate) / (1000 * 60 * 60 * 24);
      const passedDays = (today - startDate) / (1000 * 60 * 60 * 24);
      const timeElapsed = Math.min(Math.max(passedDays / totalDays, 0), 1);
      const progressPct = goal.current / goal.target;

      if (progressPct >= timeElapsed) badge = 'ontrack';
      else if (progressPct >= timeElapsed * 0.75) badge = 'behind';
      else badge = 'far-behind';
    }

    return { badge, monthly: monthlyNeeded };
  };

  const badgeStyle = (badge) => {
    if (badge === 'complete') return { background: '#d5f5e3', color: '#1e8449' };
    if (badge === 'overdue') return { background: '#fde8e8', color: '#c0392b' };
    if (badge === 'ontrack') return { background: '#d5f5e3', color: '#1e8449' };
    if (badge === 'behind') return { background: '#fef9c3', color: '#d97706' };
    return { background: '#fde8e8', color: '#c0392b' };
  };

  const badgeLabel = (badge) => {
    if (badge === 'complete') return t('savings.complete');
    if (badge === 'overdue') return t('savings.overdue');
    if (badge === 'ontrack') return t('savings.onTrack');
    return t('savings.behind');
  };

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('savings.sub')}</p>

      {/* Summary Card */}
      {goals.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('savings.totalSaved')}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e8449' }}>{fmtUSD(totalSaved)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('savings.totalTarget')}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7f8c8d' }}>{fmtUSD(totalTarget)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 120 }}>
              <div style={{ width: '100%' }}>
                <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%`,
                    background: '#1e8449',
                    borderRadius: 5,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                  {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% overall
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('savings.addGoal')}</div>
        <form onSubmit={handleAdd}>
          <div className="two-col">
            <div className="field">
              <label>{t('savings.goalName')}</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder={t('savings.goalName')}
              />
            </div>
            <div className="field">
              <label>{t('savings.icon')}</label>
              <input
                name="icon"
                value={form.icon}
                onChange={handleFormChange}
                placeholder="🎯"
                style={{ maxWidth: 80 }}
              />
            </div>
            <div className="field">
              <label>{t('savings.targetAmt')}</label>
              <input
                name="target"
                type="number"
                min="0"
                step="0.01"
                value={form.target}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>{t('savings.currentSaved')}</label>
              <input
                name="current"
                type="number"
                min="0"
                step="0.01"
                value={form.current}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>{t('savings.targetDate')}</label>
              <input
                name="targetDate"
                type="date"
                value={form.targetDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="field">
              <label>{t('savings.color')}</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: c,
                      border: form.color === c ? '3px solid #333' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: '0.75rem' }}>
            {t('savings.add')}
          </button>
        </form>
      </div>

      {/* Goals Grid */}
      <div className="card-title" style={{ marginBottom: '0.75rem' }}>{t('savings.yourGoals')}</div>
      {goals.length === 0 ? (
        <div className="card">
          <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>{t('savings.noGoals')}</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            const days = daysUntil(goal.targetDate);
            const status = getStatus(goal);
            const bs = badgeStyle(status.badge);

            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  borderTop: `4px solid ${goal.color}`,
                  position: 'relative',
                  padding: '1rem',
                }}
              >
                {/* Delete */}
                <button
                  onClick={() => handleDelete(goal.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#bbb',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '0.1rem 0.3rem',
                  }}
                  aria-label="Delete goal"
                >
                  ✕
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingRight: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{goal.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{goal.name}</div>
                </div>

                {/* Badge */}
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  ...bs,
                }}>
                  {badgeLabel(status.badge)}
                </span>

                {/* Progress Bar */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: goal.color,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#888', marginTop: 3 }}>
                    <span>{Math.round(pct)}%</span>
                    <span>
                      {editingId === goal.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, goal.id)}
                            style={{ width: 70, padding: '0.1rem 0.3rem', fontSize: '0.78rem', border: '1px solid #ccc', borderRadius: 4 }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditSave(goal.id)}
                            style={{ background: goal.color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                          >
                            {t('savings.update')}
                          </button>
                        </span>
                      ) : (
                        <span
                          style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                          onClick={() => handleEditStart(goal)}
                          title={t('savings.update')}
                        >
                          {fmtUSD(goal.current)}
                        </span>
                      )}
                      {' '}/ {fmtUSD(goal.target)}
                    </span>
                  </div>
                </div>

                {/* Days remaining */}
                {goal.targetDate && days !== null && (
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                    {days > 0
                      ? `${days} ${t('savings.daysLeft')}`
                      : days === 0
                      ? t('savings.overdue')
                      : `${Math.abs(days)}d ${t('savings.overdue')}`}
                  </div>
                )}

                {/* Monthly needed */}
                {status.monthly !== null && (
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>
                    {t('savings.monthlyNeeded')}: <strong>{fmtUSD(Math.max(status.monthly, 0))}/mo</strong>
                  </div>
                )}

                {/* Edit current amount button */}
                {editingId !== goal.id && (
                  <button
                    className="btn"
                    onClick={() => handleEditStart(goal)}
                    style={{
                      marginTop: '0.75rem',
                      background: 'none',
                      border: `1px solid ${goal.color}`,
                      color: goal.color,
                      borderRadius: 6,
                      cursor: 'pointer',
                      padding: '0.3rem 0.7rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {t('savings.update')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
