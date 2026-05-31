/* ──────────────────────────────────────────────────────────────
   PDF Bank Statement Parser
   Extracts transactions from Chase, BofA, Capital One, Discover,
   and Amex PDF statements using PDF.js for text extraction.
   ────────────────────────────────────────────────────────────── */

import { autoCategorize } from './csvParser';

/* ── Lazy-load PDF.js so it only adds to the bundle when needed ── */
async function loadPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      process.env.PUBLIC_URL + '/pdf.worker.min.js';
  }
  return pdfjsLib;
}

/* ── Text extraction ──────────────────────────────────────────── */
async function extractLines(arrayBuffer) {
  const pdfjsLib = await loadPdfjsLib();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page    = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group items by approximate y position (within 3pt = same line)
    const lineMap = new Map();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = item.transform[4];
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ text: item.str, x });
    }

    // Sort top-to-bottom (PDF y increases upward, so sort descending)
    const sorted = [...lineMap.entries()]
      .sort(([ya], [yb]) => yb - ya)
      .map(([, items]) =>
        items.sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim()
      )
      .filter(Boolean);

    allLines.push(...sorted);
  }

  return allLines;
}

/* ── Bank detection from PDF text ────────────────────────────── */
function detectBankFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('jpmorgan') || lower.includes('chase bank') ||
      lower.includes('chase credit') || (lower.includes('chase') && lower.includes('checking')))
    return 'chase';
  if (lower.includes('bank of america') || lower.includes('bankofamerica.com'))
    return 'bofa';
  if (lower.includes('capital one') || lower.includes('capitalone.com'))
    return 'capital_one';
  if (lower.includes('discover bank') || lower.includes('discovercard.com') ||
      lower.includes('discover financial'))
    return 'discover';
  if (lower.includes('american express') || lower.includes('americanexpress.com') ||
      lower.includes('amex'))
    return 'amex';
  return 'generic';
}

/* ── Date helpers ────────────────────────────────────────────── */
function parsePdfDate(s, fallbackYear) {
  if (!s) return null;
  s = s.trim();
  // MM/DD/YYYY or M/D/YYYY
  const mdy4 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy4) return `${mdy4[3]}-${mdy4[1].padStart(2,'0')}-${mdy4[2].padStart(2,'0')}`;
  // MM/DD/YY or M/D/YY
  const mdy2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdy2) return `20${mdy2[3]}-${mdy2[1].padStart(2,'0')}-${mdy2[2].padStart(2,'0')}`;
  // MM/DD (no year) — use fallback year
  const md = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) return `${fallbackYear}-${md[1].padStart(2,'0')}-${md[2].padStart(2,'0')}`;
  // MM-DD-YYYY
  const mdy4d = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy4d) return `${mdy4d[3]}-${mdy4d[1].padStart(2,'0')}-${mdy4d[2].padStart(2,'0')}`;
  return null;
}

function extractYear(lines) {
  for (const line of lines) {
    const m = line.match(/\b(202[3-9]|20[3-9]\d)\b/);
    if (m) return m[1];
  }
  return String(new Date().getFullYear());
}

/* ── Amount helpers ──────────────────────────────────────────── */
function cleanPdfAmt(s) {
  // Handle minus signs including unicode minus and trailing +/-
  return parseFloat(
    s.replace(/[$,\s]/g, '')
     .replace(/[−–—]/g, '-')
     .replace(/[-+]$/, '')
  );
}

// Returns true if the transaction looks like a payment/credit (not an expense)
function isPaymentLine(desc) {
  return /\b(payment|credit|deposit|autopay|thank you|rewards|cashback|cash back|transfer to|refund|reversal)\b/i.test(desc);
}

