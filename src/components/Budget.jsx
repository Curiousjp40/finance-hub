import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { fmtUSD } from '../utils/finance';
import { useT, useLang } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

const CAT_META = [
  { id: 'housing',       icon: '🏠', color: '#1a5276', type: 'need', defaultLimit: 1500 },
  { id: 'transport',     icon: '🚗', color: '#2e86c1', type: 'need', defaultLimit: 400  },
  { id: 'groceries',     icon: '🛒', color: '#1e8449', type: 'need', defaultLimit: 350  },
  { id: 'utilities',     icon: '⚡', color: '#d4ac0d', type: 'need', defaultLimit: 150  },
  { id: 'dining',        icon: '🍽️', color: '#e67e22', type: 'want', defaultLimit: 200  },
  { id: 'healthcare',    icon: '💊', color: '#8e44ad', type: 'need', defaultLimit: 100  },
  { id: 'entertainment', icon: '🎬', color: '#16a085', type: 'want', defaultLimit: 150  },
  { id: 'savings',       icon: '💰', color: '#27ae60', type: 'save', defaultLimit: 500  },
  { id: 'clothing',      icon: '👕', color: '#c0392b', type: 'want', defaultLimit: 100  },
  { id: 'other',         icon: '📦', color: '#7f8c8d', type: 'want', defaultLimit: 200  },
];

const TABS = [
  { id: 'overview', icon: '📊' },
  { id: 'expenses', icon: '📝' },
  { id: 'calendar', icon: '📅' },
  { id: 'networth', icon: '💼' },
];

const MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 14} outerRadius={outerRadius + 18}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#1c2b3a" fontSize={12} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#1c2b3a" fontSize={16} fontWeight={800}>
        {fmtUSD(value)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#6b7c93" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

function CalendarGrid({ month, year, expensesByDay, selectedDay, onSelectDay, allCats }) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();
  const isTodayCell = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="budget-cal">
      <div className="budget-cal-header">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(h => (
          <div key={h} className="bcal-dow">{h}</div>
        ))}
      </div>
      <div className="budget-cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="bcal-empty" />;
          const hasExp     = !!expensesByDay[d];
          const isSelected = d === selectedDay;
          const total      = hasExp ? expensesByDay[d].reduce((s, e) => s + e.amount, 0) : 0;
          return (
            <div
              key={d}
              className={`bcal-day${hasExp ? ' has-exp' : ''}${isTodayCell(d) ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => onSelectDay(isSelected ? null : d)}
            >
              <span className="bcal-num">{d}</span>
              {hasExp && (
                <span className="bcal-dot-row">
                  {expensesByDay[d].slice(0, 3).map((exp, idx) => {
                    const cat = allCats.find(c => c.id === exp.categoryId);
                    return <span key={idx} className="bcal-dot" style={{ background: cat?.color ?? '#7f8c8d' }} />;
                  })}
                </span>
              )}
              {hasExp && <span className="bcal-total">{fmtUSD(total)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Budget() {
  const t    = useT();
  const lang = useLang();

  // Persistent state
  const [income, setIncome]           = useLocalState('budget-income',       5000);
  const [catLimits, setCatLimits]     = useLocalState('budget-cat-limits',   {});
  const [expenses, setExpenses]       = useLocalState('budget-expenses',     []);
  const [customCats, setCustomCats]   = useLocalState('budget-custom-cats2', []);
  const [assets, setAssets]           = useLocalState('budget-assets',       []);
  const [liabilities, setLiabilities] = useLocalState('budget-liabilities',  []);

  // UI state
  const [activeTab, setActiveTab]           = useState('overview');
  const [activePieIdx, setActivePieIdx]     = useState(null);
  const [highlightedCat, setHighlightedCat] = useState(null);
  const [calMonth, setCalMonth]             = useState(new Date().getMonth());
  const [calYear, setCalYear]               = useState(new Date().getFullYear());
  const [editingLimit, setEditingLimit]     = useState(null);
  const [newCatName, setNewCatName]         = useState('');
  const [selectedDay, setSelectedDay]       = useState(null);
  const [expForm, setExpForm]               = useState({ date: todayStr(), description: '', amount: '', categoryId: 'housing' });
  const [assetForm, setAssetForm]           = useState({ name: '', value: '' });
  const [liabForm, setLiabForm]             = useState({ name: '', value: '' });

  // Category list (built-in + custom)
  const catNames = t('budget.catNames');
  const getCatName = (id) => (catNames && typeof catNames === 'object') ? (catNames[id] ?? id) : id;

  const allCats = useMemo(() => [
    ...CAT_META.map(m => ({
      ...m,
      name:      getCatName(m.id),
      limit:     catLimits[m.id] ?? m.defaultLimit,
      isBuiltIn: true,
    })),
    ...customCats.map(c => ({
      id: c.id, icon: c.icon ?? '📦', color: c.color ?? '#7f8c8d',
      type: c.type ?? 'want', name: c.name,
      limit: catLimits[c.id] ?? 0, isBuiltIn: false,
    })),
  ], [catLimits, customCats, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current-month spending
  const now       = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const spentByCat = useMemo(() => {
    const map = {};
    for (const exp of expenses) {
      const d = new Date(exp.date + 'T00:00:00');
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        map[exp.categoryId] = (map[exp.categoryId] ?? 0) + exp.amount;
      }
    }
    return map;
  }, [expenses, thisMonth, thisYear]);

  const totalSpent = useMemo(() => Object.values(spentByCat).reduce((s, v) => s + v, 0), [spentByCat]);
  const remaining  = income - totalSpent;

  const needs = useMemo(() => allCats.filter(c => c.type === 'need').reduce((s, c) => s + (spentByCat[c.id] ?? 0), 0), [allCats, spentByCat]);
  const wants = useMemo(() => allCats.filter(c => c.type === 'want').reduce((s, c) => s + (spentByCat[c.id] ?? 0), 0), [allCats, spentByCat]);
  const saves = useMemo(() => allCats.filter(c => c.type === 'save').reduce((s, c) => s + (spentByCat[c.id] ?? 0), 0), [allCats, spentByCat]);

  const totalAssets      = useMemo(() => assets.reduce((s, a) => s + (Number(a.value) || 0), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + (Number(l.value) || 0), 0), [liabilities]);
  const netWorth         = totalAssets - totalLiabilities;

  const pieData = useMemo(() =>
    allCats
      .filter(c => (spentByCat[c.id] ?? 0) > 0)
      .map(c => ({ name: c.name, value: spentByCat[c.id], id: c.id, color: c.color })),
    [allCats, spentByCat]
  );

  const insights = useMemo(() => {
    const list = [];
    if (income <= 0) return list;
    const h = spentByCat['housing']  ?? 0;
    const d = spentByCat['dining']   ?? 0;
    const s = spentByCat['savings']  ?? 0;
    if (h > income * 0.30) list.push({ type: 'warn', text: t('budget.insightHousing').replace('{pct}', ((h / income) * 100).toFixed(0)) });
    if (d > income * 0.15) list.push({ type: 'warn', text: t('budget.insightDining').replace('{pct}',  ((d / income) * 100).toFixed(0)) });
    if (s < income * 0.20) list.push({ type: 'tip',  text: t('budget.insightSavings').replace('{pct}', ((s / income) * 100).toFixed(0)) });
    const over = allCats.filter(c => c.limit > 0 && (spentByCat[c.id] ?? 0) > c.limit).length;
    if (over > 0)          list.push({ type: 'warn', text: t('budget.insightOverspent').replace('{n}', over) });
    if (list.length === 0) list.push({ type: 'good', text: t('budget.insightGreat') });
    return list;
  }, [income, spentByCat, allCats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calendar
  const calExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === calMonth && d.getFullYear() === calYear;
    }),
    [expenses, calMonth, calYear]
  );

  const expensesByDay = useMemo(() => {
    const map = {};
    for (const exp of calExpenses) {
      const day = parseInt(exp.date.split('-')[2]);
      if (!map[day]) map[day] = [];
      map[day].push(exp);
    }
    return map;
  }, [calExpenses]);

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  // Handlers
  function addExpense() {
    const amt = parseFloat(expForm.amount);
    if (!expForm.description.trim() || !expForm.date || isNaN(amt) || amt <= 0) return;
    setExpenses(prev => [{ id: uid(), ...expForm, amount: amt }, ...prev]);
    setExpForm(f => ({ ...f, description: '', amount: '' }));
  }

  function updateLimit(catId, val) {
    setCatLimits(prev => ({ ...prev, [catId]: parseFloat(val) || 0 }));
  }

  function addCustomCat() {
    const name = newCatName.trim();
    if (!name) return;
    setCustomCats(prev => [...prev, { id: 'custom-' + uid(), name, icon: '📦', color: '#7f8c8d', type: 'want' }]);
    setNewCatName('');
  }

  const MONTH_NAMES = lang === 'es' ? MONTH_ES : MONTH_EN;

  return (
    <div className="budget-dashboard">

      {/* ── Summary Bar ─────────────────────────────────────────── */}
      <div className="budget-summary-bar">
        <div className="budget-summary-item">
          <div className="bsi-label">{t('budget.monthlyIncome')}</div>
          <div className="bsi-value">{fmtUSD(income)}</div>
          <input
            className="bsi-edit-input"
            type="number" min={0} value={income || ''}
            placeholder="5000"
            onChange={e => setIncome(+e.target.value || 0)}
          />
        </div>
        <div className="budget-summary-item">
          <div className="bsi-label">{t('budget.totalSpent')}</div>
          <div className="bsi-value bsi-spent">{fmtUSD(totalSpent)}</div>
          <div className="bsi-sub">{t('budget.thisMonth')}</div>
        </div>
        <div className={`budget-summary-item${remaining >= 0 ? ' bsi-surplus' : ' bsi-deficit'}`}>
          <div className="bsi-label">{remaining >= 0 ? t('budget.surplus') : t('budget.deficit')}</div>
          <div className={`bsi-value ${remaining >= 0 ? 'bsi-positive' : 'bsi-negative'}`}>
            {fmtUSD(Math.abs(remaining))}
          </div>
          <div className="bsi-sub">{remaining >= 0 ? `✓ ${t('budget.onTrack')}` : `⚠ ${t('budget.overBudget')}`}</div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="budget-tabs">
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            className={`budget-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {icon} {t(`budget.tab_${id}`)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="budget-cats-grid">
            {allCats.map(cat => {
              const spent    = spentByCat[cat.id] ?? 0;
              const pct      = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
              const indColor = pct >= 100 ? 'var(--danger)' : pct >= 75 ? '#d97706' : 'var(--success)';
              const isHL     = highlightedCat === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`budget-cat-card${isHL ? ' hl' : ''}`}
                  style={{ borderLeftColor: cat.color }}
                  onClick={() => setHighlightedCat(isHL ? null : cat.id)}
                >
                  <div className="bcc-header">
                    <span className="bcc-icon">{cat.icon}</span>
                    <span className="bcc-name">{cat.name}</span>
                    {cat.limit > 0 && <span className="bcc-indicator" style={{ background: indColor }} />}
                  </div>
                  <div className="bcc-spent">{fmtUSD(spent)}</div>
                  {cat.limit > 0 && (
                    <div className="bcc-progress-track">
                      <div className="bcc-progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: indColor }} />
                    </div>
                  )}
                  <div className="bcc-meta">
                    {cat.limit > 0 && <span style={{ color: indColor, fontWeight: 700 }}>{pct.toFixed(0)}%</span>}
                    {editingLimit === cat.id ? (
                      <input
                        className="bcc-limit-input"
                        type="number" min={0}
                        defaultValue={cat.limit || ''}
                        autoFocus
                        onBlur={e => { updateLimit(cat.id, e.target.value); setEditingLimit(null); }}
                        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="bcc-limit-val"
                        onClick={e => { e.stopPropagation(); setEditingLimit(cat.id); }}
                      >
                        {cat.limit > 0 ? `${t('budget.of')} ${fmtUSD(cat.limit)}` : `+ ${t('budget.setBudget')}`}
                      </span>
                    )}
                  </div>
                  {!cat.isBuiltIn && (
                    <button
                      className="bcc-remove"
                      onClick={e => { e.stopPropagation(); setCustomCats(prev => prev.filter(c => c.id !== cat.id)); }}
                    >✕</button>
                  )}
                </div>
              );
            })}

            {/* Add category card */}
            <div className="budget-cat-card budget-add-cat-card" onClick={e => e.stopPropagation()}>
              <div className="bcc-add-icon">+</div>
              <input
                type="text"
                placeholder={t('budget.categoryName')}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCat()}
                className="bcc-new-input"
              />
              <button
                className="btn btn-primary"
                style={{ width:'100%', marginTop:'.5rem', fontSize:'.82rem', padding:'.45rem' }}
                onClick={addCustomCat}
              >
                {t('budget.addCategory')}
              </button>
            </div>
          </div>

          {/* 50/30/20 + Pie */}
          <div className="budget-lower-grid">
            <div className="card">
              <div className="card-title">📐 {t('budget.rule2030')}</div>
              {[
                { label: t('budget.needs'), actual: needs, target: income * 0.5, color:'#1a5276', higherIsBetter: false },
                { label: t('budget.wants'), actual: wants, target: income * 0.3, color:'#8e44ad', higherIsBetter: false },
                { label: t('budget.saves'), actual: saves, target: income * 0.2, color:'#1e8449', higherIsBetter: true  },
              ].map((row, i) => {
                const filledPct = row.target > 0 ? Math.min(120, (row.actual / row.target) * 100) : 0;
                const isGood    = row.higherIsBetter ? row.actual >= row.target : row.actual <= row.target;
                return (
                  <div key={i} style={{ marginBottom:'1.1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem' }}>
                      <span style={{ fontWeight:700, fontSize:'.88rem', color: isGood ? 'var(--navy)' : 'var(--danger)' }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize:'.85rem', fontWeight:700, color: isGood ? 'var(--success)' : 'var(--danger)' }}>
                        {fmtUSD(row.actual)}
                        <span style={{ fontWeight:400, color:'var(--muted)', fontSize:'.78rem' }}> / {fmtUSD(row.target)}</span>
                      </span>
                    </div>
                    <div style={{ height:10, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100,filledPct)}%`, background: isGood ? row.color : 'var(--danger)', borderRadius:99, transition:'width .3s' }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--navy)', marginBottom:'.75rem' }}>
                  💡 {t('budget.insightsTitle')}
                </div>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    padding:'.55rem .85rem', borderRadius:8, marginBottom:'.45rem', fontSize:'.83rem', fontWeight:500,
                    background: ins.type === 'warn' ? '#fff8e6' : ins.type === 'good' ? '#eafaf1' : '#eef4ff',
                    color: ins.type === 'warn' ? '#92400e' : ins.type === 'good' ? '#166534' : '#1e40af',
                    borderLeft: `3px solid ${ins.type === 'warn' ? '#d97706' : ins.type === 'good' ? '#22c55e' : '#6366f1'}`,
                  }}>
                    {ins.type === 'warn' ? '⚠ ' : ins.type === 'good' ? '✅ ' : '💡 '}{ins.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">🥧 {t('budget.breakdown')}</div>
              {pieData.length > 0 ? (
                <>
                  <div style={{ height:300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={72} outerRadius={110}
                          dataKey="value"
                          activeIndex={activePieIdx}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, idx) => setActivePieIdx(idx)}
                          onMouseLeave={() => setActivePieIdx(null)}
                          onClick={(_, idx) => {
                            const cat = pieData[idx];
                            setHighlightedCat(h => h === cat.id ? null : cat.id);
                          }}
                          style={{ cursor:'pointer' }}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.color}
                              opacity={activePieIdx === null || activePieIdx === idx ? 1 : 0.45}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => fmtUSD(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="budget-pie-legend">
                    {pieData.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bpl-item"
                        style={{ opacity: activePieIdx === null || activePieIdx === idx ? 1 : 0.4 }}
                        onMouseEnter={() => setActivePieIdx(idx)}
                        onMouseLeave={() => setActivePieIdx(null)}
                        onClick={() => setHighlightedCat(h => h === entry.id ? null : entry.id)}
                      >
                        <span className="bpl-dot" style={{ background: entry.color }} />
                        <span className="bpl-name">{entry.name}</span>
                        <span className="bpl-val">{fmtUSD(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', color:'var(--muted)', padding:'3rem 1rem' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>📊</div>
                  <div style={{ fontSize:'.9rem' }}>{t('budget.noExpenses')}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── EXPENSES ─────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="two-col" style={{ alignItems:'start' }}>
          <div className="card">
            <div className="card-title">➕ {t('budget.addExpense')}</div>
            <div className="field">
              <label>{t('budget.date')}</label>
              <input type="date" value={expForm.date}
                onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="field">
              <label>{t('budget.description')}</label>
              <input type="text" placeholder={t('budget.descPlaceholder')}
                value={expForm.description}
                onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addExpense()} />
            </div>
            <div className="field">
              <label>{t('budget.amount')}</label>
              <input type="number" min={0} step="0.01" placeholder="0.00"
                value={expForm.amount}
                onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addExpense()} />
            </div>
            <div className="field">
              <label>{t('budget.category')}</label>
              <select value={expForm.categoryId}
                onChange={e => setExpForm(f => ({ ...f, categoryId: e.target.value }))}>
                {allCats.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" style={{ width:'100%', marginTop:'.5rem' }} onClick={addExpense}>
              {t('budget.add')} →
            </button>
          </div>

          <div className="card">
            <div className="card-title">📋 {t('budget.recentExpenses')}</div>
            {expenses.length === 0 ? (
              <div style={{ color:'var(--muted)', fontSize:'.9rem', padding:'2rem 0', textAlign:'center' }}>
                {t('budget.noExpenses')}
              </div>
            ) : (
              <div className="budget-exp-list">
                {expenses.map(exp => {
                  const cat = allCats.find(c => c.id === exp.categoryId) ?? allCats[allCats.length - 1];
                  return (
                    <div key={exp.id} className="budget-exp-row">
                      <span className="ber-icon">{cat?.icon ?? '📦'}</span>
                      <div className="ber-info">
                        <div className="ber-desc">{exp.description}</div>
                        <div className="ber-meta">
                          {exp.date} · <span style={{ color: cat?.color ?? 'var(--muted)' }}>{cat?.name}</span>
                        </div>
                      </div>
                      <span className="ber-amt">{fmtUSD(exp.amount)}</span>
                      <button className="ber-del" onClick={() => setExpenses(prev => prev.filter(e => e.id !== exp.id))}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CALENDAR ─────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <button className="btn" style={{ padding:'.4rem 1rem', fontSize:'1.1rem' }} onClick={prevMonth}>‹</button>
            <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)' }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </div>
            <button className="btn" style={{ padding:'.4rem 1rem', fontSize:'1.1rem' }} onClick={nextMonth}>›</button>
          </div>

          <CalendarGrid
            month={calMonth} year={calYear}
            expensesByDay={expensesByDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            allCats={allCats}
          />

          {selectedDay && expensesByDay[selectedDay] && (
            <div style={{ marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, color:'var(--navy)', marginBottom:'.75rem' }}>
                {MONTH_NAMES[calMonth]} {selectedDay}
              </div>
              {expensesByDay[selectedDay].map(exp => {
                const cat = allCats.find(c => c.id === exp.categoryId);
                return (
                  <div key={exp.id} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.5rem 0', borderBottom:'1px solid var(--border)' }}>
                    <span>{cat?.icon ?? '📦'}</span>
                    <span style={{ flex:1, fontSize:'.9rem' }}>{exp.description}</span>
                    <span style={{ fontWeight:700 }}>{fmtUSD(exp.amount)}</span>
                  </div>
                );
              })}
              <div style={{ display:'flex', justifyContent:'flex-end', fontWeight:800, marginTop:'.6rem', color:'var(--navy)', fontSize:'1.05rem' }}>
                {fmtUSD(expensesByDay[selectedDay].reduce((s, e) => s + e.amount, 0))}
              </div>
            </div>
          )}

          {calExpenses.length > 0 && (
            <div style={{ marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontWeight:700, color:'var(--navy)' }}>
              <span>{t('budget.totalSpent')} — {MONTH_NAMES[calMonth]}</span>
              <span>{fmtUSD(calExpenses.reduce((s, e) => s + e.amount, 0))}</span>
            </div>
          )}
        </div>
      )}

      {/* ── NET WORTH ─────────────────────────────────────────────── */}
      {activeTab === 'networth' && (
        <>
          <div
            className="budget-nw-hero"
            style={{ background: netWorth >= 0 ? 'linear-gradient(135deg,#166534,#16a34a)' : 'linear-gradient(135deg,#991b1b,#dc2626)' }}
          >
            <div className="nwh-label">{t('budget.netWorthTotal')}</div>
            <div className="nwh-value">{fmtUSD(netWorth)}</div>
            <div className="nwh-sub">
              {t('budget.assets')}: {fmtUSD(totalAssets)} &nbsp;·&nbsp; {t('budget.liabilities')}: {fmtUSD(totalLiabilities)}
            </div>
          </div>

          <div className="two-col" style={{ alignItems:'start', marginTop:'1.5rem' }}>
            <div className="card">
              <div className="card-title" style={{ color:'var(--success)' }}>📈 {t('budget.assets')}</div>
              {assets.length === 0 && <p style={{ color:'var(--muted)', fontSize:'.88rem', marginBottom:'.75rem' }}>—</p>}
              {assets.map(a => (
                <div key={a.id} className="budget-nw-row">
                  <span className="bnwr-name">{a.name}</span>
                  <span className="bnwr-val" style={{ color:'var(--success)' }}>{fmtUSD(a.value)}</span>
                  <button className="ber-del" style={{ opacity:1 }}
                    onClick={() => setAssets(prev => prev.filter(x => x.id !== a.id))}>✕</button>
                </div>
              ))}
              <div style={{ display:'flex', gap:'.5rem', marginTop:'.85rem', flexWrap:'wrap' }}>
                <input type="text" placeholder={t('budget.assetName')}
                  value={assetForm.name}
                  onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))}
                  style={{ flex:2, minWidth:120 }} />
                <input type="number" min={0} placeholder="$0"
                  value={assetForm.value}
                  onChange={e => setAssetForm(f => ({ ...f, value: e.target.value }))}
                  style={{ flex:1, minWidth:80 }} />
                <button className="btn btn-primary" onClick={() => {
                  if (!assetForm.name.trim() || !assetForm.value) return;
                  setAssets(prev => [...prev, { id: uid(), name: assetForm.name.trim(), value: parseFloat(assetForm.value) || 0 }]);
                  setAssetForm({ name: '', value: '' });
                }}>{t('budget.add')}</button>
              </div>
              <div style={{ marginTop:'.75rem', fontWeight:700, fontSize:'.92rem', color:'var(--success)', textAlign:'right' }}>
                {t('budget.total')}: {fmtUSD(totalAssets)}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ color:'var(--danger)' }}>📉 {t('budget.liabilities')}</div>
              {liabilities.length === 0 && <p style={{ color:'var(--muted)', fontSize:'.88rem', marginBottom:'.75rem' }}>—</p>}
              {liabilities.map(l => (
                <div key={l.id} className="budget-nw-row">
                  <span className="bnwr-name">{l.name}</span>
                  <span className="bnwr-val" style={{ color:'var(--danger)' }}>{fmtUSD(l.value)}</span>
                  <button className="ber-del" style={{ opacity:1 }}
                    onClick={() => setLiabilities(prev => prev.filter(x => x.id !== l.id))}>✕</button>
                </div>
              ))}
              <div style={{ display:'flex', gap:'.5rem', marginTop:'.85rem', flexWrap:'wrap' }}>
                <input type="text" placeholder={t('budget.liabilityName')}
                  value={liabForm.name}
                  onChange={e => setLiabForm(f => ({ ...f, name: e.target.value }))}
                  style={{ flex:2, minWidth:120 }} />
                <input type="number" min={0} placeholder="$0"
                  value={liabForm.value}
                  onChange={e => setLiabForm(f => ({ ...f, value: e.target.value }))}
                  style={{ flex:1, minWidth:80 }} />
                <button className="btn btn-primary" onClick={() => {
                  if (!liabForm.name.trim() || !liabForm.value) return;
                  setLiabilities(prev => [...prev, { id: uid(), name: liabForm.name.trim(), value: parseFloat(liabForm.value) || 0 }]);
                  setLiabForm({ name: '', value: '' });
                }}>{t('budget.add')}</button>
              </div>
              <div style={{ marginTop:'.75rem', fontWeight:700, fontSize:'.92rem', color:'var(--danger)', textAlign:'right' }}>
                {t('budget.total')}: {fmtUSD(totalLiabilities)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
