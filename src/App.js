import { useState, useContext, useEffect } from 'react';
import './styles.css';
import { LanguageProvider, LanguageContext, useT } from './LanguageContext';
import CarLoan      from './components/CarLoan';
import HomeLoan     from './components/HomeLoan';
import Budget       from './components/Budget';
import NetIncome    from './components/NetIncome';
import CreditCard   from './components/CreditCard';
import AmexReferral from './components/AmexReferral';
import Retirement   from './components/Retirement';
import PersonalLoan from './components/PersonalLoan';
import CardPromo    from './components/CardPromo';

const NAV_GROUPS = [
  { id: 'loans',      labelKey: 'nav.groupLoans',    ids: ['car', 'home', 'personalLoan'] },
  { id: 'planning',   labelKey: 'nav.groupPlanning', ids: ['budget', 'tax'] },
  { id: 'cards',      labelKey: 'nav.groupCards',    ids: ['cc', 'amex'] },
  { id: 'retirement', labelKey: 'nav.retirement',    ids: ['retirement'], solo: true },
];

function AppInner() {
  const [tab,      setTab]      = useState('car');
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggle } = useContext(LanguageContext);
  const t = useT();

  // Flat list for mobile menu
  const ALL_TABS = [
    { id: 'car',         label: t('nav.car')         },
    { id: 'home',        label: t('nav.home')        },
    { id: 'personalLoan',label: t('nav.personalLoan')},
    { id: 'budget',      label: t('nav.budget')      },
    { id: 'tax',         label: t('nav.tax')         },
    { id: 'cc',          label: t('nav.cc')          },
    { id: 'amex',        label: t('nav.amex')        },
    { id: 'retirement',  label: t('nav.retirement')  },
  ];

  useEffect(() => {
    document.title = `${t(`titles.${tab}`)} · FinanceHub`;
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function navigate(id) {
    setTab(id);
    setMenuOpen(false);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">💰</span>
            {t('nav.brand')}
          </div>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="nav">
            {NAV_GROUPS.map(group => {
              const isGroupActive = group.ids.includes(tab);
              if (group.solo) {
                return (
                  <button
                    key={group.id}
                    className={`nav-btn${isGroupActive ? ' active' : ''}`}
                    onClick={() => setTab(group.ids[0])}
                  >
                    {t(group.labelKey)}
                  </button>
                );
              }
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
                        onClick={() => setTab(id)}
                      >
                        {t(`nav.${id}`)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Lang toggle pinned to far right */}
            <button
              className="nav-btn lang-toggle"
              onClick={toggle}
              title={t('nav.langLabel')}
              style={{ marginLeft:'auto', fontWeight:700, color:'var(--gold)' }}
            >
              🌐 {t('nav.langBtn')}
            </button>
          </nav>

          {/* Hamburger — shown only on mobile */}
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

        {/* Mobile dropdown menu */}
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
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

      <main className="main">
        <h1 className="page-title">{t(`titles.${tab}`)}</h1>

        {tab === 'car'         && <CarLoan />}
        {tab === 'home'        && <><HomeLoan /><CardPromo onNavigate={() => navigate('amex')} /></>}
        {tab === 'budget'      && <Budget />}
        {tab === 'tax'         && <NetIncome />}
        {tab === 'cc'          && <CreditCard />}
        {tab === 'amex'        && <AmexReferral />}
        {tab === 'retirement'  && <Retirement />}
        {tab === 'personalLoan'&& <PersonalLoan />}
      </main>

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
