/* ────────────────────────────────────────────────────────────
   CSV Parser — auto-detects Chase, BofA, Capital One,
   Discover, and American Express statement formats.
   ──────────────────────────────────────────────────────────── */

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseDate(s) {
  if (!s) return null;
  s = s.trim();
  // MM/DD/YYYY or M/D/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // MM-DD-YYYY
  const mdy2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy2) return `${mdy2[3]}-${mdy2[1].padStart(2, '0')}-${mdy2[2].padStart(2, '0')}`;
  return null;
}

function cleanAmt(s) {
  return parseFloat((s || '').replace(/[$,\s]/g, ''));
}

function detectBank(headerLine) {
  const h = headerLine.toLowerCase();
  if (h.includes('transaction date') && h.includes('post date') && h.includes('memo')) return 'chase';
  if (h.includes('posted date') && h.includes('reference number') && h.includes('payee')) return 'bofa';
  if (h.includes('card no')) return 'capital_one';
  if (h.includes('trans. date') || (h.includes('trans date') && h.includes('post date') && !h.includes('memo'))) return 'discover';
  if (h.includes('extended details') || h.includes('appears on your statement')) return 'amex';
  return 'generic';
}

function parseRow(cols, bank, headers) {
  try {
    let date = null, description = '', amount = 0;
    switch (bank) {
      case 'chase':
        // Transaction Date, Post Date, Description, Category, Type, Amount, Memo
        date        = parseDate(cols[0]);
        description = (cols[2] || '').trim();
        amount      = cleanAmt(cols[5]);
        if (isNaN(amount) || amount >= 0) return null; // negative = debit
        amount      = Math.abs(amount);
        break;
      case 'bofa':
        // Posted Date, Reference Number, Payee, Address, Amount
        date        = parseDate(cols[0]);
        description = (cols[2] || '').trim();
        amount      = cleanAmt(cols[4]);
        if (isNaN(amount) || amount >= 0) return null; // negative = debit
        amount      = Math.abs(amount);
        break;
      case 'capital_one':
        // Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
        date        = parseDate(cols[0]);
        description = (cols[3] || '').trim();
        amount      = cleanAmt(cols[5]); // Debit column
        if (isNaN(amount) || amount <= 0) return null;
        break;
      case 'discover':
        // Trans. Date, Post Date, Description, Amount, Category
        date        = parseDate(cols[0]);
        description = (cols[2] || '').trim();
        amount      = cleanAmt(cols[3]);
        if (isNaN(amount) || amount <= 0) return null; // positive = charge
        break;
      case 'amex':
        // Date, Description, Amount, Extended Details, ...
        date        = parseDate(cols[0]);
        description = (cols[1] || '').trim();
        amount      = cleanAmt(cols[2]);
        if (isNaN(amount) || amount <= 0) return null; // positive = charge
        break;
      default: {
        // Generic: find columns by header names
        const idx = (name) => headers.findIndex(h => h.includes(name));
        const dateIdx = idx('date');
        const descIdx = idx('desc') !== -1 ? idx('desc') : idx('payee') !== -1 ? idx('payee') : idx('merchant');
        const amtIdx  = idx('amount') !== -1 ? idx('amount') : idx('debit');
        if (dateIdx === -1 || amtIdx === -1) return null;
        date        = parseDate(cols[dateIdx]);
        description = descIdx !== -1 ? (cols[descIdx] || '').trim() : '';
        amount      = Math.abs(cleanAmt(cols[amtIdx]));
        if (isNaN(amount) || amount <= 0) return null;
        break;
      }
    }
    if (!date || !description || !(amount > 0)) return null;
    return { date, description, amount: Math.round(amount * 100) / 100 };
  } catch {
    return null;
  }
}

