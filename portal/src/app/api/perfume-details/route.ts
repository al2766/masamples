import { NextRequest, NextResponse } from 'next/server';
import { parse as parseHtml5 } from 'node-html-parser';

export const maxDuration = 30;

// ── HTML fetch strategies ─────────────────────────────────────────────────────

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Upgrade-Insecure-Requests': '1',
};

function isValidHtml(html: string): boolean {
  return (
    !html.includes('Just a moment') &&
    !html.includes('cf-browser-verification') &&
    !html.includes('Enable JavaScript and cookies to continue') &&
    !html.includes('_cf_chl') &&
    html.length >= 3000
  );
}

async function fetchDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const html = await res.text();
    return isValidHtml(html) ? html : null;
  } catch { return null; }
}

async function fetchAllOrigins(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const html = await res.text();
    return isValidHtml(html) ? html : null;
  } catch { return null; }
}

async function fetchCorsproxy(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const html = await res.text();
    return isValidHtml(html) ? html : null;
  } catch { return null; }
}

/** Try all HTML proxies in parallel — returns first successful HTML */
async function scrapeHtml(url: string): Promise<string | null> {
  const wrap = (p: Promise<string | null>): Promise<string> =>
    p.then((v) => { if (!v) throw new Error(); return v; });
  try {
    return await Promise.any([
      wrap(fetchDirect(url)),
      wrap(fetchAllOrigins(url)),
      wrap(fetchCorsproxy(url)),
    ]);
  } catch {
    return null;
  }
}

/**
 * Jina.ai Reader — runs a real headless browser, bypasses Cloudflare JS challenges.
 * Returns the page as plain text (markdown). Free, no API key required.
 */
async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(18000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Jina returns a short error text if it can't fetch
    return text.length > 500 ? text : null;
  } catch { return null; }
}

// ── HTML parsers ──────────────────────────────────────────────────────────────

/** Extract accord names from the main accords section (regex — no reliable DOM selector) */
function extractAccords(html: string): string[] {
  const accordM = html.match(
    /main\s+accords([\s\S]*?)(?:Search by accords|<\/section>|accordBox)/i
  );
  const block = accordM?.[1] ?? '';
  const out: string[] = [];
  const re = /<span\s+class="truncate">([^<]+)<\/span>/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const v = m[1].trim();
    if (v) out.push(v);
  }
  return out;
}

// ── Text parsers (for Jina output) ───────────────────────────────────────────

/**
 * Parse notes from "Top notes are X and Y; middle notes are A; base notes are B" text.
 * This sentence reliably appears in Fragrantica's first description paragraph.
 */
function parseNotesFromText(
  text: string
): { top: string[]; middle: string[]; base: string[] } | null {
  const split = (raw: string) =>
    raw
      .split(/,| and /)
      .map((s) => s.replace(/;.*$/, '').trim())
      .filter(Boolean);

  const topM = text.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.]+)/i);
  const midM = text.match(
    /(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.]+)/i
  );
  const baseM = text.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.]+)/i);

  if (!topM && !midM && !baseM) return null;
  return {
    top: topM ? split(topM[1]) : [],
    middle: midM ? split(midM[1]) : [],
    base: baseM ? split(baseM[1]) : [],
  };
}

/**
 * Parse structured note sections from Jina text output.
 * Looks for "Top Notes\n\nBergamot\nLavender\n\nMiddle Notes\n..." format.
 */
function parseJinaNoteSections(
  text: string
): { top: string[]; middle: string[]; base: string[] } | null {
  function extractSection(header: RegExp): string[] {
    const m = text.match(
      new RegExp(
        header.source + '([\\s\\S]*?)(?=Top Notes?|Middle Notes?|Heart Notes?|Base Notes?|\\Z)',
        'i'
      )
    );
    if (!m) return [];
    return m[1]
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(
        (l) =>
          l.length > 1 &&
          l.length < 50 &&
          /^[A-Z]/.test(l) &&
          !/notes?/i.test(l)
      );
  }

  const top = extractSection(/Top Notes?\s*/i);
  const middle =
    extractSection(/Middle Notes?\s*/i).length
      ? extractSection(/Middle Notes?\s*/i)
      : extractSection(/Heart Notes?\s*/i);
  const base = extractSection(/Base Notes?\s*/i);

  if (!top.length && !middle.length && !base.length) return null;
  return { top, middle, base };
}

interface PerfumeDetails {
  name?: string;
  brand?: string;
  description?: string;
  image?: string;
  notes?: { top: string[]; middle: string[]; base: string[] };
  scentProfiles?: string[];
}

// ── Full HTML parser (DOM-based) ──────────────────────────────────────────────

