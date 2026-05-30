import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { creditCardPayoff, fmtUSD, fmtUSD2 } from '../utils/finance';
import { useT } from '../LanguageContext';

export default function CreditCard() {
  const t = useT();
  const [balance, setBalance] = useState(8500);
  const [apr,     setApr]     = useState(22.99);
  const [payment, setPayment] = useState(300);
  const [extra,   setExtra]   = useState(100);

  const r       = apr / 100 / 12;
  const base    = useMemo(() => creditCardPayoff(balance, apr, payment),         [balance, apr, payment]);
  const boosted = useMemo(() => creditCardPayoff(balance, apr, payment + extra), [balance, apr, payment, extra]);
  const minPay  = useMemo(() => creditCardPayoff(balance, apr, Math.max(25, balance * 0.02)), [balance, apr]);

  function buildTimeline(monthlyPmt) {
    if (!monthlyPmt || monthlyPmt <= balance * r) return [];
    const rows = [];
    let bal = balance;
    let month = 0;
    while (bal > 0.01 && month < 600) {
      const interest = bal * r;
      bal = Math.max(0, bal - (monthlyPmt - interest));
      month++;
      if (month % 3 === 0 || bal <= 0.01) rows.push({ month, balance: +bal.toFixed(2) });
    }
    return rows;
  }

  const baseTimeline    = useMemo(() => buildTimeline(payment),         [balance, apr, payment]);         // eslint-disable-line react-hooks/exhaustive-deps
  const boostedTimeline = useMemo(() => buildTimeline(payment + extra), [balance, apr, payment, extra]);  // eslint-disable-line react-hooks/exhaustive-deps

  const basePmtKey  = t('cc.basePayment');
  const extraPmtKey = t('cc.extraPayment');

  const chartData = baseTimeline.map((r, i) => ({
    month: r.month,
    [basePmtKey]:  r.balance,
    [extraPmtKey]: boostedTimeline[i]?.balance ?? 0,
  }));

  const savedMonths   = base && boosted ? base.months - boosted.months : 0;
  const savedInterest = base && boosted ? base.totalInterest - boosted.totalInterest : 0;

  function timeStr(months) {
    return `${Math.floor(months/12)}${t('cc.yr')} ${months%12}${t('cc.mo')} (${months} ${t('car.months')})`;
  }

  return (
    <div>
      <p className="page-sub">{t('cc.sub')}</p>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><span className="icon">💳</span> {t('cc.cardDetails')}</div>

          <div className="field">
            <label>{t('cc.balance')}</label>
            <input type="number" value={balance} min={0} step={100} onChange={e => setBalance(+e.target.value)} />
          </div>
          <div className="field">
            <label>{t('cc.apr')} — {apr}%</label>
            <input type="range" min={0} max={36} step={0.01} value={apr} onChange={e => setApr(+e.target.value)} />
            <div className="range-labels"><span>0%</span><span>36%</span></div>
          </div>
          <div className="field">
            <label>{t('cc.monthlyPmt')}</label>
            <input type="number" value={payment} min={0} step={10} onChange={e => setPayment(+e.target.value)} />
          </div>
          <div className="field">
            <label>{t('cc.extraPmt')}</label>
            <input type="number" value={extra} min={0} step={10} onChange={e => setExtra(+e.target.value)} />
          </div>
        </div>

        <div>
          {base ? (
            <div className="card">
              <div className="card-title"><span className="icon">📅</span> {t('cc.payoffScenarios')}</div>

              <div className="payoff-scenario">
                <h4>{t('cc.minPayment')}</h4>
                {minPay ? (
                  <div>
                    <div className="ps-row"><span>{t('cc.payoffTime')}</span><span style={{color:'var(--danger)'}}>{timeStr(minPay.months)}</span></div>
                    <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{color:'var(--danger)'}}>{fmtUSD2(minPay.totalInterest)}</span></div>
                    <div className="ps-row mt-1"><span>{t('cc.totalPaid')}</span><span>{fmtUSD2(minPay.totalPaid)}</span></div>
                  </div>
                ) : <p style={{fontSize:'.83rem', color:'var(--danger)'}}>{t('cc.noPayment')}</p>}
              </div>

              <div className="payoff-scenario">
                <h4>{t('cc.atPayment').replace('{amt}', fmtUSD2(payment))}</h4>
                <div className="ps-row"><span>{t('cc.payoffTime')}</span><span>{timeStr(base.months)}</span></div>
                <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{color:'var(--danger)'}}>{fmtUSD2(base.totalInterest)}</span></div>
                <div className="ps-row mt-1"><span>{t('cc.totalPaid')}</span><span>{fmtUSD2(base.totalPaid)}</span></div>
              </div>

              {extra > 0 && boosted && (
                <div className="payoff-scenario best">
                  <h4>{t('cc.withExtra').replace('{extra}', fmtUSD2(extra)).replace('{total}', fmtUSD2(payment+extra))}</h4>
                  <div className="ps-row"><span>{t('cc.payoffTime')}</span><span style={{color:'var(--success)'}}>{timeStr(boosted.months)}</span></div>
                  <div className="ps-row mt-1"><span>{t('cc.totalInterest')}</span><span style={{color:'var(--success)'}}>{fmtUSD2(boosted.totalInterest)}</span></div>
                  <div className="ps-row mt-1"><span>{t('cc.interestSaved')}</span><span style={{color:'var(--success)', fontWeight:700}}>{fmtUSD2(savedInterest)}</span></div>
                  <div className="ps-row mt-1"><span>{t('cc.monthsSaved')}</span><span style={{color:'var(--success)', fontWeight:700}}>{savedMonths}</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <p style={{color:'var(--danger)'}}>
                ⚠ {t('cc.lowPayment').replace('{pmt}', fmtUSD2(payment)).replace('{interest}', fmtUSD2(balance * r))}
              </p>
            </div>
          )}

          <div className="card">
            <div className="card-title"><span className="icon">💰</span> {t('cc.keyStats')}</div>
            <div className="result-grid">
              <div className="result-box highlight">
                <div className="rb-label">{t('cc.dailyInterest')}</div>
                <div className="rb-value">{fmtUSD2(balance * apr / 100 / 365)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('cc.monthlyInterest')}</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD2(balance * r)}</div>
              </div>
              <div className="result-box">
                <div className="rb-label">{t('cc.annualInterest')}</div>
                <div className="rb-value" style={{color:'var(--danger)'}}>{fmtUSD2(balance * apr / 100)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="card-title"><span className="icon">📉</span> {t('cc.balanceOverTime')}</div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{top:5, right:20, left:0, bottom:0}}>
                <XAxis dataKey="month" tick={{fontSize:11}} label={{value: t('car.month'), position:'insideBottom', offset:-2, fontSize:11}} />
                <YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'} tick={{fontSize:11}} width={52} />
                <Tooltip formatter={v=>fmtUSD(v)} labelFormatter={l=>`${t('car.month')} ${l}`} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Line type="monotone" dataKey={basePmtKey}  stroke="#c0392b" strokeWidth={2} dot={false} />
                {extra > 0 && <Line type="monotone" dataKey={extraPmtKey} stroke="#1e8449" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