/* ── Merchant → Category keyword rules ─────────────────── */
const RULES = [
  { cat: 'housing',       kws: ['rent ', 'lease pay', 'apartment', 'hoa ', 'mortgage', 'landlord', 'property mgmt'] },
  { cat: 'savings',       kws: ['transfer savings', 'savings deposit', 'fidelity', 'vanguard', 'schwab', 'ameritrade', 'robinhood', 'acorns', 'betterment', 'wealthfront'] },
  { cat: 'transport',     kws: ['shell', 'exxon', 'chevron', 'mobil', 'citgo', 'valero', 'sunoco', 'speedway', 'racetrac', 'quiktrip', 'sheetz', 'wawa', 'kwik trip', 'pilot flying', 'loves travel', 'circle k', 'autozone', "o'reilly auto", 'advance auto', 'jiffy lube', 'carwash', 'car wash', 'firestone', 'goodyear', 'pep boys', 'mavis disc', 'ez pass', 'fastrak', 'parking', 'toll ', 'mta ', 'amtrak', 'greyhound', 'lyft'] },
  { cat: 'groceries',     kws: ['walmart', 'wal-mart', 'target', 'kroger', 'publix', 'safeway', 'whole foods', 'trader joe', 'aldi', 'costco', "sam's club", 'sams club', 'food lion', 'wegmans', 'h-e-b', 'heb ', 'meijer', 'stop & shop', 'giant food', 'winn-dixie', 'winn dixie', 'sprouts', 'fresh market', 'market basket', 'harris teeter', 'winco', 'grocery outlet', 'grocery', 'supermarket'] },
  { cat: 'utilities',     kws: ['comcast', 'xfinity', 'spectrum', 'cox comm', 'optimum', 'fios', 'at&t', 't-mobile', 'tmobile', 'sprint', 'cricket wireless', 'metro pcs', 'pg&e', 'pge ', 'con ed', 'duke energy', 'dominion energy', 'georgia power', 'electric', 'natural gas', 'nicor gas', 'atmos energy', 'waste management', 'republic services', 'sewage', 'water auth'] },
  { cat: 'dining',        kws: ['mcdonald', 'starbucks', 'chick-fil', 'chipotle', 'subway', 'taco bell', 'pizza hut', 'domino', 'burger king', "wendy's", 'wendys', 'panera', 'dunkin', 'popeyes', 'kfc ', 'sonic drive', 'jack in the box', 'del taco', 'whataburger', 'five guys', 'shake shack', 'in-n-out', 'culvers', 'wingstop', 'jersey mike', 'firehouse sub', 'jimmy john', 'grubhub', 'doordash', 'door dash', 'seamless', 'restaurant', 'diner', 'bistro', 'pizzeria', 'sushi', 'olive garden', 'red lobster', 'applebees', 'ihop', 'dennys', 'waffle house', 'cracker barrel', 'cheesecake factory', 'outback', 'chilis', 'texas roadhouse', 'red robin', 'buffalo wild'] },
  { cat: 'healthcare',    kws: ['cvs', 'walgreens', 'rite aid', 'pharmacy', 'hospital', 'urgent care', 'clinic', 'dentist', 'dental', 'optometrist', 'lenscrafters', 'visionworks', 'blue cross', 'aetna', 'cigna', 'humana', 'united health', 'kaiser', 'labcorp', 'quest diag'] },
  { cat: 'entertainment', kws: ['netflix', 'hulu', 'disney', 'hbo max', 'peacock', 'spotify', 'apple music', 'pandora', 'youtube premium', 'amazon prime', 'amc theater', 'regal cinema', 'cinemark', 'movie', 'ticketmaster', 'stubhub', 'steam', 'playstation', 'xbox', 'nintendo', 'gamestop', 'planet fitness', 'anytime fitness', 'la fitness', 'ymca', 'equinox', 'crunch fitness', 'bowling', 'museum', 'zoo', 'aquarium', 'six flags'] },
  { cat: 'clothing',      kws: ['h&m ', 'zara ', 'old navy', 'forever 21', 'nordstrom', "macy's", 'macys ', 'tj maxx', 'marshalls', 'ross stores', 'burlington', 'lululemon', "victoria's secret", 'american eagle', 'hollister', 'abercrombie', 'clothing store', 'apparel', 'foot locker', 'dsw shoe'] },
];

export function autoCategorize(description) {
  const desc = description.toLowerCase();
  // Ambiguous brand: Uber Eats → dining, Uber → transport
  if (desc.includes('uber') && desc.includes('eat')) return 'dining';
  if (desc.includes('ubereats'))                      return 'dining';
  if (desc.includes('uber'))                          return 'transport';
  // Verizon could be wireless (utilities) or Fios (utilities) — both same category, fine
  for (const rule of RULES) {
    for (const kw of rule.kws) {
      if (desc.includes(kw)) return rule.cat;
    }
  }
  return 'other';
}

export function makeHash(tx) {
  return `${tx.date}|${Number(tx.amount).toFixed(2)}|${(tx.description ?? '').toLowerCase().trim().slice(0, 40)}`;
}

export const BANK_NAMES = {
  chase:       'Chase',
  bofa:        'Bank of America',
  capital_one: 'Capital One',
  discover:    'Discover',
  amex:        'American Express',
  generic:     'Generic CSV',
};

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { bank: null, transactions: [], error: 'empty' };

  // Find the header row — first line that has "date" and a financial column keyword
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('date') &&
       (lower.includes('amount') || lower.includes('debit') || lower.includes('credit') ||
        lower.includes('payee') || lower.includes('description'))) {
      headerIdx = i;
      break;
    }
  }

  const headerLine = lines[headerIdx];
  const headers    = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  const bank       = detectBank(headerLine);

  const transactions = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^(total|subtotal|opening balance|closing balance|beginning balance)/i.test(line)) continue;
    const cols = parseCSVLine(line);
    const tx   = parseRow(cols, bank, headers);
    if (tx) transactions.push({ ...tx, categoryId: autoCategorize(tx.description) });
  }

  return { bank, transactions };
}