function parseHtml(html: string): PerfumeDetails {
  const root = parseHtml5(html);
  const d: PerfumeDetails = {};

  // Name & brand from JSON-LD
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const obj = JSON.parse(s.rawText);
      if (obj['@type'] === 'Product') {
        d.name = obj.name?.trim();
        d.brand = typeof obj.brand === 'string' ? obj.brand.trim() : obj.brand?.name?.trim();
        break;
      }
    } catch { /* malformed */ }
  }

  // Fallback: <title>
  if (!d.name) {
    const titleText = root.querySelector('title')?.text;
    if (titleText) {
      const parts = titleText.split(' by ');
      if (parts.length >= 2) {
        d.name = parts[0].trim();
        d.brand = parts[1].split(' - ')[0].trim();
      }
    }
  }

  // Description: #perfume-description-content p:first-child
  const descP = root.querySelector('#perfume-description-content p');
  if (descP) {
    d.description = descP.text.trim().substring(0, 600) || undefined;
  }

  // Fallback: og:description
  if (!d.description) {
    d.description = root.querySelector('meta[property="og:description"]')
      ?.getAttribute('content')?.trim();
  }

  // Image: itemprop="image" then og:image
  const itemImg = root.querySelector('img[itemprop="image"]');
  if (itemImg) {
    d.image = itemImg.getAttribute('src');
  } else {
    d.image = root.querySelector('meta[property="og:image"]')?.getAttribute('content');
  }

  // Scent profiles / accords (regex — no reliable DOM selector known)
  const accords = extractAccords(html);
  if (accords.length) d.scentProfiles = accords;

  // Notes: <pyramid-level-new notes="top/middle/base"> .pyramid-note-label
  function notesForTier(tier: string): string[] {
    const level = root.querySelector(`pyramid-level-new[notes="${tier}"]`);
    if (!level) return [];
    return level.querySelectorAll('.pyramid-note-label')
      .map(el => el.text.trim())
      .filter(Boolean);
  }

  const top = notesForTier('top');
  const middle = notesForTier('middle');
  const base = notesForTier('base');

  if (top.length || middle.length || base.length) {
    d.notes = { top, middle, base };
    return d;
  }

  // Fallback: parse notes from description text
  if (d.description) {
    const fromDesc = parseNotesFromText(d.description);
    if (fromDesc) { d.notes = fromDesc; return d; }
  }

  // Fallback: parse notes from full-text search in raw HTML
  const fromFull = parseNotesFromText(root.querySelector('[itemprop="description"] p')?.text ?? '');
  if (fromFull) d.notes = fromFull;

  return d;
}

// ── Jina text parser ──────────────────────────────────────────────────────────

function parseJinaText(text: string): PerfumeDetails {
  const d: PerfumeDetails = {};

  // Description: find the factual paragraph that names the fragrance family + notes
  // Pattern: "X is a [family] fragrance for [gender]...base notes are Y."
  const fullDescM = text.match(
    /[A-Z]\w[^\n]*?is (?:a|an) [^\n]+fragrance[\s\S]*?base notes? (?:are|is) [^.]+\./i
  );
  if (fullDescM) {
    d.description = fullDescM[0].replace(/\s+/g, ' ').trim().substring(0, 600);
  } else {
    // Simpler: just the "is a X fragrance" sentence
    const simpleM = text.match(/[A-Z]\w[^\n]*?is (?:a|an) [^\n]+fragrance[^.]*\./i);
    if (simpleM) d.description = simpleM[0].trim().substring(0, 400);
  }

  // Notes from "Top notes are...middle notes are...base notes are..." in description
  const fromDesc = d.description ? parseNotesFromText(d.description) : null;
  if (fromDesc && (fromDesc.top.length || fromDesc.middle.length || fromDesc.base.length)) {
    d.notes = fromDesc;
    return d;
  }

  // Notes from full text (same pattern but wider search)
  const fromFull = parseNotesFromText(text);
  if (fromFull && (fromFull.top.length || fromFull.middle.length || fromFull.base.length)) {
    d.notes = fromFull;
    return d;
  }

  // Notes from structured Jina sections (Top Notes\nBergamot\n...)
  const fromSections = parseJinaNoteSections(text);
  if (fromSections) d.notes = fromSections;

  return d;
}

// ── Route handler ─────────────────────────────────────────────────────────────

// GET /api/perfume-details?url=/perfume/Dior/Sauvage-31861.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('url');

  if (!path || !path.startsWith('/perfume/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const targetUrl = `https://www.fragrantica.com${path}`;

  // Try HTML proxies first (all run in parallel — fastest wins).
  // If Cloudflare blocks all of them, fall back to Jina.ai which runs
  // a real headless browser and can pass the JS challenge.
  const html = await scrapeHtml(targetUrl);
  if (html) {
    return NextResponse.json(parseHtml(html));
  }

  // HTML scraping failed → try Jina.ai reader
  const jinaText = await fetchViaJina(targetUrl);
  if (jinaText) {
    return NextResponse.json(parseJinaText(jinaText));
  }

  return NextResponse.json({ error: 'Could not fetch perfume page' }, { status: 502 });
}
