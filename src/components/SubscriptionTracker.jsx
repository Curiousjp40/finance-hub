import { useState } from 'react';
import { useLocalState } from '../utils/useLocalState';
import { fmtUSD } from '../utils/finance';
import { useT } from '../LanguageContext';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const CATEGORIES = ['streaming', 'software', 'fitness', 'food', 'news', 'gaming', 'other'];
const CAT_COLORS = {
  streaming: '#e50914', software: '#1a5276', fitness: '#1e8449',
  food: '#d97706', news: '#8e44ad', gaming: '#16a085', other: '#7f8c8d',
};
const FREQUENCIES = ['monthly', 'yearly', 'weekly', 'quarterly'];

function toMonthly(amount, freq) {
  switch (freq) {
    case 'monthly': return amount;
    case 'yearly': return amount / 12;
    case 'weekly': return amount * 52 / 12;
    case 'quarterly': return amount / 3;
    default: return amount;
  }
}

export default function SubscriptionTracker() {
  const t = useT();
  const [subs, setSubs] = useLocalState('subscription-tracker', []);
  const [form, setForm] = useState({
    name: '', cost: '', frequency: 'monthly', category: 'streaming',
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdd = e => {
    e.preventDefault();
    if (!form.name || !form.cost) return;
    setSubs(prev => [...prev, {
      id: uid(),
      name: form.name,
      cost: parseFloat(form.cost),
      frequency: form.frequency,
      category: form.category,
    }]);
    setForm({ name: '', cost: '', frequency: 'monthly', category: 'streaming' });
  };

  const handleDelete = id => setSubs(prev => prev.filter(s => s.id !== id));

  const monthlyTotal = subs.reduce((s, sub) => s + toMonthly(sub.cost, sub.frequency), 0);
  const annualTotal = monthlyTotal * 12;

  const sorted = [...subs].sort((a, b) => toMonthly(b.cost, b.frequency) - toMonthly(a.cost, a.frequency));
  const topThreshold = sorted.length > 0 ? toMonthly(sorted[0].cost, sorted[0].frequency) * 0.5 : 0;

  const catTotals = CATEGORIES.map(cat => {
    const total = subs.filter(s => s.category === cat).reduce((s, sub) => s + toMonthly(sub.cost, sub.frequency), 0);
    return { cat, total };
  }).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="page-sub">
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('subscriptions.sub')}</p>

      {/* Add Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">{t('subscriptions.addSub')}</div>
        <form onSubmit={handleAdd}>
          <div className="two-col">
            <div className="field">
              <label>{t('subscriptions.subName')}</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Netflix, Spotify…" />
            </div>
            <div className="field">
              <label>{t('subscriptions.cost')}</label>
              <input name="cost" type="number" min="0" step="0.01" value={form.cost} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="field">
              <label>{t('subscriptions.frequency')}</label>
              <select name="frequency" value={form.frequency} onChange={handleChange}>
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{t(`subscriptions.freq_${f}`)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('subscriptions.category')}</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{t(`subscriptions.cat_${c}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: '0.75rem' }}>
            {t('subscriptions.add')}
          </button>
        </form>
      </div>

      {/* Totals */}
      {subs.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('subscriptions.monthlyTotal')}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a5276' }}>{fmtUSD(monthlyTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('subscriptions.annualTotal')}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7f8c8d' }}>{fmtUSD(annualTotal)}</div>
            </div>
          </div>
          {/* Category breakdown */}
          {catTotals.length > 1 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#555' }}>{t('subscriptions.byCategory')}</div>
              {catTotals.map(({ cat, total }) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{t(`subscriptions.cat_${cat}`)}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtUSD(total)}/mo</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscription List */}
      <div className="card">
        <div className="card-title">{t('subscriptions.yourSubs')}</div>
        {subs.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>{t('subscriptions.noSubs')}</p>
        ) : (
          <div>
            {sorted.map(sub => {
              const monthly = toMonthly(sub.cost, sub.frequency);
              const isExpensive = monthly >= topThreshold && subs.length > 1;
              const color = CAT_COLORS[sub.category] || '#7f8c8d';
              return (
                <div key={sub.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {sub.name}
                      {isExpensive && (
                        <span style={{ background: '#fff3cd', color: '#856404', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 8 }}>
                          {t('subscriptions.expensive')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {t(`subscriptions.cat_${sub.category}`)} · {t(`subscriptions.freq_${sub.frequency}`)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{fmtUSD(sub.cost)}</div>
                    {sub.frequency !== 'monthly' && (
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{fmtUSD(monthly)}/mo</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '1.1rem', padding: '0.2rem 0.4rem' }}
                  >✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
