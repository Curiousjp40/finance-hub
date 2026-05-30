import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { creditCardPayoff, simulateDebtPayoff, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';
import { useLocalState } from '../utils/useLocalState';

const CARD_COLORS = ['#c0392b','#1e8449','#1a5276','#8e44ad','#e67e22','#16a085','#d4ac0d'];

const DEFAULT_CARDS = [
  { id: 1, name: 'Card 1', balance: 8500, apr: 22.99, payment: 300 },
];

function buildTimeline(balance, apr, payment) {
  if (!payment || payment <= balance * (apr / 100 / 12)) return [];
  const r = apr / 100 / 12;
  const rows = [];
  let bal = balance, month = 0;
  while (bal > 0.01 && month < 600) {
    const interest = bal * r;
    bal = Math.max(0, bal - (payment - interest));
    month++;
    if (month % 3 === 0 || bal <= 0.01) rows.push({ month, balance: +bal.toFixed(2) });
  }
  return rows;
}

export default function CreditCard() {
  const t = useT();
  const [cards,       setCards]      = useLocalState('cc-cards',   DEFAULT_CARDS);
  const [nextId,      setNextId]     = useLocalState('cc-nextid',  2);
  const [extraBudget, setExtraBudget] = useLocalState('cc-extra',  100);
  const [newCardName, setNewCardName] = useState('');

  function addCard() {
    const name = newCardName.trim() || `Card ${nextId}`;
    setCards(prev => [...prev, { id: nextId, name, balance: 0, apr: 20, payment: 100 }]);
    setNextId(n => n + 1);
    setNewCardName('');
  }

  function updateCard(id, field, value) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function removeCard(id) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  /* Per-card payoff (no extra) */
  const cardResults = useMemo(() => cards.map(c => {
    const r        = c.apr / 100 / 12;
    const payoff   = creditCardPayoff(c.balance, c.apr, c.payment);
    const timeline = buildTimeline(c.balance, c.apr, c.payment);
    return { ...c, r, payoff, timeline };
  }), [cards]);

  const combinedPayment = cards.reduce((s, c) => s + c.payment, 0);
  const totalBalance    = cards.reduce((s, c) => s + c.balance, 0);

  /* Strategy simulations */
  const avalancheResult = useMemo(() => simulateDebtPayoff(cards, extraBudget, 'avalanche'), [cards, extraBudget]);
  const snowballResult  = useMemo(() => simulateDebtPayoff(cards, extraBudget, 'snowball'),  [cards, extraBudget]);

  /* Combined chart */
  const activeCard = cardResults[0];
  const showChart  = cards.length === 1 && activeCard?.timeline?.length > 0;

  function timeStr(months) {
    if (!months) return '—';
    return `${Math.floor(months/12)}${t('cc.yr')} ${months%12}${t('cc.mo')} (${months} ${t('car.months')})`;
  }

  const STRAT = [
    { key:'avalanche', label: t('cc.avalanche'), desc: t('cc.avalancheDesc'), result: avalancheResult, color:'#c0392b' },
    { key:'snowball',  label: t('cc.snowball'),  desc: t('cc.snowballDesc'),  result: snowballResult,  color:'#1e8449' },
  ];

  return (
    <div>
      <p className="page-sub">{t('cc.sub')}</p>

      {/* Add card bar */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.75rem' }}>
          <div className="card-title" style={{ marginBottom:0 }}><span className="icon">💳</span> {t('cc.cards')}</div>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flex:1, maxWidth:380 }}>
            <input
              type="text"
              placeholder={t('cc.cardName')}
              value={newCardName}
              onChange={e => setNewCardName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCard()}
              style={{ flex:1, padding:'.45rem .8rem', border:'1.5px solid var(--border)', borderRadius:7, fontSize:'.88rem' }}
            />
            <button className="btn btn-primary" style={{ padding:'.45rem 1rem', fontSize:'.85rem', whiteSpace:'nowrap' }} onClick={addCard}>
              + {t('cc.addCard')}
            </button>
          </div>
        </div>

        {/* Combined summary */}
        {cards.length > 0 && (
          <div className="cc-summary-grid">
            <div className="result-box">
              <div className="rb-label">{t('cc.balance')}</div>
              <div className="rb-value" style={{ color:'var(--danger)' }}>{fmtUSD(totalBalance)}</div>
            </div>
            <div className="result-box highlight">
              <div className="rb-label">{t('cc.combinedPayment')}</div>
              <div className="rb-value">{fmtUSD2(combinedPayment)}</div>
            </div>
            <div className="result-box">
              <div className="rb-label">{t('cc.dailyInterest')}</div>
              <div className="rb-value" style={{ fontSize:'1.1rem', color:'var(--danger)' }}>
                {fmtUSD2(cards.reduce((s, c) => s + c.balance * c.apr / 100 / 365, 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {cards.length === 0 && (
        <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:'2rem' }}>
          {t('cc.noCards')}
        </div>
      )}

      {/* Per-card inputs + payoff */}
      <div className="two-col">
        <div>
          {cardResults.map((cr, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length];
            const r     = cr.apr / 100 / 12;
            return (
              <div key={cr.id} className="card" style={{ marginBottom:'1rem', borderLeft:`4px solid ${color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'1rem' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <input
                    type="text"
                    value={cr.name}
                    onChange={e => updateCard(cr.id, 'name', e.target.value)}
                    style={{ flex:1, fontWeight:700, fontSize:'1rem', border:'none', background:'transparent', color:'var(--navy)', outline:'none' }}
                  />
                  {cards.length > 1 && (
                    <button
                      onClick={() => removeCard(cr.id)}
                      style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1.1rem', padding:'0 .2rem' }}
                      title={t('cc.removeCard')}
                    >✕</button>
                  )}
                </div>

                <div className="two-col">
                  <div className="field">
                    <label>{t('cc.balance')}</label>
                    <input type="number" value={cr.balance || ''} min={0} step={100}
                      onChange={e => updateCard(cr.id, 'balance', e.target.value === '' ? 0 : +e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('cc.monthlyPmt')}</label>
                    <input type="number" value={cr.payment || ''} min={0} step={10}
                      onChange={e => updateCard(cr.id, 'payment', e.target.value === '' ? 0 : +e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('cc.apr')} — {cr.apr}%</label>
                  <input type="range" min={0} max={36} step={0.01} value={cr.apr}
                    onChange={e => updateCard(cr.id, 'apr', +e.target.value)} />
                  <div className="range-labels"><span>0%</span><span>36%</span></div>
                </div>

                {cr.payoff ? (
                  <div className="payoff-scenario" style={{ borderColor: color }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.83rem', marginBottom:'.3rem' }}>
                      <span style={{ color:'var(--muted)' }}>{t('cc.payoffTime')}</span>
                      <span style={{ fontWeight:700 }}>{timeStr(cr.payoff.months)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.83rem', marginBottom:'.3rem' }}>
                      <span style={{ color:'var(--muted)' }}>{t('cc.totalInterest')}</span>
                      <span style={{ color:'var(--danger)', fontWeight:600 }}>{fmtUSD2(cr.payoff.totalInterest)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.83rem' }}>
                      <span style={{ color:'var(--muted)' }}>{t('cc.monthlyInterest')}</span>
                      <span style={{ color:'var(--danger)', fontWeight:600 }}>{fmtUSD2(cr.balance * r)}</span>
                    </div>
                  </div>
                ) : cr.balance > 0 ? (
                  <p style={{ color:'var(--danger)', fontSize:'.83rem' }}>
                    ⚠ {t('cc.lowPayment').replace('{pmt}', fmtUSD2(cr.payment)).replace('{interest}', fmtUSD2(cr.balance * r))}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Sticky results panel */}
        <div className="sticky-results">
          {/* Strategy comparison */}
          {cards.length >= 1 && (
            <div className="card">
              <div className="card-title"><span className="icon">⚡</span> {t('cc.strategyComparison')}</div>
              <div className="field" style={{ marginBottom:'.75rem' }}>
                <label>{t('cc.extraBudget')} (+{fmtUSD2(extraBudget)}/mo)</label>
                <input type="number" value={extraBudget || ''} min={0} step={25}
                  onChange={e => setExtraBudget(e.target.value === '' ? 0 : +e.target.value)} />
              </div>

              {STRAT.map(s => (
                <div key={s.key} style={{ marginBottom:'1rem', padding:'1rem 1.25rem', borderRadius:10, border:`2px solid ${s.result ? s.color : 'var(--border)'}`, background: s.result ? `${s.color}08` : 'var(--light)' }}>
                  <div style={{ fontWeight:700, fontSize:'.92rem', color: s.result ? s.color : 'var(--muted)', marginBottom:'.2rem' }}>{s.label}</div>
                  <div style={{ fontSize:'.78rem', color:'var(--muted)', marginBottom:'.6rem' }}>{s.desc}</div>
                  {s.result ? (
                    <>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.84rem', marginBottom:'.25rem' }}>
                        <span style={{ color:'var(--muted)' }}>{t('cc.debtFreeIn').replace('{months}', s.result.months)}</span>
                        <span style={{ fontWeight:700, color: s.color }}>{timeStr(s.result.months)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.84rem', marginBottom:'.4rem' }}>
                        <span style={{ color:'var(--muted)' }}>{t('cc.totalInterestPaid')}</span>
                        <span style={{ color:'var(--danger)', fontWeight:700 }}>{fmtUSD2(s.result.totalInterest)}</span>
                      </div>
                      {s.result.payoffMonths.length > 1 && (
                        <div style={{ fontSize:'.78rem', color:'var(--muted)' }}>
                          <strong>{t('cc.payoffOrder')}:</strong>{' '}
                          {[...s.result.payoffMonths]
                            .map((m, i) => ({ name: cards[i]?.name || `Card ${i+1}`, month: m }))
                            .sort((a, b) => (a.month || 9999) - (b.month || 9999))
                            .map((x, i) => (
                              <span key={i}>{i > 0 ? ' → ' : ''}{x.name} (mo {x.month})</span>
                            ))
                          }
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize:'.83rem', color:'var(--danger)' }}>⚠ Payment insufficient to cover interest</span>
                  )}
                </div>
              ))}

              {avalancheResult && snowballResult && (
                <div style={{ background:'#fff8e1', borderRadius:8, padding:'.6rem .85rem', borderLeft:'3px solid #c8a300', fontSize:'.82rem' }}>
                  <strong>💡 Avalanche saves </strong>
                  {fmtUSD2(Math.abs(snowballResult.totalInterest - avalancheResult.totalInterest))} in interest
                  {avalancheResult.months !== snowballResult.months && (
                    <> and {Math.abs(snowballResult.months - avalancheResult.months)} month{Math.abs(snowballResult.months - avalancheResult.months) !== 1 ? 's' : ''}</>
                  )} vs Snowball.
                </div>
              )}
            </div>
          )}

          {/* Single-card scenarios */}
          {cards.length === 1 && cardResults[0]?.payoff && (
            <div className="card">
              <div className="card-title"><span className="icon">📅</span> {t('cc.payoffScenarios')}</div>
              {(() => {
                const cr = cardResults[0];
                const r  = cr.apr / 100 / 12;
                const minPay = creditCardPayoff(cr.balance, cr.apr, Math.max(25, cr.balance * 0.02));
                const boosted = extraBudget > 0 ? creditCardPayoff(cr.balance, cr.apr, cr.payment + extraBudget) : null;

                return (
                  <>
                    <div className="payoff-scenario">
                      <h4>{t('cc.minPayment')}</h4>
                      {minPay ? (
                        <>
                          <div className="ps-row"><span>{t('cc.payoffTime')}</span><span style={{ color:'var(--danger)' }}>{timeStr(minPay.months)}</span></div>
                          <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{ color:'var(--danger)' }}>{fmtUSD2(minPay.totalInterest)}</span></div>
                        </>
                      ) : <p style={{ fontSize:'.83rem', color:'var(--danger)' }}>{t('cc.noPayment')}</p>}
                    </div>

                    <div className="payoff-scenario">
                      <h4>{t('cc.atPayment').replace('{amt}', fmtUSD2(cr.payment))}</h4>
                      <div className="ps-row"><span>{t('cc.payoffTime')}</span><span>{timeStr(cr.payoff.months)}</span></div>
                      <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{ color:'var(--danger)' }}>{fmtUSD2(cr.payoff.totalInterest)}</span></div>
                    </div>

                    {boosted && extraBudget > 0 && (
                      <div className="payoff-scenario best">
                        <h4>{t('cc.withExtra').replace('{extra}', fmtUSD2(extraBudget)).replace('{total}', fmtUSD2(cr.payment + extraBudget))}</h4>
                        <div className="ps-row"><span>{t('cc.payoffTime')}</span><span style={{ color:'var(--success)' }}>{timeStr(boosted.months)}</span></div>
                        <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{ color:'var(--success)' }}>{fmtUSD2(boosted.totalInterest)}</span></div>
                        <div className="ps-row mt-1"><span>{t('cc.interestSaved')}</span><span style={{ color:'var(--success)', fontWeight:700 }}>{fmtUSD2(cr.payoff.totalInterest - boosted.totalInterest)}</span></div>
                        <div className="ps-row mt-1"><span>{t('cc.monthsSaved')}</span><span style={{ color:'var(--success)', fontWeight:700 }}>{cr.payoff.months - boosted.months}</span></div>
                      </div>
                    )}

                    <div className="card-title" style={{ marginTop:'1rem', fontSize:'.95rem' }}><span className="icon">💰</span> {t('cc.keyStats')}</div>
                    <div className="result-grid">
                      <div className="result-box highlight">
                        <div className="rb-label">{t('cc.dailyInterest')}</div>
                        <div className="rb-value" style={{ fontSize:'1.2rem' }}>{fmtUSD2(cr.balance * cr.apr / 100 / 365)}</div>
                      </div>
                      <div className="result-box">
                        <div className="rb-label">{t('cc.monthlyInterest')}</div>
                        <div className="rb-value" style={{ color:'var(--danger)', fontSize:'1.2rem' }}>{fmtUSD2(cr.balance * r)}</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Balance over time chart (single card) */}
      {showChart && (
        <div className="card">
          <div className="card-title"><span className="icon">📉</span> {t('cc.balanceOverTime')}</div>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cardResults[0].timeline} margin={{ top:5, right:20, left:0, bottom:0 }}>
                <XAxis dataKey="month" tick={{ fontSize:11 }} label={{ value: t('car.month'), position:'insideBottom', offset:-2, fontSize:11 }} />
                <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize:11 }} width={52} />
                <Tooltip formatter={v => fmtUSD(v)} labelFormatter={l => `${t('car.month')} ${l}`} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Line type="monotone" dataKey="balance" stroke="#c0392b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
