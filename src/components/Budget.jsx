import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtUSD, fmtUSD2 } from '../utils/finance';

const COLORS = ['#1a5276','#2e86c1','#1e8449','#d4ac0d','#c0392b','#8e44ad','#16a085','#e67e22','#7f8c8d','#2c3e50'];

const DEFAULTS = [
  { name: 'Housing',        amount: 1500 },
  { name: 'Transportation', amount: 400  },
  { name: 'Groceries',      amount: 350  },
  { name: 'Utilities',      amount: 150  },
  { name: 'Dining Out',     amount: 200  },
  { name: 'Healthcare',     amount: 100  },
  { name: 'Entertainment',  amount: 150  },
  { name: 'Savings',        amount: 500  },
  { name: 'Clothing',       amount: 100  },
  { name: 'Other',          amount: 200  },
];

export default function Budget() {
  const [income,     setIncome]     = useState(5000);
  const [categories, setCategories] = useState(DEFAULTS);
  const [newCat,     setNewCat]     = useState('');

  const totalExpenses = useMemo(() => categories.reduce((s, c) => s + (c.amount || 0), 0), [categories]);
  const remaining     = income - totalExpenses;
  const savingsRate   = income > 0 ? ((categories.find(c=>c.name==='Savings')?.amount||0)/income*100) : 0;

  function updateAmount(idx, val) {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, amount: +val || 0 } : c));
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    setCategories(prev => [...prev, { name, amount: 0 }]);
    setNewCat('');
  }

  function removeCategory(idx) {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  }

  const pieData = categories.filter(c => c.amount > 0).map(c => ({ name: c.name, value: c.amount }));

  const statusColor = remaining >= 0 ? 'var(--success)' : 'var(--danger)';

  return (
    <div>
      <p className="page-sub">Track your monthly income and expenses to find where your money goes.</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💵</span> Monthly Income</div>
          <div className="field">
            <label>Take-Home Income (after tax)</label>
            <input type="number" value={income} min={0} onChange={e => setIncome(+e.target.value)} />
          </div>

          <div className="divider" />

          <div className="card-title"><span className="icon">📝</span> Expenses</div>
          {categories.map((c, i) => {
            const pct = income > 0 ? (c.amount / income) * 100 : 0;
            const color = COLORS[i % COLORS.length];
            return (
              <div key={i} className="budget-row">
                <span className="cat-label">{c.name}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: Math.min(100, pct) + '%', background: color }} />
                </div>
                <input
                  type="number" min={0} value={c.amount}
                  onChange={e => updateAmount(i, e.target.value)}
                  style={{width:90, textAlign:'right'}}
                />
                <button
                  onClick={() => removeCategory(i)}
                  style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'1rem',padding:'0 .2rem'}}
                  title="Remove"
                >✕</button>
              </div>
            );
          })}

          <div style={{display:'flex', gap:'.5rem', marginTop:'.75rem'}}>
            <input
              type="text" placeholder="Add category…" value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              style={{flex:1, padding:'.55rem .8rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.9rem'}}
            />
            <button className="btn btn-primary" onClick={addCategory}>Add</button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title"><span className="icon">📊</span> Summary</div>
            <div className="result-grid">
              <div className="result-box">
                <div className="rb-label">Monthly Income</div>
                <div className="rb-value">{fmtUSD(income)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Total Expenses</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD(totalExpenses)}</div>
              </div>
              <div className="result-box" style={{background: remaining >= 0 ? '#eafaf1' : '#fdedec', borderColor: statusColor}}>
                <div className="rb-label" style={{color:'var(--muted)'}}>{remaining >= 0 ? 'Surplus' : 'Deficit'}</div>
                <div className="rb-value" style={{color: statusColor}}>{fmtUSD2(Math.abs(remaining))}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">Savings Rate</div>
                <div className="rb-value">{savingsRate.toFixed(1)}%</div>
                <div className="rb-sub">target: 20%+</div>
              </div>
            </div>

            {remaining < 0 && (
              <div style={{marginTop:'1rem', padding:'.85rem', background:'#fdedec', borderRadius:8, fontSize:'.85rem', color:'var(--danger)'}}>
                ⚠ You're spending <strong>{fmtUSD2(Math.abs(remaining))}/mo</strong> more than you earn. Review your expenses.
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title"><span className="icon">🥧</span> Spending Breakdown</div>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtUSD(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
