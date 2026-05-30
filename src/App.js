import { useState } from 'react';
import './styles.css';
import CarLoan      from './components/CarLoan';
import HomeLoan     from './components/HomeLoan';
import Budget       from './components/Budget';
import NetIncome    from './components/NetIncome';
import CreditCard   from './components/CreditCard';
import AmexReferral from './components/AmexReferral';

const TABS = [
  { id: 'car',    label: '🚗 Car Loan',       title: 'Car Loan Calculator' },
  { id: 'home',   label: '🏠 Home Loan',       title: 'Home Loan Calculator' },
  { id: 'budget', label: '📝 Budget Planner',  title: 'Budget Planner' },
  { id: 'tax',    label: '💼 Net Income',       title: 'Net Income After Taxes' },
  { id: 'cc',     label: '💳 Credit Card',      title: 'Credit Card Payoff' },
  { id: 'amex',   label: '⭐ Amex Referrals',   title: 'American Express Referrals' },
];

export default function App() {
  const [tab, setTab] = useState('car');
  const active = TABS.find(t => t.id === tab);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">💰</span>
            FinanceHub
          </div>
          <nav className="nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <h1 className="page-title">{active.title}</h1>

        {tab === 'car'    && <CarLoan />}
        {tab === 'home'   && <HomeLoan />}
        {tab === 'budget' && <Budget />}
        {tab === 'tax'    && <NetIncome />}
        {tab === 'cc'     && <CreditCard />}
        {tab === 'amex'   && <AmexReferral />}
      </main>

      <footer className="footer">
        FinanceHub · Educational estimates only · Not financial advice ·{' '}
        <a href="https://www.americanexpress.com" target="_blank" rel="noreferrer">AmericanExpress.com</a>
      </footer>
    </div>
  );
}
