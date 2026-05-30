import { useState } from 'react';

const CARDS = [
  {
    id: 'platinum',
    name: 'Platinum Card®',
    tagline: 'The ultimate travel card',
    annual_fee: '$695/yr',
    bonus: '80,000 pts after $8K spend in 6 mo',
    bonus_value: '~$800',
    color: '#8d9097',
    perks: [
      '$200 airline fee credit annually',
      '$200 hotel credit (Fine Hotels + Resorts)',
      '$240 digital entertainment credit',
      'Centurion Lounge + Priority Pass access',
      '5x pts on flights & prepaid hotels (Amex Travel)',
      'Global Entry / TSA PreCheck fee credit',
      '$189 CLEAR® Plus credit',
    ],
    best_for: 'Frequent travelers who use lounge access',
    referral_note: 'Refer a friend and earn up to 55,000 bonus points.',
  },
  {
    id: 'gold',
    name: 'Gold Card®',
    tagline: 'Built for food lovers & travelers',
    annual_fee: '$325/yr',
    bonus: '60,000 pts after $6K spend in 6 mo',
    bonus_value: '~$600',
    color: '#c8a951',
    perks: [
      '4x pts at restaurants worldwide',
      '4x pts at U.S. supermarkets (up to $25K/yr)',
      '3x pts on flights booked direct or via Amex',
      '$120 dining credit (Grubhub, Cheesecake Factory, etc.)',
      '$120 Uber Cash annually',
      'No foreign transaction fees',
    ],
    best_for: 'Foodies who dine out & order delivery often',
    referral_note: 'Refer a friend and earn up to 30,000 bonus points.',
  },
  {
    id: 'green',
    name: 'Green Card®',
    tagline: 'Everyday earn with travel perks',
    annual_fee: '$150/yr',
    bonus: '40,000 pts after $3K spend in 6 mo',
    bonus_value: '~$400',
    color: '#4a7c59',
    perks: [
      '3x pts on travel (transit, hotels, flights)',
      '3x pts at restaurants',
      '1x on all other purchases',
      '$189 CLEAR® Plus credit',
      '$100 LoungeBuddy credit',
      'No foreign transaction fees',
    ],
    best_for: 'Commuters and occasional travelers',
    referral_note: 'Refer a friend and earn up to 10,000 bonus points.',
  },
  {
    id: 'bce',
    name: 'Blue Cash Everyday®',
    tagline: 'No annual fee cash back',
    annual_fee: 'No annual fee',
    bonus: '$200 statement credit after $2K spend in 6 mo',
    bonus_value: '$200',
    color: '#2e86c1',
    perks: [
      '3% cash back at U.S. supermarkets (up to $6K/yr)',
      '3% cash back on U.S. online retail purchases',
      '3% cash back at U.S. gas stations',
      '1% cash back on other purchases',
      '$84 Disney Bundle credit',
      'No annual fee',
    ],
    best_for: 'Everyday spenders who want simple cash back',
    referral_note: 'Refer a friend and earn $100 statement credit.',
  },
  {
    id: 'bcp',
    name: 'Blue Cash Preferred®',
    tagline: 'Max cash back for families',
    annual_fee: '$95/yr (waived yr 1)',
    bonus: '$250 statement credit after $3K spend in 6 mo',
    bonus_value: '$250',
    color: '#1a5276',
    perks: [
      '6% cash back at U.S. supermarkets (up to $6K/yr)',
      '6% cash back on select U.S. streaming services',
      '3% cash back at U.S. gas stations',
      '3% cash back on transit',
      '$84 Disney Bundle credit',
      '1% on all other purchases',
    ],
    best_for: 'Families with high grocery & streaming spend',
    referral_note: 'Refer a friend and earn $100 statement credit.',
  },
  {
    id: 'hilton',
    name: 'Hilton Honors Surpass®',
    tagline: 'Best hotel rewards card',
    annual_fee: '$150/yr',
    bonus: '130,000 Hilton pts after $3K spend in 6 mo',
    bonus_value: '~$780 (Hilton pts)',
    color: '#00205b',
    perks: [
      '12x pts at Hilton properties',
      '6x pts at U.S. restaurants, supermarkets & gas',
      'Hilton Honors Gold status automatically',
      'Free weekend night after $15K spend',
      '$50 quarterly dining credit',
      'No foreign transaction fees',
    ],
    best_for: 'Hilton loyalists who travel regularly',
    referral_note: 'Refer a friend and earn 20,000 Hilton Honors points.',
  },
];

