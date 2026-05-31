import { useT, useLang } from '../LanguageContext';

const FEATURED = [
  {
    id: 'gold',
    name_en: 'Gold Card®',
    name_es: 'Tarjeta Gold®',
    issuer: 'American Express',
    color1: '#B8860B',
    color2: '#7a4f0a',
    bonus_en: '60,000 pts after $6K spend in 6 mo (~$600 value)',
    bonus_es: '60,000 pts tras $6K en gasto en 6 meses (~$600)',
    best_en: 'Restaurants & supermarkets — 4x points',
    best_es: 'Restaurantes y supermercados — 4x puntos',
    fee_en: '$325/yr',
    fee_es: '$325/año',
    url: 'https://americanexpress.com/en-us/referral/gold-card?ref=RYANPmhRc&XLINK=MYCP',
  },
  {
    id: 'bce',
    name_en: 'Blue Cash Everyday®',
    name_es: 'Blue Cash Everyday®',
    issuer: 'American Express',
    color1: '#1a6fa8',
    color2: '#0d3d6b',
    bonus_en: '$200 statement credit after $2K spend in 6 mo',
    bonus_es: '$200 de crédito tras $2K en gasto en 6 meses',
    best_en: 'Gas, groceries & online purchases — 3% cash back',
    best_es: 'Gasolina, supermercados y compras en línea — 3% reembolso',
    fee_en: 'No annual fee',
    fee_es: 'Sin cuota anual',
    url: 'https://americanexpress.com/en-us/referral/blue-cash-everyday-credit-card?ref=RYANP4Duo&XLINK=MYCP',
  },
  {
    id: 'bbp',
    name_en: 'Blue Business Plus®',
    name_es: 'Blue Business Plus®',
    issuer: 'American Express',
    color1: '#1a5276',
    color2: '#0a2342',
    bonus_en: '15,000 pts after $3K spend in 3 mo (~$150 value)',
    bonus_es: '15,000 pts tras $3K en gasto en 3 meses (~$150)',
    best_en: 'Everything else — flat 2x points, no annual fee',
    best_es: 'Todo lo demás — 2x puntos fijos, sin cuota anual',
    fee_en: 'No annual fee',
    fee_es: 'Sin cuota anual',
    url: 'https://americanexpress.com/en-us/referral/bluebusinessplus-credit-card?ref=RYANPhnor&XLINK=MYCP',
  },
];

export default function CardPromo({ onNavigate }) {
  const t = useT();
  const lang = useLang();

  return (
    <div className="card" style={{ marginTop:'2rem', background:'linear-gradient(135deg, #0a2342 0%, #1a5276 100%)', border:'none', color:'#fff' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'1.25rem', fontWeight:800, color:'#fff', marginBottom:'.4rem' }}>
          💳 {t('promo.headline')}
        </div>
        <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--gold)', marginBottom:'.6rem' }}>
          {t('promo.subhead')}
        </div>
        <p style={{ fontSize:'.88rem', color:'rgba(255,255,255,.75)', maxWidth:560, margin:'0 auto' }}>
          {t('promo.description')}
        </p>
      </div>

      {/* Card previews */}
      <div className="three-col" style={{ gap:'1rem', marginBottom:'1.25rem' }}>
        {FEATURED.map(card => (
          <div key={card.id} style={{
            background:'rgba(255,255,255,.07)',
            border:'1px solid rgba(255,255,255,.18)',
            borderRadius:12,
            overflow:'hidden',
          }}>
            {/* Card header band */}
            <div style={{ background:`linear-gradient(135deg, ${card.color1}, ${card.color2})`, padding:'.85rem 1rem' }}>
              <div style={{ fontSize:'.65rem', fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.2rem' }}>
                {card.issuer}
              </div>
              <div style={{ fontSize:'.95rem', fontWeight:800, color:'#fff' }}>
                {lang === 'es' ? card.name_es : card.name_en}
              </div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.7)', marginTop:'.25rem' }}>
                {lang === 'es' ? card.fee_es : card.fee_en}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding:'.85rem 1rem' }}>
              {/* Welcome bonus */}
              <div style={{ background:'rgba(212,172,13,.15)', border:'1px solid rgba(212,172,13,.35)', borderRadius:8, padding:'.6rem .75rem', marginBottom:'.75rem' }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.2rem' }}>
                  {t('promo.welcomeBonus')}
                </div>
                <div style={{ fontSize:'.82rem', fontWeight:700, color:'#fff', lineHeight:1.35 }}>
                  {lang === 'es' ? card.bonus_es : card.bonus_en}
                </div>
              </div>

              {/* Best for */}
              <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.7)', marginBottom:'.85rem', lineHeight:1.4 }}>
                <span style={{ fontWeight:600, color:'rgba(255,255,255,.9)' }}>{t('promo.bestFor')}</span>{' '}
                {lang === 'es' ? card.best_es : card.best_en}
              </div>

              {/* Apply button */}
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'block', textAlign:'center', padding:'.55rem .75rem',
                  background:'var(--gold)', color:'#0a2342',
                  borderRadius:8, fontWeight:800, fontSize:'.84rem',
                  textDecoration:'none', transition:'opacity .18s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity='.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                {t('promo.applyNow')}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* See all cards button */}
      <div style={{ textAlign:'center' }}>
        <button
          onClick={onNavigate}
          style={{
            background:'rgba(255,255,255,.12)',
            border:'1.5px solid rgba(255,255,255,.35)',
            color:'#fff', borderRadius:9,
            padding:'.65rem 1.75rem',
            fontWeight:700, fontSize:'.92rem',
            cursor:'pointer', transition:'background .18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.22)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.12)'}
        >
          {t('promo.seeAll')}
        </button>
      </div>
    </div>
  );
}