/* ── Mode 1: Single-line transactions ────────────────────────── */
// Pattern: DATE [DATE] DESCRIPTION AMOUNT
// Works for: BofA, Capital One, Discover, Amex
function parseSingleLine(lines, year) {
  const DATE_PAT = String.raw`\d{1,2}\/\d{1,2}(?:\/\d{2,4})?`;
  // Amount: optional $, optional leading -, digits+commas, dot, 2 digits, optional trailing sign
  const AMT_PAT  = String.raw`-?\$?[\d,]+\.\d{2}[-+]?`;
  const RE = new RegExp(
    `^(${DATE_PAT})\\s+(?:${DATE_PAT}\\s+)?(.+?)\\s+(${AMT_PAT})$`
  );

  const transactions = [];
  for (const line of lines) {
    const m = line.match(RE);
    if (!m) continue;
    const date = parsePdfDate(m[1], year);
    if (!date) continue;
    const desc   = m[2].trim();
    const amount = Math.abs(cleanPdfAmt(m[3]));
    if (isNaN(amount) || amount <= 0) continue;
    if (isPaymentLine(desc)) continue;
    transactions.push({
      date, description: desc,
      amount: Math.round(amount * 100) / 100,
      categoryId: autoCategorize(desc),
    });
  }
  return transactions;
}

/* ── Mode 2: Multi-line transactions (Chase-style) ───────────── */
// Pattern: DATE on its own line, then description lines, then AMOUNT on its own line
function parseMultiLine(lines, year) {
  const DATE_ONLY_RE = /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)$/;
  const AMT_ONLY_RE  = /^-?\$?[\d,]+\.\d{2}[-+]?$/;
  // Lines to skip as description material
  const SKIP_RE      = /^(page\s*\d|continued|account|statement|address|zip|total|balance|apr|minimum|due date|interest|fee|reward)/i;

  const transactions = [];
  let state = 'idle';
  let currentDate = null;
  let descParts = [];

  function flushTx(amtStr) {
    if (!currentDate || !descParts.length) return;
    const desc   = descParts.join(' ').trim();
    const amount = Math.abs(cleanPdfAmt(amtStr));
    if (!isNaN(amount) && amount > 0 && !isPaymentLine(desc)) {
      transactions.push({
        date: currentDate, description: desc,
        amount: Math.round(amount * 100) / 100,
        categoryId: autoCategorize(desc),
      });
    }
  }

  for (const line of lines) {
    if (state === 'idle') {
      const dm = line.match(DATE_ONLY_RE);
      if (dm) {
        const d = parsePdfDate(dm[1], year);
        if (d) { state = 'collecting'; currentDate = d; descParts = []; }
      }
    } else { // collecting
      if (AMT_ONLY_RE.test(line)) {
        flushTx(line);
        state = 'idle';
        currentDate = null;
        descParts = [];
      } else if (DATE_ONLY_RE.test(line)) {
        // New date — flush current without amount (incomplete), start fresh
        const dm = line.match(DATE_ONLY_RE);
        const d  = parsePdfDate(dm[1], year);
        if (d) { currentDate = d; descParts = []; }
        else   { state = 'idle'; }
      } else if (!SKIP_RE.test(line) && line.length < 120) {
        descParts.push(line);
        // Too many description lines → likely not a transaction block
        if (descParts.length > 4) { state = 'idle'; descParts = []; currentDate = null; }
      } else {
        state = 'idle'; descParts = []; currentDate = null;
      }
    }
  }

  return transactions;
}

/* ── De-duplicate within parsed results ─────────────────────── */
function dedupeLocal(txs) {
  const seen = new Set();
  return txs.filter(tx => {
    const key = `${tx.date}|${tx.amount}|${tx.description.toLowerCase().slice(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Public API ─────────────────────────────────────────────── */
export async function parsePDF(arrayBuffer) {
  try {
    const lines    = await extractLines(arrayBuffer);
    const fullText = lines.join('\n');
    const bank     = detectBankFromText(fullText);
    const year     = extractYear(lines);

    // Try single-line first — works for most banks
    let transactions = parseSingleLine(lines, year);

    // If sparse, try multi-line mode (Chase-style date-per-line layout)
    if (transactions.length < 3) {
      const multi = parseMultiLine(lines, year);
      if (multi.length > transactions.length) transactions = multi;
    }

    transactions = dedupeLocal(transactions);

    if (!transactions.length) {
      return { bank, transactions: [], error: 'no_transactions' };
    }
    return { bank, transactions };
  } catch (err) {
    console.error('[pdfParser]', err);
    return { bank: null, transactions: [], error: 'parse_failed' };
  }
}
