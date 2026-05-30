import { useState } from 'react';
import { useT, useLang } from '../LanguageContext';

const CARDS = [
  {
    id: 'platinum',
    name: 'Platinum Card®',
    annual_fee: '$695/yr',
    bonus: '80,000 pts after $8K spend in 6 mo',
    bonus_value: '~$800',
    color: '#8d9097',
    perks_en: [
      '$200 airline fee credit annually',
      '$200 hotel credit (Fine Hotels + Resorts)',
      '$240 digital entertainment credit',
      'Centurion Lounge + Priority Pass access',
      '5x pts on flights & prepaid hotels (Amex Travel)',
      'Global Entry / TSA PreCheck fee credit',
      '$189 CLEAR® Plus credit',
    ],
    perks_es: [
      'Crédito de $200 en tarifas de aerolíneas anualmente',
      'Crédito de $200 en hoteles (Fine Hotels + Resorts)',
      'Crédito de $240 en entretenimiento digital',
      'Acceso a Centurion Lounge + Priority Pass',
      '5x puntos en vuelos y hoteles prepagados (Amex Travel)',
      'Crédito para Global Entry / TSA PreCheck',
      'Crédito de $189 en CLEAR® Plus',
    ],
    best_for_en: 'Frequent travelers who use lounge access',
    best_for_es: 'Viajeros frecuentes que aprovechan el acceso a salas VIP',
    referral_en: 'Refer a friend and earn up to 55,000 bonus points.',
    referral_es: 'Recomienda un amigo y gana hasta 55,000 puntos de bonificación.',
  },
  {
    id: 'gold',
    name: 'Gold Card®',
    annual_fee: '$325/yr',
    bonus: '60,000 pts after $6K spend in 6 mo',
    bonus_value: '~$600',
    color: '#c8a951',
    perks_en: [
      '4x pts at restaurants worldwide',
      '4x pts at U.S. supermarkets (up to $25K/yr)',
      '3x pts on flights booked direct or via Amex',
      '$120 dining credit (Grubhub, Cheesecake Factory, etc.)',
      '$120 Uber Cash annually',
      'No foreign transaction fees',
    ],
    perks_es: [
      '4x puntos en restaurantes en todo el mundo',
      '4x puntos en supermercados de EE. UU. (hasta $25K/año)',
      '3x puntos en vuelos reservados directo o vía Amex',
      'Crédito de $120 en restaurantes (Grubhub, Cheesecake Factory, etc.)',
      '$120 en Uber Cash al año',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_for_en: 'Foodies who dine out & order delivery often',
    best_for_es: 'Amantes de la gastronomía que comen fuera o piden a domicilio frecuentemente',
    referral_en: 'Refer a friend and earn up to 30,000 bonus points.',
    referral_es: 'Recomienda un amigo y gana hasta 30,000 puntos de bonificación.',
  },
  {
    id: 'green',
    name: 'Green Card®',
    annual_fee: '$150/yr',
    bonus: '40,000 pts after $3K spend in 6 mo',
    bonus_value: '~$400',
    color: '#4a7c59',
    perks_en: [
      '3x pts on travel (transit, hotels, flights)',
      '3x pts at restaurants',
      '1x on all other purchases',
      '$189 CLEAR® Plus credit',
      '$100 LoungeBuddy credit',
      'No foreign transaction fees',
    ],
    perks_es: [
      '3x puntos en viajes (transporte, hoteles, vuelos)',
      '3x puntos en restaurantes',
      '1x en todas las demás compras',
      'Crédito de $189 en CLEAR® Plus',
      'Crédito de $100 en LoungeBuddy',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_for_en: 'Commuters and occasional travelers',
    best_for_es: 'Viajeros de commute y turistas ocasionales',
    referral_en: 'Refer a friend and earn up to 10,000 bonus points.',
    referral_es: 'Recomienda un amigo y gana hasta 10,000 puntos de bonificación.',
  },
  {
    id: 'bce',
    name: 'Blue Cash Everyday®',
    annual_fee: 'No annual fee',
    bonus: '$200 statement credit after $2K spend in 6 mo',
    bonus_value: '$200',
    color: '#2e86c1',
    perks_en: [
      '3% cash back at U.S. supermarkets (up to $6K/yr)',
      '3% cash back on U.S. online retail purchases',
      '3% cash back at U.S. gas stations',
      '1% cash back on other purchases',
      '$84 Disney Bundle credit',
      'No annual fee',
    ],
    perks_es: [
      '3% reembolso en supermercados de EE. UU. (hasta $6K/año)',
      '3% reembolso en compras minoristas en línea de EE. UU.',
      '3% reembolso en gasolineras de EE. UU.',
      '1% reembolso en otras compras',
      'Crédito de $84 en Disney Bundle',
      'Sin cuota anual',
    ],
    best_for_en: 'Everyday spenders who want simple cash back',
    best_for_es: 'Personas que buscan reembolso sencillo en compras diarias',
    referral_en: 'Refer a friend and earn $100 statement credit.',
    referral_es: 'Recomienda un amigo y gana $100 de crédito en estado de cuenta.',
  },
  {
    id: 'bcp',
    name: 'Blue Cash Preferred®',
    annual_fee: '$95/yr (waived yr 1)',
    bonus: '$250 statement credit after $3K spend in 6 mo',
    bonus_value: '$250',
    color: '#1a5276',
    perks_en: [
      '6% cash back at U.S. supermarkets (up to $6K/yr)',
      '6% cash back on select U.S. streaming services',
      '3% cash back at U.S. gas stations',
      '3% cash back on transit',
      '$84 Disney Bundle credit',
      '1% on all other purchases',
    ],
    perks_es: [
      '6% reembolso en supermercados de EE. UU. (hasta $6K/año)',
      '6% reembolso en servicios de streaming de EE. UU.',
      '3% reembolso en gasolineras de EE. UU.',
      '3% reembolso en transporte público',
      'Crédito de $84 en Disney Bundle',
      '1% en todas las demás compras',
    ],
    best_for_en: 'Families with high grocery & streaming spend',
    best_for_es: 'Familias con alto gasto en supermercados y streaming',
    referral_en: 'Refer a friend and earn $100 statement credit.',
    referral_es: 'Recomienda un amigo y gana $100 de crédito en estado de cuenta.',
  },
  {
    id: 'hilton',
    name: 'Hilton Honors Surpass®',
    annual_fee: '$150/yr',
    bonus: '130,000 Hilton pts after $3K spend in 6 mo',
    bonus_value: '~$780 (Hilton pts)',
    color: '#00205b',
    perks_en: [
      '12x pts at Hilton properties',
      '6x pts at U.S. restaurants, supermarkets & gas',
      'Hilton Honors Gold status automatically',
      'Free weekend night after $15K spend',
      '$50 quarterly dining credit',
      'No foreign transaction fees',
    ],
    perks_es: [
      '12x puntos en propiedades Hilton',
      '6x puntos en restaurantes, supermercados y gasolineras de EE. UU.',
      'Estatus Hilton Honors Gold automáticamente',
      'Noche de fin de semana gratis con $15K en gastos',
      'Crédito trimestral de $50 en restaurantes',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_for_en: 'Hilton loyalists who travel regularly',
    best_for_es: 'Fieles a Hilton que viajan con regularidad',
    referral_en: 'Refer a friend and earn 20,000 Hilton Honors points.',
    referral_es: 'Recomienda un amigo y gana 20,000 puntos Hilton Honors.',
  },
];

export default function AmexReferral() {
  const t    = useT();
  const lang = useLang();
  const [referralLink, setReferralLink] = useState('');
  const [copied,       setCopied]       = useState(false);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <div className="amex-hero">
        <div className="amex-badge">{t('amex.badge')}</div>
        <h2>{t('amex.heroTitle')}</h2>
        <p>{t('amex.heroBody')}</p>
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div className="card-title"><span className="icon">🔗</span> {t('amex.yourLink')}</div>
        <p style={{fontSize:'.88rem', color:'var(--muted)', marginBottom:'1rem'}}>{t('amex.linkDesc')}</p>
        <div style={{display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap'}}>
          <input
            type="url"
            placeholder={t('amex.linkPlaceholder')}
            value={referralLink}
            onChange={e => setReferralLink(e.target.value)}
            style={{flex:1, minWidth:260, padding:'.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontSize:'.9rem'}}
          />
          <button className="btn btn-primary" onClick={copyLink} disabled={!referralLink}>
            {copied ? t('amex.copiedBtn') : t('amex.copyBtn')}
          </button>
        </div>
        <p style={{fontSize:'.78rem', color:'var(--muted)', marginTop:'.6rem'}}>{t('amex.linkTip')}</p>
      </div>

      <h3 style={{color:'var(--navy)', fontWeight:700, marginBottom:'.5rem', fontSize:'1.1rem'}}>{t('amex.cardsTitle')}</h3>
      <p style={{fontSize:'.88rem', color:'var(--muted)', marginBottom:'1.25rem'}}>{t('amex.cardsSub')}</p>

      <div className="card-grid">
        {CARDS.map(card => {
          const isEs   = lang === 'es';
          const perks   = isEs ? card.perks_es   : card.perks_en;
          const bestFor = isEs ? card.best_for_es : card.best_for_en;
          const refNote = isEs ? card.referral_es : card.referral_en;

          return (
            <div key={card.id} className="amex-card">
              <div className="amex-card-header">
                <div>
                  <div className="amex-card-name" style={{color: card.color}}>{card.name}</div>
                  <div className="amex-card-fee">{card.annual_fee}</div>
                </div>
                <div className="amex-card-bonus">
                  <div>{t('amex.welcomeOffer')}</div>
                  <div style={{fontSize:'.9rem', marginTop:'.15rem'}}>{card.bonus_value}</div>
                </div>
              </div>

              <div style={{fontSize:'.82rem', color:'var(--muted)', background:'var(--light)', borderRadius:6, padding:'.5rem .75rem'}}>
                <strong>{t('amex.welcomeBonus')}</strong> {card.bonus}
              </div>

              <ul className="amex-card-perks">
                {perks.map((p, i) => <li key={i}>{p}</li>)}
              </ul>

              <div style={{fontSize:'.8rem', background:'#eaf4fb', color:'var(--blue)', borderRadius:6, padding:'.45rem .75rem'}}>
                <strong>{t('amex.bestFor')}</strong> {bestFor}
              </div>

              <div style={{fontSize:'.8rem', background:'#fff8e1', color:'#7d5a00', borderRadius:6, padding:'.45rem .75rem'}}>
                💛 {refNote}
              </div>

              <div className="amex-card-cta" onClick={() => window.open('https://www.americanexpress.com/en-us/referral/', '_blank')}>
                <span>{t('amex.getLink')}</span>
                <span style={{fontSize:'.75rem', color:'var(--muted)'}}>amex.com</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{marginTop:'1.5rem', background:'var(--light)'}}>
        <div className="card-title"><span className="icon">💡</span> {t('amex.tipsTitle').replace('💡 ','')}</div>
        <div className="three-col" style={{gap:'1rem'}}>
          {t('amex.tips').map((tip, i) => (
            <div key={i} style={{padding:'1rem', background:'var(--white)', borderRadius:8, border:'1px solid var(--border)'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'.4rem'}}>{tip.icon}</div>
              <div style={{fontWeight:700, fontSize:'.9rem', color:'var(--navy)', marginBottom:'.3rem'}}>{tip.title}</div>
              <div style={{fontSize:'.83rem', color:'var(--muted)'}}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
