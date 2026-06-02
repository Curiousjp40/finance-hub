import { useState, useContext, useEffect } from 'react';
import './styles.css';
import { LanguageProvider, LanguageContext, useT } from './LanguageContext';
import Landing               from './components/Landing';
import CarLoan               from './components/CarLoan';
import HomeLoan              from './components/HomeLoan';
import Budget                from './components/Budget';
import NetIncome             from './components/NetIncome';
import CreditCard            from './components/CreditCard';
import AmexReferral          from './components/AmexReferral';
import Retirement            from './components/Retirement';
import PersonalLoan          from './components/PersonalLoan';
import CardPromo             from './components/CardPromo';
import MilitaryPay           from './components/MilitaryPay';
import BillTracker           from './components/BillTracker';
import DebtTracker           from './components/DebtTracker';
import EmergencyFund         from './components/EmergencyFund';
import SavingsGoals          from './components/SavingsGoals';
import SubscriptionTracker   from './components/SubscriptionTracker';

const NAV_GROUPS = [
  { id: 'loans',       labelKey: 'nav.groupLoans',       ids: ['car', 'home', 'personalLoan'] },
  { id: 'planning',    labelKey: 'nav.groupPlanning',     ids: ['budget', 'bills', 'debt', 'emergency', 'savings', 'subscriptions'] },
  { id: 'income',      labelKey: 'nav.groupIncome',       ids: ['tax', 'military'] },
  { id: 'investments', labelKey: 'nav.groupInvestments',  ids: ['retirement'] },
  { id: 'cards',       labelKey: 'nav.groupCards',        ids: ['amex', 'cc'] },
];

function AppInner() {
  const [tab,      setTab]      = useState('landing');
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggle } = useContext(LanguageContext);
  const t = useT();

  const ALL_TABS = [
    { id: 'car',           label: t('nav.car')           },
    { id: 'home',          label: t('nav.home')          },
    { id: 'personalLoan',  label: t('nav.personalLoan')  },
    { id: 'budget',        label: t('nav.budget')        },
    { id: 'bills',         label: t('nav.bills')         },
    { id: 'debt',          label: t('nav.debt')          },
    { id: 'emergency',     label: t('nav.emergency')     },
    { id: 'savings',       label: t('nav.savings')       },
    { id: 'subscriptions', label: t('nav.subscriptions') },
    { id: 'tax',           label: t('nav.tax')           },
    { id: 'military',      label: t('nav.military')      },
    { id: 'retirement',    label: t('nav.retirement')    },
    { id: 'amex',          label: t('nav.amex')          },
    { id: 'cc',            label: t('nav.cc')            },
  ];

  useEffect(() => {
    document.title = `${t(`titles.${tab}`)} · FinanceHub`;
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function navigate(id) {
    setTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          {/* Logo */}
          <div
            className="logo"
            onClick={() => navigate('landing')}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('landing')}
            aria-label="Go to home page"
          >
            <span className="logo-icon">💰</span>
            {t('nav.brand')}
          </div>

          {/* Desktop nav */}
          <nav className="nav">
            {NAV_GROUPS.map(group => {
              const isGroupActive = group.ids.includes(tab);
              return (
                <div key={group.id} className="nav-group">
                  <button className={`nav-btn nav-group-trigger${isGroupActive ? ' active' : ''}`}>
                    {t(group.labelKey)} <span className="nav-arrow">▾</span>
                  </button>
                  <div className="nav-dropdown">
                    {group.ids.map(id => (
                      <button
                        key={id}
                        className={`nav-dropdown-item${tab === id ? ' active' : ''}`}
                        onClick={() => navigate(id)}
                      >
                        {t(`nav.${id}`)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Lang toggle */}
            <button
              className="nav-btn lang-toggle"
              onClick={toggle}
              title={t('nav.langLabel')}
              style={{ marginLeft:'auto', fontWeight:700, color:'var(--gold)' }}
            >
              🌐 {t('nav.langBtn')}
            </button>
          </nav>

          {/* Hamburger */}
          <button
            className={`hamburger-btn${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(m => !m)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          <button
            className={`mobile-nav-btn${tab === 'landing' ? ' active' : ''}`}
            onClick={() => navigate('landing')}
          >
            🏠 {t('landing.navHome')}
          </button>
          {ALL_TABS.map(tb => (
            <button
              key={tb.id}
              className={`mobile-nav-btn${tab === tb.id ? ' active' : ''}`}
              onClick={() => navigate(tb.id)}
            >
              {tb.label}
            </button>
          ))}
          <button
            className="mobile-nav-btn lang-btn"
            onClick={() => { toggle(); setMenuOpen(false); }}
          >
            🌐 {t('nav.langBtn')}
          </button>
        </div>
      </header>

      {tab === 'landing' ? (
        <Landing onNavigate={navigate} />
      ) : (
        <main className="main">
          <h1 className="page-title">{t(`titles.${tab}`)}</h1>
          {tab === 'car'           && <CarLoan />}
          {tab === 'home'          && <><HomeLoan /><CardPromo onNavigate={() => navigate('amex')} /></>}
          {tab === 'budget'        && <Budget />}
          {tab === 'tax'           && <NetIncome />}
          {tab === 'cc'            && <CreditCard />}
          {tab === 'amex'          && <AmexReferral />}
          {tab === 'retirement'    && <Retirement />}
          {tab === 'personalLoan'  && <PersonalLoan />}
          {tab === 'military'      && <MilitaryPay />}
          {tab === 'bills'         && <BillTracker />}
          {tab === 'debt'          && <DebtTracker />}
          {tab === 'emergency'     && <EmergencyFund />}
          {tab === 'savings'       && <SavingsGoals />}
          {tab === 'subscriptions' && <SubscriptionTracker />}
        </main>
      )}

      <footer className="footer">
        {t('footer')}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
