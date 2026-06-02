import { useT } from '../LanguageContext';
import CardPromo from './CardPromo';

const TOOL_GROUPS = [
  {
    id: 'loans',
    labelKey: 'landing.catLoans',
    tools: [
      { id: 'car',          icon: '🚗', navKey: 'nav.car',          descKey: 'landing.descCar' },
      { id: 'home',         icon: '🏠', navKey: 'nav.home',         descKey: 'landing.descHome' },
      { id: 'personalLoan', icon: '📋', navKey: 'nav.personalLoan', descKey: 'landing.descPersonalLoan' },
    ],
  },
  {
    id: 'income',
    labelKey: 'landing.catIncome',
    tools: [
      { id: 'tax',      icon: '💼', navKey: 'nav.tax',      descKey: 'landing.descTax' },
      { id: 'military', icon: '🎖', navKey: 'nav.military', descKey: 'landing.descMilitary' },
    ],
  },
  {
    id: 'planning',
    labelKey: 'landing.catPlanning',
    tools: [
      { id: 'budget', icon: '📝', navKey: 'nav.budget', descKey: 'landing.descBudget' },
      { id: 'cc',     icon: '💳', navKey: 'nav.cc',     descKey: 'landing.descCc' },
    ],
  },
  {
    id: 'investments',
    labelKey: 'landing.catInvestments',
    tools: [
      { id: 'retirement', icon: '🏦', navKey: 'nav.retirement', descKey: 'landing.descRetirement' },
    ],
  },
  {
    id: 'cards',
    labelKey: 'landing.catCards',
    tools: [
      { id: 'amex', icon: '⭐', navKey: 'nav.amex', descKey: 'landing.descAmex' },
    ],
  },
];

export default function Landing({ onNavigate }) {
  const t = useT();

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

      {/* ── Calculator Groups ───────────────────────────────── */}
      <section className="landing-section landing-tools-section">
        <div className="landing-inner">
          <div className="landing-section-head">
            <h2 className="landing-h2">{t('landing.toolsTitle')}</h2>
            <p className="landing-section-sub">{t('landing.toolsSub')}</p>
          </div>

          <div className="tool-groups">
            {TOOL_GROUPS.map(group => (
              <div key={group.id} className="tool-group-block">
                <div className="tool-group-header">
                  <span className="tool-group-label">{t(group.labelKey)}</span>
                </div>
                <div className="tool-group-grid">
                  {group.tools.map(tool => (
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
              </div>
            ))}
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

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-inner landing-cta-inner">
          <h2 className="landing-h2" style={{ color:'#fff', marginBottom:'.75rem' }}>
            {t('landing.ctaTitle')}
          </h2>
          <p style={{ color:'rgba(255,255,255,.8)', fontSize:'1.05rem', marginBottom:'2rem', maxWidth:520, margin:'0 auto 2rem' }}>
            {t('landing.ctaSub')}
          </p>
          <div className="landing-cta-btns">
            <button className="btn btn-primary landing-btn-lg" onClick={() => onNavigate('car')}>
              🚗 {t('nav.car')}
            </button>
            <button className="btn btn-primary landing-btn-lg" onClick={() => onNavigate('budget')} style={{ background:'var(--success)', borderColor:'var(--success)' }}>
              📝 {t('nav.budget')}
            </button>
            <button className="btn btn-primary landing-btn-lg" onClick={() => onNavigate('personalLoan')} style={{ background:'#d97706', borderColor:'#d97706' }}>
              📋 {t('nav.personalLoan')}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
