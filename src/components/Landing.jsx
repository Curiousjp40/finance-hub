import { useState } from 'react';
import { useT } from '../LanguageContext';
import CardPromo from './CardPromo';

const FEATURED = [
  { id: 'car',        icon: '🚗', navKey: 'nav.car',        descKey: 'landing.descCar' },
  { id: 'home',       icon: '🏠', navKey: 'nav.home',       descKey: 'landing.descHome' },
  { id: 'budget',     icon: '📝', navKey: 'nav.budget',     descKey: 'landing.descBudget' },
  { id: 'tax',        icon: '💼', navKey: 'nav.tax',        descKey: 'landing.descTax' },
  { id: 'cc',         icon: '💳', navKey: 'nav.cc',         descKey: 'landing.descCc' },
  { id: 'retirement', icon: '🏦', navKey: 'nav.retirement', descKey: 'landing.descRetirement' },
];

const ALL_TOOLS = [
  { id: 'car',           icon: '🚗', navKey: 'nav.car',           descKey: 'landing.descCar' },
  { id: 'home',          icon: '🏠', navKey: 'nav.home',          descKey: 'landing.descHome' },
  { id: 'personalLoan',  icon: '📋', navKey: 'nav.personalLoan',  descKey: 'landing.descPersonalLoan' },
  { id: 'tax',           icon: '💼', navKey: 'nav.tax',           descKey: 'landing.descTax' },
  { id: 'military',      icon: '🎖', navKey: 'nav.military',      descKey: 'landing.descMilitary' },
  { id: 'budget',        icon: '📝', navKey: 'nav.budget',        descKey: 'landing.descBudget' },
  { id: 'bills',         icon: '📅', navKey: 'nav.bills',         descKey: 'landing.descBills' },
  { id: 'debt',          icon: '💳', navKey: 'nav.debt',          descKey: 'landing.descDebt' },
  { id: 'emergency',     icon: '🆘', navKey: 'nav.emergency',     descKey: 'landing.descEmergency' },
  { id: 'savings',       icon: '🎯', navKey: 'nav.savings',       descKey: 'landing.descSavings' },
  { id: 'subscriptions', icon: '📱', navKey: 'nav.subscriptions', descKey: 'landing.descSubscriptions' },
  { id: 'retirement',    icon: '🏦', navKey: 'nav.retirement',    descKey: 'landing.descRetirement' },
  { id: 'amex',          icon: '⭐', navKey: 'nav.amex',          descKey: 'landing.descAmex' },
  { id: 'cc',            icon: '💳', navKey: 'nav.cc',            descKey: 'landing.descCc' },
];

export default function Landing({ onNavigate }) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const tools = showAll ? ALL_TOOLS : FEATURED;

  return (
    <div className="landing-page">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">{t('landing.badge')}</div>
          <h1 className="landing-h1">{t('landing.heroTitle')}</h1>
          <p className="landing-hero-sub">{t('landing.heroSub')}</p>
          <div className="landing-hero-btns">
            <button
              className="btn btn-primary landing-btn-lg"
              onClick={() => onNavigate('car')}
            >
              {t('landing.heroCta1')}
            </button>
            <button
              className="landing-btn-ghost"
              onClick={() => onNavigate('amex')}
            >
              {t('landing.heroCta2')} →
            </button>
          </div>
          <div className="landing-hero-trust">
            <span>✓ {t('landing.trustFree')}</span>
            <span>✓ {t('landing.trustPrivate')}</span>
            <span>✓ {t('landing.trustNoAds')}</span>
            <span>✓ {t('landing.trustNoSignup')}</span>
          </div>
        </div>
      </section>

      {/* ── Calculator Grid ─────────────────────────────────── */}
      <section className="landing-section landing-tools-section">
        <div className="landing-inner">
          <div className="landing-section-head">
            <h2 className="landing-h2">{t('landing.toolsTitle')}</h2>
            <p className="landing-section-sub">{t('landing.toolsSub')}</p>
          </div>

          <div className="featured-tools-grid">
            {tools.map(tool => (
              <button
                key={tool.id}
                className="landing-tool-card"
                onClick={() => onNavigate(tool.id)}
              >
                <span className="landing-tool-icon">{tool.icon}</span>
                <h3 className="landing-tool-name">{t(tool.navKey)}</h3>
                <p className="landing-tool-desc">{t(tool.descKey)}</p>
                <span className="landing-tool-cta">{t('landing.openTool')} →</span>
              </button>
            ))}
          </div>

          <div className="view-all-wrap">
            {showAll ? (
              <button className="view-all-btn" onClick={() => setShowAll(false)}>
                ← {t('landing.viewFeatured')}
              </button>
            ) : (
              <button className="view-all-btn" onClick={() => setShowAll(true)}>
                {t('landing.viewAll')} →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Featured Cards ─────────────────────────────────── */}
      <section className="landing-section" style={{ background:'var(--light)' }}>
        <div className="landing-inner">
          <div className="landing-section-head">
            <h2 className="landing-h2">{t('landing.cardsTitle')}</h2>
            <p className="landing-section-sub">{t('landing.cardsSub')}</p>
          </div>
          <CardPromo onNavigate={() => onNavigate('amex')} />
        </div>
      </section>

      {/* ── Personal Story ─────────────────────────────────── */}
      <section className="landing-section landing-story-section">
        <div className="landing-inner landing-about-inner">
          <h2 className="landing-h2">{t('landing.aboutTitle')}</h2>
          <blockquote className="landing-quote">
            <p>{t('landing.aboutQuote')}</p>
          </blockquote>
          <p className="landing-about-body">{t('landing.aboutBody1')}</p>
          <p className="landing-about-body">{t('landing.aboutBody2')}</p>
          <div className="landing-stats">
            {[
              { num: '14',   label: t('landing.statTools') },
              { num: '100%', label: t('landing.statFree')  },
              { num: '0',    label: t('landing.statAds')   },
            ].map((s, i) => (
              <div key={i} className="landing-stat">
                <div className="landing-stat-num">{s.num}</div>
                <div className="landing-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
