import { NextRequest, NextResponse } from 'next/server';

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.includes('Just a moment') || html.includes('cf-browser-verification') || html.length < 2000) {
      return null;
    }
    return html;
  } catch {
    return null;
  }
}

// Strip HTML tags from a string
function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract all itemprop="ingredient" values from an HTML chunk
function extractIngredients(chunk: string): string[] {
  const out: string[] = [];
  const re = /itemprop="ingredient"[^>]*>\s*([^<]+?)\s*</g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
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
        const raw = obj.description ?? '';
        d.description = stripTags(raw).substring(0, 600) || undefined;
        break;
      }
    } catch { /* malformed JSON-LD */ }
  }

  // ── Fallback name & brand from <title> ────────────────────────────────────
  if (!d.name) {
    const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleM) {
      // Title is usually "Name by Brand - Fragrantica"
      const parts = titleM[1].split(' by ');
      if (parts.length >= 2) {
        d.name = parts[0].trim();
        d.brand = parts[1].split(' - ')[0].trim();
      }
    }
  }

  // ── Main product image ────────────────────────────────────────────────────
  // Fragrantica wraps the main image in a div#col2 or uses og:image
  const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  if (ogImg) d.image = ogImg[1];

  // ── Notes ─────────────────────────────────────────────────────────────────
  // Fragrantica renders notes in a pyramid section. We find the notes box
  // then split it into three sections (top / heart / base) by their headers.
  const notesBoxM = html.match(/notesBoxContent([\s\S]*?)(?:id="[^"]+"|<\/section>|accordBox|$)/i);
  const notesBlock = notesBoxM?.[1] ?? html;

  // Split the block by the three category headers
  // Fragrantica uses labels like "Top Notes", "Heart Notes", "Base Notes"
  const topIdx    = notesBlock.search(/top\s+notes?/i);
  const heartIdx  = notesBlock.search(/(?:heart|middle)\s+notes?/i);
  const baseIdx   = notesBlock.search(/base\s+notes?/i);

  let topChunk = '', middleChunk = '', baseChunk = '';

  if (topIdx !== -1 && heartIdx !== -1 && baseIdx !== -1) {
    topChunk    = notesBlock.slice(topIdx, heartIdx);
    middleChunk = notesBlock.slice(heartIdx, baseIdx);
    baseChunk   = notesBlock.slice(baseIdx);
  } else {
    // Flat fallback: divide all ingredients roughly into thirds
    const all = extractIngredients(notesBlock);
    const t = Math.ceil(all.length / 3);
    d.notes = {
      top:    all.slice(0, t),
      middle: all.slice(t, t * 2),
      base:   all.slice(t * 2),
    };
    return d;
  }

  d.notes = {
    top:    extractIngredients(topChunk),
    middle: extractIngredients(middleChunk),
    base:   extractIngredients(baseChunk),
  };

  return d;
}

// GET /api/perfume-details?url=/perfume/Dior/Sauvage-72187.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('url'); // relative Fragrantica path

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
