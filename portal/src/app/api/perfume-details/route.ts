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

// Parse notes from the og:description text.
// Example: "Top note is Lavender; middle notes are Iris, Amber; base notes are Musk."
function parseNotesFromDescription(desc: string): { top: string[]; middle: string[]; base: string[] } | null {
  const split = (raw: string) =>
    raw.split(/,|;| and /).map((s) => s.trim()).filter(Boolean);

  const topM    = desc.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.]+)/i);
  const middleM = desc.match(/(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.]+)/i);
  const baseM   = desc.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.]+)/i);

  if (!topM && !middleM && !baseM) return null;
  return {
    top:    topM    ? split(topM[1])    : [],
    middle: middleM ? split(middleM[1]) : [],
    base:   baseM   ? split(baseM[1])   : [],
  };
}

// Extract accord names from <span class="truncate">word</span> inside the accords section
function extractAccords(html: string): string[] {
  // Find the main accords section — it contains a flex-col div with the bars
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
      // Title is usually "Name by Brand - Fragrantica"
      const parts = titleM[1].split(' by ');
      if (parts.length >= 2) {
        d.name = parts[0].trim();
        d.brand = parts[1].split(' - ')[0].trim();
      }
    }
  }

  // ── Description from og:description (concise, pre-formatted) ─────────────
  const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
    ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
  if (ogDesc) d.description = ogDesc[1].trim();

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

  // ── Notes: Stage 1 — parse from og:description text ──────────────────────
  if (d.description) {
    const fromDesc = parseNotesFromDescription(d.description);
    if (fromDesc) {
      d.notes = fromDesc;
      return d;
    }
  }

  // ── Notes: Stage 2 — HTML itemprop="ingredient" extraction ───────────────
  // Find the notes pyramid section then split by top/heart/base headers.
  const notesBoxM = html.match(/notesBoxContent([\s\S]*?)(?:accordBox|<\/section>|$)/i);
  const notesBlock = notesBoxM?.[1] ?? html;

  const topIdx    = notesBlock.search(/top\s+notes?/i);
  const heartIdx  = notesBlock.search(/(?:heart|middle)\s+notes?/i);
  const baseIdx   = notesBlock.search(/base\s+notes?/i);

  if (topIdx !== -1 && heartIdx !== -1 && baseIdx !== -1) {
    d.notes = {
      top:    extractIngredients(notesBlock.slice(topIdx, heartIdx)),
      middle: extractIngredients(notesBlock.slice(heartIdx, baseIdx)),
      base:   extractIngredients(notesBlock.slice(baseIdx)),
    };
  } else {
    // Flat fallback: divide all ingredients roughly into thirds
    const all = extractIngredients(notesBlock);
    const t = Math.ceil(all.length / 3);
    d.notes = {
      top:    all.slice(0, t),
      middle: all.slice(t, t * 2),
      base:   all.slice(t * 2),
    };
  }

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