export default function AmexReferral() {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

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
        <div className="amex-badge">⭐ American Express Referrals</div>
        <h2>Refer Friends. Earn Points.</h2>
        <p>
          Share your Amex referral links and earn bonus Membership Rewards points or statement credits
          each time a friend is approved. It's one of the easiest ways to accelerate your rewards balance.
        </p>
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div className="card-title"><span className="icon">🔗</span> Your Referral Link</div>
        <p style={{fontSize:'.88rem', color:'var(--muted)', marginBottom:'1rem'}}>
          Log in to your Amex account → "Refer a Friend" → paste your personal link below to share it easily.
        </p>
        <div style={{display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap'}}>
          <input
            type="url"
            placeholder="Paste your Amex referral link here…"
            value={referralLink}
            onChange={e => setReferralLink(e.target.value)}
            style={{flex:1, minWidth:260, padding:'.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontSize:'.9rem'}}
          />
          <button className="btn btn-primary" onClick={copyLink} disabled={!referralLink}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
        </div>
        <p style={{fontSize:'.78rem', color:'var(--muted)', marginTop:'.6rem'}}>
          Tip: Your referral link is unique to you and the specific card. Get a separate link for each card you want to refer.
        </p>
      </div>

      <h3 style={{color:'var(--navy)', fontWeight:700, marginBottom:'.5rem', fontSize:'1.1rem'}}>Cards You Can Refer</h3>
      <p style={{fontSize:'.88rem', color:'var(--muted)', marginBottom:'1.25rem'}}>
        You can only refer for cards you currently hold. Click "Refer a Friend" on amex.com after selecting the card.
      </p>

      <div className="card-grid">
        {CARDS.map(card => (
          <div key={card.id} className="amex-card">
            <div className="amex-card-header">
              <div>
                <div className="amex-card-name" style={{color: card.color}}>{card.name}</div>
                <div className="amex-card-fee">{card.annual_fee}</div>
              </div>
              <div className="amex-card-bonus">
                <div>Welcome Offer</div>
                <div style={{fontSize:'.9rem', marginTop:'.15rem'}}>{card.bonus_value}</div>
              </div>
            </div>

            <div style={{fontSize:'.82rem', color:'var(--muted)', background:'var(--light)', borderRadius:6, padding:'.5rem .75rem'}}>
              <strong>Welcome Bonus:</strong> {card.bonus}
            </div>

            <ul className="amex-card-perks">
              {card.perks.map((p, i) => <li key={i}>{p}</li>)}
            </ul>

            <div style={{fontSize:'.8rem', background:'#eaf4fb', color:'var(--blue)', borderRadius:6, padding:'.45rem .75rem'}}>
              <strong>Best for:</strong> {card.best_for}
            </div>

            <div style={{fontSize:'.8rem', background:'#fff8e1', color:'#7d5a00', borderRadius:6, padding:'.45rem .75rem'}}>
              💛 {card.referral_note}
            </div>

            <div className="amex-card-cta" onClick={() => window.open('https://www.americanexpress.com/en-us/referral/', '_blank')}>
              <span>Get Your Referral Link →</span>
              <span style={{fontSize:'.75rem', color:'var(--muted)'}}>amex.com</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:'1.5rem', background:'var(--light)'}}>
        <div className="card-title"><span className="icon">💡</span> Referral Tips</div>
        <div className="three-col" style={{gap:'1rem'}}>
          {[
            { icon:'🎯', title:'Get a unique link per card', desc:'Each card you hold has its own referral link. Go to Refer a Friend on amex.com and select the specific card.' },
            { icon:'📣', title:'Share across channels', desc:'Post to social media, text friends, or add to your email signature. More reaches = more approvals.' },
            { icon:'⏱', title:'Points post after approval', desc:'Your referral bonus usually arrives within 8–12 weeks after your friend\'s application is approved.' },
          ].map((t, i) => (
            <div key={i} style={{padding:'1rem', background:'var(--white)', borderRadius:8, border:'1px solid var(--border)'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'.4rem'}}>{t.icon}</div>
              <div style={{fontWeight:700, fontSize:'.9rem', color:'var(--navy)', marginBottom:'.3rem'}}>{t.title}</div>
              <div style={{fontSize:'.83rem', color:'var(--muted)'}}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
