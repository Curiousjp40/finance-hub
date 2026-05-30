import { useLang } from '../LanguageContext';

const CARDS = [
  {
    id: 'amex-gold',
    name_en: 'Gold Card®',
    name_es: 'Tarjeta Gold®',
    issuer: 'American Express',
    issuerShort: 'AMEX',
    network: 'AMEX',
    color1: '#B8860B',
    color2: '#7a4f0a',
    textColor: '#fff',
    annual_fee_en: '$325/yr',
    annual_fee_es: '$325/año',
    bonus_en: '60,000 pts after $6K spend in 6 mo',
    bonus_es: '60,000 pts tras $6K en gasto en 6 meses',
    bonus_value: '~$600',
    perks_en: [
      '4x pts at restaurants worldwide',
      '4x pts at U.S. supermarkets (up to $25K/yr)',
      '3x pts on flights (direct or Amex Travel)',
      '$120 dining credit (Grubhub, Cheesecake Factory)',
      '$120 Uber Cash annually',
      'No foreign transaction fees',
    ],
    perks_es: [
      '4x puntos en restaurantes en todo el mundo',
      '4x puntos en supermercados de EE. UU. (hasta $25K/año)',
      '3x puntos en vuelos (directo o Amex Travel)',
      'Crédito de $120 en restaurantes (Grubhub, etc.)',
      '$120 en Uber Cash al año',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_en: 'Foodies who dine out & order delivery often',
    best_es: 'Amantes de la gastronomía que comen fuera con frecuencia',
    note_en: 'We use this card for all our restaurants and grocery stores. The 4x points add up fast and it\'s our go-to for everyday spending where we eat and shop most.',
    note_es: 'Usamos esta tarjeta para todos nuestros restaurantes y supermercados. Los puntos 4x se acumulan rápido y es nuestra favorita para los gastos donde más comemos y compramos.',
    url: 'https://americanexpress.com/en-us/referral/gold-card?ref=RYANPmhRc&XLINK=MYCP',
  },
  {
    id: 'amex-bce',
    name_en: 'Blue Cash Everyday®',
    name_es: 'Blue Cash Everyday®',
    issuer: 'American Express',
    issuerShort: 'AMEX',
    network: 'AMEX',
    color1: '#1a6fa8',
    color2: '#0d3d6b',
    textColor: '#fff',
    annual_fee_en: 'No annual fee',
    annual_fee_es: 'Sin cuota anual',
    bonus_en: '$200 statement credit after $2K spend in 6 mo',
    bonus_es: '$200 de crédito tras $2K en gasto en 6 meses',
    bonus_value: '$200',
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
    best_en: 'Everyday spenders who want simple cash back',
    best_es: 'Personas que buscan reembolso sencillo en compras diarias',
    note_en: 'This is a great starting card if you don\'t want to pay an annual fee. You get 3% back at gas stations, 3% on groceries, and 3% on online purchases. Solid choice for anyone wanting simple cash back with no cost.',
    note_es: 'Esta es una excelente tarjeta inicial si no quieres pagar cuota anual. Obtienes 3% de reembolso en gasolineras, 3% en supermercados y 3% en compras en línea. Una opción sólida para quienes buscan reembolso simple sin costo.',
    url: 'https://americanexpress.com/en-us/referral/blue-cash-everyday-credit-card?ref=RYANP4Duo&XLINK=MYCP',
  },
  {
    id: 'amex-bbp',
    name_en: 'Blue Business Plus®',
    name_es: 'Blue Business Plus®',
    issuer: 'American Express',
    issuerShort: 'AMEX',
    network: 'AMEX',
    color1: '#1a5276',
    color2: '#0a2342',
    textColor: '#fff',
    annual_fee_en: 'No annual fee',
    annual_fee_es: 'Sin cuota anual',
    bonus_en: '15,000 pts after $3K spend in 3 mo',
    bonus_es: '15,000 pts tras $3K en gasto en 3 meses',
    bonus_value: '~$150',
    perks_en: [
      '2x pts on all purchases (up to $50K/yr)',
      '1x pts on purchases above $50K',
      'No annual fee',
      'Employee cards at no extra cost',
      'Expense management tools',
      'No foreign transaction fees',
    ],
    perks_es: [
      '2x puntos en todas las compras (hasta $50K/año)',
      '1x puntos en compras superiores a $50K',
      'Sin cuota anual',
      'Tarjetas para empleados sin costo adicional',
      'Herramientas de gestión de gastos',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_en: 'Small business owners who want simple flat-rate rewards',
    best_es: 'Dueños de pequeñas empresas que buscan recompensas simples',
    note_en: 'We use this for everything else — gas, bills, subscriptions, anything that doesn\'t earn bonus points on the Gold. You get 2% back on all purchases with no annual fee. You do NOT need a legitimate LLC to get this card — anyone can apply as a sole proprietor.',
    note_es: 'La usamos para todo lo demás — gasolina, facturas, suscripciones, todo lo que no gana puntos extra en la Gold. Obtienes 2% de reembolso en todas las compras sin cuota anual. NO necesitas una LLC legítima para esta tarjeta — cualquiera puede aplicar como trabajador independiente.',
    url: 'https://americanexpress.com/en-us/referral/bluebusinessplus-credit-card?ref=RYANPhnor&XLINK=MYCP',
  },
  {
    id: 'discover-student',
    name_en: 'Discover it® Student',
    name_es: 'Discover it® Estudiante',
    issuer: 'Discover',
    issuerShort: 'DISCOVER',
    network: 'DISC',
    color1: '#E86400',
    color2: '#B34A00',
    textColor: '#fff',
    annual_fee_en: 'No annual fee',
    annual_fee_es: 'Sin cuota anual',
    bonus_en: 'Cashback Match™ — all cash back doubled at end of year 1',
    bonus_es: 'Cashback Match™ — todo el reembolso se duplica al final del año 1',
    bonus_value: '2× yr 1',
    perks_en: [
      '5% cash back on rotating quarterly categories',
      '1% cash back on all other purchases',
      'Cashback Match™ doubles all rewards year 1',
      'No credit score required to apply',
      'No annual fee, no late fee on first missed payment',
      'Free FICO® Credit Score monitoring',
    ],
    perks_es: [
      '5% reembolso en categorías rotativas cada trimestre',
      '1% reembolso en todas las demás compras',
      'Cashback Match™ duplica todas las recompensas el año 1',
      'No se requiere historial crediticio para aplicar',
      'Sin cuota anual, sin cargo por primer pago tardío',
      'Monitoreo gratuito de puntuación crediticia FICO®',
    ],
    best_en: 'College students building credit for the first time',
    best_es: 'Estudiantes universitarios construyendo su historial crediticio',
    note_en: 'Perfect card to build credit. Rotating quarterly categories like gas, Amazon, and restaurants earn 5% cash back. Great for students or anyone just starting out with no annual fee.',
    note_es: 'Tarjeta perfecta para construir crédito. Las categorías rotativas trimestrales como gasolina, Amazon y restaurantes ganan 5% de reembolso. Ideal para estudiantes o cualquier persona que esté comenzando, sin cuota anual.',
    url: 'https://www.discovercard.com/application/website/apply?srcCde=RJWW&extole_zone_shareable_code=rjpohlman034&extole_share_channel=EXTOLE_EMAIL&extole_zone_name=blank&extole_zone_click_event_id=7645805379395169374&srcCde=RJWW&cmpgnid=raf-dca-consumer-it&scmpgnid=7595607159513222530_7645798708708575489&iq_id=yraf_1508309757_em_74_325577787659&extole_shareable_code=rjpohlman034&source=RAF',
  },
  {
    id: 'bofa-cash',
    name_en: 'Customized Cash Rewards',
    name_es: 'Recompensas en Efectivo',
    issuer: 'Bank of America',
    issuerShort: 'BOFA',
    network: 'VISA',
    color1: '#C8001F',
    color2: '#7a0012',
    textColor: '#fff',
    annual_fee_en: 'No annual fee',
    annual_fee_es: 'Sin cuota anual',
    bonus_en: '$200 statement credit after $1K spend in 90 days',
    bonus_es: '$200 de crédito tras $1K en gasto en 90 días',
    bonus_value: '$200',
    perks_en: [
      '3% cash back in your choice category',
      '2% cash back at grocery stores & wholesale clubs',
      '1% cash back on all other purchases',
      'Choose your 3% category each month',
      'No annual fee',
      'Preferred Rewards members earn more',
    ],
    perks_es: [
      '3% reembolso en la categoría que elijas',
      '2% reembolso en supermercados y clubes de mayoreo',
      '1% reembolso en todas las demás compras',
      'Cambia tu categoría del 3% cada mes',
      'Sin cuota anual',
      'Los miembros Preferred Rewards ganan más',
    ],
    best_en: 'Flexible spenders who want to maximize a custom category',
    best_es: 'Quienes buscan maximizar recompensas en una categoría a su elección',
    note_en: 'A solid no annual fee card great for anyone starting to build credit or wanting simple flexible cash back in a category of their choice.',
    note_es: 'Una excelente tarjeta sin cuota anual, ideal para quienes están comenzando a construir crédito o quieren reembolso flexible y sencillo en la categoría de su elección.',
    url: 'https://www.bankofamerica.com/refer?prod=ccr&refid=G3B3XPVO-CCCR01',
  },
  {
    id: 'capital-one-savor',
    name_en: 'Savor Rewards',
    name_es: 'Savor Rewards',
    issuer: 'Capital One',
    issuerShort: 'CAP1',
    network: 'MC',
    color1: '#004977',
    color2: '#002440',
    textColor: '#fff',
    annual_fee_en: 'No annual fee',
    annual_fee_es: 'Sin cuota anual',
    bonus_en: '$200 cash bonus after $500 spend in 3 mo',
    bonus_es: '$200 de bono en efectivo tras $500 en gasto en 3 meses',
    bonus_value: '$200',
    perks_en: [
      '3% cash back at grocery stores',
      '3% cash back on dining & entertainment',
      '3% cash back on popular streaming services',
      '1% on all other purchases',
      'No annual fee',
      'No foreign transaction fees',
    ],
    perks_es: [
      '3% reembolso en supermercados',
      '3% reembolso en restaurantes y entretenimiento',
      '3% reembolso en servicios de streaming populares',
      '1% en todas las demás compras',
      'Sin cuota anual',
      'Sin comisiones por transacciones en el extranjero',
    ],
    best_en: 'Everyday spenders who love food, fun & streaming',
    best_es: 'Quienes disfrutan comida, entretenimiento y streaming',
    note_en: 'Great no annual fee option for dining and entertainment lovers. 3% back on restaurants, groceries, and streaming with no annual fee makes it an easy card to hold.',
    note_es: 'Excelente opción sin cuota anual para los amantes de la gastronomía y el entretenimiento. El 3% de reembolso en restaurantes, supermercados y streaming sin cuota anual la hace una tarjeta fácil de conservar.',
    url: 'https://i.capitalone.com/J4Esp4Bjp',
  },
];

const CHIME = {
  id: 'chime',
  name_en: 'Chime',
  name_es: 'Chime',
  issuer: 'Chime',
  issuerShort: 'CHIME',
  network: 'VISA',
  color1: '#00A86B',
  color2: '#005A36',
  textColor: '#fff',
  annual_fee_en: 'No monthly fees',
  annual_fee_es: 'Sin cuotas mensuales',
  bonus_en: '$100 bonus when you receive $200+ direct deposit',
  bonus_es: '$100 de bono al recibir $200+ en depósito directo',
  bonus_value: '$100',
  perks_en: [
    'No monthly fees, no minimum balance',
    'Get paid up to 2 days early with direct deposit',
    'SpotMe® — fee-free overdraft up to $200',
    '60,000+ fee-free ATMs',
    'Automatic savings round-ups',
    'Credit Builder secured card available',
  ],
  perks_es: [
    'Sin cuotas mensuales ni saldo mínimo',
    'Recibe tu pago hasta 2 días antes con depósito directo',
    'SpotMe® — sobregiro sin comisión hasta $200',
    'Más de 60,000 cajeros automáticos sin comisión',
    'Ahorro automático con redondeo de compras',
    'Tarjeta Credit Builder asegurada disponible',
  ],
  best_en: 'Anyone who wants fee-free banking with early pay',
  best_es: 'Cualquiera que quiera banco sin comisiones y pago anticipado',
  note_en: 'Fee-free banking with no minimum balance, get paid up to 2 days early with direct deposit, and access to over 60,000 fee-free ATMs. A great option for anyone looking for a simple no-cost bank account.',
  note_es: 'Banca sin comisiones sin saldo mínimo, recibe tu pago hasta 2 días antes con depósito directo y acceso a más de 60,000 cajeros sin costo. Una excelente opción para quien busca una cuenta bancaria sencilla y sin costo.',
  url: 'https://www.chime.com/r/roxielyslopez/?c=s',
};

const NETWORK_LABELS = { AMEX: 'AMEX', VISA: 'VISA', MC: 'MC', DISC: 'Discover' };

export default function AmexReferral() {
  const lang = useLang();
  const isEs = lang === 'es';

  const pageSub    = isEs
    ? 'Aplica a través de estos enlaces de referencia y ayuda a alguien a ganar un bono.'
    : 'Apply through these referral links and help someone earn a bonus.';
  const applyNow     = isEs ? 'Aplicar Ahora' : 'Apply Now';
  const openAccount  = isEs ? 'Abrir Cuenta' : 'Open Account';
  const annualFee    = isEs ? 'Cuota Anual' : 'Annual Fee';
  const bonusLabel   = isEs ? 'Bono de Bienvenida' : 'Welcome Bonus';
  const bonusVal     = isEs ? 'Valor' : 'Value';
  const bestFor      = isEs ? 'Ideal para' : 'Best For';
  const perksLabel   = isEs ? 'Beneficios' : 'Key Benefits';
  const iUseLabel    = isEs ? 'Mi experiencia' : 'My experience';
  const bankingTitle = isEs ? 'Banca' : 'Banking';
  const bankingSub   = isEs ? 'Cuentas bancarias recomendadas' : 'Recommended bank accounts';

  return (
    <div>
      <p className="page-sub">{pageSub}</p>

      <div className="ref-cards-grid">
        {CARDS.map(card => {
          const name   = isEs ? card.name_es   : card.name_en;
          const fee    = isEs ? card.annual_fee_es : card.annual_fee_en;
          const bonus  = isEs ? card.bonus_es   : card.bonus_en;
          const perks  = isEs ? card.perks_es   : card.perks_en;
          const best   = isEs ? card.best_es    : card.best_en;
          const note   = isEs ? card.note_es    : card.note_en;
          const netLabel = NETWORK_LABELS[card.network] || card.network;

          return (
            <div key={card.id} className="bc">
              {/* Header */}
              <div
                className="bc-header"
                style={{ background: `linear-gradient(145deg, ${card.color1}, ${card.color2})` }}
              >
                <div className="bc-top-row">
                  <span className="bc-issuer-label" style={{ color: card.textColor, opacity:.75 }}>
                    {card.issuerShort}
                  </span>
                  <span className="bc-network-pill" style={{ color: card.textColor }}>{netLabel}</span>
                </div>
                <div className="bc-card-mock" style={{ background: `linear-gradient(135deg, ${card.color1}cc, ${card.color2})` }}>
                  <div className="bc-chip" />
                  <div className="bc-card-dots" style={{ color: card.textColor }}>•••• •••• •••• ••••</div>
                  <div className="bc-card-brand" style={{ color: card.textColor, opacity:.85 }}>{card.issuerShort}</div>
                  <div className="bc-card-net" style={{ color: card.textColor }}>{netLabel}</div>
                </div>
              </div>

              {/* Body */}
              <div className="bc-body">
                <div className="bc-issuer-small">{card.issuer}</div>
                <div className="bc-name">{name}</div>

                <div className="bc-stats">
                  <div className="bc-stat-box">
                    <div className="bc-stat-lbl">{annualFee}</div>
                    <div className="bc-stat-val">{fee}</div>
                  </div>
                  <div className="bc-stat-box">
                    <div className="bc-stat-lbl">{bonusVal}</div>
                    <div className="bc-stat-val" style={{ color:'var(--success)' }}>{card.bonus_value}</div>
                  </div>
                </div>

                <div className="bc-bonus">
                  <div className="bc-bonus-lbl">{bonusLabel}</div>
                  <div className="bc-bonus-txt">{bonus}</div>
                </div>

                <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--muted)', marginBottom:'.4rem' }}>
                  {perksLabel}
                </div>
                <ul className="bc-perks">
                  {perks.map((p, i) => (
                    <li key={i} className="bc-perk">
                      <span className="bc-perk-check">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="bc-best">
                  <div className="bc-best-lbl">{bestFor}</div>
                  <div className="bc-best-val">{best}</div>
                </div>

                {/* Personal note */}
                <div className="bc-note">
                  <div className="bc-note-lbl">{iUseLabel}</div>
                  {note}
                </div>

                <a
                  className="bc-apply"
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: card.color1, color: card.textColor }}
                >
                  {applyNow} →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banking section */}
      <div style={{ marginTop:'2.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.25rem' }}>
          <div style={{ flex:1, height:2, background:'var(--border)' }} />
          <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)', letterSpacing:'.04em', textTransform:'uppercase' }}>
            🏦 {bankingTitle}
          </div>
          <div style={{ flex:1, height:2, background:'var(--border)' }} />
        </div>
        <p style={{ textAlign:'center', color:'var(--muted)', fontSize:'.88rem', marginBottom:'1.5rem', marginTop:0 }}>{bankingSub}</p>
        <div className="ref-cards-grid">
          {(() => {
            const card = CHIME;
            const name   = isEs ? card.name_es   : card.name_en;
            const fee    = isEs ? card.annual_fee_es : card.annual_fee_en;
            const bonus  = isEs ? card.bonus_es   : card.bonus_en;
            const perks  = isEs ? card.perks_es   : card.perks_en;
            const best   = isEs ? card.best_es    : card.best_en;
            const note   = isEs ? card.note_es    : card.note_en;
            const netLabel = NETWORK_LABELS[card.network] || card.network;
            return (
              <div key={card.id} className="bc">
                <div className="bc-header" style={{ background: `linear-gradient(145deg, ${card.color1}, ${card.color2})` }}>
                  <div className="bc-top-row">
                    <span className="bc-issuer-label" style={{ color: card.textColor, opacity:.75 }}>{card.issuerShort}</span>
                    <span className="bc-network-pill" style={{ color: card.textColor }}>{netLabel}</span>
                  </div>
                  <div className="bc-card-mock" style={{ background: `linear-gradient(135deg, ${card.color1}cc, ${card.color2})` }}>
                    <div className="bc-chip" />
                    <div className="bc-card-dots" style={{ color: card.textColor }}>•••• •••• •••• ••••</div>
                    <div className="bc-card-brand" style={{ color: card.textColor, opacity:.85 }}>{card.issuerShort}</div>
                    <div className="bc-card-net" style={{ color: card.textColor }}>{netLabel}</div>
                  </div>
                </div>
                <div className="bc-body">
                  <div className="bc-issuer-small">{card.issuer}</div>
                  <div className="bc-name">{name}</div>
                  <div className="bc-stats">
                    <div className="bc-stat-box">
                      <div className="bc-stat-lbl">{annualFee}</div>
                      <div className="bc-stat-val">{fee}</div>
                    </div>
                    <div className="bc-stat-box">
                      <div className="bc-stat-lbl">{bonusVal}</div>
                      <div className="bc-stat-val" style={{ color:'var(--success)' }}>{card.bonus_value}</div>
                    </div>
                  </div>
                  <div className="bc-bonus">
                    <div className="bc-bonus-lbl">{bonusLabel}</div>
                    <div className="bc-bonus-txt">{bonus}</div>
                  </div>
                  <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--muted)', marginBottom:'.4rem' }}>
                    {perksLabel}
                  </div>
                  <ul className="bc-perks">
                    {perks.map((p, i) => (
                      <li key={i} className="bc-perk">
                        <span className="bc-perk-check">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bc-best">
                    <div className="bc-best-lbl">{bestFor}</div>
                    <div className="bc-best-val">{best}</div>
                  </div>
                  <div className="bc-note">
                    <div className="bc-note-lbl">{iUseLabel}</div>
                    {note}
                  </div>
                  <a
                    className="bc-apply"
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: card.color1, color: card.textColor }}
                  >
                    {openAccount} →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
