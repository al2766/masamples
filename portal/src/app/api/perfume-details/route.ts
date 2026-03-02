import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Upgrade-Insecure-Requests': '1',
};

function isValidPage(html: string): boolean {
  return (
    !html.includes('Just a moment') &&
    !html.includes('cf-browser-verification') &&
    !html.includes('Enable JavaScript and cookies to continue') &&
    html.length >= 2000
  );
}

async function scrapeUrl(url: string): Promise<string | null> {
  // Strategy 1: direct request with browser-like headers
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      if (isValidPage(html)) return html;
    }
  } catch { /* try next */ }

  // Strategy 2: allorigins.win proxy
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const html = await res.text();
      if (isValidPage(html)) return html;
    }
  } catch { /* try next */ }

  // Strategy 3: corsproxy.io
  try {
    const res = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const html = await res.text();
      if (isValidPage(html)) return html;
    }
  } catch { /* give up */ }

  return null;
}

// Strip HTML tags and collapse whitespace
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract note names from <span class="pyramid-note-label ...">name</span>
function extractPyramidLabels(chunk: string): string[] {
  const out: string[] = [];
  const re = /<span[^>]+class="pyramid-note-label[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const v = m[1].trim();
    if (v) out.push(v);
  }
  return out;
}

// Primary: extract notes from <pyramid-level-new notes="top|middle|base"> sections
function extractPyramidNotes(html: string): { top: string[]; middle: string[]; base: string[] } | null {
  const topM    = html.match(/<pyramid-level-new[^>]+notes="top"[^>]*>([\s\S]*?)<\/pyramid-level-new>/i);
  const middleM = html.match(/<pyramid-level-new[^>]+notes="middle"[^>]*>([\s\S]*?)<\/pyramid-level-new>/i);
  const baseM   = html.match(/<pyramid-level-new[^>]+notes="base"[^>]*>([\s\S]*?)<\/pyramid-level-new>/i);

  if (!topM && !middleM && !baseM) return null;

  return {
    top:    topM    ? extractPyramidLabels(topM[1])    : [],
    middle: middleM ? extractPyramidLabels(middleM[1]) : [],
    base:   baseM   ? extractPyramidLabels(baseM[1])   : [],
  };
}

// Fallback: parse notes from the factual description sentence.
// e.g. "Top notes are Bergamot and Pepper; middle notes are Lavender; base notes are Cedar."
function parseNotesFromText(text: string): { top: string[]; middle: string[]; base: string[] } | null {
  const split = (raw: string) =>
    raw.split(/,| and /).map((s) => s.replace(/;.*$/, '').trim()).filter(Boolean);

  const topM    = text.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.]+)/i);
  const middleM = text.match(/(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.]+)/i);
  const baseM   = text.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.]+)/i);

  if (!topM && !middleM && !baseM) return null;
  return {
    top:    topM    ? split(topM[1])    : [],
    middle: middleM ? split(middleM[1]) : [],
    base:   baseM   ? split(baseM[1])   : [],
  };
}

// Extract accord names from <span class="truncate">word</span> inside the accords section
function extractAccords(html: string): string[] {
  const accordM = html.match(/main\s+accords([\s\S]*?)(?:Search by accords|<\/section>|accordBox)/i);
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

interface PerfumeDetails {
  name?: string;
  brand?: string;
  description?: string;
  image?: string;
  notes?: { top: string[]; middle: string[]; base: string[] };
  scentProfiles?: string[];
}

function parseDetails(html: string): PerfumeDetails {
  const d: PerfumeDetails = {};

  // ── Name & brand from JSON-LD ─────────────────────────────────────────────
  const ldRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let ldM;
  while ((ldM = ldRe.exec(html)) !== null) {
    try {
      const obj = JSON.parse(ldM[1]);
      if (obj['@type'] === 'Product') {
        d.name = obj.name?.trim();
        d.brand = typeof obj.brand === 'string'
          ? obj.brand.trim()
          : obj.brand?.name?.trim();
        break;
      }
    } catch { /* malformed JSON-LD */ }
  }

  // ── Fallback name & brand from <title> ────────────────────────────────────
  if (!d.name) {
    const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleM) {
      const parts = titleM[1].split(' by ');
      if (parts.length >= 2) {
        d.name = parts[0].trim();
        d.brand = parts[1].split(' - ')[0].trim();
      }
    }
  }

  // ── Description from itemprop="description" (first <p>, stripped) ─────────
  const descDivM = html.match(/itemprop="description"[^>]*>([\s\S]*?)<\/div>/i);
  if (descDivM) {
    const firstP = descDivM[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (firstP) {
      d.description = stripTags(firstP[1]).substring(0, 500) || undefined;
    }
  }
  // Fallback to og:description if itemprop extraction failed
  if (!d.description) {
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
      ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
    if (ogDesc) d.description = ogDesc[1].trim();
  }

  // ── Main product image: prefer itemprop="image", fall back to og:image ────
  const itemImg = html.match(/<img[^>]+itemprop="image"[^>]+src="([^"]+)"/i)
    ?? html.match(/<img[^>]+src="([^"]+)"[^>]+itemprop="image"/i);
  if (itemImg) {
    d.image = itemImg[1];
  } else {
    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImg) d.image = ogImg[1];
  }

  // ── Main accords (scent profiles) ─────────────────────────────────────────
  const accords = extractAccords(html);
  if (accords.length) d.scentProfiles = accords;

  // ── Notes: Stage 1 — pyramid-level-new sections (most accurate) ──────────
  const pyramidNotes = extractPyramidNotes(html);
  if (pyramidNotes && (pyramidNotes.top.length || pyramidNotes.middle.length || pyramidNotes.base.length)) {
    d.notes = pyramidNotes;
    return d;
  }

  // ── Notes: Stage 2 — parse from description text ─────────────────────────
  if (d.description) {
    const fromDesc = parseNotesFromText(d.description);
    if (fromDesc) {
      d.notes = fromDesc;
      return d;
    }
  }

  // ── Notes: Stage 3 — search full HTML for the description paragraph ───────
  const descText = html.match(/itemprop="description"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (descText) {
    const plain = stripTags(descText[1]);
    const fromFullDesc = parseNotesFromText(plain);
    if (fromFullDesc) d.notes = fromFullDesc;
  }

  return d;
}

// GET /api/perfume-details?url=/perfume/Dior/Sauvage-31861.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('url');

  if (!path || !path.startsWith('/perfume/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const html = await scrapeUrl(`https://www.fragrantica.com${path}`);
  if (!html) {
    return NextResponse.json({ error: 'Could not fetch perfume page' }, { status: 502 });
  }

  const details = parseDetails(html);
  return NextResponse.json(details);
}
